package agape.dao;

import agape.model.Caixa;

import java.sql.*;

public class CaixaDAO {

    private Caixa mapear(ResultSet rs) throws SQLException {
        Caixa c = new Caixa();
        c.setIdCaixa(rs.getInt("idCaixa"));
        c.setValorInicial(rs.getFloat("valorInicial"));
        c.setValorFinal(rs.getFloat("valorFinal"));
        Timestamp abertura    = rs.getTimestamp("dataHoraAbertura");
        Timestamp fechamento  = rs.getTimestamp("dataHoraFechamento");
        if (abertura   != null) c.setDataHoraAbertura(abertura.toLocalDateTime());
        if (fechamento != null) c.setDataHoraFechamento(fechamento.toLocalDateTime());
        return c;
    }

    /** Retorna o caixa ainda aberto (dataHoraFechamento IS NULL), ou null se não houver nenhum. */
    public Caixa buscarAberto(Connection conn) throws Exception {
        String sql =
            "SELECT * FROM Caixa WHERE dataHoraFechamento IS NULL " +
            "ORDER BY dataHoraAbertura DESC LIMIT 1";
        try (PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            if (rs.next()) return mapear(rs);
        }
        return null;
    }

    /** Acrescenta valor ao saldo do caixa (valorFinal += valor). */
    public void adicionarAoValorFinal(Connection conn, int idCaixa, float valor) throws Exception {
        String sql = "UPDATE Caixa SET valorFinal = valorFinal + ? WHERE idCaixa = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setFloat(1, valor);
            stmt.setInt(2, idCaixa);
            stmt.executeUpdate();
        }
    }
}
