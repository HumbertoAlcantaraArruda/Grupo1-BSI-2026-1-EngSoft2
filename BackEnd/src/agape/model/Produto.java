package agape.model;

import java.time.LocalDateTime;

public class Produto {
    private int idProd;
    private int idCatProd;
    private String nomeCategoria;
    private String nome;
    private float valorUni;
    private int qtdeAtual;

    public int getIdProd() {
        return idProd;
    }

    public void setIdProd(int idProd) {
        this.idProd = idProd;
    }

    public int getIdCatProd() {
        return idCatProd;
    }

    public void setIdCatProd(int idCatProd) {
        this.idCatProd = idCatProd;
    }

    public String getNomeCategoria() {
        return nomeCategoria;
    }

    public void setNomeCategoria(String nomeCategoria) {
        this.nomeCategoria = nomeCategoria;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public float getValorUni() {
        return valorUni;
    }

    public void setValorUni(float valorUni) {
        this.valorUni = valorUni;
    }

    public int getQtdeAtual() {
        return qtdeAtual;
    }

    public void setQtdeAtual(int qtdeAtual) {
        this.qtdeAtual = qtdeAtual;
    }

    public String toJson() {
        return "{" +
                "\"idProd\":" + idProd + "," +
                "\"idCatProd\":" + idCatProd + "," +
                "\"nomeCategoria\":" + (nomeCategoria != null ? "\"" + nomeCategoria + "\"" : "null") + "," +
                "\"nome\":\"" + nome + "\"," +
                "\"valorUni\":" + valorUni + "," +
                "\"qtdeAtual\":" + qtdeAtual +
                "}";
    }
}