package agape.dao;

import agape.model.Devolucao;
import agape.model.ItemDevolucao;
import agape.model.ItemVenda;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

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
     * Lista devoluções com JOIN para o nome do paroquiano que recebeu o crédito.
     * Filtros opcionais (null = sem filtro): intervalo de datas, nome do paroquiano e nº da venda.
     */
    public List<Devolucao> listar(Connection conn, String dataInicio, String dataFim,
                                  String nomeParoquiano, Integer idVenda) throws Exception {
        StringBuilder sql = new StringBuilder(
            "SELECT d.*, u.nome AS nomeParoquiano " +
            "FROM Devolucao d " +
            "LEFT JOIN Usuario u ON d.Paroquiano_idUsuario = u.idUsuario " +
            "WHERE 1=1"
        );
        if (dataInicio     != null) sql.append(" AND DATE(d.dataHora) >= ?");
        if (dataFim        != null) sql.append(" AND DATE(d.dataHora) <= ?");
        if (nomeParoquiano != null) sql.append(" AND u.nome LIKE ?");
        if (idVenda        != null) sql.append(" AND d.idVenda = ?");
        sql.append(" ORDER BY d.dataHora DESC");

        List<Devolucao> lista = new ArrayList<>();
        try (PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            int i = 1;
            if (dataInicio     != null) stmt.setString(i++, dataInicio);
            if (dataFim        != null) stmt.setString(i++, dataFim);
            if (nomeParoquiano != null) stmt.setString(i++, "%" + nomeParoquiano + "%");
            if (idVenda        != null) stmt.setInt(i++, idVenda);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) lista.add(mapear(rs));
            }
        }
        return lista;
    }

    /** Retorna a devolução pelo id (com nome do paroquiano), ou null se não existir. */
    public Devolucao buscarPorId(Connection conn, int idDevolucao) throws Exception {
        String sql =
            "SELECT d.*, u.nome AS nomeParoquiano " +
            "FROM Devolucao d " +
            "LEFT JOIN Usuario u ON d.Paroquiano_idUsuario = u.idUsuario " +
            "WHERE d.idDevolucao = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, idDevolucao);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return mapear(rs);
            }
        }
        return null;
    }

    /** Itens de uma devolução com o nome do produto (JOIN Produto). Reusa ItemVenda como DTO. */
    public List<ItemVenda> listarItens(Connection conn, int idDevolucao) throws Exception {
        String sql =
            "SELECT idv.idProd, p.nome AS nomeProduto, idv.quantidade, idv.valorUnitario, " +
            "       (idv.quantidade * idv.valorUnitario) AS valorTotal " +
            "FROM itemDevolucao idv " +
            "JOIN Produto p ON idv.idProd = p.idProd " +
            "WHERE idv.idDev = ? " +
            "ORDER BY p.nome";
        List<ItemVenda> lista = new ArrayList<>();
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, idDevolucao);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    ItemVenda item = new ItemVenda();
                    item.setIdProd(rs.getInt("idProd"));
                    item.setNomeProduto(rs.getString("nomeProduto"));
                    item.setQuantidade(rs.getInt("quantidade"));
                    item.setValorUnitario(rs.getFloat("valorUnitario"));
                    item.setValorTotal(rs.getFloat("valorTotal"));
                    lista.add(item);
                }
            }
        }
        return lista;
    }

    private Devolucao mapear(ResultSet rs) throws SQLException {
        Devolucao d = new Devolucao();
        d.setIdDevolucao(rs.getInt("idDevolucao"));
        d.setIdVenda(rs.getInt("idVenda"));
        d.setIdUsuario(rs.getInt("Paroquiano_idUsuario"));
        Timestamp ts = rs.getTimestamp("dataHora");
        if (ts != null) d.setDataHora(ts.toLocalDateTime());
        d.setValorTotal(rs.getFloat("valorTotal"));
        d.setReincorporaEst(rs.getInt("reincorporaEst"));
        try { d.setNomeParoquiano(rs.getString("nomeParoquiano")); } catch (SQLException ignored) {}
        return d;
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
