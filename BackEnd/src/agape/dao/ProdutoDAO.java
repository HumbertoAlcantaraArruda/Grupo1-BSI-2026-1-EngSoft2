package agape.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;

public class ProdutoDAO {

    public ProdutoDAO() {
    }

    // Recebe a conexão 'conn' por parâmetro conforme desenho do Humberto
    public void atualizarEstoque(Connection conn, int idProd, int quantidade) throws Exception {
        String sql = "UPDATE Produto SET qtdAtual = qtdAtual + ? WHERE idProd = ?";
        
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, quantidade);
            stmt.setInt(2, idProd);
            stmt.executeUpdate();
        }
    }
}