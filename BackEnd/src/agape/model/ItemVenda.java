package agape.model;

/**
 * ItemVenda — representa um item (produto) de uma venda.
 *
 * Information Expert (GRASP) — calcula o próprio valorTotal a partir de
 * valorUnitario × quantidade, sem depender de nenhuma outra classe.
 */
public class ItemVenda {
    private int   idVenda;
    private int   idProd;
    private int   quantidade;
    private float valorUnitario;
    private float valorTotal;     // calculado: valorUnitario × quantidade

    public int   getIdVenda()        { return idVenda; }
    public void  setIdVenda(int v)   { this.idVenda = v; }

    public int   getIdProd()         { return idProd; }
    public void  setIdProd(int v)    { this.idProd = v; }

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
}