/* Sidebar — componente de navegação lateral injetado via JS em todas as telas */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Utils = window.AGAPE.Utils || {};

window.AGAPE.Utils.Sidebar = (function () {

    var _itens = [
        { rotulo: 'Produtos',            href: 'produtos.html',          icone: 'bi-box-seam'      },
        { rotulo: 'Categoria de Produto', href: 'categoriaProduto.html', icone: 'bi-tags'           },
        { rotulo: 'Categoria de Evento',  href: 'categoriaEvento.html',  icone: 'bi-calendar-event' }
    ];

    var _itensConfig = [
        { rotulo: 'Parametrização', href: 'parametrizacao.html', icone: 'bi-gear' }
    ];

    // Retorna apenas o nome do arquivo da URL atual (ex.: "produtos.html")
    function _paginaAtual() {
        var caminho = window.location.pathname;
        return caminho.substring(caminho.lastIndexOf('/') + 1);
    }

    function _construirHtml() {
        var paginaAtual = _paginaAtual();

        function _montarItem(item) {
            var ativo = (paginaAtual === item.href) ? ' ativo' : '';
            return (
                '<li class="nav-item">' +
                '<a class="nav-link' + ativo + '" href="' + item.href + '">' +
                '<i class="bi ' + item.icone + '"></i>' +
                '<span>' + item.rotulo + '</span>' +
                '</a></li>'
            );
        }

        return (
            '<div class="sidebar-cabecalho">' +
            '<div class="sidebar-logo">AGAPE</div>' +
            '<div class="sidebar-subtitulo">Gestão Paroquial</div>' +
            '</div>' +
            '<nav class="sidebar-nav">' +
            '<p class="nav-secao">Cadastros</p>' +
            '<ul class="list-unstyled mb-0">' + _itens.map(_montarItem).join('') + '</ul>' +
            '<p class="nav-secao">Configurações</p>' +
            '<ul class="list-unstyled mb-0">' + _itensConfig.map(_montarItem).join('') + '</ul>' +
            '</nav>'
        );
    }

    function inicializar(seletorAlvo) {
        var alvo = document.getElementById(seletorAlvo || 'sidebar-wrapper');
        if (!alvo) {
            console.warn('[Sidebar] Elemento não encontrado: #' + (seletorAlvo || 'sidebar-wrapper'));
            return;
        }
        alvo.innerHTML = _construirHtml();
    }

    // Adiciona item à seção Cadastros sem alterar os existentes
    function registrarItem(item) {
        _itens.push(item);
    }

    return { inicializar: inicializar, registrarItem: registrarItem };

})();
