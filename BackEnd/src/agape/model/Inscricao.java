package agape.model;

import java.time.LocalDateTime;

public class Inscricao {
    private int idInscricao;
    private int status;
    private int idUsuario;
    private int idEvento;
    private String obs;
    private LocalDateTime dataInscricao;
    private LocalDateTime dataObsStatus;

    public int getIdInscricao() {
        return idInscricao;
    }

    public void setIdInscricao(int idInscricao) {
        this.idInscricao = idInscricao;
    }

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public int getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(int idUsuario) {
        this.idUsuario = idUsuario;
    }

    public int getIdEvento() {
        return idEvento;
    }

    public void setIdEvento(int idEvento) {
        this.idEvento = idEvento;
    }

    public String getObs() {
        return obs;
    }

    public void setObs(String obs) {
        this.obs = obs;
    }

    public LocalDateTime getDataInscricao() {
        return dataInscricao;
    }

    public void setDataInscricao(LocalDateTime dataInscricao) {
        this.dataInscricao = dataInscricao;
    }

    public LocalDateTime getDataObsStatus() {
        return dataObsStatus;
    }

    public void setDataObsStatus(LocalDateTime dataObsStatus) {
        this.dataObsStatus = dataObsStatus;
    }
}