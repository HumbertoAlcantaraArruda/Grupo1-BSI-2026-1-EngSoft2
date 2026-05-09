package agape.dao;

import agape.model.Compra;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.sql.Timestamp;

public class CompraDAO {

    public CompraDAO() {
        // Construtor vazio conforme desenho (a conexão vem por parâmetro)
    }

    // RF_F10: Recebe a conexão 'conn' por parâmetro conforme desenho do Humberto
    public int inserir(Connection conn, Compra compra) throws Exception {
        String sql = "INSERT INTO Compra (dataHora, valorTotal, idFornec, idUsuario) VALUES (?, ?, ?, ?)";
        
        PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
        stmt.setTimestamp(1, Timestamp.valueOf(compra.getDataHora()));
        stmt.setFloat(2, compra.getValorTotal());
        stmt.setInt(3, compra.getIdFornecedor());
        stmt.setInt(4, compra.getIdUsuario());

        stmt.executeUpdate();

        ResultSet rs = stmt.getGeneratedKeys();
        int idGerado = -1;
        if (rs.next()) {
            idGerado = rs.getInt(1);
        }
        
        stmt.close();
        return idGerado;
    }
}