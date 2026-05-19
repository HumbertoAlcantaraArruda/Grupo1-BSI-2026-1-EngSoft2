package agape.model;

import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.List;

import agape.dao.UsuarioDAO;

public class Usuario {

    private final UsuarioDAO dao = new UsuarioDAO();

    private int idUsuario;
    private String nome;
    private String cpf;
    private String email;
    private String senha;
    private int status;
    private String nivel;
    private int primeiroAcesso;
    private LocalDateTime dataAtivacao;
    private LocalDateTime dataDesativacao;

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

    public int getPrimeiroAcesso() {
        return primeiroAcesso;
    }

    public void setPrimeiroAcesso(int primeiroAcesso) {
        this.primeiroAcesso = primeiroAcesso;
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

    // ── Persistência (DAO encapsulado) ─────────────────────────────────────

    public List<Usuario> listar(Connection conn) throws Exception {
        return dao.listar(conn);
    }

    public Usuario buscarPorId(Connection conn, int id) throws Exception {
        return dao.buscarPorId(conn, id);
    }

    public Usuario buscarPorCpf(Connection conn, String cpf) throws Exception {
        return dao.buscarPorCpf(conn, cpf);
    }

    public Usuario buscarPorEmail(Connection conn, String email) throws Exception {
        return dao.buscarPorEmail(conn, email);
    }

    public boolean existeCpf(Connection conn, String cpf, int idExcluir) throws Exception {
        return dao.existeCpf(conn, cpf, idExcluir);
    }

    public boolean existeEmail(Connection conn, String email, int idExcluir) throws Exception {
        return dao.existeEmail(conn, email, idExcluir);
    }

    public void inserir(Connection conn) throws Exception {
        dao.inserir(conn, this);
    }

    public void atualizar(Connection conn) throws Exception {
        dao.atualizar(conn, this);
    }

    public void ativar(Connection conn) throws Exception {
        dao.ativar(conn, this.idUsuario);
    }

    public void desativar(Connection conn) throws Exception {
        dao.desativar(conn, this.idUsuario);
    }

    public int contarAdmAtivos(Connection conn) throws Exception {
        return dao.contarAdmAtivos(conn);
    }

    public void excluir(Connection conn) throws Exception {
        dao.excluir(conn, this.idUsuario);
    }

    public void alterarSenha(Connection conn, String novaSenhaHash) throws Exception {
        dao.alterarSenha(conn, this.idUsuario, novaSenhaHash);
    }

    public void resetarSenha(Connection conn, String senhaHash) throws Exception {
        dao.resetarSenha(conn, this.idUsuario, senhaHash);
    }

    public String toJson() {
        return "{" +
            "\"idUsuario\":"   + idUsuario + "," +
            "\"nome\":\""      + esc(nome)  + "\"," +
            "\"cpf\":\""       + esc(cpf)   + "\"," +
            "\"email\":\""     + esc(email) + "\"," +
            "\"status\":"      + status     + "," +
            "\"nivel\":\""     + esc(nivel) + "\"," +
            "\"primeiroAcesso\":" + primeiroAcesso + "," +
            "\"dataAtivacao\":"    + (dataAtivacao    != null ? "\"" + dataAtivacao    + "\"" : "null") + "," +
            "\"dataDesativacao\":" + (dataDesativacao != null ? "\"" + dataDesativacao + "\"" : "null") +
        "}";
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
