package agape.model;

import java.time.LocalDateTime;

public class Usuario {

    private int idUsuario;
    private String nome;
    private String cpf;
    private String email;
    private String senha;
    private int status;
    private String nivel;
    private LocalDateTime dataAtivacao;
    private LocalDateTime dataDesativacao;

    // GETTERS E SETTERS

    public int getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(int idUsuario) {
        this.idUsuario = idUsuario;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getCpf() {
        return cpf;
    }

    public void setCpf(String cpf) {
        this.cpf = cpf;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSenha() {
        return senha;
    }

    public void setSenha(String senha) {
        this.senha = senha;
    }

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public String getNivel() {
        return nivel;
    }

    public void setNivel(String nivel) {
        this.nivel = nivel;
    }

    public LocalDateTime getDataAtivacao() {
        return dataAtivacao;
    }

    public void setDataAtivacao(LocalDateTime dataAtivacao) {
        this.dataAtivacao = dataAtivacao;
    }

    public LocalDateTime getDataDesativacao() {
        return dataDesativacao;
    }

    public void setDataDesativacao(LocalDateTime dataDesativacao) {
        this.dataDesativacao = dataDesativacao;
    }

    public String toJson() {
        return "{" +
            "\"idUsuario\":"   + idUsuario + "," +
            "\"nome\":\""      + esc(nome)  + "\"," +
            "\"cpf\":\""       + esc(cpf)   + "\"," +
            "\"email\":\""     + esc(email) + "\"," +
            "\"status\":"      + status     + "," +
            "\"nivel\":\""     + esc(nivel) + "\"," +
            "\"dataAtivacao\":"    + (dataAtivacao    != null ? "\"" + dataAtivacao    + "\"" : "null") + "," +
            "\"dataDesativacao\":" + (dataDesativacao != null ? "\"" + dataDesativacao + "\"" : "null") +
        "}";
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}