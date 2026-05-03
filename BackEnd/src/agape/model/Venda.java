package agape.model;

import java.time.LocalDateTime;

public class Venda {
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
}