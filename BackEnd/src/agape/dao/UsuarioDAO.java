package agape.dao;

import agape.model.Usuario;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class UsuarioDAO {

    private Usuario mapear(ResultSet rs) throws SQLException {
        Usuario u = new Usuario();
        u.setIdUsuario(rs.getInt("idUsuario"));
        u.setNome(rs.getString("nome"));
        u.setCpf(rs.getString("cpf"));
        u.setEmail(rs.getString("email"));
        u.setSenha(rs.getString("senha"));
        u.setStatus(rs.getInt("status"));
        u.setNivel(rs.getString("nivel"));

        Timestamp ativacao    = rs.getTimestamp("dataAtivacao");
        Timestamp desativacao = rs.getTimestamp("dataDesativacao");
        if (ativacao    != null) u.setDataAtivacao(ativacao.toLocalDateTime());
        if (desativacao != null) u.setDataDesativacao(desativacao.toLocalDateTime());

        return u;
    }

    public void inserir(Connection conn, Usuario u) throws Exception {
        String sql = "INSERT INTO Usuario (nome, cpf, email, senha, status, nivel, dataAtivacao) VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setString(1, u.getNome());
            stmt.setString(2, u.getCpf());
            stmt.setString(3, u.getEmail());
            stmt.setString(4, u.getSenha());
            stmt.setInt(5, u.getStatus());
            stmt.setString(6, u.getNivel());
            stmt.setObject(7, u.getDataAtivacao());
            stmt.executeUpdate();
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) u.setIdUsuario(rs.getInt(1));
            }
        }
    }

    public void atualizar(Connection conn, Usuario u) throws Exception {
        String sql = "UPDATE Usuario SET nome=?, cpf=?, email=?, status=?, nivel=? WHERE idUsuario=?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, u.getNome());
            stmt.setString(2, u.getCpf());
            stmt.setString(3, u.getEmail());
            stmt.setInt(4, u.getStatus());
            stmt.setString(5, u.getNivel());
            stmt.setInt(6, u.getIdUsuario());
            stmt.executeUpdate();
        }
    }

    public void ativar(Connection conn, int id) throws Exception {
        String sql = "UPDATE Usuario SET status=1, dataAtivacao=?, dataDesativacao=NULL WHERE idUsuario=?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setObject(1, LocalDateTime.now());
            stmt.setInt(2, id);
            stmt.executeUpdate();
        }
    }

    public void desativar(Connection conn, int id) throws Exception {
        String sql = "UPDATE Usuario SET status=0, dataDesativacao=? WHERE idUsuario=?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setObject(1, LocalDateTime.now());
            stmt.setInt(2, id);
            stmt.executeUpdate();
        }
    }

    public List<Usuario> listar(Connection conn) throws Exception {
        String sql = "SELECT * FROM Usuario ORDER BY nome";
        List<Usuario> lista = new ArrayList<>();
        try (PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) lista.add(mapear(rs));
        }
        return lista;
    }

    public Usuario buscarPorId(Connection conn, int id) throws Exception {
        String sql = "SELECT * FROM Usuario WHERE idUsuario=?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return mapear(rs);
            }
        }
        return null;
    }

    public Usuario buscarPorCpf(Connection conn, String cpf) throws Exception {
        String sql = "SELECT * FROM Usuario WHERE cpf=?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, cpf);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return mapear(rs);
            }
        }
        return null;
    }

    public Usuario buscarPorEmail(Connection conn, String email) throws Exception {
        String sql = "SELECT * FROM Usuario WHERE email=?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, email);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return mapear(rs);
            }
        }
        return null;
    }

    public boolean existeCpf(Connection conn, String cpf, int idExcluir) throws Exception {
        String sql = "SELECT 1 FROM Usuario WHERE cpf=? AND idUsuario<>?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, cpf);
            stmt.setInt(2, idExcluir);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        }
    }

    public boolean existeEmail(Connection conn, String email, int idExcluir) throws Exception {
        String sql = "SELECT 1 FROM Usuario WHERE email=? AND idUsuario<>?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, email);
            stmt.setInt(2, idExcluir);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        }
    }

    public int contarAdmAtivos(Connection conn) throws Exception {
        String sql = "SELECT COUNT(*) FROM Usuario WHERE nivel = 'ADM' AND status = 1";
        try (PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            if (rs.next()) return rs.getInt(1);
        }
        return 0;
    }

    public void excluir(Connection conn, int id) throws Exception {
        String sql = "DELETE FROM Usuario WHERE idUsuario = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, id);
            stmt.executeUpdate();
        }
    }
}
