package agape.control;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import agape.dao.ProdutoDAO;
import agape.util.ResponseObject;

public class CProduto implements HttpHandler {
    private static CProduto instancia;
    private final ProdutoDAO produtoDAO;

    private CProduto() {
        produtoDAO = new ProdutoDAO();
    }

public static CProduto getInstancia() {
        if (instancia == null) {
            instancia = new CProduto();
        }
        return instancia;
    }


    //Metodo que identifica a ROTA que o cliente está requisitando
    @Override 
    public void handle(HttpExchange exchange) throws IOException {
       String method = exchange.getRequestMethod();
       String path = exchange.getRequestURI().getPath();
       String query = exchange.getRequestURI().getQuery();
       if (method.equalsIgnoreCase("OPTIONS")){
        enviarResposta(exchange, new ResponseObject());
        return;
      }
      try{
        String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        ReponseObject response =  switch(method.toUpperCase()){
          case "GET" -> handleGet(path, query);
          case "POST" -> handlePost(path, body);
          case "PUT" -> handlePut(path, body);
          case "DELETE" -> handleDelete(path);
          default -> naoEncontrado();
        };
      }
      catch (Exception e){
        ResponseObject erro = new ResponseObject();
        erro.setStatus(ResponseObject.STATUS_FAIL);
        erro.setCode(ResponseObject.CODE_ERROR);
        erro.addMessage("Erro inesperado: " + e.getMessage());
        enviarResposta(exchange, erro);
      }
    }








// AUXILIAR PARA ENVIAR RESPOSTA
    private void enviarResposta(HttpExchange exchange, ResponseObject response) throws IOException {
        String json = response.toJson();
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        // Configura os headers CORS e o tipo de conteúdo
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        // Permitir acesso de qualquer origem (CORS)
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        // Permitir métodos HTTP específicos
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        // Permitir headers específicos
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
        // Enviar a resposta
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

    public ResponseObject buscar(int qtd, String catProd, String nome, String op){
        ResponseObject response = new ResponseObject();
        try{
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.setResult(produtoDAO.buscar(qtd,catProd,nome,op));
        }
        catch (Exception e){
            response.setStatus(ResponseObject.STATUS_FAIL);
            response.setCode(ResponseObject.CODE_ERROR);
            response.addMessage("Erro inesperado: " + e.getMessage());
        }
    }

    private ResponseObject handleGet(String path, String query) {
        String catProdParam = param(query, "catProd");
        String nomeParam = param(query, "nome");
        String operadorParam = param(query, "operador");
        String quantidadeParam = param(query, "quantidade");
        String catProd = catProdParam.isEmpty() ? null : catProdParam.trim();
        String nome = nomeParam.isEmpty() ? null : nomeParam.trim();
        String qtdeStr = quantidadeParam.isEmpty() ? null : quantidadeParam.trim();
        String op = operadorParam != null && operadorParam.trim().matches("ˆ(>=|<=|>|<|=)$") ? operadorParam.trim() : null;

        int qtd = -1;

        if (qtdeStr != null){
            qtd=Integer.parseInt(qtdeStr);
        }
        return buscar(qtd, catProd,nome,op);
    }

}
