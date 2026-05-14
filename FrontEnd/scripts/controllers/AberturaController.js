/**
 * AberturaController — Abertura e Fechamento de Caixa.
 *
 * GRASP Controller  : coordena eventos e operações da tela de Abertura/Fechamento.
 * SOLID SRP         : responsável apenas pela View de Abertura/Fechamento de Caixa.
 * MVC Control       : camada de controle da Tela 1 — Abertura/Fechamento de Caixa.
 * Low Coupling      : depende apenas de AberturaService, SessionManager e Toast.
 * High Cohesion     : todos os métodos operam exclusivamente sobre esta tela.
 */
class AberturaController {
  #service;
  #session;
  #toast;
  #sessaoAtual = null;
  #page = 1; #perPage = 10; #totalPages = 1;

  constructor() {
    this.#service = AberturaService.getInstance();
    this.#session = SessionManager.getInstance();
    this.#toast   = Toast.getInstance();
  }

  async init() {
    Mask.applyTo(document.getElementById('abertura-valor'),        'currency');
    Mask.applyTo(document.getElementById('fechar-valor-contado'),  'currency');
    this.#bindEvents();
    await this.#verificarEstado();
  }

  /* ─── Eventos ────────────────────────────────────────────────── */
  #bindEvents() {
    $('#btn-abrir-caixa').on('click',      () => this.#abrirCaixa());
    $('#btn-fechar-caixa').on('click',     () => this.#confirmarFechamento());
    $('#btn-confirmar-fechar').on('click', () => this.#fecharCaixa());

    $('#btn-filtrar').on('click', () => { this.#page = 1; this.#loadHistorico(); });
    $('#btn-limpar').on('click',  () => {
      $('#filtro-data-inicio, #filtro-data-fim, #filtro-operador').val('');
      this.#page = 1;
      this.#loadHistorico();
    });
  }

  /* ─── Estado do caixa ────────────────────────────────────────── */
  async #verificarEstado() {
    $('#caixa-loading').removeClass('d-none');
    $('#caixa-fechado, #caixa-aberto').addClass('d-none');
    try {
      const resp = await this.#service.getSessaoAtual();
      this.#sessaoAtual = resp;
      this.#mostrarAberto();
    } catch (err) {
      this.#mostrarFechado();
    } finally {
      $('#caixa-loading').addClass('d-none');
    }
  }

  #mostrarFechado() {
    $('#caixa-fechado').removeClass('d-none');
    $('#caixa-aberto').addClass('d-none');
    this.#loadHistorico();
  }

  #mostrarAberto() {
    $('#caixa-fechado').addClass('d-none');
    $('#caixa-aberto').removeClass('d-none');
    const s          = this.#sessaoAtual;
    const operador   = s?.operadorAbertura ?? '—';
    const dtAbertura = s?.dataAbertura
      ? new Date(s.dataAbertura).toLocaleString('pt-BR')
      : '—';
    $('#caixa-aberto-info').text(`Aberto em ${dtAbertura} por ${operador}`);
    this.#loadResumo();
    this.#loadHistorico();
  }

  /* ─── Resumo financeiro ──────────────────────────────────────── */
  async #loadResumo() {
    try {
      const r = await this.#service.getResumo(this.#sessaoAtual?.id);
      $('#caixa-saldo').text(this.#brl(r.saldoAtual ?? 0));
      $('#caixa-entradas').text(this.#brl(r.totalEntradas ?? 0));
      $('#caixa-saidas').text(this.#brl(r.totalSaidas ?? 0));
      $('#caixa-vendas').text(r.qtdVendas ?? 0);
    } catch { /* resumo não-crítico, falha silenciosa */ }
  }

  /* ─── Abertura ───────────────────────────────────────────────── */
  async #abrirCaixa() {
    const valorStr    = $('#abertura-valor').val();
    const valorInicial = this.#parseBrl(valorStr);
    const obs          = $('#abertura-obs').val().trim();
    const user         = this.#session.getUser();

    if (valorInicial <= 0) {
      this.#toast.warning('Campo obrigatório', 'Informe um valor inicial maior que zero.');
      return;
    }

    const btn = $('#btn-abrir-caixa');
    btn.prop('disabled', true)
       .html('<span class="spinner-border spinner-border-sm me-1"></span> Abrindo...');
    try {
      const resp = await this.#service.abrir({
        valorInicial,
        observacoes:      obs,
        operadorAbertura: user.nome,
      });
      this.#sessaoAtual = resp;
      this.#toast.success('Caixa aberto!', `Valor inicial: ${this.#brl(valorInicial)}`);
      this.#mostrarAberto();
    } catch (err) {
      this.#toast.error('Erro ao abrir', err.message || 'Não foi possível abrir o caixa.');
    } finally {
      btn.prop('disabled', false).html('<i class="bi bi-unlock me-2"></i>Abrir Caixa');
    }
  }

  /* ─── Confirmação de fechamento (modal) ──────────────────────── */
  async #confirmarFechamento() {
    let resumoHtml = '<p class="text-muted mb-0"><span class="spinner-border spinner-border-sm me-1"></span> Calculando resumo...</p>';
    try {
      const r = await this.#service.getResumo(this.#sessaoAtual?.id);
      resumoHtml = `
        <div class="mb-3">
          <div class="d-flex justify-content-between py-1 border-bottom">
            <span class="text-muted">Valor Inicial</span>
            <span>${this.#brl(r.valorInicial ?? 0)}</span>
          </div>
          <div class="d-flex justify-content-between py-1 border-bottom text-success">
            <span>Total Entradas</span>
            <span>+ ${this.#brl(r.totalEntradas ?? 0)}</span>
          </div>
          <div class="d-flex justify-content-between py-1 border-bottom text-danger">
            <span>Total Saídas</span>
            <span>− ${this.#brl(r.totalSaidas ?? 0)}</span>
          </div>
          <div class="d-flex justify-content-between py-1 fw-bold fs-6">
            <span>Saldo Esperado</span>
            <span>${this.#brl(r.saldoAtual ?? 0)}</span>
          </div>
        </div>`;
    } catch { /* resumo opcional */ }

