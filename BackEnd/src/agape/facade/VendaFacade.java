package agape.facade;

import agape.dao.*;
import agape.model.*;

import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.List;

/**
 * VendaFacade — GOF Facade
 *
 * Centraliza e orquestra as operações de Venda em uma única fachada,
 * escondendo a complexidade de coordenar múltiplos DAOs e regras de negócio.
 *
 * Padrões aplicados:
 *   GOF Facade   — interface simplificada sobre subsistema complexo de DAOs.
 *   GOF Singleton — instância única garantida em toda a execução.
 *   SOLID DIP    — recebe Connection externamente; DAOs instanciados localmente.
 *
 * A transação (setAutoCommit=false / commit / rollback) é responsabilidade
 * do chamador (CVenda), mantendo separação de preocupações (SRP).
 */
public class VendaFacade {

    // Singleton (GOF) — construtor privado + instância estática
    private static VendaFacade instancia;

    private VendaFacade() {}

    /** Creator (GRASP) — quem cria a fachada? Ela mesma, via getInstance(). */
    public static VendaFacade getInstance() {
        if (instancia == null) instancia = new VendaFacade();
        return instancia;
    }

    // DIP (SOLID) — dependências declaradas como campos
    private final VendaDAO             vendaDAO = new VendaDAO();
    private final ItemVendaDAO         itemDAO  = new ItemVendaDAO();
    private final ProdutoDAO           prodDAO  = new ProdutoDAO();
    private final ParoquianoDAO        parDAO   = new ParoquianoDAO();
    private final CaixaDAO             caixaDAO = new CaixaDAO();
    private final MovimentacaoCaixaDAO movDAO   = new MovimentacaoCaixaDAO();
    private final ContasReceberDAO     crDAO    = new ContasReceberDAO();

    // ──────────────────────────────────────────────────────────────────────────

    /**
     * finalizarVenda() — Ponto de entrada transacional.
     *
     * Orquestra em sequência (dentro da transação gerenciada por CVenda):
     *   1. Registrar Venda (VendaDAO).
     *   2. Registrar ItemVenda + Decrementar Estoque (RF_F9).
     *   3. Atualizar Saldo de Crédito do Paroquiano.
     *   4. Atualizar Caixa + registrar MovimentacaoCaixa (RF_F5).
     *   5. Gerar ContasReceber para pagamentos parcelados (RN02).
     *
     * @param conn          conexão com autoCommit=false (gerenciada por CVenda)
     * @param venda         objeto Venda pré-populado (sem idVenda)
     * @param produtos      produtos a vender (já validados — estoque verificado antes)
     * @param quantidades   quantidades correspondentes a cada produto
     * @param vlrsUni       valores unitários de cada produto no momento da venda
     * @param paroquiano    paroquiano (para crédito)
     * @param credUtilizado valor de crédito a descontar do saldo do paroquiano
     * @param idFormas      IDs das formas de pagamento usadas
     * @param vlrsPag       valores de cada forma de pagamento
     * @param numParcelas   número de parcelas de cada pagamento (1 = à vista, 2+ = parcelado)
     * @param colaborador   colaborador que executa a venda (para MovimentacaoCaixa)
     * @return idVenda gerado pelo banco
     */
    public int finalizarVenda(
            Connection conn,
            Venda        venda,
            Produto[]    produtos,
            int[]        quantidades,
            float[]      vlrsUni,
            Paroquiano   paroquiano,
            float        credUtilizado,
            int[]        idFormas,
            float[]      vlrsPag,
            int[]        numParcelas,
            Usuario      colaborador
    ) throws Exception {

        // ── 1. Registrar Venda ────────────────────────────────────────────────
        // Creator (GRASP) — VendaFacade cria a Venda porque reúne todos os dados
        int idVenda = vendaDAO.inserir(conn, venda);
        venda.setIdVenda(idVenda);

        // ── 2. Registrar ItemVenda + Atualizar Estoque (RF_F9) ────────────────
        // Information Expert (GRASP) — ProdutoDAO é o expert em decrementar estoque
        for (int i = 0; i < produtos.length; i++) {
            ItemVenda item = new ItemVenda();
            item.setIdVenda(idVenda);
            item.setIdProd(produtos[i].getIdProd());
            item.setQuantidade(quantidades[i]);
            item.setValorUnitario(vlrsUni[i]);
            itemDAO.inserir(conn, item);

            // RF_F9 — RN07 (estoque não negativo) foi validado no Controller
            prodDAO.decrementarEstoque(conn, produtos[i].getIdProd(), quantidades[i]);
        }

        // ── 3. Atualizar Saldo de Crédito do Paroquiano ───────────────────────
        // Low Coupling (GRASP) — ParoquianoDAO encapsula a atualização
        if (credUtilizado > 0) {
            float novoSaldo = paroquiano.getSaldoCredito() - credUtilizado;
            parDAO.atualizarSaldoCredito(conn, paroquiano.getIdUsuario(), novoSaldo);
        }

        // ── 4. Caixa + MovimentacaoCaixa (RF_F5) ─────────────────────────────
        // Cada operador responde pelo próprio caixa: o dinheiro da venda entra
        // no caixa ABERTO DO COLABORADOR que está realizando a venda.
        Caixa caixa = caixaDAO.buscarAbertoPorUsuario(conn, colaborador.getIdUsuario());
        if (caixa != null) {
            // Apenas pagamentos à vista (numParcelas=1) entram no saldo imediatamente
            float totalAVista = 0;
            for (int i = 0; i < vlrsPag.length; i++) {
                if (numParcelas[i] <= 1) totalAVista += vlrsPag[i];
            }
            if (totalAVista > 0) {
                caixaDAO.adicionarAoValorFinal(conn, caixa.getIdCaixa(), totalAVista);
            }

            // High Cohesion (GRASP) — uma MovimentacaoCaixa por forma de pagamento
            for (int i = 0; i < idFormas.length; i++) {
                MovimentacaoCaixa mov = new MovimentacaoCaixa();
                mov.setIdCaixa(caixa.getIdCaixa());
                mov.setIdUsuario(colaborador.getIdUsuario());
                mov.setDataHora(LocalDateTime.now());
                mov.setValor(vlrsPag[i]);
                mov.setMotivo(
                    "Venda #" + idVenda +
                    " | Forma: " + idFormas[i] +
                    (numParcelas[i] > 1 ? " | " + numParcelas[i] + "x" : " | À vista")
                );
                movDAO.inserir(conn, mov);
            }
        }

        // ── 5. ContasReceber para pagamentos parcelados (RN02) ────────────────
        // Uma linha por forma de pagamento parcelada.
        // dataPagamento e valorPago ficam nulos até a quitação efetiva.
        for (int i = 0; i < idFormas.length; i++) {
            if (numParcelas[i] > 1) {
                ContasReceber cr = new ContasReceber();
                cr.setIdVenda(idVenda);
                cr.setIdCaixa(caixa != null ? caixa.getIdCaixa() : 0);
                cr.setIdUsuario(paroquiano.getIdUsuario());
                cr.setValor(vlrsPag[i]);
                // Vencimento estimado: hoje + total de meses do parcelamento
                cr.setDataVencimento(LocalDateTime.now().plusMonths(numParcelas[i]));
                crDAO.inserir(conn, cr);
            }
        }

        return idVenda;
    }

