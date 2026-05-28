package agape.model;

import java.sql.Connection;
import java.time.LocalDateTime;

import agape.dao.MovimentacaoCaixaDAO;

public class MovimentacaoCaixa {

    private final MovimentacaoCaixaDAO dao = new MovimentacaoCaixaDAO();

    private int idMov;
    private int idCaixa;
    private int idUsuario;
    private LocalDateTime dataHora;
    private float valor;
    private String motivo;

    public int getIdMov() {
        return idMov;
    }

    public void setIdMov(int idMov) {
        this.idMov = idMov;
    }

    public int getIdCaixa() {
        return idCaixa;
    }

    public void setIdCaixa(int idCaixa) {
        this.idCaixa = idCaixa;
    }

    public int getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(int idUsuario) {
        this.idUsuario = idUsuario;
    }

    public LocalDateTime getDataHora() {
        return dataHora;
    }

    public void setDataHora(LocalDateTime dataHora) {
        this.dataHora = dataHora;
    }

    public float getValor() {
        return valor;
    }

    public void setValor(float valor) {
        this.valor = valor;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    // ── Persistência (DAO encapsulado) ────────────────────────────────────────

    /** Insere esta movimentação (suprimento/sangria ou venda) no caixa. */
    public void inserir(Connection conn) throws Exception {
        dao.inserir(conn, this);
    }

    // ── Serialização ──────────────────────────────────────────────────────────

    public String toJson() {
        return "{" +
            "\"idMov\":"     + idMov     + "," +
            "\"idCaixa\":"   + idCaixa   + "," +
            "\"idUsuario\":" + idUsuario + "," +
            "\"dataHora\":"  + (dataHora != null ? "\"" + dataHora + "\"" : "null") + "," +
            "\"valor\":"     + valor     + "," +
            "\"motivo\":"    + (motivo != null ? "\"" + motivo.replace("\\", "\\\\").replace("\"", "\\\"") + "\"" : "null") +
        "}";
    }
}