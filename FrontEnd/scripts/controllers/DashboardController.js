/**
 * DashboardController — Controlador do layout principal.
 *
 * Responsabilidades:
 *  - Renderizar o menu lateral filtrado por perfil.
 *  - Inicializar comportamento de collapse/mobile do sidebar.
 *  - Exibir dados do usuário logado.
 */

const SIDEBAR_MENU = [
  { label: 'Dashboard',           icon: 'bi-speedometer2',     path: 'views/dashboard.html',              roles: ['PAROQUIANO', 'COLABORADOR', 'ADM'] },
  { section: 'Cadastros' },
    {
    label: 'Categorias', icon: 'bi-tags', roles: ['COLABORADOR', 'ADM'],
    children: [
      { label: 'Cat. Produtos', icon: 'bi-box-seam',        path: 'views/categorias/list.html' },
      { label: 'Cat. Eventos',         icon: 'bi-calendar2-range', path: 'views/eventos/categorias.html' },
    ]
  },
  { label: 'Produtos',            icon: 'bi-box-seam',          path: 'views/produtos/list.html',          roles: ['COLABORADOR', 'ADM'] },
  { label: 'Eventos',             icon: 'bi-calendar-event',    path: 'views/eventos/list.html',           roles: ['COLABORADOR', 'ADM'] },
  { label: 'Fornecedores',        icon: 'bi-truck',             path: 'views/fornecedores/list.html',      roles: ['COLABORADOR', 'ADM'] },
  { label: 'Formas Pgto.',        icon: 'bi-credit-card',       path: 'views/pagamentos/list.html',        roles: ['COLABORADOR', 'ADM'] },
  { label: 'Usuários',            icon: 'bi-people',            path: 'views/usuarios/list.html',          roles: ['ADM'] },
  { section: 'Eventos' },
  { label: 'Portal Eventos',      icon: 'bi-ticket-perforated', path: 'views/eventos/portal.html',         roles: ['PAROQUIANO', 'COLABORADOR', 'ADM'] },
  { section: 'Operacional' },
  {
    label: 'Caixa', icon: 'bi-cash', roles: ['COLABORADOR', 'ADM'],
    children: [
      { label: 'Abertura / Fechamento', icon: 'bi-door-open',        path: 'views/caixa/abertura.html' },
      { label: 'Movimentações',         icon: 'bi-arrow-left-right', path: 'views/caixa/movimentacoes.html' },
      { label: 'Contas a Receber',      icon: 'bi-receipt',          path: 'views/caixa/contas-receber.html' },
    ]
  },
  { label: 'Vendas',              icon: 'bi-cart3',             path: 'views/vendas/index.html',           roles: ['COLABORADOR', 'ADM'] },
  { label: 'Compras',             icon: 'bi-bag-plus',          path: 'views/compras/index.html',          roles: ['COLABORADOR', 'ADM'] },
  { section: 'Análise' },
  { label: 'Relatórios',          icon: 'bi-bar-chart-line',    path: 'views/relatorios/index.html',       roles: ['ADM'] },
  { section: 'Configurações' },
  { label: 'Parametrização',      icon: 'bi-sliders',           path: 'views/parametrizacao/index.html',   roles: ['ADM'] },
];

class DashboardController {
  #session = SessionManager.getInstance();
  #toast   = Toast.getInstance();

  init() {
    this.#renderUserInfo();
    this.#renderMenu();
    this.#bindSidebar();
    this.#bindNav();
    this.#bindLogout();
    // Registra estado inicial no histórico do browser
    history.replaceState({ path: window.location.pathname.replace(Router.BASE + '/', '') }, document.title);
  }

  // ── Dados do usuário ───────────────────────────────────────
  #renderUserInfo() {
    const user     = this.#session.getUser();
    const initials = user.nome.trim().split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase();
    const roleMap  = { PAROQUIANO: 'Paroquiano', COLABORADOR: 'Colaborador', ADM: 'Administrador' };

