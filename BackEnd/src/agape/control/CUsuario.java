package agape.control;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.time.LocalDateTime;

import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import agape.model.Usuario;
import agape.security.JWTTokenProvider;
import agape.util.Criptografia;
import agape.util.ResponseObject;

public class CUsuario implements HttpHandler {

    private static final String NIVEL_ADM    = "ADM";
    private static final String NIVEL_COLAB  = "COLAB";
    private static final String NIVEL_PAROQ  = "PAROQ";

    private static CUsuario instancia;

    private CUsuario() {
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
            Connection conn = ConexaoBD.getInstance().getConexao();
            String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);

            // Nível do solicitante: preenchido pelo AuthFilter (null em /login, que é pública).
            String requesterNivel = (String) exchange.getAttribute("usuarioNivel");

            ResponseObject response = switch (method.toUpperCase()) {
                case "GET"    -> handleGet(conn, path, query);
                case "POST"   -> handlePost(conn, path, body, query, requesterNivel);
                case "PUT"    -> handlePut(conn, path, body, requesterNivel);
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

    private ResponseObject handleGet(Connection conn, String path, String query) {
        String id    = param(query, "id");
        String cpf   = param(query, "cpf");
        String email = param(query, "email");

        if (!id.isEmpty())    return buscarPorId(conn, parseSafeInt(id));
        if (!cpf.isEmpty())   return buscarPorCpf(conn, cpf);
        if (!email.isEmpty()) return buscarPorEmail(conn, email);
        if (path.equals("/usuarios")) return listar(conn);

        return naoEncontrado();
    }

    private ResponseObject handlePost(Connection conn, String path, String body, String query, String requesterNivel) {
        String combined = (query != null ? query : "") + "&" + body;
        return switch (path) {
            case "/login"             -> login(conn, param(body, "email"), param(body, "senha"));
            case "/cadastrar",
                 "/usuarios"          -> cadastrar(
                                            conn,
                                            requesterNivel,
                                            param(body, "nome"),
                                            param(body, "cpf"),
                                            param(body, "email"),
                                            param(body, "senha"),
                                            param(body, "nivel"));
            case "/usuario/ativar"    -> ativar(conn, requesterNivel, parseSafeInt(param(combined, "id")));
            case "/usuario/desativar" -> desativar(conn, requesterNivel, parseSafeInt(param(combined, "id")));
            default -> naoEncontrado();
        };
    }

    private ResponseObject handlePut(Connection conn, String path, String body, String requesterNivel) {
        if (path.equals("/usuario")) {
            return atualizar(
                conn,
                requesterNivel,
                parseSafeInt(param(body, "id")),
                param(body, "nome"),
                param(body, "cpf"),
                param(body, "email"),
                param(body, "nivel")
            );
        }
        return naoEncontrado();
    }

    public ResponseObject cadastrar(Connection conn, String requesterNivel, String nome, String cpf, String email, String senha, String nivel) {
        ResponseObject response = new ResponseObject();
        try {
            if (vazio(nome) || vazio(cpf) || vazio(email) || vazio(senha) || vazio(nivel))
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "Todos os campos são obrigatórios.");

            String nivelNovo = nivel.trim().toUpperCase();

            // Regra: COLAB só pode cadastrar usuários com nível PAROQ.
            if (NIVEL_COLAB.equalsIgnoreCase(requesterNivel) && !NIVEL_PAROQ.equals(nivelNovo))
                return falha(response, ResponseObject.CODE_FORBIDDEN,
                        "Colaborador só pode cadastrar usuários com nível PAROQ.");

            Usuario u = new Usuario();
            if (u.existeCpf(conn, cpf.trim(), 0))
                return falha(response, ResponseObject.CODE_CONFLICT, "CPF já cadastrado.");
            if (u.existeEmail(conn, email.trim(), 0))
                return falha(response, ResponseObject.CODE_CONFLICT, "E-mail já cadastrado.");

            u.setNome(nome.trim());
            u.setCpf(cpf.trim());
            u.setEmail(email.trim());
            u.setSenha(Criptografia.hashSenha(senha));
            u.setNivel(nivelNovo);
            u.setStatus(1);
            u.setDataAtivacao(LocalDateTime.now());

            u.inserir(conn);

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

    public ResponseObject login(Connection conn, String email, String senha) {
        ResponseObject response = new ResponseObject();
        try {
            if (vazio(email) || vazio(senha))
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "E-mail e senha são obrigatórios.");

            Usuario u = new Usuario().buscarPorEmail(conn, email.trim());
            if (u == null)
                return falha(response, ResponseObject.CODE_UNAUTHORIZED, "Credenciais inválidas.");
            if (u.getStatus() == 0)
                return falha(response, ResponseObject.CODE_FORBIDDEN, "Usuário inativo.");
            if (!Criptografia.verificarSenha(senha, u.getSenha()))
                return falha(response, ResponseObject.CODE_UNAUTHORIZED, "Credenciais inválidas.");

            String token = JWTTokenProvider.createToken(u.getEmail(), u.getNivel());

            u.setSenha(null);
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.addMessage("Login realizado com sucesso.");
            response.setResult(new LoginResult(u, token));

        } catch (Exception e) {
            erroInterno(response);
        }
        return response;
    }

    public ResponseObject listar(Connection conn) {
        ResponseObject response = new ResponseObject();
        try {
            var lista = new Usuario().listar(conn);
            lista.forEach(u -> u.setSenha(null));
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.setResult(lista);
        } catch (Exception e) {
            erroInterno(response);
        }
        return response;
    }

    public ResponseObject buscarPorId(Connection conn, int id) {
        ResponseObject response = new ResponseObject();
        try {
            Usuario u = new Usuario().buscarPorId(conn, id);
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

    public ResponseObject buscarPorCpf(Connection conn, String cpf) {
        ResponseObject response = new ResponseObject();
        try {
            if (vazio(cpf))
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "CPF é obrigatório.");
            Usuario u = new Usuario().buscarPorCpf(conn, cpf.trim());
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

    public ResponseObject buscarPorEmail(Connection conn, String email) {
        ResponseObject response = new ResponseObject();
        try {
            if (vazio(email))
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "E-mail é obrigatório.");
            Usuario u = new Usuario().buscarPorEmail(conn, email.trim());
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

    public ResponseObject atualizar(Connection conn, String requesterNivel, int id, String nome, String cpf, String email, String nivel) {
        ResponseObject response = new ResponseObject();
        try {
            if (vazio(nome) || vazio(cpf) || vazio(email) || vazio(nivel))
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "Todos os campos são obrigatórios.");

            String nivelNovo = nivel.trim().toUpperCase();

            Usuario u = new Usuario().buscarPorId(conn, id);
            if (u == null)
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Usuário não encontrado.");

            // Regra: COLAB só pode alterar usuários PAROQ e só pode mantê-los PAROQ.
            if (NIVEL_COLAB.equalsIgnoreCase(requesterNivel)) {
                if (!NIVEL_PAROQ.equalsIgnoreCase(u.getNivel()))
                    return falha(response, ResponseObject.CODE_FORBIDDEN,
                            "Colaborador só pode alterar usuários com nível PAROQ.");
                if (!NIVEL_PAROQ.equals(nivelNovo))
                    return falha(response, ResponseObject.CODE_FORBIDDEN,
                            "Colaborador não pode alterar o nível para diferente de PAROQ.");
            }

            if (u.existeCpf(conn, cpf.trim(), id))
                return falha(response, ResponseObject.CODE_CONFLICT, "CPF já pertence a outro usuário.");
            if (u.existeEmail(conn, email.trim(), id))
                return falha(response, ResponseObject.CODE_CONFLICT, "E-mail já pertence a outro usuário.");

            u.setNome(nome.trim());
            u.setCpf(cpf.trim());
            u.setEmail(email.trim());
            u.setNivel(nivelNovo);
            u.atualizar(conn);

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

    public ResponseObject ativar(Connection conn, String requesterNivel, int id) {
        ResponseObject response = new ResponseObject();
        try {
            Usuario u = new Usuario().buscarPorId(conn, id);
            if (u == null)
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Usuário não encontrado.");

            if (NIVEL_COLAB.equalsIgnoreCase(requesterNivel) && !NIVEL_PAROQ.equalsIgnoreCase(u.getNivel()))
                return falha(response, ResponseObject.CODE_FORBIDDEN,
                        "Colaborador só pode ativar usuários com nível PAROQ.");

            u.ativar(conn);
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.addMessage("Usuário ativado com sucesso.");
        } catch (Exception e) {
            erroInterno(response);
        }
        return response;
    }

    public ResponseObject desativar(Connection conn, String requesterNivel, int id) {
        ResponseObject response = new ResponseObject();
        try {
            Usuario u = new Usuario().buscarPorId(conn, id);
            if (u == null)
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Usuário não encontrado.");

            if (NIVEL_COLAB.equalsIgnoreCase(requesterNivel) && !NIVEL_PAROQ.equalsIgnoreCase(u.getNivel()))
                return falha(response, ResponseObject.CODE_FORBIDDEN,
                        "Colaborador só pode desativar usuários com nível PAROQ.");

            u.desativar(conn);
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.addMessage("Usuário desativado com sucesso.");
        } catch (Exception e) {
            erroInterno(response);
        }
        return response;
    }

    /** Resultado de /login: usuário + token JWT, serializado via toJson() pelo ResponseObject. */
    public static class LoginResult {
        private final Usuario usuario;
        private final String token;

        LoginResult(Usuario usuario, String token) {
            this.usuario = usuario;
            this.token = token;
        }

        public String toJson() {
            return "{" +
                    "\"token\":\"" + token + "\"," +
                    "\"usuario\":" + usuario.toJson() +
                    "}";
        }
    }

    private void enviarResposta(HttpExchange exchange, ResponseObject response) throws IOException {
        String json  = response.toJson();
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);

        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
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
