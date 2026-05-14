/**
 * UsuariosController — Controller / Façade (caso de uso: Gestão de Usuários)
 *
 * Padrões aplicados:
 *   GRASP / Controller     → UMA classe por caso de uso. Recebe eventos da
 *                            View, instancia Models, chama Service, devolve
 *                            dados prontos. A View nunca toca no Service.
 *   GRASP / Creator        → cria objetos Usuario via new Usuario(dados) ou
 *                            Usuario.fromDTO(resp). Contém / usa os Models.
 *   GRASP / Low Coupling   → depende de UsuarioService (abstração), não de
 *                            ApiService diretamente.
 *   SOLID / SRP            → única responsabilidade: orquestrar o CRUD de
 *                            usuários e aplicar as regras do caso de uso.
 *   SOLID / DIP            → usa UsuarioService (IUsuarioService), não fetch.
 *   GOF  / Singleton       → instância única; static #instancia + getInstance().
 *   GOF  / Façade          → a View chama APENAS métodos públicos deste controller
 *                            (salvar, filtrar, ativarDesativar). A orquestração
 *                            interna (Model + validação + Service) fica oculta.
 *
 * Regra de negócio crítica:
 *   Não é permitido desativar o ÚLTIMO ADM ativo do sistema.
 *
 * Ordem de carregamento (HTML):
 *   SessionManager.js → Sessao.js → Mask.js → Mascaras.js → Validador.js
 *   → Toast.js → Router.js → SidebarLoader.js
 *   → ApiService.js → UsuarioService.js
 *   → Usuario.js (model)
 *   → DashboardController.js → UsuariosController.js
 */
class UsuariosController {
  /* ── Singleton ──────────────────────────────────────────────── */
  static #instancia = null;

  /* ── Dependências (DIP: serviços abstraídos) ─────────────────── */
  #servico;   // IUsuarioService — NUNCA usar ApiService diretamente
  #sessao;    // Sessao (wrapper PT-BR de SessionManager)
  #mascaras;  // Mascaras (OCP, Singleton)
  #validador; // Validador (Bootstrap, Singleton)

  /* ── Estado interno ─────────────────────────────────────────── */
  #usuarios        = [];
  #currentId       = null;
  #page            = 1;
  #perPage         = 15;
  #totalPages      = 1;
  #filters         = {};
  #totalAdmsAtivos = 0;

  constructor() {
    if (UsuariosController.#instancia) return UsuariosController.#instancia;
    // Creator: o controller injeta suas próprias dependências (GRASP)
    this.#servico   = UsuarioService.getInstance();
    this.#sessao    = Sessao.getInstance();
    this.#mascaras  = Mascaras.getInstance();
    this.#validador = Validador.getInstance();
    UsuariosController.#instancia = this;
  }

  static getInstance() {
    if (!UsuariosController.#instancia) new UsuariosController();
    return UsuariosController.#instancia;
  }

  /* ══════════════════════════════════════════════════════════════
     FAÇADE: métodos públicos chamados EXCLUSIVAMENTE pela View
     A View não conhece Model, Service nem lógica interna.
     ══════════════════════════════════════════════════════════════ */

  /**
   * Ponto de entrada. A View chama controller.init() no DOMContentLoaded.
   */
  async init() {
    this.#verificarAcesso();
    this.#aplicarMascaras();
    this.#associarEventos();
    await this.#carregar();
  }

  /* ── Chamados pelos botões da View (Façade público) ─────────── */

  /** A View chama quando o usuário clica em "Filtrar". */
  async filtrar() {
    this.#coletarFiltros();
    this.#page = 1;
    await this.#carregar();
  }

  /** A View chama quando o usuário clica em "Limpar filtros". */
  async limparFiltros() {
    $('#filtro-nome').val('');
    $('#filtro-perfil').val('');
    $('#filtro-status').val('');
    this.#filters = {};
    this.#page = 1;
    await this.#carregar();
  }

  /** A View chama quando o usuário clica em "Novo Usuário" ou no ícone de editar. */
  async abrirModal(id = null) {
    await this.#abrirModal(id);
  }

  /** A View chama quando o usuário clica em "Salvar" no modal. */
  async salvar() {
    await this.#salvar();
  }

  /** A View chama quando o usuário clica em ativar/desativar. */
  confirmarToggleStatus(id, statusAtual, nome, nivel) {
    this.#confirmarToggleStatus(id, statusAtual, nome, nivel);
  }

  /* ══════════════════════════════════════════════════════════════
     PRIVADO: implementação interna (oculta da View)
     ══════════════════════════════════════════════════════════════ */

  /* ── Controle de acesso ──────────────────────────────────────── */
  #verificarAcesso() {
    if (!this.#sessao.temPermissao('ADM')) {
      Toast.show('Acesso restrito a Administradores.', 'error');
      setTimeout(() => Router.navigateTo('views/dashboard.html'), 1500);
    }
  }

  /* ── Máscaras (usa Mascaras.js — OCP) ───────────────────────── */
  #aplicarMascaras() {
    // Mascaras.getInstance().aplicarA() integra em tempo real
    this.#mascaras.aplicarA(document.getElementById('usuario-cpf'),      'cpf');
    this.#mascaras.aplicarA(document.getElementById('usuario-telefone'), 'telefone');

    // Validador.configurarBlur: valida ao sair do campo, não enquanto digita
    this.#validador.configurarBlur(
      document.getElementById('usuario-cpf'),
      v => this.#mascaras.validarCpf(v),
      'CPF inválido.'
    );

