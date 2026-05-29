package agape.dao;

import agape.model.Compra;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.sql.Timestamp;
import java.sql.Types;

public class CompraDAO {

    public CompraDAO() {
        // Construtor vazio conforme desenho (a conexão vem por parâmetro)
    }

    // RF_F10: Recebe a conexão 'conn' por parâmetro conforme desenho do Humberto
    public int inserir(Connection conn, Compra compra) throws Exception {
        String sql = "INSERT INTO Compra (dataHora, valorTotal, idFornec, idUsuario, numNotaFiscal, obs) " +
                     "VALUES (?, ?, ?, ?, ?, ?)";

        PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
        stmt.setTimestamp(1, Timestamp.valueOf(compra.getDataHora()));
        stmt.setFloat(2, compra.getValorTotal());
        stmt.setInt(3, compra.getIdFornecedor());
        stmt.setInt(4, compra.getIdUsuario());

        // Campos opcionais (NULL quando não informados)
        String numNotaFiscal = compra.getNumNotaFiscal();
        if (numNotaFiscal != null && !numNotaFiscal.trim().isEmpty()) {
            stmt.setString(5, numNotaFiscal.trim());
        } else {
            stmt.setNull(5, Types.VARCHAR);
        }

        String obs = compra.getObs();
        if (obs != null && !obs.trim().isEmpty()) {
            stmt.setString(6, obs.trim());
        } else {
            stmt.setNull(6, Types.VARCHAR);
        }

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