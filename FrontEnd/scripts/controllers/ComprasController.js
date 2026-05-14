/**
 * ComprasController — Pedidos de Compra com itens dinâmicos.
 */
class ComprasController {
  #api; #session;
  #compras     = [];
  #produtos    = [];
  #fornecedores= [];
  #itens       = [];   // itens do pedido em edição
  #currentId   = null;
  #page = 1; #perPage = 15; #totalPages = 1;
  #filters = {};

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
    this.#bindEvents();
    await Promise.all([this.#load(), this.#loadFornecedores(), this.#loadProdutos()]);
  }

  #bindEvents() {
    $('#btn-filtrar').on('click',          () => this.#applyFilters());
    $('#btn-limpar').on('click',           () => this.#clearFilters());
    $('#filtro-fornecedor').on('keydown',  e  => { if (e.key==='Enter') this.#applyFilters(); });
    $('#btn-nova-compra').on('click',      () => this.#openModal(null));
    $('#btn-salvar-compra').on('click',    () => this.#save());
    $('#btn-add-item-compra').on('click',  () => this.#addItemRow());
    $('#btn-cancelar-compra').on('click',  () => this.#confirmCancel());
  }

  // ── Carregamento ──────────────────────────────────────────
  async #load() {
    $('#tbody-compras').html(this.#loadingRow(7));
    try {
      const p = new URLSearchParams({ page: this.#page-1, size: this.#perPage });
      if (this.#filters.fornecedor) p.set('fornecedor', this.#filters.fornecedor);
      if (this.#filters.dataIni)    p.set('dataInicio',  this.#filters.dataIni);
      if (this.#filters.dataFim)    p.set('dataFim',     this.#filters.dataFim);
      if (this.#filters.status)     p.set('status',      this.#filters.status);

      const resp = await this.#api.get(`/compras?${p}`);
      this.#compras    = resp.content ?? (Array.isArray(resp) ? resp : []);
      this.#totalPages = resp.totalPages ?? 1;
      this.#renderTable();
      this.#renderPag(resp.totalElements ?? this.#compras.length);
    } catch (err) {
      Toast.show(err.message || 'Erro ao carregar compras.', 'error');
      $('#tbody-compras').html(this.#errorRow(7));
    }
  }

  async #loadFornecedores() {
    try {
      const resp = await this.#api.get('/fornecedores?status=true&size=200');
      this.#fornecedores = resp.content ?? (Array.isArray(resp) ? resp : []);
      const sel = $('#compra-fornecedor');
      this.#fornecedores.forEach(f => sel.append(`<option value="${f.id}">${this.#esc(f.nome)}</option>`));
    } catch { /* silencioso */ }
  }

  async #loadProdutos() {
    try {
      const resp = await this.#api.get('/produtos?status=true&size=500');
      this.#produtos = resp.content ?? (Array.isArray(resp) ? resp : []);
    } catch { /* silencioso */ }
  }

  // ── Tabela ────────────────────────────────────────────────
  #renderTable() {
    const tbody = $('#tbody-compras');
    if (!this.#compras.length) {
      tbody.html(`<tr><td colspan="7" class="text-center py-5 text-muted">
        <i class="bi bi-bag-plus fs-3 d-block mb-2"></i>Nenhuma compra encontrada.
      </td></tr>`);
      $('#info-registros').text('0 registros'); return;
    }
    const stCls = { PENDENTE:'bg-warning', RECEBIDA:'bg-success', CANCELADA:'bg-danger' };
    tbody.html(this.#compras.map(c => `
      <tr>
        <td><small class="text-muted">${c.id}</small></td>
        <td class="fw-medium">${this.#esc(c.nomeFornecedor ?? '—')}</td>
        <td>${this.#fmtDate(c.dataCompra)}</td>
        <td><small class="text-muted">${c.qtdItens ?? 0} item${(c.qtdItens ?? 0)!==1?'s':''}</small></td>
        <td class="text-center"><span class="badge ${stCls[c.status] ?? 'bg-secondary'}">${c.status}</span></td>
        <td class="text-end fw-medium" style="color:var(--color-structural)">${this.#brl(c.total ?? 0)}</td>
        <td class="text-center">
          <div class="d-flex gap-1 justify-content-center">
            <button class="btn btn-sm btn-outline-primary btn-editar py-0 px-2" data-id="${c.id}" title="Ver / Editar">
              <i class="bi bi-eye"></i>
            </button>
            ${c.status === 'PENDENTE'
              ? `<button class="btn btn-sm btn-outline-success btn-receber py-0 px-2" data-id="${c.id}" title="Marcar como Recebida">
                  <i class="bi bi-check-lg"></i>
                </button>`
              : ''
            }
          </div>
        </td>
      </tr>
    `).join(''));

    $('#tbody-compras .btn-editar').on('click', ev => this.#openModal($(ev.currentTarget).data('id')));
    $('#tbody-compras .btn-receber').on('click', async ev => {
      const id = $(ev.currentTarget).data('id');
      if (!confirm('Marcar este pedido como RECEBIDO? O estoque dos produtos será atualizado.')) return;
      try {
        await this.#api.put(`/compras/${id}/receber`, {});
        Toast.show('Pedido marcado como recebido. Estoque atualizado!', 'success');
        await this.#load();
      } catch (err) { Toast.show(err.message || 'Erro ao receber pedido.', 'error'); }
    });

    const t = this.#compras.length;
    $('#info-registros').text(`${t} pedido${t!==1?'s':''}`);
  }

  #renderPag(total) {
    const ul = $('#paginacao'); ul.empty();
    if (this.#totalPages <= 1) return;
    if (this.#page > 1) ul.append(`<li class="page-item"><button class="page-link" id="pp">&laquo;</button></li>`);
    for (let i=Math.max(1,this.#page-2); i<=Math.min(this.#totalPages,this.#page+2); i++)
      ul.append(`<li class="page-item ${i===this.#page?'active':''}"><button class="page-link pn" data-page="${i}">${i}</button></li>`);
    if (this.#page<this.#totalPages) ul.append(`<li class="page-item"><button class="page-link" id="pnext">&raquo;</button></li>`);
    $('#pp').on('click',()=>{this.#page--;this.#load();}); $('#pnext').on('click',()=>{this.#page++;this.#load();});
    $('.pn[data-page]').on('click',e=>{this.#page=+$(e.currentTarget).data('page');this.#load();});
  }

  // ── Modal ────────────────────────────────────────────────���
  async #openModal(id) {
    this.#currentId = id;
    this.#itens = [];
    const form = document.getElementById('form-compra');
    form.reset(); form.classList.remove('was-validated');
    $('#tbody-itens-compra').html(`<tr id="row-sem-itens">
      <td colspan="6" class="text-center py-4 text-muted">
        <i class="bi bi-inbox fs-4 d-block mb-1 opacity-50"></i>
        Nenhum item adicionado. Clique em "Adicionar Item".
      </td></tr>`);
    this.#calcTotal();

    // Pré-preenche "Registrado Por" com o usuário logado
    const user = this.#session.getUser();
    $('#compra-registrado-por').val(user?.nome ?? 'Usuário');

    if (id) {
      $('#modal-compra-title').text('Pedido de Compra');
      try {
        const c = await this.#api.get(`/compras/${id}`);
        $('#compra-id').val(c.id);
        $('#compra-fornecedor').val(c.fornecedorId);
        $('#compra-data').val(c.dataCompra?.substring(0,10) ?? '');
        $('#compra-hora').val(c.horaCompra ?? '');
        $('#compra-nota').val(c.numeroNota ?? '');
        $('#compra-obs').val(c.observacoes ?? '');
        if (c.registradoPor) $('#compra-registrado-por').val(c.registradoPor);
        $('#btn-cancelar-compra').toggleClass('d-none', c.status !== 'PENDENTE');
        // Carrega itens
        (c.itens ?? []).forEach(i => this.#addItemRow(i));
      } catch { Toast.show('Erro ao carregar pedido.', 'error'); return; }
    } else {
      $('#modal-compra-title').text('Nova Compra');
      $('#compra-id').val('');
      $('#compra-data').val(new Date().toISOString().substring(0,10));
      $('#compra-hora').val(new Date().toTimeString().substring(0,5));
      $('#btn-cancelar-compra').addClass('d-none');
    }
    new bootstrap.Modal(document.getElementById('modal-compra')).show();
  }

  // ── Itens dinâmicos ───────────────────────────────────────
  #addItemRow(item = null) {
    $('#row-sem-itens').remove();
    const idx  = Date.now();
    const rowN = $('#tbody-itens-compra tr.item-compra-row').length + 1;
    const opts = this.#produtos.map(p =>
      `<option value="${p.id}" data-preco="${p.precoCusto ?? p.precoVenda ?? 0}">${this.#esc(p.nome)}</option>`
    ).join('');

    const tr = $(`
      <tr class="item-compra-row" data-idx="${idx}">
        <td class="text-center py-2 px-3">
          <span class="badge bg-secondary" style="font-size:11px;">${rowN}</span>
        </td>
        <td class="py-2">
          <select class="form-select form-select-sm item-produto" required>
            <option value="">Selecione o produto...</option>${opts}
          </select>
        </td>
        <td class="py-2 text-center">
          <input type="number" class="form-control form-control-sm item-qtd text-center"
            value="1" min="1" step="1" inputmode="numeric" required style="width:80px;margin:auto;">
        </td>
        <td class="py-2">
          <div class="input-group input-group-sm">
            <span class="input-group-text">R$</span>
            <input type="text" class="form-control item-preco" placeholder="0,00" required inputmode="numeric">
          </div>
        </td>
        <td class="py-2 text-end item-subtotal fw-medium" style="color:var(--color-structural)">R$ 0,00</td>
        <td class="py-2 text-center">
          <button type="button" class="btn btn-link btn-remove-item p-0" title="Remover item">
            <i class="bi bi-x-circle-fill fs-5" style="color:var(--color-danger)"></i>
          </button>
        </td>
      </tr>
    `);

    // Pré-preencher se item existente
    if (item) {
      tr.find('.item-produto').val(item.produtoId);
      tr.find('.item-qtd').val(item.quantidade);
      const precoFormatado = Mask.currency(String(Math.round((item.precoUnitario??0)*100)));
      tr.find('.item-preco').val(precoFormatado);
    }

    // Máscara moeda no preço
    const precoEl = tr.find('.item-preco')[0];
    precoEl.addEventListener('input', () => {
      precoEl.value = Mask.currency(precoEl.value);
      this.#updateRow(tr);
    });

    // Ao selecionar produto, preenche valorUnitario (DDL: valorUnitario = valorUni do produto, ReadOnly)
    tr.find('.item-produto').on('change', () => {
      const opt   = tr.find('.item-produto option:selected');
      const preco = parseFloat(opt.data('preco')) || 0;
      // valorUnitario = fixo do cadastro (DDL itemCompra.valorUnitario)
      precoEl.value = preco > 0
        ? preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
        : '';
      precoEl.readOnly = true; // sempre ReadOnly — fixo do banco
      this.#updateRow(tr);
    });
    tr.find('.item-qtd').on('input', () => this.#updateRow(tr));

    // Remover linha
    tr.find('.btn-remove-item').on('click', () => {
      tr.remove();
      if (!$('#tbody-itens-compra tr.item-compra-row').length) {
        $('#tbody-itens-compra').html(`<tr id="row-sem-itens">
          <td colspan="6" class="text-center py-4 text-muted">
            <i class="bi bi-inbox fs-4 d-block mb-1 opacity-50"></i>
            Nenhum item adicionado. Clique em "Adicionar Item".
          </td></tr>`);
      }
      this.#calcTotal();
    });

    $('#tbody-itens-compra').append(tr);
    if (item) this.#updateRow(tr);
  }

  #updateRow(tr) {
    const qtd   = parseFloat(tr.find('.item-qtd').val()) || 0;
    const preco = this.#parseBrl(tr.find('.item-preco').val());
    tr.find('.item-subtotal').text(this.#brl(qtd * preco));
    this.#calcTotal();
  }

  #calcTotal() {
    let total = 0;
    $('#tbody-itens-compra tr.item-compra-row').each((_, tr) => {
      const qtd   = parseFloat($(tr).find('.item-qtd').val()) || 0;
      const preco = this.#parseBrl($(tr).find('.item-preco').val());
      total += qtd * preco;
    });
    $('#compra-total-display').text(this.#brl(total));
  }

  // ── Salvar ────────────────────────────────────────────────
  async #save() {
    const form = document.getElementById('form-compra');
    form.classList.add('was-validated');
    if (!form.checkValidity()) { Toast.show('Preencha os campos obrigatórios.', 'warning'); return; }

    const itens = [];
    let valido = true;
    $('#tbody-itens-compra tr.item-compra-row').each((_, tr) => {
      const produtoId = parseInt($(tr).find('.item-produto').val());
      const qtd       = parseInt($(tr).find('.item-qtd').val()) || 0;   // inteiros
      const preco     = this.#parseBrl($(tr).find('.item-preco').val());
      if (!produtoId || qtd <= 0 || preco <= 0) { valido = false; return false; }
      itens.push({ produtoId, quantidade: qtd, precoUnitario: preco });
    });

    if (!itens.length) { Toast.show('Adicione ao menos um item ao pedido.', 'warning'); return; }
    if (!valido) { Toast.show('Preencha todos os campos dos itens corretamente.', 'warning'); return; }

    const payload = {
      fornecedorId:  parseInt($('#compra-fornecedor').val()),
      dataCompra:    $('#compra-data').val(),
      horaCompra:    $('#compra-hora').val() || null,
      numeroNota:    $('#compra-nota').val().trim(),
      registradoPor: $('#compra-registrado-por').val(),
      status:        'PENDENTE',    // STATUS gerenciado via ações (receber/cancelar)
      observacoes:   $('#compra-obs').val().trim(),
      total:         itens.reduce((s,i) => s + i.quantidade * i.precoUnitario, 0),
      itens,
    };

    const btn = $('#btn-salvar-compra');
    btn.prop('disabled',true).html('<div class="spinner-border spinner-border-sm me-1"></div>');
    try {
      const id = $('#compra-id').val();
      if (id) {
        await this.#api.put(`/compras/${id}`, payload);
        Toast.show('Pedido atualizado!', 'success');
      } else {
        await this.#api.post('/compras', payload);
        Toast.show('Pedido de compra criado!', 'success');
      }
      bootstrap.Modal.getInstance(document.getElementById('modal-compra'))?.hide();
      await this.#load();
    } catch (err) { Toast.show(err.message || 'Erro ao salvar.', 'error'); }
    finally { btn.prop('disabled',false).html('<i class="bi bi-check-lg me-1"></i> Salvar'); }
  }

  // ── Cancelar Pedido ─────────────────────────────────────��─
  #confirmCancel() {
    const id = $('#compra-id').val();
    const c  = this.#compras.find(x => String(x.id) === String(id));
    $('#modal-cancel-body').text(`Cancelar o pedido #${id} — ${c?.nomeFornecedor ?? ''}?`);
    const btn = $('#modal-cancel-btn');
    btn.off('click').on('click', async () => {
      btn.prop('disabled',true);
      try {
        await this.#api.put(`/compras/${id}/cancelar`, {});
        Toast.show('Pedido cancelado.', 'success');
        bootstrap.Modal.getInstance(document.getElementById('modal-confirm-cancel'))?.hide();
        bootstrap.Modal.getInstance(document.getElementById('modal-compra'))?.hide();
        await this.#load();
      } catch (err) { Toast.show(err.message || 'Erro ao cancelar.', 'error'); }
      finally { btn.prop('disabled',false); }
    });
    bootstrap.Modal.getInstance(document.getElementById('modal-compra'))?.hide();
    new bootstrap.Modal(document.getElementById('modal-confirm-cancel')).show();
  }

  // ── Filtros ───────────────────────────────────────────────
  #applyFilters() {
    this.#filters = {};
    const f = $('#filtro-fornecedor').val().trim();
    const di = $('#filtro-data-ini').val();
    const df = $('#filtro-data-fim').val();
    const s  = $('#filtro-status').val();
    if (f) this.#filters.fornecedor = f;
    if (di) this.#filters.dataIni = di;
    if (df) this.#filters.dataFim = df;
    if (s) this.#filters.status = s;
    this.#page = 1; this.#load();
  }
  #clearFilters() {
    $('#filtro-fornecedor').val(''); $('#filtro-data-ini').val('');
    $('#filtro-data-fim').val(''); $('#filtro-status').val('');
    this.#filters = {}; this.#page = 1; this.#load();
  }

  #fmtDate(iso) { if(!iso) return '—'; return new Date(iso+'T00:00:00').toLocaleDateString('pt-BR'); }
  #brl(v) { return Number(v??0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
  #parseBrl(v) { if(!v)return 0; return parseFloat(String(v).replace(/[^\d,]/g,'').replace(',','.'))||0; }
  #loadingRow(c) { return `<tr><td colspan="${c}" class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm me-2"></div>Carregando...</td></tr>`; }
  #errorRow(c)   { return `<tr><td colspan="${c}" class="text-center py-5 text-muted"><i class="bi bi-exclamation-triangle me-2"></i>Erro ao carregar.</td></tr>`; }
  #esc(v) { return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
}
