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
    // Ajustado para os nomes exatos do seu Model/Banco: idProd e qtdeAtual
    public void atualizarEstoque(int idProd, int quantidade) throws Exception {
        String sql = "UPDATE Produto SET qtdeAtual = qtdeAtual + ? WHERE idProd = ?";
        
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, quantidade);
            stmt.setInt(2, idProd);
            stmt.executeUpdate();
        }
    }
}