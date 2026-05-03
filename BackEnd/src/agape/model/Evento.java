package agape.model;

import java.time.LocalDateTime;

public class Evento {
    private int idEvento;
    private int idUsuarioResponsavel;
    private int idCategoriaEvento;
    private String nome;
    private LocalDateTime dataInicio;
    private LocalDateTime dataFim;
    private int totVagas;
    private int vagasDisp;
    private int status;
    private LocalDateTime dataEvento;
    private LocalDateTime dataAberturaListaEspera;

    public int getIdEvento() {
        return idEvento;
    }

    public void setIdEvento(int idEvento) {
        this.idEvento = idEvento;
    }

    public int getIdUsuarioResponsavel() {
        return idUsuarioResponsavel;
    }

    public void setIdUsuarioResponsavel(int idUsuarioResponsavel) {
        this.idUsuarioResponsavel = idUsuarioResponsavel;
    }

    public int getIdCategoriaEvento() {
        return idCategoriaEvento;
    }

    public void setIdCategoriaEvento(int idCategoriaEvento) {
        this.idCategoriaEvento = idCategoriaEvento;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public LocalDateTime getDataInicio() {
        return dataInicio;
    }

    public void setDataInicio(LocalDateTime dataInicio) {
        this.dataInicio = dataInicio;
    }

    public LocalDateTime getDataFim() {
        return dataFim;
    }

    public void setDataFim(LocalDateTime dataFim) {
        this.dataFim = dataFim;
    }

    public int getTotVagas() {
        return totVagas;
    }

    public void setTotVagas(int totVagas) {
        this.totVagas = totVagas;
    }

    public int getVagasDisp() {
        return vagasDisp;
    }

    public void setVagasDisp(int vagasDisp) {
        this.vagasDisp = vagasDisp;
    }

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public LocalDateTime getDataEvento() {
        return dataEvento;
    }

    public void setDataEvento(LocalDateTime dataEvento) {
        this.dataEvento = dataEvento;
    }

    public LocalDateTime getDataAberturaListaEspera() {
        return dataAberturaListaEspera;
    }

    public void setDataAberturaListaEspera(LocalDateTime dataAberturaListaEspera) {
        this.dataAberturaListaEspera = dataAberturaListaEspera;
    }
}
