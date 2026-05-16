package agape.model;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;

import agape.dao.ProdutoDAO;

public class Produto {
    private final ProdutoDAO dao = new ProdutoDAO();

    private int idProd;
    private int idCatProd;
    private String nomeCategoria;
    private String nome;
    private float valorUni;
    private int qtdeAtual;

    public int getIdProd() {
        return idProd;
    }

    public void setIdProd(int idProd) {
        this.idProd = idProd;
    }

    public int getIdCatProd() {
        return idCatProd;
    }

    public void setIdCatProd(int idCatProd) {
        this.idCatProd = idCatProd;
    }

    public String getNomeCategoria() {
        return nomeCategoria;
    }

    public void setNomeCategoria(String nomeCategoria) {
        this.nomeCategoria = nomeCategoria;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public float getValorUni() {
        return valorUni;
    }

    public void setValorUni(float valorUni) {
        this.valorUni = valorUni;
    }

    public int getQtdeAtual() {
        return qtdeAtual;
    }

    public void setQtdeAtual(int qtdeAtual) {
        this.qtdeAtual = qtdeAtual;
    }

    // ── Persistência (DAO encapsulado) ─────────────────────────────────────

    public List<Produto> buscar(Connection conn, int qtd, String catProd, String nome, String op) throws SQLException {
        return dao.buscar(conn, qtd, catProd, nome, op);
    }

    public Produto buscarPorId(Connection conn, int id) throws SQLException {
        return dao.buscarPorId(conn, id);
    }

    public boolean existeNome(Connection conn, String nome, int idIgnorar) throws SQLException {
        return dao.existeNome(conn, nome, idIgnorar);
    }

    public void inserir(Connection conn) throws SQLException {
        dao.inserir(conn, this);
    }

    public void atualizar(Connection conn) throws SQLException {
        dao.atualizar(conn, this);
    }

    public void excluir(Connection conn) throws SQLException {
        dao.excluir(conn, this.idProd);
    }

    public String toJson() {
        return "{" +
                "\"idProd\":" + idProd + "," +
                "\"idCatProd\":" + idCatProd + "," +
                "\"nomeCategoria\":" + (nomeCategoria != null ? "\"" + nomeCategoria + "\"" : "null") + "," +
                "\"nome\":\"" + nome + "\"," +
                "\"valorUni\":" + valorUni + "," +
                "\"qtdeAtual\":" + qtdeAtual +
                "}";
    }
}
