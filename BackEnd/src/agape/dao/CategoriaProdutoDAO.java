package agape.dao;

import agape.model.CategoriaProduto;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class CategoriaProdutoDAO {

    private CategoriaProduto mapear(ResultSet rs) throws SQLException {
        CategoriaProduto c = new CategoriaProduto();
        c.setIdCatProd(rs.getInt("idCatProd"));
        c.setNome(rs.getString("nome"));
        c.setAtivo(rs.getBoolean("ativo"));
        return c;
    }

    public List<CategoriaProduto> buscar(Connection conn, String nome, Boolean ativo) throws Exception {
        StringBuilder sql = new StringBuilder("SELECT * FROM CategoriaProduto WHERE 1=1");
        if (nome != null && !nome.isEmpty()) sql.append(" AND nome LIKE ?");
        if (ativo != null) sql.append(" AND ativo = ?");
        sql.append(" ORDER BY nome");

        List<CategoriaProduto> lista = new ArrayList<>();
        try (PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            int i = 1;
            if (nome != null && !nome.isEmpty()) stmt.setString(i++, "%" + nome + "%");
            if (ativo != null) stmt.setBoolean(i++, ativo);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) lista.add(mapear(rs));
            }
        }
        return lista;
    }

    public CategoriaProduto buscarPorId(Connection conn, int id) throws Exception {
        String sql = "SELECT * FROM CategoriaProduto WHERE idCatProd = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return mapear(rs);
            }
        }
        return null;
    }

    public boolean existeNome(Connection conn, String nome, int idExcluir) throws Exception {
        String sql = "SELECT 1 FROM CategoriaProduto WHERE nome = ? AND idCatProd <> ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, nome);
            stmt.setInt(2, idExcluir);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        }
    }

    public void inserir(Connection conn, CategoriaProduto c) throws Exception {
        String sql = "INSERT INTO CategoriaProduto (nome, ativo) VALUES (?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setString(1, c.getNome());
            stmt.setBoolean(2, c.isAtivo());
            stmt.executeUpdate();
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) c.setIdCatProd(rs.getInt(1));
            }
        }
    }

    public void atualizar(Connection conn, CategoriaProduto c) throws Exception {
        String sql = "UPDATE CategoriaProduto SET nome = ?, ativo = ? WHERE idCatProd = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, c.getNome());
            stmt.setBoolean(2, c.isAtivo());
            stmt.setInt(3, c.getIdCatProd());
            stmt.executeUpdate();
        }
    }

    public void excluir(Connection conn, int id) throws Exception {
        String sql = "DELETE FROM CategoriaProduto WHERE idCatProd = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, id);
            stmt.executeUpdate();
        }
    }

    /** Retorna true se há pelo menos um Produto vinculado a esta categoria. */
    public boolean temProdutosVinculados(Connection conn, int idCatProd) throws Exception {
        String sql = "SELECT 1 FROM Produto WHERE idCatProd=? LIMIT 1";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, idCatProd);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        }
    }
}
