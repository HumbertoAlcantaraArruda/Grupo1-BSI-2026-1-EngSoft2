package agape.model;

public class Parametrizacao {
    private String cnpj;
    private String razaoSocial;
    private String nomeFantasia;
    private String endereco;
    private String bairro;
    private String cidade;
    private String uf;
    private String cep;
    private String email;
    private String telefone1;
    private String responsavel;

    public Parametrizacao() {}

    // Getters e Setters
    public String getCnpj() { return cnpj; }
    public void setCnpj(String cnpj) { this.cnpj = cnpj; }
    public String getRazaoSocial() { return razaoSocial; }
    public void setRazaoSocial(String razaoSocial) { this.razaoSocial = razaoSocial; }
    public String getNomeFantasia() { return nomeFantasia; }
    public void setNomeFantasia(String nomeFantasia) { this.nomeFantasia = nomeFantasia; }
    public String getEndereco() { return endereco; }
    public void setEndereco(String endereco) { this.endereco = endereco; }
    public String getBairro() { return bairro; }
    public void setBairro(String bairro) { this.bairro = bairro; }
    public String getCidade() { return cidade; }
    public void setCidade(String cidade) { this.cidade = cidade; }
    public String getUf() { return uf; }
    public void setUf(String uf) { this.uf = uf; }
    public String getCep() { return cep; }
    public void setCep(String cep) { this.cep = cep; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getTelefone1() { return telefone1; }
    public void setTelefone1(String telefone1) { this.telefone1 = telefone1; }
    public String getResponsavel() { return responsavel; }
    public void setResponsavel(String responsavel) { this.responsavel = responsavel; }

    // MÉTODO ESSENCIAL PARA O NAVEGADOR MOSTRAR OS DADOS
    public String toJson() {
        return "{" +
            "\"cnpj\":\"" + cnpj + "\"," +
            "\"razaoSocial\":\"" + razaoSocial + "\"," +
            "\"nomeFantasia\":\"" + nomeFantasia + "\"," +
            "\"endereco\":\"" + endereco + "\"," +
            "\"email\":\"" + email + "\"," +
            "\"telefone1\":\"" + telefone1 + "\"," +
            "\"responsavel\":\"" + responsavel + "\"" +
            "}";
    }
}