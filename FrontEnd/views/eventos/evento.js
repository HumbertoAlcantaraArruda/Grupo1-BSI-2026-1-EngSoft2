/* evento.js — View do caso de uso RF_F1: Controlar Eventos
 *
 * Responsabilidade: vincula eventos DOM, delega ao EventoController e exibe feedback.
 * Não contém lógica de negócio — essa está no Controller/Model/Backend.
 */

(function ($) {

    if (!window.AGAPE.Utils.Auth.getInstance().requireLogin()) return;

    // GRASP: Controller (frontend) — instância única que conhece as operações de domínio
    var ctrl      = window.AGAPE.Controllers.EventoController.getInstance();
    var mascaras  = window.AGAPE.Utils.Mascaras.getInstance();
    var validador = window.AGAPE.Utils.Validador.getInstance();

    // ── Referências DOM ───────────────────────────────────────────────────────

    var $tabelaCorpo             = $('#tabela-corpo');
    var $modalEl                 = $('#modal-evento');
    var $formEvento              = $('#form-evento');
    var $inputIdEvento           = $('#idEvento');
    var $inputNome               = $('#nome');
    var $selectCategoria         = $('#idCatEvento');
    var $selectResponsavel       = $('#idUsuarioResponsavel');
    var $selectStatus            = $('#idEventoStatus');
    var $inputDataInicio         = $('#dataInicio');
    var $inputDataFim            = $('#dataFim');
    var $inputDataEvento         = $('#dataEvento');
    var $inputTotVagas           = $('#totVagas');
    var $inputVagasDisp          = $('#vagasDisp');
    var $inputValorInscricao     = $('#valorInscricao');
    var $inputDataAberturaEspera = $('#dataAberturaListaEspera');
    var $inputImagemEvento       = $('#imagemEvento');
    var $previewImagem           = $('#preview-imagem');
    var $imgPreview              = $('#img-preview');
    var $nomeImagemAtual         = $('#nome-imagem-atual');
    var $secaoStatus             = $('#secao-status');
    var $secaoVagasDisp          = $('#secao-vagas-disp');
    var $modalTitulo             = $('#modal-titulo');
    var $filtrNome               = $('#filtro-nome');
    var $filtrCategoria          = $('#filtro-categoria');
    var $filtrStatus             = $('#filtro-status');

    // ── Estado da View ────────────────────────────────────────────────────────

    var modalObj        = new bootstrap.Modal($modalEl[0]);
    var modalExcluirObj = new bootstrap.Modal($('#modal-excluir')[0]);
    var modalAdiarObj   = new bootstrap.Modal($('#modal-adiar')[0]);
    var modalReabrirObj = new bootstrap.Modal($('#modal-reabrir')[0]);
    var idParaExcluir   = null;
    var idParaAdiar     = null;
    var idParaReabrir   = null;
    var _dt             = null;
    var _imagemBase64      = null;
    var _nomeImagemEvento  = null;

    var _STATUS_LABELS = { 1: 'Ativo', 2: 'Cancelado', 3: 'Adiado', 4: 'Finalizado' };
    var _STATUS_CORES  = { 1: '#41733F', 2: '#8C142A', 3: '#cc6600', 4: '#6c757d' };

    // ── Inicialização ─────────────────────────────────────────────────────────

    async function inicializar() {
        window.AGAPE.Utils.Sidebar.inicializar();
        mascaras.aplicar('#valorInscricao', 'monetario');
        _inicializarSelect2();
        await Promise.all([_carregarCategorias(), _carregarUsuarios()]);
        await _carregarLista();
    }

    // ── Select2 — seletor avançado de categoria (RF_F1 UX) ───────────────────

    function _inicializarSelect2() {
        var opcoesComuns = {
            allowClear:     true,
            dropdownParent: $modalEl,
            language: {
                noResults: function () { return 'Nenhum resultado encontrado.'; },
                searching: function () { return 'Buscando...'; }
            }
        };

        $selectCategoria.select2($.extend({ placeholder: 'Selecione a categoria...' }, opcoesComuns));
        $selectResponsavel.select2($.extend({ placeholder: 'Selecione o responsável...' }, opcoesComuns));
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

        // Popula tanto o Select2 do formulário quanto o select de filtro
        $selectCategoria.append(opcoes).trigger('change'); // notifica Select2
        $filtrCategoria.append(opcoes);
    }

    async function _carregarUsuarios() {
        var resultado = await ctrl.carregarUsuarios();
        if (resultado.status !== 'ok' || !Array.isArray(resultado.dados)) return;

        var opcoes = resultado.dados
            .filter(function (u) {
                var ativo = u.status === 1 || u.status === '1';
                var nivel = u.nivel === 'COLAB' || u.nivel === 'ADM';
                return ativo && nivel;
            })
            .map(function (u) {
                var prefixo = u.nivel === 'ADM' ? '[ADM] ' : '';
                return '<option value="' + u.idUsuario + '">' + prefixo + _esc(u.nome) + '</option>';
            }).join('');

        $selectResponsavel.append(opcoes).trigger('change'); // notifica Select2
    }

    // ── Listagem e DataTable ──────────────────────────────────────────────────

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
                idEvento:                e.idEvento,
                idUsuarioResponsavel:    e.idUsuarioResponsavel,
                idCatEvento:             e.idCatEvento,
                nomeCatEvento:           e.nomeCatEvento           || e.nomeCategoria || '',
                nome:                    e.nome                    || '',
                dataInicio:              e.dataInicio              || '',
                dataFim:                 e.dataFim                 || '',
                dataEvento:              e.dataEvento              || '',
                totVagas:                e.totVagas,
                vagasDisp:               e.vagasDisp,
                idEventoStatus:          e.idEventoStatus          != null ? e.idEventoStatus : 1,
                nomeStatus:              e.nomeStatus              || '',
                dataAberturaListaEspera: e.dataAberturaListaEspera || null,
                valorInscricao:          e.valorInscricao          || null,
                imagemEvento:            e.imagemEvento            || null
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
            columnDefs: [{ className: 'text-center', targets: '_all' }],
            columns: [
                { data: 'nome', render: function (d) { return _esc(d); }, className: 'text-start' },
                { data: 'nomeCatEvento', render: function (d) { return _esc(d) || '—'; } },
                { data: 'dataEvento', render: function (d) { return _formatarDataHora(d); } },
                { data: null, orderable: false, render: function (d, t, row) {
                    var disp  = row.vagasDisp  != null ? row.vagasDisp  : '?';
                    var total = row.totVagas   != null ? row.totVagas   : '?';
                    var cor   = (row.vagasDisp === 0) ? 'color:#8C142A;font-weight:600' : '';
                    return '<span style="' + cor + '">' + disp + '</span> / ' + total;
                }},
                { data: 'valorInscricao', render: function (d) {
                    return d != null
                        ? 'R$&nbsp;' + _moeda(d)
                        : '<span class="text-muted">Gratuito</span>';
                }},
                { data: 'idEventoStatus', render: function (d) {
                    var label = _STATUS_LABELS[d] || d;
                    var cor   = _STATUS_CORES[d]  || '#6c757d';
                    return '<span style="background:' + cor + ';color:#fff;font-size:.75rem;' +
                           'padding:.3em .65em;border-radius:.375rem;font-weight:500">' + label + '</span>';
                }},
                // Coluna de ações: dropdown dinâmico por status (RF_F1)
                { data: null, orderable: false, render: function (d, t, row) {
                    var st   = row.idEventoStatus;
                    var id   = row.idEvento;
                    var nome = _esc(row.nome);

                    // Finalizado → nenhuma ação permitida
                    if (st == 4) {
                        return '<span class="text-muted fst-italic small">—</span>';
                    }

                    var di  = '<li><hr class="dropdown-divider"></li>';
                    var itens = '';

                    if (st == 2) {
                        // Cancelado: só Reabrir (com nova data) + Excluir
                        itens =
                            '<li><button class="dropdown-item btn-reabrir" ' +
                            '  data-id="' + id + '" data-nome="' + nome + '">' +
                            '  <i class="bi bi-arrow-counterclockwise me-2 text-success"></i>' +
                            '  Reabrir</button></li>' +
                            di +
                            '<li><button class="dropdown-item text-danger btn-excluir" ' +
                            '  data-id="' + id + '" data-nome="' + nome + '">' +
                            '  <i class="bi bi-trash me-2"></i>Excluir</button></li>';
                    } else {
                        // Ativo (1) ou Adiado (3): menu completo (sem Abrir para Ativo)
                        itens =
                            '<li><button class="dropdown-item btn-editar" data-id="' + id + '">' +
                            '  <i class="bi bi-pencil me-2"></i>Editar</button></li>' +
                            di;
                        if (st != 1) {
                            // Adiado pode ser reaberto diretamente
                            itens +=
                                '<li><button class="dropdown-item btn-abrir" ' +
                                '  data-id="' + id + '" data-nome="' + nome + '">' +
                                '  <i class="bi bi-play-circle me-2 text-success"></i>' +
                                '  Abrir</button></li>';
                        }
                        itens +=
                            '<li><button class="dropdown-item btn-finalizar" ' +
                            '  data-id="' + id + '" data-nome="' + nome + '">' +
                            '  <i class="bi bi-check-circle me-2 text-secondary"></i>' +
                            '  Finalizar</button></li>' +
                            '<li><button class="dropdown-item btn-cancelar" ' +
                            '  data-id="' + id + '" data-nome="' + nome + '">' +
                            '  <i class="bi bi-x-circle me-2 text-danger"></i>' +
                            '  Cancelar</button></li>' +
                            '<li><button class="dropdown-item btn-adiar" ' +
                            '  data-id="' + id + '" data-nome="' + nome + '">' +
                            '  <i class="bi bi-calendar-x me-2 text-warning"></i>' +
                            '  Adiar</button></li>' +
                            di +
                            '<li><button class="dropdown-item text-danger btn-excluir" ' +
                            '  data-id="' + id + '" data-nome="' + nome + '">' +
                            '  <i class="bi bi-trash me-2"></i>Excluir</button></li>';
                    }

                    return (
                        '<div class="dropdown">' +
                        '<button class="btn btn-sm btn-outline-secondary dropdown-toggle" ' +
                        '  type="button" data-bs-toggle="dropdown" aria-expanded="false">' +
                        '  <i class="bi bi-three-dots-vertical"></i>' +
                        '</button>' +
                        '<ul class="dropdown-menu dropdown-menu-end">' + itens + '</ul>' +
                        '</div>'
                    );
                }}
            ],
            language: {
                decimal: ',', thousands: '.',
                emptyTable:   'Nenhum evento encontrado',
                lengthMenu:   'Mostrar _MENU_ por página',
                zeroRecords:  'Nenhum evento encontrado',
                paginate: {
                    first:    '<i class="bi bi-chevron-double-left"></i>',
                    last:     '<i class="bi bi-chevron-double-right"></i>',
                    next:     '<i class="bi bi-chevron-right"></i>',
                    previous: '<i class="bi bi-chevron-left"></i>'
                }
            },
            pageLength: 10,
            lengthMenu: [5, 10, 25, 50],
            order: [[2, 'asc']]
        });
    }

    // ── Upload de imagem ──────────────────────────────────────────────────────

    $inputImagemEvento.on('change', function () {
        var file = this.files[0];
        if (!file) {
            _imagemBase64 = null; _nomeImagemEvento = null;
            $previewImagem.hide();
            return;
        }
        _nomeImagemEvento = file.name;
        var reader = new FileReader();
        reader.onload = function (ev) {
            _imagemBase64 = ev.target.result;
            $imgPreview.attr('src', _imagemBase64);
            $nomeImagemAtual.text(file.name);
            $previewImagem.show();
        };
        reader.readAsDataURL(file);
    });

    // ── Ações da tabela ───────────────────────────────────────────────────────

    // Editar
    $tabelaCorpo.on('click', '.btn-editar', function () {
        var id    = $(this).data('id');
        var lista = ctrl._listaCache || [];
        var ev    = null;
        for (var i = 0; i < lista.length; i++) {
            if (String(lista[i].idEvento) === String(id)) { ev = lista[i]; break; }
        }
        if (ev) _abrirModalEdicao(ev);
    });

    // Excluir
    $tabelaCorpo.on('click', '.btn-excluir', function () {
        idParaExcluir = $(this).data('id');
        $('#excluir-nome').text($(this).data('nome'));
        modalExcluirObj.show();
    });

    // Abrir evento — Adiado (sem modal, nova data desnecessária)
    $tabelaCorpo.on('click', '.btn-abrir', async function () {
        var id   = $(this).data('id');
        var nome = $(this).data('nome');
        var resultado = await ctrl.abrir(id, null);
        if (resultado.status === 'ok') {
            validador.mostrarAlerta('Evento "' + nome + '" aberto com sucesso!', 'sucesso');
            await _carregarLista();
        } else {
            validador.mostrarAlerta(resultado.erro || 'Erro ao abrir evento.', 'erro');
        }
    });

    // Reabrir evento Cancelado — exige nova data (modal)
    $tabelaCorpo.on('click', '.btn-reabrir', function () {
        idParaReabrir = $(this).data('id');
        $('#reabrir-nome').text($(this).data('nome'));
        $('#reabrir-nova-data').val('');
        modalReabrirObj.show();
    });

    // Finalizar evento
    $tabelaCorpo.on('click', '.btn-finalizar', async function () {
        var id   = $(this).data('id');
        var nome = $(this).data('nome');
        var resultado = await ctrl.finalizar(id);
        if (resultado.status === 'ok') {
            validador.mostrarAlerta('Evento "' + nome + '" finalizado com sucesso!', 'sucesso');
            await _carregarLista();
        } else {
            validador.mostrarAlerta(resultado.erro || 'Erro ao finalizar evento.', 'erro');
        }
    });

    // Cancelar evento
    $tabelaCorpo.on('click', '.btn-cancelar', async function () {
        var id   = $(this).data('id');
        var nome = $(this).data('nome');
        var resultado = await ctrl.cancelar(id);
        if (resultado.status === 'ok') {
            validador.mostrarAlerta('Evento "' + nome + '" cancelado com sucesso!', 'sucesso');
            await _carregarLista();
        } else {
            validador.mostrarAlerta(resultado.erro || 'Erro ao cancelar evento.', 'erro');
        }
    });

    // Adiar evento — abre modal de nova data
    $tabelaCorpo.on('click', '.btn-adiar', function () {
        idParaAdiar = $(this).data('id');
        $('#adiar-nome').text($(this).data('nome'));
        $('#adiar-nova-data').val('');
        modalAdiarObj.show();
    });

    // ── Modal: Cadastrar ──────────────────────────────────────────────────────

    $('#btn-cadastrar').on('click', function () {
        $modalTitulo.text('Cadastrar Evento');
        validador.resetar($formEvento[0]);
        $inputIdEvento.val('');
        $inputNome.val('');
        // Select2: reset via trigger
        $selectCategoria.val('').trigger('change');
        $selectResponsavel.val('').trigger('change');
        $selectStatus.val('1');
        $inputDataInicio.val('');
        $inputDataFim.val('');
        $inputDataEvento.val('');
        $inputTotVagas.val('');
        $inputVagasDisp.val('');
        $inputValorInscricao.val('');
        $inputDataAberturaEspera.val('');
        $inputImagemEvento.val('');
        _imagemBase64 = null; _nomeImagemEvento = null;
        $imgPreview.attr('src', ''); $nomeImagemAtual.text(''); $previewImagem.hide();
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
        // Select2: val + trigger para atualizar widget
        $selectCategoria.val(e.idCatEvento || '').trigger('change');
        $selectResponsavel.val(e.idUsuarioResponsavel || '').trigger('change');
        $selectStatus.val(e.idEventoStatus || 1);
        $inputDataInicio.val(_isoParaLocal(e.dataInicio));
        $inputDataFim.val(_isoParaLocal(e.dataFim));
        $inputDataEvento.val(_isoParaLocal(e.dataEvento));
        $inputTotVagas.val(e.totVagas != null ? e.totVagas : '');
        $inputVagasDisp.val(e.vagasDisp != null ? e.vagasDisp : '');
        $inputDataAberturaEspera.val(_isoParaLocal(e.dataAberturaListaEspera));

        mascaras.remover('#valorInscricao');
        $inputValorInscricao.val(
            e.valorInscricao != null ? mascaras.numeroParaMonetario(e.valorInscricao) : ''
        );
        mascaras.aplicar('#valorInscricao', 'monetario');

        $inputImagemEvento.val('');
        _imagemBase64 = null; _nomeImagemEvento = null;
        if (e.imagemEvento) {
            $imgPreview.attr('src', '../../assets/img/' + e.imagemEvento);
            $nomeImagemAtual.text('Imagem atual: ' + e.imagemEvento);
            $previewImagem.show();
        } else {
            $imgPreview.attr('src', ''); $nomeImagemAtual.text(''); $previewImagem.hide();
        }

        $secaoStatus.show();
        $secaoVagasDisp.show();
        modalObj.show();
    }

    // ── Salvar (criar ou alterar) ─────────────────────────────────────────────

    $('#btn-salvar').on('click', async function () {
        if (!validador.validarFormulario($formEvento[0])) return;

        // Validação adicional: Select2 — categoria obrigatória
        if (!$selectCategoria.val()) {
            validador.destacarCampo($selectCategoria.next('.select2')[0], false,
                'Selecione uma categoria.');
            return;
        }

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
            imagemBase64:           _imagemBase64                  || null,
            nomeImagemEvento:       _nomeImagemEvento              || null
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

    $('#btn-confirmar-excluir').on('click', async function () {
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

    // ── Reabrir cancelado (confirmação) ──────────────────────────────────────

    $('#btn-confirmar-reabrir').on('click', async function () {
        var novaData = $('#reabrir-nova-data').val();
        if (!novaData) {
            validador.mostrarAlerta('Informe a nova data do evento.', 'erro');
            return;
        }
        var resultado = await ctrl.abrir(idParaReabrir, novaData);
        modalReabrirObj.hide();
        idParaReabrir = null;
        if (resultado.status === 'ok') {
            validador.mostrarAlerta('Evento reaberto com sucesso!', 'sucesso');
            await _carregarLista();
        } else {
            validador.mostrarAlerta(resultado.erro || 'Erro ao reabrir evento.', 'erro');
        }
    });

    // ── Adiar (confirmação) ───────────────────────────────────────────────────

    $('#btn-confirmar-adiar').on('click', async function () {
        var novaData = $('#adiar-nova-data').val();
        if (!novaData) {
            validador.mostrarAlerta('Informe a nova data do evento.', 'erro');
            return;
        }
        var resultado = await ctrl.adiar(idParaAdiar, novaData);
        modalAdiarObj.hide();
        idParaAdiar = null;
        if (resultado.status === 'ok') {
            validador.mostrarAlerta('Evento adiado com sucesso!', 'sucesso');
            await _carregarLista();
        } else {
            validador.mostrarAlerta(resultado.erro || 'Erro ao adiar evento.', 'erro');
        }
    });

    // ── Filtros ───────────────────────────────────────────────────────────────

    $('#btn-filtrar').on('click', function () {
        _renderizarTabela(ctrl.filtrar({
            nome:           $filtrNome.val(),
            idCatEvento:    $filtrCategoria.val(),
            idEventoStatus: $filtrStatus.val()
        }));
    });

    $('#btn-limpar').on('click', async function () {
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
        return parseFloat(valor || 0).toFixed(2)
            .replace('.', ',')
            .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
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
        return sem.length >= 16 ? sem.substring(0, 16) : sem;
    }

    $(inicializar);

}(jQuery));
