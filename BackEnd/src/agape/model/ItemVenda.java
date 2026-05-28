package agape.model;

import agape.dao.ItemVendaDAO;
import java.sql.Connection;
import java.util.List;

/**
 * ItemVenda — representa um item (produto) de uma venda.
 *
 * Information Expert (GRASP) — calcula o próprio valorTotal a partir de
 * valorUnitario × quantidade, sem depender de nenhuma outra classe.
 */
public class ItemVenda {
    private final ItemVendaDAO dao = new ItemVendaDAO();

    private int   idVenda;
    private int   idProd;
    private String nomeProduto;   // campo de exibição (vem de JOIN com Produto)
    private int   quantidade;
    private float valorUnitario;
    private float valorTotal;     // calculado: valorUnitario × quantidade

    public int   getIdVenda()        { return idVenda; }
    public void  setIdVenda(int v)   { this.idVenda = v; }

    public int   getIdProd()         { return idProd; }
    public void  setIdProd(int v)    { this.idProd = v; }

    public String getNomeProduto()          { return nomeProduto; }
    public void   setNomeProduto(String v)  { this.nomeProduto = v; }

    public int   getQuantidade()          { return quantidade; }
    public void  setQuantidade(int v)     { this.quantidade = v; recalcularTotal(); }

    public float getValorUnitario()          { return valorUnitario; }
    public void  setValorUnitario(float v)   { this.valorUnitario = v; recalcularTotal(); }

    public float getValorTotal()             { return valorTotal; }
    public void  setValorTotal(float v)      { this.valorTotal = v; }

    /** Information Expert — ItemVenda calcula seu próprio total. */
    private void recalcularTotal() {
        this.valorTotal = (float) Math.round(this.valorUnitario * this.quantidade * 100) / 100f;
    }

    public List<ItemVenda> listarItensPorVenda(Connection conn, int idVenda) throws Exception {
        return dao.listarItensPorVenda(conn, idVenda);
    }

    public String toJson() {
        return "{" +
            "\"idProd\":"        + idProd                        + "," +
            "\"nomeProduto\":"   + str(nomeProduto)              + "," +
            "\"quantidade\":"    + quantidade                    + "," +
            "\"valorUnitario\":" + valorUnitario                 + "," +
            "\"valorTotal\":"    + valorTotal                    +
        "}";
    }

    private String str(String s) {
        if (s == null) return "null";
        return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }
}