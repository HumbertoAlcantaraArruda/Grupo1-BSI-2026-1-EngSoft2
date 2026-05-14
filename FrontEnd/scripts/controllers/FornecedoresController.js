/**
 * FornecedoresController — CRUD de Fornecedores.
 *
 * DDL base: Fornecedor(idFornec, nome)
 * Campos extras preparados para integração futura:
 *   cnpj, email, telefone, telefone2, site, status,
 *   cep, endereco, bairro, cidade, estado, contato, obs
 *
 * ViaCEP: preenchimento automático de endereço pelo CEP.
 * STATUS: disabled no cadastro — sempre Ativo.
 */
class FornecedoresController {
  #api; #session;
  #fornecedores = []; #currentId = null;
  #page = 1; #perPage = 20; #totalPages = 1;
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
    this.#applyMasks();
    this.#bindEvents();
    await this.#load();
  }

  #applyMasks() {
    Mask.applyTo(document.getElementById('fornecedor-telefone'),  'phone');
    Mask.applyTo(document.getElementById('fornecedor-telefone2'), 'phone');

    // Máscara CEP inline (não existe Mask.cep)
    $('#fornecedor-cep').on('input', function () {
      let v = this.value.replace(/\D/g, '');
      if (v.length > 5) v = v.slice(0,5) + '-' + v.slice(5,8);
      this.value = v.slice(0, 9);
    });
  }

  #bindEvents() {
    $('#btn-filtrar').on('click',           () => this.#applyFilters());
    $('#btn-limpar').on('click',            () => this.#clearFilters());
    $('#filtro-nome').on('keydown',         e  => { if (e.key==='Enter') this.#applyFilters(); });
    $('#btn-novo-fornecedor').on('click',   () => this.#openModal(null));
    $('#btn-salvar-fornecedor').on('click', () => this.#save());
    $('#btn-deletar-fornecedor').on('click',() => this.#confirmDelete(this.#currentId));

    // ViaCEP — busca automática ao sair do campo CEP
    $('#fornecedor-cep').on('blur', () => this.#buscarCep($('#fornecedor-cep').val()));
  }

  // ── ViaCEP ────────────────────────────────────────────────
  async #buscarCep(cepRaw) {
    const cep = cepRaw.replace(/\D/g, '');
    if (cep.length !== 8) return;
    const loading = document.getElementById('cep-loading');
    if (loading) loading.classList.remove('d-none');
    try {
      const res  = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) return;
      $('#fornecedor-endereco').val(data.logradouro ?? '');
      $('#fornecedor-bairro').val(data.bairro ?? '');
      $('#fornecedor-cidade').val(data.localidade ?? '');
      $('#fornecedor-estado').val(data.uf ?? '');
    } catch { /* silencioso — não bloqueia o formulário */ }
    finally  { if (loading) loading.classList.add('d-none'); }
  }

  async #load() {
    $('#tbody-fornecedores').html(`<tr><td colspan="7" class="text-center py-5 text-muted">
      <div class="spinner-border spinner-border-sm me-2"></div>Carregando...</td></tr>`);
    try {
      const p = new URLSearchParams({ page: this.#page-1, size: this.#perPage });
      if (this.#filters.nome) p.set('nome', this.#filters.nome);

      const resp = await this.#api.get(`/fornecedores?${p}`);
      this.#fornecedores = resp.content ?? (Array.isArray(resp) ? resp : []);
      this.#totalPages   = resp.totalPages ?? 1;
      this.#renderTable();
      this.#renderPag();
    } catch (err) {
      Toast.show(err.message || 'Erro ao carregar.', 'error');
    }
  }

  #renderTable() {
    const tbody = $('#tbody-fornecedores');
    if (!this.#fornecedores.length) {
      tbody.html(`<tr><td colspan="7" class="text-center py-5 text-muted">
        <i class="bi bi-truck fs-3 d-block mb-2"></i>Nenhum fornecedor encontrado.
      </td></tr>`);
      $('#info-registros').text('0 registros'); return;
    }
    tbody.html(this.#fornecedores.map(f => {
      const ativo = f.status !== false && f.ativo !== false;
      const statusBadge = ativo
        ? '<span class="badge-status badge-active">Ativo</span>'
        : '<span class="badge-status badge-inactive">Inativo</span>';
      return `
      <tr>
        <td><small class="text-muted">${f.idFornec ?? f.id}</small></td>
        <td class="fw-medium">${this.#esc(f.nome)}</td>
        <td><small class="text-muted">${this.#esc(f.cnpj ?? '—')}</small></td>
        <td><small class="text-muted">${this.#esc(f.contato ?? '—')}</small></td>
        <td><small class="text-muted">${this.#esc(f.telefone ?? '—')}</small></td>
        <td class="text-center">${statusBadge}</td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-primary btn-editar py-0 px-2"
            data-id="${f.idFornec ?? f.id}">
            <i class="bi bi-pencil"></i>
          </button>
        </td>
      </tr>`;
    }).join(''));

    $('#tbody-fornecedores .btn-editar').on('click', ev =>
      this.#openModal($(ev.currentTarget).data('id'))
    );
    const t = this.#fornecedores.length;
    $('#info-registros').text(`${t} registro${t!==1?'s':''}`);
  }

  #renderPag() {
    const ul = $('#paginacao'); ul.empty();
    if (this.#totalPages <= 1) return;
    if (this.#page > 1) ul.append(`<li class="page-item"><button class="page-link" id="pp">&laquo;</button></li>`);
    for (let i=Math.max(1,this.#page-2); i<=Math.min(this.#totalPages,this.#page+2); i++)
      ul.append(`<li class="page-item ${i===this.#page?'active':''}"><button class="page-link pn" data-page="${i}">${i}</button></li>`);
    if (this.#page<this.#totalPages) ul.append(`<li class="page-item"><button class="page-link" id="pnext">&raquo;</button></li>`);
    $('#pp').on('click',()=>{this.#page--;this.#load();}); $('#pnext').on('click',()=>{this.#page++;this.#load();});
    $('.pn[data-page]').on('click',e=>{this.#page=+$(e.currentTarget).data('page');this.#load();});
  }

  async #openModal(id) {
    this.#currentId = id;
    const form = document.getElementById('form-fornecedor');
    form.reset(); form.classList.remove('was-validated');
    // STATUS: sempre Ativo e desabilitado
    $('#fornecedor-status').val('true').prop('disabled', true);

    if (id) {
      $('#modal-fornecedor-title').text('Editar Fornecedor');
      $('#btn-deletar-fornecedor').removeClass('d-none');
      try {
        const f = await this.#api.get(`/fornecedores/${id}`);
        $('#fornecedor-id').val(f.idFornec ?? f.id);
        $('#fornecedor-nome').val(f.nome);
        $('#fornecedor-cnpj').val(f.cnpj ?? '');
        $('#fornecedor-email').val(f.email ?? '');
        $('#fornecedor-telefone').val(f.telefone ? Mask.phone(f.telefone) : '');
        $('#fornecedor-telefone2').val(f.telefone2 ? Mask.phone(f.telefone2) : '');
        $('#fornecedor-site').val(f.site ?? '');
        $('#fornecedor-status').val(String(f.status !== false)).prop('disabled', false);
        $('#fornecedor-cep').val(f.cep ?? '');
        $('#fornecedor-endereco').val(f.endereco ?? '');
        $('#fornecedor-bairro').val(f.bairro ?? '');
        $('#fornecedor-cidade').val(f.cidade ?? '');
        $('#fornecedor-estado').val(f.estado ?? '');
        $('#fornecedor-contato').val(f.contato ?? '');
        $('#fornecedor-obs').val(f.obs ?? '');
      } catch { Toast.show('Erro ao carregar.', 'error'); return; }
    } else {
      $('#modal-fornecedor-title').text('Novo Fornecedor');
      $('#btn-deletar-fornecedor').addClass('d-none');
      $('#fornecedor-id').val('');
    }
    new bootstrap.Modal(document.getElementById('modal-fornecedor')).show();
  }

  async #save() {
    const form = document.getElementById('form-fornecedor');
    form.classList.add('was-validated');
    if (!form.checkValidity()) { Toast.show('Preencha o nome.', 'warning'); return; }

    const payload = {
      nome:      $('#fornecedor-nome').val().trim(),
      cnpj:      $('#fornecedor-cnpj').val().trim()     || null,
      email:     $('#fornecedor-email').val().trim()    || null,
      telefone:  Mask.rawPhone($('#fornecedor-telefone').val())  || null,
      telefone2: Mask.rawPhone($('#fornecedor-telefone2').val()) || null,
      site:      $('#fornecedor-site').val().trim()     || null,
      status:    $('#fornecedor-status').val() === 'true',
      cep:       $('#fornecedor-cep').val().replace(/\D/g,'')  || null,
      endereco:  $('#fornecedor-endereco').val().trim() || null,
      bairro:    $('#fornecedor-bairro').val().trim()   || null,
      cidade:    $('#fornecedor-cidade').val().trim()   || null,
      estado:    $('#fornecedor-estado').val()          || null,
      contato:   $('#fornecedor-contato').val().trim()  || null,
      obs:       $('#fornecedor-obs').val().trim()      || null,
    };
    const btn = $('#btn-salvar-fornecedor');
    btn.prop('disabled',true).html('<div class="spinner-border spinner-border-sm me-1"></div>');
    try {
      const id = $('#fornecedor-id').val();
      if (id) {
        await this.#api.put(`/fornecedores/${id}`, payload);
        Toast.show('Fornecedor atualizado!', 'success');
      } else {
        await this.#api.post('/fornecedores', payload);
        Toast.show('Fornecedor cadastrado!', 'success');
      }
      bootstrap.Modal.getInstance(document.getElementById('modal-fornecedor'))?.hide();
      await this.#load();
    } catch (err) { Toast.show(err.message || 'Erro ao salvar.', 'error'); }
    finally { btn.prop('disabled',false).html('<i class="bi bi-check-lg me-1"></i> Salvar'); }
  }

  #confirmDelete(id) {
    bootstrap.Modal.getInstance(document.getElementById('modal-fornecedor'))?.hide();
    const f = this.#fornecedores.find(x => String(x.idFornec ?? x.id) === String(id));
    $('#modal-confirm-delete-body').text(`Excluir o fornecedor "${f?.nome ?? ''}"?`);
    const btn = $('#modal-confirm-delete-btn');
    btn.off('click').on('click', async () => {
      btn.prop('disabled',true);
      try {
        await this.#api.delete(`/fornecedores/${id}`);
        Toast.show('Fornecedor excluído.', 'success');
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
    if (n) this.#filters.nome = n;
    this.#page = 1; this.#load();
  }
  #clearFilters() {
    $('#filtro-nome').val('');
    this.#filters = {}; this.#page = 1; this.#load();
  }
  #esc(v) { return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
}