    $('#fechar-resumo').html(resumoHtml);
    $('#fechar-valor-contado').val('');
    $('#fechar-obs').val('');
    new bootstrap.Modal(document.getElementById('modal-fechar-caixa')).show();
  }

  /* ─── Fechamento ─────────────────────────────────────────────── */
  async #fecharCaixa() {
    const valorContado = this.#parseBrl($('#fechar-valor-contado').val());
    const obs          = $('#fechar-obs').val().trim();

    const btn = $('#btn-confirmar-fechar');
    btn.prop('disabled', true)
       .html('<span class="spinner-border spinner-border-sm me-1"></span>');
    try {
      await this.#service.fechar({
        sessaoId:    this.#sessaoAtual?.id,
        valorContado,
        observacoes: obs,
      });
      this.#toast.success('Caixa fechado!', 'Fechamento registrado com sucesso.');
      bootstrap.Modal.getInstance(document.getElementById('modal-fechar-caixa'))?.hide();
      this.#sessaoAtual = null;
      this.#mostrarFechado();
    } catch (err) {
      this.#toast.error('Erro ao fechar', err.message || 'Não foi possível fechar o caixa.');
    } finally {
      btn.prop('disabled', false)
         .html('<i class="bi bi-lock me-1"></i> Fechar Caixa');
    }
  }

  /* ─── Histórico de sessões ───────────────────────────────────── */
  async #loadHistorico() {
    $('#tbody-historico').html(`
      <tr>
        <td colspan="7" class="text-center py-4 text-muted">
          <span class="spinner-border spinner-border-sm me-2"></span>Carregando...
        </td>
      </tr>`);
    try {
      const filtros = {
        dataInicio: $('#filtro-data-inicio').val() || null,
        dataFim:    $('#filtro-data-fim').val()    || null,
        operador:   $('#filtro-operador').val().trim() || null,
      };

      const lista = await this.#service.getHistorico(filtros);
      this.#totalPages = Math.ceil(lista.length / this.#perPage) || 1;
      const paginado   = lista.slice((this.#page - 1) * this.#perPage, this.#page * this.#perPage);

      if (!paginado.length) {
        $('#tbody-historico').html(`
          <tr>
            <td colspan="7" class="text-center py-4 text-muted">
              <i class="bi bi-inbox me-1"></i>Nenhum registro encontrado.
            </td>
          </tr>`);
        $('#info-historico').text('0 registros');
        $('#paginacao-historico').empty();
        return;
      }

      $('#tbody-historico').html(paginado.map(s => {
        const dtAb = new Date(s.dataAbertura).toLocaleString('pt-BR');
        const dtFe = s.dataFechamento
          ? new Date(s.dataFechamento).toLocaleString('pt-BR')
          : '—';
        const badge = s.status === 'ABERTO'
          ? '<span class="badge bg-success">Aberto</span>'
          : '<span class="badge bg-secondary">Fechado</span>';
        return `
          <tr>
            <td>${this.#esc(s.operadorAbertura ?? '—')}</td>
            <td>${dtAb}</td>
            <td>${dtFe}</td>
            <td>${this.#brl(s.valorInicial ?? 0)}</td>
            <td class="text-success fw-medium">+ ${this.#brl(s.totalEntradas ?? 0)}</td>
            <td class="text-danger fw-medium">− ${this.#brl(s.totalSaidas ?? 0)}</td>
            <td>${badge}</td>
          </tr>`;
      }).join(''));

      $('#info-historico').text(`${lista.length} registro${lista.length !== 1 ? 's' : ''}`);
      this.#renderPag(lista.length);
    } catch (err) {
      this.#toast.error('Erro', err.message || 'Erro ao carregar histórico.');
    }
  }

  #renderPag(total) {
    const ul = $('#paginacao-historico');
    ul.empty();
    if (this.#totalPages <= 1) return;
    if (this.#page > 1)
      ul.append(`<li class="page-item"><button class="page-link" id="pp-hist">&laquo;</button></li>`);
    for (let i = Math.max(1, this.#page - 2); i <= Math.min(this.#totalPages, this.#page + 2); i++)
      ul.append(`<li class="page-item ${i === this.#page ? 'active' : ''}">
        <button class="page-link pn-hist" data-page="${i}">${i}</button></li>`);
    if (this.#page < this.#totalPages)
      ul.append(`<li class="page-item"><button class="page-link" id="pnext-hist">&raquo;</button></li>`);

    $('#pp-hist').on('click',   () => { this.#page--; this.#loadHistorico(); });
    $('#pnext-hist').on('click',() => { this.#page++; this.#loadHistorico(); });
    $('.pn-hist[data-page]').on('click', e => {
      this.#page = +$(e.currentTarget).data('page');
      this.#loadHistorico();
    });
  }

  /* ─── Utilitários ────────────────────────────────────────────── */
  #brl(v)     { return Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  #parseBrl(v){ if (!v) return 0; return parseFloat(String(v).replace(/[^\d,]/g, '').replace(',', '.')) || 0; }
  #esc(v)     { return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
}
