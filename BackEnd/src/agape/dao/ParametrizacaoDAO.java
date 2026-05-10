package agape.dao;

import agape.model.Parametrizacao;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class ParametrizacaoDAO {

    public ParametrizacaoDAO() {
    }

    public Parametrizacao buscar(Connection conn) throws SQLException {
        // CORREÇÃO: P Maiúsculo
        String sql = "SELECT * FROM Parametrizacao LIMIT 1";
        try (PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            if (rs.next()) {
                Parametrizacao p = new Parametrizacao();
                p.setCnpj(rs.getString("cnpj"));
                p.setRazaoSocial(rs.getString("razaoSocial"));
                p.setNomeFantasia(rs.getString("nomeFantasia"));
                // CORREÇÃO: logradouro em vez de endereco
                p.setEndereco(rs.getString("logradouro"));
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

    public void salvar(Connection conn, Parametrizacao p) throws SQLException {
        Parametrizacao atual = buscar(conn);
        
        if (atual == null) {
            // CORREÇÃO: Parametrizacao (P) e logradouro
            String sql = "INSERT INTO Parametrizacao (cnpj, razaoSocial, nomeFantasia, logradouro, bairro, cidade, uf, cep, email, telefone1, responsavel) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
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
            // CORREÇÃO: Parametrizacao (P) e logradouro
            String sql = "UPDATE Parametrizacao SET cnpj=?, razaoSocial=?, nomeFantasia=?, logradouro=?, bairro=?, cidade=?, uf=?, cep=?, email=?, telefone1=?, responsavel=?";
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
