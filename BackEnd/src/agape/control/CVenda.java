package agape.control;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.LocalDateTime;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import agape.dao.*;
import agape.model.*;
import agape.util.ResponseObject;

public class CVenda implements HttpHandler {

    private static CVenda instancia;

    private CVenda() {}

    public static CVenda getInstancia() {
        if (instancia == null) instancia = new CVenda();
        return instancia;
    }

    // ── Roteamento ────────────────────────────────────────────────────────────

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        String path   = exchange.getRequestURI().getPath();
        String query  = exchange.getRequestURI().getQuery();

        if (method.equalsIgnoreCase("OPTIONS")) {
            enviarResposta(exchange, new ResponseObject());
            return;
        }

        try {
            Connection conn          = ConexaoBD.getInstance().getConexao();
            String body              = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            String requesterEmail    = (String) exchange.getAttribute("usuarioEmail");

            ResponseObject response = switch (method.toUpperCase()) {
                case "GET"  -> handleGet(conn, path, query);
                case "POST" -> handlePost(conn, path, body, requesterEmail);
                default     -> naoEncontrado();
            };

            enviarResposta(exchange, response);

        } catch (Exception e) {
            ResponseObject erro = new ResponseObject();
            erro.setStatus(ResponseObject.STATUS_FAIL);
            erro.setCode(ResponseObject.CODE_ERROR);
            erro.addMessage("Erro inesperado: " + e.getMessage());
            enviarResposta(exchange, erro);
        }
    }

    private ResponseObject handleGet(Connection conn, String path, String query) {
        if (path.equals("/paroquiano")) {
            return buscarParoquiano(conn, param(query, "cpf"));
        }
        if (path.equals("/venda")) {
            return listar(conn, param(query, "dataInicio"), param(query, "dataFim"));
        }
        return naoEncontrado();
    }

    public ResponseObject listar(Connection conn, String dataInicio, String dataFim) {
        ResponseObject response = new ResponseObject();
        try {
            var lista = new Venda().listar(conn,
                dataInicio.isEmpty() ? null : dataInicio,
                dataFim.isEmpty()    ? null : dataFim);
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.setResult(lista);
        } catch (Exception e) {
            erroInterno(response);
        }
        return response;
    }

    private ResponseObject handlePost(Connection conn, String path, String body, String requesterEmail) {
        if (path.equals("/venda")) {
            return efetuarVenda(conn, body, requesterEmail);
        }
        return naoEncontrado();
    }

    // ── Casos de uso ─────────────────────────────────────────────────────────

    /**
     * Passo 2.1.1 — Busca paroquiano por CPF (apenas dígitos).
     * Fluxo alternativo: retorna 404 se não encontrado ou 403 se inativo.
     */
    public ResponseObject buscarParoquiano(Connection conn, String cpf) {
        ResponseObject response = new ResponseObject();
        try {
            if (vazio(cpf))
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "CPF é obrigatório.");

            String digits = cpf.replaceAll("\\D", "");
            Paroquiano p  = new Paroquiano().buscarPorCpf(conn, digits);

            if (p == null)
                return falha(response, ResponseObject.CODE_NOT_FOUND,
                        "Paroquiano não encontrado. Verifique o CPF ou realize o cadastro.");

            if (p.getStatus() == 0)
                return falha(response, ResponseObject.CODE_FORBIDDEN, "Paroquiano inativo.");

            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.setResult(p);

        } catch (Exception e) {
            erroInterno(response);
        }
        return response;
    }

    /**
     * Passos 19-21.1 — Registra a venda com transação:
     * Venda → ItemVenda[] → decrementar estoque → atualizar crédito → Caixa → MovimentacaoCaixa[].
     */
    public ResponseObject efetuarVenda(Connection conn, String body, String requesterEmail) {
        ResponseObject response = new ResponseObject();
        try {
            conn.setAutoCommit(false);

            // ── 1. Colaborador ────────────────────────────────────────────────
            Usuario colab = new Usuario().buscarPorEmail(conn, requesterEmail);
            if (colab == null) {
                conn.rollback();
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Colaborador não encontrado.");
            }

            // ── 2. Parâmetros da venda ────────────────────────────────────────
            int   idParoquiano  = parseSafeInt(param(body, "idParoquiano"));
            float totBruto      = parseSafeFloat(param(body, "totBruto"));
            float credUtilizado = parseSafeFloat(param(body, "credUtilizado"));
            float valorFinal    = parseSafeFloat(param(body, "valorFinal"));

            String[] idsProdStr  = param(body, "idsProdutos").split(",");
            String[] qtdsStr     = param(body, "quantidades").split(",");
            String[] vlrsUniStr  = param(body, "valoresUnitarios").split(",");
            String[] idFormasStr = param(body, "idFormasPag").split(",");
            String[] vlrsPagStr  = param(body, "valoresPag").split(",");

            if (idsProdStr.length == 0 || idsProdStr[0].isBlank()) {
                conn.rollback();
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "Nenhum produto informado.");
            }

            // ── 3. Paroquiano ─────────────────────────────────────────────────
            Paroquiano par = new Paroquiano().buscarPorId(conn, idParoquiano);
            if (par == null) {
                conn.rollback();
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Paroquiano não encontrado.");
            }

            // ── 4. Valida estoque e monta itens ───────────────────────────────
            int     n         = idsProdStr.length;
            Produto[] produtos = new Produto[n];
            int[]   quantidades = new int[n];
            float[] vlrsUni    = new float[n];

            for (int i = 0; i < n; i++) {
                int   idProd = parseSafeInt(idsProdStr[i].trim());
                int   qtd    = parseSafeInt(qtdsStr[i].trim());
                float vlrUni = parseSafeFloat(vlrsUniStr[i].trim());

                Produto p = new Produto().buscarPorId(conn, idProd);
                if (p == null) {
                    conn.rollback();
                    return falha(response, ResponseObject.CODE_NOT_FOUND,
                            "Produto ID " + idProd + " não encontrado.");
                }
                // Passo 4 — verifEstoque
                if (p.getQtdeAtual() < qtd) {
                    conn.rollback();
                    return falha(response, ResponseObject.CODE_BAD_REQUEST,
                            "Estoque insuficiente para: " + p.getNome() +
                            " (disponível: " + p.getQtdeAtual() + ").");
                }
                produtos[i]    = p;
                quantidades[i] = qtd;
                vlrsUni[i]     = vlrUni;
            }

            // ── 5-6. Define idFormaPag principal (primeiro da lista) ───────────
            int idFormaPagPrincipal = idFormasStr.length > 0
                    ? parseSafeInt(idFormasStr[0].trim()) : 0;

            // ── 19. Insere Venda ──────────────────────────────────────────────
            Venda venda = new Venda();
            venda.setIdColaborador(colab.getIdUsuario());
            venda.setIdUsuario(idParoquiano);
            venda.setIdFormaPag(idFormaPagPrincipal);
            venda.setDataHora(LocalDateTime.now());
            venda.setTotBruto(totBruto);
            venda.setCredUtilizado(credUtilizado);
            venda.setValorFinal(valorFinal);
            int idVenda = venda.inserir(conn);
            venda.setIdVenda(idVenda);

            // ── Insere ItemVenda + passo 20 (atualizar estoque) ──────────────
            ItemVendaDAO itemDAO = new ItemVendaDAO();
            ProdutoDAO   prodDAO = new ProdutoDAO();

            for (int i = 0; i < n; i++) {
                ItemVenda item = new ItemVenda();
                item.setIdVenda(idVenda);
                item.setIdProd(produtos[i].getIdProd());
                item.setQuantidade(quantidades[i]);
                item.setValorUnitario(vlrsUni[i]);
                itemDAO.inserir(conn, item);

                prodDAO.decrementarEstoque(conn, produtos[i].getIdProd(), quantidades[i]);
            }

            // ── Atualiza crédito do paroquiano ────────────────────────────────
            if (credUtilizado > 0) {
                par.atualizarSaldoCredito(conn, par.getSaldoCredito() - credUtilizado);
            }

            // ── Passo 21 — Caixa e MovimentacaoCaixa ─────────────────────────
            CaixaDAO caixaDAO = new CaixaDAO();
            Caixa caixa = caixaDAO.buscarAberto(conn);

            if (caixa != null) {
                caixaDAO.adicionarAoValorFinal(conn, caixa.getIdCaixa(), valorFinal);

                MovimentacaoCaixaDAO movDAO = new MovimentacaoCaixaDAO();
                for (int i = 0; i < idFormasStr.length; i++) {
                    int   idForma = parseSafeInt(idFormasStr[i].trim());
                    float vlrPag  = parseSafeFloat(vlrsPagStr[i].trim());

                    MovimentacaoCaixa mov = new MovimentacaoCaixa();
                    mov.setIdCaixa(caixa.getIdCaixa());
                    mov.setIdUsuario(colab.getIdUsuario());
                    mov.setDataHora(LocalDateTime.now());
                    mov.setValor(vlrPag);
                    mov.setMotivo("Venda #" + idVenda + " | FormaPag: " + idForma);
                    movDAO.inserir(conn, mov);
                }
            }

            conn.commit();
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.addMessage("Venda realizada com sucesso!");
            response.setResult(venda);

        } catch (Exception e) {
            try { if (conn != null) conn.rollback(); } catch (SQLException ignored) {}
            response.setStatus(ResponseObject.STATUS_FAIL);
            response.setCode(ResponseObject.CODE_ERROR);
            response.addMessage("Erro ao processar venda: " + e.getMessage());
        } finally {
            try { if (conn != null) conn.setAutoCommit(true); } catch (SQLException ignored) {}
        }
        return response;
    }

    // ── Utilitários ───────────────────────────────────────────────────────────

    private void enviarResposta(HttpExchange exchange, ResponseObject response) throws IOException {
        String json  = response.toJson();
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type",                 "application/json; charset=UTF-8");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin",  "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        exchange.sendResponseHeaders(response.getCode(), bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }

    private String param(String source, String key) {
        if (source == null || source.isEmpty()) return "";
        for (String par : source.split("&")) {
            String[] kv = par.split("=", 2);
            if (kv[0].equals(key)) {
                try {
                    return URLDecoder.decode(kv.length > 1 ? kv[1] : "", StandardCharsets.UTF_8.toString());
                } catch (Exception e) { return ""; }
            }
        }
        return "";
    }

    private int parseSafeInt(String val) {
        try { return Integer.parseInt(val.trim()); } catch (Exception e) { return 0; }
    }

    private float parseSafeFloat(String val) {
        try { return Float.parseFloat(val.trim().replace(",", ".")); } catch (Exception e) { return 0f; }
    }

    private boolean vazio(String s) {
        return s == null || s.trim().isEmpty();
    }

    private ResponseObject falha(ResponseObject r, int code, String msg) {
        r.setStatus(ResponseObject.STATUS_FAIL);
        r.setCode(code);
        r.addMessage(msg);
        return r;
    }

    private void erroInterno(ResponseObject r) {
        r.setStatus(ResponseObject.STATUS_FAIL);
        r.setCode(ResponseObject.CODE_ERROR);
        r.addMessage("Erro interno do servidor.");
    }

    private ResponseObject naoEncontrado() {
        ResponseObject r = new ResponseObject();
        r.setStatus(ResponseObject.STATUS_FAIL);
        r.setCode(ResponseObject.CODE_NOT_FOUND);
        r.addMessage("Endpoint não encontrado.");
        return r;
    }
}
