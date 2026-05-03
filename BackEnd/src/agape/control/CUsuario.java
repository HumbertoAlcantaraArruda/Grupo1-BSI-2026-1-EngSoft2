package agape.control;

import java.io.IOException;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import agape.dao.UsuarioDAO;
import agape.model.Usuario;
import agape.util.Criptografia;
import agape.util.ResponseObject;

public class CUsuario implements HttpHandler {

    private static CUsuario instancia;
    private UsuarioDAO dao;

    // private CUsuario() {
    // dao = new UsuarioDAO();
    // }

    private void enviarResposta(HttpExchange exchange, ResponseObject response) throws IOException {
        String json = response.toJson();
        byte[] bytes = json.getBytes("UTF-8");

        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(response.getCode(), bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }

    private String extrairParam(String body, String chave) {
        for (String par : body.split("&")) {
            String[] kv = par.split("=");
            if (kv[0].equals(chave))
                return kv.length > 1 ? kv[1] : "";
        }
        return "";
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        if (method.equalsIgnoreCase("POST") && path.equals("/login")) {
            // Lógica de login
            // Exemplo: parse do corpo da requisição, chamar método de login e retornar
            // resposta
        } else if (method.equalsIgnoreCase("POST") && path.equals("/cadastrar")) {

            String body = new String(exchange.getRequestBody().readAllBytes());

            String nome = extrairParam(body, "nome");
            String cpf = extrairParam(body, "cpf");
            String email = extrairParam(body, "email");
            String senha = extrairParam(body, "senha");

            ResponseObject response = cadastrar(nome, cpf, email, senha);
            enviarResposta(exchange, response);

        } else {
            String response = "Endpoint não encontrado";
            exchange.sendResponseHeaders(404, response.length());
            exchange.getResponseBody().write(response.getBytes());
            exchange.close();
        }
    }

    public static CUsuario getInstancia() {
        if (instancia == null) {
            instancia = new CUsuario();
        }
        return instancia;
    }

    // CADASTRO
    public ResponseObject cadastrar(String nome, String cpf, String email, String senha) {

        ResponseObject response = new ResponseObject();

        try {
            String senhaHash = Criptografia.hashSenha(senha);

            Usuario u = new Usuario();
            u.setNome(nome);
            u.setCpf(cpf);
            u.setEmail(email);
            u.setSenha(senhaHash);
            u.setStatus(1);
            u.setNivel("ADM");

            dao.inserir(u);

            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.addMessage("Usuário cadastrado com sucesso");
            response.setResult(u);

        } catch (Exception e) {
            response.setStatus(ResponseObject.STATUS_FAIL);
            response.setCode(ResponseObject.CODE_FAILED);
            response.addMessage("Erro ao cadastrar usuário");
        }

        return response;
    }

    // LOGIN
    public ResponseObject login(String email, String senha) {

        ResponseObject response = new ResponseObject();

        try {
            Usuario u = dao.buscarPorEmail(email);

            if (u == null) {
                response.setStatus(ResponseObject.STATUS_FAIL);
                response.addMessage("Usuário não encontrado");
                return response;
            }

            String senhaHash = Criptografia.hashSenha(senha);

            if (!u.getSenha().equals(senhaHash)) {
                response.setStatus(ResponseObject.STATUS_FAIL);
                response.addMessage("Senha inválida");
                return response;
            }

            response.setStatus(ResponseObject.STATUS_OK);
            response.addMessage("Login realizado com sucesso");
            response.setResult(u);

        } catch (Exception e) {
            response.setStatus(ResponseObject.STATUS_FAIL);
            response.addMessage("Erro ao realizar login");
        }

        return response;
    }
}