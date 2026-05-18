package agape.dao;

import agape.model.Fornecedor;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class FornecedorDAO {

    private Fornecedor mapear(ResultSet rs) throws SQLException {
        Fornecedor f = new Fornecedor();
        f.setIdFornec(rs.getInt("idFornec"));
        f.setNome(rs.getString("nome"));
        f.setTelefone1(rs.getString("telefone1"));
        f.setTelefone2(rs.getString("telefone2"));
        f.setEmail(rs.getString("email"));
        f.setSite(rs.getString("site"));
        f.setContato(rs.getString("contato"));
        f.setCep(rs.getString("cep"));
        f.setLogradouro(rs.getString("logradouro"));
        f.setCnpj(rs.getString("cnpj"));
        f.setCidade(rs.getString("cidade"));
        f.setUf(rs.getString("uf"));
        f.setObs(rs.getString("obs"));
        f.setAtivo(rs.getInt("ativo"));
        return f;
    }

    public List<Fornecedor> buscar(Connection conn, String nome, Integer ativo) throws Exception {
        StringBuilder sql = new StringBuilder("SELECT * FROM Fornecedor WHERE 1=1");
        if (nome != null && !nome.isEmpty()) sql.append(" AND nome LIKE ?");
        if (ativo != null) sql.append(" AND ativo = ?");
        sql.append(" ORDER BY nome");

        List<Fornecedor> lista = new ArrayList<>();
        try (PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            int i = 1;
            if (nome != null && !nome.isEmpty()) stmt.setString(i++, "%" + nome + "%");
            if (ativo != null) stmt.setInt(i++, ativo);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) lista.add(mapear(rs));
            }
        }
        return lista;
    }

    public Fornecedor buscarPorId(Connection conn, int id) throws Exception {
        String sql = "SELECT * FROM Fornecedor WHERE idFornec = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return mapear(rs);
            }
        }
        return null;
    }

    public boolean existeNome(Connection conn, String nome, int idExcluir) throws Exception {
        String sql = "SELECT 1 FROM Fornecedor WHERE nome = ? AND idFornec <> ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, nome);
            stmt.setInt(2, idExcluir);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        }
    }

    public void inserir(Connection conn, Fornecedor f) throws Exception {
        String sql = "INSERT INTO Fornecedor (nome, telefone1, telefone2, email, site, contato, cep, logradouro, cnpj, cidade, uf, obs, ativo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setString(1,  f.getNome());
            stmt.setString(2,  f.getTelefone1());
            stmt.setString(3,  f.getTelefone2());
            stmt.setString(4,  f.getEmail());
            stmt.setString(5,  f.getSite());
            stmt.setString(6,  f.getContato());
            stmt.setString(7,  f.getCep());
            stmt.setString(8,  f.getLogradouro());
            stmt.setString(9,  f.getCnpj());
            stmt.setString(10, f.getCidade());
            stmt.setString(11, f.getUf());
            stmt.setString(12, f.getObs());
            stmt.setInt(13,    f.getAtivo());
            stmt.executeUpdate();
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) f.setIdFornec(rs.getInt(1));
            }
        }
    }

    public void atualizar(Connection conn, Fornecedor f) throws Exception {
        String sql = "UPDATE Fornecedor SET nome = ?, telefone1 = ?, telefone2 = ?, email = ?, site = ?, contato = ?, cep = ?, logradouro = ?, cnpj = ?, cidade = ?, uf = ?, obs = ?, ativo = ? WHERE idFornec = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1,  f.getNome());
            stmt.setString(2,  f.getTelefone1());
            stmt.setString(3,  f.getTelefone2());
            stmt.setString(4,  f.getEmail());
            stmt.setString(5,  f.getSite());
            stmt.setString(6,  f.getContato());
            stmt.setString(7,  f.getCep());
            stmt.setString(8,  f.getLogradouro());
            stmt.setString(9,  f.getCnpj());
            stmt.setString(10, f.getCidade());
            stmt.setString(11, f.getUf());
            stmt.setString(12, f.getObs());
            stmt.setInt(13,    f.getAtivo());
            stmt.setInt(14,    f.getIdFornec());
            stmt.executeUpdate();
        }
    }

    public void excluir(Connection conn, int id) throws Exception {
        String sql = "DELETE FROM Fornecedor WHERE idFornec = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, id);
            stmt.executeUpdate();
        }
    }
}
