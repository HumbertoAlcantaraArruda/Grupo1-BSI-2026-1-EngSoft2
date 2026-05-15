/* produtos.js — View: vincula eventos ao DOM e delega ao Controller */

(function () {

    var ctrl      = window.AGAPE.Controllers.ProdutosController.getInstance();
    var mascaras  = window.AGAPE.Utils.Mascaras.getInstance();
    var validador = window.AGAPE.Utils.Validador.getInstance();

    var tabelaCorpo         = document.getElementById('tabela-corpo');
    var modalEl             = document.getElementById('modal-produto');
    var formProduto         = document.getElementById('form-produto');
    var inputIdProd         = document.getElementById('idProd');
    var inputNome           = document.getElementById('nome');
    var selectCategoria     = document.getElementById('idCatProd');
    var inputValorUni       = document.getElementById('valorUni');
    var inputQtde           = document.getElementById('qtdeAtual');
    var modalTitulo         = document.getElementById('modal-titulo');
    var filtrNome           = document.getElementById('filtro-nome');
    var filtrCategoria      = document.getElementById('filtro-categoria');
    var filtrOperador       = document.getElementById('filtro-operador');
    var filtrQtde           = document.getElementById('filtro-qtde');
    var btnCadastrar        = document.getElementById('btn-cadastrar');
    var btnFiltrar          = document.getElementById('btn-filtrar');
    var btnLimpar           = document.getElementById('btn-limpar');
    var btnSalvar           = document.getElementById('btn-salvar');
    var btnConfirmarExcluir = document.getElementById('btn-confirmar-excluir');

    var modalObj         = new bootstrap.Modal(modalEl);
    var modalExcluirObj  = new bootstrap.Modal(document.getElementById('modal-excluir'));
    var idParaExcluir    = null;

    async function inicializar() {
        window.AGAPE.Utils.Sidebar.inicializar();
        mascaras.aplicar('#valorUni', 'monetario');
        await _carregarCategorias();
        await _carregarLista();
    }

    // Popula os selects de categoria no filtro e no formulário
    async function _carregarCategorias() {
        var resultado = await ctrl.carregarCategorias();

        var opcaoPadrao     = '<option value="">Todos</option>';
        var opcaoPadraoForm = '<option value="">Selecione...</option>';

        if (resultado.status !== 'ok' || !Array.isArray(resultado.dados)) {
            selectCategoria.innerHTML = opcaoPadraoForm;
            filtrCategoria.innerHTML  = opcaoPadrao;
            return;
        }

        var opcoesCategoria = resultado.dados
            .filter(function (c) { return c.ativo !== false; })
            .map(function (c) {
                return '<option value="' + c.idCatProd + '">' + _escapar(c.nome) + '</option>';
            }).join('');

        selectCategoria.innerHTML = opcaoPadraoForm + opcoesCategoria;
        filtrCategoria.innerHTML  = opcaoPadrao + opcoesCategoria;
    }

    async function _carregarLista() {
        tabelaCorpo.innerHTML = '<tr><td colspan="5" class="tabela-vazia">Carregando...</td></tr>';
        var resultado = await ctrl.listar();
        _renderizarTabela(resultado);
    }

    function _renderizarTabela(resultado) {
        if (resultado.status !== 'ok') {
            tabelaCorpo.innerHTML =
                '<tr><td colspan="5" class="tabela-vazia text-danger">' +
                '<i class="bi bi-exclamation-triangle me-1"></i>' +
                _escapar(resultado.erro || 'Erro ao carregar dados.') +
                '</td></tr>';
            return;
        }

        var lista = Array.isArray(resultado.dados) ? resultado.dados : [];

        if (lista.length === 0) {
            tabelaCorpo.innerHTML =
                '<tr><td colspan="5" class="tabela-vazia">' +
                '<i class="bi bi-inbox me-1"></i>Nenhum produto encontrado.' +
                '</td></tr>';
            return;
        }

        var html = lista.map(function (p) {
            var valorFormatado = mascaras.numeroParaMonetario(p.valorUni);
            return (
                '<tr>' +
                '<td>' + _escapar(p.nome) + '</td>' +
                '<td>' + _escapar(p.nomeCategoria || p.idCatProd || '-') + '</td>' +
                '<td>R$ ' + valorFormatado + '</td>' +
                '<td>' + _escapar(String(p.qtdeAtual)) + '</td>' +
                '<td>' +
                '<button class="btn-acao btn-editar me-1" ' +
                'data-id="' + p.idProd + '" ' +
                'data-nome="' + _escapar(p.nome) + '" ' +
                'data-idcatprod="' + p.idCatProd + '" ' +
                'data-valoruni="' + p.valorUni + '" ' +
                'data-qtde="' + p.qtdeAtual + '" title="Editar">' +
                '<i class="bi bi-pencil"></i></button>' +
                '<button class="btn-acao btn-excluir" ' +
                'data-id="' + p.idProd + '" ' +
                'data-nome="' + _escapar(p.nome) + '" title="Excluir">' +
                '<i class="bi bi-trash"></i></button>' +
                '</td></tr>'
            );
        }).join('');

        tabelaCorpo.innerHTML = html;
        _bindBotoesTabela();
    }

    function _bindBotoesTabela() {
        document.querySelectorAll('.btn-editar').forEach(function (btn) {
            btn.addEventListener('click', function () { _abrirModalEdicao(this.dataset); });
        });
        document.querySelectorAll('.btn-excluir').forEach(function (btn) {
            btn.addEventListener('click', function () {
                idParaExcluir = this.dataset.id;
                document.getElementById('excluir-nome').textContent = this.dataset.nome;
                modalExcluirObj.show();
            });
        });
    }

    btnCadastrar.addEventListener('click', function () {
        modalTitulo.textContent = 'Cadastrar Produto';
        validador.resetar(formProduto);
        inputIdProd.value = '';
        inputNome.value   = '';
        inputValorUni.value = '';
        inputQtde.value   = '';
        selectCategoria.selectedIndex = 0;
        mascaras.remover('#valorUni');
        mascaras.aplicar('#valorUni', 'monetario');
        modalObj.show();
    });

    function _abrirModalEdicao(dados) {
        modalTitulo.textContent   = 'Alterar Produto';
        validador.resetar(formProduto);
        inputIdProd.value         = dados.id;
        inputNome.value           = dados.nome;
        inputQtde.value           = dados.qtde;
        selectCategoria.value     = dados.idcatprod;
        // dataset converte atributos para minúsculas (data-valoruni → valoruni)
        mascaras.remover('#valorUni');
        inputValorUni.value = mascaras.numeroParaMonetario(dados.valoruni);
        mascaras.aplicar('#valorUni', 'monetario');
        modalObj.show();
    }

    btnSalvar.addEventListener('click', async function () {
        if (!validador.validarFormulario(formProduto)) return;

        var dados = {
            idProd:    inputIdProd.value || null,
            nome:      inputNome.value.trim(),
            idCatProd: selectCategoria.value,
            valorUni:  mascaras.monetarioParaNumero(inputValorUni.value),
            qtdeAtual: inputQtde.value
        };

        var resultado = dados.idProd
            ? await ctrl.alterar(dados)
            : await ctrl.cadastrar(dados);

        if (resultado.status === 'ok') {
            modalObj.hide();
            validador.mostrarAlerta(
                dados.idProd ? 'Produto alterado com sucesso!' : 'Produto cadastrado com sucesso!',
                'sucesso'
            );
            await _carregarLista();
        } else {
            validador.mostrarAlerta(resultado.erro || 'Erro ao salvar produto.', 'erro');
        }
    });

    btnConfirmarExcluir.addEventListener('click', async function () {
        if (!idParaExcluir) return;
        var resultado = await ctrl.excluir(idParaExcluir);
        modalExcluirObj.hide();
        idParaExcluir = null;
        if (resultado.status === 'ok') {
            validador.mostrarAlerta('Produto excluído com sucesso!', 'sucesso');
            await _carregarLista();
        } else {
            validador.mostrarAlerta(resultado.erro || 'Erro ao excluir produto.', 'erro');
        }
    });

    btnFiltrar.addEventListener('click', async function () {
        var filtros = {
            nome:       filtrNome.value,
            idCatProd:  filtrCategoria.value,
            operador:   filtrOperador.value,
            quantidade: filtrQtde.value
        };
        tabelaCorpo.innerHTML = '<tr><td colspan="5" class="tabela-vazia">Filtrando...</td></tr>';
        _renderizarTabela(await ctrl.filtrar(filtros));
    });

    btnLimpar.addEventListener('click', async function () {
        filtrNome.value = filtrCategoria.value = filtrOperador.value = filtrQtde.value = '';
        await _carregarLista();
    });

    // Decodifica operadores URL-encoded para exibição (ex.: %3E%3D → >=)
    var _OPERADORES = { '>=': '>=', '<=': '<=', '>': '>', '<': '<', '=': '=' };
    function _traduzirOperador(valor) {
        var dec = decodeURIComponent(valor || '');
        return _OPERADORES[dec] || dec;
    }

    // Escapa HTML para evitar XSS ao inserir dados do backend no DOM
    function _escapar(texto) {
        if (texto === null || texto === undefined) return '';
        return String(texto)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    document.addEventListener('DOMContentLoaded', inicializar);

})();
