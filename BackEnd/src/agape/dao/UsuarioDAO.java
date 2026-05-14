package agape.dao;

import agape.control.ConexaoBD;
import agape.model.Usuario;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class UsuarioDAO {

    private Connection getConn() {
        return ConexaoBD.getInstance().getConexao();
    }

    // ── mapeamento ────────────────────────────────────────────────────────────

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

    // ── escrita ───────────────────────────────────────────────────────────────

    public void inserir(Usuario u) throws Exception {
        String sql = "INSERT INTO usuario (nome, cpf, email, senha, status, nivel, dataAtivacao) VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement stmt = getConn().prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
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

    public void atualizar(Usuario u) throws Exception {
        String sql = "UPDATE usuario SET nome=?, cpf=?, email=?, status=?, nivel=? WHERE idUsuario=?";
        try (PreparedStatement stmt = getConn().prepareStatement(sql)) {
            stmt.setString(1, u.getNome());
            stmt.setString(2, u.getCpf());
            stmt.setString(3, u.getEmail());
            stmt.setInt(4, u.getStatus());
            stmt.setString(5, u.getNivel());
            stmt.setInt(6, u.getIdUsuario());
            stmt.executeUpdate();
        }
    }

    public void ativar(int id) throws Exception {
        String sql = "UPDATE usuario SET status=1, dataAtivacao=?, dataDesativacao=NULL WHERE idUsuario=?";
        try (PreparedStatement stmt = getConn().prepareStatement(sql)) {
            stmt.setObject(1, LocalDateTime.now());
            stmt.setInt(2, id);
            stmt.executeUpdate();
        }
    }

    public void desativar(int id) throws Exception {
        String sql = "UPDATE usuario SET status=0, dataDesativacao=? WHERE idUsuario=?";
        try (PreparedStatement stmt = getConn().prepareStatement(sql)) {
            stmt.setObject(1, LocalDateTime.now());
            stmt.setInt(2, id);
            stmt.executeUpdate();
        }
    }

    // ── leitura ───────────────────────────────────────────────────────────────

    public List<Usuario> listar() throws Exception {
        String sql = "SELECT * FROM usuario ORDER BY nome";
        List<Usuario> lista = new ArrayList<>();
        try (PreparedStatement stmt = getConn().prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) lista.add(mapear(rs));
        }
        return lista;
    }

    public Usuario buscarPorId(int id) throws Exception {
        String sql = "SELECT * FROM usuario WHERE idUsuario=?";
        try (PreparedStatement stmt = getConn().prepareStatement(sql)) {
            stmt.setInt(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return mapear(rs);
            }
        }
        return null;
    }

    public Usuario buscarPorCpf(String cpf) throws Exception {
        String sql = "SELECT * FROM usuario WHERE cpf=?";
        try (PreparedStatement stmt = getConn().prepareStatement(sql)) {
            stmt.setString(1, cpf);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return mapear(rs);
            }
        }
        return null;
    }

    public Usuario buscarPorEmail(String email) throws Exception {
        String sql = "SELECT * FROM usuario WHERE email=?";
        try (PreparedStatement stmt = getConn().prepareStatement(sql)) {
            stmt.setString(1, email);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return mapear(rs);
            }
        }
        return null;
    }

    // ── verificações de unicidade ─────────────────────────────────────────────

    public boolean existeCpf(String cpf, int idExcluir) throws Exception {
        String sql = "SELECT 1 FROM usuario WHERE cpf=? AND idUsuario<>?";
        try (PreparedStatement stmt = getConn().prepareStatement(sql)) {
            stmt.setString(1, cpf);
            stmt.setInt(2, idExcluir);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        }
    }

    public boolean existeEmail(String email, int idExcluir) throws Exception {
        String sql = "SELECT 1 FROM usuario WHERE email=? AND idUsuario<>?";
        try (PreparedStatement stmt = getConn().prepareStatement(sql)) {
            stmt.setString(1, email);
            stmt.setInt(2, idExcluir);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        }
    }
}