    // ──────────────────────────────────────────────────────────────────────────

    /**
     * estornarVenda() — Estratégia de Estorno (Rollback de Negócio).
     *
     * Por que estorno e não UPDATE direto?
     *   Um UPDATE direto nos registros de ItemVenda, Caixa e ContasReceber
     *   deixaria o histórico de movimentações inconsistente e o saldo do caixa
     *   divergido. O estorno garante que todas as consequências da venda sejam
     *   desfeitas atomicamente — reverter + reinserir — preservando integridade.
     *
     * Ordem de reversão (respeita FKs do banco):
     *   1. Restaurar estoque dos produtos (RF_F9 invertido).
     *   2. Subtrair do saldo do caixa apenas os pagamentos "à vista".
     *   3. Excluir MovimentacaoCaixa da venda.
     *   4. Excluir ContasReceber da venda.
     *   5. Restaurar crédito do paroquiano, se utilizado.
     *   6. Excluir ItemVenda (FK → Venda).
     *   — O registro Venda é deletado pelo chamador (CVenda):
     *     na edição pode ser reutilizado; na exclusão, é apagado.
     *
     * @param conn    conexão com autoCommit=false (gerenciada por CVenda)
     * @param idVenda id da venda a ser estornada
     * @return Venda original (para re-exibição ou pré-população do PDV na edição)
     */
    public Venda estornarVenda(Connection conn, int idVenda) throws Exception {

        Venda venda = vendaDAO.buscarPorId(conn, idVenda);
        if (venda == null)
            throw new Exception("Venda #" + idVenda + " não encontrada.");

        // ── 1. Restaurar estoque ──────────────────────────────────────────────
        List<ItemVenda> itens = itemDAO.listarItensPorVenda(conn, idVenda);
        for (ItemVenda item : itens) {
            prodDAO.restaurarEstoque(conn, item.getIdProd(), item.getQuantidade());
        }

        // ── 2-3. Reverter saldo do caixa + excluir movimentações ─────────────
        // Somente pagamentos "à vista" foram somados ao valorFinal do caixa;
        // os parcelados não entram no saldo imediato — só em ContasReceber.
        // A reversão incide no caixa aberto DO COLABORADOR que registrou a venda.
        Caixa caixa = caixaDAO.buscarAbertoPorUsuario(conn, venda.getIdColaborador());
        float totalAVista = movDAO.somarAVistaPorVenda(conn, idVenda);
        if (caixa != null && totalAVista > 0) {
            caixaDAO.adicionarAoValorFinal(conn, caixa.getIdCaixa(), -totalAVista);
        }
        movDAO.deletarPorVenda(conn, idVenda);

        // ── 4. Excluir ContasReceber da venda ─────────────────────────────────
        crDAO.deletarPorVenda(conn, idVenda);

        // ── 5. Restaurar crédito do paroquiano (se foi utilizado) ────────────
        if (venda.getCredUtilizado() > 0) {
            Paroquiano par = new Paroquiano().buscarPorId(conn, venda.getIdUsuario());
            if (par != null) {
                float novoSaldo = par.getSaldoCredito() + venda.getCredUtilizado();
                parDAO.atualizarSaldoCredito(conn, par.getIdUsuario(), novoSaldo);
            }
        }

        // ── 6. Excluir itens (FK: itemVenda → Venda) ─────────────────────────
        itemDAO.deletarPorVenda(conn, idVenda);

        return venda;
    }
}
