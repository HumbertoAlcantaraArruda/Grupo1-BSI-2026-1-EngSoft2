/* fornecedor.js — View: vincula eventos ao DOM e delega ao Controller */

(function () {

    if (!window.AGAPE.Utils.Auth.getInstance().requireLogin()) return;

    var ctrl      = window.AGAPE.Controllers.FornecedorController.getInstance();
    var mascaras  = window.AGAPE.Utils.Mascaras.getInstance();
    var validador = window.AGAPE.Utils.Validador.getInstance();

    var tabelaCorpo         = document.getElementById('tabela-corpo');
    var modalEl             = document.getElementById('modal-fornecedor');
    var formFornecedor      = document.getElementById('form-fornecedor');
    var inputIdFornec       = document.getElementById('idFornec');
    var inputNome           = document.getElementById('nome');
    var inputContato        = document.getElementById('contato');
    var inputTelefone1      = document.getElementById('telefone1');
    var inputTelefone2      = document.getElementById('telefone2');
    var inputEmail          = document.getElementById('email');
    var inputSite           = document.getElementById('site');
    var inputCnpj           = document.getElementById('cnpj');
    var inputCep            = document.getElementById('cep');
    var inputLogradouro     = document.getElementById('logradouro');
    var inputCidade         = document.getElementById('cidade');
    var selectUf            = document.getElementById('uf');
    var inputObs            = document.getElementById('obs');
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
        mascaras.aplicar('#telefone1', 'telefone');
        mascaras.aplicar('#telefone2', 'telefone');
        mascaras.aplicar('#cnpj', 'cnpj');
        mascaras.aplicar('#cep', 'cep');
        await _carregarLista();
    }

    async function _carregarLista() {
        tabelaCorpo.innerHTML = '<tr><td colspan="6" class="tabela-vazia">Carregando...</td></tr>';
        _renderizarTabela(await ctrl.listar());
    }

    function _renderizarTabela(resultado) {
        if (resultado.status !== 'ok') {
            tabelaCorpo.innerHTML =
                '<tr><td colspan="6" class="tabela-vazia text-danger">' +
                '<i class="bi bi-exclamation-triangle me-1"></i>' +
                _escapar(resultado.erro || 'Erro ao carregar dados.') +
                '</td></tr>';
            return;
        }

        var lista = Array.isArray(resultado.dados) ? resultado.dados : [];

        if (lista.length === 0) {
            tabelaCorpo.innerHTML =
                '<tr><td colspan="6" class="tabela-vazia">' +
                '<i class="bi bi-inbox me-1"></i>Nenhum fornecedor encontrado.' +
                '</td></tr>';
            return;
        }

        var html = lista.map(function (f) {
            var ativo = (f.ativo === 1 || f.ativo === true || f.ativo === '1');
            var badge = ativo
                ? '<span class="badge-ativo">Ativo</span>'
                : '<span class="badge-inativo">Inativo</span>';
            return (
                '<tr>' +
                '<td>' + _escapar(f.nome)     + '</td>' +
                '<td>' + _escapar(f.contato   || '—') + '</td>' +
                '<td>' + _escapar(f.telefone1 || '—') + '</td>' +
                '<td>' + _escapar(f.email     || '—') + '</td>' +
                '<td>' + badge + '</td>' +
                '<td>' +
                '<button class="btn-acao btn-editar me-1" ' +
                'data-id="'         + f.idFornec              + '" ' +
                'data-nome="'       + _escapar(f.nome)        + '" ' +
                'data-contato="'    + _escapar(f.contato)     + '" ' +
                'data-telefone1="'  + _escapar(f.telefone1)   + '" ' +
                'data-telefone2="'  + _escapar(f.telefone2)   + '" ' +
                'data-email="'      + _escapar(f.email)       + '" ' +
                'data-site="'       + _escapar(f.site)        + '" ' +
                'data-cnpj="'       + _escapar(f.cnpj)        + '" ' +
                'data-cep="'        + _escapar(f.cep)         + '" ' +
                'data-logradouro="' + _escapar(f.logradouro)  + '" ' +
                'data-cidade="'     + _escapar(f.cidade)      + '" ' +
                'data-uf="'         + _escapar(f.uf)          + '" ' +
                'data-obs="'        + _escapar(f.obs)         + '" ' +
                'data-ativo="'      + (f.ativo === 1 || f.ativo === true || f.ativo === '1' ? '1' : '0') + '" ' +
                'title="Editar">' +
                '<i class="bi bi-pencil"></i></button>' +
                '<button class="btn-acao btn-excluir" ' +
                'data-id="'   + f.idFornec        + '" ' +
                'data-nome="' + _escapar(f.nome)  + '" ' +
                'title="Excluir">' +
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

    function _limparModal() {
        inputIdFornec.value   = '';
        inputNome.value       = '';
        inputContato.value    = '';
        inputTelefone1.value  = '';
        inputTelefone2.value  = '';
        inputEmail.value      = '';
        inputSite.value       = '';
        inputCnpj.value       = '';
        inputCep.value        = '';
        inputLogradouro.value = '';
        inputCidade.value     = '';
        selectUf.value        = '';
        inputObs.value        = '';
        selectAtivo.value     = '1';
        selectAtivo.disabled  = true;
    }

    btnCadastrar.addEventListener('click', function () {
        modalTitulo.textContent = 'Cadastrar Fornecedor';
        validador.resetar(formFornecedor);
        _limparModal();
        modalObj.show();
    });

    function _abrirModalEdicao(dados) {
        modalTitulo.textContent  = 'Alterar Fornecedor';
        validador.resetar(formFornecedor);
        inputIdFornec.value   = dados.id;
        inputNome.value       = dados.nome       || '';
        inputContato.value    = dados.contato    || '';
        inputTelefone1.value  = dados.telefone1  || '';
        inputTelefone2.value  = dados.telefone2  || '';
        inputEmail.value      = dados.email      || '';
        inputSite.value       = dados.site       || '';
        inputCnpj.value       = dados.cnpj       || '';
        inputCep.value        = dados.cep        || '';
        inputLogradouro.value = dados.logradouro || '';
        inputCidade.value     = dados.cidade     || '';
        selectUf.value        = dados.uf         || '';
        inputObs.value        = dados.obs        || '';
        selectAtivo.value     = dados.ativo === '0' ? '0' : '1';
        selectAtivo.disabled  = false;
        modalObj.show();
    }

    btnSalvar.addEventListener('click', async function () {
        if (!validador.validarFormulario(formFornecedor)) return;

        var dados = {
            idFornec:  inputIdFornec.value  || null,
            nome:      inputNome.value.trim(),
            contato:   inputContato.value.trim(),
            telefone1: mascaras.apenasDigitos(inputTelefone1.value),
            telefone2: mascaras.apenasDigitos(inputTelefone2.value),
            email:     inputEmail.value.trim(),
            site:      inputSite.value.trim(),
            cnpj:      mascaras.apenasDigitos(inputCnpj.value),
            cep:       mascaras.apenasDigitos(inputCep.value),
            logradouro: inputLogradouro.value.trim(),
            cidade:    inputCidade.value.trim(),
            uf:        selectUf.value,
            obs:       inputObs.value.trim(),
            ativo:     selectAtivo.value
        };

        var resultado = dados.idFornec
            ? await ctrl.alterar(dados)
            : await ctrl.cadastrar(dados);

        if (resultado.status === 'ok') {
            modalObj.hide();
            validador.mostrarAlerta(
                dados.idFornec ? 'Fornecedor alterado com sucesso!' : 'Fornecedor cadastrado com sucesso!',
                'sucesso'
            );
            await _carregarLista();
        } else {
            validador.mostrarAlerta(resultado.erro || 'Erro ao salvar fornecedor.', 'erro');
        }
    });

    btnConfirmarExcluir.addEventListener('click', async function () {
        if (!idParaExcluir) return;
        var resultado = await ctrl.excluir(idParaExcluir);
        modalExcluirObj.hide();
        idParaExcluir = null;
        if (resultado.status === 'ok') {
            validador.mostrarAlerta('Fornecedor excluído com sucesso!', 'sucesso');
            await _carregarLista();
        } else {
            validador.mostrarAlerta(resultado.erro || 'Erro ao excluir fornecedor.', 'erro');
        }
    });

    btnFiltrar.addEventListener('click', function () {
        _renderizarTabela(ctrl.filtrar({ nome: filtrNome.value, status: filtrStatus.value }));
    });

    btnLimpar.addEventListener('click', async function () {
        filtrNome.value = filtrStatus.value = '';
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