    // Senha: toggle visibilidade
    $('#btn-toggle-senha').on('click', () => {
      const input = document.getElementById('usuario-senha');
      const icon  = document.getElementById('senha-icon');
      const show  = input.type === 'password';
      input.type    = show ? 'text' : 'password';
      icon.className = show ? 'bi bi-eye-slash' : 'bi bi-eye';
    });

    // Aviso de último ADM ao mudar status/perfil no modal
    $('#usuario-status').on('change', () => this.#atualizarAvisoUltimoAdm());
    $('#usuario-perfil').on('change', () => this.#atualizarAvisoUltimoAdm());
  }

  /* ── Associação de eventos (delegação à Façade pública) ─────── */
  #associarEventos() {
    $('#btn-filtrar').on('click',        () => this.filtrar());
    $('#btn-limpar').on('click',         () => this.limparFiltros());
    $('#filtro-nome').on('keydown', e => { if (e.key === 'Enter') this.filtrar(); });
    $('#btn-novo-usuario').on('click',   () => this.abrirModal(null));
    $('#btn-salvar-usuario').on('click', () => this.salvar());
  }

  /* ── Carregar lista ──────────────────────────────────────────── */
  async #carregar() {
    const tbody = $('#tbody-usuarios');
    tbody.html(`
      <tr><td colspan="8" class="text-center py-5 text-muted">
        <div class="spinner-border spinner-border-sm me-2" role="status"></div>Carregando...
      </td></tr>
    `);

