package agape.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

// import java.sql.PreparedStatement;
import agape.control.ConexaoBD;
import agape.model.Produto;

public class ProdutoDAO {
    private Connection getConn(){
        return ConexaoBD.getInstance().getConexao();
    }

    private Produto mapear(ResultSet rs) throws SQLException {
        Produto p = new Produto();
        p.setIdProd(rs.getInt("idProd"));
        p.setIdCatProd(rs.getInt("idCatProd"));
        p.setNome(rs.getString("nome"));
        p.setValorUni(rs.getFloat("valorUni"));
        p.setQtdeAtual(rs.getInt("qtdAtual"));
        return p;
    }

    public List<Produto> buscar (int qtd, String catProd, String nome, String op) throws SQLException {
        StringBuilder sql = new StringBuilder("SELECT * FROM Produto WHERE 1=1");
        if(catProd != null){
            sql.append(" AND idCatProd = ?");
        }
        if (nome != null) {
            sql.append(" AND nome LIKE ?");
        }
        if (op != null && qtd != -1) {
            sql.append(" AND qtdAtual " + op + " ?");
        }
        sql.append(" ORDER BY nome");
        List<Produto> produto = new ArrayList<>();
        try (PreparedStatement stmt = getConn().prepareStatement(sql.toString())){
            int i = 1;
            if (catProd != null) {
                //int j = Integer.parseInt(catProd.trim());
                stmt.setString(i++,catProd );
            }
            if (nome != null) {
                stmt.setString(i++, "%" + nome + "%");
            }
            if (op != null && qtd != -1) {
                stmt.setInt(i++, qtd);
            }
            try (ResultSet rs = stmt.executeQuery()){
                while (rs.next()) {
                    produto.add(mapear(rs));
                }
            }
        }
        return produto;
    }

    public Produto buscarPorId(int id) throws SQLException {
        String sql = "SELECT * FROM Produto WHERE idProd = ?";
        try (PreparedStatement stmt = getConn().prepareStatement(sql)) {
            stmt.setInt(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapear(rs);
                }
            }
        }
        return null;
    }

    public boolean existeNome(String nome, int idIgnorar) throws SQLException {
        String sql = "SELECT COUNT(*) FROM Produto WHERE nome = ? AND idProd != ?";
        try (PreparedStatement stmt = getConn().prepareStatement(sql)) {
            stmt.setString(1, nome);
            stmt.setInt(2, idIgnorar);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return rs.getInt(1) > 0;
            }
        }
        return false;
    }

    public void inserir(Produto p) throws SQLException {
        String sql = "INSERT INTO Produto (idCatProd, nome, valorUni, qtdAtual) VALUES (?, ?, ?, ?)";
        try (PreparedStatement stmt = getConn().prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
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

    public void atualizar(Produto p) throws SQLException {
        String sql = "UPDATE Produto SET idCatProd = ?, nome = ?, valorUni = ?, qtdAtual = ? WHERE idProd = ?";
        try (PreparedStatement stmt = getConn().prepareStatement(sql)) {
            stmt.setInt(1, p.getIdCatProd());
            stmt.setString(2, p.getNome());
            stmt.setFloat(3, p.getValorUni());
            stmt.setInt(4, p.getQtdeAtual());
            stmt.setInt(5, p.getIdProd());
            stmt.executeUpdate();
        }
    }

    public void excluir(int id) throws SQLException {
        String sql = "DELETE FROM Produto WHERE idProd = ?";
        try (PreparedStatement stmt = getConn().prepareStatement(sql)) {
            stmt.setInt(1, id);
            stmt.executeUpdate();
        }
    }
}