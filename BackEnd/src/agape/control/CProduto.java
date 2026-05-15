package agape.control;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import agape.dao.ProdutoDAO;
import agape.model.Produto;
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
        ResponseObject response =  switch(method.toUpperCase()){
          case "GET" -> handleGet(path, query);
          case "POST" -> handlePost(path, query, body);
          case "PUT" -> handlePut(path, body);
          case "DELETE" -> handleDelete(query);
           default -> naoEncontrado();
        };
        enviarResposta(exchange, response);
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
        return response;
    }

    private ResponseObject handleGet(String path, String query) {
        String catProdParam = param(query, "idCatProd");
        String nomeParam = param(query, "nome");
        String operadorParam = param(query, "operador");
        String quantidadeParam = param(query, "quantidade");
        String catProd = catProdParam.isEmpty() ? null : catProdParam.trim();
        String nome = nomeParam.isEmpty() ? null : nomeParam.trim();
        String qtdeStr = quantidadeParam.isEmpty() ? null : quantidadeParam.trim();
        String op = operadorParam != null  ? operadorParam.trim() : null;

        int qtd = -1;

        if (qtdeStr != null){
            qtd=Integer.parseInt(qtdeStr);
        }
        return buscar(qtd, catProd,nome,op);
    }

    private ResponseObject handlePost(String path, String query, String body) {
        String src = (query != null ? query : "") + "&" + body;
        return inserir(
            parseSafeInt(param(src, "idCatProd")),
            param(src, "nome"),
            parseSafeFloat(param(src, "valorUni")),
            parseSafeInt(param(src, "qtdeAtual"))
        );
    }

    private ResponseObject handlePut(String path, String body) {
        if (path.equals("/produto"))
            return atualizar(
                parseSafeInt(param(body, "idProd")),
                parseSafeInt(param(body, "idCatProd")),
                param(body, "nome"),
                parseSafeFloat(param(body, "valorUni")),
                parseSafeInt(param(body, "qtdeAtual"))
            );
        return naoEncontrado();
    }

    private ResponseObject handleDelete(String query) {
        return excluir(parseSafeInt(param(query, "idProd")));
    }

    public ResponseObject inserir(int idCatProd, String nome, float valorUni, int qtdeAtual) {
        ResponseObject response = new ResponseObject();
        try {
            if (vazio(nome)) {
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "Nome é obrigatório.");
            }
            if (idCatProd <= 0){
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "Categoria do produto é obrigatória.");
            }
            if (produtoDAO.existeNome(nome.trim(), 0)){
                return falha(response, ResponseObject.CODE_CONFLICT, "Já existe um produto com esse nome.");
            }

            Produto p = new Produto();
            p.setIdCatProd(idCatProd);
            p.setNome(nome.trim());
            p.setValorUni(valorUni);
            p.setQtdeAtual(qtdeAtual);
            produtoDAO.inserir(p);

            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_CREATED);
            response.addMessage("Produto cadastrado com sucesso.");
            response.setResult(p);
        }
        catch (Exception e) {
            erroInterno(response, e);
        }
        return response;
    }

    public ResponseObject atualizar(int idProd, int idCatProd, String nome, float valorUni, int qtdeAtual) {
        ResponseObject response = new ResponseObject();
        try {
            if (vazio(nome)){
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "Nome é obrigatório.");
            }
            if (idCatProd <= 0) {
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "Categoria do produto é obrigatória.");
            }

            Produto p = produtoDAO.buscarPorId(idProd);
            if (p == null) {
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Produto não encontrado.");
            }
            if (produtoDAO.existeNome(nome.trim(), idProd)){
                return falha(response, ResponseObject.CODE_CONFLICT, "Já existe outro produto com esse nome.");
            }

            p.setIdCatProd(idCatProd);
            p.setNome(nome.trim());
            p.setValorUni(valorUni);
            p.setQtdeAtual(qtdeAtual);
            produtoDAO.atualizar(p);

            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.addMessage("Produto atualizado com sucesso.");
            response.setResult(p);
        }
        catch (Exception e) {
            erroInterno(response, e);
        }
        return response;
    }

    public ResponseObject excluir(int id) {
        ResponseObject response = new ResponseObject();
        try {
            if (produtoDAO.buscarPorId(id) == null) {
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Produto não encontrado.");
            }
            produtoDAO.excluir(id);
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.addMessage("Produto excluído com sucesso.");
        }
        catch (Exception e) {
            erroInterno(response, e);
        }
        return response;
    }


    private int parseSafeInt(String val) {
        try {
            return Integer.parseInt(val.trim());
        }
        catch (Exception e) {
            return 0;
        }
    }

    private float parseSafeFloat(String val) {
        try {
            return Float.parseFloat(val.trim());
        }
        catch (Exception e) {
            return 0f;
        }
    }

    private boolean vazio(String s) {
        return s == null || s.trim().isEmpty();
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
        r.addMessage("Erro interno do servidor: " + (e != null ? e.getMessage() : ""));
    }

    private ResponseObject naoEncontrado() {
        ResponseObject response = new ResponseObject();
        response.setStatus(ResponseObject.STATUS_FAIL);
        response.setCode(ResponseObject.CODE_NOT_FOUND);
        response.addMessage("Endpoint não encontrado.");
        return response;
    }

}
