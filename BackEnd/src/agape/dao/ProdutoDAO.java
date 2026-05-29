package agape.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

import agape.model.Produto;

public class ProdutoDAO {

    /* Usado por buscarPorId — SELECT * sem alias */
    private Produto mapear(ResultSet rs) throws SQLException {
        Produto p = new Produto();
        p.setIdProd(rs.getInt("idProd"));
        p.setIdCatProd(rs.getInt("idCatProd"));
        p.setNome(rs.getString("nome"));
        p.setValorUni(rs.getFloat("valorUni"));
        p.setQtdeAtual(rs.getInt("qtdAtual"));
        return p;
    }

    /* Usado por buscar — SELECT com JOIN e aliases nomeProduto/nomeCategoria */
    private Produto mapearComCategoria(ResultSet rs) throws SQLException {
        Produto p = new Produto();
        p.setIdProd(rs.getInt("idProd"));
        p.setIdCatProd(rs.getInt("idCatProd"));
        p.setNome(rs.getString("nomeProduto"));
        p.setValorUni(rs.getFloat("valorUni"));
        p.setQtdeAtual(rs.getInt("qtdAtual"));
        p.setNomeCategoria(rs.getString("nomeCategoria"));
        return p;
    }

    public List<Produto> buscar(Connection conn, int qtd, String catProd, String nome, String op) throws SQLException {
        StringBuilder sql = new StringBuilder(
            "SELECT p.idProd, p.idCatProd, p.nome AS nomeProduto, p.valorUni, p.qtdAtual, " +
            "cp.nome AS nomeCategoria " +
            "FROM Produto p " +
            "LEFT JOIN CategoriaProduto cp ON p.idCatProd = cp.idCatProd " +
            "WHERE 1=1"
        );
        if (catProd != null) {
            sql.append(" AND p.idCatProd = ?");
        }
        if (nome != null) {
            sql.append(" AND p.nome LIKE ?");
        }
        if (op != null && qtd != -1) {
            sql.append(" AND p.qtdAtual " + op + " ?");
        }
        sql.append(" ORDER BY p.nome");
        List<Produto> produto = new ArrayList<>();
        try (PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            int i = 1;
            if (catProd != null) {
                stmt.setString(i++, catProd);
            }
            if (nome != null) {
                stmt.setString(i++, "%" + nome + "%");
            }
            if (op != null && qtd != -1) {
                stmt.setInt(i++, qtd);
            }
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    produto.add(mapearComCategoria(rs));
                }
            }
        }
        return produto;
    }

    public Produto buscarPorId(Connection conn, int id) throws SQLException {
        String sql = "SELECT * FROM Produto WHERE idProd = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapear(rs);
                }
            }
        }
        return null;
    }

    public boolean existeNome(Connection conn, String nome, int idIgnorar) throws SQLException {
        String sql = "SELECT COUNT(*) FROM Produto WHERE nome = ? AND idProd != ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, nome);
            stmt.setInt(2, idIgnorar);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return rs.getInt(1) > 0;
            }
        }
        return false;
    }

    public void inserir(Connection conn, Produto p) throws SQLException {
        String sql = "INSERT INTO Produto (idCatProd, nome, valorUni, qtdAtual) VALUES (?, ?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setInt(1, p.getIdCatProd());
            stmt.setString(2, p.getNome());
            stmt.setFloat(3, p.getValorUni());
            stmt.setInt(4, p.getQtdeAtual());
            stmt.executeUpdate();
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) p.setIdProd(rs.getInt(1));
            }
        }
    }

    public void atualizar(Connection conn, Produto p) throws SQLException {
        String sql = "UPDATE Produto SET idCatProd = ?, nome = ?, valorUni = ?, qtdAtual = ? WHERE idProd = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, p.getIdCatProd());
            stmt.setString(2, p.getNome());
            stmt.setFloat(3, p.getValorUni());
            stmt.setInt(4, p.getQtdeAtual());
            stmt.setInt(5, p.getIdProd());
            stmt.executeUpdate();
        }
    }

    public void excluir(Connection conn, int id) throws SQLException {
        String sql = "DELETE FROM Produto WHERE idProd = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, id);
            stmt.executeUpdate();
        }
    }

    public void decrementarEstoque(Connection conn, int idProd, int qtd) throws SQLException {
        String sql = "UPDATE Produto SET qtdAtual = qtdAtual - ? WHERE idProd = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, qtd);
            stmt.setInt(2, idProd);
            stmt.executeUpdate();
        }
    }

    /** Estorno — devolve unidades ao estoque após reversão de venda. */
    public void restaurarEstoque(Connection conn, int idProd, int qtd) throws SQLException {
        String sql = "UPDATE Produto SET qtdAtual = qtdAtual + ? WHERE idProd = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, qtd);
            stmt.setInt(2, idProd);
            stmt.executeUpdate();
        }
    }
}
