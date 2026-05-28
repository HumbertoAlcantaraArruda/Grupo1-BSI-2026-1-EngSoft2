package agape.control;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.SQLException;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import agape.facade.InscricaoFacade;
import agape.model.Evento;
import agape.model.Inscricao;
import agape.model.Usuario;
import agape.util.ResponseObject;
import agape.util.TradutorErro;

/**
 * CEventosDisponiveis — Controller do caso de uso "Listar Eventos para Inscrição".
 *
 * Acessível a PAROQ, ADM e COLAB.
 * O usuário logado é identificado pelo e-mail extraído do JWT (usuarioEmail).
 *
 * GET  /eventosDisponiveis           → lista eventos com período ativo
 * POST /eventosDisponiveis           → inscreve o usuário logado  (body: {idEvento})
 * DELETE /eventosDisponiveis?idEvento → cancela a inscrição do usuário logado
 */
public class CEventosDisponiveis implements HttpHandler {

    private static CEventosDisponiveis instancia;
    private CEventosDisponiveis() {}
    public static CEventosDisponiveis getInstancia() {
        if (instancia == null) instancia = new CEventosDisponiveis();
        return instancia;
    }

    private final InscricaoFacade facade = InscricaoFacade.getInstance();

    // ── Roteamento ─────────────────────────────────────────────────────────

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod().toUpperCase();
        String query  = exchange.getRequestURI().getQuery();

        try {
            Connection conn  = ConexaoBD.getInstance().getConexao();
            String email     = (String) exchange.getAttribute("usuarioEmail");
            String body      = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);

            int idUsuario = resolverIdUsuario(conn, email);

            ResponseObject response = switch (method) {
                case "GET"     -> listar(conn, idUsuario);
                case "POST"    -> inscrever(conn, idUsuario, body);
                case "DELETE"  -> cancelar(conn, idUsuario, query);
                case "OPTIONS" -> ok();
                default        -> naoEncontrado();
            };

