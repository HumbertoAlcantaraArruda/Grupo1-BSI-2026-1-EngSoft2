package agape.dao;

import agape.model.EventoStatus;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class EventoStatusDAO {

    private EventoStatus mapear(ResultSet rs) throws SQLException {
        EventoStatus e = new EventoStatus();
        e.setIdEventoStatus(rs.getInt("idEventoStatus"));
        e.setNome(rs.getString("nome"));
        e.setStatus(rs.getBoolean("status"));
        return e;
    }

    public List<EventoStatus> buscar(Connection conn, String nome, Boolean status) throws Exception {
        StringBuilder sql = new StringBuilder("SELECT * FROM EventoStatus WHERE 1=1");
        if (nome   != null && !nome.isEmpty()) sql.append(" AND nome LIKE ?");
        if (status != null)                    sql.append(" AND status=?");
        sql.append(" ORDER BY nome");

        List<EventoStatus> lista = new ArrayList<>();
        try (PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            int i = 1;
            if (nome   != null && !nome.isEmpty()) stmt.setString(i++, "%" + nome + "%");
            if (status != null)                    stmt.setBoolean(i++, status);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) lista.add(mapear(rs));
            }
        }
        return lista;
    }

    public EventoStatus buscarPorId(Connection conn, int id) throws Exception {
        String sql = "SELECT * FROM EventoStatus WHERE idEventoStatus=?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return mapear(rs);
            }
        }
        return null;
    }

    public boolean existeNome(Connection conn, String nome, int idExcluir) throws Exception {
        String sql = "SELECT 1 FROM EventoStatus WHERE nome=? AND idEventoStatus<>?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, nome);
            stmt.setInt(2, idExcluir);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        }
    }

    public void inserir(Connection conn, EventoStatus e) throws Exception {
        String sql = "INSERT INTO EventoStatus (nome, status) VALUES (?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setString(1, e.getNome());
            stmt.setBoolean(2, e.isStatus());
            stmt.executeUpdate();
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) e.setIdEventoStatus(rs.getInt(1));
            }
        }
    }

    public void atualizar(Connection conn, EventoStatus e) throws Exception {
        String sql = "UPDATE EventoStatus SET nome=?, status=? WHERE idEventoStatus=?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, e.getNome());
            stmt.setBoolean(2, e.isStatus());
            stmt.setInt(3, e.getIdEventoStatus());
            stmt.executeUpdate();
        }
    }

    public void excluir(Connection conn, int id) throws Exception {
        String sql = "DELETE FROM EventoStatus WHERE idEventoStatus=?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, id);
            stmt.executeUpdate();
        }
    }
}
