class CategoriaEventosController {
  #api; #session; #toast;
  #cats = []; #currentId = null;
  #filters = {};

  constructor() {
    this.#api     = ApiService.getInstance();
    this.#session = SessionManager.getInstance();
    this.#toast   = Toast.getInstance();
  }

  async init() {
    if (!this.#session.hasRole('COLABORADOR')) {
      this.#toast.error('Acesso não autorizado.');
      setTimeout(() => window.location.replace('../dashboard.html'), 1500);
      return;
    }
    this.#bindEvents();
    await this.#load();
  }

  #bindEvents() {
    $('#filtro-nome').on('keydown',          e  => { if (e.key === 'Enter') this.#applyFilters(); });
    $('#btn-filtrar').on('click',            () => this.#applyFilters());
    $('#btn-limpar').on('click',             () => this.#clearFilters());
    $('#btn-nova-cat-evento').on('click',    () => this.#openModal(null));
    $('#btn-salvar-cat-evento').on('click',  () => this.#save());
  }

  async #load() {
    $('#tbody-cats-evento').html(`<tr><td colspan="3" class="text-center py-4 text-muted">
      <div class="spinner-border spinner-border-sm me-2"></div>Carregando...
    </td></tr>`);
    try {
      const p = new URLSearchParams();
      if (this.#filters.nome)  p.set('nome',  this.#filters.nome);
      if (this.#filters.ativo !== undefined) p.set('ativo', this.#filters.ativo);
      const resp = await this.#api.get(`/categoriaEvento?${p}`);
      if (Array.isArray(resp.result)) {
        this.#cats = resp.result;
      } else if (resp.result) {
        this.#cats = [resp.result];
      } else {
        this.#cats = [];
      }
      this.#renderTable();
    } catch (err) {
      this.#toast.error(err.message || 'Erro ao carregar categorias.');
      $('#tbody-cats-evento').html(`<tr><td colspan="3" class="text-center py-4 text-muted">
        <i class="bi bi-exclamation-triangle me-2"></i>Erro ao carregar.
      </td></tr>`);
    }
  }

  #renderTable() {
    const tbody = $('#tbody-cats-evento');

    if (!this.#cats.length) {
      tbody.html(`<tr><td colspan="3" class="text-center py-5 text-muted">
        <i class="bi bi-calendar2-range fs-3 d-block mb-2"></i>Nenhuma categoria encontrada.
      </td></tr>`);
      $('#info-registros').text('0 registros');
      return;
    }

    tbody.html(this.#cats.map(c => `
      <tr>
        <td class="fw-medium">${this.#esc(c.nome)}</td>
        <td class="text-center">
          <span class="badge-status ${c.ativo ? 'badge-active' : 'badge-inactive'}"
            data-id="${c.idCatEvento}" data-ativo="${c.ativo}" title="Clique para alterar status">
            ${c.ativo ? 'Ativo' : 'Inativo'}
          </span>
        </td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-primary btn-editar py-0 px-2 me-1"
            data-id="${c.idCatEvento}" title="Editar">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger btn-excluir py-0 px-2"
            data-id="${c.idCatEvento}" title="Excluir">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join(''));

    $('#tbody-cats-evento .badge-status').on('click', ev =>
      this.#toggleAtivo($(ev.currentTarget))
    );
    $('#tbody-cats-evento .btn-editar').on('click', ev =>
      this.#openModal($(ev.currentTarget).data('id'))
    );
    $('#tbody-cats-evento .btn-excluir').on('click', ev =>
      this.#confirmDelete($(ev.currentTarget).data('id'))
    );

    const t = this.#cats.length;
    $('#info-registros').text(`${t} categoria${t !== 1 ? 's' : ''}`);
  }

  #openModal(id) {
    this.#currentId = id;
    const form = document.getElementById('form-cat-evento');
    form.reset();
    form.classList.remove('was-validated');

    const ativoField = document.getElementById('cat-evento-ativo');

    if (id) {
      $('#modal-cat-evento-title').text('Editar Categoria');
      const c = this.#cats.find(x => String(x.idCatEvento) === String(id));
      if (!c) { this.#toast.error('Categoria não encontrada.'); return; }
      $('#cat-evento-id').val(c.idCatEvento);
      $('#cat-evento-nome').val(c.nome);
      $('#cat-evento-ativo').val(String(c.ativo));
      ativoField.disabled = false;
    } else {
      $('#modal-cat-evento-title').text('Nova Categoria');
      $('#cat-evento-id').val('');
      $('#cat-evento-ativo').val('true');
      ativoField.disabled = true;
    }
    new bootstrap.Modal(document.getElementById('modal-cat-evento')).show();
  }

  async #save() {
    const form = document.getElementById('form-cat-evento');
    form.classList.add('was-validated');
    if (!form.checkValidity()) { this.#toast.warning('Preencha os campos obrigatórios.'); return; }

    const nome  = $('#cat-evento-nome').val().trim();
    const ativo = $('#cat-evento-ativo').val();
    const id    = $('#cat-evento-id').val();
    const btn   = $('#btn-salvar-cat-evento');
    btn.prop('disabled', true).html('<div class="spinner-border spinner-border-sm me-1"></div>');
    try {
      if (id) {
        await this.#api.putForm('/categoriaEvento', { id, nome, ativo });
        this.#toast.success('Categoria atualizada!');
      } else {
        await this.#api.postForm('/categoriaEvento', { nome, ativo });
        this.#toast.success('Categoria criada!');
      }
      bootstrap.Modal.getInstance(document.getElementById('modal-cat-evento'))?.hide();
      await this.#load();
    } catch (err) {
      bootstrap.Modal.getInstance(document.getElementById('modal-cat-evento'))?.hide();
      this.#toast.error(err.message || 'Erro ao salvar.');
    }
    finally { btn.prop('disabled', false).html('<i class="bi bi-check-lg me-1"></i>Salvar'); }
  }

  #confirmDelete(id) {
    const c = this.#cats.find(x => String(x.idCatEvento) === String(id));

    $('#modal-confirm-delete-body').text(`Excluir a categoria "${c?.nome ?? ''}"?`);
    const btn = $('#modal-confirm-delete-btn');
    btn.off('click').on('click', async () => {
      btn.prop('disabled', true);
      try {
        await this.#api.delete(`/categoriaEvento?id=${id}`);
        this.#toast.success('Categoria excluída.');
        bootstrap.Modal.getInstance(document.getElementById('modal-confirm-delete'))?.hide();
        await this.#load();
      } catch (err) { this.#toast.error(err.message || 'Erro ao excluir.'); }
      finally { btn.prop('disabled', false); }
    });
    new bootstrap.Modal(document.getElementById('modal-confirm-delete')).show();
  }

  async #toggleAtivo(el) {
    const id       = el.data('id');
    const ativo    = el.data('ativo');
    const novoAtivo = !ativo;
    const c = this.#cats.find(x => String(x.idCatEvento) === String(id));
    if (!c) return;

    el.css({ opacity: '0.5', pointerEvents: 'none' });
    try {
      await this.#api.putForm('/categoriaEvento', { id, nome: c.nome, ativo: novoAtivo });
      c.ativo = novoAtivo;
      el.removeClass('badge-active badge-inactive')
        .addClass(novoAtivo ? 'badge-active' : 'badge-inactive')
        .text(novoAtivo ? 'Ativo' : 'Inativo')
        .data('ativo', novoAtivo);
      this.#toast.success(novoAtivo ? 'Categoria ativada!' : 'Categoria desativada!');
    } catch (err) {
      this.#toast.error(err.message || 'Erro ao alterar status.');
    } finally {
      el.css({ opacity: '', pointerEvents: '' });
    }
  }

  #applyFilters() {
    this.#filters = {};
    const n = $('#filtro-nome').val().trim();
    if (n) this.#filters.nome = n;
    const a = $('#filtro-ativo').val();
    if (a !== '') this.#filters.ativo = a;
    this.#load();
  }

  #clearFilters() {
    $('#filtro-nome').val('');
    $('#filtro-ativo').val('');
    this.#filters = {};
    this.#load();
  }

  #esc(v) {
    return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}
