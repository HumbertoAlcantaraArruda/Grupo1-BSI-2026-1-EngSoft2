package agape.control;

import java.io.IOException;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

import agape.model.Inscricao;
import agape.util.ResponseObject;

public class CInscricao implements HttpHandler {

    private static CInscricao instancia;

    private CInscricao() {
    }

    public static CInscricao getInstancia() {
        if (instancia == null) {
            instancia = new CInscricao();
        }
        return instancia;
    }

    private void enviarResposta(HttpExchange exchange, ResponseObject response) throws IOException {
        String json = response.toJson();
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);

        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");

        exchange.sendResponseHeaders(response.getCode(), bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }

    private String extrairParam(HttpExchange exchange, String body, String chave) {
        String query = exchange.getRequestURI().getQuery();
        String fullStr = (query != null ? query : "") + "&" + (body != null ? body : "");

        for (String par : fullStr.split("&")) {
            String[] kv = par.split("=");
            if (kv.length > 0 && kv[0].equals(chave)) {
                try {
                    String valor = kv.length > 1 ? kv[1] : "";
                    return URLDecoder.decode(valor, StandardCharsets.UTF_8.toString());
                } catch (Exception e) { return ""; }
            }
        }
        return "";
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
            enviarResposta(exchange, new ResponseObject());
            return;
        }

        try {
            Connection conn = ConexaoBD.getInstance().getConexao();
            String path = exchange.getRequestURI().getPath();

            if (path.equals("/cancelarInscricao")) {
                String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
                int idInscricao = Integer.parseInt(extrairParam(exchange, body, "idInscricao"));
                String obs = extrairParam(exchange, body, "obs");

                if (obs == null || obs.trim().isEmpty()) {
                    obs = "Cancelamento via Sistema";
                }

                ResponseObject response = cancelarInscricaoFlow(conn, idInscricao, obs);
                enviarResposta(exchange, response);
            }
        } catch (Exception e) {
            ResponseObject errorResponse = new ResponseObject();
            errorResponse.setStatus(ResponseObject.STATUS_FAIL);
            errorResponse.setCode(ResponseObject.CODE_ERROR);
            errorResponse.addMessage("Erro: " + e.getMessage());
            enviarResposta(exchange, errorResponse);
        }
    }

    public ResponseObject cancelarInscricaoFlow(Connection conn, int idInscricao, String obs) {
        ResponseObject response = new ResponseObject();
        try {
            // TRAVA DE SEGURANÇA: Verificar se já está cancelado
            String checkSql = "SELECT status FROM Inscricao WHERE idInscricao = ?";
            try (PreparedStatement ps = conn.prepareStatement(checkSql)) {
                ps.setInt(1, idInscricao);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        int status = rs.getInt("status");
                        if (status == 0) {
                            response.setStatus(ResponseObject.STATUS_FAIL);
                            response.setCode(ResponseObject.CODE_ERROR);
                            response.addMessage("Esta inscrição já está cancelada!");
                            return response;
                        }
                    } else {
                        response.setStatus(ResponseObject.STATUS_FAIL);
                        response.setCode(ResponseObject.CODE_NOT_FOUND);
                        response.addMessage("Inscrição não encontrada.");
                        return response;
                    }
                }
            }

            conn.setAutoCommit(false);
            Inscricao i = new Inscricao();
            i.setIdInscricao(idInscricao);
            boolean sucesso = i.cancelar(conn, obs);
            if (sucesso) {
                conn.commit();
                response.setStatus(ResponseObject.STATUS_OK);
                response.setCode(ResponseObject.CODE_OK);
                response.addMessage("Cancelado com sucesso!");
            } else {
                conn.rollback();
                response.setStatus(ResponseObject.STATUS_FAIL);
                response.setCode(ResponseObject.CODE_ERROR);
                response.addMessage("Não foi possível cancelar.");
            }
        } catch (Exception e) {
            try { if (conn != null) conn.rollback(); } catch (SQLException se) {}
            response.setStatus(ResponseObject.STATUS_FAIL);
            response.setCode(ResponseObject.CODE_ERROR);
            response.addMessage("Erro: " + e.getMessage());
        } finally {
            try { if (conn != null) conn.setAutoCommit(true); } catch (SQLException se) {}
        }
        return response;
    }
}
