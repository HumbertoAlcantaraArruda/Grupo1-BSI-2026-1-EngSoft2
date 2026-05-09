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
        // Ajustado para os nomes exatos do seu banco (Singular e PascalCase)
        
        String sqlUpdateStatus = "UPDATE Inscricao SET status = 0 WHERE idInscricao = ?";
        String sqlBuscaLista = "SELECT idUsuario, idEvento FROM InscricaoListaEspera WHERE idEvento = (SELECT idEvento FROM Inscricao WHERE idInscricao = ?) ORDER BY dataStatus ASC LIMIT 1";
        String sqlPromover = "INSERT INTO Inscricao (idEvento, idUsuario, dataInscricao, status) VALUES (?, ?, NOW(), 1)";
        String sqlRemoveLista = "DELETE FROM InscricaoListaEspera WHERE idUsuario = ? AND idEvento = ?";

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

            // 2. Busca se tem alguém na lista de espera
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

            // 3. Se achou alguém, promove
            if (idUsuarioLista != -1) {
                try (PreparedStatement stmt = conn.prepareStatement(sqlPromover)) {
                    stmt.setInt(1, idEvento);
                    stmt.setInt(2, idUsuarioLista);
                    stmt.executeUpdate();
                }
                try (PreparedStatement stmt = conn.prepareStatement(sqlRemoveLista)) {
                    stmt.setInt(1, idUsuarioLista);
                    stmt.setInt(2, idEvento);
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
