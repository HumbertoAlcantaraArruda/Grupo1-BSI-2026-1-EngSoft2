/* evento.js — View: vincula eventos ao DOM e delega ao Controller */

(function ($) {

    if (!window.AGAPE.Utils.Auth.getInstance().requireLogin()) return;

    var ctrl      = window.AGAPE.Controllers.EventoController.getInstance();
    var mascaras  = window.AGAPE.Utils.Mascaras.getInstance();
    var validador = window.AGAPE.Utils.Validador.getInstance();

    var $tabelaCorpo              = $('#tabela-corpo');
    var $modalEl                  = $('#modal-evento');
    var $formEvento               = $('#form-evento');
    var $inputIdEvento            = $('#idEvento');
    var $inputNome                = $('#nome');
    var $selectCategoria          = $('#idCatEvento');
    var $selectResponsavel        = $('#idUsuarioResponsavel');
    var $selectStatus             = $('#idEventoStatus');
    var $inputDataInicio          = $('#dataInicio');
    var $inputDataFim             = $('#dataFim');
    var $inputDataEvento          = $('#dataEvento');
    var $inputTotVagas            = $('#totVagas');
    var $inputVagasDisp           = $('#vagasDisp');
    var $inputValorInscricao      = $('#valorInscricao');
    var $inputDataAberturaEspera  = $('#dataAberturaListaEspera');
    var $inputImagemEvento        = $('#imagemEvento');
    var $secaoStatus              = $('#secao-status');
    var $secaoVagasDisp           = $('#secao-vagas-disp');
    var $modalTitulo              = $('#modal-titulo');
    var $filtrNome                = $('#filtro-nome');
    var $filtrCategoria           = $('#filtro-categoria');
    var $filtrStatus              = $('#filtro-status');
    var $btnCadastrar             = $('#btn-cadastrar');
    var $btnFiltrar               = $('#btn-filtrar');
    var $btnLimpar                = $('#btn-limpar');
    var $btnSalvar                = $('#btn-salvar');
    var $btnConfirmarExcluir      = $('#btn-confirmar-excluir');

    var modalObj        = new bootstrap.Modal($modalEl[0]);
    var modalExcluirObj = new bootstrap.Modal($('#modal-excluir')[0]);
    var idParaExcluir   = null;
    var _dt             = null;

    var _STATUS_LABELS = { 1: 'Ativo', 2: 'Cancelado', 3: 'Adiado', 4: 'Finalizado' };
    var _STATUS_CORES  = { 1: '#41733F', 2: '#8C142A', 3: '#cc6600', 4: '#6c757d' };

    // ── Inicialização ─────────────────────────────────────────────────────────

    async function inicializar() {
        window.AGAPE.Utils.Sidebar.inicializar();
        mascaras.aplicar('#valorInscricao', 'monetario');
        await Promise.all([_carregarCategorias(), _carregarUsuarios()]);
        await _carregarLista();
    }

    // ── Combos auxiliares ─────────────────────────────────────────────────────

    async function _carregarCategorias() {
        var resultado = await ctrl.carregarCategorias();
        if (resultado.status !== 'ok' || !Array.isArray(resultado.dados)) return;

        var opcoes = resultado.dados
            .filter(function (c) { return c.ativo !== false && c.ativo !== 0; })
            .map(function (c) {
                return '<option value="' + c.idCatEvento + '">' + _esc(c.nome) + '</option>';
            }).join('');

        $selectCategoria.append(opcoes);
        $filtrCategoria.append(opcoes);
    }

    async function _carregarUsuarios() {
        var resultado = await ctrl.carregarUsuarios();
        if (resultado.status !== 'ok' || !Array.isArray(resultado.dados)) return;

        var opcoes = resultado.dados
            .filter(function (u) { return u.status === 1 || u.status === '1'; })
            .map(function (u) {
                return '<option value="' + u.idUsuario + '">' + _esc(u.nome) + '</option>';
            }).join('');

        $selectResponsavel.append(opcoes);
    }

    // ── Listagem ──────────────────────────────────────────────────────────────

    async function _carregarLista() {
        $tabelaCorpo.html('<tr><td colspan="7" class="tabela-vazia">Carregando...</td></tr>');
        _renderizarTabela(await ctrl.listar());
    }

    function _renderizarTabela(resultado) {
        if (resultado.status !== 'ok') {
            if (_dt) { _dt.destroy(); _dt = null; }
            $tabelaCorpo.html(
                '<tr><td colspan="7" class="tabela-vazia text-danger">' +
                '<i class="bi bi-exclamation-triangle me-1"></i>' +
                _esc(resultado.erro || 'Erro ao carregar dados.') +
                '</td></tr>'
            );
            return;
        }

        var lista = Array.isArray(resultado.dados) ? resultado.dados : [];
        var dados = lista.map(function (e) {
            return {
                idEvento:               e.idEvento,
                idUsuarioResponsavel:   e.idUsuarioResponsavel,
                idCatEvento:            e.idCatEvento,
                nomeCategoria:          e.nomeCategoria          || '',
                nomeResponsavel:        e.nomeResponsavel        || '',
                nome:                   e.nome                   || '',
                dataInicio:             e.dataInicio             || '',
                dataFim:                e.dataFim                || '',
                dataEvento:             e.dataEvento             || '',
                totVagas:               e.totVagas,
                vagasDisp:              e.vagasDisp,
                idEventoStatus:         e.idEventoStatus         || 1,
                dataAberturaListaEspera:e.dataAberturaListaEspera|| null,
                valorInscricao:         e.valorInscricao         || null,
                imagemEvento:           e.imagemEvento           || null
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
                { data: 'nome',         render: function (d) { return _esc(d); }, className: 'text-start' },
                { data: 'nomeCategoria',render: function (d) { return _esc(d) || '—'; } },
                { data: 'dataEvento',   render: function (d) { return _formatarDataHora(d); } },
                { data: null, orderable: false, render: function (d, t, row) {
                    var disp  = row.vagasDisp  != null ? row.vagasDisp  : '?';
                    var total = row.totVagas   != null ? row.totVagas   : '?';
                    var cor   = (row.vagasDisp === 0) ? 'color:#8C142A;font-weight:600' : '';
                    return '<span style="' + cor + '">' + disp + '</span> / ' + total;
                }},
                { data: 'valorInscricao', render: function (d) {
                    return d != null ? 'R$ ' + _moeda(d) : '<span class="text-muted">Gratuito</span>';
                }},
                { data: 'idEventoStatus', render: function (d) {
                    var label = _STATUS_LABELS[d] || d;
                    var cor   = _STATUS_CORES[d]  || '#6c757d';
                    return '<span style="background:' + cor + ';color:#fff;font-size:.75rem;' +
                           'padding:.3em .65em;border-radius:.375rem;font-weight:500">' + label + '</span>';
                }},
                { data: null, orderable: false, render: function (d, t, row) {
                    return '<button class="btn-acao btn-editar me-1" data-id="' + row.idEvento + '" title="Editar">' +
                           '<i class="bi bi-pencil"></i></button>' +
                           '<button class="btn-acao btn-excluir" ' +
                           'data-id="' + row.idEvento + '" ' +
                           'data-nome="' + _esc(row.nome) + '" title="Excluir">' +
                           '<i class="bi bi-trash"></i></button>';
                }}
            ],
            language: {
                decimal: ',', thousands: '.',
                emptyTable:   'Nenhum evento encontrado',
                info:         'Mostrando _START_ a _END_ de _TOTAL_ registro(s)',
                infoEmpty:    'Nenhum registro encontrado',
                infoFiltered: '(filtrado de _MAX_ no total)',
                lengthMenu:   'Mostrar _MENU_ por página',
                search:       'Buscar:',
                zeroRecords:  'Nenhum evento encontrado',
                paginate: {
                    first: '<i class="bi bi-chevron-double-left"></i>',
                    last:  '<i class="bi bi-chevron-double-right"></i>',
                    next:  '<i class="bi bi-chevron-right"></i>',
                    previous: '<i class="bi bi-chevron-left"></i>'
                }
            },
            pageLength: 10,
            lengthMenu: [5, 10, 25, 50],
            order: [[2, 'asc']]
        });
    }

    // ── Eventos da tabela ─────────────────────────────────────────────────────

    $tabelaCorpo.on('click', '.btn-editar', function () {
        var id   = $(this).data('id');
        var lista = ctrl._listaCache || [];
        var evento = null;
        for (var i = 0; i < lista.length; i++) {
            if (String(lista[i].idEvento) === String(id)) { evento = lista[i]; break; }
        }
        if (evento) _abrirModalEdicao(evento);
    });

    $tabelaCorpo.on('click', '.btn-excluir', function () {
        idParaExcluir = $(this).data('id');
        $('#excluir-nome').text($(this).data('nome'));
        modalExcluirObj.show();
    });

    // ── Modal: Cadastrar ──────────────────────────────────────────────────────

    $btnCadastrar.on('click', function () {
        $modalTitulo.text('Cadastrar Evento');
        validador.resetar($formEvento[0]);
        $inputIdEvento.val('');
        $inputNome.val('');
        $selectCategoria.val('');
        $selectResponsavel.val('');
        $selectStatus.val('1');
        $inputDataInicio.val('');
        $inputDataFim.val('');
        $inputDataEvento.val('');
        $inputTotVagas.val('');
        $inputVagasDisp.val('');
        $inputValorInscricao.val('');
        $inputDataAberturaEspera.val('');
        $inputImagemEvento.val('');
        $secaoStatus.hide();
        $secaoVagasDisp.hide();
        modalObj.show();
    });

    // ── Modal: Editar ─────────────────────────────────────────────────────────

    function _abrirModalEdicao(e) {
        $modalTitulo.text('Alterar Evento');
        validador.resetar($formEvento[0]);
        $inputIdEvento.val(e.idEvento);
        $inputNome.val(e.nome || '');
        $selectCategoria.val(e.idCatEvento || '');
        $selectResponsavel.val(e.idUsuarioResponsavel || '');
        $selectStatus.val(e.idEventoStatus || 1);
        $inputDataInicio.val(_isoParaLocal(e.dataInicio));
        $inputDataFim.val(_isoParaLocal(e.dataFim));
        $inputDataEvento.val(_isoParaLocal(e.dataEvento));
        $inputTotVagas.val(e.totVagas != null ? e.totVagas : '');
        $inputVagasDisp.val(e.vagasDisp != null ? e.vagasDisp : '');
        $inputDataAberturaEspera.val(_isoParaLocal(e.dataAberturaListaEspera));
        $inputImagemEvento.val(e.imagemEvento || '');

        mascaras.remover('#valorInscricao');
        $inputValorInscricao.val(e.valorInscricao != null ? mascaras.numeroParaMonetario(e.valorInscricao) : '');
        mascaras.aplicar('#valorInscricao', 'monetario');

        $secaoStatus.show();
        $secaoVagasDisp.show();
        modalObj.show();
    }

    // ── Salvar ────────────────────────────────────────────────────────────────

    $btnSalvar.on('click', async function () {
        if (!validador.validarFormulario($formEvento[0])) return;

        var novoCadastro = !$inputIdEvento.val();
        var dados = {
            idEvento:               $inputIdEvento.val()           || null,
            nome:                   $inputNome.val().trim(),
            idCatEvento:            $selectCategoria.val(),
            idUsuarioResponsavel:   $selectResponsavel.val(),
            idEventoStatus:         $selectStatus.val()            || 1,
            dataInicio:             $inputDataInicio.val(),
            dataFim:                $inputDataFim.val(),
            dataEvento:             $inputDataEvento.val(),
            totVagas:               $inputTotVagas.val(),
            vagasDisp:              $inputVagasDisp.val()          || null,
            valorInscricao:         mascaras.monetarioParaNumero($inputValorInscricao.val()) || null,
            dataAberturaListaEspera:$inputDataAberturaEspera.val() || null,
            imagemEvento:           $inputImagemEvento.val().trim()|| null
        };

        var resultado = novoCadastro
            ? await ctrl.cadastrar(dados)
            : await ctrl.alterar(dados);

        if (resultado.status === 'ok') {
            modalObj.hide();
            validador.mostrarAlerta(
                novoCadastro ? 'Evento cadastrado com sucesso!' : 'Evento alterado com sucesso!',
                'sucesso'
            );
            await _carregarLista();
        } else {
            validador.mostrarAlerta(resultado.erro || 'Erro ao salvar evento.', 'erro');
        }
    });

    // ── Excluir ───────────────────────────────────────────────────────────────

    $btnConfirmarExcluir.on('click', async function () {
        if (!idParaExcluir) return;
        var resultado = await ctrl.excluir(idParaExcluir);
        modalExcluirObj.hide();
        idParaExcluir = null;
        if (resultado.status === 'ok') {
            validador.mostrarAlerta('Evento excluído com sucesso!', 'sucesso');
            await _carregarLista();
        } else {
            validador.mostrarAlerta(resultado.erro || 'Erro ao excluir evento.', 'erro');
        }
    });

    // ── Filtros ───────────────────────────────────────────────────────────────

    $btnFiltrar.on('click', function () {
        _renderizarTabela(ctrl.filtrar({
            nome:           $filtrNome.val(),
            idCatEvento:    $filtrCategoria.val(),
            idEventoStatus: $filtrStatus.val()
        }));
    });

    $btnLimpar.on('click', async function () {
        $filtrNome.val('');
        $filtrCategoria.val('');
        $filtrStatus.val('');
        await _carregarLista();
    });

    // ── Utilitários ───────────────────────────────────────────────────────────

    function _esc(texto) {
        return $('<div>').text(texto == null ? '' : String(texto)).html();
    }

    function _moeda(valor) {
        return parseFloat(valor || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    function _formatarDataHora(iso) {
        if (!iso) return '—';
        var d = new Date(iso.replace('T', ' ').replace(/-/g, '/'));
        if (isNaN(d)) return _esc(iso);
        var pad = function (n) { return String(n).padStart(2, '0'); };
        return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() +
               ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    function _isoParaLocal(iso) {
        if (!iso) return '';
        var sem = iso.replace(' ', 'T');
        if (sem.length === 16) return sem;
        return sem.substring(0, 16);
    }

    $(inicializar);

}(jQuery));
