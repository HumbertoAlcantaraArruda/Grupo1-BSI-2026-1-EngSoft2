/* formaPagamento.js — View: vincula eventos ao DOM e delega ao Controller */

(function () {

    if (!window.AGAPE.Utils.Auth.getInstance().requireLogin()) return;

    var ctrl      = window.AGAPE.Controllers.FormaPagamentoController.getInstance();
    var validador = window.AGAPE.Utils.Validador.getInstance();

    var tabelaCorpo         = document.getElementById('tabela-corpo');
    var modalEl             = document.getElementById('modal-forma');
    var formForma           = document.getElementById('form-forma');
    var inputId             = document.getElementById('formaId');
    var inputDescricao      = document.getElementById('descricao');
    var selectAtivo         = document.getElementById('ativo');
    var modalTitulo         = document.getElementById('modal-titulo');
    var secaoAtivo          = document.getElementById('secao-ativo');
    var filtrDescricao      = document.getElementById('filtro-descricao');
    var filtrAtivo          = document.getElementById('filtro-ativo');
    var btnCadastrar        = document.getElementById('btn-cadastrar');
    var btnFiltrar          = document.getElementById('btn-filtrar');
    var btnLimpar           = document.getElementById('btn-limpar');
    var btnSalvar           = document.getElementById('btn-salvar');
    var btnConfirmarExcluir = document.getElementById('btn-confirmar-excluir');

    var modalObj        = new bootstrap.Modal(modalEl);
    var modalExcluirObj = new bootstrap.Modal(document.getElementById('modal-excluir'));
    var idParaExcluir   = null;

    async function inicializar() {
        window.AGAPE.Utils.Sidebar.inicializar();
        await _carregarLista();
    }

    async function _carregarLista() {
        tabelaCorpo.innerHTML = '<tr><td colspan="3" class="tabela-vazia">Carregando...</td></tr>';
        _renderizarTabela(await ctrl.listar());
    }

    function _renderizarTabela(resultado) {
        if (resultado.status !== 'ok') {
            tabelaCorpo.innerHTML =
                '<tr><td colspan="3" class="tabela-vazia text-danger">' +
                '<i class="bi bi-exclamation-triangle me-1"></i>' +
                _escapar(resultado.erro || 'Erro ao carregar dados.') +
                '</td></tr>';
            return;
        }

        var lista = Array.isArray(resultado.dados) ? resultado.dados : [];

        if (lista.length === 0) {
            tabelaCorpo.innerHTML =
                '<tr><td colspan="3" class="tabela-vazia">' +
                '<i class="bi bi-inbox me-1"></i>Nenhuma forma de pagamento encontrada.' +
                '</td></tr>';
            return;
        }

        var html = lista.map(function (f) {
            var ativo = (f.ativo === true || f.ativo === 1 || f.ativo === 'true');
            var badge = ativo ? '<span class="badge-ativo">Ativo</span>' : '<span class="badge-inativo">Inativo</span>';
            return (
                '<tr>' +
                '<td>' + _escapar(f.descricao) + '</td>' +
                '<td>' + badge + '</td>' +
                '<td>' +
                '<button class="btn-acao btn-editar me-1" data-id="' + f.idFormaPag + '" ' +
                'data-descricao="' + _escapar(f.descricao) + '" data-ativo="' + ativo + '" title="Editar">' +
                '<i class="bi bi-pencil"></i></button>' +
                '<button class="btn-acao btn-excluir" data-id="' + f.idFormaPag + '" ' +
                'data-descricao="' + _escapar(f.descricao) + '" title="Excluir">' +
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
                document.getElementById('excluir-descricao').textContent = this.dataset.descricao;
                modalExcluirObj.show();
            });
        });
    }

    btnCadastrar.addEventListener('click', function () {
        modalTitulo.textContent  = 'Cadastrar Forma de Pagamento';
        validador.resetar(formForma);
        inputId.value          = '';
        inputDescricao.value   = '';
        selectAtivo.value      = 'true';
        selectAtivo.disabled   = true;
        secaoAtivo.style.display = 'none';
        modalObj.show();
    });

    function _abrirModalEdicao(dados) {
        modalTitulo.textContent  = 'Alterar Forma de Pagamento';
        validador.resetar(formForma);
        inputId.value            = dados.id;
        inputDescricao.value     = dados.descricao;
        selectAtivo.value        = dados.ativo === 'true' ? 'true' : 'false';
        selectAtivo.disabled     = false;
        secaoAtivo.style.display = 'block';
        modalObj.show();
    }

    btnSalvar.addEventListener('click', async function () {
        if (!validador.validarFormulario(formForma)) return;

        var dados = {
            idFormaPag: inputId.value || null,
            descricao:  inputDescricao.value.trim(),
            ativo:      selectAtivo.value === 'true'
        };

        var resultado = dados.idFormaPag
            ? await ctrl.alterar(dados)
            : await ctrl.cadastrar(dados);

        if (resultado.status === 'ok') {
            modalObj.hide();
            validador.mostrarAlerta(
                dados.idFormaPag ? 'Forma de pagamento alterada com sucesso!' : 'Forma de pagamento cadastrada com sucesso!',
                'sucesso'
            );
            await _carregarLista();
        } else {
            validador.mostrarAlerta(resultado.erro || 'Erro ao salvar forma de pagamento.', 'erro');
        }
    });

    btnConfirmarExcluir.addEventListener('click', async function () {
        if (!idParaExcluir) return;
        var resultado = await ctrl.excluir(idParaExcluir);
        modalExcluirObj.hide();
        idParaExcluir = null;
        if (resultado.status === 'ok') {
            validador.mostrarAlerta('Forma de pagamento excluída com sucesso!', 'sucesso');
            await _carregarLista();
        } else {
            validador.mostrarAlerta(resultado.erro || 'Erro ao excluir forma de pagamento.', 'erro');
        }
    });

    btnFiltrar.addEventListener('click', async function () {
        tabelaCorpo.innerHTML = '<tr><td colspan="3" class="tabela-vazia">Filtrando...</td></tr>';
        _renderizarTabela(await ctrl.filtrar({ descricao: filtrDescricao.value, ativo: filtrAtivo.value }));
    });

    btnLimpar.addEventListener('click', async function () {
        filtrDescricao.value = filtrAtivo.value = '';
        await _carregarLista();
    });

    function _escapar(texto) {
        if (texto === null || texto === undefined) return '';
        return String(texto)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    document.addEventListener('DOMContentLoaded', inicializar);

})();
