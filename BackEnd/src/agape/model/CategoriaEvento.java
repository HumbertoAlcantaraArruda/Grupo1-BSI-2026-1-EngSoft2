package agape.model;

public class CategoriaEvento {
    private int idCatEvento;
    private String nome;
    private boolean ativo = true;

    // GETTERS E SETTERS
    public int getIdCatEvento() {
        return idCatEvento;
    }

    public void setIdCatEvento(int idCatEvento) {
        this.idCatEvento = idCatEvento;
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
            "\"idCatEvento\":" + idCatEvento + "," +
            "\"nome\":\""      + esc(nome)   + "\"," +
            "\"ativo\":"       + ativo        +
        "}";
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
