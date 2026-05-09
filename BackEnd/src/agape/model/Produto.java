package agape.model;

public class Produto {
    private int idProd;
    private int idCatProd;
    private String nome;
    private float valorUni;
    private int qtdAtual;

    public Produto() {}

    // Getters e Setters
    public int getIdProd() { return idProd; }
    public void setIdProd(int idProd) { this.idProd = idProd; }
    public int getIdCatProd() { return idCatProd; }
    public void setIdCatProd(int idCatProd) { this.idCatProd = idCatProd; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public float getValorUni() { return valorUni; }
    public void setValorUni(float valorUni) { this.valorUni = valorUni; }
    public int getQtdAtual() { return qtdAtual; }
    public void setQtdAtual(int qtdAtual) { this.qtdAtual = qtdAtual; }

    public String toJson() {
        return "{" +
            "\"idProd\":" + idProd + "," +
            "\"nome\":\"" + nome + "\"," +
            "\"valorUni\":" + valorUni + "," +
            "\"qtdAtual\":" + qtdAtual +
            "}";
    }
}