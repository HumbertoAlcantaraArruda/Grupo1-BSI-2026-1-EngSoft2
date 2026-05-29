package agape.dao;

import agape.model.MovimentacaoCaixa;

import java.sql.*;

public class MovimentacaoCaixaDAO {

    public void inserir(Connection conn, MovimentacaoCaixa m) throws Exception {
        String sql =
            "INSERT INTO MovimentacaoCaixa (idCaixa, Usuario_idUsuario, dataHora, valor, motivo) " +
            "VALUES (?, ?, ?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, m.getIdCaixa());
            stmt.setInt(2, m.getIdUsuario());
            stmt.setObject(3, m.getDataHora());
            stmt.setFloat(4, m.getValor());
            stmt.setString(5, m.getMotivo());
            stmt.executeUpdate();
        }
    }

    /**
     * Estorno — soma apenas os pagamentos "à vista" de uma venda.
     * Apenas esses foram adicionados ao saldo do caixa em finalizarVenda(),
     * por isso só eles precisam ser subtraídos no rollback.
     * O padrão do motivo é: "Venda #X | Forma: Y | À vista"
     */
    public float somarAVistaPorVenda(Connection conn, int idVenda) throws Exception {
        String sql =
            "SELECT COALESCE(SUM(valor), 0) FROM MovimentacaoCaixa " +
            "WHERE motivo LIKE ? AND motivo LIKE '% | À vista'";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, "Venda #" + idVenda + " |%");
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return rs.getFloat(1);
            }
        }
        return 0f;
    }

    /** Estorno — apaga todos os registros de movimentação vinculados à venda. */
    public void deletarPorVenda(Connection conn, int idVenda) throws Exception {
        String sql = "DELETE FROM MovimentacaoCaixa WHERE motivo LIKE ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, "Venda #" + idVenda + " |%");
            stmt.executeUpdate();
        }
    }
}
