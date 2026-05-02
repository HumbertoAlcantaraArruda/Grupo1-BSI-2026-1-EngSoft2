package agape.dao;

import agape.model.Usuario;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class UsuarioDAO {

    public void inserir(Usuario u) {

        String sql = "INSERT INTO usuario (nome, cpf, email, senha, status, nivel) VALUES (?, ?, ?, ?, ?, ?)";

        try {
            Connection conn = ConexaoBD.getConexao();

            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, u.getNome());
            stmt.setString(2, u.getCpf());
            stmt.setString(3, u.getEmail());
            stmt.setString(4, u.getSenha());
            stmt.setInt(5, u.getStatus());
            stmt.setString(6, u.getNivel());

            stmt.executeUpdate();
            stmt.close();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public Usuario buscarPorEmail(String email) {

        String sql = "SELECT * FROM usuario WHERE email = ?";

        try {
            Connection conn = ConexaoBD.getConexao();

            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, email);

            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                Usuario u = new Usuario();

                u.setIdUsuario(rs.getInt("idUsuario"));
                u.setNome(rs.getString("nome"));
                u.setCpf(rs.getString("cpf"));
                u.setEmail(rs.getString("email"));
                u.setSenha(rs.getString("senha"));
                u.setStatus(rs.getInt("status"));
                u.setNivel(rs.getString("nivel"));

                return u;
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return null;
    }
}