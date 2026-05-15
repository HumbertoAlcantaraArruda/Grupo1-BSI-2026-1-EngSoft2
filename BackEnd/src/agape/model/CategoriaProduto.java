package agape.model;

public class CategoriaProduto {
    private int idCatProd;
    private String nome;
    private boolean ativo;

    public int getIdCatProd() {
        return idCatProd;
    }

    public void setIdCatProd(int idCatProd) {
        this.idCatProd = idCatProd;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public boolean isAtivo() {
        return ativo;
    }

    public void setAtivo(boolean ativo) {
        this.ativo = ativo;
    }

    public String toJson() {
        return "{" +
            "\"idCatProd\":" + idCatProd + "," +
            "\"nome\":\""    + esc(nome)  + "\"," +
            "\"ativo\":"     + ativo      +
        "}";
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
