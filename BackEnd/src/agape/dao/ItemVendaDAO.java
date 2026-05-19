package agape.dao;

import agape.model.ItemVenda;

import java.sql.*;

public class ItemVendaDAO {

    public void inserir(Connection conn, ItemVenda item) throws Exception {
        String sql = "INSERT INTO ItemVenda (idVenda, idProd, quantidade, valorUnitario) VALUES (?, ?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, item.getIdVenda());
            stmt.setInt(2, item.getIdProd());
            stmt.setInt(3, item.getQuantidade());
            stmt.setFloat(4, item.getValorUnitario());
            stmt.executeUpdate();
        }
    }
}
