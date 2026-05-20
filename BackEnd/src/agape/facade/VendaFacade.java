package agape.facade;

import agape.dao.*;
import agape.model.*;

import java.sql.Connection;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * VendaFacade — GOF Facade
 *
 * Centraliza e orquestra a operação "Finalizar Venda" em uma única fachada,
 * escondendo a complexidade de coordenar múltiplos DAOs e regras de negócio.
 *
 * Padrões aplicados:
 *   GOF Facade   — interface simplificada sobre subsistema complexo de DAOs.
 *   GOF Singleton — instância única garantida em toda a execução.
 *   SOLID DIP    — recebe Connection externamente; DAOs poderiam ser injetados
 *                  via interface (aqui instanciados localmente por simplicidade).
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

    // DIP (SOLID) — dependências declaradas como campos; poderiam ser
    // injetadas via construtor usando interfaces IVendaDAO, IProdutoDAO etc.
    private final VendaDAO             vendaDAO    = new VendaDAO();
    private final ItemVendaDAO         itemDAO     = new ItemVendaDAO();
    private final ProdutoDAO           prodDAO     = new ProdutoDAO();
    private final ParoquianoDAO        parDAO      = new ParoquianoDAO();
    private final CaixaDAO             caixaDAO    = new CaixaDAO();
    private final MovimentacaoCaixaDAO movDAO      = new MovimentacaoCaixaDAO();
    private final ContasReceberDAO     crDAO       = new ContasReceberDAO();
    private final ParcelaRecebimentoDAO parcelaDAO = new ParcelaRecebimentoDAO();

    // ──────────────────────────────────────────────────────────────────────────

    /**
     * finalizarVenda() — Ponto de entrada transacional.
     *
     * Orquestra em sequência (dentro da transação gerenciada por CVenda):
     *   1. Registrar Venda (VendaDAO).
     *   2. Registrar ItemVenda + Decrementar Estoque (RF_F9).
     *   3. Atualizar Saldo de Crédito do Paroquiano.
     *   4. Atualizar Caixa + registrar MovimentacaoCaixa (RF_F5).
     *   5. Gerar ContasReceber + ParcelasRecebimento (apenas parcelados — RN02/RN03).
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
            // Creator (GRASP) — Facade cria ItemVenda por ter todos os dados necessários
            ItemVenda item = new ItemVenda();
            item.setIdVenda(idVenda);
            item.setIdProd(produtos[i].getIdProd());
            item.setQuantidade(quantidades[i]);
            item.setValorUnitario(vlrsUni[i]);
            itemDAO.inserir(conn, item);

            // RF_F9 — Decrementar estoque: RN07 (não negativo) foi validado no Controller
            prodDAO.decrementarEstoque(conn, produtos[i].getIdProd(), quantidades[i]);
        }

        // ── 3. Atualizar Saldo de Crédito do Paroquiano ───────────────────────
        // Low Coupling (GRASP) — ParoquianoDAO encapsula a atualização, sem que
        // a Facade precise conhecer a estrutura interna da tabela Paroquiano
        if (credUtilizado > 0) {
            float novoSaldo = paroquiano.getSaldoCredito() - credUtilizado;
            parDAO.atualizarSaldoCredito(conn, paroquiano.getIdUsuario(), novoSaldo);
        }

        // ── 4. Caixa + MovimentacaoCaixa (RF_F5) ─────────────────────────────
        // Information Expert — CaixaDAO é expert em buscar o caixa aberto
        Caixa caixa = caixaDAO.buscarAberto(conn);
        if (caixa != null) {
            // Apenas pagamentos à vista (numParcelas=1) entram no caixa imediatamente
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

        // ── 5. ContasReceber + Parcelas (RN02/RN03 — apenas parcelados) ───────
        // High Cohesion (GRASP) — ContasReceberDAO cuida exclusivamente de contas
        for (int i = 0; i < idFormas.length; i++) {
            if (numParcelas[i] > 1) {
                // RN02 — Criar registro de Conta a Receber para a venda parcelada
                ContasReceber cr = new ContasReceber();
                cr.setIdVenda(idVenda);
                cr.setIdCaixa(caixa != null ? caixa.getIdCaixa() : 0);
                cr.setIdUsuario(paroquiano.getIdUsuario());
                cr.setValor(vlrsPag[i]);
                cr.setDataVencimento(LocalDateTime.now().plusMonths(numParcelas[i]));
                int idConta = crDAO.inserir(conn, cr);

                // RN03 — Gerar uma ParcelaRecebimento por parcela (vencimento mensal)
                float valorParcela = (float) Math.round(vlrsPag[i] / numParcelas[i] * 100) / 100f;
                for (int p = 1; p <= numParcelas[i]; p++) {
                    ParcelaRecebimento parcela = new ParcelaRecebimento();
                    parcela.setIdConta(idConta);
                    parcela.setNumeroParcela(p);
                    parcela.setValor(valorParcela);
                    parcela.setDataVencimento(LocalDate.now().plusMonths(p));
                    parcela.setStatus("PENDENTE");
                    parcelaDAO.inserir(conn, parcela);
                }
            }
        }

        return idVenda;
    }
}
