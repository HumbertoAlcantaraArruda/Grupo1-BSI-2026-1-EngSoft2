package agape.model;

import java.sql.Connection;
import java.util.List;

import agape.dao.CategoriaEventoDAO;

public class CategoriaEvento {
    private final CategoriaEventoDAO dao = new CategoriaEventoDAO();

    private int idCatEvento;
    private String nome;
    private boolean ativo = true;

    public int getIdCatEvento() {
        return idCatEvento;
    }

    public void setIdCatEvento(int idCatEvento) {
        this.idCatEvento = idCatEvento;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public boolean isAtivo() {
        return ativo;
    }

    public void setAtivo(boolean ativo) {
        this.ativo = ativo;
    }

    // ── Persistência (DAO encapsulado) ─────────────────────────────────────

    public List<CategoriaEvento> listar(Connection conn) throws Exception {
        return dao.listar(conn);
    }

    public List<CategoriaEvento> buscar(Connection conn, String nome, Boolean ativo) throws Exception {
        return dao.buscar(conn, nome, ativo);
    }

    public CategoriaEvento buscarPorId(Connection conn, int id) throws Exception {
        return dao.buscarPorId(conn, id);
    }

    public CategoriaEvento buscarPorNome(Connection conn, String nome) throws Exception {
        return dao.buscarPorNome(conn, nome);
    }

    public boolean existeNome(Connection conn, String nome, int idExcluir) throws Exception {
        return dao.existeNome(conn, nome, idExcluir);
    }

    /** GRASP Information Expert — a categoria sabe se possui eventos vinculados. */
    public boolean temEventos(Connection conn) throws Exception {
        return dao.temEventosVinculados(conn, this.idCatEvento);
    }

    public void inserir(Connection conn) throws Exception {
        dao.inserir(conn, this);
    }

    public void atualizar(Connection conn) throws Exception {
        dao.atualizar(conn, this);
    }

    public void excluir(Connection conn) throws Exception {
        dao.excluir(conn, this.idCatEvento);
    }

    public String toJson() {
        return "{" +
            "\"idCatEvento\":" + idCatEvento + "," +
            "\"nome\":\""      + esc(nome)   + "\"," +
            "\"ativo\":"       + ativo        +
        "}";
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
