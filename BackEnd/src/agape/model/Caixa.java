package agape.model;

import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import agape.dao.CaixaDAO;

public class Caixa {

    private final CaixaDAO dao = new CaixaDAO();

    private int idCaixa;
    private int idUsuario;
    private LocalDateTime dataHoraAbertura;
    private LocalDateTime dataHoraFechamento;
    private float valorInicial;
    private float valorFinal;

    // ── Getters e Setters ─────────────────────────────────────────────────────

    public int getIdCaixa()                            { return idCaixa; }
    public void setIdCaixa(int idCaixa)                { this.idCaixa = idCaixa; }

    public int getIdUsuario()                          { return idUsuario; }
    public void setIdUsuario(int idUsuario)            { this.idUsuario = idUsuario; }

    public LocalDateTime getDataHoraAbertura()         { return dataHoraAbertura; }
    public void setDataHoraAbertura(LocalDateTime v)   { this.dataHoraAbertura = v; }

    public LocalDateTime getDataHoraFechamento()       { return dataHoraFechamento; }
    public void setDataHoraFechamento(LocalDateTime v) { this.dataHoraFechamento = v; }

    public float getValorInicial()                     { return valorInicial; }
    public void setValorInicial(float v)               { this.valorInicial = v; }

    public float getValorFinal()                       { return valorFinal; }
    public void setValorFinal(float v)                 { this.valorFinal = v; }

    // ── Persistência (DAO encapsulado) ────────────────────────────────────────

    /** RF_F4 — Abre um novo caixa para o operador e devolve o id gerado. */
    public int abrir(Connection conn, int idUsuario, float valorInicial) throws Exception {
        return dao.abrir(conn, idUsuario, valorInicial);
    }

    /** Retorna o caixa aberto do operador, ou null se não houver. */
    public Caixa buscarAbertoPorUsuario(Connection conn, int idUsuario) throws Exception {
        return dao.buscarAbertoPorUsuario(conn, idUsuario);
    }

    /** Retorna o caixa aberto mais recente (qualquer operador). */
    public Caixa buscarAberto(Connection conn) throws Exception {
        return dao.buscarAberto(conn);
    }

    /** Busca caixa pelo id. */
    public Caixa buscarPorId(Connection conn, int idCaixa) throws Exception {
        return dao.buscarPorId(conn, idCaixa);
    }

    /** RF_F6 — Fecha o caixa: registra fechamento e o valorFinal consolidado. */
    public void fechar(Connection conn, int idCaixa, float valorFinal) throws Exception {
        dao.fechar(conn, idCaixa, valorFinal);
    }

    /** Acrescenta (ou subtrai, se negativo) valor ao saldo atual do caixa. */
    public void adicionarAoValorFinal(Connection conn, int idCaixa, float valor) throws Exception {
        dao.adicionarAoValorFinal(conn, idCaixa, valor);
    }

    /** Retorna o saldo atual (valorFinal) do caixa informado. */
    public float getSaldoAtual(Connection conn, int idCaixa) throws Exception {
        return dao.getSaldoAtual(conn, idCaixa);
    }

    /** Lista todas as movimentações manuais de um caixa (suprimentos e sangrias). */
    public List<MovimentacaoCaixa> listarMovimentacoes(Connection conn, int idCaixa) throws Exception {
        return dao.listarMovimentacoes(conn, idCaixa);
    }

    /** Total de vendas e breakdown por forma de pagamento no período do caixa. */
    public Map<String, Float> resumoVendasPorFormaPag(Connection conn, int idCaixa) throws Exception {
        return dao.resumoVendasPorFormaPag(conn, idCaixa);
    }

    // ── Serialização ──────────────────────────────────────────────────────────

    public String toJson() {
        return "{" +
            "\"idCaixa\":"            + idCaixa     + "," +
            "\"idUsuario\":"          + idUsuario   + "," +
            "\"valorInicial\":"       + valorInicial + "," +
            "\"valorFinal\":"         + valorFinal  + "," +
            "\"dataHoraAbertura\":"   + (dataHoraAbertura  != null ? "\"" + dataHoraAbertura  + "\"" : "null") + "," +
            "\"dataHoraFechamento\":" + (dataHoraFechamento != null ? "\"" + dataHoraFechamento + "\"" : "null") +
        "}";
    }
}
