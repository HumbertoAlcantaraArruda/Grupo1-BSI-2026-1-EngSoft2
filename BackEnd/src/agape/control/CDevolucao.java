package agape.control;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import agape.facade.DevolucaoFacade;
import agape.model.*;
import agape.util.ResponseObject;
import agape.util.TradutorErro;

/**
 * CDevolucao — Controller da rota /devolucao (RF_F8).
 *
 * Segue a convenção do projeto (classes C*, HttpHandler + Singleton). É a "ponte"
 * entre a View (DevolucaoController.js) e o DevolucaoFacade.
 *
 * SRP (SOLID)        — trata APENAS protocolo HTTP + fronteira da transação;
 *                      a regra de negócio fica no DevolucaoFacade.
 * GOF Singleton      — instância única via getInstancia().
 * Controller (GRASP) — recebe a requisição, valida entrada e aciona o caso de uso.
 *
 * A TRANSAÇÃO ATÔMICA é aberta aqui (setAutoCommit=false) e finalizada com
 * commit (sucesso) ou rollback (qualquer falha) — garantindo atomicidade.
 */
public class CDevolucao implements HttpHandler {

    // GOF Singleton
    private static CDevolucao instancia;
    private CDevolucao() {}
    public static CDevolucao getInstancia() {
        if (instancia == null) instancia = new CDevolucao();
        return instancia;
    }

