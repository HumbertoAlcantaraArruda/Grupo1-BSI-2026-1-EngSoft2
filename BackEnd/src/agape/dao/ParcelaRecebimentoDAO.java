package agape.dao;

import agape.model.ParcelaRecebimento;

import java.sql.*;

/**
 * ParcelaRecebimentoDAO — Data Access Object para a tabela ParcelaRecebimento.
 *
 * High Cohesion (GRASP) — foco exclusivo em persistência de parcelas.
 * DIP (SOLID)           — Connection recebida externamente pelo chamador (VendaFacade).
 */
public class ParcelaRecebimentoDAO {

    /**
     * Insere uma parcela de recebimento.
     * Chamado por VendaFacade no passo 5 (RN03) para cada parcela do parcelado.
     */
    public void inserir(Connection conn, ParcelaRecebimento p) throws Exception {
        String sql =
            "INSERT INTO ParcelaRecebimento (idConta, numeroParcela, valor, dataVencimento, status) " +
            "VALUES (?, ?, ?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, p.getIdConta());
            stmt.setInt(2, p.getNumeroParcela());
            stmt.setFloat(3, p.getValor());
            stmt.setObject(4, p.getDataVencimento());
            stmt.setString(5, p.getStatus());
            stmt.executeUpdate();
        }
    }
}