    $('#user-avatar').text(initials);
    $('#user-name').text(user.nome);
    $('#user-role').text(roleMap[user.nivel] || user.nivel);
  }

  // ── Menu lateral filtrado por perfil ──────────────────────
  #renderMenu() {
    const user    = this.#session.getUser();
    const current = window.location.pathname;

    const html = SIDEBAR_MENU.map(item => {
      if (item.section) {
        return `<div class="sidebar-section">${item.section}</div>`;
      }

      if (!item.roles.includes(user.nivel)) return '';

      // Item com submenu
      if (item.children) {
        const hasActiveChild = item.children.some(c => current.endsWith(c.path));
        const menuId = `sub-${item.label.toLowerCase().replace(/\W+/g, '-')}`;

        const childrenHtml = item.children.map(child => {
          const isActive = current.endsWith(child.path);
          return `
            <a href="${Router.BASE}/${child.path}"
               class="sidebar-subitem${isActive ? ' active' : ''}"
               ${isActive ? 'aria-current="page"' : ''}>
              <i class="bi ${child.icon}"></i>
              <span>${child.label}</span>
            </a>`;
        }).join('');

        return `
          <div class="sidebar-item-parent ${hasActiveChild ? 'has-active' : ''}"
               data-bs-toggle="collapse"
               data-bs-target="#${menuId}"
               aria-expanded="${hasActiveChild}"
               aria-controls="${menuId}"
               role="button">
            <i class="bi ${item.icon}"></i>
            <span>${item.label}</span>
            <i class="bi bi-chevron-down sidebar-arrow"></i>
          </div>
          <div class="sidebar-submenu collapse ${hasActiveChild ? 'show' : ''}" id="${menuId}">
            ${childrenHtml}
          </div>`;
      }

      // Item simples
      const isActive = current.endsWith(item.path);
      return `
        <a href="${Router.BASE}/${item.path}"
           class="sidebar-item${isActive ? ' active' : ''}"
           ${isActive ? 'aria-current="page"' : ''}>
          <i class="bi ${item.icon}"></i>
          <span>${item.label}</span>
        </a>`;
    }).join('');

    $('#sidebar-nav').html(html);
  }

  // ── Navegação SPA (sem reload da página) ──────────────────
  #bindNav() {
    // Intercepta todos os links da sidebar
    $('#sidebar-nav').on('click', 'a', async (e) => {
      e.preventDefault();

      const href         = $(e.currentTarget).attr('href');
      const relativePath = href.replace(Router.BASE + '/', '');

      PageLoader.setActive(relativePath);

      // Fecha sidebar mobile após clicar
      $('#sidebar').removeClass('mobile-open');
      $('#sidebar-overlay').removeClass('visible');

      await PageLoader.load(relativePath);
    });

    // Suporte ao botão Voltar/Avançar do browser
    window.addEventListener('popstate', (e) => {
      if (e.state?.path) PageLoader.load(e.state.path);
    });
  }

  // ── Comportamento do sidebar ───────────────────────────────
  #bindSidebar() {
    const $sidebar = $('#sidebar');

    // Estado já aplicado pelo SidebarLoader. Apenas salva nas mudanças.
    const syncRoot = () =>
      $('#sidebar-root').toggleClass('collapsed', $sidebar.hasClass('collapsed'));

    const save = () => {
      syncRoot();
      localStorage.setItem(SidebarLoader.KEY, $sidebar.hasClass('collapsed'));
    };

    // Botão de collapse/expand
    $('#sidebar-toggle').on('click', function () {
      $sidebar.toggleClass('collapsed');
      const isNowExpanded = !$sidebar.hasClass('collapsed');
      $(this).attr('aria-expanded', isNowExpanded)
             .attr('aria-label', (isNowExpanded ? 'Recolher' : 'Expandir') + ' menu');
      save();
    });

    // Clicar no corpo da sidebar recolhida expande ela
    // Links e submenus são excluídos: o estado deve ser preservado na navegação
    $sidebar.on('click', function (e) {
      if (!$sidebar.hasClass('collapsed')) return;
      if ($(e.target).closest('#sidebar-toggle, a, [data-bs-toggle]').length) return;
      $sidebar.removeClass('collapsed');
      $('#sidebar-toggle').attr('aria-expanded', true).attr('aria-label', 'Recolher menu');
      save();
    });

    // Clicar em item com submenu quando sidebar colapsada:
    // sempre expande a sidebar com o submenu aberto.
    $sidebar.on('click', '.sidebar-item-parent', function (e) {
      if (!$sidebar.hasClass('collapsed')) return;

      e.stopPropagation(); // impede o Bootstrap de fechar um submenu já aberto

      // const targetSel  = $(this).attr('data-bs-target');

      // const collapseEl = targetSel ? document.querySelector(targetSel) : null;

      // console.log(collapseEl);

      // const jaAberto   = collapseEl?.classList.contains('show');

      $sidebar.removeClass('collapsed');
      $(this).attr('aria-expanded', 'true').attr('aria-label', 'Recolher menu');
      // $('#sidebar-toggle').attr('aria-expanded', true).attr('aria-label', 'Recolher menu');
      save();

      // Se já estava aberto: aparece naturalmente (display:none!important foi removido).
      // Se estava fechado: anima a abertura após a transição da sidebar.
      // if (!jaAberto && collapseEl) {
      //   setTimeout(() => {
      //     bootstrap.Collapse.getOrCreateInstance(collapseEl, { toggle: false }).show();
      //     $(this).attr('aria-expanded', 'true');
      //   }, 260);
      // }
    });

    // Abrir mobile
    $('#mobile-menu-toggle').on('click', () => {
      $sidebar.addClass('mobile-open');
      $('#sidebar-overlay').addClass('visible');
    });

    // Fechar mobile ao clicar no overlay
    $('#sidebar-overlay').on('click', () => {
      $sidebar.removeClass('mobile-open');
      $('#sidebar-overlay').removeClass('visible');
    });

    // Fechar mobile ao navegar
    $sidebar.on('click', '.sidebar-item', () => {
      $sidebar.removeClass('mobile-open');
      $('#sidebar-overlay').removeClass('visible');
    });
  }

  // ── Logout ─────────────────────────────────────────────────
  #bindLogout() {
    $('#btn-logout').on('click', () => {
      this.#toast.info('Até logo!', 'Sua sessão foi encerrada.');
      setTimeout(() => this.#session.logout(), 500);
    });
  }
}
