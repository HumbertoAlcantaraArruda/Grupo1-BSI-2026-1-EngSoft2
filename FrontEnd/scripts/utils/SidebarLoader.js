/**
 * SidebarLoader
 * Injeta a estrutura HTML da sidebar em #sidebar-root.
 *
 * O estado collapsed é aplicado ANTES do browser pintar (mesmo frame),
 * evitando flash de layout entre navegações.
 */
const SidebarLoader = {
  KEY: 'agape_sidebar_collapsed',

  async load() {
    const root = document.getElementById('sidebar-root');
    if (!root) return;

    const base      = Router.BASE;
    const collapsed = localStorage.getItem(this.KEY) === 'true';

    // Propaga 'collapsed' ao container pai para que o seletor CSS ~ funcione
    if (collapsed) root.classList.add('collapsed');

    // A classe "collapsed" e "no-transition" são injetadas direto no HTML
    // para que o browser já receba o estado correto no primeiro paint.
    root.insertAdjacentHTML('afterbegin', `
      <aside class="sidebar no-transition${collapsed ? ' collapsed' : ''}"
             id="sidebar"
             role="navigation"
             aria-label="Menu principal">

        <div class="sidebar-header">
          <img src="${base}/assets/img/agape_horizontal.png" alt="AGAPE" class="sidebar-logo">
          <button
            class="sidebar-toggle"
            id="sidebar-toggle"
            aria-label="${collapsed ? 'Expandir' : 'Recolher'} menu"
            aria-expanded="${!collapsed}"
            aria-controls="sidebar-nav"
          >
            <i class="bi bi-layout-sidebar-reverse"></i>
          </button>
        </div>

        <nav class="sidebar-nav" id="sidebar-nav" aria-label="Navegação principal">
          <!-- preenchido pelo DashboardController -->
        </nav>

        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar" id="user-avatar" aria-hidden="true">--</div>
            <div class="user-details">
              <div class="user-name" id="user-name">Carregando…</div>
              <div class="user-role" id="user-role">—</div>
            </div>
          </div>
        </div>

      </aside>

      <div class="sidebar-overlay" id="sidebar-overlay" role="presentation"></div>
    `);

    // Após dois frames, remove no-transition para que futuras animações funcionem
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        document.getElementById('sidebar')?.classList.remove('no-transition')
      )
    );
  }
};
