/**
 * ContasReceberService — Gestão de contas a receber.
 *
 * GOF Singleton : instância única centraliza os dados de recebimento.
 * GOF Façade    : interface uniforme para consultas, pagamentos e resumo.
 * GRASP Info.Expert: conhece as regras e o estado das contas a receber.
 * SOLID SRP     : única responsabilidade — contas a receber.
 *
 * Dados mockados em memória — pronto para substituição por chamadas reais à API.
 */
class ContasReceberService {
  static #instance = null;

  /* ─── Dados mockados ─────────────────────────────────────────── */
  #contas = [
    {
      id: 1, cliente: 'Ana Paula Ferreira', venda: 'VND-0091',
      vencimento: '2026-05-20', valor: 450.00,
      status: 'PENDENTE', colaborador: 'João Silva',
      dataPagamento: null, formaPagamento: null, observacoes: '',
    },
    {
      id: 2, cliente: 'Carlos Eduardo Lima', venda: 'VND-0087',
      vencimento: '2026-05-10', valor: 1200.00,
      status: 'VENCIDO', colaborador: 'Maria Souza',
      dataPagamento: null, formaPagamento: null, observacoes: '',
    },
    {
      id: 3, cliente: 'Fernanda Rocha', venda: 'VND-0083',
      vencimento: '2026-04-30', valor: 350.00,
      status: 'VENCIDO', colaborador: 'João Silva',
      dataPagamento: null, formaPagamento: null, observacoes: '',
    },
    {
      id: 4, cliente: 'Roberto Almeida', venda: 'VND-0079',
      vencimento: '2026-05-05', valor: 800.00,
      status: 'PAGO', colaborador: 'Pedro Costa',
      dataPagamento: '2026-05-06', formaPagamento: 'PIX', observacoes: '',
    },
    {
      id: 5, cliente: 'Luciana Pereira', venda: 'VND-0075',
      vencimento: '2026-05-25', valor: 600.00,
      status: 'PENDENTE', colaborador: 'Maria Souza',
      dataPagamento: null, formaPagamento: null, observacoes: '',
    },
    {
      id: 6, cliente: 'Marcelo Oliveira', venda: 'VND-0068',
      vencimento: '2026-05-01', valor: 2500.00,
      status: 'PAGO', colaborador: 'Pedro Costa',
      dataPagamento: '2026-05-01', formaPagamento: 'Cartão de Crédito', observacoes: '',
    },
    {
      id: 7, cliente: 'Sandra Costa', venda: 'VND-0065',
      vencimento: '2026-06-10', valor: 750.00,
      status: 'PENDENTE', colaborador: 'João Silva',
      dataPagamento: null, formaPagamento: null, observacoes: '',
    },
    {
      id: 8, cliente: 'Paulo Mendes', venda: 'VND-0061',
      vencimento: '2026-05-08', valor: 320.00,
      status: 'VENCIDO', colaborador: 'Maria Souza',
      dataPagamento: null, formaPagamento: null, observacoes: '',
    },
  ];

  #nextId = 9;

  /* ─── Singleton ──────────────────────────────────────────────── */
  constructor() {
    if (ContasReceberService.#instance) return ContasReceberService.#instance;
    ContasReceberService.#instance = this;
  }

  static getInstance() {
    if (!ContasReceberService.#instance) new ContasReceberService();
    return ContasReceberService.#instance;
  }

  /* ─── Consultas ──────────────────────────────────────────────── */

  async getContas(filtros = {}) {
    await this.#delay(300);
    let lista = [...this.#contas];

    if (filtros.status)      lista = lista.filter(c => c.status === filtros.status);
    if (filtros.colaborador) lista = lista.filter(c =>
      c.colaborador?.toLowerCase().includes(filtros.colaborador.toLowerCase())
    );
    if (filtros.dataInicio)  lista = lista.filter(c => c.vencimento >= filtros.dataInicio);
    if (filtros.dataFim)     lista = lista.filter(c => c.vencimento <= filtros.dataFim);
    if (filtros.valorMin)    lista = lista.filter(c => c.valor >= Number(filtros.valorMin));
    if (filtros.valorMax)    lista = lista.filter(c => c.valor <= Number(filtros.valorMax));

    return lista.sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  }

  async getById(id) {
    await this.#delay(100);
    const conta = this.#contas.find(c => c.id === id);
    if (!conta) throw new Error('Conta não encontrada.');
    return { ...conta };
  }

  async getResumo() {
    await this.#delay(200);
    const contas = this.#contas;
    return {
      totalPendente: contas.filter(c => c.status === 'PENDENTE').reduce((s, c) => s + c.valor, 0),
      totalRecebido: contas.filter(c => c.status === 'PAGO').reduce((s, c) => s + c.valor, 0),
      totalVencido:  contas.filter(c => c.status === 'VENCIDO').reduce((s, c) => s + c.valor, 0),
      qtdPendente:   contas.filter(c => c.status === 'PENDENTE').length,
      qtdPago:       contas.filter(c => c.status === 'PAGO').length,
      qtdVencido:    contas.filter(c => c.status === 'VENCIDO').length,
    };
  }

  /* ─── Mutações ───────────────────────────────────────────────── */

  async registrarPagamento(id, dados) {
    await this.#delay(400);
    const conta = this.#contas.find(c => c.id === id);
    if (!conta)                 throw new Error('Conta não encontrada.');
    if (conta.status === 'PAGO') throw new Error('Esta conta já foi paga.');
    if (!dados.formaPagamento)  throw new Error('Forma de pagamento é obrigatória.');

    conta.status         = 'PAGO';
    conta.dataPagamento  = new Date().toISOString().split('T')[0];
    conta.formaPagamento = dados.formaPagamento;
    conta.observacoes    = dados.observacoes || '';
    return { ...conta };
  }

  /* ─── Utilitário ─────────────────────────────────────────────── */
  #delay(ms) { return new Promise(r => setTimeout(r, ms)); }
}
