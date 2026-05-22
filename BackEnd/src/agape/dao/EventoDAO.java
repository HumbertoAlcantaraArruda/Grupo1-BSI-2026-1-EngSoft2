package agape.dao;

import agape.model.Evento;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class EventoDAO {

    private Evento mapear(ResultSet rs) throws SQLException {
        Evento e = new Evento();
        e.setIdEvento(rs.getInt("idEvento"));
        e.setIdUsuarioResponsavel(rs.getInt("idUsuarioResponsavel"));
        e.setIdCatEvento(rs.getInt("idCatEvento"));
        e.setNome(rs.getString("nome"));
        e.setDataInicio(rs.getTimestamp("dataInicio") != null ? rs.getTimestamp("dataInicio").toLocalDateTime() : null);
        e.setDataFim(rs.getTimestamp("dataFim") != null ? rs.getTimestamp("dataFim").toLocalDateTime() : null);
        e.setTotVagas(rs.getInt("totVagas"));

        int vagasDisp = rs.getInt("vagasDisp");
        e.setVagasDisp(rs.wasNull() ? null : vagasDisp);

        int idEventoStatus = rs.getInt("idEventoStatus");
        e.setIdEventoStatus(rs.wasNull() ? null : idEventoStatus);

        e.setDataEvento(rs.getTimestamp("dataEvento") != null ? rs.getTimestamp("dataEvento").toLocalDateTime() : null);
        e.setDataAberturaListaEspera(rs.getTimestamp("dataAberturaListaEspera") != null ? rs.getTimestamp("dataAberturaListaEspera").toLocalDateTime() : null);

        float valorInscricao = rs.getFloat("valorInscricao");
        e.setValorInscricao(rs.wasNull() ? null : valorInscricao);

        e.setImagemEvento(rs.getString("imagemEvento"));
        return e;
    }

    private Evento mapearComJoins(ResultSet rs) throws SQLException {
        Evento e = mapear(rs);
        e.setNomeCatEvento(rs.getString("nomeCatEvento"));
        e.setNomeStatus(rs.getString("nomeStatus"));
        return e;
    }

    public List<Evento> buscar(Connection conn, String nome, Integer idCatEvento, Integer idEventoStatus) throws Exception {
        StringBuilder sql = new StringBuilder(
            "SELECT e.*, ce.nome AS nomeCatEvento, es.nome AS nomeStatus " +
            "FROM Evento e " +
            "LEFT JOIN CategoriaEvento ce ON e.idCatEvento = ce.idCatEvento " +
            "LEFT JOIN EventoStatus es ON e.idEventoStatus = es.idEventoStatus " +
            "WHERE 1=1"
        );
        if (nome != null && !nome.isEmpty()) sql.append(" AND e.nome LIKE ?");
        if (idCatEvento != null)             sql.append(" AND e.idCatEvento = ?");
        if (idEventoStatus != null)          sql.append(" AND e.idEventoStatus = ?");
        sql.append(" ORDER BY e.dataEvento DESC, e.nome");

        List<Evento> lista = new ArrayList<>();
        try (PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            int i = 1;
            if (nome != null && !nome.isEmpty()) stmt.setString(i++, "%" + nome + "%");
            if (idCatEvento != null)             stmt.setInt(i++, idCatEvento);
            if (idEventoStatus != null)          stmt.setInt(i++, idEventoStatus);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) lista.add(mapearComJoins(rs));
            }
        }
        return lista;
    }

    public void inserir(Connection conn, Evento e) throws Exception {
        String sql =
            "INSERT INTO Evento (idUsuarioResponsavel, idCatEvento, nome, dataInicio, dataFim, " +
            "totVagas, vagasDisp, idEventoStatus, dataEvento, dataAberturaListaEspera, valorInscricao, imagemEvento) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setInt(1, e.getIdUsuarioResponsavel());
            stmt.setInt(2, e.getIdCatEvento());
            stmt.setString(3, e.getNome());
            stmt.setTimestamp(4, Timestamp.valueOf(e.getDataInicio()));
            stmt.setTimestamp(5, Timestamp.valueOf(e.getDataFim()));
            stmt.setInt(6, e.getTotVagas());
            if (e.getVagasDisp() != null) stmt.setInt(7, e.getVagasDisp()); else stmt.setNull(7, Types.INTEGER);
            if (e.getIdEventoStatus() != null) stmt.setInt(8, e.getIdEventoStatus()); else stmt.setNull(8, Types.INTEGER);
            if (e.getDataEvento() != null) stmt.setTimestamp(9, Timestamp.valueOf(e.getDataEvento())); else stmt.setNull(9, Types.TIMESTAMP);
            if (e.getDataAberturaListaEspera() != null) stmt.setTimestamp(10, Timestamp.valueOf(e.getDataAberturaListaEspera())); else stmt.setNull(10, Types.TIMESTAMP);
            if (e.getValorInscricao() != null) stmt.setFloat(11, e.getValorInscricao()); else stmt.setNull(11, Types.FLOAT);
            stmt.setString(12, e.getImagemEvento());
            stmt.executeUpdate();
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) e.setIdEvento(rs.getInt(1));
            }
        }
    }

    public void atualizar(Connection conn, Evento e) throws Exception {
        String sql =
            "UPDATE Evento SET idUsuarioResponsavel=?, idCatEvento=?, nome=?, dataInicio=?, dataFim=?, " +
            "totVagas=?, vagasDisp=?, idEventoStatus=?, dataEvento=?, dataAberturaListaEspera=?, " +
            "valorInscricao=?, imagemEvento=? WHERE idEvento=?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, e.getIdUsuarioResponsavel());
            stmt.setInt(2, e.getIdCatEvento());
            stmt.setString(3, e.getNome());
            stmt.setTimestamp(4, Timestamp.valueOf(e.getDataInicio()));
            stmt.setTimestamp(5, Timestamp.valueOf(e.getDataFim()));
            stmt.setInt(6, e.getTotVagas());
            if (e.getVagasDisp() != null) stmt.setInt(7, e.getVagasDisp()); else stmt.setNull(7, Types.INTEGER);
            if (e.getIdEventoStatus() != null) stmt.setInt(8, e.getIdEventoStatus()); else stmt.setNull(8, Types.INTEGER);
            if (e.getDataEvento() != null) stmt.setTimestamp(9, Timestamp.valueOf(e.getDataEvento())); else stmt.setNull(9, Types.TIMESTAMP);
            if (e.getDataAberturaListaEspera() != null) stmt.setTimestamp(10, Timestamp.valueOf(e.getDataAberturaListaEspera())); else stmt.setNull(10, Types.TIMESTAMP);
            if (e.getValorInscricao() != null) stmt.setFloat(11, e.getValorInscricao()); else stmt.setNull(11, Types.FLOAT);
            stmt.setString(12, e.getImagemEvento());
            stmt.setInt(13, e.getIdEvento());
            stmt.executeUpdate();
        }
    }

    public void excluir(Connection conn, int id) throws Exception {
        String sql = "DELETE FROM Evento WHERE idEvento=?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, id);
            stmt.executeUpdate();
        }
    }

    // ── Operações de estado (RF_F1) ───────────────────────────────────────────

    /**
     * Abre o evento: idEventoStatus → 1 (Ativo).
     * novaData: obrigatório ao reabrir evento cancelado; null para demais transições.
     */
    public void abrir(Connection conn, int id, LocalDateTime novaData) throws Exception {
        String sql = novaData != null
            ? "UPDATE Evento SET idEventoStatus=1, dataEvento=? WHERE idEvento=?"
            : "UPDATE Evento SET idEventoStatus=1 WHERE idEvento=?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            if (novaData != null) {
                stmt.setTimestamp(1, Timestamp.valueOf(novaData));
                stmt.setInt(2, id);
            } else {
                stmt.setInt(1, id);
            }
            stmt.executeUpdate();
        }
    }

    /** Decrementa vagasDisp em 1, nunca abaixo de zero. */
    public void decrementarVagas(Connection conn, int idEvento) throws Exception {
        String sql = "UPDATE Evento SET vagasDisp = GREATEST(0, vagasDisp - 1) WHERE idEvento=?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, idEvento);
            stmt.executeUpdate();
        }
    }

    /**
     * Finaliza automaticamente todos os eventos cuja dataEvento já passou
     * e que não estejam Cancelados (2) ou já Finalizados (4).
     */
    public void finalizarEventosVencidos(Connection conn) throws Exception {
        String sql = "UPDATE Evento SET idEventoStatus=4 " +
                     "WHERE dataEvento IS NOT NULL AND dataEvento < NOW() " +
                     "AND idEventoStatus NOT IN (2, 4)";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.executeUpdate();
        }
    }

    /** Finaliza o evento: idEventoStatus → 4 (Finalizado). */
    public void finalizar(Connection conn, int id) throws Exception {
        String sql = "UPDATE Evento SET idEventoStatus=4 WHERE idEvento=?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, id);
            stmt.executeUpdate();
        }
    }

    /** Cancela o evento: idEventoStatus → 2 (Cancelado). */
    public void cancelar(Connection conn, int id) throws Exception {
        String sql = "UPDATE Evento SET idEventoStatus=2 WHERE idEvento=?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, id);
            stmt.executeUpdate();
        }
    }

    /** Adia o evento: idEventoStatus → 3 (Adiado) + atualiza dataEvento. */
    public void adiar(Connection conn, int id, LocalDateTime novaData) throws Exception {
        String sql = "UPDATE Evento SET idEventoStatus=3, dataEvento=? WHERE idEvento=?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setTimestamp(1, Timestamp.valueOf(novaData));
            stmt.setInt(2, id);
            stmt.executeUpdate();
        }
    }

    /** Define a data de abertura da lista de espera (acionado automaticamente pelo sistema). */
    public void abrirListaEspera(Connection conn, int id, LocalDateTime dataAbertura) throws Exception {
        String sql = "UPDATE Evento SET dataAberturaListaEspera=? WHERE idEvento=?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setTimestamp(1, Timestamp.valueOf(dataAbertura));
            stmt.setInt(2, id);
            stmt.executeUpdate();
        }
    }

    public Evento buscarPorId(Connection conn, int id) throws Exception {
        String sql =
            "SELECT e.*, ce.nome AS nomeCatEvento, es.nome AS nomeStatus " +
            "FROM Evento e " +
            "LEFT JOIN CategoriaEvento ce ON e.idCatEvento = ce.idCatEvento " +
            "LEFT JOIN EventoStatus es ON e.idEventoStatus = es.idEventoStatus " +
            "WHERE e.idEvento = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return mapearComJoins(rs);
            }
        }
        return null;
    }
}
