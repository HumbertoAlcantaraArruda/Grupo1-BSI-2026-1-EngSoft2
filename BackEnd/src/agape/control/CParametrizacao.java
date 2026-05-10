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
        
        // CORS
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");

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
        String method = exchange.getRequestMethod();

        try {
            Connection conn = ConexaoBD.getInstance().getConexao();

            if (method.equalsIgnoreCase("GET")) {
                Parametrizacao p = dao.buscar(conn);
                ResponseObject response = new ResponseObject();
                response.setStatus(ResponseObject.STATUS_OK);
                response.setCode(ResponseObject.CODE_OK);
                response.setResult(p);
                enviarResposta(exchange, response);
            } else if (method.equalsIgnoreCase("POST")) {
                Parametrizacao p = new Parametrizacao();
                p.setCnpj(extrairParam(exchange, "cnpj"));
                p.setRazaoSocial(extrairParam(exchange, "razaoSocial"));
                p.setNomeFantasia(extrairParam(exchange, "nomeFantasia"));
                p.setEndereco(extrairParam(exchange, "endereco"));
                p.setEmail(extrairParam(exchange, "email"));
                p.setTelefone1(extrairParam(exchange, "telefone1"));
                p.setResponsavel(extrairParam(exchange, "responsavel"));

                dao.salvar(conn, p);

                ResponseObject response = new ResponseObject();
                response.setStatus(ResponseObject.STATUS_OK);
                response.setCode(ResponseObject.CODE_OK);
                response.addMessage("Parâmetros salvos com sucesso!");
                enviarResposta(exchange, response);
            }
        } catch (Exception e) {
            enviarErro(exchange, "Erro de Conexão: " + e.getMessage());
        }
    }

    private void enviarErro(HttpExchange exchange, String msg) throws IOException {
        ResponseObject response = new ResponseObject();
        response.setStatus(ResponseObject.STATUS_FAIL);
        response.setCode(ResponseObject.CODE_ERROR);
        response.addMessage(msg);
        enviarResposta(exchange, response);
    }
}
