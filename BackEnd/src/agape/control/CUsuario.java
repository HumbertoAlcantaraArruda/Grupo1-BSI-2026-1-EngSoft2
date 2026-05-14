package agape.control;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import agape.dao.UsuarioDAO;
import agape.model.Usuario;
import agape.util.Criptografia;
import agape.util.ResponseObject;

public class CUsuario implements HttpHandler {

    private static CUsuario instancia;
    private final UsuarioDAO dao;

    private CUsuario() {
        this.dao = new UsuarioDAO();
    }

    public static CUsuario getInstancia() {
        if (instancia == null) instancia = new CUsuario();
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
            String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);

            ResponseObject response = switch (method.toUpperCase()) {
                case "GET"    -> handleGet(path, query);
                case "POST"   -> handlePost(path, body, query);
                case "PUT"    -> handlePut(path, body);
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
        String id    = param(query, "id");
        String cpf   = param(query, "cpf");
        String email = param(query, "email");

        if (!id.isEmpty())    return buscarPorId(parseSafeInt(id));
        if (!cpf.isEmpty())   return buscarPorCpf(cpf);
        if (!email.isEmpty()) return buscarPorEmail(email);
        if (path.equals("/usuarios")) return listar();

        return naoEncontrado();
    }

    // ── POST ──────────────────────────────────────────────────────────────────

    private ResponseObject handlePost(String path, String body, String query) {
        String combined = (query != null ? query : "") + "&" + body;
        return switch (path) {
            case "/login"             -> login(param(body, "email"), param(body, "senha"));
            case "/cadastrar",
                 "/usuarios"          -> cadastrar(
                                            param(body, "nome"),
                                            param(body, "cpf"),
                                            param(body, "email"),
                                            param(body, "senha"),
                                            param(body, "nivel"));
            case "/usuario/ativar"    -> ativar(parseSafeInt(param(combined, "id")));
            case "/usuario/desativar" -> desativar(parseSafeInt(param(combined, "id")));
            default -> naoEncontrado();
        };
    }

    // ── PUT ───────────────────────────────────────────────────────────────────

    private ResponseObject handlePut(String path, String body) {
        if (path.equals("/usuario")) {
            return atualizar(
                parseSafeInt(param(body, "id")),
                param(body, "nome"),
                param(body, "cpf"),
                param(body, "email"),
                param(body, "nivel")
            );
        }
        return naoEncontrado();
    }

    // ── operações ─────────────────────────────────────────────────────────────

