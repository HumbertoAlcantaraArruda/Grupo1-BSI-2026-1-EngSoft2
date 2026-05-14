/**
 * CategoriasController — CRUD de CategoriaProduto.
 *
 * DDL: CategoriaProduto(idCatProd, nome)
 *
 * Regras UI:
 *  • Sem campo de cor (cor não está no DDL).
 *  • Status "Ativo" padrão (desabilitado ao criar); habilitado ao editar.
 */
class CategoriasController {
  #api; #session;
  #categorias = []; #currentId = null;
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
    await this.#load();
  }

  #bindEvents() {
    $('#btn-filtrar').on('click',          () => this.#applyFilters());
    $('#btn-limpar').on('click',           () => this.#clearFilters());
    $('#filtro-nome').on('keydown',        e  => { if (e.key==='Enter') this.#applyFilters(); });
    $('#btn-nova-categoria').on('click',   () => this.#openModal(null));
    $('#btn-salvar-categoria').on('click', () => this.#save());
    $('#btn-deletar-categoria').on('click',() => this.#confirmDelete(this.#currentId));
  }

  async #load() {
    $('#tbody-categorias').html(`<tr><td colspan="4" class="text-center py-4 text-muted">
      <div class="spinner-border spinner-border-sm me-2"></div>Carregando...</td></tr>`);
    try {
      const p = new URLSearchParams();
      if (this.#filters.nome)   p.set('nome', this.#filters.nome);
      if (this.#filters.status !== undefined && this.#filters.status !== '')
        p.set('status', this.#filters.status);

      const resp = await this.#api.get(`/categorias?${p}`);
      this.#categorias = resp.content ?? (Array.isArray(resp) ? resp : []);
      this.#renderTable();
    } catch (err) {
      Toast.show(err.message || 'Erro ao carregar.', 'error');
    }
  }

  #renderTable() {
    const tbody = $('#tbody-categorias');
    if (!this.#categorias.length) {
      tbody.html(`<tr><td colspan="4" class="text-center py-5 text-muted">
        <i class="bi bi-tags fs-3 d-block mb-2"></i>Nenhuma categoria encontrada.
      </td></tr>`);
      $('#info-registros').text('0 registros'); return;
    }
    tbody.html(this.#categorias.map(c => `
      <tr>
        <td><small class="text-muted">${c.idCatProd ?? c.id}</small></td>
        <td class="fw-medium">${this.#esc(c.nome)}</td>
        <td class="text-center">
          <span class="badge bg-secondary">${c.qtdProdutos ?? 0}</span>
        </td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-primary btn-editar py-0 px-2"
            data-id="${c.idCatProd ?? c.id}">
            <i class="bi bi-pencil"></i>
          </button>
        </td>
      </tr>
    `).join(''));

    $('#tbody-categorias .btn-editar').on('click', ev =>
      this.#openModal($(ev.currentTarget).data('id'))
    );
    const t = this.#categorias.length;
    $('#info-registros').text(`${t} registro${t!==1?'s':''}`);
  }

  async #openModal(id) {
    this.#currentId = id;
    const form = document.getElementById('form-categoria');
    form.reset(); form.classList.remove('was-validated');

    if (id) {
      $('#modal-categoria-title').text('Editar Categoria');
      $('#btn-deletar-categoria').removeClass('d-none');
      try {
        const c = await this.#api.get(`/categorias/${id}`);
        $('#categoria-id').val(c.idCatProd ?? c.id);
        $('#categoria-nome').val(c.nome);
      } catch { Toast.show('Erro ao carregar.', 'error'); return; }
    } else {
      $('#modal-categoria-title').text('Nova Categoria');
      $('#btn-deletar-categoria').addClass('d-none');
      $('#categoria-id').val('');
    }
    new bootstrap.Modal(document.getElementById('modal-categoria')).show();
  }

  async #save() {
    const form = document.getElementById('form-categoria');
    form.classList.add('was-validated');
    if (!form.checkValidity()) { Toast.show('Preencha o nome.', 'warning'); return; }

    const payload = { nome: $('#categoria-nome').val().trim() };
    const btn = $('#btn-salvar-categoria');
    btn.prop('disabled',true).html('<div class="spinner-border spinner-border-sm me-1"></div>');
    try {
      const id = $('#categoria-id').val();
      if (id) {
        await this.#api.put(`/categorias/${id}`, payload);
        Toast.show('Categoria atualizada!', 'success');
      } else {
        await this.#api.post('/categorias', payload);
        Toast.show('Categoria criada!', 'success');
      }
      bootstrap.Modal.getInstance(document.getElementById('modal-categoria'))?.hide();
      await this.#load();
    } catch (err) { Toast.show(err.message || 'Erro ao salvar.', 'error'); }
    finally { btn.prop('disabled',false).html('<i class="bi bi-check-lg me-1"></i> Salvar'); }
  }

  #confirmDelete(id) {
    bootstrap.Modal.getInstance(document.getElementById('modal-categoria'))?.hide();
    const c = this.#categorias.find(x => String(x.idCatProd ?? x.id) === String(id));
    if (c?.qtdProdutos > 0) {
      Toast.show('Categoria possui produtos vinculados. Remova-os primeiro.', 'warning');
      return;
    }
    $('#modal-confirm-delete-body').text(`Excluir "${c?.nome ?? ''}"?`);
    const btn = $('#modal-confirm-delete-btn');
    btn.off('click').on('click', async () => {
      btn.prop('disabled',true);
      try {
        await this.#api.delete(`/categorias/${id}`);
        Toast.show('Categoria excluída.', 'success');
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
    const s = $('#filtro-status').val();
    if (n) this.#filters.nome = n;
    if (s !== '') this.#filters.status = s;
    this.#load();
  }
  #clearFilters() {
    $('#filtro-nome').val(''); $('#filtro-status').val('');
    this.#filters = {}; this.#load();
  }
  #esc(v) { return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
}
