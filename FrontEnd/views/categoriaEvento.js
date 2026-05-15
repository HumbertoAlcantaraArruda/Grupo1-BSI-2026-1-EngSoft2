/* =====================================================================
   categoriaEvento.js — Camada View (bind de eventos)
   REGRA: NÃO instancia Models. NÃO chama fetch. NÃO conhece Service.
   Filtros nome e ativo são enviados à API via Controller.
   ===================================================================== */

(function () {

    /* ---- Referências ao Controller e utilitários ------------------- */
    var ctrl      = window.AGAPE.Controllers.CategoriaEventoController.getInstance();
    var validador = window.AGAPE.Utils.Validador.getInstance();

    /* ---- Referências a elementos do DOM --------------------------- */
    var tabelaCorpo         = document.getElementById('tabela-corpo');
    var modalEl             = document.getElementById('modal-categoria');
    var formCategoria       = document.getElementById('form-categoria');
    var inputId             = document.getElementById('catId');
    var inputNome           = document.getElementById('nome');
    var selectAtivo         = document.getElementById('ativo');
    var modalTitulo         = document.getElementById('modal-titulo');
    var secaoAtivo          = document.getElementById('secao-ativo');

    var filtrNome           = document.getElementById('filtro-nome');
    var filtrAtivo          = document.getElementById('filtro-ativo');

    var btnCadastrar        = document.getElementById('btn-cadastrar');
    var btnFiltrar          = document.getElementById('btn-filtrar');
    var btnLimpar           = document.getElementById('btn-limpar');
    var btnSalvar           = document.getElementById('btn-salvar');
    var btnConfirmarExcluir = document.getElementById('btn-confirmar-excluir');

    var modalObj            = new bootstrap.Modal(modalEl);
    var modalExcluirObj     = new bootstrap.Modal(document.getElementById('modal-excluir'));
    var idParaExcluir       = null;

    /* ---- Inicialização -------------------------------------------- */
    async function inicializar() {
        window.AGAPE.Utils.Sidebar.inicializar();
        await _carregarLista();
    }

    /* ---- Carregar lista completa ---------------------------------- */
    async function _carregarLista() {
        tabelaCorpo.innerHTML = '<tr><td colspan="4" class="tabela-vazia">Carregando...</td></tr>';
        var resultado = await ctrl.listar();
        _renderizarTabela(resultado);
    }

    /* ---- Renderizar tabela --------------------------------------- */
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
            var badge = ativo
                ? '<span class="badge-ativo">Ativo</span>'
                : '<span class="badge-inativo">Inativo</span>';
            return (
                '<tr>' +
                '<td>' + _escapar(String(c.idCatEvento)) + '</td>' +
                '<td>' + _escapar(c.nome) + '</td>' +
                '<td>' + badge + '</td>' +
                '<td>' +
                '<button class="btn-acao btn-editar me-1" ' +
                'data-id="' + c.idCatEvento + '" ' +
                'data-nome="' + _escapar(c.nome) + '" ' +
                'data-ativo="' + ativo + '" ' +
                'title="Editar">' +
                '<i class="bi bi-pencil"></i>' +
                '</button>' +
                '<button class="btn-acao btn-excluir" ' +
                'data-id="' + c.idCatEvento + '" ' +
                'data-nome="' + _escapar(c.nome) + '" ' +
                'title="Excluir">' +
                '<i class="bi bi-trash"></i>' +
                '</button>' +
                '</td>' +
                '</tr>'
            );
        }).join('');

        tabelaCorpo.innerHTML = html;
        _bindBotoesTabela();
    }

    /* ---- Vincular eventos nos botões da tabela -------------------- */
    function _bindBotoesTabela() {
        document.querySelectorAll('.btn-editar').forEach(function (btn) {
            btn.addEventListener('click', function () {
                _abrirModalEdicao(this.dataset);
            });
        });

        document.querySelectorAll('.btn-excluir').forEach(function (btn) {
            btn.addEventListener('click', function () {
                idParaExcluir = this.dataset.id;
                document.getElementById('excluir-nome').textContent = this.dataset.nome;
                modalExcluirObj.show();
            });
        });
    }

    /* ---- Abrir modal para cadastro -------------------------------- */
    btnCadastrar.addEventListener('click', function () {
        modalTitulo.textContent = 'Cadastrar Categoria de Evento';
        validador.resetar(formCategoria);
        inputId.value        = '';
        inputNome.value      = '';
        selectAtivo.value    = 'true';
        ativo.disabled = true;
        /* Campo "Status" visível apenas na edição (POST não envia ativo) */
        //secaoAtivo.style.display = 'none';
        modalObj.show();
    });

    /* ---- Abrir modal preenchido para edição ----------------------- */
    function _abrirModalEdicao(dados) {
        modalTitulo.textContent = 'Alterar Categoria de Evento';
        validador.resetar(formCategoria);
        inputId.value        = dados.id;
        ativo.disabled = false;
        inputNome.value      = dados.nome;
        selectAtivo.value    = dados.ativo === 'true' ? 'true' : 'false';
        secaoAtivo.style.display = 'block';
        modalObj.show();
    }

    /* ---- Salvar --------------------------------------------------- */
    btnSalvar.addEventListener('click', async function () {
        if (!validador.validarFormulario(formCategoria)) return;

        var dados = {
            idCatEvento: inputId.value || null,
            nome:        inputNome.value.trim(),
            ativo:       selectAtivo.value === 'true'
        };

        var resultado = dados.idCatEvento
            ? await ctrl.alterar(dados)
            : await ctrl.cadastrar(dados);

        if (resultado.status === 'ok') {
            modalObj.hide();
            validador.mostrarAlerta(
                dados.idCatEvento ? 'Categoria alterada com sucesso!' : 'Categoria cadastrada com sucesso!',
                'sucesso'
            );
            await _carregarLista();
        } else {
            validador.mostrarAlerta(resultado.erro || 'Erro ao salvar categoria.', 'erro');
        }
    });

    /* ---- Confirmar exclusão --------------------------------------- */
    btnConfirmarExcluir.addEventListener('click', async function () {
        if (!idParaExcluir){
            console.log("erro aqui");
            return;
        }

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

    /* ---- Filtrar -------------------------------------------------- */
    btnFiltrar.addEventListener('click', async function () {
        var filtros = {
            nome:  filtrNome.value,
            ativo: filtrAtivo.value
        };
        tabelaCorpo.innerHTML = '<tr><td colspan="4" class="tabela-vazia">Filtrando...</td></tr>';
        var resultado = await ctrl.filtrar(filtros);
        _renderizarTabela(resultado);
    });

    /* ---- Limpar filtros ------------------------------------------ */
    btnLimpar.addEventListener('click', async function () {
        filtrNome.value  = '';
        filtrAtivo.value = '';
        await _carregarLista();
    });

    /* ---- Utilitário: escapar HTML (anti-XSS) ---------------------- */
    function _escapar(texto) {
        if (texto === null || texto === undefined) return '';
        return String(texto)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /* ---- Aguardar DOM e inicializar ------------------------------- */
    document.addEventListener('DOMContentLoaded', inicializar);

})();
