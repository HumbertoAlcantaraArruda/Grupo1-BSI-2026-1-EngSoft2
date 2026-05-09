package agape.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class InscricaoDAO {

    public InscricaoDAO() {
    }

    // Recebe a conexão 'conn' por parâmetro conforme desenho do Humberto
    public boolean cancelar(Connection conn, int idInscricao) throws SQLException {
        
        String sqlUpdateStatus = "UPDATE Inscricao SET status = 0 WHERE idInscricao = ?";
        
        String sqlBuscaLista = "SELECT il.Inscricao_idInscricao FROM InscricaoListaEspera il " +
                               "JOIN Inscricao i ON il.Inscricao_idInscricao = i.idInscricao " +
                               "WHERE i.idEvento = (SELECT idEvento FROM Inscricao WHERE idInscricao = ?) " +
                               "ORDER BY il.ordemEntrada ASC LIMIT 1";
        
        String sqlPromover = "UPDATE Inscricao SET status = 1 WHERE idInscricao = ?";
        String sqlRemoveLista = "DELETE FROM InscricaoListaEspera WHERE Inscricao_idInscricao = ?";

        // 1. Cancela a inscrição atual
        try (PreparedStatement stmt = conn.prepareStatement(sqlUpdateStatus)) {
            stmt.setInt(1, idInscricao);
            int rows = stmt.executeUpdate();
            if (rows == 0) return false;
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

        // 3. Se achou alguém, promove
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

        return true;
    }
}
