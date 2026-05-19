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
    public List<Venda> listar(Connection conn, String dataInicio, String dataFim) throws Exception {
        StringBuilder sql = new StringBuilder(
            "SELECT v.*, " +
            "u_par.nome  AS nomeParoquiano,  " +
            "u_col.nome  AS nomeColaborador, " +
            "COALESCE(fp.descricao, '') AS descFormaPag " +
            "FROM Venda v " +
            "JOIN Usuario u_par ON v.idUsuario     = u_par.idUsuario " +
            "JOIN Usuario u_col ON v.idColaborador = u_col.idUsuario " +
            "LEFT JOIN FormaPagamento fp ON v.idFormaPag = fp.idFormaPag " +
            "WHERE 1=1"
        );
        if (dataInicio != null && !dataInicio.isEmpty()) sql.append(" AND DATE(v.dataHora) >= ?");
        if (dataFim    != null && !dataFim.isEmpty())    sql.append(" AND DATE(v.dataHora) <= ?");
        sql.append(" ORDER BY v.dataHora DESC");

        List<Venda> lista = new ArrayList<>();
        try (PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            int i = 1;
            if (dataInicio != null && !dataInicio.isEmpty()) stmt.setString(i++, dataInicio);
            if (dataFim    != null && !dataFim.isEmpty())    stmt.setString(i++, dataFim);
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
