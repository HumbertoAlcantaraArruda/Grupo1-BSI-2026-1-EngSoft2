/* Sidebar — componente de navegação lateral injetado via JS em todas as telas */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Utils = window.AGAPE.Utils || {};

window.AGAPE.Utils.Sidebar = (function () {

    var _itens = [
        { rotulo: 'Produtos',             href: 'produtos.html',         icone: 'bi-box-seam',      niveis: ['ADM', 'COLAB'] },
        { rotulo: 'Categoria de Produto', href: 'categoriaProduto.html', icone: 'bi-tags',           niveis: ['ADM', 'COLAB'] },
        { rotulo: 'Categoria de Evento',  href: 'categoriaEvento.html',  icone: 'bi-calendar-event', niveis: ['ADM', 'COLAB'] },
        { rotulo: 'Forma de Pagamento',   href: 'formaPagamento.html',   icone: 'bi-credit-card',    niveis: ['ADM', 'COLAB'] },
        { rotulo: 'Fornecedor',           href: 'fornecedor.html',       icone: 'bi-truck',          niveis: ['ADM', 'COLAB'] }
    ];

    var _itensConfig = [
        { rotulo: 'Parametrização', href: 'parametrizacao.html', icone: 'bi-gear', niveis: ['ADM'] }
    ];

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

    function _construirHtml() {
        var paginaAtual = _paginaAtual();
        var auth        = window.AGAPE.Utils.Auth ? window.AGAPE.Utils.Auth.getInstance() : null;
        var usuario     = auth ? auth.getUsuario() : null;
        var nomeUsuario = usuario && usuario.nome ? usuario.nome : '';
        var nivel       = usuario && usuario.nivel ? usuario.nivel : '';

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

        let nivelStr = "";

        switch(nivel){
            case "PAROQ":
                nivelStr = "Paroquiano";
                break;
            case "COLAB":
                nivelStr = "Colaborador";
                break;
            case "ADM":
                nivelStr = "Administrador";
                break;

            default:
                nivelStr = "Desconhecido";
                break;
        }

        var blocoUsuario = nomeUsuario ?
            '<div class="sidebar-usuario px-3 py-2 small">' +
            '<div class="text-white"><i class="bi bi-person-circle me-1"></i>' + nomeUsuario + '</div>' +
            (nivel ? '<div class="text-white">Perfil: ' + nivelStr + '</div>' : '') +
            '</div>' : '';

        var itensFiltrados      = _filtrarPorNivel(_itens,       nivel);
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
            '<div class="sidebar-logo">AGAPE</div>' +
            '<div class="sidebar-subtitulo">Gestão Paroquial</div>' +
            '</div>' +
            '<nav class="sidebar-nav">' +
            secaoCadastros +
            secaoConfig +
            '</nav>' +
            '<div class="sidebar-rodape p-3">' +
            '<button type="button" class="btn btn-primary w-100" id="btn-sair">' +
            '<i class="bi bi-box-arrow-left me-1"></i> Sair' +
            '</button>' +
            '</div>' +
            blocoUsuario
        );
    }

    function _bindLogout() {
        var btn = document.getElementById('btn-sair');
        if (!btn) return;
        btn.addEventListener('click', function () {
            var auth = window.AGAPE.Utils.Auth ? window.AGAPE.Utils.Auth.getInstance() : null;
            if (auth) auth.logout();
        });
    }

    function inicializar(seletorAlvo) {
        var alvo = document.getElementById(seletorAlvo || 'sidebar-wrapper');
        if (!alvo) {
            console.warn('[Sidebar] Elemento não encontrado: #' + (seletorAlvo || 'sidebar-wrapper'));
            return;
        }
        alvo.innerHTML = _construirHtml();
        _bindLogout();
    }

    // Adiciona item à seção Cadastros sem alterar os existentes.
    // item deve conter { rotulo, href, icone, niveis? }
    function registrarItem(item) {
        _itens.push(item);
    }

    return { inicializar: inicializar, registrarItem: registrarItem };

})();
