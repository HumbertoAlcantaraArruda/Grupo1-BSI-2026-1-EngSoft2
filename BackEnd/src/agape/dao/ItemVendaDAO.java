package agape.dao;

import agape.model.ItemVenda;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class ItemVendaDAO {

    /**
     * Insere um item de venda com valorTotal calculado.
     * Information Expert (GRASP) — ItemVenda já calcula valorTotal internamente.
     */
    /** Retorna os itens de uma venda com o nome do produto (JOIN Produto). */
    public List<ItemVenda> listarItensPorVenda(Connection conn, int idVenda) throws Exception {
        String sql =
            "SELECT iv.idProd, p.nome AS nomeProduto, iv.quantidade, iv.valorUnitario, " +
            "       (iv.quantidade * iv.valorUnitario) AS valorTotal " +
            "FROM itemVenda iv " +
            "JOIN Produto p ON iv.idProd = p.idProd " +
            "WHERE iv.idVenda = ? " +
            "ORDER BY p.nome";
        List<ItemVenda> lista = new ArrayList<>();
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, idVenda);
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

    public void inserir(Connection conn, ItemVenda item) throws Exception {
        String sql =
            "INSERT INTO itemVenda (idVenda, idProd, quantidade, valorUnitario) " +
            "VALUES (?, ?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, item.getIdVenda());
            stmt.setInt(2, item.getIdProd());
            stmt.setInt(3, item.getQuantidade());
            stmt.setFloat(4, item.getValorUnitario());
            stmt.executeUpdate();
        }
    }

    /** Estorno — remove todos os itens de uma venda (chamado antes de deletar a Venda). */
    public void deletarPorVenda(Connection conn, int idVenda) throws Exception {
        String sql = "DELETE FROM itemVenda WHERE idVenda = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, idVenda);
            stmt.executeUpdate();
        }
    }
}
