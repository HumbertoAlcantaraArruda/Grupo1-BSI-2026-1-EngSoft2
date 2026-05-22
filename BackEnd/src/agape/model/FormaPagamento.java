package agape.model;

import java.sql.Connection;
import java.util.List;

import agape.dao.FormaPagamentoDAO;

public class FormaPagamento {

    private final FormaPagamentoDAO dao = new FormaPagamentoDAO();

    private int     idFormaPag;
    private String  descricao;
    private int     ativo;
    private boolean permiteParcelar;

    public int     getIdFormaPag()      { return idFormaPag;      }
    public String  getDescricao()       { return descricao;       }
    public int     getAtivo()           { return ativo;           }
    public boolean isPermiteParcelar()  { return permiteParcelar; }

    public void setIdFormaPag     (int     v) { this.idFormaPag      = v; }
    public void setDescricao      (String  v) { this.descricao       = v; }
    public void setAtivo          (int     v) { this.ativo           = v; }
    public void setPermiteParcelar(boolean v) { this.permiteParcelar = v; }

    // ── Persistência (DAO encapsulado) ─────────────────────────────────────

    public List<FormaPagamento> listar(Connection conn) throws Exception {
        return dao.listar(conn);
    }

    public List<FormaPagamento> buscar(Connection conn, String descricao, Boolean ativo) throws Exception {
        return dao.buscar(conn, descricao, ativo);
    }

    public FormaPagamento buscarPorId(Connection conn, int id) throws Exception {
        return dao.buscarPorId(conn, id);
    }

    public boolean existeDescricao(Connection conn, String descricao, int idExcluir) throws Exception {
        return dao.existeDescricao(conn, descricao, idExcluir);
    }

    public void inserir(Connection conn) throws Exception {
        dao.inserir(conn, this);
    }

    public void atualizar(Connection conn) throws Exception {
        dao.atualizar(conn, this);
    }

    public void excluir(Connection conn) throws Exception {
        dao.excluir(conn, this.idFormaPag);
    }

    public String toJson() {
        return "{" +
            "\"idFormaPag\":"       + idFormaPag       + "," +
            "\"descricao\":\""      + esc(descricao)   + "\"," +
            "\"ativo\":"            + ativo             + "," +
            "\"permiteParcelar\":"  + permiteParcelar   +
        "}";
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}