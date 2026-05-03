package agape.model;

import java.time.LocalDateTime;

public class Paroquiano extends Usuario {
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
}
