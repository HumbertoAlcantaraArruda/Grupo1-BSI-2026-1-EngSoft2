package agape.control;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import agape.model.Fornecedor;
import agape.util.ResponseObject;

public class CFornecedor implements HttpHandler {

    private static CFornecedor instancia;

    private CFornecedor() {
    }

    public static CFornecedor getInstancia() {
        if (instancia == null) instancia = new CFornecedor();
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
                case "GET"     -> handleGet(conn, query);
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

    private ResponseObject handleGet(Connection conn, String query) {
        String nomeParam  = param(query, "nome");
        String ativoParam = param(query, "ativo");
        String nome   = nomeParam.isEmpty()  ? null : nomeParam.trim();
        Integer ativo = ativoParam.isEmpty() ? null : parseSafeInt(ativoParam);
        return buscar(conn, nome, ativo);
    }

    private ResponseObject handlePost(Connection conn, String body) {
        return inserir(
            conn,
            param(body, "nome"),
            param(body, "telefone1"),
            param(body, "telefone2"),
            param(body, "email"),
            param(body, "site"),
            param(body, "contato"),
            param(body, "cep"),
            param(body, "logradouro"),
            param(body, "cnpj"),
            param(body, "cidade"),
            param(body, "uf"),
            param(body, "obs"),
            parseSafeInt(param(body, "ativo"))
        );
    }

    private ResponseObject handlePut(Connection conn, String path, String body) {
        if (path.equals("/fornecedor"))
            return atualizar(
                conn,
                parseSafeInt(param(body, "idFornec")),
                param(body, "nome"),
                param(body, "telefone1"),
                param(body, "telefone2"),
                param(body, "email"),
                param(body, "site"),
                param(body, "contato"),
                param(body, "cep"),
                param(body, "logradouro"),
                param(body, "cnpj"),
                param(body, "cidade"),
                param(body, "uf"),
                param(body, "obs"),
                parseSafeInt(param(body, "ativo"))
            );
        return naoEncontrado();
    }

    private ResponseObject handleDelete(Connection conn, String query) {
        return excluir(conn, parseSafeInt(param(query, "idFornec")));
    }

    public ResponseObject buscar(Connection conn, String nome, Integer ativo) {
        ResponseObject response = new ResponseObject();
        try {
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.setResult(new Fornecedor().buscar(conn, nome, ativo));
        } catch (Exception e) {
            erroInterno(response, e);
        }
        return response;
    }

    public ResponseObject inserir(Connection conn, String nome, String telefone1, String telefone2,
                                   String email, String site, String contato, String cep,
                                   String logradouro, String cnpj, String cidade, String uf,
                                   String obs, int ativo) {
        ResponseObject response = new ResponseObject();
        try {
            if (vazio(nome))
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "Nome é obrigatório.");

            Fornecedor f = new Fornecedor();
            if (f.existeNome(conn, nome.trim(), 0))
                return falha(response, ResponseObject.CODE_CONFLICT, "Já existe um fornecedor com esse nome.");

            f.setNome(nome.trim());
            f.setTelefone1(vazio(telefone1)  ? null : telefone1.trim());
            f.setTelefone2(vazio(telefone2)  ? null : telefone2.trim());
            f.setEmail(vazio(email)          ? null : email.trim());
            f.setSite(vazio(site)            ? null : site.trim());
            f.setContato(vazio(contato)      ? null : contato.trim());
            f.setCep(vazio(cep)              ? null : cep.trim());
            f.setLogradouro(vazio(logradouro)? null : logradouro.trim());
            f.setCnpj(vazio(cnpj)            ? null : cnpj.trim());
            f.setCidade(vazio(cidade)        ? null : cidade.trim());
            f.setUf(vazio(uf)                ? null : uf.trim().toUpperCase());
            f.setObs(vazio(obs)              ? null : obs.trim());
            f.setAtivo(ativo);
            f.inserir(conn);

            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_CREATED);
            response.addMessage("Fornecedor cadastrado com sucesso.");
            response.setResult(f);
        } catch (Exception e) {
            erroInterno(response, e);
        }
        return response;
    }

    public ResponseObject atualizar(Connection conn, int idFornec, String nome, String telefone1,
                                     String telefone2, String email, String site, String contato,
                                     String cep, String logradouro, String cnpj, String cidade,
                                     String uf, String obs, int ativo) {
        ResponseObject response = new ResponseObject();
        try {
            if (vazio(nome))
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "Nome é obrigatório.");

            Fornecedor f = new Fornecedor().buscarPorId(conn, idFornec);
            if (f == null)
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Fornecedor não encontrado.");
            if (f.existeNome(conn, nome.trim(), idFornec))
                return falha(response, ResponseObject.CODE_CONFLICT, "Já existe outro fornecedor com esse nome.");

            f.setNome(nome.trim());
            f.setTelefone1(vazio(telefone1)  ? null : telefone1.trim());
            f.setTelefone2(vazio(telefone2)  ? null : telefone2.trim());
            f.setEmail(vazio(email)          ? null : email.trim());
            f.setSite(vazio(site)            ? null : site.trim());
            f.setContato(vazio(contato)      ? null : contato.trim());
            f.setCep(vazio(cep)              ? null : cep.trim());
            f.setLogradouro(vazio(logradouro)? null : logradouro.trim());
            f.setCnpj(vazio(cnpj)            ? null : cnpj.trim());
            f.setCidade(vazio(cidade)        ? null : cidade.trim());
            f.setUf(vazio(uf)                ? null : uf.trim().toUpperCase());
            f.setObs(vazio(obs)              ? null : obs.trim());
            f.setAtivo(ativo);
            f.atualizar(conn);

            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.addMessage("Fornecedor atualizado com sucesso.");
            response.setResult(f);
        } catch (Exception e) {
            erroInterno(response, e);
        }
        return response;
    }

    public ResponseObject excluir(Connection conn, int id) {
        ResponseObject response = new ResponseObject();
        try {
            Fornecedor f = new Fornecedor().buscarPorId(conn, id);
            if (f == null)
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Fornecedor não encontrado.");
            f.excluir(conn);
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.addMessage("Fornecedor excluído com sucesso.");
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
