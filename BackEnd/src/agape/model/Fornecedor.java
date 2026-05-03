package agape.model;

public class Fornecedor {
    private int idFornec;
    private String nome;
    private String telefone1;
    private String telefone2;
    private String email;
    private String site;
    private String contato;

    // GETTERS E SETTERS
    public int getIdFornec() {
        return idFornec;
    }
    public void setIdFornec(int idFornec) {
        this.idFornec = idFornec;
    }
    public String getNome() {
        return nome;
    }
    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getTelefone1() {
        return telefone1;
    }

    public void setTelefone1(String telefone1) {
        this.telefone1 = telefone1;
    }

    public String getTelefone2() {
        return telefone2;
    }

    public void setTelefone2(String telefone2) {
        this.telefone2 = telefone2;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSite() {
        return site;
    }

    public void setSite(String site) {
        this.site = site;
    }

    public String getContato() {
        return contato;
    }

    public void setContato(String contato) {
        this.contato = contato;
    }
}
