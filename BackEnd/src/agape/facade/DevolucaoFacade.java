package agape.facade;

import agape.dao.*;
import agape.model.*;

import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DevolucaoFacade — GOF Facade (RF_F8 — Realizar Devolução de Produtos).
 *
 * Centraliza a operação de devolução, escondendo da camada Controller a
 * complexidade de coordenar Venda, ItemVenda, Devolucao, Produto e Paroquiano.
 *
 * Padrões aplicados:
 *   GOF Facade   — interface única e simples sobre um subsistema de DAOs.
 *   GOF Singleton — instância única em toda a aplicação.
 *   SOLID SRP    — esta facade SÓ orquestra a regra de devolução; a fronteira
 *                  da TRANSAÇÃO (setAutoCommit/commit/rollback) é responsabilidade
 *                  do chamador (CDevolucao), mantendo a separação de papéis.
 *   SOLID DIP    — depende de DAOs; aqui instanciados localmente (padrão do
 *                  projeto), mas poderiam ser injetados via interface.
 *
 * ── TRANSAÇÃO ATÔMICA ──────────────────────────────────────────────────────
 * Todos os passos de realizarDevolucao() rodam na MESMA Connection sem commit
 * intermediário. Se qualquer passo lançar exceção, o CDevolucao executa rollback
 * e NADA é persistido: registro de devolução, itens, estoque e crédito formam
 * uma unidade indivisível (princípio "tudo ou nada").
 */
public class DevolucaoFacade {

    // GOF Singleton
    private static DevolucaoFacade instancia;
    private DevolucaoFacade() {}
    public static DevolucaoFacade getInstance() {
        if (instancia == null) instancia = new DevolucaoFacade();
        return instancia;
    }

    // SOLID DIP — dependências (instanciadas localmente, padrão do projeto)
    private final DevolucaoDAO  devolucaoDAO = new DevolucaoDAO();
    private final VendaDAO      vendaDAO     = new VendaDAO();
    private final ItemVendaDAO  itemVendaDAO = new ItemVendaDAO();
    private final ProdutoDAO    produtoDAO   = new ProdutoDAO();
    private final ParoquianoDAO paroquianoDAO = new ParoquianoDAO();

