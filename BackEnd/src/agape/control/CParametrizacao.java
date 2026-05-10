package agape.control;

import java.io.IOException;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import java.sql.Connection;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

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
        String method = exchange.getRequestMethod();

        if (method.equalsIgnoreCase("OPTIONS")) {
            enviarResposta(exchange, new ResponseObject());
            return;
        }

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
                String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
                
                Parametrizacao p = new Parametrizacao();
                p.setCnpj(extrairParam(exchange, body, "cnpj"));
                p.setRazaoSocial(extrairParam(exchange, body, "razaoSocial"));
                p.setNomeFantasia(extrairParam(exchange, body, "nomeFantasia"));
                p.setEndereco(extrairParam(exchange, body, "endereco"));
                p.setBairro(extrairParam(exchange, body, "bairro"));
                p.setCidade(extrairParam(exchange, body, "cidade"));
                p.setUf(extrairParam(exchange, body, "uf"));
                p.setCep(extrairParam(exchange, body, "cep"));
                p.setEmail(extrairParam(exchange, body, "email"));
                p.setTelefone1(extrairParam(exchange, body, "telefone1"));
                p.setTelefone2(extrairParam(exchange, body, "telefone2"));
                p.setSite(extrairParam(exchange, body, "site"));
                p.setResponsavel(extrairParam(exchange, body, "responsavel"));
                p.setLogotipoPequeno(extrairParam(exchange, body, "logotipoPequeno"));
                p.setLogotipoGrande(extrairParam(exchange, body, "logotipoGrande"));
                p.setInscricaoEstadual(extrairParam(exchange, body, "inscricaoEstadual"));
                p.setInscricaoMunicipal(extrairParam(exchange, body, "inscricaoMunicipal"));
                p.setNumEndereco(extrairParam(exchange, body, "numEndereco"));
                p.setPais(extrairParam(exchange, body, "pais"));
                p.setMoedaPadrao(extrairParam(exchange, body, "moedaPadrao"));
                p.setFusoHorario(extrairParam(exchange, body, "fusoHorario"));
                p.setObs(extrairParam(exchange, body, "obs"));

                dao.salvar(conn, p);

                ResponseObject response = new ResponseObject();
                response.setStatus(ResponseObject.STATUS_OK);
                response.setCode(ResponseObject.CODE_OK);
                response.addMessage("Parametrização TOTAL salva com sucesso!");
                enviarResposta(exchange, response);
            }
        } catch (Exception e) {
            ResponseObject error = new ResponseObject();
            error.setStatus(ResponseObject.STATUS_FAIL);
            error.setCode(ResponseObject.CODE_ERROR);
            error.addMessage("Erro: " + e.getMessage());
            enviarResposta(exchange, error);
        }
    }
}
