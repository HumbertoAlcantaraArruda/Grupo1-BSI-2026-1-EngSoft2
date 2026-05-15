package agape.control;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import agape.dao.CategoriaEventoDAO;
import agape.model.CategoriaEvento;
import agape.util.ResponseObject;

public class CCategoriaEvento implements HttpHandler {

    private static CCategoriaEvento instancia;
    private final CategoriaEventoDAO dao;

    private CCategoriaEvento() {
        this.dao = new CategoriaEventoDAO();
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
            String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);

            ResponseObject response = switch (method.toUpperCase()) {
                case "GET"    -> handleGet(path, query);
                case "POST"   -> handlePost(body);
                case "PUT"    -> handlePut(path, body);
                case "DELETE" -> handleDelete(query);
                default       -> naoEncontrado();
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

    // ── GET ───────────────────────────────────────────────────────────────────

    private ResponseObject handleGet(String path, String query) {
        String nomeParam  = param(query, "nome");
        String ativoParam = param(query, "ativo");

        String  nome  = nomeParam.isEmpty()  ? null : nomeParam.trim();
        Boolean ativo = ativoParam.isEmpty() ? null : parseSafeBool(ativoParam);

        return buscar(nome, ativo);
    }

    // ── POST ──────────────────────────────────────────────────────────────────

    private ResponseObject handlePost(String body) {
        String ativoStr = param(body, "ativo");
        boolean ativo   = ativoStr.isEmpty() || parseSafeBool(ativoStr);
        return inserir(param(body, "nome"), ativo);
    }

    // ── PUT ───────────────────────────────────────────────────────────────────

    private ResponseObject handlePut(String path, String body) {
        if (path.equals("/categoriaEvento"))
            return atualizar(parseSafeInt(param(body, "id")), param(body, "nome"), parseSafeBool(param(body, "ativo")));
        return naoEncontrado();
    }

    // ── DELETE ────────────────────────────────────────────────────────────────

    private ResponseObject handleDelete(String query) {
        return excluir(parseSafeInt(param(query, "id")));
    }

    // ── operações ─────────────────────────────────────────────────────────────

    public ResponseObject buscar(String nome, Boolean ativo) {
        ResponseObject response = new ResponseObject();
        try {
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.setResult(dao.buscar(nome, ativo));
        } catch (Exception e) {
            erroInterno(response, e);
        }
        return response;
    }

    public ResponseObject inserir(String nome, boolean ativo) {
        ResponseObject response = new ResponseObject();
        try {
            if (vazio(nome))
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "Nome é obrigatório.");
            if (dao.existeNome(nome.trim(), 0))
                return falha(response, ResponseObject.CODE_CONFLICT, "Já existe uma categoria com esse nome.");

            CategoriaEvento c = new CategoriaEvento();
            c.setNome(nome.trim());
            c.setAtivo(ativo);
            dao.inserir(c);

            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_CREATED);
            response.addMessage("Categoria cadastrada com sucesso.");
            response.setResult(c);
        } catch (Exception e) {
            erroInterno(response, e);
        }
        return response;
    }

    public ResponseObject atualizar(int id, String nome, boolean ativo) {
        ResponseObject response = new ResponseObject();
        try {
            if (vazio(nome))
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "Nome é obrigatório.");

            CategoriaEvento c = dao.buscarPorId(id);
            if (c == null)
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Categoria não encontrada.");
            if (dao.existeNome(nome.trim(), id))
                return falha(response, ResponseObject.CODE_CONFLICT, "Já existe outra categoria com esse nome.");

            c.setNome(nome.trim());
            c.setAtivo(ativo);
            dao.atualizar(c);

            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.addMessage("Categoria atualizada com sucesso.");
            response.setResult(c);
        } catch (Exception e) {
            erroInterno(response, e);
        }
        return response;
    }

    public ResponseObject excluir(int id) {
        ResponseObject response = new ResponseObject();
        try {
            if (dao.buscarPorId(id) == null)
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Categoria não encontrada.");
            dao.excluir(id);
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.addMessage("Categoria excluída com sucesso.");
        } catch (Exception e) {
            erroInterno(response, e);
        }
        return response;
    }

    // ── utilitários HTTP ──────────────────────────────────────────────────────

    private void enviarResposta(HttpExchange exchange, ResponseObject response) throws IOException {
        String json  = response.toJson();
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);

        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");

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
