package agape.model;

import agape.dao.FornecedorDAO;

import java.sql.Connection;
import java.util.List;

public class Fornecedor {
    private final FornecedorDAO dao = new FornecedorDAO();

    private int idFornec;
    private String nome;
    private String telefone1;
    private String telefone2;
    private String email;
    private String site;
    private String contato;
    private String cep;
    private String logradouro;
    private String cnpj;
    private String cidade;
    private String uf; /* SP RJ MG DF */
    private String obs;
    private int ativo;

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

    public String getCep() {
        return cep;
    }
    public void setCep(String cep) {
        this.cep = cep;
    }

    public String getLogradouro() {
        return logradouro;
    }
    public void setLogradouro(String logradouro) {
        this.logradouro = logradouro;
    }

    public String getCnpj() {
        return cnpj;
    }
    public void setCnpj(String cnpj) {
        this.cnpj = cnpj;
    }

    public String getCidade() {
        return cidade;
    }
    public void setCidade(String cidade) {
        this.cidade = cidade;
    }

    public String getUf() {
        return uf;
    }
    public void setUf(String uf) {
        this.uf = uf;
    }

    public String getObs() {
        return obs;
    }
    public void setObs(String obs) {
        this.obs = obs;
    }

    public int getAtivo() {
        return ativo;
    }
    public void setAtivo(int ativo) {
        this.ativo = ativo;
    }

    // ── Persistência (DAO encapsulado) ─────────────────────────────────────

    public List<Fornecedor> buscar(Connection conn, String nome, Integer ativo) throws Exception {
        return dao.buscar(conn, nome, ativo);
    }

    public Fornecedor buscarPorId(Connection conn, int id) throws Exception {
        return dao.buscarPorId(conn, id);
    }

    public boolean existeNome(Connection conn, String nome, int idExcluir) throws Exception {
        return dao.existeNome(conn, nome, idExcluir);
    }

    public void inserir(Connection conn) throws Exception {
        dao.inserir(conn, this);
    }

    public void atualizar(Connection conn) throws Exception {
        dao.atualizar(conn, this);
    }

    public void excluir(Connection conn) throws Exception {
        dao.excluir(conn, this.idFornec);
    }

    public String toJson() {
        return "{" +
            "\"idFornec\":"     + idFornec          + "," +
            "\"nome\":\""       + esc(nome)         + "\"," +
            "\"telefone1\":\""  + esc(telefone1)    + "\"," +
            "\"telefone2\":\""  + esc(telefone2)    + "\"," +
            "\"email\":\""      + esc(email)        + "\"," +
            "\"site\":\""       + esc(site)         + "\"," +
            "\"contato\":\""    + esc(contato)      + "\"," +
            "\"cep\":\""        + esc(cep)          + "\"," +
            "\"logradouro\":\"" + esc(logradouro)   + "\"," +
            "\"cnpj\":\""       + esc(cnpj)         + "\"," +
            "\"cidade\":\""     + esc(cidade)       + "\"," +
            "\"uf\":\""         + esc(uf)           + "\"," +
            "\"obs\":\""        + esc(obs)          + "\"," +
            "\"ativo\":"        + ativo             +
        "}";
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
