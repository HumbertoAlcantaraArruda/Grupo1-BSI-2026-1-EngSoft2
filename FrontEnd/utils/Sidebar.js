/**
 * Sidebar.js — Componente de navegação lateral injetado em todas as telas.
 *
 * Padrões aplicados:
 *   Pure Fabrication (GRASP) — classe criada por conveniência técnica, sem
 *     correspondência direta no domínio de negócio.
 *   Low Coupling (GRASP)    — comunica com venda.js via window.AGAPE_VENDA_GUARDIAO,
 *     sem importação direta.
 *
 * Funcionalidades:
 *   1. Injeção de HTML dinâmico filtrado por nível de usuário.
 *   2. Submenus: itens com `filhos[]` exibem chevron + expand/collapse.
 *   3. Expansão automática: clicar em pai com submenus expande a sidebar colapsada.
 *   4. Guardião de Navegação: intercepta nav-links quando há venda ativa.
 *   5. Toggle desktop + overlay mobile.
 */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Utils = window.AGAPE.Utils || {};

window.AGAPE.Utils.Sidebar = (function () {

    // ── Definição dos itens do menu ───────────────────────────────────────────
    // Itens com `filhos` criam submenus expansíveis com chevron rotativo.

    var _itens = [
        {
            rotulo: 'Realizar Venda',
            href:   'venda.html',
            icone:  'bi-cart3',
            niveis: ['ADM', 'COLAB']
        },
        {
            rotulo: 'Cadastros',
            icone:  'bi-archive',
            niveis: ['ADM', 'COLAB'],
            filhos: [
                { rotulo: 'Produtos',             href: 'produtos.html',         icone: 'bi-box-seam',       niveis: ['ADM', 'COLAB'] },
                { rotulo: 'Categoria de Produto', href: 'categoriaProduto.html', icone: 'bi-tags',           niveis: ['ADM', 'COLAB'] },
                { rotulo: 'Categoria de Evento',  href: 'categoriaEvento.html',  icone: 'bi-calendar-event', niveis: ['ADM', 'COLAB'] },
                { rotulo: 'Forma de Pagamento',   href: 'formaPagamento.html',   icone: 'bi-credit-card',    niveis: ['ADM', 'COLAB'] },
                { rotulo: 'Fornecedor',           href: 'fornecedor.html',       icone: 'bi-truck',          niveis: ['ADM', 'COLAB'] }
            ]
        }
    ];

    var _itensConfig = [
        { rotulo: 'Usuários',       href: 'usuarios.html',       icone: 'bi-people', niveis: ['ADM'] },
        { rotulo: 'Parametrização', href: 'parametrizacao.html', icone: 'bi-gear',   niveis: ['ADM'] }
    ];

    // ── Utilitários internos ──────────────────────────────────────────────────

    function _filtrarPorNivel(lista, nivel) {
        return lista.filter(function (item) {
            return !item.niveis || item.niveis.indexOf(nivel) !== -1;
        });
    }

    function _paginaAtual() {
        var caminho = window.location.pathname;
        return caminho.substring(caminho.lastIndexOf('/') + 1);
    }

    // Verifica se algum filho está na página atual (para marcar o pai como ativo)
    function _filhoAtivo(item) {
        if (!item.filhos) return false;
        var pg = _paginaAtual();
        return item.filhos.some(function (f) { return f.href === pg; });
    }

    // ── Construção do HTML ────────────────────────────────────────────────────

    function _construirHtml() {
        var paginaAtual = _paginaAtual();
        var auth        = window.AGAPE.Utils.Auth ? window.AGAPE.Utils.Auth.getInstance() : null;
        var usuario     = auth ? auth.getUsuario() : null;
        var nomeUsuario = usuario && usuario.nome  ? usuario.nome  : '';
        var nivel       = usuario && usuario.nivel ? usuario.nivel : '';

        // Monta item simples (sem filhos)
        function _itemSimples(item) {
            var ativo = (paginaAtual === item.href) ? ' ativo' : '';
            return (
                '<li class="nav-item">' +
                '<a class="nav-link' + ativo + '" href="' + item.href + '" data-href="' + item.href + '">' +
                '<i class="bi ' + item.icone + '"></i>' +
                '<span>' + item.rotulo + '</span>' +
                '</a></li>'
            );
        }

        // Monta item com submenus (filhos) — padrão Composite estrutural
        function _itemComFilhos(item) {
            var haAtivo     = _filhoAtivo(item);
            var classeAberto = haAtivo ? ' submenu-aberto' : '';
            var filhosFiltrados = _filtrarPorNivel(item.filhos, nivel);
            if (filhosFiltrados.length === 0) return '';

            var filhosHtml = filhosFiltrados.map(function (filho) {
                var ativo = (paginaAtual === filho.href) ? ' ativo' : '';
                return (
                    '<li class="nav-item-filho">' +
                    '<a class="nav-link nav-link-filho' + ativo + '" href="' + filho.href +
                    '" data-href="' + filho.href + '">' +
                    '<i class="bi ' + filho.icone + '"></i>' +
                    '<span>' + filho.rotulo + '</span>' +
                    '</a></li>'
                );
            }).join('');

            return (
                '<li class="nav-item nav-item-pai">' +
                '<a class="nav-link nav-link-pai' + (haAtivo ? ' ativo' : '') + '"' +
                ' data-rotulo="' + item.rotulo + '" role="button" tabindex="0">' +
                '<i class="bi ' + item.icone + '"></i>' +
                '<span>' + item.rotulo + '</span>' +
                // Chevron rotativo — indica expansão/colapso do submenu
                '<i class="bi bi-chevron-down nav-chevron ms-auto"></i>' +
                '</a>' +
                '<ul class="list-unstyled nav-submenu' + classeAberto + '">' +
                filhosHtml +
                '</ul>' +
                '</li>'
            );
        }

        function _montarItem(item) {
            if (item.filhos && item.filhos.length > 0) return _itemComFilhos(item);
            return _itemSimples(item);
        }

        var nivelStr = { PAROQ: 'Paroquiano', COLAB: 'Colaborador', ADM: 'Administrador' }[nivel] || 'Desconhecido';

        var blocoUsuario = nomeUsuario
            ? '<div class="sidebar-usuario px-3 py-2 small">' +
              '<div class="text-white"><i class="bi bi-person-circle me-1"></i>' + nomeUsuario + '</div>' +
              (nivel ? '<div class="text-white">Perfil: ' + nivelStr + '</div>' : '') +
              '</div>'
            : '';

        var itensFiltrados       = _filtrarPorNivel(_itens,       nivel);
        var itensConfigFiltrados = _filtrarPorNivel(_itensConfig, nivel);

        var secaoCadastros = itensFiltrados.length > 0
            ? '<p class="nav-secao">Menu</p>' +
              '<ul class="list-unstyled mb-0">' + itensFiltrados.map(_montarItem).join('') + '</ul>'
            : '';

        var secaoConfig = itensConfigFiltrados.length > 0
            ? '<p class="nav-secao">Configurações</p>' +
              '<ul class="list-unstyled mb-0">' + itensConfigFiltrados.map(_montarItem).join('') + '</ul>'
            : '';

        return (
            '<div class="sidebar-cabecalho">' +
            '<div class="sidebar-marca">' +
            '<div class="sidebar-logo">AGAPE</div>' +
            '<div class="sidebar-subtitulo">Gestão Paroquial</div>' +
            '</div>' +
            '<button class="sidebar-toggle" id="btn-sidebar-toggle" title="Recolher menu">' +
            '<i class="bi bi-chevron-left"></i>' +
            '</button>' +
            '</div>' +
            '<nav class="sidebar-nav">' +
            secaoCadastros +
            secaoConfig +
            '</nav>' +
            '<div class="sidebar-rodape p-3">' +
            '<button type="button" class="btn btn-primary w-100" id="btn-sair">' +
            '<i class="bi bi-box-arrow-left"></i>' +
            '<span class="sidebar-rodape-texto ms-1">Sair</span>' +
            '</button>' +
            '</div>' +
            blocoUsuario
        );
    }

    // ── CSS dos submenus (injetado uma única vez) ─────────────────────────────

    function _injetarEstilosSubmenu() {
        if (document.getElementById('agape-sidebar-submenu-css')) return;
        var style = document.createElement('style');
        style.id  = 'agape-sidebar-submenu-css';
        style.textContent = [
            /* Submenu fechado: altura 0, sem visibilidade */
            '.nav-submenu { max-height: 0; overflow: hidden;',
            '  transition: max-height .25s ease, opacity .2s ease;',
            '  opacity: 0; padding-left: .5rem; list-style: none; }',

            /* Submenu aberto */
            '.nav-submenu.submenu-aberto { max-height: 400px; opacity: 1; }',

            /* Filho recuado */
            '.nav-link-filho { padding-left: 1.75rem !important; font-size: .85rem; }',

            /* Chevron: roda 180° quando aberto */
            '.nav-chevron { transition: transform .25s ease; font-size: .75rem; }',
            '.nav-link-pai.submenu-pai-aberto .nav-chevron { transform: rotate(180deg); }'
        ].join('\n');
        document.head.appendChild(style);
    }

    // ── Submenus: toggle expansão/colapso ────────────────────────────────────

    function _bindSubmenus(sidebar) {
        sidebar.querySelectorAll('.nav-link-pai').forEach(function (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();

                // Expansão automática: se sidebar colapsada, expande primeiro (UX inteligente)
                if (sidebar.classList.contains('sidebar-colapsada')) {
                    sidebar.classList.remove('sidebar-colapsada');
                    localStorage.setItem('agape_sidebar_colapsada', 'false');
                    _atualizarIconeToggle(sidebar, false);
                    // Abre o submenu após a transição de expansão da sidebar
                    setTimeout(function () { _toggleSubmenu(this, sidebar); }.bind(this), 260);
                    return;
                }

                _toggleSubmenu(this, sidebar);
            });

            // Acessibilidade: Enter/Espaço também abre o submenu
            link.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    link.click();
                }
            });
        });

        // Inicia com pais que possuem filhos ativos já abertos
        sidebar.querySelectorAll('.nav-link-pai.ativo').forEach(function (link) {
            _abrirSubmenu(link);
        });
    }

    function _toggleSubmenu(link, sidebar) {
        var submenu = link.nextElementSibling;
        if (!submenu || !submenu.classList.contains('nav-submenu')) return;

        var estaAberto = submenu.classList.contains('submenu-aberto');
        if (estaAberto) {
            submenu.classList.remove('submenu-aberto');
            link.classList.remove('submenu-pai-aberto');
        } else {
            // Fecha outros submenus abertos (accordion)
            sidebar.querySelectorAll('.nav-submenu.submenu-aberto').forEach(function (s) {
                s.classList.remove('submenu-aberto');
                if (s.previousElementSibling) {
                    s.previousElementSibling.classList.remove('submenu-pai-aberto');
                }
            });
            _abrirSubmenu(link);
        }
    }

    function _abrirSubmenu(link) {
        var submenu = link.nextElementSibling;
        if (!submenu) return;
        submenu.classList.add('submenu-aberto');
        link.classList.add('submenu-pai-aberto');
    }

    // ── Guardião de Navegação ─────────────────────────────────────────────────

    /**
     * _bindGuardiao — intercepta todos os cliques em nav-links.
     * Se window.AGAPE_VENDA_GUARDIAO for uma função que retorna true,
     * exibe modal de confirmação antes de navegar.
     *
     * Low Coupling (GRASP) — Sidebar não importa venda.js; usa contrato global.
     * Protected Variation (GRASP) — ponto de variação isolado: só o guardião muda.
     */
    function _bindGuardiao(sidebar) {
        sidebar.addEventListener('click', function (e) {
            var link = e.target.closest('.nav-link[data-href]');
            if (!link) return;

            var guardiao = window.AGAPE_VENDA_GUARDIAO;
            if (typeof guardiao !== 'function' || !guardiao()) return;

            // Há venda ativa — bloquear e perguntar
            e.preventDefault();
            var destino = link.getAttribute('data-href');
            _mostrarModalGuardiao(destino);
        });
    }

    function _mostrarModalGuardiao(destino) {
        var id = 'modal-guardiao-venda';
        if (!document.getElementById(id)) {
            var el = document.createElement('div');
            el.id = id;
            el.style.cssText =
                'position:fixed;inset:0;background:rgba(0,0,0,.55);' +
                'z-index:10000;display:flex;align-items:center;justify-content:center;';
            el.innerHTML =
                '<div style="background:#fff;border-radius:.75rem;max-width:460px;width:90%;' +
                'box-shadow:0 8px 32px rgba(0,0,0,.2);padding:2rem;text-align:center;">' +
                '<i class="bi bi-cart-x-fill" style="font-size:2.75rem;color:#dc3545;"></i>' +
                '<h5 style="margin:.75rem 0 .5rem;font-weight:700;">Venda em andamento</h5>' +
                '<p style="color:#6c757d;font-size:.9rem;margin-bottom:1.5rem;">' +
                'Deseja cancelar a venda e sair?<br>' +
                '<strong>Dados não salvos serão perdidos.</strong>' +
                '</p>' +
                '<div style="display:flex;gap:.75rem;justify-content:center;">' +
                '<button id="btn-guardiao-cancelar" class="btn btn-outline-secondary">' +
                '<i class="bi bi-arrow-left me-1"></i>Voltar à venda</button>' +
                '<button id="btn-guardiao-confirmar" class="btn btn-danger">' +
                '<i class="bi bi-box-arrow-right me-1"></i>Cancelar e sair</button>' +
                '</div></div>';
            document.body.appendChild(el);
        }

        var overlay = document.getElementById(id);
        overlay.style.display = 'flex';

        document.getElementById('btn-guardiao-confirmar').onclick = function () {
            // Limpa guardião e navega
            window.AGAPE_VENDA_GUARDIAO = null;
            window.location.href = destino;
        };
        document.getElementById('btn-guardiao-cancelar').onclick = function () {
            overlay.style.display = 'none';
        };
    }

    // ── Logout ────────────────────────────────────────────────────────────────

    function _bindLogout() {
        var btn = document.getElementById('btn-sair');
        if (!btn) return;
        btn.addEventListener('click', function () {
            var auth    = window.AGAPE.Utils.Auth ? window.AGAPE.Utils.Auth.getInstance() : null;
            var usuario = auth ? auth.getUsuario() : null;

            if (usuario && usuario.nivel === 'ADM' &&
                sessionStorage.getItem('agape_param_pendente') === '1') {
                _mostrarModalParamPendente(auth);
                return;
            }

            if (auth) auth.logout();
        });
    }

    function _mostrarModalParamPendente(auth) {
        var id = 'modal-param-pendente';
        if (!document.getElementById(id)) {
            var el = document.createElement('div');
            el.id = id;
            el.style.cssText =
                'position:fixed;inset:0;background:rgba(0,0,0,.55);' +
                'z-index:10000;display:flex;align-items:center;justify-content:center;';
            el.innerHTML =
                '<div style="background:#fff;border-radius:.75rem;max-width:440px;width:90%;' +
                'box-shadow:0 8px 32px rgba(0,0,0,.2);padding:2rem;text-align:center;">' +
                '<i class="bi bi-exclamation-triangle-fill" style="font-size:2.75rem;color:#f59e0b;"></i>' +
                '<h5 style="margin:.75rem 0 .5rem;font-weight:700;">Parametrização incompleta</h5>' +
                '<p style="color:#6c757d;font-size:.9rem;margin-bottom:1.5rem;">' +
                'Os dados referentes à empresa ainda não foram preenchidos.<br>' +
                'Deseja sair do sistema mesmo assim?' +
                '</p>' +
                '<div style="display:flex;gap:.75rem;justify-content:center;">' +
                '<button id="btn-param-cancelar" class="btn btn-outline-secondary">' +
                '<i class="bi bi-arrow-left me-1"></i>Voltar</button>' +
                '<button id="btn-param-confirmar" class="btn btn-danger">' +
                '<i class="bi bi-box-arrow-right me-1"></i>Confirmar saída</button>' +
                '</div></div>';
            document.body.appendChild(el);
        }

        var overlay = document.getElementById(id);
        overlay.style.display = 'flex';

        document.getElementById('btn-param-confirmar').onclick = function () {
            if (auth) auth.logout();
        };
        document.getElementById('btn-param-cancelar').onclick = function () {
            overlay.style.display = 'none';
        };
    }

    // ── Parametrização pendente ───────────────────────────────────────────────

    function _verificarParametrizacaoPendente() {
        var auth    = window.AGAPE.Utils.Auth ? window.AGAPE.Utils.Auth.getInstance() : null;
        var usuario = auth ? auth.getUsuario() : null;
        if (!usuario || usuario.nivel !== 'ADM') return;
        if (sessionStorage.getItem('agape_param_pendente') !== '1') return;

        var paginaAtual = _paginaAtual();
        if (paginaAtual !== 'parametrizacao.html') {
            window.location.replace('./parametrizacao.html');
        }
    }

    // ── Toggle desktop ────────────────────────────────────────────────────────

    function _atualizarIconeToggle(sidebar, colapsada) {
        var icone = sidebar.querySelector('#btn-sidebar-toggle i');
        var btn   = sidebar.querySelector('#btn-sidebar-toggle');
        if (icone) icone.className = colapsada ? 'bi bi-chevron-right' : 'bi bi-chevron-left';
        if (btn)   btn.title       = colapsada ? 'Expandir menu' : 'Recolher menu';
    }

    function _bindToggleDesktop(sidebar) {
        if (localStorage.getItem('agape_sidebar_colapsada') === 'true') {
            sidebar.classList.add('sidebar-colapsada');
            _atualizarIconeToggle(sidebar, true);
        }

        var btn = document.getElementById('btn-sidebar-toggle');
        if (!btn) return;

        btn.addEventListener('click', function () {
            var colapsada = sidebar.classList.toggle('sidebar-colapsada');
            localStorage.setItem('agape_sidebar_colapsada', colapsada ? 'true' : 'false');
            _atualizarIconeToggle(sidebar, colapsada);
        });
    }

    // ── Mobile ────────────────────────────────────────────────────────────────

    function _injetarHamburger(sidebar) {
        var topbar = document.querySelector('.topbar');
        if (!topbar || document.getElementById('btn-sidebar-mobile')) return;

        var overlay   = document.getElementById('sidebar-overlay');
        var hamburger = document.createElement('button');
        hamburger.id        = 'btn-sidebar-mobile';
        hamburger.className = 'topbar-toggle-mobile';
        hamburger.title     = 'Menu';
        hamburger.innerHTML = '<i class="bi bi-list"></i>';

        hamburger.addEventListener('click', function () {
            sidebar.classList.add('sidebar-aberta');
            if (overlay) overlay.classList.add('visivel');
        });

        topbar.insertBefore(hamburger, topbar.firstChild);
    }

    function _bindExpandOnClick(sidebar) {
        sidebar.addEventListener('click', function (e) {
            if (!sidebar.classList.contains('sidebar-colapsada')) return;
            if (e.target.closest('.sidebar-toggle')) return;
            if (e.target.closest('.nav-link[data-href]')) return;
            sidebar.classList.remove('sidebar-colapsada');
            localStorage.setItem('agape_sidebar_colapsada', 'false');
            _atualizarIconeToggle(sidebar, false);
        });
    }

    function _injetarOverlay(sidebar) {
        if (document.getElementById('sidebar-overlay')) return;

        var overlay = document.createElement('div');
        overlay.id = 'sidebar-overlay';
        overlay.addEventListener('click', function () {
            sidebar.classList.remove('sidebar-aberta');
            overlay.classList.remove('visivel');
        });
        document.body.appendChild(overlay);
    }

    // ── API pública ───────────────────────────────────────────────────────────

    function inicializar(seletorAlvo) {
        _verificarParametrizacaoPendente();
        _injetarEstilosSubmenu();

        var sidebar = document.getElementById(seletorAlvo || 'sidebar-wrapper');
        if (!sidebar) {
            console.warn('[Sidebar] Elemento não encontrado: #' + (seletorAlvo || 'sidebar-wrapper'));
            return;
        }

        sidebar.innerHTML = _construirHtml();

        _bindLogout();
        _bindGuardiao(sidebar);     // Guardião de Navegação
        _bindSubmenus(sidebar);     // Submenus com chevron rotativo
        _injetarOverlay(sidebar);
        _bindToggleDesktop(sidebar);
        _bindExpandOnClick(sidebar);
        _injetarHamburger(sidebar);
    }

    function registrarItem(item) {
        _itens.push(item);
    }

    return { inicializar: inicializar, registrarItem: registrarItem };

})();
