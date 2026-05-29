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
        return p;
    }

    private static final String SQL_BASE =
        "SELECT u.idUsuario, u.nome, u.cpf, u.email, u.status, u.nivel, " +
        "COALESCE(p.saldoCredito, 0) AS saldoCredito " +
        "FROM Usuario u LEFT JOIN Paroquiano p ON u.idUsuario = p.idUsuario ";

    public void inserir(Connection conn, int idUsuario) throws Exception {
        String sql = "INSERT INTO Paroquiano (idUsuario, saldoCredito) VALUES (?, 0)";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, idUsuario);
            stmt.executeUpdate();
        }
    }

    public void excluir(Connection conn, int idUsuario) throws Exception {
        String sql = "DELETE FROM Paroquiano WHERE idUsuario = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, idUsuario);
            stmt.executeUpdate();
        }
    }

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

    /**
     * Incremento ATÔMICO do saldo de crédito (saldoCredito = saldoCredito + ?).
     *
     * Usado na devolução (RF_F8). Diferente de atualizarSaldoCredito (que grava
     * um valor absoluto após ler em memória), aqui o cálculo acontece no próprio
     * UPDATE do banco — eliminando o ciclo ler→somar→gravar e, portanto, a
     * condição de corrida (Race Condition) em devoluções/vendas concorrentes.
     */
    public void incrementarSaldoCredito(Connection conn, int idUsuario, float valor) throws Exception {
        String sql = "UPDATE Paroquiano SET saldoCredito = saldoCredito + ? WHERE idUsuario = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setFloat(1, valor);
            stmt.setInt(2, idUsuario);
            stmt.executeUpdate();
        }
    }
}
