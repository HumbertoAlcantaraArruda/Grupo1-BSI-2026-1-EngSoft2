package agape.dao;

import agape.model.Paroquiano;

import java.sql.*;

public class ParoquianoDAO {

    private Paroquiano mapear(ResultSet rs) throws SQLException {
        Paroquiano p = new Paroquiano();
        p.setIdUsuario(rs.getInt("idUsuario"));
        p.setNome(rs.getString("nome"));
        p.setCpf(rs.getString("cpf"));
        p.setEmail(rs.getString("email"));
        p.setStatus(rs.getInt("status"));
        p.setNivel(rs.getString("nivel"));
        p.setSaldoCredito(rs.getFloat("saldoCredito"));
        Timestamp ts = rs.getTimestamp("dataInscricao");
        if (ts != null) p.setDataInscricao(ts.toLocalDateTime());
        return p;
    }

    private static final String SQL_BASE =
        "SELECT u.idUsuario, u.nome, u.cpf, u.email, u.status, u.nivel, " +
        "p.dataInscricao, p.saldoCredito " +
        "FROM Usuario u JOIN Paroquiano p ON u.idUsuario = p.idUsuario ";

    public Paroquiano buscarPorCpf(Connection conn, String cpf) throws Exception {
        String sql = SQL_BASE + "WHERE u.cpf = ? AND u.nivel = 'PAROQ'";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, cpf);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return mapear(rs);
            }
        }
        return null;
    }

    public Paroquiano buscarPorId(Connection conn, int idUsuario) throws Exception {
        String sql = SQL_BASE + "WHERE u.idUsuario = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, idUsuario);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return mapear(rs);
            }
        }
        return null;
    }

    public void atualizarSaldoCredito(Connection conn, int idUsuario, float novoSaldo) throws Exception {
        String sql = "UPDATE Paroquiano SET saldoCredito = ? WHERE idUsuario = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setFloat(1, novoSaldo);
            stmt.setInt(2, idUsuario);
            stmt.executeUpdate();
        }
    }
}
