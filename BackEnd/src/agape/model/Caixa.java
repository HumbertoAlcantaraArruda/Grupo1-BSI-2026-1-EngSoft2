package agape.model;

import java.time.LocalDateTime;

public class Caixa {
    private int idCaixa;
    private LocalDateTime dataHoraAbertura;
    private LocalDateTime dataHoraFechamento;
    private float valorInicial;
    private float valorFinal;
    
    // GETTERS E SETTERS
    public int getIdCaixa() {
        return idCaixa;
    }

    public void setIdCaixa(int idCaixa) {
        this.idCaixa = idCaixa;
    }

    public LocalDateTime getDataHoraAbertura() {
        return dataHoraAbertura;
    }

    public void setDataHoraAbertura(LocalDateTime dataHoraAbertura) {
        this.dataHoraAbertura = dataHoraAbertura;
    }

    public LocalDateTime getDataHoraFechamento() {
        return dataHoraFechamento;
    }

    public void setDataHoraFechamento(LocalDateTime dataHoraFechamento) {
        this.dataHoraFechamento = dataHoraFechamento;
    }

    public float getValorInicial() {
        return valorInicial;
    }

    public void setValorInicial(float valorInicial) {
        this.valorInicial = valorInicial;
    }

    public float getValorFinal() {
        return valorFinal;
    }

    public void setValorFinal(float valorFinal) {
        this.valorFinal = valorFinal;
    }
}
