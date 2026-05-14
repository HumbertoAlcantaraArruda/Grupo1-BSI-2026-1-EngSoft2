/**
 * MovimentacoesController — Reforços (suprimentos) e Sangrias de Caixa.
 *
 * GRASP Controller  : coordena eventos e operações da tela de Movimentações.
 * SOLID SRP         : responsável apenas pela View de Movimentações de Caixa.
 * MVC Control       : camada de controle da Tela 2 — Movimentações de Caixa.
 * Low Coupling      : depende apenas de MovimentacoesService, AberturaService, SessionManager e Toast.
 * High Cohesion     : todos os métodos operam exclusivamente sobre esta tela.
 */
class MovimentacoesController {
  #movService;
  #abrService;
  #session;
  #toast;
  #sessaoAtual = null;
  #page = 1; #perPage = 15; #totalPages = 1;

  constructor() {
    this.#movService = MovimentacoesService.getInstance();
    this.#abrService = AberturaService.getInstance();
    this.#session    = SessionManager.getInstance();
    this.#toast      = Toast.getInstance();
  }

  async init() {
    Mask.applyTo(document.getElementById('movimento-valor'), 'currency');
    this.#bindEvents();
    await this.#inicializar();
  }

  /* ─── Eventos ────────────────────────────────────────────────── */
  #bindEvents() {
    // Botões de tipo (Reforço / Sangria) — atualiza formulário
    $('#btn-tipo-entrada').on('click', () => this.#selecionarTipo('ENTRADA'));
    $('#btn-tipo-saida').on('click',   () => this.#selecionarTipo('SAIDA'));

    $('#btn-registrar').on('click', () => this.#abrirConfirmacao());
    $('#btn-confirmar-movimento').on('click', () => this.#registrarMovimento());

    $('#btn-filtrar').on('click', () => { this.#page = 1; this.#loadMovimentos(); });
    $('#btn-limpar').on('click',  () => {
      $('#filtro-tipo, #filtro-operador, #filtro-data-inicio, #filtro-data-fim').val('');
      this.#page = 1;
      this.#loadMovimentos();
    });
  }

  /* ─── Inicialização ──────────────────────────────────────────── */
  async #inicializar() {
    this.#sessaoAtual = this.#abrService.getSessaoAtualSync();
    this.#atualizarStatusBanner();
    await this.#loadResumo();
    await this.#loadMovimentos();
  }

  /* ─── Banner de status do caixa ──────────────────────────────── */
  #atualizarStatusBanner() {
    const $banner = $('#status-caixa-banner');
    const $aviso  = $('#aviso-caixa-fechado');
    if (this.#sessaoAtual) {
      $banner.removeClass('d-none');
      $aviso.addClass('d-none');
      const dt = new Date(this.#sessaoAtual.dataAbertura).toLocaleString('pt-BR');
      $('#status-caixa-info').text(`Aberto em ${dt} por ${this.#sessaoAtual.operadorAbertura}`);
    } else {
      $banner.addClass('d-none');
      $aviso.removeClass('d-none');
    }
  }

  /* ─── Cards de resumo ────────────────────────────────────────── */
  async #loadResumo() {
    const sessaoId = this.#sessaoAtual?.id ?? null;

    // Saldo vem do AberturaService
    if (this.#sessaoAtual) {
      try {
        const r = await this.#abrService.getResumo(sessaoId);
        $('#card-saldo').text(this.#brl(r.saldoAtual ?? 0));
      } catch { $('#card-saldo').text('—'); }
    } else {
      $('#card-saldo').text('—');
    }

    // Reforços e sangrias da sessão atual
    if (sessaoId) {
      try {
        const r = await this.#movService.getResumo(sessaoId);
        $('#card-reforcos').text(this.#brl(r.totalEntradas ?? 0));
        $('#card-sangrias').text(this.#brl(r.totalSaidas ?? 0));
        $('#qtd-reforcos').text(r.qtdEntradas ?? 0);
        $('#qtd-sangrias').text(r.qtdSaidas ?? 0);
      } catch {
        $('#card-reforcos, #card-sangrias').text('—');
      }
    } else {
      $('#card-reforcos, #card-sangrias').text('—');
      $('#qtd-reforcos, #qtd-sangrias').text('0');
    }
  }

  /* ─── Seleção de tipo (Reforço/Sangria) ──────────────────────── */
  #selecionarTipo(tipo) {
    $('#movimento-tipo').val(tipo);

    if (tipo === 'ENTRADA') {
      $('#btn-tipo-entrada').removeClass('btn-outline-success').addClass('btn-success');
      $('#btn-tipo-saida').removeClass('btn-danger').addClass('btn-outline-danger');
    } else {
      $('#btn-tipo-saida').removeClass('btn-outline-danger').addClass('btn-danger');
      $('#btn-tipo-entrada').removeClass('btn-success').addClass('btn-outline-success');
    }
  }

  /* ─── Abertura do modal de confirmação ───────────────────────── */
  #abrirConfirmacao() {
    const tipo      = $('#movimento-tipo').val();
    const valorStr  = $('#movimento-valor').val();
    const descricao = $('#movimento-descricao').val().trim();
    const valor     = this.#parseBrl(valorStr);

    if (!tipo) {
      this.#toast.warning('Selecione o tipo', 'Escolha Reforço ou Sangria antes de continuar.');
      return;
    }
    if (valor <= 0) {
      this.#toast.warning('Valor inválido', 'Informe um valor maior que zero.');
      return;
    }
    if (!descricao) {
      this.#toast.warning('Campo obrigatório', 'Informe a descrição/motivo do movimento.');
      return;
    }
    if (!this.#sessaoAtual) {
      this.#toast.error('Caixa fechado', 'Não é possível registrar movimentação sem um caixa aberto.');
      return;
    }

    const tipoLabel = tipo === 'ENTRADA' ? 'Reforço (Suprimento)' : 'Sangria';
    $('#confirm-tipo').text(tipoLabel);
    $('#confirm-valor').text(this.#brl(valor));
    $('#confirm-descricao').text(descricao);

    const headerBg = tipo === 'ENTRADA'
      ? 'var(--color-success)'
      : 'var(--color-danger)';
    $('#modal-confirmar-mov .modal-header').css({ background: headerBg, color: '#fff' });
    $('#modal-confirmar-mov .btn-close').addClass('btn-close-white');

    new bootstrap.Modal(document.getElementById('modal-confirmar-mov')).show();
  }

  /* ─── Registro efetivo do movimento ─────────────────────────── */
  async #registrarMovimento() {
    const tipo      = $('#movimento-tipo').val();
    const valorStr  = $('#movimento-valor').val();
    const descricao = $('#movimento-descricao').val().trim();
    const valor     = this.#parseBrl(valorStr);
    const user      = this.#session.getUser();

    const btn = $('#btn-confirmar-movimento');
    btn.prop('disabled', true)
       .html('<span class="spinner-border spinner-border-sm me-1"></span>');
    try {
      await this.#movService.registrar({
        tipo, valor, descricao,
        operador: user.nome,
      });
      const label = tipo === 'ENTRADA' ? 'Reforço' : 'Sangria';
      this.#toast.success(`${label} registrado!`, `${this.#brl(valor)} lançado com sucesso.`);
      bootstrap.Modal.getInstance(document.getElementById('modal-confirmar-mov'))?.hide();

      // Limpa formulário
      $('#movimento-valor').val('');
      $('#movimento-descricao').val('');
      $('#movimento-tipo').val('');
      $('#btn-tipo-entrada').removeClass('btn-success').addClass('btn-outline-success');
      $('#btn-tipo-saida').removeClass('btn-danger').addClass('btn-outline-danger');

      // Atualiza sessão e UI
      this.#sessaoAtual = this.#abrService.getSessaoAtualSync();
      await this.#loadResumo();
      this.#page = 1;
      await this.#loadMovimentos();
    } catch (err) {
      this.#toast.error('Erro ao registrar', err.message || 'Não foi possível registrar o movimento.');
    } finally {
      btn.prop('disabled', false).html('<i class="bi bi-check-lg me-1"></i> Confirmar');
    }
  }

  /* ─── Tabela de movimentos ───────────────────────────────────── */
  async #loadMovimentos() {
    $('#tbody-movimentos').html(`
      <tr>
        <td colspan="5" class="text-center py-4 text-muted">
          <span class="spinner-border spinner-border-sm me-2"></span>Carregando...
        </td>
      </tr>`);
    try {
      const filtros = {
        sessaoId:   this.#sessaoAtual?.id ?? undefined,
        tipo:       $('#filtro-tipo').val()       || null,
        operador:   $('#filtro-operador').val().trim() || null,
        dataInicio: $('#filtro-data-inicio').val() || null,
        dataFim:    $('#filtro-data-fim').val()    || null,
      };

      // Sem filtro de sessão: mostra todos os históricos
      if (filtros.sessaoId === undefined) delete filtros.sessaoId;

      const lista = await this.#movService.getMovimentacoes(filtros);
      this.#totalPages = Math.ceil(lista.length / this.#perPage) || 1;
      const paginado   = lista.slice((this.#page - 1) * this.#perPage, this.#page * this.#perPage);

      if (!paginado.length) {
        $('#tbody-movimentos').html(`
          <tr>
            <td colspan="5" class="text-center py-4 text-muted">
              <i class="bi bi-inbox me-1"></i>Nenhuma movimentação encontrada.
            </td>
          </tr>`);
        $('#info-movimentos').text('0 movimentos');
        $('#paginacao-mov').empty();
        return;
      }

      $('#tbody-movimentos').html(paginado.map(m => {
        const isEntrada  = m.tipo === 'ENTRADA';
        const badgeCls   = isEntrada ? 'bg-success' : 'bg-danger';
        const badgeLabel = isEntrada ? 'Reforço' : 'Sangria';
        const valorCls   = isEntrada ? 'text-success' : 'text-danger';
        const sinal      = isEntrada ? '+' : '−';
        return `
          <tr>
            <td>${new Date(m.dataHora).toLocaleString('pt-BR')}</td>
            <td>${this.#esc(m.operador ?? '—')}</td>
            <td><span class="badge ${badgeCls}">${badgeLabel}</span></td>
            <td>${this.#esc(m.descricao ?? '—')}</td>
            <td class="${valorCls} fw-medium text-end">
              ${sinal} ${this.#brl(m.valor ?? 0)}
            </td>
          </tr>`;
      }).join(''));

      const total = lista.length;
      $('#info-movimentos').text(`${total} movimento${total !== 1 ? 's' : ''}`);
      this.#renderPag(total);
    } catch (err) {
      this.#toast.error('Erro', err.message || 'Erro ao carregar movimentações.');
    }
  }

  #renderPag(total) {
    const ul = $('#paginacao-mov');
    ul.empty();
    if (this.#totalPages <= 1) return;
    if (this.#page > 1)
      ul.append(`<li class="page-item"><button class="page-link" id="pp-mov">&laquo;</button></li>`);
    for (let i = Math.max(1, this.#page - 2); i <= Math.min(this.#totalPages, this.#page + 2); i++)
      ul.append(`<li class="page-item ${i === this.#page ? 'active' : ''}">
        <button class="page-link pn-mov" data-page="${i}">${i}</button></li>`);
    if (this.#page < this.#totalPages)
      ul.append(`<li class="page-item"><button class="page-link" id="pnext-mov">&raquo;</button></li>`);

    $('#pp-mov').on('click',    () => { this.#page--; this.#loadMovimentos(); });
    $('#pnext-mov').on('click', () => { this.#page++; this.#loadMovimentos(); });
    $('.pn-mov[data-page]').on('click', e => {
      this.#page = +$(e.currentTarget).data('page');
      this.#loadMovimentos();
    });
  }

  /* ─── Utilitários ────────────────────────────────────────────── */
  #brl(v)     { return Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  #parseBrl(v){ if (!v) return 0; return parseFloat(String(v).replace(/[^\d,]/g, '').replace(',', '.')) || 0; }
  #esc(v)     { return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
}
