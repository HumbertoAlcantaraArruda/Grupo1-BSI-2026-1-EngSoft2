package agape.model;

import java.sql.Connection;
import java.time.LocalDateTime;

import agape.dao.ParoquianoDAO;

public class Paroquiano extends Usuario {
    private final ParoquianoDAO dao = new ParoquianoDAO();

    private LocalDateTime dataInscricao;
    private float saldoCredito;

    // GETTERS E SETTERS
    public LocalDateTime getDataInscricao() {
        return dataInscricao;
    }

    public void setDataInscricao(LocalDateTime dataInscricao) {
        this.dataInscricao = dataInscricao;
    }

    public float getSaldoCredito() {
        return saldoCredito;
    }

    public void setSaldoCredito(float saldoCredito) {
        this.saldoCredito = saldoCredito;
    }

    // ── Persistência ──────────────────────────────────────────────────────────

    public Paroquiano buscarPorCpf(Connection conn, String cpf) throws Exception {
        return dao.buscarPorCpf(conn, cpf);
    }

    public Paroquiano buscarPorId(Connection conn, int id) throws Exception {
        return dao.buscarPorId(conn, id);
    }

    public void atualizarSaldoCredito(Connection conn, float novoSaldo) throws Exception {
        dao.atualizarSaldoCredito(conn, this.getIdUsuario(), novoSaldo);
    }

    public String toJson() {
        return "{" +
            "\"idUsuario\":"    + getIdUsuario()   + "," +
            "\"nome\":\""       + esc(getNome())   + "\"," +
            "\"cpf\":\""        + esc(getCpf())    + "\"," +
            "\"email\":\""      + esc(getEmail())  + "\"," +
            "\"status\":"       + getStatus()      + "," +
            "\"saldoCredito\":" + saldoCredito     + "," +
            "\"dataInscricao\":" + (dataInscricao != null
                ? "\"" + dataInscricao + "\""
                : "null") +
        "}";
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
