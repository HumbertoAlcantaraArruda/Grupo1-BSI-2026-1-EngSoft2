package agape.dao;

import agape.control.ConexaoBD;
import agape.model.CategoriaEvento;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class CategoriaEventoDAO {

    private Connection getConn() {
        return ConexaoBD.getInstance().getConexao();
    }

    private CategoriaEvento mapear(ResultSet rs) throws SQLException {
        CategoriaEvento c = new CategoriaEvento();
        c.setIdCatEvento(rs.getInt("idCatEvento"));
        c.setNome(rs.getString("nome"));
        return c;
    }

    // ── escrita ───────────────────────────────────────────────────────────────

    public void inserir(CategoriaEvento c) throws Exception {
        String sql = "INSERT INTO CategoriaEvento (nome) VALUES (?)";
        try (PreparedStatement stmt = getConn().prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setString(1, c.getNome());
            stmt.executeUpdate();
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) c.setIdCatEvento(rs.getInt(1));
            }
        }
    }

    public void atualizar(CategoriaEvento c) throws Exception {
        String sql = "UPDATE CategoriaEvento SET nome=? WHERE idCatEvento=?";
        try (PreparedStatement stmt = getConn().prepareStatement(sql)) {
            stmt.setString(1, c.getNome());
            stmt.setInt(2, c.getIdCatEvento());
            stmt.executeUpdate();
        }
    }

    public void excluir(int id) throws Exception {
        String sql = "DELETE FROM CategoriaEvento WHERE idCatEvento=?";
        try (PreparedStatement stmt = getConn().prepareStatement(sql)) {
            stmt.setInt(1, id);
            stmt.executeUpdate();
        }
    }

    // ── leitura ───────────────────────────────────────────────────────────────

    public List<CategoriaEvento> listar() throws Exception {
        String sql = "SELECT * FROM CategoriaEvento ORDER BY nome";
        List<CategoriaEvento> lista = new ArrayList<>();
        try (PreparedStatement stmt = getConn().prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) lista.add(mapear(rs));
        }
        return lista;
    }

    public CategoriaEvento buscarPorId(int id) throws Exception {
        String sql = "SELECT * FROM CategoriaEvento WHERE idCatEvento=?";
        try (PreparedStatement stmt = getConn().prepareStatement(sql)) {
            stmt.setInt(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return mapear(rs);
            }
        }
        return null;
    }

    public CategoriaEvento buscarPorNome(String nome) throws Exception {
        String sql = "SELECT * FROM CategoriaEvento WHERE nome=?";
        try (PreparedStatement stmt = getConn().prepareStatement(sql)) {
            stmt.setString(1, nome);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return mapear(rs);
            }
        }
        return null;
    }

    // ── verificação de unicidade ──────────────────────────────────────────────

    public boolean existeNome(String nome, int idExcluir) throws Exception {
        String sql = "SELECT 1 FROM CategoriaEvento WHERE nome=? AND idCatEvento<>?";
        try (PreparedStatement stmt = getConn().prepareStatement(sql)) {
            stmt.setString(1, nome);
            stmt.setInt(2, idExcluir);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        }
    }
}
