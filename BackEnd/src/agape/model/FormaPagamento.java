package agape.model;

public class FormaPagamento {
    private int idFormaPag;
    private String descricao;
    private int ativo;

    public int getIdFormaPag() {
        return idFormaPag;
    }

    public void setIdFormaPag(int idFormaPag) {
        this.idFormaPag = idFormaPag;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public int getAtivo() {
        return ativo;
    }

    public void setAtivo(int ativo) {
        this.ativo = ativo;
    }
}