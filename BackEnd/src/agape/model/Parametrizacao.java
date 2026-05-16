package agape.model;

import java.sql.Connection;
import java.sql.SQLException;

import agape.dao.ParametrizacaoDAO;

public class Parametrizacao {
    private final ParametrizacaoDAO dao = new ParametrizacaoDAO();

    private String cnpj;
    private String razaoSocial;
    private String nomeFantasia;
    private String logradouro;
    private String bairro;
    private String cidade;
    private String uf;
    private String cep;
    private String complemento;
    private String email;
    private String telefone1;
    private String telefone2;
    private String site;
    private String responsavel;
    private String logotipoPequeno;
    private String logotipoGrande;
    private String inscricaoEstadual;
    private String inscricaoMunicipal;
    private String numEndereco;
    private String pais;
    private String moedaPadrao;
    private String fusoHorario;
    private String obs;

    public String getCnpj() { return cnpj; }
    public void setCnpj(String cnpj) { this.cnpj = cnpj; }
    public String getRazaoSocial() { return razaoSocial; }
    public void setRazaoSocial(String razaoSocial) { this.razaoSocial = razaoSocial; }
    public String getNomeFantasia() { return nomeFantasia; }
    public void setNomeFantasia(String nomeFantasia) { this.nomeFantasia = nomeFantasia; }
    public String getLogradouro() { return logradouro; }
    public void setLogradouro(String logradouro) { this.logradouro = logradouro; }
    public String getBairro() { return bairro; }
    public void setBairro(String bairro) { this.bairro = bairro; }
    public String getCidade() { return cidade; }
    public void setCidade(String cidade) { this.cidade = cidade; }
    public String getUf() { return uf; }
    public void setUf(String uf) { this.uf = uf; }
    public String getCep() { return cep; }
    public void setCep(String cep) { this.cep = cep; }
    public String getComplemento() { return complemento; }
    public void setComplemento(String complemento) { this.complemento = complemento; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getTelefone1() { return telefone1; }
    public void setTelefone1(String telefone1) { this.telefone1 = telefone1; }
    public String getTelefone2() { return telefone2; }
    public void setTelefone2(String telefone2) { this.telefone2 = telefone2; }
    public String getSite() { return site; }
    public void setSite(String site) { this.site = site; }
    public String getResponsavel() { return responsavel; }
    public void setResponsavel(String responsavel) { this.responsavel = responsavel; }
    public String getLogotipoPequeno() { return logotipoPequeno; }
    public void setLogotipoPequeno(String logotipoPequeno) { this.logotipoPequeno = logotipoPequeno; }
    public String getLogotipoGrande() { return logotipoGrande; }
    public void setLogotipoGrande(String logotipoGrande) { this.logotipoGrande = logotipoGrande; }
    public String getInscricaoEstadual() { return inscricaoEstadual; }
    public void setInscricaoEstadual(String inscricaoEstadual) { this.inscricaoEstadual = inscricaoEstadual; }
    public String getInscricaoMunicipal() { return inscricaoMunicipal; }
    public void setInscricaoMunicipal(String inscricaoMunicipal) { this.inscricaoMunicipal = inscricaoMunicipal; }
    public String getNumEndereco() { return numEndereco; }
    public void setNumEndereco(String numEndereco) { this.numEndereco = numEndereco; }
    public String getPais() { return pais; }
    public void setPais(String pais) { this.pais = pais; }
    public String getMoedaPadrao() { return moedaPadrao; }
    public void setMoedaPadrao(String moedaPadrao) { this.moedaPadrao = moedaPadrao; }
    public String getFusoHorario() { return fusoHorario; }
    public void setFusoHorario(String fusoHorario) { this.fusoHorario = fusoHorario; }
    public String getObs() { return obs; }
    public void setObs(String obs) { this.obs = obs; }

    // ── Persistência (DAO encapsulado) ─────────────────────────────────────

    public Parametrizacao buscar(Connection conn) throws SQLException {
        return dao.buscar(conn);
    }

    public void salvar(Connection conn) throws SQLException {
        dao.salvar(conn, this);
    }

    public void atualizarLogos(Connection conn, String nomeGrande, String nomePequeno) throws SQLException {
        dao.atualizarLogos(conn, nomeGrande, nomePequeno);
    }

    public String toJson() {
        return "{" +
            "\"cnpj\":\"" + (cnpj != null ? cnpj : "") + "\"," +
            "\"razaoSocial\":\"" + (razaoSocial != null ? razaoSocial : "") + "\"," +
            "\"nomeFantasia\":\"" + (nomeFantasia != null ? nomeFantasia : "") + "\"," +
            "\"logradouro\":\"" + (logradouro != null ? logradouro : "") + "\"," +
            "\"bairro\":\"" + (bairro != null ? bairro : "") + "\"," +
            "\"cidade\":\"" + (cidade != null ? cidade : "") + "\"," +
            "\"uf\":\"" + (uf != null ? uf : "") + "\"," +
            "\"cep\":\"" + (cep != null ? cep : "") + "\"," +
            "\"complemento\":\"" + (complemento != null ? complemento : "") + "\"," +
            "\"email\":\"" + (email != null ? email : "") + "\"," +
            "\"telefone1\":\"" + (telefone1 != null ? telefone1 : "") + "\"," +
            "\"telefone2\":\"" + (telefone2 != null ? telefone2 : "") + "\"," +
            "\"site\":\"" + (site != null ? site : "") + "\"," +
            "\"responsavel\":\"" + (responsavel != null ? responsavel : "") + "\"," +
            "\"logotipoPequeno\":\"" + (logotipoPequeno != null ? logotipoPequeno : "") + "\"," +
            "\"logotipoGrande\":\"" + (logotipoGrande != null ? logotipoGrande : "") + "\"," +
            "\"inscricaoEstadual\":\"" + (inscricaoEstadual != null ? inscricaoEstadual : "") + "\"," +
            "\"inscricaoMunicipal\":\"" + (inscricaoMunicipal != null ? inscricaoMunicipal : "") + "\"," +
            "\"numEndereco\":\"" + (numEndereco != null ? numEndereco : "") + "\"," +
            "\"pais\":\"" + (pais != null ? pais : "") + "\"," +
            "\"moedaPadrao\":\"" + (moedaPadrao != null ? moedaPadrao : "") + "\"," +
            "\"fusoHorario\":\"" + (fusoHorario != null ? fusoHorario : "") + "\"," +
            "\"obs\":\"" + (obs != null ? obs.replace("\n", " ").replace("\"", "'") : "") + "\"" +
            "}";
    }
}