    public ResponseObject cadastrar(String nome, String cpf, String email, String senha, String nivel) {
        ResponseObject response = new ResponseObject();
        try {
            if (vazio(nome) || vazio(cpf) || vazio(email) || vazio(senha) || vazio(nivel))
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "Todos os campos são obrigatórios.");
            if (dao.existeCpf(cpf.trim(), 0))
                return falha(response, ResponseObject.CODE_CONFLICT, "CPF já cadastrado.");
            if (dao.existeEmail(email.trim(), 0))
                return falha(response, ResponseObject.CODE_CONFLICT, "E-mail já cadastrado.");

            Usuario u = new Usuario();
            u.setNome(nome.trim());
            u.setCpf(cpf.trim());
            u.setEmail(email.trim());
            u.setSenha(Criptografia.hashSenha(senha));
            u.setNivel(nivel.trim().toUpperCase());
            u.setStatus(1);
            u.setDataAtivacao(LocalDateTime.now());

            dao.inserir(u);

            u.setSenha(null);
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_CREATED);
            response.addMessage("Usuário cadastrado com sucesso.");
            response.setResult(u);

        } catch (Exception e) {
            erroInterno(response);
        }
        return response;
    }

    public ResponseObject login(String email, String senha) {
        ResponseObject response = new ResponseObject();
        try {
            if (vazio(email) || vazio(senha))
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "E-mail e senha são obrigatórios.");

            Usuario u = dao.buscarPorEmail(email.trim());
            if (u == null)
                return falha(response, ResponseObject.CODE_UNAUTHORIZED, "Credenciais inválidas.");
            if (u.getStatus() == 0)
                return falha(response, ResponseObject.CODE_FORBIDDEN, "Usuário inativo.");
            if (!u.getSenha().equals(Criptografia.hashSenha(senha)))
                return falha(response, ResponseObject.CODE_UNAUTHORIZED, "Credenciais inválidas.");

            u.setSenha(null);
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.addMessage("Login realizado com sucesso.");
            response.setResult(u);

        } catch (Exception e) {
            erroInterno(response);
        }
        return response;
    }

    public ResponseObject listar() {
        ResponseObject response = new ResponseObject();
        try {
            var lista = dao.listar();
            lista.forEach(u -> u.setSenha(null));
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.setResult(lista);
        } catch (Exception e) {
            erroInterno(response);
        }
        return response;
    }

    public ResponseObject buscarPorId(int id) {
        ResponseObject response = new ResponseObject();
        try {
            Usuario u = dao.buscarPorId(id);
            if (u == null)
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Usuário não encontrado.");
            u.setSenha(null);
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.setResult(u);
        } catch (Exception e) {
            erroInterno(response);
        }
        return response;
    }

    public ResponseObject buscarPorCpf(String cpf) {
        ResponseObject response = new ResponseObject();
        try {
            if (vazio(cpf))
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "CPF é obrigatório.");
            Usuario u = dao.buscarPorCpf(cpf.trim());
            if (u == null)
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Usuário não encontrado.");
            u.setSenha(null);
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.setResult(u);
        } catch (Exception e) {
            erroInterno(response);
        }
        return response;
    }

    public ResponseObject buscarPorEmail(String email) {
        ResponseObject response = new ResponseObject();
        try {
            if (vazio(email))
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "E-mail é obrigatório.");
            Usuario u = dao.buscarPorEmail(email.trim());
            if (u == null)
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Usuário não encontrado.");
            u.setSenha(null);
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.setResult(u);
        } catch (Exception e) {
            erroInterno(response);
        }
        return response;
    }

    public ResponseObject atualizar(int id, String nome, String cpf, String email, String nivel) {
        ResponseObject response = new ResponseObject();
        try {
            if (vazio(nome) || vazio(cpf) || vazio(email) || vazio(nivel))
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "Todos os campos são obrigatórios.");

            Usuario u = dao.buscarPorId(id);
            if (u == null)
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Usuário não encontrado.");
            if (dao.existeCpf(cpf.trim(), id))
                return falha(response, ResponseObject.CODE_CONFLICT, "CPF já pertence a outro usuário.");
            if (dao.existeEmail(email.trim(), id))
                return falha(response, ResponseObject.CODE_CONFLICT, "E-mail já pertence a outro usuário.");

            u.setNome(nome.trim());
            u.setCpf(cpf.trim());
            u.setEmail(email.trim());
            u.setNivel(nivel.trim().toUpperCase());
            dao.atualizar(u);

            u.setSenha(null);
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.addMessage("Usuário atualizado com sucesso.");
            response.setResult(u);

        } catch (Exception e) {
            erroInterno(response);
        }
        return response;
    }

    public ResponseObject ativar(int id) {
        ResponseObject response = new ResponseObject();
        try {
            if (dao.buscarPorId(id) == null)
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Usuário não encontrado.");
            dao.ativar(id);
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.addMessage("Usuário ativado com sucesso.");
        } catch (Exception e) {
            erroInterno(response);
        }
        return response;
    }

    public ResponseObject desativar(int id) {
        ResponseObject response = new ResponseObject();
        try {
            if (dao.buscarPorId(id) == null)
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Usuário não encontrado.");
            dao.desativar(id);
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.addMessage("Usuário desativado com sucesso.");
        } catch (Exception e) {
            erroInterno(response);
        }
        return response;
    }

    // ── utilitários HTTP ──────────────────────────────────────────────────────

    private void enviarResposta(HttpExchange exchange, ResponseObject response) throws IOException {
        String json  = response.toJson();
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);

        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
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

    private boolean vazio(String s) {
        return s == null || s.trim().isEmpty();
    }

    private ResponseObject falha(ResponseObject r, int code, String msg) {
        r.setStatus(ResponseObject.STATUS_FAIL);
        r.setCode(code);
        r.addMessage(msg);
        return r;
    }

    private void erroInterno(ResponseObject r) {
        r.setStatus(ResponseObject.STATUS_FAIL);
        r.setCode(ResponseObject.CODE_ERROR);
        r.addMessage("Erro interno do servidor.");
    }

    private ResponseObject naoEncontrado() {
        ResponseObject r = new ResponseObject();
        r.setStatus(ResponseObject.STATUS_FAIL);
        r.setCode(ResponseObject.CODE_NOT_FOUND);
        r.addMessage("Endpoint não encontrado.");
        return r;
    }
}
