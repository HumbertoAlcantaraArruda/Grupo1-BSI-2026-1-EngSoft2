/* categoriaEvento.js — View: vincula eventos ao DOM e delega ao Controller */

(function ($) {

    if (!window.AGAPE.Utils.Auth.getInstance().requireLogin()) return;

    var ctrl      = window.AGAPE.Controllers.CategoriaEventoController.getInstance();
    var validador = window.AGAPE.Utils.Validador.getInstance();

    var $tabelaCorpo         = $('#tabela-corpo');
    var $modalEl             = $('#modal-categoria');
    var $formCategoria       = $('#form-categoria');
    var $inputId             = $('#catId');
    var $inputNome           = $('#nome');
    var $selectAtivo         = $('#ativo');
    var $modalTitulo         = $('#modal-titulo');
    var $secaoAtivo          = $('#secao-ativo');
    var $filtrNome           = $('#filtro-nome');
    var $filtrAtivo          = $('#filtro-ativo');
    var $btnCadastrar        = $('#btn-cadastrar');
    var $btnFiltrar          = $('#btn-filtrar');
    var $btnLimpar           = $('#btn-limpar');
    var $btnSalvar           = $('#btn-salvar');
    var $btnConfirmarExcluir = $('#btn-confirmar-excluir');

    var modalObj        = new bootstrap.Modal($modalEl[0]);
    var modalExcluirObj = new bootstrap.Modal($('#modal-excluir')[0]);
    var idParaExcluir   = null;
    var _dt             = null;

    async function inicializar() {
        window.AGAPE.Utils.Sidebar.inicializar();
        await _carregarLista();
    }

    async function _carregarLista() {
        $tabelaCorpo.html('<tr><td colspan="3" class="tabela-vazia">Carregando...</td></tr>');
        _renderizarTabela(await ctrl.listar());
    }

    function _renderizarTabela(resultado) {
        if (resultado.status !== 'ok') {
            if (_dt) { _dt.destroy(); _dt = null; }
            $tabelaCorpo.html(
                '<tr><td colspan="3" class="tabela-vazia text-danger">' +
                '<i class="bi bi-exclamation-triangle me-1"></i>' +
                _esc(resultado.erro || 'Erro ao carregar dados.') +
                '</td></tr>'
            );
            return;
        }

        var lista = Array.isArray(resultado.dados) ? resultado.dados : [];
        var dados = lista.map(function (c) {
            var ativo = (c.ativo === true || c.ativo === 1 || c.ativo === 'true');
            return { idCatEvento: c.idCatEvento, nome: c.nome, ativo: ativo };
        });

        if (_dt) {
            _dt.clear().rows.add(dados).draw();
            return;
        }

        _dt = $tabelaCorpo.closest('table').DataTable({
            dom: '<"top d-flex justify-content-end" f>rt<"bottom d-flex justify-content-between" l p>',
            searching: false,
            info: false,
            data: dados,
            columnDefs: [
                { className: 'text-center', targets: '_all' }
            ],
            columns: [
                { data: 'nome', render: function (d) { return _esc(d); } },
                { data: 'ativo', render: function (d) {
                    return d ? '<span class="badge-ativo">Ativo</span>' : '<span class="badge-inativo">Inativo</span>';
                }},
                { data: null, orderable: false, render: function (d, t, row) {
                    return '<button class="btn-acao btn-editar me-1" ' +
                        'data-id="' + row.idCatEvento + '" ' +
                        'data-nome="' + _esc(row.nome) + '" ' +
                        'data-ativo="' + row.ativo + '" title="Editar">' +
                        '<i class="bi bi-pencil"></i></button>' +
                        '<button class="btn-acao btn-excluir" ' +
                        'data-id="' + row.idCatEvento + '" ' +
                        'data-nome="' + _esc(row.nome) + '" title="Excluir">' +
                        '<i class="bi bi-trash"></i></button>';
                }}
            ],
            language: {
                decimal: ',', thousands: '.',
                emptyTable:   'Nenhuma categoria encontrada',
                info:         'Mostrando _START_ a _END_ de _TOTAL_ registro(s)',
                infoEmpty:    'Nenhum registro encontrado',
                infoFiltered: '(filtrado de _MAX_ no total)',
                lengthMenu:   'Mostrar _MENU_ por página',
                search:       'Buscar:',
                zeroRecords:  'Nenhuma categoria encontrada',
                paginate: {
                    first: '<i class="bi bi-chevron-double-left"></i>',
                    last:  '<i class="bi bi-chevron-double-right"></i>',
                    next:  '<i class="bi bi-chevron-right"></i>',
                    previous: '<i class="bi bi-chevron-left"></i>'
                }
            },
            pageLength: 10,
            lengthMenu: [5, 10, 25, 50],
            order: [[0, 'asc']]
        });
    }

    $tabelaCorpo.on('click', '.btn-editar', function () {
        _abrirModalEdicao($(this).data());
    });

    $tabelaCorpo.on('click', '.btn-excluir', function () {
        idParaExcluir = $(this).data('id');
        $('#excluir-nome').text($(this).data('nome'));
        modalExcluirObj.show();
    });

    $btnCadastrar.on('click', function () {
        $modalTitulo.text('Cadastrar Categoria de Evento');
        validador.resetar($formCategoria[0]);
        $inputId.val('');
        $inputNome.val('');
        $selectAtivo.val('true');
        $selectAtivo.prop('disabled', true);
        modalObj.show();
    });

    function _abrirModalEdicao(dados) {
        $modalTitulo.text('Alterar Categoria de Evento');
        validador.resetar($formCategoria[0]);
        $inputId.val(dados.id);
        $inputNome.val(dados.nome);
        $selectAtivo.val(dados.ativo ? 'true' : 'false');
        $selectAtivo.prop('disabled', false);
        $secaoAtivo.show();
        modalObj.show();
    }

    $btnSalvar.on('click', async function () {
        if (!validador.validarFormulario($formCategoria[0])) return;

        var dados = {
            idCatEvento: $inputId.val() || null,
            nome:        $inputNome.val().trim(),
            ativo:       $selectAtivo.val() === 'true'
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

    $btnConfirmarExcluir.on('click', async function () {
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

    $btnFiltrar.on('click', async function () {
        $tabelaCorpo.html('<tr><td colspan="3" class="tabela-vazia">Filtrando...</td></tr>');
        _renderizarTabela(await ctrl.filtrar({ nome: $filtrNome.val(), ativo: $filtrAtivo.val() }));
    });

    $btnLimpar.on('click', async function () {
        $filtrNome.val('');
        $filtrAtivo.val('');
        await _carregarLista();
    });

    function _esc(texto) {
        return $('<div>').text(texto == null ? '' : String(texto)).html();
    }

    $(inicializar);

}(jQuery));
