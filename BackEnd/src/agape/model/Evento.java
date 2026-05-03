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
}
