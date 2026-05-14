/**
 * ContasReceberController — Gestão de Contas a Receber.
 *
 * GRASP Controller  : coordena eventos e operações da tela de Contas a Receber.
 * SOLID SRP         : responsável apenas pela View de Contas a Receber.
 * MVC Control       : camada de controle da Tela 3 — Contas a Receber.
 * Low Coupling      : depende apenas de ContasReceberService, SessionManager e Toast.
 * High Cohesion     : todos os métodos operam exclusivamente sobre esta tela.
 */
class ContasReceberController {
  #service;
  #session;
  #toast;
  #contaSelecionada = null;
  #page = 1; #perPage = 10; #totalPages = 1;

  constructor() {
    this.#service = ContasReceberService.getInstance();
    this.#session = SessionManager.getInstance();
    this.#toast   = Toast.getInstance();
  }

  async init() {
    this.#bindEvents();
    await this.#loadResumo();
    await this.#loadContas();
  }

  /* ─── Eventos ────────────────────────────────────────────────── */
  #bindEvents() {
    // Filtros rápidos por status
    $('#filtros-rapidos').on('click', '[data-status]', e => {
      $('#filtros-rapidos [data-status]').removeClass('active');
      $(e.currentTarget).addClass('active');
      const status = $(e.currentTarget).data('status');
      $('#filtro-status').val(status);
      this.#page = 1;
      this.#loadContas();
    });

