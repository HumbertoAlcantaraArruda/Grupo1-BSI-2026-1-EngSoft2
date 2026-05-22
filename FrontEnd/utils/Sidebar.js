/**
 * Sidebar.js — Componente de navegação lateral injetado em todas as telas.
 */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Utils = window.AGAPE.Utils || {};

window.AGAPE.Utils.Sidebar = (function ($) {

    // ── Definição dos itens do menu ───────────────────────────────────────────

    var _itens = [
        {
            rotulo: 'Eventos Disponíveis',
            href:   '../paroquiano/eventosDisponiveis.html',
            icone:  'bi-calendar-check',
            niveis: ['PAROQ']
        },
        {
            rotulo: 'Realizar Venda',
            href:   '../vendas/venda.html',
            icone:  'bi-cart3',
            niveis: ['ADM', 'COLAB']
        },
        {
            rotulo: 'Realizar Inscrição',
            href:   '../inscricoes/inscricao.html',
            icone:  'bi-person-check',
            niveis: ['ADM', 'COLAB']
        },
        // Grupo "Cadastros" com expansão inteligente por chevron (RF_F1 UX)
        {
            rotulo: 'Cadastros',
            icone:  'bi-archive',
            niveis: ['ADM', 'COLAB'],
            filhos: [
                { rotulo: 'Produtos',             href: '../produtos/produtos.html',             icone: 'bi-box-seam',       niveis: ['ADM', 'COLAB'] },
                { rotulo: 'Categoria de Produto', href: '../produtos/categoriaProduto.html',     icone: 'bi-tags',           niveis: ['ADM', 'COLAB'] },
                { rotulo: 'Categoria de Evento',  href: '../eventos/categoriaEvento.html',       icone: 'bi-calendar-event', niveis: ['ADM', 'COLAB'] },
                { rotulo: 'Forma de Pagamento',   href: '../pagamentos/formaPagamento.html',     icone: 'bi-credit-card',    niveis: ['ADM', 'COLAB'] },
                { rotulo: 'Fornecedor',           href: '../fornecedores/fornecedor.html',       icone: 'bi-truck',          niveis: ['ADM', 'COLAB'] },
                { rotulo: 'Controlar Eventos',    href: '../eventos/evento.html',                icone: 'bi-calendar-plus',  niveis: ['ADM', 'COLAB'] }
            ]
        }
    ];

    var _itensConfig = [
        { rotulo: 'Usuários',       href: '../usuarios/usuarios.html',             icone: 'bi-people', niveis: ['ADM'] },
        { rotulo: 'Parametrização', href: '../parametrizacoes/parametrizacao.html',icone: 'bi-gear',   niveis: ['ADM'] }
    ];

    // ── Utilitários internos ──────────────────────────────────────────────────

    function _filtrarPorNivel(lista, nivel) {
        return lista.filter(function (item) {
            return !item.niveis || item.niveis.indexOf(nivel) !== -1;
        });
    }

    // Retorna apenas o nome do arquivo da URL atual (ex.: "produtos.html")
    function _paginaAtual() {
        var caminho = window.location.pathname;
        return caminho.substring(caminho.lastIndexOf('/') + 1);
    }

    // Compara somente o filename do href com a página atual
    function _eAtivo(href) {
        return _paginaAtual() === href.split('/').pop();
    }

    function _filhoAtivo(item) {
        if (!item.filhos) return false;
        return item.filhos.some(function (f) { return _eAtivo(f.href); });
    }

    // ── Construção do HTML ────────────────────────────────────────────────────

    function _construirHtml() {
        var auth        = window.AGAPE.Utils.Auth ? window.AGAPE.Utils.Auth.getInstance() : null;
        var usuario     = auth ? auth.getUsuario() : null;
        var nomeUsuario = usuario && usuario.nome  ? usuario.nome  : '';
        var nivel       = usuario && usuario.nivel ? usuario.nivel : '';

        function _itemSimples(item) {
            var ativo = _eAtivo(item.href) ? ' ativo' : '';
            return (
                '<li class="nav-item">' +
                '<a class="nav-link' + ativo + '" href="' + item.href + '" data-href="' + item.href + '">' +
                '<i class="bi ' + item.icone + '"></i>' +
                '<span>' + item.rotulo + '</span>' +
                '</a></li>'
            );
        }

        function _itemComFilhos(item) {
            var haAtivo          = _filhoAtivo(item);
            var classeAberto     = haAtivo ? ' submenu-aberto' : '';
            var filhosFiltrados  = _filtrarPorNivel(item.filhos, nivel);
            if (filhosFiltrados.length === 0) return '';

            var filhosHtml = filhosFiltrados.map(function (filho) {
                var ativo = _eAtivo(filho.href) ? ' ativo' : '';
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
            ? '<p class="nav-secao">Cadastros</p>' +
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
        if ($('#agape-sidebar-submenu-css').length) return;
        $('<style>').attr('id', 'agape-sidebar-submenu-css').text([
            '.nav-submenu { max-height: 0; overflow: hidden;',
            '  transition: max-height .25s ease, opacity .2s ease;',
            '  opacity: 0; padding-left: .5rem; list-style: none; }',
            '.nav-submenu.submenu-aberto { max-height: 400px; opacity: 1; }',
            '.nav-link-filho { padding-left: 1.75rem !important; font-size: .85rem; }',
            '.nav-chevron { transition: transform .25s ease; font-size: .75rem; }',
            '.nav-link-pai.submenu-pai-aberto .nav-chevron { transform: rotate(180deg); }'
        ].join('\n')).appendTo('head');
    }

    // ── Submenus: toggle expansão/colapso ────────────────────────────────────

    function _bindSubmenus($sidebar) {
        $sidebar.find('.nav-link-pai').each(function () {
            var $link = $(this);

            $link.on('click', function (e) {
                e.preventDefault();

                if ($sidebar.hasClass('sidebar-colapsada')) {
                    $sidebar.removeClass('sidebar-colapsada');
                    localStorage.setItem('agape_sidebar_colapsada', 'false');
                    _atualizarIconeToggle(false);
                    setTimeout(function () { _toggleSubmenu($link, $sidebar); }, 260);
                    return;
                }

                _toggleSubmenu($link, $sidebar);
            });

            $link.on('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    $link.trigger('click');
                }
            });
        });

        $sidebar.find('.nav-link-pai.ativo').each(function () {
            _abrirSubmenu($(this));
        });
    }

    function _toggleSubmenu($link, $sidebar) {
        var $submenu = $link.next('.nav-submenu');
        if (!$submenu.length) return;

        if ($submenu.hasClass('submenu-aberto')) {
            $submenu.removeClass('submenu-aberto');
            $link.removeClass('submenu-pai-aberto');
        } else {
            $sidebar.find('.nav-submenu.submenu-aberto').each(function () {
                $(this).removeClass('submenu-aberto').prev().removeClass('submenu-pai-aberto');
            });
            _abrirSubmenu($link);
        }
    }

    function _abrirSubmenu($link) {
        $link.next('.nav-submenu').addClass('submenu-aberto');
        $link.addClass('submenu-pai-aberto');
    }

    // ── Guardião de Navegação ─────────────────────────────────────────────────

    function _bindGuardiao($sidebar) {
        $sidebar.on('click', function (e) {
            var $link = $(e.target).closest('.nav-link[data-href]');
            if (!$link.length) return;

            var guardiao = window.AGAPE_VENDA_GUARDIAO;
            if (typeof guardiao !== 'function' || !guardiao()) return;

            e.preventDefault();
            _mostrarModalGuardiao($link.attr('data-href'));
        });
    }

    function _mostrarModalGuardiao(destino) {
        var id = 'modal-guardiao-venda';
        if (!$('#' + id).length) {
            $('<div>').attr('id', id).css({
                position:        'fixed',
                inset:           0,
                background:      'rgba(0,0,0,.55)',
                'z-index':       10000,
                display:         'flex',
                'align-items':   'center',
                'justify-content': 'center'
            }).html(
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
                '</div></div>'
            ).appendTo('body');
        }

        var $overlay = $('#' + id).css('display', 'flex');

        $('#btn-guardiao-confirmar').off('click').on('click', function () {
            window.AGAPE_VENDA_GUARDIAO = null;
            window.location.href = destino;
        });
        $('#btn-guardiao-cancelar').off('click').on('click', function () {
            $overlay.hide();
        });
    }

    // ── Logout ────────────────────────────────────────────────────────────────

    function _bindLogout() {
        $('#btn-sair').on('click', function () {
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
        if (!$('#' + id).length) {
            $('<div>').attr('id', id).css({
                position:        'fixed',
                inset:           0,
                background:      'rgba(0,0,0,.55)',
                'z-index':       10000,
                display:         'flex',
                'align-items':   'center',
                'justify-content': 'center'
            }).html(
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
                '</div></div>'
            ).appendTo('body');
        }

        var $overlay = $('#' + id).css('display', 'flex');

        $('#btn-param-confirmar').off('click').on('click', function () {
            if (auth) auth.logout();
        });
        $('#btn-param-cancelar').off('click').on('click', function () {
            $overlay.hide();
        });
    }

    // ── Parametrização pendente ───────────────────────────────────────────────

    function _verificarParametrizacaoPendente() {
        var auth    = window.AGAPE.Utils.Auth ? window.AGAPE.Utils.Auth.getInstance() : null;
        var usuario = auth ? auth.getUsuario() : null;
        if (!usuario || usuario.nivel !== 'ADM') return;
        if (sessionStorage.getItem('agape_param_pendente') !== '1') return;

        if (_paginaAtual() !== 'parametrizacao.html') {
            window.location.replace('../parametrizacoes/parametrizacao.html');
        }
    }

    // ── Toggle desktop ────────────────────────────────────────────────────────

    function _atualizarIconeToggle(colapsada) {
        $('#btn-sidebar-toggle i').attr('class', colapsada ? 'bi bi-chevron-right' : 'bi bi-chevron-left');
        $('#btn-sidebar-toggle').attr('title', colapsada ? 'Expandir menu' : 'Recolher menu');
    }

    function _bindToggleDesktop($sidebar) {
        if (localStorage.getItem('agape_sidebar_colapsada') === 'true') {
            $sidebar.addClass('sidebar-colapsada');
            _atualizarIconeToggle(true);
        }

        $('#btn-sidebar-toggle').on('click', function () {
            $sidebar.toggleClass('sidebar-colapsada');
            var colapsada = $sidebar.hasClass('sidebar-colapsada');
            localStorage.setItem('agape_sidebar_colapsada', colapsada ? 'true' : 'false');
            _atualizarIconeToggle(colapsada);
        });
    }

    // ── Mobile ────────────────────────────────────────────────────────────────

    function _injetarHamburger($sidebar) {
        var $topbar = $('.topbar');
        if (!$topbar.length || $('#btn-sidebar-mobile').length) return;

        $('<button>').attr({ id: 'btn-sidebar-mobile', title: 'Menu' })
            .addClass('topbar-toggle-mobile')
            .html('<i class="bi bi-list"></i>')
            .on('click', function () {
                $sidebar.addClass('sidebar-aberta');
                $('#sidebar-overlay').addClass('visivel');
            })
            .prependTo($topbar);
    }

    function _bindExpandOnClick($sidebar) {
        $sidebar.on('click', function (e) {
            if (!$sidebar.hasClass('sidebar-colapsada')) return;
            if ($(e.target).closest('.sidebar-toggle').length) return;
            if ($(e.target).closest('.nav-link[data-href]').length) return;
            $sidebar.removeClass('sidebar-colapsada');
            localStorage.setItem('agape_sidebar_colapsada', 'false');
            _atualizarIconeToggle(false);
        });
    }

    function _injetarOverlay($sidebar) {
        if ($('#sidebar-overlay').length) return;

        $('<div>').attr('id', 'sidebar-overlay')
            .on('click', function () {
                $sidebar.removeClass('sidebar-aberta');
                $(this).removeClass('visivel');
            })
            .appendTo('body');
    }

    // ── API pública ───────────────────────────────────────────────────────────

    function inicializar(seletorAlvo) {
        _verificarParametrizacaoPendente();
        _injetarEstilosSubmenu();

        var $sidebar = $('#' + (seletorAlvo || 'sidebar-wrapper'));
        if (!$sidebar.length) {
            console.warn('[Sidebar] Elemento não encontrado: #' + (seletorAlvo || 'sidebar-wrapper'));
            return;
        }

        $sidebar.html(_construirHtml());

        _bindLogout();
        _bindGuardiao($sidebar);
        _bindSubmenus($sidebar);
        _injetarOverlay($sidebar);
        _bindToggleDesktop($sidebar);
        _bindExpandOnClick($sidebar);
        _injetarHamburger($sidebar);
    }

    function registrarItem(item) {
        _itens.push(item);
    }

    return { inicializar: inicializar, registrarItem: registrarItem };

}(jQuery));
