/**
 * MovimentacoesService — Gestão de reforços (suprimentos) e sangrias.
 *
 * GOF Singleton : instância única centraliza os dados de movimentação.
 * GOF Façade    : interface uniforme para registrar e consultar movimentos.
 * GRASP Info.Expert: conhece as regras de movimentação do caixa.
 * SOLID SRP     : única responsabilidade — movimentações financeiras do caixa.
 *
 * Dados mockados em memória — pronto para substituição por chamadas reais à API.
 * Depende de AberturaService para atualizar os totais da sessão ativa.
 */
class MovimentacoesService {
  static #instance = null;

  /* ─── Dados mockados ─────────────────────────────────────────── */
  #movimentos = [
    {
      id: 1, sessaoId: 1, tipo: 'ENTRADA',
      descricao: 'Suprimento de troco para atendimento',
      valor: 200.00, operador: 'Maria Souza',
      dataHora: new Date('2026-05-12T09:30:00').toISOString(),
    },
    {
      id: 2, sessaoId: 1, tipo: 'SAIDA',
      descricao: 'Depósito bancário — excesso de caixa',
      valor: 300.00, operador: 'Maria Souza',
      dataHora: new Date('2026-05-12T15:00:00').toISOString(),
    },
    {
      id: 3, sessaoId: 2, tipo: 'ENTRADA',
      descricao: 'Fundo de caixa adicional',
      valor: 150.00, operador: 'João Silva',
      dataHora: new Date('2026-05-10T10:00:00').toISOString(),
    },
    {
      id: 4, sessaoId: 2, tipo: 'SAIDA',
      descricao: 'Pagamento a fornecedor — nota 4521',
      valor: 500.00, operador: 'João Silva',
      dataHora: new Date('2026-05-10T14:30:00').toISOString(),
    },
    {
      id: 5, sessaoId: 2, tipo: 'SAIDA',
      descricao: 'Sangria administrativa — depósito programado',
      valor: 300.00, operador: 'João Silva',
      dataHora: new Date('2026-05-10T17:00:00').toISOString(),
    },
  ];

  #nextId = 6;

  /* ─── Singleton ──────────────────────────────────────────────── */
  constructor() {
    if (MovimentacoesService.#instance) return MovimentacoesService.#instance;
    MovimentacoesService.#instance = this;
  }

  static getInstance() {
    if (!MovimentacoesService.#instance) new MovimentacoesService();
    return MovimentacoesService.#instance;
  }

  /* ─── Consultas ──────────────────────────────────────────────── */

  async getMovimentacoes(filtros = {}) {
    await this.#delay(300);
    let lista = [...this.#movimentos];

    if (filtros.sessaoId != null) lista = lista.filter(m => m.sessaoId === filtros.sessaoId);
    if (filtros.tipo)             lista = lista.filter(m => m.tipo === filtros.tipo);
    if (filtros.operador)         lista = lista.filter(m =>
      m.operador?.toLowerCase().includes(filtros.operador.toLowerCase())
    );
    if (filtros.dataInicio)       lista = lista.filter(m => m.dataHora >= filtros.dataInicio);
    if (filtros.dataFim)          lista = lista.filter(m => m.dataHora <= filtros.dataFim + 'T23:59:59');

    return lista.sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));
  }

  async getResumo(sessaoId) {
    await this.#delay(200);
    const lista = this.#movimentos.filter(m => m.sessaoId === sessaoId);
    return {
      totalEntradas: lista.filter(m => m.tipo === 'ENTRADA').reduce((s, m) => s + m.valor, 0),
      totalSaidas:   lista.filter(m => m.tipo === 'SAIDA').reduce((s, m) => s + m.valor, 0),
      qtdEntradas:   lista.filter(m => m.tipo === 'ENTRADA').length,
      qtdSaidas:     lista.filter(m => m.tipo === 'SAIDA').length,
    };
  }

  /* ─── Mutações ───────────────────────────────────────────────── */

  async registrar(dados) {
    await this.#delay(400);

    const sessao = AberturaService.getInstance().getSessaoAtualSync();
    if (!sessao) throw new Error('Nenhum caixa aberto para registrar movimentação.');
    if (!dados.valor || dados.valor <= 0) throw new Error('Valor deve ser maior que zero.');
    if (!dados.descricao?.trim()) throw new Error('Descrição é obrigatória.');
    if (!['ENTRADA', 'SAIDA'].includes(dados.tipo)) throw new Error('Tipo inválido.');

    const mov = {
      id:        this.#nextId++,
      sessaoId:  sessao.id,
      tipo:      dados.tipo,
      descricao: dados.descricao.trim(),
      valor:     Number(dados.valor),
      operador:  dados.operador || 'Usuário',
      dataHora:  new Date().toISOString(),
    };

    this.#movimentos.unshift(mov);
    AberturaService.getInstance()._atualizarTotais(dados.tipo, mov.valor);
    return { ...mov };
  }

  /* ─── Utilitário ─────────────────────────────────────────────── */
  #delay(ms) { return new Promise(r => setTimeout(r, ms)); }
}