    $('#btn-filtrar').on('click', () => { this.#page = 1; this.#loadContas(); });
    $('#btn-limpar').on('click',  () => {
      $('#filtro-status, #filtro-colaborador, #filtro-data-inicio, #filtro-data-fim').val('');
      $('#filtro-valor-min, #filtro-valor-max').val('');
      $('#filtros-rapidos [data-status]').removeClass('active');
      $('#filtros-rapidos [data-status=""]').addClass('active');
      this.#page = 1;
      this.#loadContas();
    });

    $('#btn-confirmar-pagamento').on('click', () => this.#confirmarPagamento());
  }

  /* ─── Cards de resumo ────────────────────────────────────────── */
  async #loadResumo() {
    try {
      const r = await this.#service.getResumo();
      $('#card-pendente').text(this.#brl(r.totalPendente ?? 0));
      $('#card-recebido').text(this.#brl(r.totalRecebido ?? 0));
      $('#card-vencido').text(this.#brl(r.totalVencido ?? 0));
      $('#qtd-pendente').text(`${r.qtdPendente ?? 0} conta${r.qtdPendente !== 1 ? 's' : ''}`);
      $('#qtd-recebido').text(`${r.qtdPago ?? 0} conta${r.qtdPago !== 1 ? 's' : ''}`);
      $('#qtd-vencido').text(`${r.qtdVencido ?? 0} conta${r.qtdVencido !== 1 ? 's' : ''}`);
    } catch { /* resumo não-crítico */ }
  }

  /* ─── Tabela de contas ───────────────────────────────────────── */
  async #loadContas() {
    $('#tbody-contas').html(`
      <tr>
        <td colspan="7" class="text-center py-4 text-muted">
          <span class="spinner-border spinner-border-sm me-2"></span>Carregando...
        </td>
      </tr>`);
    try {
      const filtros = {
        status:      $('#filtro-status').val()           || null,
        colaborador: $('#filtro-colaborador').val().trim() || null,
        dataInicio:  $('#filtro-data-inicio').val()      || null,
        dataFim:     $('#filtro-data-fim').val()         || null,
        valorMin:    $('#filtro-valor-min').val()        || null,
        valorMax:    $('#filtro-valor-max').val()        || null,
      };

      const lista = await this.#service.getContas(filtros);
      this.#totalPages = Math.ceil(lista.length / this.#perPage) || 1;
      const paginado   = lista.slice((this.#page - 1) * this.#perPage, this.#page * this.#perPage);

      if (!paginado.length) {
        $('#tbody-contas').html(`
          <tr>
            <td colspan="7" class="text-center py-4 text-muted">
              <i class="bi bi-inbox me-1"></i>Nenhuma conta encontrada.
            </td>
          </tr>`);
        $('#info-contas').text('0 contas');
        $('#paginacao-contas').empty();
        return;
      }

      $('#tbody-contas').html(paginado.map(c => {
        const { badgeCls, badgeLabel } = this.#statusBadge(c.status);
        const vencDt = c.vencimento
          ? new Date(c.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')
          : '—';
        const acoes = c.status !== 'PAGO'
          ? `<button class="btn btn-sm btn-success me-1" title="Registrar Pagamento"
               onclick="window._contasCtrl.abrirPagamento(${c.id})">
               <i class="bi bi-check-circle"></i>
             </button>
             <button class="btn btn-sm btn-outline-secondary" title="Ver Detalhes"
               onclick="window._contasCtrl.abrirDetalhes(${c.id})">
               <i class="bi bi-eye"></i>
             </button>`
          : `<button class="btn btn-sm btn-outline-secondary" title="Ver Detalhes"
               onclick="window._contasCtrl.abrirDetalhes(${c.id})">
               <i class="bi bi-eye"></i>
             </button>`;
        return `
          <tr>
            <td>${this.#esc(c.cliente)}</td>
            <td><span class="badge bg-secondary">${this.#esc(c.venda)}</span></td>
            <td>${vencDt}</td>
            <td class="fw-medium">${this.#brl(c.valor)}</td>
            <td><small class="text-muted">${this.#esc(c.colaborador ?? '—')}</small></td>
            <td><span class="badge-status ${badgeCls}">${badgeLabel}</span></td>
            <td class="text-center" style="white-space:nowrap">${acoes}</td>
          </tr>`;
      }).join(''));

      const total = lista.length;
      $('#info-contas').text(`${total} conta${total !== 1 ? 's' : ''}`);
      this.#renderPag(total);
    } catch (err) {
      this.#toast.error('Erro', err.message || 'Erro ao carregar contas.');
    }
  }

  /* ─── Modal de pagamento ─────────────────────────────────────── */
  async abrirPagamento(id) {
    try {
      this.#contaSelecionada = await this.#service.getById(id);
    } catch (err) {
      this.#toast.error('Erro', err.message);
      return;
    }
    const c = this.#contaSelecionada;
    const vencDt = c.vencimento
      ? new Date(c.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')
      : '—';

    $('#pag-cliente').text(c.cliente);
    $('#pag-venda').text(c.venda);
    $('#pag-valor').text(this.#brl(c.valor));
    $('#pag-vencimento').text(vencDt);
    $('#pag-colaborador').text(c.colaborador ?? '—');
    $('#pag-forma-pagamento').val('');
    $('#pag-observacoes').val('');

    new bootstrap.Modal(document.getElementById('modal-pagamento')).show();
  }

  /* ─── Modal de detalhes ──────────────────────────────────────── */
  async abrirDetalhes(id) {
    try {
      const c = await this.#service.getById(id);
      const { badgeCls, badgeLabel } = this.#statusBadge(c.status);
      const vencDt = c.vencimento
        ? new Date(c.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')
        : '—';
      const pagDt = c.dataPagamento
        ? new Date(c.dataPagamento + 'T00:00:00').toLocaleDateString('pt-BR')
        : '—';

      $('#det-cliente').text(c.cliente);
      $('#det-venda').text(c.venda);
      $('#det-valor').text(this.#brl(c.valor));
      $('#det-vencimento').text(vencDt);
      $('#det-colaborador').text(c.colaborador ?? '—');
      $('#det-status').html(`<span class="badge-status ${badgeCls}">${badgeLabel}</span>`);
      $('#det-pagamento').text(pagDt);
      $('#det-forma').text(c.formaPagamento || '—');
      $('#det-observacoes').text(c.observacoes || '—');

      new bootstrap.Modal(document.getElementById('modal-detalhes')).show();
    } catch (err) {
      this.#toast.error('Erro', err.message);
    }
  }

  /* ─── Confirmar pagamento ────────────────────────────────────── */
  async #confirmarPagamento() {
    const formaPagamento = $('#pag-forma-pagamento').val();
    const observacoes    = $('#pag-observacoes').val().trim();

    if (!formaPagamento) {
      this.#toast.warning('Campo obrigatório', 'Selecione a forma de pagamento.');
      return;
    }

    const btn = $('#btn-confirmar-pagamento');
    btn.prop('disabled', true)
       .html('<span class="spinner-border spinner-border-sm me-1"></span>');
    try {
      await this.#service.registrarPagamento(this.#contaSelecionada.id, {
        formaPagamento,
        observacoes,
      });
      this.#toast.success('Pagamento registrado!', `${this.#contaSelecionada.cliente} — ${this.#brl(this.#contaSelecionada.valor)}`);
      bootstrap.Modal.getInstance(document.getElementById('modal-pagamento'))?.hide();
      this.#contaSelecionada = null;
      await this.#loadResumo();
      this.#page = 1;
      await this.#loadContas();
    } catch (err) {
      this.#toast.error('Erro ao registrar', err.message || 'Não foi possível registrar o pagamento.');
    } finally {
      btn.prop('disabled', false)
         .html('<i class="bi bi-check-circle me-1"></i> Confirmar Pagamento');
    }
  }

  /* ─── Paginação ──────────────────────────────────────────────── */
  #renderPag(total) {
    const ul = $('#paginacao-contas');
    ul.empty();
    if (this.#totalPages <= 1) return;
    if (this.#page > 1)
      ul.append(`<li class="page-item"><button class="page-link" id="pp-contas">&laquo;</button></li>`);
    for (let i = Math.max(1, this.#page - 2); i <= Math.min(this.#totalPages, this.#page + 2); i++)
      ul.append(`<li class="page-item ${i === this.#page ? 'active' : ''}">
        <button class="page-link pn-contas" data-page="${i}">${i}</button></li>`);
    if (this.#page < this.#totalPages)
      ul.append(`<li class="page-item"><button class="page-link" id="pnext-contas">&raquo;</button></li>`);

    $('#pp-contas').on('click',    () => { this.#page--; this.#loadContas(); });
    $('#pnext-contas').on('click', () => { this.#page++; this.#loadContas(); });
    $('.pn-contas[data-page]').on('click', e => {
      this.#page = +$(e.currentTarget).data('page');
      this.#loadContas();
    });
  }

  /* ─── Utilitários ────────────────────────────────────────────── */
  #statusBadge(status) {
    const map = {
      PENDENTE: { badgeCls: 'badge-pending',  badgeLabel: 'Pendente' },
      PAGO:     { badgeCls: 'badge-active',   badgeLabel: 'Pago'     },
      VENCIDO:  { badgeCls: 'badge-inactive', badgeLabel: 'Vencido'  },
    };
    return map[status] ?? { badgeCls: 'badge-pending', badgeLabel: status };
  }

  #brl(v)     { return Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  #esc(v)     { return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
}