    /**
     * realizarDevolucao() — Ponto de entrada transacional do RF_F8.
     *
     * @param conn         conexão com autoCommit=false (gerenciada por CDevolucao)
     * @param idVenda      venda de origem
     * @param idsProd      produtos a devolver
     * @param quantidades  quantidade devolvida de cada produto
     * @param vlrsUni      valor unitário de cada produto (no momento da venda)
     * @param reincorpora  true → devolve as unidades ao estoque
     * @return Devolucao persistida (com id e valorTotal calculados)
     *
     * Fluxo (RF_F8):
     *   1. Valida a existência da venda (Fluxo 2.1).
     *   2. Valida quantidade devolvida ≤ vendida, descontando devoluções anteriores (Fluxo 4.1).
     *   3. Registra a Devolucao e seus itens (itemDevolucao).
     *   4. Reincorpora estoque de forma ATÔMICA, se solicitado.
     *   5. Credita o paroquiano (atualizarCreditoParoquiano) — vínculo financeiro.
     */
    public Devolucao realizarDevolucao(
            Connection conn,
            int        idVenda,
            int[]      idsProd,
            int[]      quantidades,
            float[]    vlrsUni,
            boolean    reincorpora
    ) throws Exception {

        // ── 1. Valida a venda de origem (Fluxo 2.1) ──────────────────────────
        Venda venda = vendaDAO.buscarPorId(conn, idVenda);
        if (venda == null)
            throw new Exception("Venda #" + idVenda + " não encontrada (Fluxo 2.1).");

        if (idsProd == null || idsProd.length == 0)
            throw new Exception("Nenhum produto selecionado para devolução.");

        // Mapa idProd → quantidade vendida na venda original (Information Expert)
        List<ItemVenda> itensVenda = itemVendaDAO.listarItensPorVenda(conn, idVenda);

        // ── 2. Validações de quantidade (Fluxo 4.1) + cálculo do valor total ──
        float valorTotal = 0f;
        for (int i = 0; i < idsProd.length; i++) {
            int   idProd = idsProd[i];
            int   qtd    = quantidades[i];
            float vlrUni = vlrsUni[i];

            if (qtd <= 0)
                throw new Exception("Quantidade de devolução inválida para o produto " + idProd + ".");

            int qtdVendida = 0;
            String nomeProd = "produto " + idProd;
            for (ItemVenda iv : itensVenda) {
                if (iv.getIdProd() == idProd) {
                    qtdVendida = iv.getQuantidade();
                    nomeProd   = iv.getNomeProduto() != null ? iv.getNomeProduto() : nomeProd;
                    break;
                }
            }
            if (qtdVendida == 0)
                throw new Exception("O produto \"" + nomeProd + "\" não pertence à venda #" + idVenda + ".");

            // Fluxo 4.1 — devolvido (agora + anteriores) não pode exceder o vendido
            int jaDevolvido = devolucaoDAO.quantidadeJaDevolvida(conn, idVenda, idProd);
            if (qtd + jaDevolvido > qtdVendida)
                throw new Exception(
                    "Quantidade a devolver de \"" + nomeProd + "\" (" + qtd + ") excede o disponível. " +
                    "Vendido: " + qtdVendida + ", já devolvido: " + jaDevolvido + ".");

            valorTotal += qtd * vlrUni;
        }
        valorTotal = (float) Math.round(valorTotal * 100) / 100f;

        // ── 3. Registra a Devolucao (Creator GRASP — reúne todos os dados) ────
        Devolucao dev = new Devolucao();
        dev.setIdVenda(idVenda);
        dev.setIdUsuario(venda.getIdUsuario());   // paroquiano da venda original
        dev.setDataHora(LocalDateTime.now());
        dev.setValorTotal(valorTotal);
        dev.setReincorporaEst(reincorpora ? 1 : 0);
        int idDevolucao = devolucaoDAO.inserir(conn, dev);
        dev.setIdDevolucao(idDevolucao);

        // ── 3b. Itens da devolução + 4. Estoque atômico ──────────────────────
        for (int i = 0; i < idsProd.length; i++) {
            ItemDevolucao item = new ItemDevolucao();
            item.setIdDev(idDevolucao);
            item.setIdProd(idsProd[i]);
            item.setQuantidade(quantidades[i]);
            item.setValorUnitario(vlrsUni[i]);
            devolucaoDAO.inserirItem(conn, item);

            // SEGURANÇA DE ESTOQUE — incremento ATÔMICO (qtdAtual = qtdAtual + ?)
            // executado no próprio UPDATE do banco, evitando Race Condition.
            if (reincorpora) {
                produtoDAO.restaurarEstoque(conn, idsProd[i], quantidades[i]);
            }
        }

        // ── 5. Vínculo financeiro — credita o paroquiano ─────────────────────
        atualizarCreditoParoquiano(conn, venda.getIdUsuario(), valorTotal);

        return dev;
    }

    /**
     * atualizarCreditoParoquiano() — Vínculo financeiro da devolução.
     *
     * Realiza um UPDATE DIRETO e ATÔMICO na tabela Paroquiano, incrementando o
     * saldoCredito com o valorTotal da devolução (saldoCredito = saldoCredito + ?).
     * Como o cálculo ocorre no banco, não há ciclo ler→somar→gravar e, portanto,
     * não há condição de corrida entre operações concorrentes.
     *
     * SRP — método coeso, com a única responsabilidade de creditar o paroquiano.
     */
    public void atualizarCreditoParoquiano(Connection conn, int idUsuario, float valorTotal)
            throws Exception {
        paroquianoDAO.incrementarSaldoCredito(conn, idUsuario, valorTotal);
    }
}
