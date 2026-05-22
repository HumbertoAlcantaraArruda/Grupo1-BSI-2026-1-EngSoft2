package agape.model;

import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import agape.dao.InscricaoDAO;

/**
 * Inscricao — entidade mapeada para a tabela Inscricao.
 *
 * Colunas: idInscricao, status, dataInscricao, idUsuario, idEvento,
 *          obs, dataObsStatus, pago, tamCamiseta
 *
 * status: 1=Ativa | 0=Cancelada | 2=Lista de Espera
 *
 * GRASP Information Expert: validações e regras residem na entidade.
 */
public class Inscricao {

    private final InscricaoDAO dao = new InscricaoDAO();

    private int           idInscricao;
    private int           idUsuario;       // FK → Usuario.idUsuario (Paroquiano)
    private int           idEvento;
    private int           status;          // 1=Ativa | 0=Cancelada | 2=Lista de Espera
    private String        obs;
    private LocalDateTime dataInscricao;
    private LocalDateTime dataObsStatus;
    private Integer       pago;
    private String        tamCamiseta;

    // Campos extras para exibição (JOINs)
    private String  nomeEvento;
    private String  nomeUsuario;
    private Integer posicaoEspera;

    // ── Getters / Setters ──────────────────────────────────────────────────

    public int           getIdInscricao()              { return idInscricao; }
    public void          setIdInscricao(int v)         { this.idInscricao = v; }

    public int           getIdUsuario()                { return idUsuario; }
    public void          setIdUsuario(int v)           { this.idUsuario = v; }

    public int           getIdEvento()                 { return idEvento; }
    public void          setIdEvento(int v)            { this.idEvento = v; }

    public int           getStatus()                   { return status; }
    public void          setStatus(int v)              { this.status = v; }

    public String        getObs()                      { return obs; }
    public void          setObs(String v)              { this.obs = v; }

    public LocalDateTime getDataInscricao()            { return dataInscricao; }
    public void          setDataInscricao(LocalDateTime v) { this.dataInscricao = v; }

    public LocalDateTime getDataObsStatus()            { return dataObsStatus; }
    public void          setDataObsStatus(LocalDateTime v) { this.dataObsStatus = v; }

    public Integer       getPago()                     { return pago; }
    public void          setPago(Integer v)            { this.pago = v; }

    public String        getTamCamiseta()              { return tamCamiseta; }
    public void          setTamCamiseta(String v)      { this.tamCamiseta = v; }

    public String        getNomeEvento()               { return nomeEvento; }
    public void          setNomeEvento(String v)       { this.nomeEvento = v; }

    public String        getNomeUsuario()              { return nomeUsuario; }
    public void          setNomeUsuario(String v)      { this.nomeUsuario = v; }

    public Integer       getPosicaoEspera()            { return posicaoEspera; }
    public void          setPosicaoEspera(Integer v)   { this.posicaoEspera = v; }

    // ── Validação (GRASP Information Expert) ──────────────────────────────

    public List<String> validarParaInserir() {
        List<String> erros = new ArrayList<>();
        if (idEvento  <= 0) erros.add("Evento é obrigatório.");
        if (idUsuario <= 0) erros.add("Usuário (paroquiano) é obrigatório.");
        return erros;
    }

    public boolean isListaEspera() { return status == 2; }

    // ── Persistência ──────────────────────────────────────────────────────

    public void inserir(Connection conn) throws Exception {
        dao.inserir(conn, this);
    }

    // ── Serialização ──────────────────────────────────────────────────────

    public String toJson() {
        return "{" +
            "\"idInscricao\":"   + idInscricao    + "," +
            "\"idUsuario\":"     + idUsuario       + "," +
            "\"idEvento\":"      + idEvento        + "," +
            "\"status\":"        + status          + "," +
            "\"listaEspera\":"   + (status == 2)   + "," +
            "\"posicaoEspera\":" + (posicaoEspera != null ? posicaoEspera : "null") + "," +
            "\"dataInscricao\":" + dt(dataInscricao)  + "," +
            "\"dataObsStatus\":" + dt(dataObsStatus)  + "," +
            "\"pago\":"          + (pago != null ? pago : "null") + "," +
            "\"tamCamiseta\":"   + str(tamCamiseta)   + "," +
            "\"nomeEvento\":"    + str(nomeEvento)    + "," +
            "\"nomeUsuario\":"   + str(nomeUsuario)   + "," +
            "\"obs\":"           + str(obs)            +
        "}";
    }

    private String str(String s) {
        if (s == null) return "null";
        return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }

    private String dt(LocalDateTime d) {
        return d != null ? "\"" + d + "\"" : "null";
    }
}
