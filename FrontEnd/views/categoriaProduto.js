/* categoriaProduto.js — View: vincula eventos ao DOM e delega ao Controller
   Filtros de nome e status são aplicados no frontend pelo Controller */

(function () {

    var ctrl      = window.AGAPE.Controllers.CategoriaProdutoController.getInstance();
    var validador = window.AGAPE.Utils.Validador.getInstance();

    var tabelaCorpo         = document.getElementById('tabela-corpo');
    var modalEl             = document.getElementById('modal-categoria');
    var formCategoria       = document.getElementById('form-categoria');
    var inputIdCatProd      = document.getElementById('idCatProd');
    var inputNome           = document.getElementById('nome');
    var selectAtivo         = document.getElementById('ativo');
    var modalTitulo         = document.getElementById('modal-titulo');
    var filtrNome           = document.getElementById('filtro-nome');
    var filtrStatus         = document.getElementById('filtro-status');
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

    // Carrega lista completa e armazena no cache do Controller para filtragem local
    async function _carregarLista() {
        tabelaCorpo.innerHTML = '<tr><td colspan="4" class="tabela-vazia">Carregando...</td></tr>';
        _renderizarTabela(await ctrl.listar());
    }

    function _renderizarTabela(resultado) {
        if (resultado.status !== 'ok') {
            tabelaCorpo.innerHTML =
                '<tr><td colspan="4" class="tabela-vazia text-danger">' +
                '<i class="bi bi-exclamation-triangle me-1"></i>' +
                _escapar(resultado.erro || 'Erro ao carregar dados.') +
                '</td></tr>';
            return;
        }

        var lista = Array.isArray(resultado.dados) ? resultado.dados : [];

        if (lista.length === 0) {
            tabelaCorpo.innerHTML =
                '<tr><td colspan="4" class="tabela-vazia">' +
                '<i class="bi bi-inbox me-1"></i>Nenhuma categoria encontrada.' +
                '</td></tr>';
            return;
        }

        var html = lista.map(function (c) {
            var ativo = (c.ativo === true || c.ativo === 1 || c.ativo === 'true');
            var badge = ativo ? '<span class="badge-ativo">Ativo</span>' : '<span class="badge-inativo">Inativo</span>';
            return (
                '<tr>' +
                '<td>' + _escapar(String(c.idCatProd)) + '</td>' +
                '<td>' + _escapar(c.nome) + '</td>' +
                '<td>' + badge + '</td>' +
                '<td>' +
                '<button class="btn-acao btn-editar me-1" data-id="' + c.idCatProd + '" ' +
                'data-nome="' + _escapar(c.nome) + '" data-ativo="' + ativo + '" title="Editar">' +
                '<i class="bi bi-pencil"></i></button>' +
                '<button class="btn-acao btn-excluir" data-id="' + c.idCatProd + '" ' +
                'data-nome="' + _escapar(c.nome) + '" title="Excluir">' +
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
        modalTitulo.textContent  = 'Cadastrar Categoria de Produto';
        validador.resetar(formCategoria);
        inputIdCatProd.value = '';
        inputNome.value      = '';
        selectAtivo.value    = 'true';
        // Campo "ativo" desabilitado no cadastro — POST não envia esse campo
        selectAtivo.disabled = true;
        modalObj.show();
    });

    function _abrirModalEdicao(dados) {
        modalTitulo.textContent  = 'Alterar Categoria de Produto';
        validador.resetar(formCategoria);
        inputIdCatProd.value = dados.id;
        inputNome.value      = dados.nome;
        selectAtivo.value    = dados.ativo === 'true' ? 'true' : 'false';
        selectAtivo.disabled = false;
        modalObj.show();
    }

    btnSalvar.addEventListener('click', async function () {
        if (!validador.validarFormulario(formCategoria)) return;

        var dados = {
            idCatProd: inputIdCatProd.value || null,
            nome:      inputNome.value.trim(),
            ativo:     selectAtivo.value === 'true'
        };

        var resultado = dados.idCatProd
            ? await ctrl.alterar(dados)
            : await ctrl.cadastrar(dados);

        if (resultado.status === 'ok') {
            modalObj.hide();
            validador.mostrarAlerta(
                dados.idCatProd ? 'Categoria alterada com sucesso!' : 'Categoria cadastrada com sucesso!',
                'sucesso'
            );
            await _carregarLista();
        } else {
            validador.mostrarAlerta(resultado.erro || 'Erro ao salvar categoria.', 'erro');
        }
    });

    btnConfirmarExcluir.addEventListener('click', async function () {
        if (!idParaExcluir) return;
        var resultado = await ctrl.excluir(idParaExcluir);
        modalExcluirObj.hide();
        idParaExcluir = null;
        if (resultado.status === 'ok') {
            validador.mostrarAlerta('Categoria excluída com sucesso!', 'sucesso');
            await _carregarLista();
        } else {
            validador.mostrarAlerta(resultado.erro || 'Erro ao excluir categoria.', 'erro');
        }
    });

    btnFiltrar.addEventListener('click', function () {
        _renderizarTabela(ctrl.filtrar({ nome: filtrNome.value, status: filtrStatus.value }));
    });

    btnLimpar.addEventListener('click', async function () {
        filtrNome.value = filtrStatus.value = '';
        await _carregarLista();
    });

    // Escapa HTML para evitar XSS ao inserir dados do backend no DOM
    function _escapar(texto) {
        if (texto === null || texto === undefined) return '';
        return String(texto)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    document.addEventListener('DOMContentLoaded', inicializar);

})();
