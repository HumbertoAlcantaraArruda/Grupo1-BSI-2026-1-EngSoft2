package agape.dao;

import agape.model.Venda;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class VendaDAO {

    public int inserir(Connection conn, Venda v) throws Exception {
        String sql =
            "INSERT INTO Venda (idColaborador, idUsuario, idFormaPag, dataHora, totBruto, credUtilizado, valorFinal) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setInt(1, v.getIdColaborador());
            stmt.setInt(2, v.getIdUsuario());
            stmt.setInt(3, v.getIdFormaPag());
            stmt.setObject(4, v.getDataHora());
            stmt.setFloat(5, v.getTotBruto());
            stmt.setFloat(6, v.getCredUtilizado());
            stmt.setFloat(7, v.getValorFinal());
            stmt.executeUpdate();
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) return rs.getInt(1);
            }
        }
        return 0;
    }

    /**
     * Lista vendas com JOIN para nome do paroquiano, colaborador e forma de pagamento.
     * Filtros de data são opcionais (null = sem filtro).
     */
    public List<Venda> listar(Connection conn, String dataInicio, String dataFim,
                               String nomeColaborador, String nomeParoquiano,
                               Integer idFormaPag, Boolean usouCredito) throws Exception {
        StringBuilder sql = new StringBuilder(
            "SELECT v.*, " +
            "u_par.nome AS nomeParoquiano, " +
            "u_col.nome AS nomeColaborador, " +
            "COALESCE((" +
            "  SELECT GROUP_CONCAT(CONCAT(fp2.descricao,'~~',mc2.valor) ORDER BY mc2.idMov SEPARATOR ',') " +
            "  FROM MovimentacaoCaixa mc2 " +
            "  JOIN FormaPagamento fp2 " +
            "    ON fp2.idFormaPag = CAST(TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(mc2.motivo,'Forma: ',-1),' |',1)) AS UNSIGNED) " +
            "  WHERE mc2.motivo LIKE CONCAT('Venda #',v.idVenda,' |%')" +
            "), COALESCE(fp.descricao,'')) AS descFormaPag " +
            "FROM Venda v " +
            "JOIN Usuario u_par ON v.idUsuario     = u_par.idUsuario " +
            "JOIN Usuario u_col ON v.idColaborador = u_col.idUsuario " +
            "LEFT JOIN FormaPagamento fp ON v.idFormaPag = fp.idFormaPag " +
            "WHERE 1=1"
        );
        if (dataInicio       != null) sql.append(" AND DATE(v.dataHora) >= ?");
        if (dataFim          != null) sql.append(" AND DATE(v.dataHora) <= ?");
        if (nomeColaborador  != null) sql.append(" AND u_col.nome LIKE ?");
        if (nomeParoquiano   != null) sql.append(" AND u_par.nome LIKE ?");
        if (idFormaPag       != null) sql.append(
            " AND (EXISTS (" +
            "  SELECT 1 FROM MovimentacaoCaixa mc" +
            "  JOIN FormaPagamento fp3 ON fp3.idFormaPag = CAST(TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(mc.motivo,'Forma: ',-1),' |',1)) AS UNSIGNED)" +
            "  WHERE mc.motivo LIKE CONCAT('Venda #',v.idVenda,' |%') AND fp3.idFormaPag = ?" +
            ") OR v.idFormaPag = ?)");
        if (usouCredito      != null) sql.append(usouCredito ? " AND v.credUtilizado > 0" : " AND v.credUtilizado = 0");
        sql.append(" ORDER BY v.dataHora DESC");

        List<Venda> lista = new ArrayList<>();
        try (PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            int i = 1;
            if (dataInicio      != null) stmt.setString(i++, dataInicio);
            if (dataFim         != null) stmt.setString(i++, dataFim);
            if (nomeColaborador != null) stmt.setString(i++, "%" + nomeColaborador + "%");
            if (nomeParoquiano  != null) stmt.setString(i++, "%" + nomeParoquiano  + "%");
            if (idFormaPag      != null) { stmt.setInt(i++, idFormaPag); stmt.setInt(i++, idFormaPag); }
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) lista.add(mapear(rs));
            }
        }
        return lista;
    }

    private Venda mapear(ResultSet rs) throws SQLException {
        Venda v = new Venda();
        v.setIdVenda(rs.getInt("idVenda"));
        v.setIdColaborador(rs.getInt("idColaborador"));
        v.setIdUsuario(rs.getInt("idUsuario"));
        v.setIdFormaPag(rs.getInt("idFormaPag"));
        v.setTotBruto(rs.getFloat("totBruto"));
        v.setCredUtilizado(rs.getFloat("credUtilizado"));
        v.setValorFinal(rs.getFloat("valorFinal"));
        Timestamp ts = rs.getTimestamp("dataHora");
        if (ts != null) v.setDataHora(ts.toLocalDateTime());
        try { v.setNomeParoquiano(rs.getString("nomeParoquiano")); }  catch (SQLException ignored) {}
        try { v.setNomeColaborador(rs.getString("nomeColaborador")); } catch (SQLException ignored) {}
        try { v.setDescFormaPag(rs.getString("descFormaPag")); }       catch (SQLException ignored) {}
        return v;
    }
}
