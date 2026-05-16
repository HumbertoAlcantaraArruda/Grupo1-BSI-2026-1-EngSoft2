package agape.control;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;

import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import agape.model.CategoriaEvento;
import agape.util.ResponseObject;

public class CCategoriaEvento implements HttpHandler {

    private static CCategoriaEvento instancia;

    private CCategoriaEvento() {
    }

    public static CCategoriaEvento getInstancia() {
        if (instancia == null) instancia = new CCategoriaEvento();
        return instancia;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        String path   = exchange.getRequestURI().getPath();
        String query  = exchange.getRequestURI().getQuery();

        try {
            Connection conn = ConexaoBD.getInstance().getConexao();
            String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);

            ResponseObject response = switch (method.toUpperCase()) {
                case "GET"     -> handleGet(conn, path, query);
                case "POST"    -> handlePost(conn, body);
                case "PUT"     -> handlePut(conn, path, body);
                case "DELETE"  -> handleDelete(conn, query);
                case "OPTIONS" -> handleOptions();
                default        -> naoEncontrado();
            };

            enviarResposta(exchange, response);

        } catch (Exception e) {
            ResponseObject erro = new ResponseObject();
            erro.setStatus(ResponseObject.STATUS_FAIL);
            erro.setCode(ResponseObject.CODE_ERROR);
            erro.addMessage("Erro inesperado: " + e.getMessage());
            enviarResposta(exchange, erro);
        }
    }

    private ResponseObject handleOptions() {
        ResponseObject r = new ResponseObject();
        r.setStatus(ResponseObject.STATUS_OK);
        r.setCode(ResponseObject.CODE_OK);
        return r;
    }

    private ResponseObject handleGet(Connection conn, String path, String query) {
        String nomeParam  = param(query, "nome");
        String ativoParam = param(query, "ativo");

        String  nome  = nomeParam.isEmpty()  ? null : nomeParam.trim();
        Boolean ativo = ativoParam.isEmpty() ? null : parseSafeBool(ativoParam);

        return buscar(conn, nome, ativo);
    }

    private ResponseObject handlePost(Connection conn, String body) {
        String ativoStr = param(body, "ativo");
        boolean ativo   = ativoStr.isEmpty() || parseSafeBool(ativoStr);
        return inserir(conn, param(body, "nome"), ativo);
    }

    private ResponseObject handlePut(Connection conn, String path, String body) {
        if (path.equals("/categoriaEvento"))
            return atualizar(conn, parseSafeInt(param(body, "idCatEvento")), param(body, "nome"), parseSafeBool(param(body, "ativo")));
        return naoEncontrado();
    }

    private ResponseObject handleDelete(Connection conn, String query) {
        return excluir(conn, parseSafeInt(param(query, "idCatEvento")));
    }

    public ResponseObject buscar(Connection conn, String nome, Boolean ativo) {
        ResponseObject response = new ResponseObject();
        try {
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.setResult(new CategoriaEvento().buscar(conn, nome, ativo));
        } catch (Exception e) {
            erroInterno(response, e);
        }
        return response;
    }

    public ResponseObject inserir(Connection conn, String nome, boolean ativo) {
        ResponseObject response = new ResponseObject();
        try {
            if (vazio(nome))
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "Nome é obrigatório.");

            CategoriaEvento c = new CategoriaEvento();
            if (c.existeNome(conn, nome.trim(), 0))
                return falha(response, ResponseObject.CODE_CONFLICT, "Já existe uma categoria com esse nome.");

            c.setNome(nome.trim());
            c.setAtivo(ativo);
            c.inserir(conn);

            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_CREATED);
            response.addMessage("Categoria cadastrada com sucesso.");
            response.setResult(c);
        } catch (Exception e) {
            erroInterno(response, e);
        }
        return response;
    }

    public ResponseObject atualizar(Connection conn, int id, String nome, boolean ativo) {
        ResponseObject response = new ResponseObject();
        try {
            if (vazio(nome))
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "Nome é obrigatório.");

            CategoriaEvento c = new CategoriaEvento().buscarPorId(conn, id);
            if (c == null)
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Categoria não encontrada.");
            if (c.existeNome(conn, nome.trim(), id))
                return falha(response, ResponseObject.CODE_CONFLICT, "Já existe outra categoria com esse nome.");

            c.setNome(nome.trim());
            c.setAtivo(ativo);
            c.atualizar(conn);

            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.addMessage("Categoria atualizada com sucesso.");
            response.setResult(c);
        } catch (Exception e) {
            erroInterno(response, e);
        }
        return response;
    }

    public ResponseObject excluir(Connection conn, int id) {
        ResponseObject response = new ResponseObject();
        try {
            CategoriaEvento c = new CategoriaEvento().buscarPorId(conn, id);
            if (c == null)
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Categoria não encontrada.");
            c.excluir(conn);
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.addMessage("Categoria excluída com sucesso.");
        } catch (Exception e) {
            erroInterno(response, e);
        }
        return response;
    }

    private void enviarResposta(HttpExchange exchange, ResponseObject response) throws IOException {
        String json  = response.toJson();
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

    private int parseSafeInt(String val) {
        try { return Integer.parseInt(val.trim()); } catch (Exception e) { return 0; }
    }

    private boolean parseSafeBool(String val) {
        return "true".equalsIgnoreCase(val) || "1".equals(val);
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
        ResponseObject r = new ResponseObject();
        r.setStatus(ResponseObject.STATUS_FAIL);
        r.setCode(ResponseObject.CODE_NOT_FOUND);
        r.addMessage("Endpoint não encontrado.");
        return r;
    }
}
