package agape.control;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import agape.model.Caixa;
import agape.model.MovimentacaoCaixa;
import agape.model.Usuario;
import agape.util.ResponseObject;

/**
 * Controller de Caixa — implementa RF_F4, RF_F5 e RF_F6 conforme a ERS Agape.
 *
 * Rotas registradas em Main:
 *   POST /caixa/abrir     → RF_F4 – Abrir Caixa
 *   POST /caixa/atualizar → RF_F5 – Atualizar Caixa (Suprimento / Sangria)
 *   POST /caixa/fechar    → RF_F6 – Fechar Caixa
 *   GET  /caixa           → consulta o caixa aberto do usuário autenticado
 *
 * Regras da ERS observadas:
 *   - Apenas um caixa aberto por operador simultaneamente.
 *   - Sangria não pode exceder o saldo disponível.
 *   - Fechamento consolida todas as movimentações e retorna resumo completo
 *     com total de vendas e breakdown por forma de pagamento.
 *   - Todas as operações críticas usam transação (TBD).
 */
public class CCaixa implements HttpHandler {

    private static CCaixa instancia;

    private CCaixa() {}

    public static CCaixa getInstancia() {
        if (instancia == null) instancia = new CCaixa();
        return instancia;
    }

    // ── Roteamento ────────────────────────────────────────────────────────────

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        String path   = exchange.getRequestURI().getPath();

        if (method.equalsIgnoreCase("OPTIONS")) {
            enviarResposta(exchange, new ResponseObject());
            return;
        }

