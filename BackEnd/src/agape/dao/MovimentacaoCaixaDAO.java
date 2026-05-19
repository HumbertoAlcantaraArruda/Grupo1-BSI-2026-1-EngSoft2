package agape.dao;

import agape.model.MovimentacaoCaixa;

import java.sql.*;

public class MovimentacaoCaixaDAO {

    public void inserir(Connection conn, MovimentacaoCaixa m) throws Exception {
        String sql =
            "INSERT INTO MovimentacaoCaixa (idCaixa, idUsuario, dataHora, valor, motivo) " +
            "VALUES (?, ?, ?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, m.getIdCaixa());
            stmt.setInt(2, m.getIdUsuario());
            stmt.setObject(3, m.getDataHora());
            stmt.setFloat(4, m.getValor());
            stmt.setString(5, m.getMotivo());
            stmt.executeUpdate();
        }
    }
}
