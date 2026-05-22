package agape.control;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import agape.util.TradutorErro;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import agape.dao.EventoDAO;
import agape.dao.InscricaoDAO;
import agape.model.Evento;
import agape.model.Usuario;

/**
 * CDetalheEvento — retorna responsável, lista de inscritos e lista de espera.
 *
 * GET    /detalheEvento?idEvento=X   → detalhe completo
 * DELETE /detalheEvento?idInscricao=X → ADM remove um inscrito (restaura vaga se necessário)
 *
 * Serializa JSON manualmente para evitar restrições de reflexão
 * sobre classes privadas internas.
 */
public class CDetalheEvento implements HttpHandler {

    private static CDetalheEvento instancia;
    private CDetalheEvento() {}
    public static CDetalheEvento getInstancia() {
        if (instancia == null) instancia = new CDetalheEvento();
        return instancia;
    }

    private final EventoDAO    eventoDAO    = new EventoDAO();
    private final InscricaoDAO inscricaoDAO = new InscricaoDAO();

    // ── Roteamento ─────────────────────────────────────────────────────────

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod().toUpperCase();
        String query  = exchange.getRequestURI().getQuery();

        setCors(exchange);

        if ("OPTIONS".equals(method)) { exchange.sendResponseHeaders(200, -1); exchange.close(); return; }

        try {
            exchange.getRequestBody().readAllBytes();
            Connection conn = ConexaoBD.getInstance().getConexao();

            switch (method) {
                case "GET"    -> escreverJson(exchange, 200, buscarJson(conn, query));
                case "DELETE" -> escreverJson(exchange, 200, removerJson(conn, query));
                default       -> escreverJson(exchange, 404, erro("Endpoint não encontrado."));
            }
        } catch (Exception e) {
            try { escreverJson(exchange, 500, erro(TradutorErro.traduzir(e))); }
            catch (IOException ignored) {}
        }
    }

    // ── GET: retorna detalhe completo do evento ────────────────────────────

    private String buscarJson(Connection conn, String query) throws Exception {
        int idEvento = parseSafeInt(param(query, "idEvento"));
        if (idEvento <= 0) return erro("idEvento é obrigatório.");

        Evento ev = eventoDAO.buscarPorId(conn, idEvento);
        if (ev == null) return erro("Evento não encontrado.");

        Usuario resp = new Usuario().buscarPorId(conn, ev.getIdUsuarioResponsavel());

        List<String[]> inscritos   = inscricaoDAO.listarInscritosPorEvento(conn, idEvento);
        List<String[]> listaEspera = inscricaoDAO.listarListaEsperaPorEvento(conn, idEvento);

        StringBuilder sb = new StringBuilder();
        sb.append("{\"status\":\"ok\",\"code\":200,\"messages\":[],\"result\":{");
        sb.append("\"nomeEvento\":").append(s(ev.getNome())).append(",");
        sb.append("\"nomeResponsavel\":").append(s(resp != null ? resp.getNome()  : "")).append(",");
        sb.append("\"emailResponsavel\":").append(s(resp != null ? resp.getEmail(): "")).append(",");

        // inscritos: [{idInscricao, nome, email, cpf, dataInscricao}]
        sb.append("\"inscritos\":[");
        for (int i = 0; i < inscritos.size(); i++) {
            String[] p = inscritos.get(i);          // [idInscricao,nome,email,cpf,data]
            if (i > 0) sb.append(",");
            sb.append("{")
              .append("\"idInscricao\":").append(p[0]).append(",")
              .append("\"nome\":").append(s(p[1])).append(",")
              .append("\"email\":").append(s(p[2])).append(",")
              .append("\"cpf\":").append(s(p[3])).append(",")
              .append("\"dataInscricao\":").append(s(p[4]))
              .append("}");
        }
        sb.append("],");

        // listaEspera: [{ordem, nome, email, cpf, dataInscricao}]
        sb.append("\"listaEspera\":[");
        for (int i = 0; i < listaEspera.size(); i++) {
            String[] e = listaEspera.get(i);        // [ordem,nome,email,cpf,data]
            if (i > 0) sb.append(",");
            sb.append("{")
              .append("\"ordem\":").append(e[0]).append(",")
              .append("\"nome\":").append(s(e[1])).append(",")
              .append("\"email\":").append(s(e[2])).append(",")
              .append("\"cpf\":").append(s(e[3])).append(",")
              .append("\"dataInscricao\":").append(s(e[4]))
              .append("}");
        }
        sb.append("]}}");
        return sb.toString();
    }

    // ── DELETE: ADM remove um inscrito ─────────────────────────────────────

    private String removerJson(Connection conn, String query) throws Exception {
        int idInscricao = parseSafeInt(param(query, "idInscricao"));
        if (idInscricao <= 0) return erro("idInscricao é obrigatório.");

        // Busca idEvento e status da inscrição antes de cancelar
        int[] eventoEStatus = buscarEventoEStatus(conn, idInscricao);
        if (eventoEStatus == null)
            return erro("Inscrição não encontrada.");

        int idEvento      = eventoEStatus[0];
        int statusOriginal = eventoEStatus[1];

        conn.setAutoCommit(false);
        try {
            // Verifica fila ANTES de cancelar para decidir sobre vagasDisp
            boolean nenhumNaEspera = inscricaoDAO.countListaEspera(conn, idEvento) == 0;

            // Cancela (promove da lista de espera se houver alguém)
            int resultado = inscricaoDAO.cancelar(conn, idInscricao, "Removido pelo administrador");
            if (resultado == -1) {
                conn.setAutoCommit(true);
                return erro("Inscrição não encontrada.");
            }

            // Restaura vaga apenas se era inscrição ativa e ninguém ocupou o lugar
            if (statusOriginal == 1 && nenhumNaEspera) {
                eventoDAO.incrementarVagas(conn, idEvento);
            }

            conn.commit();
            return "{\"status\":\"ok\",\"code\":200,\"messages\":[\"Inscrição removida com sucesso.\"],\"result\":null}";

        } catch (Exception e) {
            try { conn.rollback(); } catch (SQLException ignored) {}
            throw e;
        } finally {
            try { conn.setAutoCommit(true); } catch (SQLException ignored) {}
        }
    }

    // ── Auxiliares ─────────────────────────────────────────────────────────

    /** Retorna [idEvento, status] da inscrição ou null se não encontrada. */
    private int[] buscarEventoEStatus(Connection conn, int idInscricao) throws Exception {
        String sql = "SELECT idEvento, status FROM Inscricao WHERE idInscricao=?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, idInscricao);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return new int[]{ rs.getInt("idEvento"), rs.getInt("status") };
            }
        }
        return null;
    }

    private String erro(String msg) {
        return "{\"status\":\"fail\",\"code\":400,\"messages\":[" +
               "\"" + msg.replace("\"", "\\\"") + "\"],\"result\":null}";
    }

    /** Serializa String para JSON: null→null, valor→"valor" com escape. */
    private String s(String v) {
        if (v == null) return "null";
        return "\"" + v.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
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

    private void setCors(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin",  "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    private void escreverJson(HttpExchange exchange, int code, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(code, bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }
}

