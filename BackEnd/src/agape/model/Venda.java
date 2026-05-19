package agape.model;

import java.sql.Connection;
import java.time.LocalDateTime;

import agape.dao.VendaDAO;

public class Venda {
    private final VendaDAO dao = new VendaDAO();
    private int idVenda;
    private int idColaborador;
    private int idUsuario;
    private int idFormaPag;
    private LocalDateTime dataHora;
    private float totBruto;
    private float credUtilizado;
    private float valorFinal;

    public int getIdVenda() {
        return idVenda;
    }

    public void setIdVenda(int idVenda) {
        this.idVenda = idVenda;
    }

    public int getIdColaborador() {
        return idColaborador;
    }

    public void setIdColaborador(int idColaborador) {
        this.idColaborador = idColaborador;
    }

    public int getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(int idUsuario) {
        this.idUsuario = idUsuario;
    }

    public int getIdFormaPag() {
        return idFormaPag;
    }

    public void setIdFormaPag(int idFormaPag) {
        this.idFormaPag = idFormaPag;
    }

    public LocalDateTime getDataHora() {
        return dataHora;
    }

    public void setDataHora(LocalDateTime dataHora) {
        this.dataHora = dataHora;
    }

    public float getTotBruto() {
        return totBruto;
    }

    public void setTotBruto(float totBruto) {
        this.totBruto = totBruto;
    }

    public float getCredUtilizado() {
        return credUtilizado;
    }

    public void setCredUtilizado(float credUtilizado) {
        this.credUtilizado = credUtilizado;
    }

    public float getValorFinal() {
        return valorFinal;
    }

    public void setValorFinal(float valorFinal) {
        this.valorFinal = valorFinal;
    }

    // ── Campos de exibição (preenchidos por JOIN no DAO, não persistidos) ─────

    private String nomeParoquiano;
    private String nomeColaborador;
    private String descFormaPag;

    public String getNomeParoquiano() { return nomeParoquiano; }
    public String getNomeColaborador() { return nomeColaborador; }
    public String getDescFormaPag()    { return descFormaPag;    }

    public void setNomeParoquiano(String v) { this.nomeParoquiano = v; }
    public void setNomeColaborador(String v) { this.nomeColaborador = v; }
    public void setDescFormaPag(String v)    { this.descFormaPag    = v; }

    // ── Persistência ──────────────────────────────────────────────────────────

    public int inserir(Connection conn) throws Exception {
        return dao.inserir(conn, this);
    }

    public java.util.List<Venda> listar(Connection conn, String dataInicio, String dataFim) throws Exception {
        return dao.listar(conn, dataInicio, dataFim);
    }

    public String toJson() {
        return "{" +
            "\"idVenda\":"         + idVenda         + "," +
            "\"idColaborador\":"   + idColaborador   + "," +
            "\"idUsuario\":"       + idUsuario       + "," +
            "\"idFormaPag\":"      + idFormaPag      + "," +
            "\"dataHora\":"        + (dataHora != null ? "\"" + dataHora + "\"" : "null") + "," +
            "\"totBruto\":"        + totBruto        + "," +
            "\"credUtilizado\":"   + credUtilizado   + "," +
            "\"valorFinal\":"      + valorFinal      + "," +
            "\"nomeParoquiano\":"  + jsonStr(nomeParoquiano)  + "," +
            "\"nomeColaborador\":" + jsonStr(nomeColaborador) + "," +
            "\"descFormaPag\":"    + jsonStr(descFormaPag) +
        "}";
    }

    private String jsonStr(String s) {
        if (s == null) return "null";
        return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }
}