package agape.control;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;

import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import agape.model.FormaPagamento;
import agape.util.ResponseObject;

public class CFormaPagamento implements HttpHandler {

    private static CFormaPagamento instancia;

    private CFormaPagamento() {}

    public static CFormaPagamento getInstancia() {
        if (instancia == null) instancia = new CFormaPagamento();
        return instancia;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        String path   = exchange.getRequestURI().getPath();
        String query  = exchange.getRequestURI().getQuery();

        if (method.equalsIgnoreCase("OPTIONS")) {
            enviarResposta(exchange, new ResponseObject());
            return;
        }

        try {
            Connection conn = ConexaoBD.getInstance().getConexao();
            String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);

            ResponseObject response = switch (method.toUpperCase()) {
                case "GET"    -> handleGet(conn, query);
                case "POST"   -> handlePost(conn, body);
                case "PUT"    -> handlePut(conn, path, body);
                case "DELETE" -> handleDelete(conn, query);
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

    private ResponseObject handleGet(Connection conn, String query) {
        String descricaoParam = param(query, "descricao");
        String ativoParam     = param(query, "ativo");

        String  descricao = descricaoParam.isEmpty() ? null : descricaoParam.trim();
        Boolean ativo     = ativoParam.isEmpty()     ? null : parseSafeBool(ativoParam);

        return buscar(conn, descricao, ativo);
    }

    private ResponseObject handlePost(Connection conn, String body) {
        return inserir(conn, param(body, "descricao"));
    }

    private ResponseObject handlePut(Connection conn, String path, String body) {
        if (path.equals("/formaPagamento"))
            return atualizar(
                conn,
                parseSafeInt(param(body, "idFormaPag")),
                param(body, "descricao"),
                parseSafeBool(param(body, "ativo"))
            );
        return naoEncontrado();
    }

    private ResponseObject handleDelete(Connection conn, String query) {
        return excluir(conn, parseSafeInt(param(query, "idFormaPag")));
    }

    public ResponseObject buscar(Connection conn, String descricao, Boolean ativo) {
        ResponseObject response = new ResponseObject();
        try {
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.setResult(new FormaPagamento().buscar(conn, descricao, ativo));
        } catch (Exception e) {
            erroInterno(response, e);
        }
        return response;
    }

    public ResponseObject inserir(Connection conn, String descricao) {
        ResponseObject response = new ResponseObject();
        try {
            if (vazio(descricao))
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "Descrição é obrigatória.");

            FormaPagamento f = new FormaPagamento();
            if (f.existeDescricao(conn, descricao.trim(), 0))
                return falha(response, ResponseObject.CODE_CONFLICT, "Já existe uma forma de pagamento com essa descrição.");

            f.setDescricao(descricao.trim());
            f.setAtivo(1);
            f.inserir(conn);

            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_CREATED);
            response.addMessage("Forma de pagamento cadastrada com sucesso.");
            response.setResult(f);
        } catch (Exception e) {
            erroInterno(response, e);
        }
        return response;
    }

    public ResponseObject atualizar(Connection conn, int id, String descricao, boolean ativo) {
        ResponseObject response = new ResponseObject();
        try {
            if (vazio(descricao))
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "Descrição é obrigatória.");

            FormaPagamento f = new FormaPagamento().buscarPorId(conn, id);
            if (f == null)
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Forma de pagamento não encontrada.");
            if (f.existeDescricao(conn, descricao.trim(), id))
                return falha(response, ResponseObject.CODE_CONFLICT, "Já existe outra forma de pagamento com essa descrição.");

            f.setDescricao(descricao.trim());
            f.setAtivo(ativo ? 1 : 0);
            f.atualizar(conn);

            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.addMessage("Forma de pagamento atualizada com sucesso.");
            response.setResult(f);
        } catch (Exception e) {
            erroInterno(response, e);
        }
        return response;
    }

    public ResponseObject excluir(Connection conn, int id) {
        ResponseObject response = new ResponseObject();
        try {
            FormaPagamento f = new FormaPagamento().buscarPorId(conn, id);
            if (f == null)
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Forma de pagamento não encontrada.");
            f.excluir(conn);
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.addMessage("Forma de pagamento excluída com sucesso.");
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
