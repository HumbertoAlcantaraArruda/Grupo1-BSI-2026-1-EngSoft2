package agape.model;

import java.sql.Connection;
import java.util.List;

import agape.dao.CategoriaProdutoDAO;

public class CategoriaProduto {
    private final CategoriaProdutoDAO dao = new CategoriaProdutoDAO();

    private int idCatProd;
    private String nome;
    private boolean ativo;

    public int getIdCatProd() {
        return idCatProd;
    }

    public void setIdCatProd(int idCatProd) {
        this.idCatProd = idCatProd;
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

    public List<CategoriaProduto> buscar(Connection conn, String nome, Boolean ativo) throws Exception {
        return dao.buscar(conn, nome, ativo);
    }

    public CategoriaProduto buscarPorId(Connection conn, int id) throws Exception {
        return dao.buscarPorId(conn, id);
    }

    public boolean existeNome(Connection conn, String nome, int idExcluir) throws Exception {
        return dao.existeNome(conn, nome, idExcluir);
    }

    /** GRASP Information Expert — a categoria sabe se possui produtos vinculados. */
    public boolean temProdutos(Connection conn) throws Exception {
        return dao.temProdutosVinculados(conn, this.idCatProd);
    }

    public void inserir(Connection conn) throws Exception {
        dao.inserir(conn, this);
    }

    public void atualizar(Connection conn) throws Exception {
        dao.atualizar(conn, this);
    }

    public void excluir(Connection conn) throws Exception {
        dao.excluir(conn, this.idCatProd);
    }

    public String toJson() {
        return "{" +
            "\"idCatProd\":" + idCatProd + "," +
            "\"nome\":\""    + esc(nome)  + "\"," +
            "\"ativo\":"     + ativo      +
        "}";
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