    // ── Roteamento ──────────────────────────────────────────────────────────

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
            Connection conn = ConexaoBD.getInstance().getConexao();
            String body     = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);

            ResponseObject response = switch (method.toUpperCase()) {
                case "GET"  -> handleGet(conn, query);
                case "POST" -> realizarDevolucao(conn, body);
                default     -> naoEncontrado();
            };

            enviarResposta(exchange, response);

        } catch (Exception e) {
            ResponseObject erro = new ResponseObject();
            erro.setStatus(ResponseObject.STATUS_FAIL);
            erro.setCode(ResponseObject.CODE_ERROR);
            erro.addMessage(TradutorErro.traduzir(e));
            enviarResposta(exchange, erro);
        }
    }

    private ResponseObject handleGet(Connection conn, String query) {
        // GET /devolucao?idVenda=X — busca a venda e seus itens para seleção
        return buscarVenda(conn, parseSafeInt(param(query, "idVenda")));
    }

    // ── Caso de uso: Buscar venda + itens (Fluxo 1-2) ─────────────────────────

    /**
     * Retorna { venda, itens } da venda informada, para a View montar a seleção.
     * SRP — somente leitura; nenhuma alteração de estado.
     */
    public ResponseObject buscarVenda(Connection conn, int idVenda) {
        ResponseObject response = new ResponseObject();
        try {
            if (idVenda <= 0)
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "Informe o número da venda.");

            final Venda venda = new agape.dao.VendaDAO().buscarPorId(conn, idVenda);
            if (venda == null)
                return falha(response, ResponseObject.CODE_NOT_FOUND,
                        "Venda #" + idVenda + " não encontrada (Fluxo 2.1).");

            final List<ItemVenda> itens = new ItemVenda().listarItensPorVenda(conn, idVenda);

            StringBuilder sb = new StringBuilder("{");
            sb.append("\"venda\":").append(venda.toJson()).append(",");
            sb.append("\"itens\":[");
            for (int i = 0; i < itens.size(); i++) {
                if (i > 0) sb.append(",");
                sb.append(itens.get(i).toJson());
            }
            sb.append("]}");

            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            // Wrapper PÚBLICO (não anônimo): ResponseObject serializa via reflexão
            // chamando toJson(); classe anônima quebraria a invocação reflexiva.
            response.setResult(new JsonResult(sb.toString()));

        } catch (Exception e) {
            erroInterno(response);
        }
        return response;
    }

    /**
     * Wrapper de JSON cru para o ResponseObject.
     * Precisa ser PÚBLICO para que ResponseObject.toJson() consiga invocar
     * toJson() por reflexão (getMethod + invoke) sem IllegalAccessException.
     */
    public static class JsonResult {
        private final String json;
        public JsonResult(String json) { this.json = json; }
        public String toJson() { return json; }
    }

    // ── Caso de uso: Realizar Devolução (Fluxo 4-8) ───────────────────────────

    /**
     * POST /devolucao — delega ao DevolucaoFacade dentro de uma transação atômica.
     *
     * Body (form-urlencoded):
     *   idVenda, idsProdutos (csv), quantidades (csv), valoresUnitarios (csv),
     *   reincorporaEst (1|0)
     */
    public ResponseObject realizarDevolucao(Connection conn, String body) {
        ResponseObject response = new ResponseObject();
        try {
            // ── Abre a TRANSAÇÃO ATÔMICA ───────────────────────────────────────
            conn.setAutoCommit(false);

            int idVenda = parseSafeInt(param(body, "idVenda"));

            String[] idsProdStr = splitCsv(param(body, "idsProdutos"));
            String[] qtdsStr    = splitCsv(param(body, "quantidades"));
            String[] vlrsUniStr = splitCsv(param(body, "valoresUnitarios"));
            boolean  reincorpora = "1".equals(param(body, "reincorporaEst")) ||
                                   "true".equalsIgnoreCase(param(body, "reincorporaEst"));

            if (idsProdStr.length == 0 || idsProdStr[0].isBlank()) {
                conn.rollback();
                return falha(response, ResponseObject.CODE_BAD_REQUEST,
                        "Selecione ao menos um produto para devolução.");
            }

            int n = idsProdStr.length;
            int[]   idsProd     = new int[n];
            int[]   quantidades = new int[n];
            float[] vlrsUni     = new float[n];
            for (int i = 0; i < n; i++) {
                idsProd[i]     = parseSafeInt(idsProdStr[i].trim());
                quantidades[i] = parseSafeInt(qtdsStr[i].trim());
                vlrsUni[i]     = parseSafeFloat(vlrsUniStr[i].trim());
            }

            // ── Delega ao Facade (orquestração transacional) ──────────────────
            DevolucaoFacade facade = DevolucaoFacade.getInstance();
            Devolucao dev = facade.realizarDevolucao(conn, idVenda, idsProd, quantidades, vlrsUni, reincorpora);

            // ── Confirma a transação (tudo-ou-nada) ───────────────────────────
            conn.commit();

            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.addMessage("Devolução #" + dev.getIdDevolucao() +
                    " registrada com sucesso! Crédito de R$ " +
                    String.format("%.2f", dev.getValorTotal()) + " adicionado ao paroquiano.");
            response.setResult(dev);

        } catch (Exception e) {
            // ── Falha em qualquer passo → ROLLBACK (Fluxo 8.1) ────────────────
            try { if (conn != null) conn.rollback(); } catch (SQLException ignored) {}
            response.setStatus(ResponseObject.STATUS_FAIL);
            response.setCode(ResponseObject.CODE_ERROR);
            response.addMessage(TradutorErro.traduzir(e));
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

    private String[] splitCsv(String s) {
        return s == null ? new String[0] : s.split(",");
    }

    private int parseSafeInt(String val) {
        try { return Integer.parseInt(val.trim()); } catch (Exception e) { return 0; }
    }

    private float parseSafeFloat(String val) {
        try { return Float.parseFloat(val.trim().replace(",", ".")); } catch (Exception e) { return 0f; }
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
        r.addMessage("Ocorreu um problema ao processar sua solicitação. Tente novamente.");
    }

    private ResponseObject naoEncontrado() {
        ResponseObject r = new ResponseObject();
        r.setStatus(ResponseObject.STATUS_FAIL);
        r.setCode(ResponseObject.CODE_NOT_FOUND);
        r.addMessage("Endpoint não encontrado.");
        return r;
    }
}
