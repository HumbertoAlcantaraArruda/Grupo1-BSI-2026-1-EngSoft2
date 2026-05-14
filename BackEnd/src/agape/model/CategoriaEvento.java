package agape.model;

public class CategoriaEvento {
    private int idCatEvento;
    private String nome;

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

    public String toJson() {
        return "{" +
            "\"idCatEvento\":" + idCatEvento + "," +
            "\"nome\":\""      + esc(nome)   + "\"" +
        "}";
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
