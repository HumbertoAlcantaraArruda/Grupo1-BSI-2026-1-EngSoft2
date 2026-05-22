package agape.dao;

import agape.model.ContasReceber;

import java.sql.*;

/**
 * ContasReceberDAO — Data Access Object para a tabela ContasReceber.
 *
 * High Cohesion (GRASP) — responsabilidade única: persistência de contas a receber.
 * DIP (SOLID)           — recebe Connection externamente, facilitando injeção.
 */
public class ContasReceberDAO {

    /**
     * Insere uma nova conta a receber e retorna o ID gerado.
     * Chamado por VendaFacade apenas para pagamentos parcelados (RN02).
     */
    public int inserir(Connection conn, ContasReceber cr) throws Exception {
        String sql =
            "INSERT INTO ContasReceber (Venda_idVenda, Caixa_idCaixa, Colaborador_idUsuario, valor, dataVencimento) " +
            "VALUES (?, ?, ?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setInt(1, cr.getIdVenda());
            if (cr.getIdCaixa() > 0) {
                stmt.setInt(2, cr.getIdCaixa());
            } else {
                stmt.setNull(2, java.sql.Types.INTEGER);
            }
            stmt.setInt(3, cr.getIdUsuario());
            stmt.setFloat(4, cr.getValor());
            stmt.setObject(5, cr.getDataVencimento());
            stmt.executeUpdate();
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) return rs.getInt(1);
            }
        }
        return 0;
    }
}
