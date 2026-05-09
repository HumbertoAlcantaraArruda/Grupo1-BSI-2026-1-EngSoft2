package agape.model;

public class Usuario {
    private int idUsuario;
    private String nome;
    private String login;
    private String senha;
    private int status;
    private String perfil;

    public Usuario() {}

    // Getters e Setters
    public int getIdUsuario() { return idUsuario; }
    public void setIdUsuario(int idUsuario) { this.idUsuario = idUsuario; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getLogin() { return login; }
    public void setLogin(String login) { this.login = login; }
    public String getSenha() { return senha; }
    public void setSenha(String senha) { this.senha = senha; }
    public int getStatus() { return status; }
    public void setStatus(int status) { this.status = status; }
    public String getPerfil() { return perfil; }
    public void setPerfil(String perfil) { this.perfil = perfil; }

    public String toJson() {
        return "{" +
            "\"idUsuario\":" + idUsuario + "," +
            "\"nome\":\"" + nome + "\"," +
            "\"login\":\"" + login + "\"," +
            "\"perfil\":\"" + perfil + "\"," +
            "\"status\":" + status +
            "}";
    }
}