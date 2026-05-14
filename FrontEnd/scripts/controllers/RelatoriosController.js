/**
 * RelatoriosController — Dashboard analítico (acesso ADM).
 *
 * Gerencia filtros de período, cards de resumo e quatro abas
 * de detalhamento: Vendas, Inscrições, Caixa e Compras.
 */
class RelatoriosController {
  #api;
  #session;

  // Período ativo
  #periodoAtivo = 'mes';
  #dataInicio   = null;
  #dataFim      = null;

  // Aba ativa
  #tabAtiva  = 'vendas';
  #page      = 1;
  #perPage   = 20;
  #totalPages = 1;

  // Cache dos dados da aba atual
  #dadosAba = [];

  constructor() {
    this.#api     = ApiService.getInstance();
    this.#session = SessionManager.getInstance();
  }

  async init() {
    this.#checkAccess();
    this.#calcPeriodo('mes');
    this.#bindEvents();
    await this.#loadAll();
  }

  // ── Acesso ────────────────────────────────────────────────
  #checkAccess() {
    if (!this.#session.hasRole('ADM')) {
      Toast.show('Acesso restrito a Administradores.', 'error');
      setTimeout(() => window.location.replace('../dashboard.html'), 1500);
    }
  }

  // ── Eventos ───────────────────────────────────────────────
  #bindEvents() {
    // Quick period chips
    $('#periodo-chips').on('click', '.periodo-btn', e => {
      const btn = $(e.currentTarget);
      const periodo = btn.data('periodo');
      $('.periodo-btn').removeClass('active');
      btn.addClass('active');
      this.#periodoAtivo = periodo;

      if (periodo === 'personalizado') {
        $('#range-custom').removeClass('d-none');
        return;
      }
      $('#range-custom').addClass('d-none');
      this.#calcPeriodo(periodo);
      this.#page = 1;
      this.#loadAll();
    });

    // Custom date range
    $('#btn-aplicar-range').on('click', () => {
      const ini = $('#data-inicio').val();
      const fim = $('#data-fim').val();
      if (!ini || !fim) { Toast.show('Informe as duas datas.', 'warning'); return; }
      if (ini > fim) { Toast.show('A data inicial deve ser anterior à final.', 'warning'); return; }
      this.#dataInicio = ini;
      this.#dataFim    = fim;
      this.#atualizarLabelPeriodo();
      this.#page = 1;
      this.#loadAll();
    });

    // Tabs
    $('#relatorio-tabs button[data-bs-toggle="tab"]').on('shown.bs.tab', e => {
      const id = $(e.target).data('bs-target').replace('#tab-', '');
      this.#tabAtiva = id;
      this.#page     = 1;
      this.#loadAba();
    });

    // Sub-filtros Vendas
    $('#filtro-venda, #filtro-venda-pgto').on('change input', () => {
      if (this.#tabAtiva === 'vendas') { this.#page = 1; this.#loadAba(); }
    });

    // Sub-filtros Inscrições
    $('#filtro-inscricao, #filtro-inscricao-status').on('change input', () => {
      if (this.#tabAtiva === 'inscricoes') { this.#page = 1; this.#loadAba(); }
    });

    // Sub-filtros Caixa
    $('#filtro-caixa-tipo').on('change', () => {
      if (this.#tabAtiva === 'caixa') { this.#page = 1; this.#loadAba(); }
    });

    // Sub-filtros Compras
    $('#filtro-compra').on('input', () => {
      if (this.#tabAtiva === 'compras') { this.#page = 1; this.#loadAba(); }
    });

    // Exportar CSV
    $('#btn-exportar-csv').on('click', () => this.#exportarCsv());
  }

  // ── Período ───────────────────────────────────────────────
  #calcPeriodo(periodo) {
    const hoje  = new Date();
    const pad   = n => String(n).padStart(2, '0');
    const fmt   = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    let ini, fim;

    switch (periodo) {
      case 'hoje':
        ini = fim = fmt(hoje);
        break;
      case 'semana': {
        const dom = new Date(hoje);
        dom.setDate(hoje.getDate() - hoje.getDay());
        const sab = new Date(dom);
        sab.setDate(dom.getDate() + 6);
        ini = fmt(dom); fim = fmt(sab);
        break;
      }
      case 'mes':
        ini = `${hoje.getFullYear()}-${pad(hoje.getMonth()+1)}-01`;
        fim = fmt(new Date(hoje.getFullYear(), hoje.getMonth()+1, 0));
        break;
      case 'mes-anterior': {
        const prev = new Date(hoje.getFullYear(), hoje.getMonth()-1, 1);
        ini = fmt(prev);
        fim = fmt(new Date(hoje.getFullYear(), hoje.getMonth(), 0));
        break;
      }
      default:
        ini = `${hoje.getFullYear()}-${pad(hoje.getMonth()+1)}-01`;
        fim = fmt(hoje);
    }

    this.#dataInicio = ini;
    this.#dataFim    = fim;
    $('#data-inicio').val(ini);
    $('#data-fim').val(fim);
    this.#atualizarLabelPeriodo();
  }

  #atualizarLabelPeriodo() {
    const fmt = iso => new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR');
    $('#periodo-label').text(`${fmt(this.#dataInicio)} — ${fmt(this.#dataFim)}`);
  }

  // ── Carrega tudo ──────────────────────────────────────────
  async #loadAll() {
    await Promise.allSettled([
      this.#loadResumo(),
      this.#loadAba(),
    ]);
  }

  // ── Resumo (cards) ────────────────────────────────────────
  async #loadResumo() {
    // Coloca placeholders enquanto carrega
    ['vendas-total', 'inscricoes-total', 'caixa-saldo', 'compras-total'].forEach(id => {
      $(`#stat-${id}`).html('<div class="spinner-border spinner-border-sm"></div>');
    });

    try {
      const params = `dataInicio=${this.#dataInicio}&dataFim=${this.#dataFim}`;
      const resumo = await this.#api.get(`/relatorios/resumo?${params}`);

      $(`#stat-vendas-total`).text(this.#brl(resumo.totalVendas ?? 0));
      $(`#stat-vendas-qtd`).html(
        `<span class="text-muted">${resumo.qtdVendas ?? 0} vendas no período</span>`
      );

      $(`#stat-inscricoes-total`).text(this.#brl(resumo.totalInscricoes ?? 0));
      $(`#stat-inscricoes-qtd`).html(
        `<span class="text-muted">${resumo.qtdInscricoes ?? 0} inscrições</span>`
      );

      const saldo = resumo.saldoCaixa ?? 0;
      $(`#stat-caixa-saldo`).text(this.#brl(saldo));
      $(`#stat-caixa-movimentos`).html(
        `<span class="${saldo >= 0 ? 'delta-up' : 'delta-down'}">
          <i class="bi bi-arrow-${saldo >= 0 ? 'up' : 'down'}"></i>
          ${resumo.qtdMovimentos ?? 0} movimentos
        </span>`
      );

      $(`#stat-compras-total`).text(this.#brl(resumo.totalCompras ?? 0));
      $(`#stat-compras-qtd`).html(
        `<span class="text-muted">${resumo.qtdCompras ?? 0} pedidos</span>`
      );
    } catch {
      ['vendas-total', 'inscricoes-total', 'caixa-saldo', 'compras-total'].forEach(id => {
        $(`#stat-${id}`).text('—');
      });
    }
  }

  // ── Aba ───────────────────────────────────────────────────
  async #loadAba() {
    const loaders = {
      vendas:     () => this.#loadVendas(),
      inscricoes: () => this.#loadInscricoes(),
      caixa:      () => this.#loadCaixa(),
      compras:    () => this.#loadCompras(),
    };
    await loaders[this.#tabAtiva]?.();
  }

  // ── Vendas ────────────────────────────────────────────────
  async #loadVendas() {
    const tbody = $('#tbody-vendas');
    tbody.html(this.#loadingRow(7));
    try {
      const params = new URLSearchParams({
        dataInicio: this.#dataInicio,
        dataFim:    this.#dataFim,
        page:       this.#page - 1,
        size:       this.#perPage,
      });
      const busca = $('#filtro-venda').val().trim();
      const pgto  = $('#filtro-venda-pgto').val();
      if (busca) params.set('busca', busca);
      if (pgto)  params.set('formaPagamento', pgto);

      const resp = await this.#api.get(`/vendas?${params}`);
      const lista = resp.content ?? (Array.isArray(resp) ? resp : []);
      this.#totalPages = resp.totalPages ?? 1;

      if (!lista.length) { tbody.html(this.#emptyRow(7, 'Nenhuma venda no período.')); return; }

      tbody.html(lista.map(v => `
        <tr>
          <td><small class="text-muted">${v.id}</small></td>
          <td>${this.#fmtDatetime(v.dataHora)}</td>
          <td><small>${v.qtdItens ?? '—'} ${v.qtdItens === 1 ? 'item' : 'itens'}</small></td>
          <td>
            <span class="badge rounded-pill ${this.#pgtoClass(v.formaPagamento)}">
              ${this.#pgtoLabel(v.formaPagamento)}
            </span>
          </td>
          <td class="text-end text-muted"><small>${this.#brl(v.desconto ?? 0)}</small></td>
          <td class="text-end fw-medium" style="color:var(--color-primary)">${this.#brl(v.total)}</td>
          <td class="text-center"><small class="text-muted">${this.#esc(v.operador ?? '—')}</small></td>
        </tr>
      `).join(''));

      const total = resp.totalElements ?? lista.length;
      $('#vendas-sub-info').text(`${total} venda${total !== 1 ? 's' : ''}`);
      this.#renderPaginacao(resp.totalElements ?? lista.length);
    } catch (err) {
      Toast.show(err.message || 'Erro ao carregar vendas.', 'error');
      tbody.html(this.#errorRow(7));
    }
  }

  // ── Inscrições ────────────────────────────────────────────
  async #loadInscricoes() {
    const tbody = $('#tbody-inscricoes');
    tbody.html(this.#loadingRow(6));
    try {
      const params = new URLSearchParams({
        dataInicio: this.#dataInicio,
        dataFim:    this.#dataFim,
        page:       this.#page - 1,
        size:       this.#perPage,
      });
      const busca  = $('#filtro-inscricao').val().trim();
      const status = $('#filtro-inscricao-status').val();
      if (busca)  params.set('busca', busca);
      if (status) params.set('status', status);

      const resp = await this.#api.get(`/inscricoes?${params}`);
      const lista = resp.content ?? (Array.isArray(resp) ? resp : []);
      this.#totalPages = resp.totalPages ?? 1;

      if (!lista.length) { tbody.html(this.#emptyRow(6, 'Nenhuma inscrição no período.')); return; }

      tbody.html(lista.map(i => {
        const statusCls = { CONFIRMADA: 'bg-success', PENDENTE: 'bg-warning', CANCELADA: 'bg-danger' };
        return `
          <tr>
            <td><small class="text-muted">${i.id}</small></td>
            <td class="fw-medium">${this.#esc(i.nomeEvento ?? '—')}</td>
            <td>${this.#esc(i.nomeParticipante ?? '—')}</td>
            <td class="text-center"><small>${this.#fmtDate(i.dataInscricao)}</small></td>
            <td class="text-center">
              <span class="badge ${statusCls[i.status] ?? 'bg-secondary'}">${this.#esc(i.status ?? '—')}</span>
            </td>
            <td class="text-end fw-medium">${this.#brl(i.valor ?? 0)}</td>
          </tr>
        `;
      }).join(''));

      const total = resp.totalElements ?? lista.length;
      $('#inscricoes-sub-info').text(`${total} inscrição${total !== 1 ? 'ões' : ''}`);
      this.#renderPaginacao(resp.totalElements ?? lista.length);
    } catch (err) {
      Toast.show(err.message || 'Erro ao carregar inscrições.', 'error');
      tbody.html(this.#errorRow(6));
    }
  }

  // ── Caixa ─────────────────────────────────────────────────
  async #loadCaixa() {
    const tbody = $('#tbody-caixa');
    tbody.html(this.#loadingRow(6));
    try {
      const params = new URLSearchParams({
        dataInicio: this.#dataInicio,
        dataFim:    this.#dataFim,
        page:       this.#page - 1,
        size:       this.#perPage,
      });
      const tipo = $('#filtro-caixa-tipo').val();
      if (tipo) params.set('tipo', tipo);

      const resp = await this.#api.get(`/caixa/movimentos?${params}`);
      const lista = resp.content ?? (Array.isArray(resp) ? resp : []);
      this.#totalPages = resp.totalPages ?? 1;

      if (!lista.length) { tbody.html(this.#emptyRow(6, 'Nenhum movimento no período.')); return; }

      tbody.html(lista.map(m => {
        const isEntrada = ['ENTRADA','ABERTURA'].includes(m.tipo);
        return `
          <tr>
            <td><small class="text-muted">${m.id}</small></td>
            <td>${this.#fmtDatetime(m.dataHora)}</td>
            <td>
              <span class="badge ${isEntrada ? 'bg-success' : m.tipo === 'SAIDA' ? 'bg-danger' : 'bg-secondary'}">
                ${this.#esc(m.tipo)}
              </span>
            </td>
            <td><small>${this.#esc(m.descricao ?? '—')}</small></td>
            <td class="text-center"><small class="text-muted">${this.#esc(m.operador ?? '—')}</small></td>
            <td class="text-end fw-medium ${isEntrada ? 'text-success' : m.tipo === 'SAIDA' ? 'text-danger' : ''}">
              ${isEntrada ? '+' : m.tipo === 'SAIDA' ? '−' : ''}${this.#brl(m.valor ?? 0)}
            </td>
          </tr>
        `;
      }).join(''));

      const total = resp.totalElements ?? lista.length;
      $('#caixa-sub-info').text(`${total} movimento${total !== 1 ? 's' : ''}`);
      this.#renderPaginacao(resp.totalElements ?? lista.length);
    } catch (err) {
      Toast.show(err.message || 'Erro ao carregar movimentos de caixa.', 'error');
      tbody.html(this.#errorRow(6));
    }
  }

  // ── Compras ───────────────────────────────────────────────
  async #loadCompras() {
    const tbody = $('#tbody-compras');
    tbody.html(this.#loadingRow(6));
    try {
      const params = new URLSearchParams({
        dataInicio: this.#dataInicio,
        dataFim:    this.#dataFim,
        page:       this.#page - 1,
        size:       this.#perPage,
      });
      const busca = $('#filtro-compra').val().trim();
      if (busca) params.set('busca', busca);

      const resp = await this.#api.get(`/compras?${params}`);
      const lista = resp.content ?? (Array.isArray(resp) ? resp : []);
      this.#totalPages = resp.totalPages ?? 1;

      if (!lista.length) { tbody.html(this.#emptyRow(6, 'Nenhuma compra no período.')); return; }

      tbody.html(lista.map(c => {
        const statusCls = {
          RECEBIDA:  'bg-success',
          PENDENTE:  'bg-warning',
          CANCELADA: 'bg-danger',
        };
        return `
          <tr>
            <td><small class="text-muted">${c.id}</small></td>
            <td>${this.#fmtDate(c.dataCompra)}</td>
            <td class="fw-medium">${this.#esc(c.nomeFornecedor ?? '—')}</td>
            <td><small class="text-muted">${this.#esc(c.resumoProdutos ?? '—')}</small></td>
            <td class="text-center">
              <span class="badge ${statusCls[c.status] ?? 'bg-secondary'}">${this.#esc(c.status ?? '—')}</span>
            </td>
            <td class="text-end fw-medium" style="color:var(--color-structural)">${this.#brl(c.total ?? 0)}</td>
          </tr>
        `;
      }).join(''));

      const total = resp.totalElements ?? lista.length;
      $('#compras-sub-info').text(`${total} compra${total !== 1 ? 's' : ''}`);
      this.#renderPaginacao(resp.totalElements ?? lista.length);
    } catch (err) {
      Toast.show(err.message || 'Erro ao carregar compras.', 'error');
      tbody.html(this.#errorRow(6));
    }
  }

  // ── Paginação da aba ──────────────────────────────────────
  #renderPaginacao(totalItems) {
    const ul = $('#paginacao-tab');
    ul.empty();
    $('#info-registros-tab').text(`${totalItems} registro${totalItems !== 1 ? 's' : ''}`);
    if (this.#totalPages <= 1) return;

    if (this.#page > 1)
      ul.append(`<li class="page-item"><button class="page-link" id="pag-prev">&laquo;</button></li>`);

    const s = Math.max(1, this.#page - 2);
    const e = Math.min(this.#totalPages, this.#page + 2);
    for (let i = s; i <= e; i++) {
      ul.append(`
        <li class="page-item ${i === this.#page ? 'active' : ''}">
          <button class="page-link pag-num" data-page="${i}">${i}</button>
        </li>
      `);
    }

    if (this.#page < this.#totalPages)
      ul.append(`<li class="page-item"><button class="page-link" id="pag-next">&raquo;</button></li>`);

    $('#pag-prev').on('click',  () => { this.#page--; this.#loadAba(); });
    $('#pag-next').on('click',  () => { this.#page++; this.#loadAba(); });
    $('.pag-num').on('click',   e  => { this.#page = +$(e.currentTarget).data('page'); this.#loadAba(); });
  }

  // ── Exportar CSV ──────────────────────────────────────────
  async #exportarCsv() {
    try {
      const params = `dataInicio=${this.#dataInicio}&dataFim=${this.#dataFim}&tab=${this.#tabAtiva}`;
      Toast.show('Gerando relatório... aguarde.', 'info');
      const resp = await this.#api.get(`/relatorios/export?${params}`);
      if (resp?.url) {
        window.open(resp.url, '_blank');
      } else {
        Toast.show('Exportação não disponível para este módulo.', 'warning');
      }
    } catch {
      Toast.show('Erro ao exportar. Tente novamente.', 'error');
    }
  }

  // ── Helpers de rendering ──────────────────────────────────
  #loadingRow(cols) {
    return `<tr><td colspan="${cols}" class="table-empty">
      <div class="spinner-border spinner-border-sm me-2"></div> Carregando...
    </td></tr>`;
  }

  #emptyRow(cols, msg) {
    return `<tr><td colspan="${cols}" class="table-empty">
      <i class="bi bi-inbox fs-3 d-block mb-2 opacity-50"></i>${msg}
    </td></tr>`;
  }

  #errorRow(cols) {
    return `<tr><td colspan="${cols}" class="table-empty">
      <i class="bi bi-exclamation-triangle fs-3 d-block mb-2"></i>Erro ao carregar dados.
    </td></tr>`;
  }

  // ── Helpers gerais ────────────────────────────────────────
  #pgtoLabel(metodo) {
    return { DINHEIRO: 'Dinheiro', CARTAO: 'Cartão', PIX: 'PIX' }[metodo] ?? metodo ?? '—';
  }

  #pgtoClass(metodo) {
    return { DINHEIRO: 'bg-success', CARTAO: 'bg-primary', PIX: 'bg-info text-dark' }[metodo] ?? 'bg-secondary';
  }

  #fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR');
  }

  #fmtDatetime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  #brl(val) {
    return Number(val ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  #esc(v) {
    return String(v ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}
