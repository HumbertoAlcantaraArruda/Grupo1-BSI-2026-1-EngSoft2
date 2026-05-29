package agape.dao;

import agape.model.Devolucao;
import agape.model.ItemDevolucao;

import java.sql.*;

/**
 * DevolucaoDAO — Data Access Object da Devolução (RF_F8).
 *
 * SRP (SOLID)  — responsabilidade única: persistir Devolucao e itemDevolucao.
 * DIP (SOLID)  — recebe a Connection externamente (gerenciada pela transação do
 *                chamador), permitindo participar de uma operação atômica maior.
 *
 * Colunas (verificadas no banco):
 *   Devolucao(idDevolucao PK, idVenda, Paroquiano_idUsuario, dataHora, valorTotal, reincorporaEst)
 *   itemDevolucao(idDev, idProd, quantidade, valorUnitario)  — PK composta (idDev, idProd)
 */
public class DevolucaoDAO {

    /** Insere a Devolucao e devolve o id gerado (RETURN_GENERATED_KEYS). */
    public int inserir(Connection conn, Devolucao d) throws Exception {
        String sql =
            "INSERT INTO Devolucao (idVenda, Paroquiano_idUsuario, dataHora, valorTotal, reincorporaEst) " +
            "VALUES (?, ?, ?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setInt(1, d.getIdVenda());
            stmt.setInt(2, d.getIdUsuario());
            stmt.setObject(3, d.getDataHora());
            stmt.setFloat(4, d.getValorTotal());
            stmt.setInt(5, d.getReincorporaEst());
            stmt.executeUpdate();
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) return rs.getInt(1);
            }
        }
        return 0;
    }

    /** Insere um item da devolução vinculado ao idDevolucao gerado. */
    public void inserirItem(Connection conn, ItemDevolucao item) throws Exception {
        String sql =
            "INSERT INTO itemDevolucao (idDev, idProd, quantidade, valorUnitario) " +
            "VALUES (?, ?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, item.getIdDev());
            stmt.setInt(2, item.getIdProd());
            stmt.setInt(3, item.getQuantidade());
            stmt.setFloat(4, item.getValorUnitario());
            stmt.executeUpdate();
        }
    }

    /**
     * Soma a quantidade já devolvida de um produto numa venda (devoluções anteriores).
     * Permite validar que o total devolvido nunca ultrapasse o vendido (Fluxo 4.1).
     */
    public int quantidadeJaDevolvida(Connection conn, int idVenda, int idProd) throws Exception {
        String sql =
            "SELECT COALESCE(SUM(idv.quantidade), 0) " +
            "FROM itemDevolucao idv " +
            "JOIN Devolucao d ON d.idDevolucao = idv.idDev " +
            "WHERE d.idVenda = ? AND idv.idProd = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, idVenda);
            stmt.setInt(2, idProd);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return rs.getInt(1);
            }
        }
        return 0;
    }
}
