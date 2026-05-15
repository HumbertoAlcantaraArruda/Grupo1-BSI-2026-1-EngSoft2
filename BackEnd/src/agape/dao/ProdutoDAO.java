package agape.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
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
}