            enviarResposta(exchange, response);

        } catch (Exception e) {
            ResponseObject err = new ResponseObject();
            err.setStatus(ResponseObject.STATUS_FAIL);
            err.setCode(ResponseObject.CODE_ERROR);
            err.addMessage(TradutorErro.traduzir(e));
            enviarResposta(exchange, err);
        }
    }

    // ── GET: Listar eventos disponíveis ───────────────────────────────────

    public ResponseObject listar(Connection conn, int idUsuario) {
        ResponseObject response = new ResponseObject();
        try {
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.setResult(new Evento().listarDisponiveis(conn, idUsuario));
        } catch (Exception e) {
            erroInterno(response, e);
        }
        return response;
    }

    // ── POST: Inscrever usuário logado ────────────────────────────────────

    public ResponseObject inscrever(Connection conn, int idUsuario, String body) {
        ResponseObject response = new ResponseObject();
        try {
            int idEvento = parseSafeInt(json(body, "idEvento"));
            if (idEvento <= 0)
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "idEvento é obrigatório.");

            conn.setAutoCommit(false);

            Inscricao inscricao = facade.realizarInscricao(conn, idUsuario, idEvento);

            conn.commit();
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_CREATED);
            response.addMessage(inscricao.isListaEspera()
                ? "Sem vagas. Você foi adicionado à lista de espera (posição " + inscricao.getPosicaoEspera() + ")."
                : "Inscrição realizada com sucesso!");
            response.setResult(inscricao);

        } catch (Exception e) {
            rollback(conn);
            response.setStatus(ResponseObject.STATUS_FAIL);
            response.setCode(ResponseObject.CODE_BAD_REQUEST);
            response.addMessage(TradutorErro.traduzir(e));
        } finally {
            restaurarAutoCommit(conn);
        }
        return response;
    }

    // ── DELETE: Cancelar inscrição do usuário logado ──────────────────────

    public ResponseObject cancelar(Connection conn, int idUsuario, String query) {
        ResponseObject response = new ResponseObject();
        try {
            int idEvento = parseSafeInt(param(query, "idEvento"));
            if (idEvento <= 0)
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "idEvento é obrigatório.");

            conn.setAutoCommit(false);

            Inscricao inscricaoModel = new Inscricao();
            Evento eventoModel = new Evento();

            // 1. Busca a inscrição ativa/espera do usuário neste evento
            int idInscricao = inscricaoModel.buscarIdInscricaoAtiva(conn, idEvento, idUsuario);
            if (idInscricao == -1) {
                conn.setAutoCommit(true);
                return falha(response, ResponseObject.CODE_NOT_FOUND,
                    "Nenhuma inscrição ativa encontrada para este evento.");
            }

            // 2. Guarda status ANTES de cancelar (1=ativa, 2=lista espera)
            int statusOriginal = inscricaoModel.buscarStatus(conn, idInscricao);

            // 3. Verifica lista de espera ANTES de cancelar:
            //    se não há ninguém, a vaga liberada não será preenchida automaticamente
            boolean nenhumNaEspera = inscricaoModel.countListaEspera(conn, idEvento) == 0;

            // 4. Cancela (promove automaticamente o 1º da fila se houver)
            inscricaoModel.cancelar(conn, idInscricao, "Cancelado pelo paroquiano");

            // 5. Restaura vagasDisp apenas quando:
            //    - a inscrição cancelada era ATIVA (ocupava uma vaga real)
            //    - E ninguém da lista de espera vai preencher a vaga liberada
            if (statusOriginal == 1 && nenhumNaEspera) {
                eventoModel.incrementarVagas(conn, idEvento);
            }

            conn.commit();
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.addMessage("Inscrição cancelada com sucesso.");

        } catch (Exception e) {
            rollback(conn);
            erroInterno(response, e);
        } finally {
            restaurarAutoCommit(conn);
        }
        return response;
    }

    // ── Utilitários ────────────────────────────────────────────────────────

    private int resolverIdUsuario(Connection conn, String email) throws Exception {
        if (email == null || email.isEmpty()) return 0;
        Usuario u = new Usuario().buscarPorEmail(conn, email);
        return u != null ? u.getIdUsuario() : 0;
    }

    private void rollback(Connection conn) {
        try { if (conn != null) conn.rollback(); } catch (SQLException ignored) {}
    }

    private void restaurarAutoCommit(Connection conn) {
        try { if (conn != null) conn.setAutoCommit(true); } catch (SQLException ignored) {}
    }

    private String json(String body, String campo) {
        if (body == null || body.isEmpty()) return "";
        String chave = "\"" + campo + "\":";
        int inicio = body.indexOf(chave);
        if (inicio < 0) return "";
        inicio += chave.length();
        while (inicio < body.length() && body.charAt(inicio) == ' ') inicio++;
        if (inicio >= body.length()) return "";
        if (body.charAt(inicio) == '"') {
            inicio++;
            int fim = body.indexOf('"', inicio);
            return fim < 0 ? "" : body.substring(inicio, fim);
        }
        int fim = inicio;
        while (fim < body.length() && body.charAt(fim) != ',' && body.charAt(fim) != '}') fim++;
        String val = body.substring(inicio, fim).trim();
        return "null".equals(val) ? "" : val;
    }

    private String param(String source, String key) {
        if (source == null || source.isEmpty()) return "";
        for (String par : source.split("&")) {
            String[] kv = par.split("=", 2);
            if (kv[0].equals(key)) {
                try { return URLDecoder.decode(kv.length > 1 ? kv[1] : "", StandardCharsets.UTF_8.toString()); }
                catch (Exception e) { return ""; }
            }
        }
        return "";
    }

    private int parseSafeInt(String val) {
        try { return Integer.parseInt(val.trim()); } catch (Exception e) { return 0; }
    }

    private void enviarResposta(HttpExchange exchange, ResponseObject response) throws IOException {
        String json  = response.toJson();
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type",                 "application/json; charset=UTF-8");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin",  "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        exchange.sendResponseHeaders(response.getCode(), bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }

    private ResponseObject ok() {
        ResponseObject r = new ResponseObject();
        r.setStatus(ResponseObject.STATUS_OK);
        r.setCode(ResponseObject.CODE_OK);
        return r;
    }

    private ResponseObject falha(ResponseObject r, int code, String msg) {
        r.setStatus(ResponseObject.STATUS_FAIL);
        r.setCode(code);
        r.addMessage(msg);
        return r;
    }

    private void erroInterno(ResponseObject r, Exception e) {
        r.setStatus(ResponseObject.STATUS_FAIL);
        r.setCode(ResponseObject.CODE_ERROR);
        r.addMessage(TradutorErro.traduzir(e));
    }

    private ResponseObject naoEncontrado() {
        ResponseObject r = new ResponseObject();
        r.setStatus(ResponseObject.STATUS_FAIL);
        r.setCode(ResponseObject.CODE_NOT_FOUND);
        r.addMessage("Endpoint não encontrado.");
        return r;
    }
}

