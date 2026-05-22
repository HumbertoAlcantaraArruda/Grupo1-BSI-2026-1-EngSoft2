/* produtos.js — View: vincula eventos ao DOM e delega ao Controller */

(function ($) {

    if (!window.AGAPE.Utils.Auth.getInstance().requireLogin()) return;

    var ctrl      = window.AGAPE.Controllers.ProdutosController.getInstance();
    var mascaras  = window.AGAPE.Utils.Mascaras.getInstance();
    var validador = window.AGAPE.Utils.Validador.getInstance();

    var $tabelaCorpo         = $('#tabela-corpo');
    var $modalEl             = $('#modal-produto');
    var $formProduto         = $('#form-produto');
    var $inputIdProd         = $('#idProd');
    var $inputNome           = $('#nome');
    var $selectCategoria     = $('#idCatProd');
    var $inputValorUni       = $('#valorUni');
    var $inputQtde           = $('#qtdeAtual');
    var $modalTitulo         = $('#modal-titulo');
    var $filtrNome           = $('#filtro-nome');
    var $filtrCategoria      = $('#filtro-categoria');
    var $filtrOperador       = $('#filtro-operador');
    var $filtrQtde           = $('#filtro-qtde');
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
        mascaras.aplicar('#valorUni', 'monetario');
        await _carregarCategorias();
        await _carregarLista();
    }

    async function _carregarCategorias() {
        var resultado = await ctrl.carregarCategorias();

        var opcaoPadrao     = '<option value="">Todos</option>';
        var opcaoPadraoForm = '<option value="">Selecione...</option>';

        if (resultado.status !== 'ok' || !Array.isArray(resultado.dados)) {
            $selectCategoria.html(opcaoPadraoForm);
            $filtrCategoria.html(opcaoPadrao);
            return;
        }

        var opcoesCategoria = resultado.dados
            .filter(function (c) { return c.ativo !== false; })
            .map(function (c) {
                return '<option value="' + c.idCatProd + '">' + _esc(c.nome) + '</option>';
            }).join('');

        $selectCategoria.html(opcaoPadraoForm + opcoesCategoria);
        $filtrCategoria.html(opcaoPadrao + opcoesCategoria);
    }

    async function _carregarLista() {
        $tabelaCorpo.html('<tr><td colspan="5" class="tabela-vazia">Carregando...</td></tr>');
        _renderizarTabela(await ctrl.listar());
    }

    function _renderizarTabela(resultado) {
        if (resultado.status !== 'ok') {
            if (_dt) { _dt.destroy(); _dt = null; }
            $tabelaCorpo.html(
                '<tr><td colspan="5" class="tabela-vazia text-danger">' +
                '<i class="bi bi-exclamation-triangle me-1"></i>' +
                _esc(resultado.erro || 'Erro ao carregar dados.') +
                '</td></tr>'
            );
            return;
        }

        var lista = Array.isArray(resultado.dados) ? resultado.dados : [];
        var dados = lista.map(function (p) {
            return {
                idProd:        p.idProd,
                nome:          p.nome,
                nomeCategoria: p.nomeCategoria || p.idCatProd || '-',
                idCatProd:     p.idCatProd,
                qtdeAtual:     p.qtdeAtual,
                valorUni:      p.valorUni
            };
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
                { data: 'nome',          render: function (d) { return _esc(d); } },
                { data: 'nomeCategoria', render: function (d) { return _esc(d); } },
                { data: 'qtdeAtual' },
                { data: 'valorUni',      render: function (d) {
                    return 'R$ ' + mascaras.numeroParaMonetario(d);
                }},
                { data: null, orderable: false, render: function (d, t, row) {
                    return '<button class="btn-acao btn-editar me-1" ' +
                        'data-id="'       + row.idProd    + '" ' +
                        'data-nome="'     + _esc(row.nome) + '" ' +
                        'data-idcatprod="'+ row.idCatProd  + '" ' +
                        'data-valoruni="' + row.valorUni   + '" ' +
                        'data-qtde="'     + row.qtdeAtual  + '" title="Editar">' +
                        '<i class="bi bi-pencil"></i></button>' +
                        '<button class="btn-acao btn-excluir" ' +
                        'data-id="'   + row.idProd      + '" ' +
                        'data-nome="' + _esc(row.nome) + '" title="Excluir">' +
                        '<i class="bi bi-trash"></i></button>';
                }}
            ],
            language: {
                decimal: ',', thousands: '.',
                emptyTable:   'Nenhum produto encontrado',
                info:         'Mostrando _START_ a _END_ de _TOTAL_ registro(s)',
                infoEmpty:    'Nenhum registro encontrado',
                infoFiltered: '(filtrado de _MAX_ no total)',
                lengthMenu:   'Mostrar _MENU_ por página',
                search:       'Buscar:',
                zeroRecords:  'Nenhum produto encontrado',
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
        $modalTitulo.text('Cadastrar Produto');
        validador.resetar($formProduto[0]);
        $inputIdProd.val('');
        $inputNome.val('');
        $inputValorUni.val('');
        $inputQtde.val('');
        $selectCategoria.prop('selectedIndex', 0);
        mascaras.remover('#valorUni');
        mascaras.aplicar('#valorUni', 'monetario');
        modalObj.show();
    });

    function _abrirModalEdicao(dados) {
        $modalTitulo.text('Alterar Produto');
        validador.resetar($formProduto[0]);
        $inputIdProd.val(dados.id);
        $inputNome.val(dados.nome);
        $inputQtde.val(dados.qtde);
        $selectCategoria.val(dados.idcatprod);
        mascaras.remover('#valorUni');
        $inputValorUni.val(mascaras.numeroParaMonetario(dados.valoruni));
        mascaras.aplicar('#valorUni', 'monetario');
        modalObj.show();
    }

    $btnSalvar.on('click', async function () {
        if (!validador.validarFormulario($formProduto[0])) return;

        var dados = {
            idProd:    $inputIdProd.val() || null,
            nome:      $inputNome.val().trim(),
            idCatProd: $selectCategoria.val(),
            valorUni:  mascaras.monetarioParaNumero($inputValorUni.val()),
            qtdeAtual: $inputQtde.val()
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

    $btnConfirmarExcluir.on('click', async function () {
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

    $btnFiltrar.on('click', async function () {
        var filtros = {
            nome:       $filtrNome.val(),
            idCatProd:  $filtrCategoria.val(),
            operador:   $filtrOperador.val(),
            quantidade: $filtrQtde.val()
        };
        $tabelaCorpo.html('<tr><td colspan="5" class="tabela-vazia">Filtrando...</td></tr>');
        _renderizarTabela(await ctrl.filtrar(filtros));
    });

    $btnLimpar.on('click', async function () {
        $filtrNome.val('');
        $filtrCategoria.val('');
        $filtrOperador.val('');
        $filtrQtde.val('');
        await _carregarLista();
    });

    function _esc(texto) {
        return $('<div>').text(texto == null ? '' : String(texto)).html();
    }

    $(inicializar);

}(jQuery));
