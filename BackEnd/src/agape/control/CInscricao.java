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

    private String extrairParam(String body, String chave) {
        try {
            for (String par : body.split("&")) {
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
        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        if (method.equalsIgnoreCase("POST") && path.equals("/cancelarInscricao")) {
            try {
                String body = new String(exchange.getRequestBody().readAllBytes());
                int idInscricao = Integer.parseInt(extrairParam(body, "idInscricao"));
                
                // Pegando o motivo opcional (EXTRA: Aproveitando a coluna 'obs' do banco)
                String motivo = extrairParam(body, "motivo");
                if (motivo.isEmpty()) motivo = "Cancelamento efetuado pelo sistema";

                ResponseObject response = cancelarInscricaoFlow(idInscricao, motivo);
                enviarResposta(exchange, response);

            } catch (Exception e) {
                ResponseObject errorResponse = new ResponseObject();
                errorResponse.setStatus(ResponseObject.STATUS_FAIL);
                errorResponse.setCode(ResponseObject.CODE_FAILED);
                errorResponse.addMessage("Erro: " + e.getMessage());
                enviarResposta(exchange, errorResponse);
            }
        }
    }

    /**
     * Fluxo de cancelamento: Inclui o motivo na coluna 'obs' como diferencial de implementação.
     */
    public ResponseObject cancelarInscricaoFlow(int idInscricao, String motivo) {
        ResponseObject response = new ResponseObject();
        Connection conn = null;
        try {
            conn = ConexaoBD.getInstance().getConexao();
            conn.setAutoCommit(false);

            // Passando o motivo para o DAO
            boolean sucesso = inscricaoDAO.cancelar(conn, idInscricao, motivo);

            if (sucesso) {
                conn.commit();
                response.setStatus(ResponseObject.STATUS_OK);
                response.setCode(ResponseObject.CODE_OK);
                response.addMessage("Inscrição cancelada e fila atualizada! Motivo registrado.");
            } else {
                conn.rollback();
                response.setStatus(ResponseObject.STATUS_FAIL);
                response.setCode(ResponseObject.CODE_NOT_FOUND);
                response.addMessage("Inscrição não encontrada.");
            }
        } catch (Exception e) {
            try { if (conn != null) conn.rollback(); } catch (SQLException se) {}
            response.setStatus(ResponseObject.STATUS_FAIL);
            response.setCode(ResponseObject.CODE_FAILED);
            response.addMessage("Erro no cancelamento: " + e.getMessage());
        } finally {
            try { if (conn != null) conn.setAutoCommit(true); } catch (SQLException se) {}
        }
        return response;
    }
}
