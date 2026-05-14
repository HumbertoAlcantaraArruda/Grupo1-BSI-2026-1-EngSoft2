/**
 * PagamentosController — CRUD de FormaPagamento.
 *
 * DDL: FormaPagamento(idFormaPag, descricao)
 *
 * Único campo editável: descricao.
 */
class PagamentosController {
  #api; #session;
  #pagamentos = []; #currentId = null;
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
    $('#btn-filtrar').on('click',         () => this.#applyFilters());
    $('#btn-limpar').on('click',          () => this.#clearFilters());
    $('#filtro-nome').on('keydown',       e  => { if (e.key==='Enter') this.#applyFilters(); });
    $('#btn-nova-forma').on('click',      () => this.#openModal(null));
    $('#btn-salvar-pagamento').on('click',() => this.#save());
  }

  async #load() {
    $('#tbody-pagamentos').html(`<tr><td colspan="4" class="text-center py-5 text-muted">
      <div class="spinner-border spinner-border-sm me-2"></div>Carregando...</td></tr>`);
    try {
      const p = new URLSearchParams();
      if (this.#filters.nome) p.set('descricao', this.#filters.nome);

      const resp = await this.#api.get(`/formas-pagamento?${p}`);
      this.#pagamentos = resp.content ?? (Array.isArray(resp) ? resp : []);
      this.#renderTable();
    } catch (err) {
      Toast.show(err.message || 'Erro ao carregar.', 'error');
    }
  }

  #renderTable() {
    const tbody = $('#tbody-pagamentos');
    if (!this.#pagamentos.length) {
      tbody.html(`<tr><td colspan="4" class="text-center py-5 text-muted">
        <i class="bi bi-credit-card fs-3 d-block mb-2"></i>Nenhuma forma de pagamento.
      </td></tr>`);
      $('#info-registros').text('0 registros'); return;
    }
    tbody.html(this.#pagamentos.map(fp => {
      const ativo = fp.ativo !== false && fp.status !== false;
      const statusBadge = ativo
        ? '<span class="badge-status badge-active">Ativo</span>'
        : '<span class="badge-status badge-inactive">Inativo</span>';
      return `
      <tr>
        <td><small class="text-muted">${fp.idFormaPag ?? fp.id}</small></td>
        <td class="fw-medium">
          <i class="bi bi-credit-card me-2 text-muted"></i>${this.#esc(fp.descricao)}
        </td>
        <td class="text-center">${statusBadge}</td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-primary btn-editar py-0 px-2"
            data-id="${fp.idFormaPag ?? fp.id}">
            <i class="bi bi-pencil"></i>
          </button>
        </td>
      </tr>`;
    }).join(''));

    $('#tbody-pagamentos .btn-editar').on('click', ev =>
      this.#openModal($(ev.currentTarget).data('id'))
    );
    const t = this.#pagamentos.length;
    $('#info-registros').text(`${t} forma${t!==1?'s':''}`);
  }

  async #openModal(id) {
    this.#currentId = id;
    const form = document.getElementById('form-pagamento');
    form.reset(); form.classList.remove('was-validated');

    if (id) {
      $('#modal-pagamento-title').text('Editar Forma de Pagamento');
      try {
        const fp = await this.#api.get(`/formas-pagamento/${id}`);
        $('#pagamento-id').val(fp.idFormaPag ?? fp.id);
        $('#pagamento-descricao').val(fp.descricao);
        $('#pagamento-ativo').val(String(fp.ativo !== false));
      } catch { Toast.show('Erro ao carregar.', 'error'); return; }
    } else {
      $('#modal-pagamento-title').text('Nova Forma de Pagamento');
      $('#pagamento-id').val('');
      // STATUS: Ativo por padrão
      $('#pagamento-ativo').val('true');
    }
    new bootstrap.Modal(document.getElementById('modal-pagamento')).show();
  }

  async #save() {
    const form = document.getElementById('form-pagamento');
    form.classList.add('was-validated');
    if (!form.checkValidity()) { Toast.show('Preencha a descrição.', 'warning'); return; }

    const payload = {
      descricao: $('#pagamento-descricao').val().trim(),
      ativo:     $('#pagamento-ativo').val() === 'true',
    };
    const btn = $('#btn-salvar-pagamento');
    btn.prop('disabled',true).html('<div class="spinner-border spinner-border-sm me-1"></div>');
    try {
      const id = $('#pagamento-id').val();
      if (id) {
        await this.#api.put(`/formas-pagamento/${id}`, payload);
        Toast.show('Forma de pagamento atualizada!', 'success');
      } else {
        await this.#api.post('/formas-pagamento', payload);
        Toast.show('Forma de pagamento criada!', 'success');
      }
      bootstrap.Modal.getInstance(document.getElementById('modal-pagamento'))?.hide();
      await this.#load();
    } catch (err) { Toast.show(err.message || 'Erro ao salvar.', 'error'); }
    finally { btn.prop('disabled',false).html('<i class="bi bi-check-lg me-1"></i> Salvar'); }
  }

  #applyFilters() {
    this.#filters = {};
    const n = $('#filtro-nome').val().trim();
    if (n) this.#filters.nome = n;
    this.#load();
  }
  #clearFilters() {
    $('#filtro-nome').val('');
    this.#filters = {}; this.#load();
  }
  #esc(v) { return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
}
