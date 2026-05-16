package agape.dao;

import agape.model.CategoriaEvento;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class CategoriaEventoDAO {

    private CategoriaEvento mapear(ResultSet rs) throws SQLException {
        CategoriaEvento c = new CategoriaEvento();
        c.setIdCatEvento(rs.getInt("idCatEvento"));
        c.setNome(rs.getString("nome"));
        c.setAtivo(rs.getBoolean("ativo"));
        return c;
    }

    public void inserir(Connection conn, CategoriaEvento c) throws Exception {
        String sql = "INSERT INTO CategoriaEvento (nome, ativo) VALUES (?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setString(1, c.getNome());
            stmt.setBoolean(2, c.isAtivo());
            stmt.executeUpdate();
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) c.setIdCatEvento(rs.getInt(1));
            }
        }
    }

    public void atualizar(Connection conn, CategoriaEvento c) throws Exception {
        String sql = "UPDATE CategoriaEvento SET nome=?, ativo=? WHERE idCatEvento=?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, c.getNome());
            stmt.setBoolean(2, c.isAtivo());
            stmt.setInt(3, c.getIdCatEvento());
            stmt.executeUpdate();
        }
    }

    public void excluir(Connection conn, int id) throws Exception {
        String sql = "DELETE FROM CategoriaEvento WHERE idCatEvento=?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, id);
            stmt.executeUpdate();
        }
    }

    public List<CategoriaEvento> listar(Connection conn) throws Exception {
        return buscar(conn, null, null);
    }

    public List<CategoriaEvento> buscar(Connection conn, String nome, Boolean ativo) throws Exception {
        StringBuilder sql = new StringBuilder("SELECT * FROM CategoriaEvento WHERE 1=1");
        if (nome  != null && !nome.isEmpty()) sql.append(" AND nome LIKE ?");
        if (ativo != null)                    sql.append(" AND ativo=?");
        sql.append(" ORDER BY nome");

        List<CategoriaEvento> lista = new ArrayList<>();
        try (PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            int i = 1;
            if (nome  != null && !nome.isEmpty()) stmt.setString(i++, "%" + nome + "%");
            if (ativo != null)                    stmt.setBoolean(i++, ativo);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) lista.add(mapear(rs));
            }
        }
        return lista;
    }

    public CategoriaEvento buscarPorId(Connection conn, int id) throws Exception {
        String sql = "SELECT * FROM CategoriaEvento WHERE idCatEvento=?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return mapear(rs);
            }
        }
        return null;
    }

    public CategoriaEvento buscarPorNome(Connection conn, String nome) throws Exception {
        String sql = "SELECT * FROM CategoriaEvento WHERE nome=?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, nome);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return mapear(rs);
            }
        }
        return null;
    }

    public boolean existeNome(Connection conn, String nome, int idExcluir) throws Exception {
        String sql = "SELECT 1 FROM CategoriaEvento WHERE nome=? AND idCatEvento<>?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, nome);
            stmt.setInt(2, idExcluir);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        }
    }
}
