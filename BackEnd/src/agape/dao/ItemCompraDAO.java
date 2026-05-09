package agape.dao;

import agape.control.ConexaoBD;
import agape.model.ItemCompra;
import java.sql.Connection;
import java.sql.PreparedStatement;

public class ItemCompraDAO {

    private Connection conn;

    // O construtor pega a conexão com o banco de dados seguindo o padrão
    public ItemCompraDAO() {
        this.conn = ConexaoBD.getInstance().getConexao();
    }

    // Método responsável apenas por inserir um item da compra
    public void inserir(ItemCompra item) throws Exception {
        // A query SQL para inserir na tabela (assumindo que os nomes das colunas são esses)
        String sql = "INSERT INTO itemCompra (idCompra, idProd, quantidade, valorUnitario) VALUES (?, ?, ?, ?)";
        
        PreparedStatement stmt = conn.prepareStatement(sql);
        
        // Substituímos os "?" pelos valores reais do objeto "item"
        stmt.setInt(1, item.getIdCompra());
        stmt.setInt(2, item.getIdProd());
        stmt.setInt(3, item.getQuantidade());
        stmt.setFloat(4, item.getValorUnitario());

        // Executa a inserção no banco de dados
        stmt.executeUpdate();
        
        // Fecha o statement para liberar recursos
        stmt.close();
    }
}