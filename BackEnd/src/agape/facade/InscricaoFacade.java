package agape.facade;

import agape.dao.EventoDAO;
import agape.dao.InscricaoDAO;
import agape.model.Evento;
import agape.model.Inscricao;

import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.List;

/**
 * InscricaoFacade — GOF Facade
 *
 * Centraliza e simplifica a operação "Realizar Inscrição" (RF_F3),
 * escondendo da View a complexidade de coordenar EventoDAO, InscricaoDAO
 * e as regras de lista de espera.
 *
 * Padrões aplicados:
 *   GOF Facade   — interface única e simples sobre um subsistema complexo.
 *   GOF Singleton — instância única em toda a aplicação.
 *   SOLID SRP    — esta facade só trata de inscrição; transação é responsabilidade
 *                  do chamador (CRealizarInscricao), mantendo separação de papéis.
 *   GRASP Info. Expert — validações delegadas às entidades que têm os dados.
 */
public class InscricaoFacade {

    // GOF Singleton
    private static InscricaoFacade instancia;
    private InscricaoFacade() {}
    public static InscricaoFacade getInstance() {
        if (instancia == null) instancia = new InscricaoFacade();
        return instancia;
    }

    // SOLID DIP — dependências poderiam ser injetadas; instanciadas localmente
    // por simplicidade (padrão do projeto, igual a VendaFacade)
    private final InscricaoDAO inscricaoDAO = new InscricaoDAO();
    private final EventoDAO    eventoDAO    = new EventoDAO();

    /**
     * realizarInscricao() — Ponto de entrada do RF_F3.
     *
     * A transação (setAutoCommit=false / commit / rollback) é gerenciada pelo
     * chamador (CRealizarInscricao.confirmar), mantendo SRP.
     *
     * Fluxo:
     *   1. Busca e valida o Evento (Fluxo 6.1 — não encontrado / sem vagas).
     *   2. Verifica duplicata de inscrição.
     *   3. Cria inscrição ativa (vagas > 0) ou em lista de espera (vagas = 0).
     *   4. Decrementa vagasDisp ou insere em InscricaoListaEspera.
     *
     * @return Inscricao persistida (status=1 se ativa, status=2 se lista espera)
     */
    public Inscricao realizarInscricao(Connection conn, int idUsuario, int idEvento)
            throws Exception {

        // ── 1. Busca e valida o evento ────────────────────────────────────
        Evento ev = eventoDAO.buscarPorId(conn, idEvento);
        if (ev == null)
            throw new Exception("Evento não encontrado (Fluxo 6.1).");

        // GRASP Information Expert — Evento valida sua própria disponibilidade
        List<String> erros = ev.validarDisponibilidade();
        if (!erros.isEmpty())
            throw new Exception(String.join(" ", erros));

        // ── 2. Verifica duplicata ─────────────────────────────────────────
        if (inscricaoDAO.existeInscricaoAtiva(conn, idEvento, idUsuario))
            throw new Exception("Este paroquiano já possui inscrição ativa neste evento.");

        // ── 3. Determina se há vagas ou vai para lista de espera ──────────
        // GRASP Information Expert — Evento sabe se tem vagas disponíveis
        boolean temVaga = ev.temVagasDisponiveis();

        Inscricao inscricao = new Inscricao();
        inscricao.setIdEvento(idEvento);
        inscricao.setIdUsuario(idUsuario);
        inscricao.setStatus(temVaga ? 1 : 2); // 1=Ativa | 2=Lista de Espera
        inscricao.setDataInscricao(LocalDateTime.now());

        // ── 4. Persiste a inscrição ───────────────────────────────────────
        // Creator (GRASP) — Facade cria o registro por reunir todos os dados
        inscricaoDAO.inserir(conn, inscricao);

        if (temVaga) {
            // ── 5a. Decrementa vagas disponíveis ─────────────────────────
            eventoDAO.decrementarVagas(conn, idEvento);

            // Se vagas chegaram a 0 após esta inscrição, o sistema
            // abrirá a lista de espera automaticamente (dataAberturaListaEspera)
            if (ev.getVagasDisp() != null && ev.getVagasDisp() == 1) {
                eventoDAO.abrirListaEspera(conn, idEvento, LocalDateTime.now());
            }
        } else {
            // ── 5b. Adiciona à lista de espera com posição sequencial ─────
            int posicao = inscricaoDAO.countListaEspera(conn, idEvento) + 1;
            inscricaoDAO.inserirListaEspera(conn, inscricao.getIdInscricao(), posicao);
            inscricao.setPosicaoEspera(posicao);
        }

        // Enriquece para retorno
        inscricao.setNomeEvento(ev.getNome());
        return inscricao;
    }
}
