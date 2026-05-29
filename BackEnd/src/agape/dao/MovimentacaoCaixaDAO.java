package agape.dao;

import agape.model.MovimentacaoCaixa;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

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

    /**
     * Lista as movimentações de uma venda (uma por forma de pagamento).
     * Usado para reconstruir os pagamentos ao carregar a venda para edição.
     * O motivo segue o padrão: "Venda #X | Forma: Y | 3x" ou "| À vista".
     */
    public List<MovimentacaoCaixa> listarPorVenda(Connection conn, int idVenda) throws Exception {
        String sql =
            "SELECT * FROM MovimentacaoCaixa WHERE motivo LIKE ? ORDER BY idMov";
        List<MovimentacaoCaixa> lista = new ArrayList<>();
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, "Venda #" + idVenda + " |%");
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    MovimentacaoCaixa m = new MovimentacaoCaixa();
                    m.setIdMov(rs.getInt("idMov"));
                    m.setIdCaixa(rs.getInt("idCaixa"));
                    m.setIdUsuario(rs.getInt("Usuario_idUsuario"));
                    m.setValor(rs.getFloat("valor"));
                    m.setMotivo(rs.getString("motivo"));
                    Timestamp dt = rs.getTimestamp("dataHora");
                    if (dt != null) m.setDataHora(dt.toLocalDateTime());
                    lista.add(m);
                }
            }
        }
        return lista;
    }
}
