package agape.model;

import java.time.LocalDateTime;

public class Devolucao {
    private int idDevolucao;
    private int idVenda;
    private int idUsuario;
    private LocalDateTime dataHora;
    private float valorTotal;
    private int reincorporaEst;

    // GETTERS E SETTERS
    public int getIdDevolucao() {
        return idDevolucao;
    }

    public void setIdDevolucao(int idDevolucao) {
        this.idDevolucao = idDevolucao;
    }

    public int getIdVenda() {
        return idVenda;
    }

    public void setIdVenda(int idVenda) {
        this.idVenda = idVenda;
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

    public float getValorTotal() {
        return valorTotal;
    }

    public void setValorTotal(float valorTotal) {
        this.valorTotal = valorTotal;
    }

    public int getReincorporaEst() {
        return reincorporaEst;
    }

    public void setReincorporaEst(int reincorporaEst) {
        this.reincorporaEst = reincorporaEst;
    }
}
