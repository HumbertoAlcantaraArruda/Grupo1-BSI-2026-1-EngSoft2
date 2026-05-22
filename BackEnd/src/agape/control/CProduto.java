package agape.control;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import agape.model.Produto;
import agape.util.ResponseObject;
import agape.util.TradutorErro;

public class CProduto implements HttpHandler {
    private static CProduto instancia;

    private CProduto() {
    }

    public static CProduto getInstancia() {
        if (instancia == null) {
            instancia = new CProduto();
        }
        return instancia;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
       String method = exchange.getRequestMethod();
       String path = exchange.getRequestURI().getPath();
       String query = exchange.getRequestURI().getQuery();

      try{
          Connection conn = ConexaoBD.getInstance().getConexao();
          String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        ResponseObject response =  switch(method.toUpperCase()){
          case "GET"     -> handleGet(conn, path, query);
          case "POST"    -> handlePost(conn, path, query, body);
          case "PUT"     -> handlePut(conn, path, body);
          case "DELETE"  -> handleDelete(conn, query);
          case "OPTIONS" -> handleOptions();
          default        -> naoEncontrado();
        };
        enviarResposta(exchange, response);
      }
      catch (Exception e){
        ResponseObject erro = new ResponseObject();
        erro.setStatus(ResponseObject.STATUS_FAIL);
        erro.setCode(ResponseObject.CODE_ERROR);
        erro.addMessage(TradutorErro.traduzir(e));
        enviarResposta(exchange, erro);
      }
    }

    private ResponseObject handleOptions() {
        ResponseObject r = new ResponseObject();
        r.setStatus(ResponseObject.STATUS_OK);
        r.setCode(ResponseObject.CODE_OK);
        return r;
    }

    private void enviarResposta(HttpExchange exchange, ResponseObject response) throws IOException {
        String json = response.toJson();
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
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

    public ResponseObject buscar(Connection conn, int qtd, String catProd, String nome, String op){
        ResponseObject response = new ResponseObject();
        try{
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.setResult(new Produto().buscar(conn, qtd, catProd, nome, op));
        }
        catch (Exception e){
            response.setStatus(ResponseObject.STATUS_FAIL);
            response.setCode(ResponseObject.CODE_ERROR);
            response.addMessage(TradutorErro.traduzir(e));
        }
        return response;
    }

    private ResponseObject handleGet(Connection conn, String path, String query) {
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
        return buscar(conn, qtd, catProd, nome, op);
    }

    private ResponseObject handlePost(Connection conn, String path, String query, String body) {
        String src = (query != null ? query : "") + "&" + body;
        return inserir(
            conn,
            parseSafeInt(param(src, "idCatProd")),
            param(src, "nome"),
            parseSafeFloat(param(src, "valorUni")),
            parseSafeInt(param(src, "qtdeAtual"))
        );
    }

    private ResponseObject handlePut(Connection conn, String path, String body) {
        if (path.equals("/produto"))
            return atualizar(
                conn,
                parseSafeInt(param(body, "idProd")),
                parseSafeInt(param(body, "idCatProd")),
                param(body, "nome"),
                parseSafeFloat(param(body, "valorUni")),
                parseSafeInt(param(body, "qtdeAtual"))
            );
        return naoEncontrado();
    }

    private ResponseObject handleDelete(Connection conn, String query) {
        return excluir(conn, parseSafeInt(param(query, "idProd")));
    }

    public ResponseObject inserir(Connection conn, int idCatProd, String nome, float valorUni, int qtdeAtual) {
        ResponseObject response = new ResponseObject();
        try {
            if (vazio(nome)) {
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "Nome é obrigatório.");
            }
            if (idCatProd <= 0){
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "Categoria do produto é obrigatória.");
            }

            Produto p = new Produto();
            if (p.existeNome(conn, nome.trim(), 0)){
                return falha(response, ResponseObject.CODE_CONFLICT, "Já existe um produto com esse nome.");
            }

            p.setIdCatProd(idCatProd);
            p.setNome(nome.trim());
            p.setValorUni(valorUni);
            p.setQtdeAtual(qtdeAtual);
            p.inserir(conn);

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

    public ResponseObject atualizar(Connection conn, int idProd, int idCatProd, String nome, float valorUni, int qtdeAtual) {
        ResponseObject response = new ResponseObject();
        try {
            if (vazio(nome)){
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "Nome é obrigatório.");
            }
            if (idCatProd <= 0) {
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "Categoria do produto é obrigatória.");
            }

            Produto p = new Produto().buscarPorId(conn, idProd);
            if (p == null) {
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Produto não encontrado.");
            }
            if (p.existeNome(conn, nome.trim(), idProd)){
                return falha(response, ResponseObject.CODE_CONFLICT, "Já existe outro produto com esse nome.");
            }

            p.setIdCatProd(idCatProd);
            p.setNome(nome.trim());
            p.setValorUni(valorUni);
            p.setQtdeAtual(qtdeAtual);
            p.atualizar(conn);

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

    public ResponseObject excluir(Connection conn, int id) {
        ResponseObject response = new ResponseObject();
        try {
            Produto p = new Produto().buscarPorId(conn, id);
            if (p == null) {
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Produto não encontrado.");
            }
            p.excluir(conn);
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
        r.addMessage(TradutorErro.traduzir(e));
    }

    private ResponseObject naoEncontrado() {
        ResponseObject response = new ResponseObject();
        response.setStatus(ResponseObject.STATUS_FAIL);
        response.setCode(ResponseObject.CODE_NOT_FOUND);
        response.addMessage("Endpoint não encontrado.");
        return response;
    }

}

