/**
 * CheckoutFacade — Facade + Singleton (GRASP: Creator / Controller)
 *
 * Simplifica operações que envolvem múltiplos serviços:
 *   Vendas  +  Caixa  +  Validação de Estoque
 *
 * O consumidor (Controller) chama apenas finalizarVenda() ou
 * processarDevolucao() sem conhecer a orquestração interna.
 */
class CheckoutFacade {
  static #instance = null;

  #vendas  = new VendasService();
  #caixa   = new CaixaService();
  #api     = ApiService.getInstance();
  #session = SessionManager.getInstance();

  constructor() {
    if (CheckoutFacade.#instance) return CheckoutFacade.#instance;
    CheckoutFacade.#instance = this;
  }

  static getInstance() {
    if (!CheckoutFacade.#instance) new CheckoutFacade();
    return CheckoutFacade.#instance;
  }

  // ── Finalizar Venda ────────────────────────────────────────
  async finalizarVenda(itens, formaPagamentoId, paroquianoId = null) {
    const usuario = this.#session.getUser();

    // 1. Garante que há um caixa aberto
    const caixaData = await this.#caixa.buscarAberto(usuario.id);
    const caixa = caixaData?.result;
    if (!caixa) throw new Error('Nenhum caixa aberto. Abra o caixa antes de registrar vendas.');

    // 2. Valida estoque de todos os itens antes de persistir qualquer coisa
    await this.#validarEstoque(itens);

    // 3. Registra a venda (Backend reduz o estoque)
    const vendaData = await this.#vendas.registrar(itens, formaPagamentoId, caixa.id, paroquianoId);

    // 4. Registra entrada no caixa
    const total = itens.reduce((acc, i) => acc + (i.preco * i.quantidade), 0);
    await this.#caixa.registrarMovimentacao(
      caixa.id, 'ENTRADA', total, `Venda #${vendaData.result.id}`
    );

    return vendaData.result;
  }

  // ── Processar Devolução ────────────────────────────────────
  async processarDevolucao(vendaId, itens, opcao) {
    // opcao: 'REINTEGRAR' | 'DESCARTAR'
    const vendaData = await this.#vendas.buscarPorId(vendaId);
    if (!vendaData?.result) throw new Error('Venda não encontrada.');

    const devolucao = await this.#vendas.registrarDevolucao(vendaId, itens, opcao);

    // Registra saída no caixa (estorno)
    const total = itens.reduce((acc, i) => acc + (i.preco * i.quantidade), 0);
    const usuario = this.#session.getUser();
    const caixaData = await this.#caixa.buscarAberto(usuario.id);
    if (caixaData?.result) {
      await this.#caixa.registrarMovimentacao(
        caixaData.result.id, 'SAIDA', total, `Devolução Venda #${vendaId}`
      );
    }

    return devolucao.result;
  }

  // ── Privado: validar estoque ───────────────────────────────
  async #validarEstoque(itens) {
    for (const item of itens) {
      const prodData = await this.#api.get(`/produtos/${item.produtoId}`);
      const produto  = prodData?.result;
      if (!produto) throw new Error(`Produto #${item.produtoId} não encontrado.`);
      if (produto.estoque < item.quantidade) {
        throw new Error(
          `Estoque insuficiente para "${produto.nome}". ` +
          `Disponível: ${produto.estoque}, solicitado: ${item.quantidade}.`
        );
      }
    }
  }
}
