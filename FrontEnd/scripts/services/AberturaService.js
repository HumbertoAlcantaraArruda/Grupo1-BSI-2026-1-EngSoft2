/**
 * AberturaService — Gestão do ciclo de vida do caixa (abertura e fechamento).
 *
 * GOF Singleton : instância única mantém o estado global do caixa.
 * GOF Façade    : interface simplificada oculta a complexidade do armazenamento.
 * GRASP Info.Expert: conhece as regras e os dados do caixa.
 * SOLID SRP     : única responsabilidade — persistência e regras de sessão de caixa.
 *
 * Dados mockados em memória — pronto para substituição por chamadas reais à API.
 */
class AberturaService {
  static #instance = null;

  /* ─── Estado interno ─────────────────────────────────────────── */
  #sessaoAtual = null;
  #nextId = 3;

  #historico = [
    {
      id: 1,
      dataAbertura: new Date('2026-05-12T08:05:00').toISOString(),
      dataFechamento: new Date('2026-05-12T18:30:00').toISOString(),
      valorInicial: 300.00,
      valorContado: 1845.50,
      totalEntradas: 2250.00,
      totalSaidas: 450.00,
      qtdVendas: 18,
      operadorAbertura: 'Maria Souza',
      operadorFechamento: 'Maria Souza',
      status: 'FECHADO',
      observacoesAbertura: '',
      observacoesFechamento: 'Fechamento normal do expediente.',
    },
    {
      id: 2,
      dataAbertura: new Date('2026-05-10T08:00:00').toISOString(),
      dataFechamento: new Date('2026-05-10T19:00:00').toISOString(),
      valorInicial: 500.00,
      valorContado: 2130.00,
      totalEntradas: 3100.00,
      totalSaidas: 800.00,
      qtdVendas: 27,
      operadorAbertura: 'João Silva',
      operadorFechamento: 'João Silva',
      status: 'FECHADO',
      observacoesAbertura: 'Início do período promocional.',
      observacoesFechamento: '',
    },
  ];

  /* ─── Singleton ──────────────────────────────────────────────── */
  constructor() {
    if (AberturaService.#instance) return AberturaService.#instance;
    AberturaService.#instance = this;
  }

  static getInstance() {
    if (!AberturaService.#instance) new AberturaService();
    return AberturaService.#instance;
  }

  /* ─── Consultas ──────────────────────────────────────────────── */

  async getSessaoAtual() {
    await this.#delay(300);
    if (!this.#sessaoAtual) {
      const err = new Error('Nenhum caixa aberto no momento.');
      err.status = 404;
      throw err;
    }
    return { ...this.#sessaoAtual };
  }

  async getResumo(sessaoId) {
    await this.#delay(200);
    const s = this.#sessaoAtual;
    if (!s || s.id !== sessaoId) throw new Error('Sessão não encontrada.');
    return {
      valorInicial:  s.valorInicial,
      totalEntradas: s.totalEntradas,
      totalSaidas:   s.totalSaidas,
      saldoAtual:    s.valorInicial + s.totalEntradas - s.totalSaidas,
      qtdVendas:     s.qtdVendas,
    };
  }

  async getHistorico(filtros = {}) {
    await this.#delay(250);
    let lista = [...this.#historico];
    if (filtros.dataInicio) lista = lista.filter(s => s.dataAbertura >= filtros.dataInicio);
    if (filtros.dataFim)    lista = lista.filter(s => s.dataAbertura <= filtros.dataFim + 'T23:59:59');
    if (filtros.operador)   lista = lista.filter(s =>
      s.operadorAbertura?.toLowerCase().includes(filtros.operador.toLowerCase())
    );
    return lista;
  }

  /* ─── Mutações ───────────────────────────────────────────────── */

  async abrir(dados) {
    await this.#delay(450);
    if (this.#sessaoAtual) throw new Error('Já existe um caixa aberto.');

    const sessao = {
      id:                    this.#nextId++,
      dataAbertura:          new Date().toISOString(),
      dataFechamento:        null,
      valorInicial:          Number(dados.valorInicial) || 0,
      valorContado:          null,
      totalEntradas:         0,
      totalSaidas:           0,
      qtdVendas:             0,
      operadorAbertura:      dados.operadorAbertura || 'Usuário',
      operadorFechamento:    null,
      status:                'ABERTO',
      observacoesAbertura:   dados.observacoes || '',
      observacoesFechamento: '',
    };
    this.#sessaoAtual = sessao;
    return { ...sessao };
  }

  async fechar(dados) {
    await this.#delay(500);
    if (!this.#sessaoAtual) throw new Error('Nenhum caixa aberto para fechar.');

    this.#sessaoAtual.dataFechamento        = new Date().toISOString();
    this.#sessaoAtual.valorContado          = Number(dados.valorContado) || 0;
    this.#sessaoAtual.observacoesFechamento = dados.observacoes || '';
    this.#sessaoAtual.status                = 'FECHADO';
    this.#sessaoAtual.operadorFechamento    = this.#sessaoAtual.operadorAbertura;

    this.#historico.unshift({ ...this.#sessaoAtual });
    this.#sessaoAtual = null;
    return { mensagem: 'Caixa fechado com sucesso.' };
  }

  /* ─── Integração interna (usado por MovimentacoesService) ────── */

  /** Atualiza totais da sessão aberta ao registrar movimentação. */
  _atualizarTotais(tipo, valor) {
    if (!this.#sessaoAtual) return;
    if (tipo === 'ENTRADA') this.#sessaoAtual.totalEntradas += valor;
    if (tipo === 'SAIDA')   this.#sessaoAtual.totalSaidas   += valor;
  }

  /** Retorna snapshot síncrono da sessão (sem await). */
  getSessaoAtualSync() {
    return this.#sessaoAtual ? { ...this.#sessaoAtual } : null;
  }

  /* ─── Utilitário ─────────────────────────────────────────────── */
  #delay(ms) { return new Promise(r => setTimeout(r, ms)); }
}
