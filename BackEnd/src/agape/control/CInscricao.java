package agape.control;

import java.io.IOException;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import java.sql.Connection;
import java.sql.SQLException;

import agape.dao.InscricaoDAO;
import agape.util.ResponseObject;

public class CInscricao implements HttpHandler {

    private static CInscricao instancia;
    private InscricaoDAO inscricaoDAO;

    private CInscricao() {
        inscricaoDAO = new InscricaoDAO();
    }

    public static CInscricao getInstancia() {
        if (instancia == null) {
            instancia = new CInscricao();
        }
        return instancia;
    }

    private void enviarResposta(HttpExchange exchange, ResponseObject response) throws IOException {
        String json = response.toJson();
        byte[] bytes = json.getBytes("UTF-8");
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(response.getCode(), bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }

    private String extrairParam(HttpExchange exchange, String chave) {
        String query = exchange.getRequestURI().getQuery();
        String body = "";
        try {
            if (exchange.getRequestMethod().equalsIgnoreCase("POST")) {
                body = new String(exchange.getRequestBody().readAllBytes());
            }
        } catch (Exception e) {}

        String fullStr = (query != null ? query : "") + "&" + body;
        
        try {
            for (String par : fullStr.split("&")) {
                String[] kv = par.split("=");
                if (kv[0].equals(chave)) {
                    String valor = kv.length > 1 ? kv[1] : "";
                    return java.net.URLDecoder.decode(valor, "UTF-8");
                }
            }
        } catch (Exception e) {}
        return "";
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();

        if (path.equals("/cancelarInscricao")) {
            try {
                int idInscricao = Integer.parseInt(extrairParam(exchange, "idInscricao"));
                String obs = extrairParam(exchange, "obs");
                if (obs.isEmpty()) obs = "Cancelamento via URL";

                ResponseObject response = cancelarInscricaoFlow(idInscricao, obs);
                enviarResposta(exchange, response);

            } catch (Exception e) {
                ResponseObject errorResponse = new ResponseObject();
                errorResponse.setStatus(ResponseObject.STATUS_FAIL);
                errorResponse.setCode(ResponseObject.CODE_FAILED);
                errorResponse.addMessage("Erro: " + e.getMessage() + ". Adicione ?idInscricao=XX na URL.");
                enviarResposta(exchange, errorResponse);
            }
        }
    }

    public ResponseObject cancelarInscricaoFlow(int idInscricao, String obs) {
        ResponseObject response = new ResponseObject();
        Connection conn = null;
        try {
            conn = ConexaoBD.getInstance().getConexao();
            conn.setAutoCommit(false);
            boolean sucesso = inscricaoDAO.cancelar(conn, idInscricao, obs);
            if (sucesso) {
                conn.commit();
                response.setStatus(ResponseObject.STATUS_OK);
                response.setCode(ResponseObject.CODE_OK);
                response.addMessage("Cancelado com sucesso!");
            } else {
                conn.rollback();
                response.setStatus(ResponseObject.STATUS_FAIL);
                response.setCode(ResponseObject.CODE_NOT_FOUND);
                response.addMessage("ID não encontrado.");
            }
        } catch (Exception e) {
            try { if (conn != null) conn.rollback(); } catch (SQLException se) {}
            response.setStatus(ResponseObject.STATUS_FAIL);
            response.setCode(ResponseObject.CODE_FAILED);
            response.addMessage("Erro: " + e.getMessage());
        } finally {
            try { if (conn != null) conn.setAutoCommit(true); } catch (SQLException se) {}
        }
        return response;
    }
}