        try {
            Connection conn       = ConexaoBD.getInstance().getConexao();
            String body           = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            String requesterEmail = (String) exchange.getAttribute("usuarioEmail");

            ResponseObject response = switch (method.toUpperCase()) {
                case "GET"  -> consultarCaixaAberto(conn, requesterEmail);
                case "POST" -> switch (path) {
                    case "/caixa/abrir"     -> abrirCaixa(conn, requesterEmail, body);
                    case "/caixa/atualizar" -> atualizarCaixa(conn, requesterEmail, body);
                    case "/caixa/fechar"    -> fecharCaixa(conn, requesterEmail);
                    default -> naoEncontrado();
                };
                default -> naoEncontrado();
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

    // ── RF_F4 – Abrir Caixa ───────────────────────────────────────────────────

    public ResponseObject abrirCaixa(Connection conn, String emailOperador, String body) {
        ResponseObject response = new ResponseObject();
        try {
            Usuario operador = resolverOperador(conn, emailOperador);
            if (operador == null)
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Operador não encontrado.");

            float valorInicial = parseSafeFloat(param(body, "valorInicial"));
            if (valorInicial < 0)
                return falha(response, ResponseObject.CODE_BAD_REQUEST,
                        "O valor inicial não pode ser negativo.");

            Caixa caixaModel = new Caixa();

            Caixa caixaAberto = caixaModel.buscarAbertoPorUsuario(conn, operador.getIdUsuario());
            if (caixaAberto != null)
                return falha(response, ResponseObject.CODE_CONFLICT,
                        "Já existe um caixa aberto para este operador. Feche-o antes de abrir um novo.");

            conn.setAutoCommit(false);
            try {
                int idCaixa = caixaModel.abrir(conn, operador.getIdUsuario(), valorInicial);
                conn.commit();

                Caixa novo = caixaModel.buscarPorId(conn, idCaixa);

                response.setStatus(ResponseObject.STATUS_OK);
                response.setCode(ResponseObject.CODE_CREATED);
                response.addMessage("Caixa aberto com sucesso. Status: Aberto.");
                response.setResult(novo);

            } catch (Exception e) {
                rollback(conn);
                return erroInterno(response, e.getMessage());
            } finally {
                conn.setAutoCommit(true);
            }

        } catch (Exception e) {
            erroInterno(response, e.getMessage());
        }
        return response;
    }

    // ── RF_F5 – Atualizar Caixa (Suprimento / Sangria) ────────────────────────

    public ResponseObject atualizarCaixa(Connection conn, String emailOperador, String body) {
        ResponseObject response = new ResponseObject();
        try {
            Usuario operador = resolverOperador(conn, emailOperador);
            if (operador == null)
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Operador não encontrado.");

            String tipo   = param(body, "tipo").trim().toUpperCase();
            float  valor  = parseSafeFloat(param(body, "valor"));
            String motivo = param(body, "motivo").trim();

            if (!tipo.equals("SUPRIMENTO") && !tipo.equals("SANGRIA"))
                return falha(response, ResponseObject.CODE_BAD_REQUEST,
                        "Tipo inválido. Use 'SUPRIMENTO' ou 'SANGRIA'.");
            if (valor <= 0)
                return falha(response, ResponseObject.CODE_BAD_REQUEST,
                        "O valor deve ser positivo.");
            if (motivo.isEmpty())
                return falha(response, ResponseObject.CODE_BAD_REQUEST,
                        "O motivo da movimentação é obrigatório.");

            Caixa caixaModel = new Caixa();
            Caixa caixa = caixaModel.buscarAbertoPorUsuario(conn, operador.getIdUsuario());
            if (caixa == null)
                return falha(response, ResponseObject.CODE_BAD_REQUEST,
                        "Não há caixa aberto para este operador.");

            if (tipo.equals("SANGRIA")) {
                float saldoAtual = caixaModel.getSaldoAtual(conn, caixa.getIdCaixa());
                if (valor > saldoAtual)
                    return falha(response, ResponseObject.CODE_BAD_REQUEST,
                            String.format(Locale.US,
                                    "Sangria de R$ %.2f supera o saldo disponível de R$ %.2f.",
                                    valor, saldoAtual));
            }

            float delta = tipo.equals("SUPRIMENTO") ? valor : -valor;

            conn.setAutoCommit(false);
            try {
                MovimentacaoCaixa mov = new MovimentacaoCaixa();
                mov.setIdCaixa(caixa.getIdCaixa());
                mov.setIdUsuario(operador.getIdUsuario());
                mov.setDataHora(LocalDateTime.now());
                mov.setValor(delta);
                mov.setMotivo("[" + tipo + "] " + motivo);
                mov.inserir(conn);

                caixaModel.adicionarAoValorFinal(conn, caixa.getIdCaixa(), delta);
                conn.commit();

                float novoSaldo = caixaModel.getSaldoAtual(conn, caixa.getIdCaixa());

                response.setStatus(ResponseObject.STATUS_OK);
                response.setCode(ResponseObject.CODE_OK);
                response.addMessage(String.format(Locale.US,
                        "%s de R$ %.2f registrada com sucesso. Saldo atual: R$ %.2f.",
                        tipo.equals("SUPRIMENTO") ? "Suprimento" : "Sangria", valor, novoSaldo));
                response.setResult(new SaldoResult(caixa.getIdCaixa(), novoSaldo));

            } catch (Exception e) {
                rollback(conn);
                return erroInterno(response, e.getMessage());
            } finally {
                conn.setAutoCommit(true);
            }

        } catch (Exception e) {
            erroInterno(response, e.getMessage());
        }
        return response;
    }

    // ── RF_F6 – Fechar Caixa ─────────────────────────────────────────────────

    public ResponseObject fecharCaixa(Connection conn, String emailOperador) {
        ResponseObject response = new ResponseObject();
        try {
            Usuario operador = resolverOperador(conn, emailOperador);
            if (operador == null)
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Operador não encontrado.");

            Caixa caixaModel = new Caixa();
            Caixa caixa = caixaModel.buscarAbertoPorUsuario(conn, operador.getIdUsuario());
            if (caixa == null)
                return falha(response, ResponseObject.CODE_BAD_REQUEST,
                        "Não há caixa aberto para este operador.");

            float saldoFinal                      = caixaModel.getSaldoAtual(conn, caixa.getIdCaixa());
            List<MovimentacaoCaixa> movimentacoes  = caixaModel.listarMovimentacoes(conn, caixa.getIdCaixa());
            Map<String, Float> vendasPorForma     = caixaModel.resumoVendasPorFormaPag(conn, caixa.getIdCaixa());

            conn.setAutoCommit(false);
            try {
                caixaModel.fechar(conn, caixa.getIdCaixa(), saldoFinal);
                conn.commit();

                ResumoFechamento resumo = new ResumoFechamento(
                        caixa, saldoFinal, movimentacoes, vendasPorForma);

                response.setStatus(ResponseObject.STATUS_OK);
                response.setCode(ResponseObject.CODE_OK);
                response.addMessage(String.format(Locale.US,
                        "Caixa fechado com sucesso. Saldo final: R$ %.2f.", saldoFinal));
                response.setResult(resumo);

            } catch (Exception e) {
                rollback(conn);
                return erroInterno(response, e.getMessage());
            } finally {
                conn.setAutoCommit(true);
            }

        } catch (Exception e) {
            erroInterno(response, e.getMessage());
        }
        return response;
    }

    // ── Consulta ──────────────────────────────────────────────────────────────

    public ResponseObject consultarCaixaAberto(Connection conn, String emailOperador) {
        ResponseObject response = new ResponseObject();
        try {
            Usuario operador = resolverOperador(conn, emailOperador);
            if (operador == null)
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Operador não encontrado.");

            Caixa caixa = new Caixa().buscarAbertoPorUsuario(conn, operador.getIdUsuario());

            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.setResult(caixa);

        } catch (Exception e) {
            erroInterno(response, e.getMessage());
        }
        return response;
    }

    // ── Classes internas de resultado ─────────────────────────────────────────

    /** Resultado compacto retornado após Suprimento/Sangria. */
    public static class SaldoResult {
        private final int   idCaixa;
        private final float saldoAtual;

        SaldoResult(int idCaixa, float saldoAtual) {
            this.idCaixa    = idCaixa;
            this.saldoAtual = saldoAtual;
        }

        public String toJson() {
            return String.format(Locale.US,
                    "{\"idCaixa\":%d,\"saldoAtual\":%.2f}", idCaixa, saldoAtual);
        }
    }

    /** Resumo completo devolvido no fechamento do caixa (ERS RF_F6). */
    public static class ResumoFechamento {
        private final Caixa                   caixa;
        private final float                   saldoFinal;
        private final List<MovimentacaoCaixa> movimentacoes;
        private final Map<String, Float>      vendasPorForma;

        ResumoFechamento(Caixa caixa, float saldoFinal,
                         List<MovimentacaoCaixa> movimentacoes,
                         Map<String, Float> vendasPorForma) {
            this.caixa          = caixa;
            this.saldoFinal     = saldoFinal;
            this.movimentacoes  = movimentacoes;
            this.vendasPorForma = vendasPorForma;
        }

        public String toJson() {
            StringBuilder sb = new StringBuilder();
            sb.append("{");
            sb.append("\"idCaixa\":").append(caixa.getIdCaixa()).append(",");
            sb.append("\"valorInicial\":").append(String.format(Locale.US, "%.2f", caixa.getValorInicial())).append(",");
            sb.append("\"saldoFinal\":").append(String.format(Locale.US, "%.2f", saldoFinal)).append(",");
            sb.append("\"dataHoraAbertura\":\"").append(caixa.getDataHoraAbertura()).append("\",");
            sb.append("\"dataHoraFechamento\":\"").append(LocalDateTime.now()).append("\",");

            // Totais de suprimentos e sangrias (apenas movimentações manuais)
            float totalSuprimentos = 0, totalSangrias = 0;
            for (MovimentacaoCaixa m : movimentacoes) {
                if (m.getValor() > 0) totalSuprimentos += m.getValor();
                else                  totalSangrias    += Math.abs(m.getValor());
            }
            sb.append("\"totalSuprimentos\":").append(String.format(Locale.US, "%.2f", totalSuprimentos)).append(",");
            sb.append("\"totalSangrias\":").append(String.format(Locale.US, "%.2f", totalSangrias)).append(",");
            sb.append("\"quantidadeMovimentacoes\":").append(movimentacoes.size()).append(",");

            // Total de vendas do período
            float totalVendas = 0;
            for (float v : vendasPorForma.values()) totalVendas += v;
            sb.append("\"totalVendas\":").append(String.format(Locale.US, "%.2f", totalVendas)).append(",");

            // Breakdown por forma de pagamento
            sb.append("\"vendasPorFormaPag\":[");
            int i = 0;
            for (Map.Entry<String, Float> entry : vendasPorForma.entrySet()) {
                sb.append("{");
                sb.append("\"formaPag\":\"").append(esc(entry.getKey())).append("\",");
                sb.append("\"total\":").append(String.format(Locale.US, "%.2f", entry.getValue()));
                sb.append("}");
                if (++i < vendasPorForma.size()) sb.append(",");
            }
            sb.append("],");

            // Lista de movimentações manuais (suprimentos e sangrias)
            sb.append("\"movimentacoes\":[");
            for (int j = 0; j < movimentacoes.size(); j++) {
                MovimentacaoCaixa m = movimentacoes.get(j);
                sb.append("{");
                sb.append("\"idMov\":").append(m.getIdMov()).append(",");
                sb.append("\"valor\":").append(String.format(Locale.US, "%.2f", m.getValor())).append(",");
                sb.append("\"motivo\":\"").append(esc(m.getMotivo())).append("\",");
                sb.append("\"dataHora\":\"").append(m.getDataHora()).append("\"");
                sb.append("}");
                if (j < movimentacoes.size() - 1) sb.append(",");
            }
            sb.append("]");
            sb.append("}");
            return sb.toString();
        }

        private String esc(String s) {
            if (s == null) return "";
            return s.replace("\\", "\\\\").replace("\"", "\\\"");
        }
    }

    // ── Auxiliares ────────────────────────────────────────────────────────────

    private Usuario resolverOperador(Connection conn, String email) throws Exception {
        if (email == null || email.trim().isEmpty()) return null;
        return new Usuario().buscarPorEmail(conn, email.trim());
    }

    private void enviarResposta(HttpExchange exchange, ResponseObject response) throws IOException {
        String json  = response.toJson();
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);

        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
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

    private float parseSafeFloat(String val) {
        if (val == null || val.trim().isEmpty()) return 0f;
        try { return Float.parseFloat(val.trim().replace(",", ".")); }
        catch (Exception e) { return 0f; }
    }

    private void rollback(Connection conn) {
        try { if (conn != null) conn.rollback(); } catch (SQLException ignored) {}
    }

    private ResponseObject falha(ResponseObject r, int code, String msg) {
        r.setStatus(ResponseObject.STATUS_FAIL);
        r.setCode(code);
        r.addMessage(msg);
        return r;
    }

    private ResponseObject erroInterno(ResponseObject r, String detalhe) {
        r.setStatus(ResponseObject.STATUS_FAIL);
        r.setCode(ResponseObject.CODE_ERROR);
        r.addMessage("Erro interno do servidor." + (detalhe != null ? " Detalhe: " + detalhe : ""));
        return r;
    }

    private ResponseObject naoEncontrado() {
        ResponseObject r = new ResponseObject();
        r.setStatus(ResponseObject.STATUS_FAIL);
        r.setCode(ResponseObject.CODE_NOT_FOUND);
        r.addMessage("Endpoint não encontrado.");
        return r;
    }
}