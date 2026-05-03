package agape.model;

import java.time.LocalDateTime;

public class InscricaoListaEspera {
    private int idInscricao;
    private int ordemEntrada;
    private int status;
    private LocalDateTime dataStatus;

    public int getIdInscricao() {
        return idInscricao;
    }

    public void setIdInscricao(int idInscricao) {
        this.idInscricao = idInscricao;
    }

    public int getOrdemEntrada() {
        return ordemEntrada;
    }

    public void setOrdemEntrada(int ordemEntrada) {
        this.ordemEntrada = ordemEntrada;
    }

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public LocalDateTime getDataStatus() {
        return dataStatus;
    }

    public void setDataStatus(LocalDateTime dataStatus) {
        this.dataStatus = dataStatus;
    }
}