package agape.control;

import agape.dao.UsuarioDAO;
import agape.model.Usuario;
import agape.util.Criptografia;
import agape.util.ResponseObject;

public class CUsuario {

    private static CUsuario instancia;
    private UsuarioDAO dao;

    private CUsuario() {
        dao = new UsuarioDAO();
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
            u.setNivel("USER");

            dao.inserir(u);

            response.setStatus(ResponseObject.STATUS_OK);
            response.addMessage("Usuário cadastrado com sucesso");

        } catch (Exception e) {
            response.setStatus(ResponseObject.STATUS_FAIL);
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