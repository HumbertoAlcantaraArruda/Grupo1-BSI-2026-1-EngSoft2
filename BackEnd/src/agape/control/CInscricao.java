package agape.control;

import java.io.IOException;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

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
        for (String par : body.split("&")) {
            String[] kv = par.split("=");
            if (kv[0].equals(chave))
                return kv.length > 1 ? kv[1] : "";
        }
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

                ResponseObject response = cancelarInscricao(idInscricao);
                enviarResposta(exchange, response);

            } catch (Exception e) {
                ResponseObject errorResponse = new ResponseObject();
                errorResponse.setStatus(ResponseObject.STATUS_FAIL);
                errorResponse.setCode(ResponseObject.CODE_FAILED);
                errorResponse.addMessage("Erro nos dados enviados: " + e.getMessage());
                enviarResposta(exchange, errorResponse);
            }
        } else {
            String response = "Endpoint não encontrado";
            exchange.sendResponseHeaders(404, response.length());
            exchange.getResponseBody().write(response.getBytes());
            exchange.close();
        }
    }

    public ResponseObject cancelarInscricao(int idInscricao) {
        ResponseObject response = new ResponseObject();
        try {
            boolean sucesso = inscricaoDAO.cancelar(idInscricao);
            if (sucesso) {
                response.setStatus(ResponseObject.STATUS_OK);
                response.setCode(ResponseObject.CODE_OK);
                response.addMessage("Inscrição cancelada com sucesso!");
            } else {
                response.setStatus(ResponseObject.STATUS_FAIL);
                response.setCode(ResponseObject.CODE_FAILED);
                response.addMessage("Inscrição não encontrada.");
            }
        } catch (Exception e) {
            response.setStatus(ResponseObject.STATUS_FAIL);
            response.setCode(ResponseObject.CODE_FAILED);
            response.addMessage("Erro ao cancelar inscrição: " + e.getMessage());
        }
        return response;
    }
}
