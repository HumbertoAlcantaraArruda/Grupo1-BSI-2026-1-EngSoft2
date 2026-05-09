package agape.control;

import java.io.IOException;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import java.sql.Connection;

import agape.dao.ParametrizacaoDAO;
import agape.model.Parametrizacao;
import agape.util.ResponseObject;

public class CParametrizacao implements HttpHandler {

    private static CParametrizacao instancia;
    private ParametrizacaoDAO dao;

    private CParametrizacao() {
        dao = new ParametrizacaoDAO();
    }

    public static CParametrizacao getInstancia() {
        if (instancia == null) {
            instancia = new CParametrizacao();
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
                return kv.length > 1 ? kv[1].replace("+", " ") : ""; 
        }
        return "";
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        Connection conn = ConexaoBD.getInstance().getConexao();

        if (method.equalsIgnoreCase("GET")) {
            try {
                Parametrizacao p = dao.buscar(conn);
                ResponseObject response = new ResponseObject();
                response.setStatus(ResponseObject.STATUS_OK);
                response.setCode(ResponseObject.CODE_OK);
                response.setResult(p);
                enviarResposta(exchange, response);
            } catch (Exception e) {
                enviarErro(exchange, e.getMessage());
            }
        } else if (method.equalsIgnoreCase("POST")) {
            try {
                String body = new String(exchange.getRequestBody().readAllBytes());
                
                Parametrizacao p = new Parametrizacao();
                p.setCnpj(extrairParam(body, "cnpj"));
                p.setRazaoSocial(extrairParam(body, "razaoSocial"));
                p.setNomeFantasia(extrairParam(body, "nomeFantasia"));
                p.setEndereco(extrairParam(body, "endereco"));
                p.setEmail(extrairParam(body, "email"));
                p.setTelefone1(extrairParam(body, "telefone1"));
                p.setResponsavel(extrairParam(body, "responsavel"));

                dao.salvar(conn, p);

                ResponseObject response = new ResponseObject();
                response.setStatus(ResponseObject.STATUS_OK);
                response.setCode(ResponseObject.CODE_OK);
                response.addMessage("Parâmetros salvos com sucesso!");
                enviarResposta(exchange, response);
            } catch (Exception e) {
                enviarErro(exchange, e.getMessage());
            }
        }
    }

    private void enviarErro(HttpExchange exchange, String msg) throws IOException {
        ResponseObject response = new ResponseObject();
        response.setStatus(ResponseObject.STATUS_FAIL);
        response.setCode(ResponseObject.CODE_FAILED);
        response.addMessage(msg);
        enviarResposta(exchange, response);
    }
}
