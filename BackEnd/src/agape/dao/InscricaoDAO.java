package agape.dao;

import agape.control.ConexaoBD;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class InscricaoDAO {

    private Connection conn;

    public InscricaoDAO() {
        this.conn = ConexaoBD.getInstance().getConexao();
    }

    public boolean cancelar(int idInscricao) throws SQLException {
        // RF_F2: Cancelar Inscrição com promoção automática da lista de espera
        
        String sqlUpdateStatus = "UPDATE inscricoes SET status = 0 WHERE idInscricao = ?";
        String sqlBuscaLista = "SELECT idUsuario, idEvento FROM inscricoes_lista_espera WHERE idEvento = (SELECT idEvento FROM inscricoes WHERE idInscricao = ?) ORDER BY dataEntrada ASC LIMIT 1";
        String sqlPromover = "INSERT INTO inscricoes (idEvento, idUsuario, dataInscricao, status) VALUES (?, ?, NOW(), 1)";
        String sqlRemoveLista = "DELETE FROM inscricoes_lista_espera WHERE idUsuario = ? AND idEvento = ?";

        try {
            conn.setAutoCommit(false); // Inicia transação para garantir integridade (EngSoft II)

            // 1. Cancela a inscrição atual
            try (PreparedStatement stmt = conn.prepareStatement(sqlUpdateStatus)) {
                stmt.setInt(1, idInscricao);
                int rows = stmt.executeUpdate();
                if (rows == 0) {
                    conn.rollback();
                    return false;
                }
            }

            // 2. Busca se tem alguém na lista de espera para o MESMO evento
            int idUsuarioLista = -1;
            int idEvento = -1;
            try (PreparedStatement stmt = conn.prepareStatement(sqlBuscaLista)) {
                stmt.setInt(1, idInscricao);
                ResultSet rs = stmt.executeQuery();
                if (rs.next()) {
                    idUsuarioLista = rs.getInt("idUsuario");
                    idEvento = rs.getInt("idEvento");
                }
            }

            // 3. Se achou alguém, promove e remove da lista
            if (idUsuarioLista != -1) {
                // Promove para inscrições
                try (PreparedStatement stmt = conn.prepareStatement(sqlPromover)) {
                    stmt.setInt(1, idEvento);
                    stmt.setInt(2, idUsuarioLista);
                    stmt.executeUpdate();
                }
                // Remove da lista de espera
                try (PreparedStatement stmt = conn.prepareStatement(sqlRemoveLista)) {
                    stmt.setInt(1, idUsuarioLista);
                    stmt.setInt(2, idEvento);
                    stmt.executeUpdate();
                }
            }

            conn.commit(); // Finaliza transação com sucesso
            return true;

        } catch (SQLException e) {
            conn.rollback(); // Se der erro em qualquer passo, desfaz tudo
            throw e;
        } finally {
            conn.setAutoCommit(true);
        }
    }
}
