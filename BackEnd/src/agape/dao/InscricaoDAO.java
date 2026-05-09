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
        // Ajustado para os nomes exatos do seu banco (Inscricao_idInscricao e ordemEntrada)
        
        String sqlUpdateStatus = "UPDATE Inscricao SET status = 0 WHERE idInscricao = ?";
        
        // Busca o primeiro da fila na lista de espera para o mesmo evento
        String sqlBuscaLista = "SELECT il.Inscricao_idInscricao FROM InscricaoListaEspera il " +
                               "JOIN Inscricao i ON il.Inscricao_idInscricao = i.idInscricao " +
                               "WHERE i.idEvento = (SELECT idEvento FROM Inscricao WHERE idInscricao = ?) " +
                               "ORDER BY il.ordemEntrada ASC LIMIT 1";
        
        String sqlPromover = "UPDATE Inscricao SET status = 1 WHERE idInscricao = ?";
        String sqlRemoveLista = "DELETE FROM InscricaoListaEspera WHERE Inscricao_idInscricao = ?";

        try {
            conn.setAutoCommit(false); 

            // 1. Cancela a inscrição atual
            try (PreparedStatement stmt = conn.prepareStatement(sqlUpdateStatus)) {
                stmt.setInt(1, idInscricao);
                int rows = stmt.executeUpdate();
                if (rows == 0) {
                    conn.rollback();
                    return false;
                }
            }

            // 2. Busca o primeiro da lista de espera
            int idInscricaoPromover = -1;
            try (PreparedStatement stmt = conn.prepareStatement(sqlBuscaLista)) {
                stmt.setInt(1, idInscricao);
                ResultSet rs = stmt.executeQuery();
                if (rs.next()) {
                    idInscricaoPromover = rs.getInt("Inscricao_idInscricao");
                }
            }

            // 3. Se achou alguém, promove (muda status) e remove da lista de espera
            if (idInscricaoPromover != -1) {
                try (PreparedStatement stmt = conn.prepareStatement(sqlPromover)) {
                    stmt.setInt(1, idInscricaoPromover);
                    stmt.executeUpdate();
                }
                try (PreparedStatement stmt = conn.prepareStatement(sqlRemoveLista)) {
                    stmt.setInt(1, idInscricaoPromover);
                    stmt.executeUpdate();
                }
            }

            conn.commit(); 
            return true;

        } catch (SQLException e) {
            conn.rollback();
            throw e;
        } finally {
            conn.setAutoCommit(true);
        }
    }
}
