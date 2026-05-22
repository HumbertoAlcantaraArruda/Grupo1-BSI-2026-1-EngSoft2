package agape.model;

import java.sql.Connection;
import java.util.List;

import agape.dao.EventoStatusDAO;

public class EventoStatus {
    private final EventoStatusDAO dao = new EventoStatusDAO();

    private int idEventoStatus;
    private String nome;
    private boolean status = true;

    public int getIdEventoStatus() { return idEventoStatus; }
    public void setIdEventoStatus(int idEventoStatus) { this.idEventoStatus = idEventoStatus; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public boolean isStatus() { return status; }
    public void setStatus(boolean status) { this.status = status; }

    // ── Persistência (DAO encapsulado) ─────────────────────────────────────

    public List<EventoStatus> buscar(Connection conn, String nome, Boolean status) throws Exception {
        return dao.buscar(conn, nome, status);
    }

    public EventoStatus buscarPorId(Connection conn, int id) throws Exception {
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
        dao.excluir(conn, this.idEventoStatus);
    }

    public String toJson() {
        return "{" +
            "\"idEventoStatus\":" + idEventoStatus + "," +
            "\"nome\":\""         + esc(nome)       + "\"," +
            "\"status\":"         + status           +
        "}";
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
