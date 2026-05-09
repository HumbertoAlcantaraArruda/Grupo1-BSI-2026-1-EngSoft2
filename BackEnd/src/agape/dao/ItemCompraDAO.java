package agape.dao;

import agape.model.ItemCompra;
import java.sql.Connection;
import java.sql.PreparedStatement;

public class ItemCompraDAO {

    public ItemCompraDAO() {
    }

    // Recebe a conexão 'conn' por parâmetro conforme desenho do Humberto
    public void inserir(Connection conn, ItemCompra item) throws Exception {
        String sql = "INSERT INTO itemCompra (idCompra, idProd, quantidade, valorUnitario) VALUES (?, ?, ?, ?)";
        
        PreparedStatement stmt = conn.prepareStatement(sql);
        stmt.setInt(1, item.getIdCompra());
        stmt.setInt(2, item.getIdProd());
        stmt.setInt(3, item.getQuantidade());
        stmt.setFloat(4, item.getValorUnitario());

        stmt.executeUpdate();
        stmt.close();
    }
}