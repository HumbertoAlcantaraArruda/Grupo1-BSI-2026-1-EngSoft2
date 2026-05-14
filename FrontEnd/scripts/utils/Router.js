/**
 * Router — Proteção de rotas e navegação centralizada.
 *
 * BASE é calculado dinamicamente a partir da URL atual,
 * buscando o segmento "/FrontEnd" no pathname.
 * Se servido pela raiz, funciona como string vazia.
 */
const Router = (() => {
  // Detecta o prefixo do projeto (ex: /EGSII/Grupo1-BSI-2026-1-EngSoft2/FrontEnd)
  const _path   = window.location.pathname;
  const _marker = '/FrontEnd';
  const _idx    = _path.lastIndexOf(_marker);
  const BASE    = window.location.origin + (_idx >= 0 ? _path.substring(0, _idx + _marker.length) : '');

  // roles = perfis que têm acesso; hierarquia: ADM inclui COLABORADOR inclui PAROQUIANO
  const ROUTES = [
    { path: 'index.html',                    public: true  },
    { path: 'views/dashboard.html',          roles: ['PAROQUIANO', 'COLABORADOR', 'ADM'] },
    { path: 'views/usuarios/list.html',      roles: ['ADM'] },
    { path: 'views/produtos/list.html',      roles: ['COLABORADOR', 'ADM'] },
    { path: 'views/eventos/list.html',       roles: ['COLABORADOR', 'ADM'] },
    { path: 'views/eventos/portal.html',     roles: ['PAROQUIANO', 'COLABORADOR', 'ADM'] },
    { path: 'views/fornecedores/list.html',  roles: ['COLABORADOR', 'ADM'] },
    { path: 'views/caixa/index.html',             roles: ['COLABORADOR', 'ADM'] },
    { path: 'views/caixa/abertura.html',          roles: ['COLABORADOR', 'ADM'] },
    { path: 'views/caixa/movimentacoes.html',     roles: ['COLABORADOR', 'ADM'] },
    { path: 'views/caixa/contas-receber.html',    roles: ['COLABORADOR', 'ADM'] },
    { path: 'views/vendas/index.html',            roles: ['COLABORADOR', 'ADM'] },
    { path: 'views/compras/index.html',      roles: ['COLABORADOR', 'ADM'] },
    { path: 'views/relatorios/index.html',   roles: ['ADM'] },
  ];

  function protect() {
    const session = SessionManager.getInstance();

    if (!session.isAuthenticated()) {
      window.location.replace(BASE + '/index.html');
      return false;
    }

    const pathname = window.location.pathname;
    const route    = ROUTES.find(r => !r.public && pathname.endsWith(r.path));
    if (!route) return true;

    const userRole = session.getUser().nivel;
    if (!route.roles.includes(userRole)) {
      window.location.replace(BASE + '/' + getHomeByRole(userRole));
      return false;
    }
    return true;
  }

  function navigateTo(relativePath) {
    window.location.href = BASE + '/' + relativePath;
  }

  function getHomeByRole(nivel) {
    const homes = {
      PAROQUIANO:  'views/eventos/portal.html',
      COLABORADOR: 'views/dashboard.html',
      ADM:         'views/dashboard.html',
    };
    return homes[nivel] || 'views/dashboard.html';
  }

  return { protect, navigateTo, getHomeByRole, BASE };
})();
