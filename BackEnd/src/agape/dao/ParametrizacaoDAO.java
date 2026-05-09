package agape.dao;

import agape.control.ConexaoBD;
import agape.model.Parametrizacao;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class ParametrizacaoDAO {

    private Connection conn;

    public ParametrizacaoDAO() {
        this.conn = ConexaoBD.getInstance().getConexao();
    }

    public Parametrizacao buscar() throws SQLException {
        String sql = "SELECT * FROM parametrizacao LIMIT 1";
        try (PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            if (rs.next()) {
                Parametrizacao p = new Parametrizacao();
                p.setCnpj(rs.getString("cnpj"));
                p.setRazaoSocial(rs.getString("razaoSocial"));
                p.setNomeFantasia(rs.getString("nomeFantasia"));
                p.setEndereco(rs.getString("endereco"));
                p.setBairro(rs.getString("bairro"));
                p.setCidade(rs.getString("cidade"));
                p.setUf(rs.getString("uf"));
                p.setCep(rs.getString("cep"));
                p.setEmail(rs.getString("email"));
                p.setTelefone1(rs.getString("telefone1"));
                p.setResponsavel(rs.getString("responsavel"));
                return p;
            }
        }
        return null;
    }

    public void salvar(Parametrizacao p) throws SQLException {
        // Verifica se já existe um registro
        Parametrizacao atual = buscar();
        
        if (atual == null) {
            String sql = "INSERT INTO parametrizacao (cnpj, razaoSocial, nomeFantasia, endereco, bairro, cidade, uf, cep, email, telefone1, responsavel) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, p.getCnpj());
                stmt.setString(2, p.getRazaoSocial());
                stmt.setString(3, p.getNomeFantasia());
                stmt.setString(4, p.getEndereco());
                stmt.setString(5, p.getBairro());
                stmt.setString(6, p.getCidade());
                stmt.setString(7, p.getUf());
                stmt.setString(8, p.getCep());
                stmt.setString(9, p.getEmail());
                stmt.setString(10, p.getTelefone1());
                stmt.setString(11, p.getResponsavel());
                stmt.executeUpdate();
            }
        } else {
            String sql = "UPDATE parametrizacao SET cnpj=?, razaoSocial=?, nomeFantasia=?, endereco=?, bairro=?, cidade=?, uf=?, cep=?, email=?, telefone1=?, responsavel=?";
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, p.getCnpj());
                stmt.setString(2, p.getRazaoSocial());
                stmt.setString(3, p.getNomeFantasia());
                stmt.setString(4, p.getEndereco());
                stmt.setString(5, p.getBairro());
                stmt.setString(6, p.getCidade());
                stmt.setString(7, p.getUf());
                stmt.setString(8, p.getCep());
                stmt.setString(9, p.getEmail());
                stmt.setString(10, p.getTelefone1());
                stmt.setString(11, p.getResponsavel());
                stmt.executeUpdate();
            }
        }
    }
}
