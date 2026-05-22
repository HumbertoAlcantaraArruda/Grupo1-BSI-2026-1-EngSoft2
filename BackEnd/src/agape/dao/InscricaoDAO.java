package agape.dao;

import agape.model.Inscricao;

import java.sql.*;
import java.time.LocalDateTime;

public class InscricaoDAO {

    // ── RF_F3: Realizar Inscrição ──────────────────────────────────────────

    /**
     * Persiste a inscrição com as colunas reais da tabela Inscricao.
     * Creator (GRASP): InscricaoDAO é responsável por criar o registro.
     */
    public void inserir(Connection conn, Inscricao i) throws Exception {
        String sql =
            "INSERT INTO Inscricao (idEvento, idUsuario, status, dataInscricao) " +
            "VALUES (?, ?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setInt(1, i.getIdEvento());
            stmt.setInt(2, i.getIdUsuario());
            stmt.setInt(3, i.getStatus());
            stmt.setTimestamp(4, i.getDataInscricao() != null
                ? Timestamp.valueOf(i.getDataInscricao())
                : Timestamp.valueOf(LocalDateTime.now()));
            stmt.executeUpdate();
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) i.setIdInscricao(rs.getInt(1));
            }
        }
    }

    /**
     * Verifica duplicata: paroquiano (idUsuario) já inscrito ou em lista de espera
     * no mesmo evento — evita inscrições duplicadas.
     */
    public boolean existeInscricaoAtiva(Connection conn, int idEvento, int idUsuario) throws Exception {
        String sql = "SELECT 1 FROM Inscricao WHERE idEvento=? AND idUsuario=? AND status IN (1, 2)";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, idEvento);
            stmt.setInt(2, idUsuario);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        }
    }

    /**
     * Conta inscrições ativas na lista de espera (status IS NULL = aguardando).
     * Usado para calcular a posição do próximo inscrito.
     */
    public int countListaEspera(Connection conn, int idEvento) throws Exception {
        // Filtra apenas entradas ainda aguardando (status IS NULL)
        String sql =
            "SELECT COUNT(*) FROM InscricaoListaEspera il " +
            "JOIN Inscricao i ON il.Inscricao_idInscricao = i.idInscricao " +
            "WHERE i.idEvento = ? AND il.status IS NULL";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, idEvento);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return rs.getInt(1);
            }
        }
        return 0;
    }

    /**
     * Adiciona a inscrição à fila de espera.
     * status e dataStatus iniciam NULL (aguardando promoção).
     */
    public void inserirListaEspera(Connection conn, int idInscricao, int ordemEntrada) throws Exception {
        String sql =
            "INSERT INTO InscricaoListaEspera (Inscricao_idInscricao, ordemEntrada, status, dataStatus) " +
            "VALUES (?, ?, NULL, NULL)";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, idInscricao);
            stmt.setInt(2, ordemEntrada);
            stmt.executeUpdate();
        }
    }

    // ── RF_F2: Cancelamento de Inscrição ──────────────────────────────────

    /**
     * Cancela a inscrição (status=0, obs, dataObsStatus) e promove automaticamente
     * o primeiro da lista de espera, atualizando status e dataStatus da fila.
     */
    public boolean cancelar(Connection conn, int idInscricao, String obs) throws SQLException {

        // 1. Cancela a inscrição e registra data/hora do cancelamento
        String sqlCancelar =
            "UPDATE Inscricao SET status = 0, obs = ?, dataObsStatus = NOW() " +
            "WHERE idInscricao = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sqlCancelar)) {
            stmt.setString(1, obs);
            stmt.setInt(2, idInscricao);
            if (stmt.executeUpdate() == 0) return false;
        }

        // 2. Busca o primeiro da lista de espera para o mesmo evento (menor ordemEntrada, ainda aguardando)
        String sqlBuscaLista =
            "SELECT il.Inscricao_idInscricao FROM InscricaoListaEspera il " +
            "JOIN Inscricao i ON il.Inscricao_idInscricao = i.idInscricao " +
            "WHERE i.idEvento = (SELECT idEvento FROM Inscricao WHERE idInscricao = ?) " +
            "AND il.status IS NULL " +
            "ORDER BY il.ordemEntrada ASC LIMIT 1";

        int idParaPromover = -1;
        try (PreparedStatement stmt = conn.prepareStatement(sqlBuscaLista)) {
            stmt.setInt(1, idInscricao);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) idParaPromover = rs.getInt("Inscricao_idInscricao");
            }
        }

        // 3. Promove: atualiza InscricaoListaEspera (status=1, dataStatus=NOW()) e Inscricao (status=1)
        if (idParaPromover != -1) {
            String sqlAtualizaFila =
                "UPDATE InscricaoListaEspera SET status = 1, dataStatus = NOW() " +
                "WHERE Inscricao_idInscricao = ?";
            try (PreparedStatement stmt = conn.prepareStatement(sqlAtualizaFila)) {
                stmt.setInt(1, idParaPromover);
                stmt.executeUpdate();
            }

            String sqlPromover =
                "UPDATE Inscricao SET status = 1, dataObsStatus = NOW() WHERE idInscricao = ?";
            try (PreparedStatement stmt = conn.prepareStatement(sqlPromover)) {
                stmt.setInt(1, idParaPromover);
                stmt.executeUpdate();
            }
        }

        return true;
    }
}