    try {
      // DIP: usa UsuarioService, não ApiService
      const resp = await this.#servico.listar(this.#filters, this.#page - 1, this.#perPage);
      this.#usuarios   = resp.content ?? (Array.isArray(resp) ? resp : []);
      this.#totalPages = resp.totalPages ?? 1;

      // Contagem de ADMs ativos para validação de último ADM
      this.#totalAdmsAtivos = await this.#servico.contarAdmsAtivos();

      this.#renderizarTabela();
      this.#renderizarPaginacao(resp.totalElements ?? this.#usuarios.length);
    } catch (err) {
      Toast.show(err.message || 'Erro ao carregar usuários.', 'error');
      tbody.html(`
        <tr><td colspan="8" class="text-center py-5 text-muted">
          <i class="bi bi-exclamation-triangle fs-3 d-block mb-2"></i>
          Não foi possível carregar os dados.
        </td></tr>
      `);
    }
  }

  /* ── Renderização da tabela ──────────────────────────────────── */
  #renderizarTabela() {
    const tbody = $('#tbody-usuarios');
    if (!this.#usuarios.length) {
      tbody.html(`
        <tr><td colspan="8" class="text-center py-5 text-muted">
          <i class="bi bi-people fs-3 d-block mb-2"></i>
          Nenhum usuário encontrado.
        </td></tr>
      `);
      $('#info-registros').text('0 registros');
      return;
    }

    const logadoId = this.#sessao.id;

    tbody.html(this.#usuarios.map(u => {
      const isUltimoAdm = u.nivel === 'ADM' && u.status && this.#totalAdmsAtivos <= 1;
      const isLogado    = u.id == logadoId;
      const { label: perfilLabel, cls: perfilCls } = this.#infoNivel(u.nivel);
      const dataFormatada = u.dataCadastro
        ? new Date(u.dataCadastro).toLocaleDateString('pt-BR')
        : '—';

      return `
        <tr>
          <td><small class="text-muted">${u.id}</small></td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <div class="rounded-circle d-flex align-items-center justify-content-center"
                style="width:30px;height:30px;background:var(--color-structural-light);
                color:var(--color-structural);font-weight:600;font-size:12px;flex-shrink:0;">
                ${this.#esc(this.#iniciais(u.nome))}
              </div>
              <div>
                <div class="fw-medium">${this.#esc(u.nome)}</div>
                ${isLogado ? '<small class="text-muted">(você)</small>' : ''}
              </div>
            </div>
          </td>
          <td><small>${this.#mascaras.cpf(u.cpf || '')}</small></td>
          <td><small>${this.#esc(u.email ?? '—')}</small></td>
          <td class="text-center">
            <span class="badge rounded-pill ${perfilCls}">${perfilLabel}</span>
          </td>
          <td class="text-center">
            <span class="badge ${u.status ? 'bg-success' : 'bg-secondary'}">
              ${u.status ? 'Ativo' : 'Inativo'}
            </span>
          </td>
          <td class="text-center"><small class="text-muted">${dataFormatada}</small></td>
          <td class="text-center">
            <div class="d-flex gap-1 justify-content-center">
              <button class="btn btn-sm btn-outline-primary btn-editar py-0 px-2"
                data-id="${u.id}" title="Editar usuário">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm py-0 px-2 btn-toggle-status
                ${u.status ? 'btn-outline-warning' : 'btn-outline-success'}"
                data-id="${u.id}"
                data-status="${u.status}"
                data-nome="${this.#esc(u.nome)}"
                data-nivel="${u.nivel}"
                title="${u.status ? 'Desativar usuário' : 'Reativar usuário'}"
                ${isUltimoAdm || isLogado ? 'disabled' : ''}>
                <i class="bi ${u.status ? 'bi-person-slash' : 'bi-person-check'}"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join(''));

    // Associa eventos após renderizar (delegação ao método público de façade)
    $('#tbody-usuarios .btn-editar').on('click', e => {
      this.abrirModal($(e.currentTarget).data('id'));
    });
    $('#tbody-usuarios .btn-toggle-status').on('click', e => {
      const btn = $(e.currentTarget);
      this.confirmarToggleStatus(
        btn.data('id'), btn.data('status'), btn.data('nome'), btn.data('nivel')
      );
    });

    const total = this.#usuarios.length;
    $('#info-registros').text(`${total} registro${total !== 1 ? 's' : ''} nesta página`);
  }

  /* ── Paginação ───────────────────────────────────────────────── */
  #renderizarPaginacao(totalItens) {
    const ul = $('#paginacao');
    ul.empty();
    if (this.#totalPages <= 1) return;

    if (this.#page > 1)
      ul.append(`<li class="page-item"><button class="page-link" id="pag-prev">&laquo;</button></li>`);

    const inicio = Math.max(1, this.#page - 2);
    const fim    = Math.min(this.#totalPages, this.#page + 2);
    for (let i = inicio; i <= fim; i++) {
      ul.append(`
        <li class="page-item ${i === this.#page ? 'active' : ''}">
          <button class="page-link pag-num" data-page="${i}">${i}</button>
        </li>
      `);
    }

    if (this.#page < this.#totalPages)
      ul.append(`<li class="page-item"><button class="page-link" id="pag-next">&raquo;</button></li>`);

    $('#pag-prev').on('click', () => { this.#page--; this.#carregar(); });
    $('#pag-next').on('click', () => { this.#page++; this.#carregar(); });
    $('.pag-num').on('click',  e  => { this.#page = +$(e.currentTarget).data('page'); this.#carregar(); });
  }

  /* ── Modal (abrir / preencher) ───────────────────────────────── */
  async #abrirModal(id) {
    this.#currentId = id;
    const form = document.getElementById('form-usuario');

    // Validador: limpa estado anterior do Bootstrap (was-validated, is-invalid etc.)
    this.#validador.limpar(form);
    $('#aviso-ultimo-adm').addClass('d-none');

    if (id) {
      $('#modal-usuario-title').text('Editar Usuário');
      $('#col-senha').hide();
      $('#usuario-senha').removeAttr('required');
      $('#usuario-status').prop('disabled', false);
      $('#footer-usuario-info').removeClass('d-none');

      try {
        // DIP: busca via UsuarioService
        const dto = await this.#servico.buscarPorId(id);
        // Creator: constrói o model a partir do DTO do backend
        const usuario = Usuario.fromDTO(dto);
        this.#preencherForm(usuario);
        this.#atualizarAvisoUltimoAdm();
      } catch {
        Toast.show('Erro ao carregar dados do usuário.', 'error');
        return;
      }
    } else {
      $('#modal-usuario-title').text('Novo Usuário');
      $('#col-senha').show();
      $('#usuario-senha').attr('required', true);
      $('#usuario-status').val('true').prop('disabled', true);
      $('#footer-usuario-info').addClass('d-none');
      $('#usuario-id').val('');
    }

    new bootstrap.Modal(document.getElementById('modal-usuario')).show();
  }

  #preencherForm(usuario) {
    // Recebe instância de Usuario (Model) — usa getters, nunca acesso direto
    $('#usuario-id').val(usuario.id);
    $('#usuario-nome').val(usuario.nome);
    $('#usuario-cpf').val(this.#mascaras.cpf(usuario.cpf));
    $('#usuario-email').val(usuario.email);
    $('#usuario-telefone').val(usuario.telefone ? this.#mascaras.telefone(usuario.telefone) : '');
    $('#usuario-perfil').val(usuario.nivel);
    $('#usuario-status').val(String(usuario.ativo));
    $('#usuario-data-cadastro').text(
      usuario.dataCadastro
        ? `Cadastrado em ${new Date(usuario.dataCadastro).toLocaleDateString('pt-BR')}`
        : ''
    );
  }

  /* ── Salvar (Façade: orquestra Model + validação + Service) ─── */
  async #salvar() {
    const form = document.getElementById('form-usuario');

    // 1. Bootstrap validation nativa (campos required, email, minlength etc.)
    if (!this.#validador.validarFormulario(form)) {
      Toast.show('Preencha todos os campos obrigatórios.', 'warning');
      return;
    }

    // 2. Coleta dados do formulário
    const id    = $('#usuario-id').val() || null;
    const dados = {
      id,
      nome:          $('#usuario-nome').val().trim(),
      cpf:           this.#mascaras.somenteNumeros($('#usuario-cpf').val()),
      email:         $('#usuario-email').val().trim(),
      telefone:      this.#mascaras.somenteNumeros($('#usuario-telefone').val()),
      nivel:         $('#usuario-perfil').val(),
      ativo:         id ? ($('#usuario-status').val() === 'true') : true,
      senha:         $('#usuario-senha').val() || undefined,
    };

    // 3. Creator: instancia o Model para validação (Information Expert)
    const usuario  = new Usuario(dados);
    const erros    = usuario.validar();

    // 4. Validação de CPF via Model (Information Expert)
    if (!usuario.validarCpf()) {
      const cpfEl = document.getElementById('usuario-cpf');
      this.#validador.marcarInvalido(cpfEl, 'CPF inválido.');
      erros.push('CPF inválido.');
    }

    if (erros.length) {
      Toast.show('Corrija os erros antes de salvar.', 'warning');
      return;
    }

    const btn = $('#btn-salvar-usuario');
    btn.prop('disabled', true).html('<div class="spinner-border spinner-border-sm me-1"></div> Salvando...');

    try {
      // 5. DIP: persiste via UsuarioService, não via ApiService
      if (id) {
        await this.#servico.atualizar(id, usuario.toDTO());
        Toast.show('Usuário atualizado com sucesso!', 'success');
      } else {
        await this.#servico.salvar(usuario.toDTO());
        Toast.show('Usuário cadastrado com sucesso!', 'success');
      }
      bootstrap.Modal.getInstance(document.getElementById('modal-usuario'))?.hide();
      await this.#carregar();
    } catch (err) {
      Toast.show(err.message || 'Erro ao salvar usuário.', 'error');
    } finally {
      btn.prop('disabled', false).html('<i class="bi bi-check-lg me-1"></i> Salvar');
    }
  }

  /* ── Ativar / Desativar ──────────────────────────────────────── */
  #confirmarToggleStatus(id, statusAtual, nome, nivel) {
    // Regra de negócio: não desativar o último ADM
    if (statusAtual && nivel === 'ADM' && this.#totalAdmsAtivos <= 1) {
      Toast.show('Não é possível desativar o último Administrador.', 'error');
      return;
    }

    const ativando  = !statusAtual;
    const acao      = ativando ? 'reativar'  : 'desativar';
    const acaoLabel = ativando ? 'Reativar'  : 'Desativar';
    const btnClass  = ativando ? 'btn-success' : 'btn-warning';

    $('#confirm-toggle-title').text(`${acaoLabel} Usuário`);
    $('#confirm-toggle-body').html(`
      Deseja <strong>${acao}</strong> o usuário <strong>${this.#esc(nome)}</strong>?
      ${!ativando ? '<br><small class="text-muted">O usuário perderá acesso ao sistema.</small>' : ''}
    `);

    const btn = $('#confirm-toggle-btn');
    btn.removeClass('btn-success btn-warning').addClass(btnClass).text(acaoLabel);
    btn.off('click').on('click', async () => {
      btn.prop('disabled', true);
      try {
        // DIP: delega ao Service
        await this.#servico.alterarStatus(id, ativando);
        Toast.show(`Usuário ${ativando ? 'reativado' : 'desativado'} com sucesso.`, 'success');
        bootstrap.Modal.getInstance(document.getElementById('modal-confirm-toggle'))?.hide();
        await this.#carregar();
      } catch (err) {
        Toast.show(err.message || `Erro ao ${acao} usuário.`, 'error');
      } finally {
        btn.prop('disabled', false);
      }
    });

    new bootstrap.Modal(document.getElementById('modal-confirm-toggle')).show();
  }

  /* ── Aviso: último ADM ───────────────────────────────────────── */
  #atualizarAvisoUltimoAdm() {
    const idAtual  = $('#usuario-id').val();
    const perfil   = $('#usuario-perfil').val();
    const status   = $('#usuario-status').val();
    const u        = this.#usuarios.find(x => String(x.id) === String(idAtual));
    const eraAdm   = u?.nivel === 'ADM';
    const bloqueio = eraAdm && status === 'false' && this.#totalAdmsAtivos <= 1;
    $('#aviso-ultimo-adm').toggleClass('d-none', !bloqueio);
    $('#btn-salvar-usuario').prop('disabled', bloqueio);
  }

  /* ── Coleta de filtros ───────────────────────────────────────── */
  #coletarFiltros() {
    this.#filters = {};
    const nome   = $('#filtro-nome').val().trim();
    const perfil = $('#filtro-perfil').val();
    const status = $('#filtro-status').val();
    if (nome)          this.#filters.nome   = nome;
    if (perfil)        this.#filters.perfil = perfil;
    if (status !== '') this.#filters.status = status;
  }

  /* ── Helpers ─────────────────────────────────────────────────── */

  #infoNivel(nivel) {
    const mapa = {
      ADM:         { label: 'Administrador', bg: 'var(--color-primary)',    cls: 'text-white' },
      COLABORADOR: { label: 'Colaborador',   bg: 'var(--color-structural)', cls: 'text-white' },
      PAROQUIANO:  { label: 'Paroquiano',    bg: 'var(--color-text-muted)', cls: 'text-white' },
    };
    const info = mapa[nivel] ?? { label: nivel ?? '—', bg: '#888', cls: 'text-white' };
    return { label: info.label, cls: `text-white rounded-pill" style="background:${info.bg}` };
  }

  #iniciais(nome) {
    if (!nome) return '?';
    const partes = nome.trim().split(/\s+/);
    return (partes[0][0] + (partes[1]?.[0] ?? '')).toUpperCase();
  }

  /** Escapa caracteres HTML para evitar XSS na renderização de dados do backend. */
  #esc(v) {
    return String(v ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}
