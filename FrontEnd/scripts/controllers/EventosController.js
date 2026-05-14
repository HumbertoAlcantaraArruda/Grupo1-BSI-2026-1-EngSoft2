/**
 * EventosController — CRUD de Eventos.
 *
 * DDL: Evento(idEvento, nome, dataInicio, dataFim, totVagas, status, idCatEvento)
 *
 * Campos extras (não no DDL atual, preparados para integração futura):
 *   horaInicio, horaFim, dataEvento, horaEvento, valorInscricao, responsavelId, imagemBase64
 *
 * Regras UI:
 *  • Select2 em idCatEvento e evento-responsavel.
 *  • Drag & Drop de imagem.
 *  • Coluna "Lista de Espera" na tabela.
 *  • Status "Ativo" padrão ao criar (campo disabled); habilitado na edição.
 *  • Total de vagas: somente inteiros.
 *  • Valor R$: máscara monetária; se > 0, evento é pago.
 */
class EventosController {
  #api; #session;
  #eventos    = []; #categorias = [];
  #currentId  = null;
  #page = 1; #perPage = 15; #totalPages = 1;
  #filters = {};
  #imagemBase64 = null;

  // ════════════════════════════════════════════════════════
  // MOCK — Responsáveis disponíveis (remover ao integrar backend)
  // ════════════════════════════════════════════════════════
  #responsaveisMock = [
    { id: 1, nome: 'João Silva'     },
    { id: 2, nome: 'Maria Souza'    },
    { id: 3, nome: 'Pedro Costa'    },
    { id: 4, nome: 'Ana Oliveira'   },
    { id: 5, nome: 'Carlos Mendes'  },
  ];

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
    // Máscara monetária no campo Valor R$
    Mask.applyTo(document.getElementById('evento-valor'), 'currency');
    // Bloqueia decimais em totVagas (somente inteiros)
    document.getElementById('evento-totVagas')?.addEventListener('input', function () {
      this.value = this.value.replace(/[^\d]/g, '');
    });
    await this.#loadCategorias();
    this.#bindEvents();
    this.#setupDragDrop();
    await this.#load();
  }

  async #loadCategorias() {
    try {
      const resp = await this.#api.get('/categorias-evento?size=200');
      this.#categorias = resp.content ?? (Array.isArray(resp) ? resp : []);
    } catch { /* silencioso */ }
  }

  #bindEvents() {
    $('#btn-filtrar').on('click',        () => this.#applyFilters());
    $('#btn-limpar').on('click',         () => this.#clearFilters());
    $('#filtro-nome').on('keydown',      e  => { if (e.key==='Enter') this.#applyFilters(); });
    $('#btn-novo-evento').on('click',    () => this.#openModal(null));
    $('#btn-salvar-evento').on('click',  () => this.#save());
    $('#btn-deletar-evento').on('click', () => this.#confirmDelete(this.#currentId));

    // Input de arquivo para imagem
    document.getElementById('evento-img-input')?.addEventListener('change', e => {
      this.#lerImagem(e.target.files[0]);
    });
  }

  #setupDragDrop() {
    const zone = document.getElementById('evento-img-dropzone');
    if (!zone) return;

    zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop',      e => {
      e.preventDefault(); zone.classList.remove('dragover');
      this.#lerImagem(e.dataTransfer?.files?.[0]);
    });
    zone.addEventListener('click', () => document.getElementById('evento-img-input')?.click());
  }

  #lerImagem(file) {
    if (!file || !file.type.startsWith('image/')) {
      Toast.show('Selecione um arquivo de imagem.', 'warning'); return;
    }
    if (file.size > 2 * 1024 * 1024) {
      Toast.show('Imagem muito grande. Máximo: 2 MB.', 'warning'); return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      this.#imagemBase64 = e.target.result;
      $('#evento-img-preview').attr('src', e.target.result).removeClass('d-none');
      $('#evento-img-placeholder').addClass('d-none');
    };
    reader.readAsDataURL(file);
  }

  async #load() {
    $('#tbody-eventos').html(this.#loadRow(9));
    try {
      const p = new URLSearchParams({ page: this.#page-1, size: this.#perPage });
      if (this.#filters.nome)   p.set('nome', this.#filters.nome);
      if (this.#filters.data)   p.set('dataInicio', this.#filters.data);
      if (this.#filters.status) p.set('status', this.#filters.status);

      const resp = await this.#api.get(`/eventos?${p}`);
      this.#eventos    = resp.content ?? (Array.isArray(resp) ? resp : []);
      this.#totalPages = resp.totalPages ?? 1;
      this.#renderTable();
      this.#renderPag(resp.totalElements ?? this.#eventos.length);
    } catch (err) {
      Toast.show(err.message || 'Erro ao carregar eventos.', 'error');
      $('#tbody-eventos').html(this.#errRow(9));
    }
  }

  #renderTable() {
    const tbody = $('#tbody-eventos');
    if (!this.#eventos.length) {
      tbody.html(`<tr><td colspan="9" class="text-center py-5 text-muted">
        <i class="bi bi-calendar-x fs-3 d-block mb-2"></i>Nenhum evento.
      </td></tr>`);
      $('#info-registros').text('0 registros'); return;
    }

    tbody.html(this.#eventos.map(ev => {
      const listaEsp  = Math.max(0, (ev.inscricoes ?? 0) - (ev.totVagas ?? 999));
      const clsSt     = { true:'bg-success', false:'bg-secondary' }[ev.status] ?? 'bg-secondary';
      const valor     = ev.valorInscricao > 0
        ? `<span class="fw-medium" style="color:var(--color-primary)">${this.#brl(ev.valorInscricao)}</span>`
        : '<span class="badge bg-success">Gratuito</span>';
      return `
        <tr>
          <td><small class="text-muted">${ev.idEvento ?? ev.id}</small></td>
          <td class="fw-medium">${this.#esc(ev.nome)}</td>
          <td>${this.#fmtDate(ev.dataInicio)}</td>
          <td>${this.#fmtDate(ev.dataFim)}</td>
          <td class="text-center">${ev.totVagas ?? '∞'}</td>
          <td class="text-center">
            ${listaEsp > 0
              ? `<span class="badge bg-warning text-dark">${listaEsp}</span>`
              : '<span class="text-muted">—</span>'
            }
          </td>
          <td class="text-end">${valor}</td>
          <td class="text-center"><span class="badge ${clsSt}">${ev.status ? 'Ativo' : 'Inativo'}</span></td>
          <td class="text-center">
            <button class="btn btn-sm btn-outline-primary btn-editar py-0 px-2"
              data-id="${ev.idEvento ?? ev.id}">
              <i class="bi bi-pencil"></i>
            </button>
          </td>
        </tr>
      `;
    }).join(''));

    $('#tbody-eventos .btn-editar').on('click', e =>
      this.#openModal($(e.currentTarget).data('id'))
    );
    const t = this.#eventos.length;
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
    this.#imagemBase64 = null;
    const form = document.getElementById('form-evento');
    form.reset(); form.classList.remove('was-validated');
    $('#evento-img-preview').addClass('d-none');
    $('#evento-img-placeholder').removeClass('d-none');

    // Popula Select2 de categoria
    const sel = $('#evento-idCatEvento');
    sel.empty().append('<option value="">Selecione...</option>');
    this.#categorias.forEach(c => {
      sel.append(`<option value="${c.idCatEvento ?? c.id}">${this.#esc(c.nome)}</option>`);
    });
    sel.select2({
      theme: 'default', width: '100%',
      dropdownParent: $('#modal-evento'),
      placeholder: 'Selecione a categoria...',
    });

    // Popula Select2 de responsável
    // MOCK — Responsáveis (substituir por chamada à API de usuários)
    const selResp = $('#evento-responsavel');
    selResp.empty().append('<option value="">Selecione o responsável...</option>');
    this.#responsaveisMock.forEach(r => {
      selResp.append(`<option value="${r.id}">${this.#esc(r.nome)}</option>`);
    });
    selResp.select2({
      theme: 'default', width: '100%',
      dropdownParent: $('#modal-evento'),
      placeholder: 'Selecione o responsável...',
    });

    if (id) {
      $('#modal-evento-title').text('Editar Evento');
      $('#btn-deletar-evento').removeClass('d-none');
      $('#evento-status').prop('disabled', false);
      try {
        const ev = await this.#api.get(`/eventos/${id}`);
        $('#evento-id').val(ev.idEvento ?? ev.id);
        $('#evento-nome').val(ev.nome);
        sel.val(ev.idCatEvento ?? '').trigger('change');
        selResp.val(ev.responsavelId ?? '').trigger('change');
        $('#evento-dataInicio').val(ev.dataInicio?.substring(0,10) ?? '');
        $('#evento-horaInicio').val(ev.horaInicio ?? '');
        $('#evento-dataFim').val(ev.dataFim?.substring(0,10) ?? '');
        $('#evento-horaFim').val(ev.horaFim ?? '');
        $('#evento-dataEvento').val(ev.dataEvento?.substring(0,10) ?? '');
        $('#evento-horaEvento').val(ev.horaEvento ?? '');
        $('#evento-totVagas').val(ev.totVagas ?? '');
        if (ev.valorInscricao > 0) {
          const formatted = ev.valorInscricao.toLocaleString('pt-BR', { minimumFractionDigits:2 });
          $('#evento-valor').val(formatted);
        }
        $('#evento-status').val(String(ev.status !== false));
        if (ev.imagemUrl) {
          $('#evento-img-preview').attr('src', ev.imagemUrl).removeClass('d-none');
          $('#evento-img-placeholder').addClass('d-none');
        }
      } catch { Toast.show('Erro ao carregar evento.', 'error'); return; }
    } else {
      $('#modal-evento-title').text('Novo Evento');
      $('#btn-deletar-evento').addClass('d-none');
      $('#evento-id').val('');
      $('#evento-status').val('true').prop('disabled', true);
      $('#evento-dataInicio').val(new Date().toISOString().substring(0,10));
    }

    new bootstrap.Modal(document.getElementById('modal-evento')).show();
  }

  async #save() {
    const form = document.getElementById('form-evento');
    form.classList.add('was-validated');
    if (!form.checkValidity()) { Toast.show('Preencha os campos obrigatórios.', 'warning'); return; }

    const id = $('#evento-id').val();
    const valorRaw = parseFloat(
      String($('#evento-valor').val()).replace(/[^\d,]/g,'').replace(',','.')
    ) || 0;
    const payload = {
      nome:           $('#evento-nome').val().trim(),
      idCatEvento:    parseInt($('#evento-idCatEvento').val()) || null,
      responsavelId:  parseInt($('#evento-responsavel').val()) || null,
      dataInicio:     $('#evento-dataInicio').val(),
      horaInicio:     $('#evento-horaInicio').val() || null,
      dataFim:        $('#evento-dataFim').val() || null,
      horaFim:        $('#evento-horaFim').val() || null,
      dataEvento:     $('#evento-dataEvento').val() || null,
      horaEvento:     $('#evento-horaEvento').val() || null,
      totVagas:       parseInt($('#evento-totVagas').val()) || null,
      valorInscricao: valorRaw,
      status:         id ? ($('#evento-status').val() === 'true') : true,
      ...(this.#imagemBase64 && { imagemBase64: this.#imagemBase64 }),
    };

    const btn = $('#btn-salvar-evento');
    btn.prop('disabled',true).html('<div class="spinner-border spinner-border-sm me-1"></div>');
    try {
      if (id) {
        await this.#api.put(`/eventos/${id}`, payload);
        Toast.show('Evento atualizado!', 'success');
      } else {
        await this.#api.post('/eventos', payload);
        Toast.show('Evento criado!', 'success');
      }
      bootstrap.Modal.getInstance(document.getElementById('modal-evento'))?.hide();
      await this.#load();
    } catch (err) { Toast.show(err.message || 'Erro ao salvar.', 'error'); }
    finally { btn.prop('disabled',false).html('<i class="bi bi-check-lg me-1"></i> Salvar'); }
  }

  #confirmDelete(id) {
    bootstrap.Modal.getInstance(document.getElementById('modal-evento'))?.hide();
    const ev = this.#eventos.find(x => String(x.idEvento ?? x.id) === String(id));
    $('#modal-confirm-delete-body').text(`Excluir o evento "${ev?.nome ?? ''}"?`);
    const btn = $('#modal-confirm-delete-btn');
    btn.off('click').on('click', async () => {
      btn.prop('disabled',true);
      try {
        await this.#api.delete(`/eventos/${id}`);
        Toast.show('Evento excluído.', 'success');
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
    const d = $('#filtro-data').val();
    const s = $('#filtro-status').val();
    if (n) this.#filters.nome = n;
    if (d) this.#filters.data = d;
    if (s) this.#filters.status = s;
    this.#page = 1; this.#load();
  }
  #clearFilters() {
    $('#filtro-nome').val(''); $('#filtro-data').val(''); $('#filtro-status').val('');
    this.#filters = {}; this.#page = 1; this.#load();
  }

  #fmtDate(iso) { if(!iso)return '—'; return new Date(iso+'T00:00:00').toLocaleDateString('pt-BR'); }
  #brl(v) { return Number(v??0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
  #loadRow(c) { return `<tr><td colspan="${c}" class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm me-2"></div>Carregando...</td></tr>`; }
  #errRow(c)  { return `<tr><td colspan="${c}" class="text-center py-5 text-muted"><i class="bi bi-exclamation-triangle me-2"></i>Erro.</td></tr>`; }
  #esc(v) { return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
}
