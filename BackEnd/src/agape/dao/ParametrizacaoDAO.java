package agape.dao;

import agape.model.Parametrizacao;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class ParametrizacaoDAO {

    public Parametrizacao buscar(Connection conn) throws SQLException {
        String sql = "SELECT * FROM Parametrizacao LIMIT 1";
        try (PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            if (rs.next()) {
                Parametrizacao p = new Parametrizacao();
                p.setCnpj(rs.getString("cnpj"));
                p.setRazaoSocial(rs.getString("razaoSocial"));
                p.setNomeFantasia(rs.getString("nomeFantasia"));
                p.setEndereco(rs.getString("logradouro"));
                p.setBairro(rs.getString("bairro"));
                p.setCidade(rs.getString("cidade"));
                p.setUf(rs.getString("uf"));
                p.setCep(rs.getString("cep"));
                p.setComplemento(rs.getString("complemento"));
                p.setEmail(rs.getString("email"));
                p.setTelefone1(rs.getString("telefone1"));
                p.setTelefone2(rs.getString("telefone2"));
                p.setSite(rs.getString("site"));
                p.setResponsavel(rs.getString("responsavel"));
                p.setLogotipoPequeno(rs.getString("logotipoPequeno"));
                p.setLogotipoGrande(rs.getString("logotipoGrande"));
                p.setInscricaoEstadual(rs.getString("inscricaoEstadual"));
                p.setInscricaoMunicipal(rs.getString("inscricaoMunicipal"));
                p.setNumEndereco(rs.getString("numEndereco"));
                p.setPais(rs.getString("pais"));
                p.setMoedaPadrao(rs.getString("moedaPadrao"));
                p.setFusoHorario(rs.getString("fusoHorario"));
                p.setObs(rs.getString("obs"));
                return p;
            }
        }
        return null;
    }

    public void salvar(Connection conn, Parametrizacao p) throws SQLException {
        Parametrizacao atual = buscar(conn);
        
        if (atual == null) {
            String sql = "INSERT INTO Parametrizacao (cnpj, razaoSocial, nomeFantasia, logradouro, bairro, cidade, uf, cep, complemento, email, telefone1, telefone2, site, responsavel, logotipoPequeno, logotipoGrande, inscricaoEstadual, inscricaoMunicipal, numEndereco, pais, moedaPadrao, fusoHorario, obs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                preencherStmt(stmt, p);
                stmt.executeUpdate();
            }
        } else {
            // Voltando para o UPDATE seguro (usando o CNPJ da linha que já existe)
            String sql = "UPDATE Parametrizacao SET cnpj=?, razaoSocial=?, nomeFantasia=?, logradouro=?, bairro=?, cidade=?, uf=?, cep=?, complemento=?, email=?, telefone1=?, telefone2=?, site=?, responsavel=?, logotipoPequeno=?, logotipoGrande=?, inscricaoEstadual=?, inscricaoMunicipal=?, numEndereco=?, pais=?, moedaPadrao=?, fusoHorario=?, obs=? WHERE cnpj=?";
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                preencherStmt(stmt, p);
                // Se o CNPJ atual for nulo, tenta usar o CNPJ do objeto novo para o WHERE
                String cnpjFiltro = (atual.getCnpj() != null) ? atual.getCnpj() : p.getCnpj();
                stmt.setString(24, cnpjFiltro);
                stmt.executeUpdate();
            }
        }
    }

    private void preencherStmt(PreparedStatement stmt, Parametrizacao p) throws SQLException {
        stmt.setString(1, p.getCnpj());
        stmt.setString(2, p.getRazaoSocial());
        stmt.setString(3, p.getNomeFantasia());
        stmt.setString(4, p.getEndereco());
        stmt.setString(5, p.getBairro());
        stmt.setString(6, p.getCidade());
        stmt.setString(7, p.getUf());
        stmt.setString(8, p.getCep());
        stmt.setString(9, p.getComplemento());
        stmt.setString(10, p.getEmail());
        stmt.setString(11, p.getTelefone1());
        stmt.setString(12, p.getTelefone2());
        stmt.setString(13, p.getSite());
        stmt.setString(14, p.getResponsavel());
        stmt.setString(15, p.getLogotipoPequeno());
        stmt.setString(16, p.getLogotipoGrande());
        stmt.setString(17, p.getInscricaoEstadual());
        stmt.setString(18, p.getInscricaoMunicipal());
        stmt.setString(19, p.getNumEndereco());
        stmt.setString(20, p.getPais());
        stmt.setString(21, p.getMoedaPadrao());
        stmt.setString(22, p.getFusoHorario());
        stmt.setString(23, p.getObs());
    }
}
