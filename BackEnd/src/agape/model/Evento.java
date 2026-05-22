package agape.model;

import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import agape.dao.EventoDAO;

public class Evento {
    private final EventoDAO dao = new EventoDAO();

    private int idEvento;
    private int idUsuarioResponsavel;
    private int idCatEvento;
    private String nome;
    private LocalDateTime dataInicio;
    private LocalDateTime dataFim;
    private int totVagas;
    private Integer vagasDisp;
    private Integer idEventoStatus;
    private LocalDateTime dataEvento;
    private LocalDateTime dataAberturaListaEspera;
    private Float valorInscricao;
    private String imagemEvento;

    // Campos extras (JOINs)
    private String nomeCatEvento;
    private String nomeStatus;

    public int getIdEvento() { return idEvento; }
    public void setIdEvento(int idEvento) { this.idEvento = idEvento; }

    public int getIdUsuarioResponsavel() { return idUsuarioResponsavel; }
    public void setIdUsuarioResponsavel(int idUsuarioResponsavel) { this.idUsuarioResponsavel = idUsuarioResponsavel; }

    public int getIdCatEvento() { return idCatEvento; }
    public void setIdCatEvento(int idCatEvento) { this.idCatEvento = idCatEvento; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public LocalDateTime getDataInicio() { return dataInicio; }
    public void setDataInicio(LocalDateTime dataInicio) { this.dataInicio = dataInicio; }

    public LocalDateTime getDataFim() { return dataFim; }
    public void setDataFim(LocalDateTime dataFim) { this.dataFim = dataFim; }

    public int getTotVagas() { return totVagas; }
    public void setTotVagas(int totVagas) { this.totVagas = totVagas; }

    public Integer getVagasDisp() { return vagasDisp; }
    public void setVagasDisp(Integer vagasDisp) { this.vagasDisp = vagasDisp; }

    public Integer getIdEventoStatus() { return idEventoStatus; }
    public void setIdEventoStatus(Integer idEventoStatus) { this.idEventoStatus = idEventoStatus; }

    public LocalDateTime getDataEvento() { return dataEvento; }
    public void setDataEvento(LocalDateTime dataEvento) { this.dataEvento = dataEvento; }

    public LocalDateTime getDataAberturaListaEspera() { return dataAberturaListaEspera; }
    public void setDataAberturaListaEspera(LocalDateTime dataAberturaListaEspera) { this.dataAberturaListaEspera = dataAberturaListaEspera; }

    public Float getValorInscricao() { return valorInscricao; }
    public void setValorInscricao(Float valorInscricao) { this.valorInscricao = valorInscricao; }

    public String getImagemEvento() { return imagemEvento; }
    public void setImagemEvento(String imagemEvento) { this.imagemEvento = imagemEvento; }

    public String getNomeCatEvento() { return nomeCatEvento; }
    public void setNomeCatEvento(String nomeCatEvento) { this.nomeCatEvento = nomeCatEvento; }

    public String getNomeStatus() { return nomeStatus; }
    public void setNomeStatus(String nomeStatus) { this.nomeStatus = nomeStatus; }

    // ── Persistência (DAO encapsulado) ─────────────────────────────────────

    public List<Evento> buscar(Connection conn, String nome, Integer idCatEvento, Integer idEventoStatus) throws Exception {
        return dao.buscar(conn, nome, idCatEvento, idEventoStatus);
    }

    public Evento buscarPorId(Connection conn, int id) throws Exception {
        return dao.buscarPorId(conn, id);
    }

    public void inserir(Connection conn) throws Exception {
        dao.inserir(conn, this);
    }

    public void atualizar(Connection conn) throws Exception {
        dao.atualizar(conn, this);
    }

    public void excluir(Connection conn) throws Exception {
        dao.excluir(conn, this.idEvento);
    }

    // ── Operações de estado (RF_F1) ────────────────────────────────────────

    /** novaData obrigatório ao reabrir cancelado; null para demais casos. */
    public void abrir(Connection conn, LocalDateTime novaData) throws Exception {
        dao.abrir(conn, this.idEvento, novaData);
        this.idEventoStatus = 1;
        if (novaData != null) this.dataEvento = novaData;
    }

    public void finalizar(Connection conn) throws Exception {
        dao.finalizar(conn, this.idEvento);
        this.idEventoStatus = 4;
    }

    public void cancelar(Connection conn) throws Exception {
        dao.cancelar(conn, this.idEvento);
        this.idEventoStatus = 2;
    }

    public void adiar(Connection conn, LocalDateTime novaData) throws Exception {
        dao.adiar(conn, this.idEvento, novaData);
        this.idEventoStatus = 3;
        this.dataEvento = novaData;
    }

    // ── Validações (SOLID SRP + GRASP Information Expert) ─────────────────
    // A entidade conhece suas próprias regras de negócio e as concentra aqui,
    // liberando o Controller de lógica de domínio.

    // ── Validação de disponibilidade para inscrição (RF_F3) ────────────────

    /**
     * GRASP Information Expert: a entidade Evento conhece seu próprio status
     * e determina se aceita novas inscrições.
     */
    public List<String> validarDisponibilidade() {
        List<String> erros = new ArrayList<>();
        if (idEventoStatus == null || idEventoStatus != 1)
            erros.add("Evento não está ativo para inscrições.");
        return erros;
    }

    /** Retorna true se ainda há vagas disponíveis. */
    public boolean temVagasDisponiveis() {
        return vagasDisp != null && vagasDisp > 0;
    }

    // ──────────────────────────────────────────────────────────────────────

    /** Valida campos obrigatórios para criar ou alterar um evento (Fluxo 7.1). */
    public List<String> validarParaCriar() {
        List<String> erros = new ArrayList<>();
        if (nome == null || nome.trim().length() < 2)
            erros.add("Nome deve ter pelo menos 2 caracteres.");
        if (idCatEvento <= 0)
            erros.add("Categoria do evento é obrigatória.");
        if (idUsuarioResponsavel <= 0)
            erros.add("Responsável pelo evento é obrigatório.");
        if (dataInicio == null)
            erros.add("Data de início das inscrições é obrigatória.");
        if (dataFim == null)
            erros.add("Data de término das inscrições é obrigatória.");
        if (dataInicio != null && dataFim != null && !dataFim.isAfter(dataInicio))
            erros.add("O término das inscrições deve ser posterior ao início.");
        if (dataFim != null && dataEvento != null && !dataEvento.isAfter(dataFim))
            erros.add("A data do evento deve ser posterior ao término das inscrições.");
        if (totVagas <= 0)
            erros.add("Total de vagas deve ser maior que zero.");
        return erros;
    }

    /** Valida abertura para eventos Adiados (sem nova data). */
    public List<String> validarParaAbrir() {
        List<String> erros = new ArrayList<>();
        if (idEventoStatus != null && idEventoStatus == 1)
            erros.add("Evento já está ativo.");
        if (idEventoStatus != null && idEventoStatus == 4)
            erros.add("Evento finalizado não pode ser reaberto.");
        return erros;
    }

    /** Valida reabertura de evento Cancelado: exige nova data futura. */
    public List<String> validarParaReabrirCancelado(LocalDateTime novaData) {
        List<String> erros = new ArrayList<>();
        if (novaData == null)
            erros.add("É necessário informar uma nova data para reabrir um evento cancelado.");
        if (novaData != null && novaData.isBefore(LocalDateTime.now()))
            erros.add("A nova data do evento deve ser uma data futura.");
        return erros;
    }

    /** Valida a transição de status ao finalizar um evento. */
    public List<String> validarParaFinalizar() {
        List<String> erros = new ArrayList<>();
        if (idEventoStatus != null && idEventoStatus == 4)
            erros.add("Evento já está finalizado.");
        if (idEventoStatus != null && idEventoStatus == 2)
            erros.add("Evento cancelado não pode ser finalizado diretamente. Reabra-o primeiro.");
        return erros;
    }

    /** Valida a transição de status ao cancelar um evento. */
    public List<String> validarParaCancelar() {
        List<String> erros = new ArrayList<>();
        if (idEventoStatus != null && idEventoStatus == 2)
            erros.add("Evento já está cancelado.");
        if (idEventoStatus != null && idEventoStatus == 4)
            erros.add("Evento finalizado não pode ser cancelado.");
        return erros;
    }

    /** Valida o adiamento: nova data deve ser futura e após o início. */
    public List<String> validarParaAdiar(LocalDateTime novaData) {
        List<String> erros = new ArrayList<>();
        if (novaData == null)
            erros.add("Nova data do evento é obrigatória para adiar.");
        if (novaData != null && novaData.isBefore(LocalDateTime.now()))
            erros.add("A nova data do evento deve ser uma data futura.");
        return erros;
    }

    public String toJson() {
        return "{" +
            "\"idEvento\":"                   + idEvento                      + "," +
            "\"idUsuarioResponsavel\":"        + idUsuarioResponsavel          + "," +
            "\"idCatEvento\":"                 + idCatEvento                   + "," +
            "\"nomeCatEvento\":"               + str(nomeCatEvento)            + "," +
            "\"idEventoStatus\":"              + (idEventoStatus != null ? idEventoStatus : "null") + "," +
            "\"nomeStatus\":"                  + str(nomeStatus)               + "," +
            "\"nome\":"                        + str(nome)                     + "," +
            "\"dataInicio\":"                  + dt(dataInicio)                + "," +
            "\"dataFim\":"                     + dt(dataFim)                   + "," +
            "\"totVagas\":"                    + totVagas                      + "," +
            "\"vagasDisp\":"                   + (vagasDisp != null ? vagasDisp : "null") + "," +
            "\"dataEvento\":"                  + dt(dataEvento)                + "," +
            "\"dataAberturaListaEspera\":"     + dt(dataAberturaListaEspera)   + "," +
            "\"valorInscricao\":"              + (valorInscricao != null ? valorInscricao : "null") + "," +
            "\"imagemEvento\":"                + str(imagemEvento)             +
        "}";
    }

    private String str(String s) {
        if (s == null) return "null";
        return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }

    private String dt(LocalDateTime d) {
        return d != null ? "\"" + d.toString() + "\"" : "null";
    }
}
