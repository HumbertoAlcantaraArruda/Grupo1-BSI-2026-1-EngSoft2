package agape.dao;

import agape.model.FormaPagamento;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class FormaPagamentoDAO {

    private FormaPagamento mapear(ResultSet rs) throws SQLException {
        FormaPagamento f = new FormaPagamento();
        f.setIdFormaPag(rs.getInt("idFormaPag"));
        f.setDescricao(rs.getString("descricao"));
        f.setAtivo(rs.getInt("ativo"));
        f.setPermiteParcelar(rs.getBoolean("permiteParcelar"));
        return f;
    }

    public void inserir(Connection conn, FormaPagamento f) throws Exception {
        String sql = "INSERT INTO FormaPagamento (descricao, ativo, permiteParcelar) VALUES (?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setString(1, f.getDescricao());
            stmt.setInt(2, f.getAtivo());
            stmt.setBoolean(3, f.isPermiteParcelar());
            stmt.executeUpdate();
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) f.setIdFormaPag(rs.getInt(1));
            }
        }
    }

    public void atualizar(Connection conn, FormaPagamento f) throws Exception {
        String sql = "UPDATE FormaPagamento SET descricao=?, ativo=? WHERE idFormaPag=?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, f.getDescricao());
            stmt.setInt(2, f.getAtivo());
            stmt.setInt(3, f.getIdFormaPag());
            stmt.executeUpdate();
        }
    }

    public void excluir(Connection conn, int id) throws Exception {
        String sql = "DELETE FROM FormaPagamento WHERE idFormaPag=?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, id);
            stmt.executeUpdate();
        }
    }

    public List<FormaPagamento> listar(Connection conn) throws Exception {
        return buscar(conn, null, null);
    }

    public List<FormaPagamento> buscar(Connection conn, String descricao, Boolean ativo) throws Exception {
        StringBuilder sql = new StringBuilder("SELECT * FROM FormaPagamento WHERE 1=1");
        if (descricao != null && !descricao.isEmpty()) sql.append(" AND descricao LIKE ?");
        if (ativo     != null)                         sql.append(" AND ativo=?");
        sql.append(" ORDER BY descricao");

        List<FormaPagamento> lista = new ArrayList<>();
        try (PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            int i = 1;
            if (descricao != null && !descricao.isEmpty()) stmt.setString(i++, "%" + descricao + "%");
            if (ativo     != null)                         stmt.setInt(i++, ativo ? 1 : 0);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) lista.add(mapear(rs));
            }
        }
        return lista;
    }

    public FormaPagamento buscarPorId(Connection conn, int id) throws Exception {
        String sql = "SELECT * FROM FormaPagamento WHERE idFormaPag=?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return mapear(rs);
            }
        }
        return null;
    }

    public boolean existeDescricao(Connection conn, String descricao, int idExcluir) throws Exception {
        String sql = "SELECT 1 FROM FormaPagamento WHERE descricao=? AND idFormaPag<>?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, descricao);
            stmt.setInt(2, idExcluir);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        }
    }
}
