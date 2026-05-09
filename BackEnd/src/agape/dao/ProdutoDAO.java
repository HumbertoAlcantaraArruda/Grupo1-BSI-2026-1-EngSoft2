package agape.dao;

import agape.control.ConexaoBD;

import java.sql.Connection;
import java.sql.PreparedStatement;

public class ProdutoDAO {

    private Connection conn;

    public ProdutoDAO() {
        this.conn = ConexaoBD.getInstance().getConexao();
    }

    // RF_F9: Atualizar Estoque (Oculta)
    // Alinhado com a ERS e Padrões do Grupo: Tabela 'produtos', Coluna 'qtdEstoque'
    public void atualizarEstoque(int idProduto, int quantidade) throws Exception {
        // quantidade positiva para Compra (Entrada), negativa para Venda (Saída)
        String sql = "UPDATE Produto SET qtdEstoque = qtdEstoque + ? WHERE idProduto = ?";
        
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, quantidade);
            stmt.setInt(2, idProduto);
            stmt.executeUpdate();
        }
    }
}