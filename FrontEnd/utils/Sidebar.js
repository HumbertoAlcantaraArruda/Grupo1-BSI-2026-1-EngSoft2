/* =====================================================================
   Sidebar — Componente de navegação lateral reutilizável
   Injetado via JS em todas as telas (Low Coupling: View não conhece HTML da sidebar)
   Detecta a página atual e destaca o item ativo automaticamente
   ===================================================================== */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Utils = window.AGAPE.Utils || {};

window.AGAPE.Utils.Sidebar = (function () {

    /* ---- Itens de navegação --------------------------------------- */
    var _itens = [
        {
            rotulo: 'Produtos',
            href: 'produtos.html',
            icone: 'bi-box-seam'
        },
        {
            rotulo: 'Categoria de Produto',
            href: 'categoriaProduto.html',
            icone: 'bi-tags'
        },
        {
            rotulo: 'Categoria de Evento',
            href: 'categoriaEvento.html',
            icone: 'bi-calendar-event'
        }
    ];

    /* ---- Detectar o arquivo HTML atual ---------------------------- */
    function _paginaAtual() {
        var caminho = window.location.pathname;
        /* Retorna apenas o nome do arquivo (ex.: "produtos.html") */
        return caminho.substring(caminho.lastIndexOf('/') + 1);
    }

    /* ---- Seção de configurações (sempre ao final) ----------------- */
    var _itensConfig = [
        {
            rotulo: 'Parametrização',
            href:   'parametrizacao.html',
            icone:  'bi-gear'
        }
    ];

    /* ---- Montar HTML da sidebar ----------------------------------- */
    function _construirHtml() {
        var paginaAtual = _paginaAtual();

        function _montarItem(item) {
            var ativo = (paginaAtual === item.href) ? ' ativo' : '';
            return (
                '<li class="nav-item">' +
                '<a class="nav-link' + ativo + '" href="' + item.href + '">' +
                '<i class="bi ' + item.icone + '"></i>' +
                '<span>' + item.rotulo + '</span>' +
                '</a>' +
                '</li>'
            );
        }

        var itensHtml       = _itens.map(_montarItem).join('');
        var itensConfigHtml = _itensConfig.map(_montarItem).join('');

        return (
            '<div class="sidebar-cabecalho">' +
            '<div class="sidebar-logo">AGAPE</div>' +
            '<div class="sidebar-subtitulo">Gestão Paroquial</div>' +
            '</div>' +
            '<nav class="sidebar-nav">' +
            '<p class="nav-secao">Cadastros</p>' +
            '<ul class="list-unstyled mb-0">' +
            itensHtml +
            '</ul>' +
            '<p class="nav-secao">Configurações</p>' +
            '<ul class="list-unstyled mb-0">' +
            itensConfigHtml +
            '</ul>' +
            '</nav>'
        );
    }

    /* ---- Injetar sidebar no elemento alvo ------------------------- */
    function inicializar(seletorAlvo) {
        var alvo = document.getElementById(seletorAlvo || 'sidebar-wrapper');
        if (!alvo) {
            console.warn('[Sidebar] Elemento alvo não encontrado: #' + (seletorAlvo || 'sidebar-wrapper'));
            return;
        }
        alvo.innerHTML = _construirHtml();
    }

    /* ---- Registrar novo item de navegação (OCP) ------------------- */
    function registrarItem(item) {
        _itens.push(item);
    }

    /* ---- API pública ---------------------------------------------- */
    return {
        inicializar: inicializar,
        registrarItem: registrarItem
    };

})();
