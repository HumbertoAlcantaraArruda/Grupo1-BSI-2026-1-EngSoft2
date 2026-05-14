/**
 * PortalEventosController — Portal público de eventos.
 * Exibe cards de eventos ativos e gerencia inscrições.
 */
class PortalEventosController {
  #api; #session;
  #eventos = [];
  #eventoAtual = null;
  #page = 1; #perPage = 9; #totalPages = 1;
  #filters = {};

  // ════════════════════════════════════════════════════════════
  // MOCK — 3 eventos de teste (exibidos quando a API não responde)
  // Remover ao integrar com o backend real.
  // ════════════════════════════════════════════════════════════
  #MOCK_EVENTOS = [
    {
      id: 101, nome: 'Festa Junina 2026', status: 'ATIVO',
      dataInicio: '2026-06-13T19:00:00', local: 'Salão Paroquial',
      valorInscricao: 0, inscricoes: 12, capacidade: 100,
      descricao: 'Grande festa junina com quadrilha, forró ao vivo e comidas típicas. Entrada gratuita para toda a família.',
      imagemUrl: null,
    },
    {
      id: 102, nome: 'Jantar Beneficente — Obras Sociais', status: 'ATIVO',
      dataInicio: '2026-07-20T20:00:00', local: 'Centro de Eventos Municipal',
      valorInscricao: 150.00, inscricoes: 45, capacidade: 60,
      descricao: 'Jantar elegante com arrecadação para obras sociais da paróquia. Inclui jantar completo e sorteios.',
      imagemUrl: null,
    },
    {
      id: 103, nome: 'Retiro Espiritual de Jovens', status: 'ATIVO',
      dataInicio: '2026-08-01T08:00:00', local: 'Fazenda Santa Clara — Interior',
      valorInscricao: 80.00, inscricoes: 20, capacidade: 40,
      descricao: 'Retiro de três dias para jovens de 15 a 25 anos. Inclui hospedagem, alimentação e atividades espirituais.',
      imagemUrl: null,
    },
  ];

  // ════════════════════════════════════════════════════════════
  // MOCK — Inscrições do usuário para teste
  // Remover ao integrar com o backend real.
  // ════════════════════════════════════════════════════════════
  #MOCK_INSCRICOES = [
    {
      id: 1, nomeEvento: 'Festa Junina 2026', dataEvento: '2026-06-13',
      status: 'CONFIRMADA', statusPagamento: 'NAO_PAGO', valor: 0,
    },
    {
      id: 2, nomeEvento: 'Jantar Beneficente — Obras Sociais', dataEvento: '2026-07-20',
      status: 'CONFIRMADA', statusPagamento: 'PAGO', valor: 150.00,
    },
  ];

  constructor() {
    this.#api     = ApiService.getInstance();
    this.#session = SessionManager.getInstance();
  }

  async init() {
    this.#applyMasks();
    this.#bindEvents();
    await Promise.all([this.#loadEventos(), this.#loadContadorInscricoes()]);
  }

  #applyMasks() {
    Mask.applyTo(document.getElementById('inscricao-cpf'),      'cpf');
    Mask.applyTo(document.getElementById('inscricao-telefone'), 'phone');
  }

  #bindEvents() {
    $('#btn-filtrar').on('click', () => this.#applyFilters());
    $('#btn-limpar').on('click',  () => this.#clearFilters());
    $('#filtro-nome').on('keydown', e => { if (e.key === 'Enter') this.#applyFilters(); });
    $('#filtro-pago').on('change', () => { this.#page = 1; this.#applyFilters(); });

    $('#btn-minhas-inscricoes').on('click', () => this.#abrirMinhasInscricoes());
    $('#btn-confirmar-inscricao').on('click', () => this.#confirmarInscricao());
  }

  async #loadEventos() {
    $('#eventos-grid').html(`
      <div class="col-12 text-center py-5 text-muted">
        <div class="spinner-border me-2"></div> Carregando eventos...
      </div>
    `);
    try {
      const p = new URLSearchParams({ status: 'ATIVO', page: this.#page - 1, size: this.#perPage });
      if (this.#filters.nome) p.set('nome', this.#filters.nome);
      if (this.#filters.data) p.set('dataInicio', this.#filters.data);

      const resp = await this.#api.get(`/eventos?${p}`);
      this.#eventos    = resp.content ?? (Array.isArray(resp) ? resp : []);
      this.#totalPages = resp.totalPages ?? 1;

      // Filtro pago/gratuito no cliente (backend pode não suportar ainda)
      const filtroPago = this.#filters.pago;
      if (filtroPago === 'sim') this.#eventos = this.#eventos.filter(e => e.valorInscricao > 0);
      if (filtroPago === 'nao') this.#eventos = this.#eventos.filter(e => !e.valorInscricao || e.valorInscricao <= 0);

      this.#renderGrid();
      this.#renderPag(resp.totalElements ?? this.#eventos.length);
    } catch (err) {
      // MOCK — exibe eventos de teste quando a API não está disponível
      console.warn('[MOCK] API indisponível — exibindo eventos de teste:', err.message);
      let mock = [...this.#MOCK_EVENTOS];
      const filtroPago = this.#filters.pago;
      if (filtroPago === 'sim') mock = mock.filter(e => e.valorInscricao > 0);
      if (filtroPago === 'nao') mock = mock.filter(e => !e.valorInscricao || e.valorInscricao <= 0);
      if (this.#filters.nome) {
        const q = this.#filters.nome.toLowerCase();
        mock = mock.filter(e => e.nome.toLowerCase().includes(q));
      }
      this.#eventos    = mock;
      this.#totalPages = 1;
      this.#renderGrid();
    }
  }

  #renderGrid() {
    const grid = $('#eventos-grid');
    if (!this.#eventos.length) {
      grid.html(`<div class="col-12 text-center py-5 text-muted">
        <i class="bi bi-calendar-x fs-1 d-block mb-3 opacity-25"></i>
        <h5>Nenhum evento disponível</h5>
        <p>Verifique mais tarde ou limpe os filtros.</p>
      </div>`);
      return;
    }

    grid.html(this.#eventos.map(ev => {
      const inscricoes  = ev.inscricoes ?? 0;
      const capacidade  = ev.capacidade;
      const lotado      = capacidade && inscricoes >= capacidade;
      const quaseLotado = capacidade && (inscricoes / capacidade) >= 0.8;
      const fillClass   = lotado ? 'lotado' : quaseLotado ? 'quase-lotado' : '';
      const fillPct     = capacidade ? Math.min(100, (inscricoes / capacidade) * 100) : 0;
      const gratuito    = !ev.valorInscricao || ev.valorInscricao <= 0;
      const prazoOk     = !ev.dataLimiteInscricao || new Date(ev.dataLimiteInscricao) >= new Date();

      return `
        <div class="col-sm-6 col-xl-4">
          <div class="evento-card h-100">
            <div class="evento-banner">
              ${ev.imagemUrl
                ? `<img src="${this.#esc(ev.imagemUrl)}" alt="${this.#esc(ev.nome)}" onerror="this.parentElement.innerHTML='<i class=\\'bi bi-calendar-event\\'></i>'">`
                : '<i class="bi bi-calendar-event"></i>'
              }
            </div>
            <div class="evento-body">
              <div class="evento-nome">${this.#esc(ev.nome)}</div>
              <div class="evento-meta">
                <div><i class="bi bi-calendar3"></i> ${this.#fmtDate(ev.dataInicio)}</div>
                ${ev.local ? `<div><i class="bi bi-geo-alt"></i> ${this.#esc(ev.local)}</div>` : ''}
                ${capacidade
                  ? `<div class="mt-1">
                      <div class="d-flex justify-content-between" style="font-size:11px;">
                        <span>${inscricoes} inscrito${inscricoes!==1?'s':''}</span>
                        <span>${capacidade - inscricoes} vaga${(capacidade-inscricoes)!==1?'s':''} restante${(capacidade-inscricoes)!==1?'s':''}</span>
                      </div>
                      <div class="capacidade-bar">
                        <div class="fill ${fillClass}" style="width:${fillPct}%"></div>
                      </div>
                    </div>`
                  : ''
                }
                ${ev.descricao ? `<div class="mt-1 text-muted" style="font-size:12px; display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${this.#esc(ev.descricao)}</div>` : ''}
              </div>
            </div>
            <div class="evento-footer">
              <span class="evento-preco">
                ${gratuito ? '<span class="badge bg-success">Gratuito</span>' : this.#brl(ev.valorInscricao)}
              </span>
              ${!prazoOk
                ? `<span class="badge bg-secondary">Inscrições encerradas</span>`
                : lotado
                  ? `<span class="badge bg-danger">Lotado</span>`
                  : `<button class="btn btn-sm btn-primary btn-inscrever" data-id="${ev.id}">
                      <i class="bi bi-ticket-perforated me-1"></i>Inscrever-se
                    </button>`
              }
            </div>
          </div>
        </div>
      `;
    }).join(''));

    $('#eventos-grid .btn-inscrever').on('click', ev => {
      const id = $(ev.currentTarget).data('id');
      this.#abrirInscricao(id);
    });
  }

  #renderPag(total) {
    const ul = $('#paginacao'); ul.empty();
    if (this.#totalPages <= 1) return;
    if (this.#page > 1) ul.append(`<li class="page-item"><button class="page-link" id="pp">&laquo;</button></li>`);
    for (let i=Math.max(1,this.#page-2); i<=Math.min(this.#totalPages,this.#page+2); i++)
      ul.append(`<li class="page-item ${i===this.#page?'active':''}"><button class="page-link pn" data-page="${i}">${i}</button></li>`);
    if (this.#page<this.#totalPages) ul.append(`<li class="page-item"><button class="page-link" id="pnext">&raquo;</button></li>`);
    $('#pp').on('click',()=>{this.#page--;this.#loadEventos();}); $('#pnext').on('click',()=>{this.#page++;this.#loadEventos();});
    $('.pn[data-page]').on('click',e=>{this.#page=+$(e.currentTarget).data('page');this.#loadEventos();});
  }

  // ── Inscrição ──────────────────────────────────────────────
  #abrirInscricao(eventoId) {
    this.#eventoAtual = this.#eventos.find(e => String(e.id) === String(eventoId));
    if (!this.#eventoAtual) return;

    const ev = this.#eventoAtual;
    const form = document.getElementById('form-inscricao');
    form.reset(); form.classList.remove('was-validated');
    $('#inscricao-evento-id').val(ev.id);
    $('#modal-inscricao-title').html(`<i class="bi bi-ticket-perforated me-2"></i>${this.#esc(ev.nome)}`);
    $('#inscricao-evento-nome').text(ev.nome);
    $('#inscricao-evento-data').text(this.#fmtDate(ev.dataInicio) + (ev.local ? ` — ${ev.local}` : ''));
    $('#inscricao-evento-valor').text(
      (!ev.valorInscricao || ev.valorInscricao <= 0) ? 'Gratuito' : this.#brl(ev.valorInscricao)
    );

    // Pré-preencher com dados do usuário logado
    const u = this.#session.getUser();
    if (u) {
      $('#inscricao-nome').val(u.nome ?? '');
      $('#inscricao-email').val(u.email ?? '');
      if (u.cpf) $('#inscricao-cpf').val(Mask.cpf(u.cpf));
      if (u.telefone) $('#inscricao-telefone').val(Mask.phone(u.telefone));
    }

    new bootstrap.Modal(document.getElementById('modal-inscricao')).show();
  }

  async #confirmarInscricao() {
    const form = document.getElementById('form-inscricao');
    form.classList.add('was-validated');
    if (!form.checkValidity()) { Toast.show('Preencha todos os campos obrigatórios.', 'warning'); return; }

    const payload = {
      eventoId:        parseInt($('#inscricao-evento-id').val()),
      nome:            $('#inscricao-nome').val().trim(),
      cpf:             Mask.rawCpf($('#inscricao-cpf').val()),
      telefone:        Mask.rawPhone($('#inscricao-telefone').val()),
      email:           $('#inscricao-email').val().trim(),
      tamanhoCamiseta: $('#inscricao-camiseta').val() || null,
      observacoes:     $('#inscricao-obs').val().trim(),
    };

    const btn = $('#btn-confirmar-inscricao');
    btn.prop('disabled',true).html('<div class="spinner-border spinner-border-sm me-1"></div> Confirmando...');
    try {
      await this.#api.post('/inscricoes', payload);
      bootstrap.Modal.getInstance(document.getElementById('modal-inscricao'))?.hide();
      $('#inscricao-ok-msg').text(`Você está inscrito em "${this.#eventoAtual?.nome ?? ''}". Guarde este e-mail de confirmação.`);
      new bootstrap.Modal(document.getElementById('modal-inscricao-ok')).show();
      await Promise.all([this.#loadEventos(), this.#loadContadorInscricoes()]);
    } catch (err) {
      Toast.show(err.message || 'Erro ao realizar inscrição.', 'error');
    } finally {
      btn.prop('disabled',false).html('<i class="bi bi-check-circle me-1"></i> Confirmar Inscrição');
    }
  }

  // ── Minhas Inscrições ─────────────────────────────────────
  async #loadContadorInscricoes() {
    try {
      const u = this.#session.getUser();
      if (!u) return;
      const resp = await this.#api.get(`/inscricoes?usuarioId=${u.id}&size=100`);
      const lista = resp.content ?? (Array.isArray(resp) ? resp : []);
      const ativas = lista.filter(i => i.status !== 'CANCELADA').length;
      $('#badge-inscricoes').text(ativas);
    } catch { /* silencioso */ }
  }

  async #abrirMinhasInscricoes() {
    const tbody = $('#tbody-minhas-inscricoes');
    tbody.html(`<tr><td colspan="5" class="text-center py-4 text-muted">
      <div class="spinner-border spinner-border-sm me-2"></div>Carregando...
    </td></tr>`);
    new bootstrap.Modal(document.getElementById('modal-minhas-inscricoes')).show();

    try {
      const u = this.#session.getUser();
      const resp = await this.#api.get(`/inscricoes?usuarioId=${u?.id}&size=50`);
      const lista = resp.content ?? (Array.isArray(resp) ? resp : []);

      if (!lista.length) {
        // MOCK — exibe inscrições de teste se não houver dados da API
        const mockLista = this.#MOCK_INSCRICOES;
        if (mockLista.length) {
          console.warn('[MOCK] Exibindo inscrições de teste.');
          lista.push(...mockLista);
        } else {
          tbody.html(`<tr><td colspan="6" class="text-center py-4 text-muted">
            <i class="bi bi-ticket-perforated fs-3 d-block mb-2 opacity-50"></i>
            Você não possui inscrições.
          </td></tr>`);
          return;
        }
      }

      const stCls = { CONFIRMADA: 'bg-success', PENDENTE: 'bg-warning', CANCELADA: 'bg-danger' };
      const pgCls = { PAGO: 'badge-active', NAO_PAGO: 'badge-pending' };
      const pgLabel = { PAGO: 'Pago', NAO_PAGO: 'Não pago' };
      tbody.html(lista.map(i => {
        const pagStatus = i.statusPagamento ?? (i.valor > 0 ? 'NAO_PAGO' : 'NAO_PAGO');
        return `
        <tr>
          <td class="fw-medium">${this.#esc(i.nomeEvento ?? '—')}</td>
          <td>${this.#fmtDate(i.dataEvento)}</td>
          <td class="text-center"><span class="badge ${stCls[i.status] ?? 'bg-secondary'}">${i.status}</span></td>
          <td class="text-center">
            <span class="badge-status ${pgCls[pagStatus] ?? 'badge-pending'}">
              ${pgLabel[pagStatus] ?? '—'}
            </span>
          </td>
          <td class="text-end">${i.valor > 0 ? this.#brl(i.valor) : '<span class="text-muted">Gratuito</span>'}</td>
          <td class="text-center">
            ${i.status === 'CONFIRMADA'
              ? `<button class="btn btn-xs btn-outline-danger py-0 px-2 btn-cancelar-inscricao" data-id="${i.id}" style="font-size:11px;">
                  <i class="bi bi-x-circle me-1"></i>Cancelar
                </button>`
              : '—'
            }
          </td>
        </tr>`;
      }).join(''));

      $('#tbody-minhas-inscricoes .btn-cancelar-inscricao').on('click', async ev => {
        const id = $(ev.currentTarget).data('id');
        if (!confirm('Cancelar esta inscrição?')) return;
        try {
          await this.#api.put(`/inscricoes/${id}/cancelar`, {});
          Toast.show('Inscrição cancelada.', 'success');
          await this.#abrirMinhasInscricoes();
          await this.#loadContadorInscricoes();
        } catch (err) { Toast.show(err.message || 'Erro ao cancelar.', 'error'); }
      });
    } catch (err) {
      Toast.show(err.message || 'Erro ao carregar inscrições.', 'error');
    }
  }

  #applyFilters() {
    this.#filters = {};
    const n = $('#filtro-nome').val().trim();
    const d = $('#filtro-data').val();
    const p = $('#filtro-pago').val();
    if (n) this.#filters.nome = n;
    if (d) this.#filters.data = d;
    if (p) this.#filters.pago = p;
    this.#page = 1; this.#loadEventos();
  }
  #clearFilters() {
    $('#filtro-nome').val(''); $('#filtro-data').val(''); $('#filtro-pago').val('');
    this.#filters = {}; this.#page = 1; this.#loadEventos();
  }

  #fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' });
  }
  #brl(v) { return Number(v??0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
  #esc(v) { return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
}
