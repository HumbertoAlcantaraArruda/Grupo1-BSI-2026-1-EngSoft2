package agape.dao;

import java.sql.*;

public class ColaboradorDAO {

    public void excluir(Connection conn, int idUsuario) throws Exception {
        String sql = "DELETE FROM Colaborador WHERE idUsuario = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, idUsuario);
            stmt.executeUpdate();
        }
    }

    public void inserir(Connection conn, int idUsuario) throws Exception {
        String sql = "INSERT INTO Colaborador (idUsuario, Evento_idEvento) VALUES (?, NULL)";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, idUsuario);
            stmt.executeUpdate();
        }
    }
}
