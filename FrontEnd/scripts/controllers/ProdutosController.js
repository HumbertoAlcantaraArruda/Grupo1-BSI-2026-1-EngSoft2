/**
 * ProdutosController — CRUD de Produtos alinhado ao DDL.
 *
 * DDL: Produto(idProd, nome, valorUni, qtdAtual, idCatProd→CategoriaProduto)
 *
 * Regras UI:
 *  • Select2 em todos os campos de seleção (categoria).
 *  • Status "Ativo" padrão ao criar; campo desabilitado no primeiro cadastro.
 *  • Tabela: colunas Nome | Categoria | Preço de Custo (valorUni) | Estoque | Status | Ações.
 */
class ProdutosController {
  #api; #session;
  #produtos   = []; #categorias = [];
  #currentId  = null;
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
    await this.#loadCategorias();
    this.#bindEvents();
    await this.#load();
  }

  async #loadCategorias() {
    try {
      const resp = await this.#api.get('/categorias?size=200');
      this.#categorias = resp.content ?? (Array.isArray(resp) ? resp : []);
    } catch { /* silencioso */ }
  }

  #bindEvents() {
    $('#btn-filtrar').on('click',           () => this.#applyFilters());
    $('#btn-limpar').on('click',            () => this.#clearFilters());
    $('#filtro-nome').on('keydown',         e  => { if (e.key==='Enter') this.#applyFilters(); });
    $('#btn-novo-produto').on('click',      () => this.#openModal(null));
    $('#btn-salvar-produto').on('click',    () => this.#save());
    $('#btn-deletar-produto').on('click',   () => this.#confirmDelete(this.#currentId));
  }

  async #load() {
    $('#tbody-produtos').html(this.#loadRow(8));
    try {
      const p = new URLSearchParams({ page: this.#page-1, size: this.#perPage });
      if (this.#filters.nome)        p.set('nome',       this.#filters.nome);
      if (this.#filters.idCatProd)   p.set('idCatProd',  this.#filters.idCatProd);
      if (this.#filters.status !== undefined && this.#filters.status !== '')
        p.set('status', this.#filters.status);

      const resp = await this.#api.get(`/produtos?${p}`);
      this.#produtos   = resp.content ?? (Array.isArray(resp) ? resp : []);
      this.#totalPages = resp.totalPages ?? 1;
      this.#renderTable();
      this.#renderPag(resp.totalElements ?? this.#produtos.length);
    } catch (err) {
      Toast.show(err.message || 'Erro ao carregar produtos.', 'error');
      $('#tbody-produtos').html(this.#errRow(8));
    }
  }

  #renderTable() {
    const tbody = $('#tbody-produtos');
    if (!this.#produtos.length) {
      tbody.html(`<tr><td colspan="8" class="text-center py-5 text-muted">
        <i class="bi bi-box-seam fs-3 d-block mb-2"></i>Nenhum produto encontrado.
      </td></tr>`);
      $('#info-registros').text('0 registros'); return;
    }
    tbody.html(this.#produtos.map(p => `
      <tr>
        <td><small class="text-muted">${p.idProd ?? p.id}</small></td>
        <td class="fw-medium">${this.#esc(p.nome)}</td>
        <td>
          <span class="badge rounded-pill"
            style="background:var(--color-structural-light);color:var(--color-structural)">
            ${this.#esc(p.nomeCategoria ?? p.categoria ?? '—')}
          </span>
        </td>
        <td class="text-end fw-medium">${this.#brl(p.valorUni ?? 0)}</td>
        <td class="text-center">
          <span class="${(p.qtdAtual ?? 0) <= 0 ? 'text-danger fw-bold' : ''}">${p.qtdAtual ?? 0}</span>
        </td>
        <td class="text-center">
          <span class="badge ${p.status !== false ? 'bg-success' : 'bg-secondary'}">
            ${p.status !== false ? 'Ativo' : 'Inativo'}
          </span>
        </td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-primary btn-editar py-0 px-2" data-id="${p.idProd ?? p.id}">
            <i class="bi bi-pencil"></i>
          </button>
        </td>
      </tr>
    `).join(''));

    $('#tbody-produtos .btn-editar').on('click', ev =>
      this.#openModal($(ev.currentTarget).data('id'))
    );
    const t = this.#produtos.length;
    $('#info-registros').text(`${t} registro${t!==1?'s':''}`);
  }

  #renderPag(total) {
    const ul = $('#paginacao'); ul.empty();
    if (this.#totalPages <= 1) return;
    if (this.#page > 1) ul.append(`<li class="page-item"><button class="page-link" id="pp">&laquo;</button></li>`);
    for (let i=Math.max(1,this.#page-2); i<=Math.min(this.#totalPages,this.#page+2); i++)
      ul.append(`<li class="page-item ${i===this.#page?'active':''}"><button class="page-link pn" data-page="${i}">${i}</button></li>`);
    if (this.#page < this.#totalPages) ul.append(`<li class="page-item"><button class="page-link" id="pnext">&raquo;</button></li>`);
    $('#pp').on('click',()=>{this.#page--;this.#load();}); $('#pnext').on('click',()=>{this.#page++;this.#load();});
    $('.pn[data-page]').on('click',e=>{this.#page=+$(e.currentTarget).data('page');this.#load();});
  }

  async #openModal(id) {
    this.#currentId = id;
    const form = document.getElementById('form-produto');
    form.reset(); form.classList.remove('was-validated');

    // Popula Select2 de categoria dentro do modal
    const sel = $('#produto-idCatProd');
    sel.empty().append('<option value="">Selecione...</option>');
    this.#categorias.forEach(c => {
      sel.append(`<option value="${c.idCatProd ?? c.id}">${this.#esc(c.nome)}</option>`);
    });
    sel.select2({
      theme: 'default', width: '100%',
      dropdownParent: $('#modal-produto'),
      placeholder: 'Selecione a categoria...',
    });

    if (id) {
      $('#modal-produto-title').text('Editar Produto');
      $('#btn-deletar-produto').removeClass('d-none');
      // Status habilitado na edição
      $('#produto-status').prop('disabled', false);

      try {
        const p = await this.#api.get(`/produtos/${id}`);
        $('#produto-id').val(p.idProd ?? p.id);
        $('#produto-nome').val(p.nome);
        sel.val(p.idCatProd ?? p.categoria?.id ?? '').trigger('change');
        $('#produto-valorUni').val(p.valorUni ?? '');
        $('#produto-qtdAtual').val(p.qtdAtual ?? 0);
        $('#produto-status').val(String(p.status !== false));
      } catch { Toast.show('Erro ao carregar produto.', 'error'); return; }
    } else {
      $('#modal-produto-title').text('Novo Produto');
      $('#btn-deletar-produto').addClass('d-none');
      $('#produto-id').val('');
      // Status "Ativo" padrão e desabilitado no primeiro cadastro
      $('#produto-status').val('true').prop('disabled', true);
    }

    new bootstrap.Modal(document.getElementById('modal-produto')).show();
  }

  async #save() {
    const form = document.getElementById('form-produto');
    form.classList.add('was-validated');
    if (!form.checkValidity()) { Toast.show('Preencha os campos obrigatórios.', 'warning'); return; }

    const id = $('#produto-id').val();
    const payload = {
      nome:       $('#produto-nome').val().trim(),
      idCatProd:  parseInt($('#produto-idCatProd').val()) || null,
      valorUni:   parseFloat($('#produto-valorUni').val()) || 0,
      qtdAtual:   parseInt($('#produto-qtdAtual').val())  || 0,
      // Status: ao criar sempre true (campo disabled), ao editar usa o valor selecionado
      status:     id ? ($('#produto-status').val() === 'true') : true,
    };

    if (!payload.idCatProd) {
      Toast.show('Selecione uma categoria.', 'warning'); return;
    }

    const btn = $('#btn-salvar-produto');
    btn.prop('disabled',true).html('<div class="spinner-border spinner-border-sm me-1"></div>');
    try {
      if (id) {
        await this.#api.put(`/produtos/${id}`, payload);
        Toast.show('Produto atualizado!', 'success');
      } else {
        await this.#api.post('/produtos', payload);
        Toast.show('Produto cadastrado!', 'success');
      }
      bootstrap.Modal.getInstance(document.getElementById('modal-produto'))?.hide();
      await this.#load();
    } catch (err) { Toast.show(err.message || 'Erro ao salvar.', 'error'); }
    finally { btn.prop('disabled',false).html('<i class="bi bi-check-lg me-1"></i> Salvar'); }
  }

  #confirmDelete(id) {
    bootstrap.Modal.getInstance(document.getElementById('modal-produto'))?.hide();
    const p = this.#produtos.find(x => String(x.idProd ?? x.id) === String(id));
    $('#modal-confirm-delete-body').text(`Excluir o produto "${p?.nome ?? ''}"?`);
    const btn = $('#modal-confirm-delete-btn');
    btn.off('click').on('click', async () => {
      btn.prop('disabled',true);
      try {
        await this.#api.delete(`/produtos/${id}`);
        Toast.show('Produto excluído.', 'success');
        bootstrap.Modal.getInstance(document.getElementById('modal-confirm-delete'))?.hide();
        await this.#load();
      } catch (err) { Toast.show(err.message || 'Erro ao excluir.', 'error'); }
      finally { btn.prop('disabled',false); }
    });
    new bootstrap.Modal(document.getElementById('modal-confirm-delete')).show();
  }

  #applyFilters() {
    this.#filters = {};
    const n = $('#filtro-nome').val().trim();
    const c = $('#filtro-categoria').val();
    const s = $('#filtro-status').val();
    if (n) this.#filters.nome = n;
    if (c) this.#filters.idCatProd = c;
    if (s !== '') this.#filters.status = s;
    this.#page = 1; this.#load();
  }
  #clearFilters() {
    $('#filtro-nome').val(''); $('#filtro-categoria').val(''); $('#filtro-status').val('');
    this.#filters = {}; this.#page = 1; this.#load();
  }

  #brl(v) { return Number(v??0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
  #loadRow(c) { return `<tr><td colspan="${c}" class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm me-2"></div>Carregando...</td></tr>`; }
  #errRow(c)  { return `<tr><td colspan="${c}" class="text-center py-5 text-muted"><i class="bi bi-exclamation-triangle me-2"></i>Erro.</td></tr>`; }
  #esc(v) { return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
}
