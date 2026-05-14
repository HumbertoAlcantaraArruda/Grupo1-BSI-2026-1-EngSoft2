/**
 * CaixaController — Operação de caixa (abertura, movimentos, fechamento).
 */
class CaixaController {
  #api; #session;
  #sessaoAtual = null;
  #page = 1; #perPage = 20; #totalPages = 1;

  constructor() {
    this.#api     = ApiService.getInstance();
    this.#session = SessionManager.getInstance();
  }

  async init() {
    if (!this.#session.hasRole('COLABORADOR')) {
      Toast.show('Acesso não autorizado.', 'error');
      setTimeout(() => window.location.replace('../dashboard.html'), 1500);
      return;
    }
    Mask.applyTo(document.getElementById('abertura-valor'),      'currency');
    Mask.applyTo(document.getElementById('movimento-valor'),     'currency');
    Mask.applyTo(document.getElementById('fechar-valor-contado'),'currency');

    this.#bindEvents();
    await this.#verificarEstado();
  }

  #bindEvents() {
    $('#btn-abrir-caixa').on('click',        () => this.#abrirCaixa());
    $('#btn-fechar-caixa').on('click',       () => this.#confirmarFechamento());
    $('#btn-suprimento').on('click',         () => this.#abrirMovimento('ENTRADA','Suprimento'));
    $('#btn-sangria').on('click',            () => this.#abrirMovimento('SAIDA','Sangria'));
    $('#btn-confirmar-movimento').on('click',() => this.#registrarMovimento());
    $('#btn-confirmar-fechar').on('click',   () => this.#fecharCaixa());
    $('#filtro-tipo-mov').on('change',       () => { this.#page = 1; this.#loadMovimentos(); });
  }

  // ── Estado ────────────────────────────────────────────────
  async #verificarEstado() {
    $('#caixa-loading').removeClass('d-none');
    $('#caixa-fechado, #caixa-aberto').addClass('d-none');
    try {
      const resp = await this.#api.get('/caixa/sessao-atual');
      this.#sessaoAtual = resp;
      this.#mostrarAberto();
    } catch (err) {
      if (err.status === 404 || err.message?.toLowerCase().includes('fechado')) {
        this.#mostrarFechado();
      } else {
        Toast.show(err.message || 'Erro ao verificar estado do caixa.', 'error');
        this.#mostrarFechado();
      }
    } finally {
      $('#caixa-loading').addClass('d-none');
    }
  }

  #mostrarFechado() {
    $('#caixa-fechado').removeClass('d-none');
    $('#caixa-aberto').addClass('d-none');
    $('#topbar-status-badge')
      .removeClass('d-none bg-success')
      .addClass('bg-secondary')
      .html('<i class="bi bi-lock me-1"></i> Caixa fechado');
  }

  #mostrarAberto() {
    $('#caixa-fechado').addClass('d-none');
    $('#caixa-aberto').removeClass('d-none');
    const s = this.#sessaoAtual;
    const operador  = s?.operadorAbertura ?? '—';
    const dtAbertura = s?.dataAbertura ? new Date(s.dataAbertura).toLocaleString('pt-BR') : '—';
    $('#caixa-aberto-info').text(`Aberto em ${dtAbertura} por ${operador}`);
    $('#topbar-status-badge')
      .removeClass('d-none bg-secondary')
      .addClass('bg-success')
      .html('<i class="bi bi-unlock me-1"></i> Caixa aberto');
    this.#loadResumo();
    this.#loadMovimentos();
  }

  // ── Resumo ────────────────────────────────────────────────
  async #loadResumo() {
    try {
      const s = this.#sessaoAtual;
      if (!s) return;
      const resp = await this.#api.get(`/caixa/resumo?sessaoId=${s.id}`);
      $('#caixa-saldo').text(this.#brl(resp.saldoAtual ?? 0));
      $('#caixa-entradas').text(this.#brl(resp.totalEntradas ?? 0));
      $('#caixa-saidas').text(this.#brl(resp.totalSaidas ?? 0));
      $('#caixa-vendas').text(resp.qtdVendas ?? 0);
    } catch { /* silencioso — resumo não é crítico */ }
  }

  // ── Abertura ──────────────────────────────────────────────
  async #abrirCaixa() {
    const valorStr = $('#abertura-valor').val();
    const valorInicial = this.#parseBrl(valorStr);
    const obs      = $('#abertura-obs').val().trim();
    const btn = $('#btn-abrir-caixa');
    btn.prop('disabled',true).html('<div class="spinner-border spinner-border-sm me-1"></div> Abrindo...');
    try {
      const resp = await this.#api.post('/caixa/abrir', { valorInicial, observacoes: obs });
      this.#sessaoAtual = resp;
      Toast.show('Caixa aberto com sucesso!', 'success');
      this.#mostrarAberto();
    } catch (err) {
      Toast.show(err.message || 'Erro ao abrir o caixa.', 'error');
    } finally {
      btn.prop('disabled',false).html('<i class="bi bi-unlock me-2"></i>Abrir Caixa');
    }
  }

  // ── Movimentos ────────────────────────────────────────────
  async #loadMovimentos() {
    $('#tbody-movimentos').html(`<tr><td colspan="5" class="text-center py-4 text-muted">
      <div class="spinner-border spinner-border-sm me-2"></div>Carregando...
    </td></tr>`);
    try {
      const p = new URLSearchParams({ page: this.#page - 1, size: this.#perPage });
      if (this.#sessaoAtual?.id) p.set('sessaoId', this.#sessaoAtual.id);
      const tipo = $('#filtro-tipo-mov').val();
      if (tipo) p.set('tipo', tipo);

      const resp = await this.#api.get(`/caixa/movimentos?${p}`);
      const lista = resp.content ?? (Array.isArray(resp) ? resp : []);
      this.#totalPages = resp.totalPages ?? 1;

      if (!lista.length) {
        $('#tbody-movimentos').html(`<tr><td colspan="5" class="text-center py-4 text-muted">
          <i class="bi bi-inbox me-1"></i>Nenhum movimento registrado.
        </td></tr>`);
        $('#info-movimentos').text('0 movimentos');
        return;
      }

      $('#tbody-movimentos').html(lista.map(m => {
        const isEntrada = ['ENTRADA','ABERTURA'].includes(m.tipo);
        const clsTipo   = { ABERTURA:'bg-secondary', ENTRADA:'bg-success', SAIDA:'bg-danger', FECHAMENTO:'bg-secondary' }[m.tipo] ?? 'bg-secondary';
        return `
          <tr>
            <td>${new Date(m.dataHora).toLocaleString('pt-BR')}</td>
            <td><span class="badge ${clsTipo}">${m.tipo}</span></td>
            <td>${this.#esc(m.descricao ?? '—')}</td>
            <td class="text-center"><small class="text-muted">${this.#esc(m.operador ?? '—')}</small></td>
            <td class="text-end fw-medium ${isEntrada ? 'text-success' : m.tipo==='SAIDA' ? 'text-danger' : ''}">
              ${isEntrada ? '+' : m.tipo==='SAIDA' ? '−' : ''}${this.#brl(m.valor ?? 0)}
            </td>
          </tr>
        `;
      }).join(''));

      const total = resp.totalElements ?? lista.length;
      $('#info-movimentos').text(`${total} movimento${total!==1?'s':''}`);
      this.#renderPag(total);
    } catch (err) {
      Toast.show(err.message || 'Erro ao carregar movimentos.', 'error');
    }
  }

  #renderPag(total) {
    const ul = $('#paginacao-mov'); ul.empty();
    if (this.#totalPages <= 1) return;
    if (this.#page > 1) ul.append(`<li class="page-item"><button class="page-link" id="pp">&laquo;</button></li>`);
    for (let i=Math.max(1,this.#page-2); i<=Math.min(this.#totalPages,this.#page+2); i++)
      ul.append(`<li class="page-item ${i===this.#page?'active':''}"><button class="page-link pn" data-page="${i}">${i}</button></li>`);
    if (this.#page<this.#totalPages) ul.append(`<li class="page-item"><button class="page-link" id="pnext">&raquo;</button></li>`);
    $('#pp').on('click',()=>{this.#page--;this.#loadMovimentos();}); $('#pnext').on('click',()=>{this.#page++;this.#loadMovimentos();});
    $('.pn[data-page]').on('click',e=>{this.#page=+$(e.currentTarget).data('page');this.#loadMovimentos();});
  }

  // ── Suprimento / Sangria ─────────────────────────────────
  #abrirMovimento(tipo, label) {
    const form = document.getElementById('form-movimento');
    form.reset(); form.classList.remove('was-validated');
    $('#movimento-tipo').val(tipo);
    $('#modal-movimento-title').text(label);
    const headerColor = tipo === 'ENTRADA' ? 'var(--color-success)' : 'var(--color-danger)';
    $('#modal-movimento-header').css({ background: headerColor, color: '#fff' });
    new bootstrap.Modal(document.getElementById('modal-movimento')).show();
  }

  async #registrarMovimento() {
    const form = document.getElementById('form-movimento');
    form.classList.add('was-validated');
    if (!form.checkValidity()) { Toast.show('Preencha os campos obrigatórios.', 'warning'); return; }

    const payload = {
      sessaoId:   this.#sessaoAtual?.id,
      tipo:       $('#movimento-tipo').val(),
      valor:      this.#parseBrl($('#movimento-valor').val()),
      descricao:  $('#movimento-descricao').val().trim(),
    };
    if (payload.valor <= 0) { Toast.show('Informe um valor maior que zero.', 'warning'); return; }

    const btn = $('#btn-confirmar-movimento');
    btn.prop('disabled',true).html('<div class="spinner-border spinner-border-sm me-1"></div>');
    try {
      await this.#api.post('/caixa/movimento', payload);
      Toast.show(`${payload.tipo === 'ENTRADA' ? 'Suprimento' : 'Sangria'} registrado!`, 'success');
      bootstrap.Modal.getInstance(document.getElementById('modal-movimento'))?.hide();
      await this.#loadResumo();
      await this.#loadMovimentos();
    } catch (err) { Toast.show(err.message || 'Erro ao registrar.', 'error'); }
    finally { btn.prop('disabled',false).html('<i class="bi bi-check-lg me-1"></i> Registrar'); }
  }

  // ── Fechar Caixa ──────────────────────────────────────────
  async #confirmarFechamento() {
    // Carrega resumo para exibir no modal
    let resumoHtml = '<div class="text-muted" style="font-size:13px;">Calculando resumo...</div>';
    try {
      const r = await this.#api.get(`/caixa/resumo?sessaoId=${this.#sessaoAtual?.id}`);
      resumoHtml = `
        <div class="table-sm mb-3">
          <div class="d-flex justify-content-between py-1 border-bottom">
            <span>Valor Inicial</span><span>${this.#brl(r.valorInicial ?? 0)}</span>
          </div>
          <div class="d-flex justify-content-between py-1 border-bottom text-success">
            <span>Total Entradas</span><span>+ ${this.#brl(r.totalEntradas ?? 0)}</span>
          </div>
          <div class="d-flex justify-content-between py-1 border-bottom text-danger">
            <span>Total Saídas</span><span>− ${this.#brl(r.totalSaidas ?? 0)}</span>
          </div>
          <div class="d-flex justify-content-between py-1 fw-bold">
            <span>Saldo Esperado</span><span>${this.#brl(r.saldoAtual ?? 0)}</span>
          </div>
        </div>
      `;
    } catch { /* resumo opcional */ }

    $('#fechar-resumo').html(resumoHtml);
    document.getElementById('form-movimento')?.reset();
    new bootstrap.Modal(document.getElementById('modal-fechar-caixa')).show();
  }

  async #fecharCaixa() {
    const valorContado = this.#parseBrl($('#fechar-valor-contado').val());
    const obs = $('#fechar-obs').val().trim();

    const btn = $('#btn-confirmar-fechar');
    btn.prop('disabled',true).html('<div class="spinner-border spinner-border-sm me-1"></div>');
    try {
      await this.#api.post('/caixa/fechar', {
        sessaoId:     this.#sessaoAtual?.id,
        valorContado,
        observacoes:  obs,
      });
      Toast.show('Caixa fechado com sucesso!', 'success');
      bootstrap.Modal.getInstance(document.getElementById('modal-fechar-caixa'))?.hide();
      this.#sessaoAtual = null;
      this.#mostrarFechado();
    } catch (err) { Toast.show(err.message || 'Erro ao fechar caixa.', 'error'); }
    finally { btn.prop('disabled',false).html('<i class="bi bi-lock me-1"></i> Fechar Caixa'); }
  }

  #brl(v) { return Number(v??0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
  #parseBrl(v) { if(!v)return 0; return parseFloat(String(v).replace(/[^\d,]/g,'').replace(',','.'))||0; }
  #esc(v) { return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
}
