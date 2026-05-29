/* devolucao.js — View binding do caso de uso Realizar Devolução (RF_F8).
 * Espelha a estrutura da tela de Venda: tabela + filtros na página e a
 * operação dentro de um modal fullscreen. */

(function ($) {

    if (!window.AGAPE.Utils.Auth.getInstance().requireLogin()) return;

    var ctrl      = window.AGAPE.Controllers.DevolucaoController.getInstance();
    var validador = window.AGAPE.Utils.Validador.getInstance();

    // ── Referências: listagem ─────────────────────────────────────────────────

    var $tabelaCorpo      = $('#tabela-corpo');
    var $filtroDataIni    = $('#filtro-data-ini');
    var $filtroDataFim    = $('#filtro-data-fim');
    var $filtroParoquiano = $('#filtro-paroquiano');
    var $btnFiltrar       = $('#btn-filtrar');
    var $btnLimpar        = $('#btn-limpar');
    var $btnNovaDev       = $('#btn-nova-devolucao');

    // ── Referências: modal de operação ────────────────────────────────────────

    var $buscaVenda   = $('#dev-busca-venda');
    var $dropdown     = $('#dev-dropdown-venda');
    var $idVenda      = $('#dev-id-venda');
    var $btnBuscar    = $('#dev-btn-buscar');

    var $cabecalho    = $('#dev-cabecalho');
    var $infoVenda    = $('#dev-info-venda');
    var $infoParoq    = $('#dev-info-paroquiano');
    var $infoData     = $('#dev-info-data');
    var $infoTotal    = $('#dev-info-total');

    var $tbodyItens   = $('#dev-tbody-itens');
    var $linhaVazia   = $('#dev-linha-vazia-itens');
    var $reincorpora  = $('#dev-reincorpora');
    var $rQtd         = $('#dev-r-qtd');
    var $totalDev     = $('#dev-total-devolucao');
    var $btnCancelar  = $('#dev-btn-cancelar');
    var $btnFechar    = $('#dev-btn-fechar');
    var $btnFinalizar = $('#dev-btn-finalizar');

    var modalDevObj     = new bootstrap.Modal($('#modal-dev')[0]);
    var modalDetalheObj = new bootstrap.Modal($('#modal-dev-detalhe')[0]);

    var _dt          = null;
    var _vendasCache = [];
    var _buscaTimer  = null;

    // ══════════════════════════════════════════════════════════════════════════
    // GUARDIÃO DE NAVEGAÇÃO
    // ══════════════════════════════════════════════════════════════════════════

    function _atualizarGuardiao() {
        window.AGAPE_DEVOLUCAO_GUARDIAO = ctrl.temItensSelecionados()
            ? function () { return true; }
            : null;
    }

    window.addEventListener('beforeunload', function (e) {
        if (ctrl.temItensSelecionados()) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    // ══════════════════════════════════════════════════════════════════════════
    // INICIALIZAÇÃO
    // ══════════════════════════════════════════════════════════════════════════

    async function inicializar() {
        window.AGAPE.Utils.Sidebar.inicializar();
        await _carregarLista();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // LISTAGEM DE DEVOLUÇÕES
    // ══════════════════════════════════════════════════════════════════════════

    async function _carregarLista() {
        $tabelaCorpo.html(
            '<tr><td colspan="6" class="tabela-vazia">' +
            '<i class="bi bi-hourglass-split me-1"></i>Carregando...</td></tr>'
        );

        var filtros = {};
        if ($filtroDataIni.val())            filtros.dataInicio     = $filtroDataIni.val();
        if ($filtroDataFim.val())            filtros.dataFim        = $filtroDataFim.val();
        if ($filtroParoquiano.val().trim())  filtros.nomeParoquiano = $filtroParoquiano.val().trim();

        _renderizarTabela(await ctrl.listarDevolucoes(filtros));
    }

    function _renderizarTabela(resultado) {
        if (resultado.status !== 'ok') {
            if (_dt) { _dt.destroy(); _dt = null; }
            $tabelaCorpo.html(
                '<tr><td colspan="6" class="tabela-vazia text-danger">' +
                '<i class="bi bi-exclamation-triangle me-1"></i>' +
                _esc(resultado.erro || 'Erro ao carregar devoluções.') + '</td></tr>'
            );
            return;
        }

        var lista = Array.isArray(resultado.dados) ? resultado.dados : [];
        var dados = lista.map(function (d) {
            return {
                idDevolucao:    d.idDevolucao,
                idVenda:        d.idVenda,
                dataHora:       d.dataHora,
                nomeParoquiano: d.nomeParoquiano || '—',
                valorTotal:     d.valorTotal,
                reincorporaEst: d.reincorporaEst
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
                { data: 'dataHora',       render: function (d) { return _formatarDataHora(d); } },
                { data: 'idVenda',        render: function (d) { return '#' + d; } },
                { data: 'nomeParoquiano', className: 'text-start', render: function (d) { return _esc(d); } },
                { data: 'valorTotal',     render: function (d) { return '<strong>R$ ' + _moeda(d) + '</strong>'; } },
                { data: 'reincorporaEst', render: function (d) {
                    return d == 1
                        ? '<span class="badge bg-success-subtle text-success">Reincorporado</span>'
                        : '<span class="badge bg-secondary-subtle text-secondary">Não</span>';
                }},
                { data: null, orderable: false, render: function () {
                    return '<div class="d-flex gap-1 justify-content-center">' +
                           '<button class="btn btn-sm btn-outline-primary btn-visualizar" ' +
                           'title="Visualizar devolução"><i class="bi bi-eye"></i></button>' +
                           '</div>';
                }}
            ],
            language: {
                decimal: ',', thousands: '.',
                emptyTable:   'Nenhuma devolução encontrada',
                info:         'Mostrando _START_ a _END_ de _TOTAL_ devolução(ões)',
                infoEmpty:    'Nenhuma devolução encontrada',
                infoFiltered: '(filtrado de _MAX_ no total)',
                lengthMenu:   'Mostrar _MENU_ por página',
                search:       'Buscar:',
                zeroRecords:  'Nenhuma devolução encontrada',
                paginate: {
                    first: '<i class="bi bi-chevron-double-left"></i>',
                    last:  '<i class="bi bi-chevron-double-right"></i>',
                    next:  '<i class="bi bi-chevron-right"></i>',
                    previous: '<i class="bi bi-chevron-left"></i>'
                }
            },
            pageLength: 10,
            lengthMenu: [5, 10, 25, 50],
            order: [[0, 'desc']]
        });
    }

    $tabelaCorpo.on('click', '.btn-visualizar', async function () {
        var d = _dt.row($(this).closest('tr')).data();
        await _abrirDetalhe(d);
    });

    $btnFiltrar.on('click', function () {
        var ini = $filtroDataIni.val();
        var fim = $filtroDataFim.val();
        if (ini && fim && ini > fim) {
            validador.mostrarAlerta('A data inicial não pode ser posterior à data final.', 'aviso');
            $filtroDataIni.addClass('is-invalid');
            $filtroDataFim.addClass('is-invalid');
            return;
        }
        $filtroDataIni.removeClass('is-invalid');
        $filtroDataFim.removeClass('is-invalid');
        _carregarLista();
    });

    $btnLimpar.on('click', async function () {
        $filtroDataIni.val('').removeClass('is-invalid');
        $filtroDataFim.val('').removeClass('is-invalid');
        $filtroParoquiano.val('');
        await _carregarLista();
    });

    // ══════════════════════════════════════════════════════════════════════════
    // DETALHE DA DEVOLUÇÃO
    // ══════════════════════════════════════════════════════════════════════════

    async function _abrirDetalhe(d) {
        $('#det-titulo').html(
            '<i class="bi bi-arrow-return-left me-2"></i>Devolução #' + d.idDevolucao +
            ' <span class="text-muted fw-normal fs-6 ms-2">' + _formatarDataHora(d.dataHora) + '</span>'
        );

        $('#det-corpo').html(
            '<div class="row g-3 mb-3">' +
                '<div class="col-sm-6">' +
                    '<div class="text-muted small mb-1">Paroquiano</div>' +
                    '<div class="fw-semibold">' + _esc(d.nomeParoquiano) + '</div>' +
                '</div>' +
                '<div class="col-sm-6">' +
                    '<div class="text-muted small mb-1">Venda de origem</div>' +
                    '<div class="fw-semibold">#' + d.idVenda + '</div>' +
                '</div>' +
            '</div>' +
            '<div class="mb-3">' +
                '<div class="text-muted small mb-2 fw-semibold text-uppercase" style="letter-spacing:.05em">Produtos devolvidos</div>' +
                '<div id="det-itens-container">' +
                '<div class="text-center py-2">' +
                '<div class="spinner-border spinner-border-sm text-secondary" role="status"></div>' +
                '<span class="text-muted small ms-2">Carregando produtos...</span></div></div>' +
            '</div>' +
            '<div class="row g-2 pt-2 border-top">' +
                '<div class="col-6 text-center">' +
                    '<div class="text-muted small">Estoque</div>' +
                    '<div>' + (d.reincorporaEst == 1 ? 'Reincorporado' : 'Não reincorporado') + '</div>' +
                '</div>' +
                '<div class="col-6 text-center">' +
                    '<div class="text-muted small">Crédito ao paroquiano</div>' +
                    '<div class="fw-bold fs-5">R$ ' + _moeda(d.valorTotal) + '</div>' +
                '</div>' +
            '</div>'
        );

        modalDetalheObj.show();

        var res = await ctrl.buscarDetalhe(d.idDevolucao);
        var itens = (res.status === 'ok' && res.dados && Array.isArray(res.dados.itens)) ? res.dados.itens : [];

        var html;
        if (itens.length) {
            html =
                '<div class="table-responsive"><table class="table table-sm table-hover mb-0">' +
                '<thead class="table-light"><tr>' +
                '<th style="font-size:.8rem;">Produto</th>' +
                '<th class="text-center" style="font-size:.8rem;">Qtd</th>' +
                '<th class="text-end" style="font-size:.8rem;">Vlr Unit.</th>' +
                '<th class="text-end" style="font-size:.8rem;">Subtotal</th>' +
                '</tr></thead><tbody>';
            itens.forEach(function (it) {
                html +=
                    '<tr>' +
                    '<td style="font-size:.82rem;">' + _esc(it.nomeProduto || '—') + '</td>' +
                    '<td class="text-center" style="font-size:.82rem;">' + it.quantidade + '</td>' +
                    '<td class="text-end" style="font-size:.82rem;">R$ ' + _moeda(it.valorUnitario) + '</td>' +
                    '<td class="text-end fw-semibold" style="font-size:.82rem;">R$ ' + _moeda(it.valorTotal) + '</td>' +
                    '</tr>';
            });
            html += '</tbody></table></div>';
        } else if (res.status !== 'ok') {
            html = '<span class="text-danger small">Erro ao carregar produtos.</span>';
        } else {
            html = '<span class="text-muted small fst-italic">Nenhum produto encontrado.</span>';
        }
        $('#det-itens-container').html(html);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // MODAL — ABERTURA E RESET
    // ══════════════════════════════════════════════════════════════════════════

    $btnNovaDev.on('click', async function () {
        _resetarModal();
        await _carregarVendas();
        modalDevObj.show();
        setTimeout(function () { $buscaVenda.trigger('focus'); }, 400);
    });

    function _resetarModal() {
        ctrl.resetar();
        $buscaVenda.val('');
        $idVenda.val('');
        $dropdown.removeClass('aberto').html(
            '<div class="dev-dropdown-item text-muted"><em>Digite para buscar...</em></div>'
        );
        $cabecalho.hide();
        $infoVenda.text('—');
        $infoParoq.text('—');
        $infoData.text('—');
        $infoTotal.text('—');
        $tbodyItens.html(
            '<tr id="dev-linha-vazia-itens"><td colspan="6" class="tabela-vazia text-muted small">' +
            'Localize uma venda para listar os produtos.</td></tr>'
        );
        $reincorpora.prop('checked', true);
        ctrl.definirReincorpora(true);
        _atualizarTotais();
    }

    $btnCancelar.add($btnFechar).on('click', function () {
        ctrl.resetar();
        _atualizarGuardiao();
        modalDevObj.hide();
    });

    async function _carregarVendas() {
        var res = await ctrl.listarVendas({});
        _vendasCache = (res.status === 'ok' && Array.isArray(res.dados)) ? res.dados : [];
    }

    // ══════════════════════════════════════════════════════════════════════════
    // BUSCA DE VENDA (Select2-style com filtro client-side)
    // ══════════════════════════════════════════════════════════════════════════

    $buscaVenda.on('input', function () {
        clearTimeout(_buscaTimer);
        var termo = $buscaVenda.val().trim().toLowerCase();

        if (termo.length < 1) {
            $dropdown.removeClass('aberto').html(
                '<div class="dev-dropdown-item text-muted"><em>Digite para buscar...</em></div>'
            );
            return;
        }

        _buscaTimer = setTimeout(function () {
            var filtradas = _vendasCache.filter(function (v) {
                var alvo = (String(v.idVenda) + ' ' + (v.nomeParoquiano || '')).toLowerCase();
                return alvo.indexOf(termo) !== -1;
            }).slice(0, 30);

            if (filtradas.length === 0) {
                $dropdown.addClass('aberto').html(
                    '<div class="dev-dropdown-item text-muted"><em>Nenhuma venda encontrada.</em></div>'
                );
                return;
            }

            $dropdown.empty().addClass('aberto');
            filtradas.forEach(function (v) {
                $('<div>').addClass('dev-dropdown-item')
                    .html(
                        '<div class="venda-id">Venda #' + v.idVenda + '</div>' +
                        '<div class="venda-info">' + _esc(v.nomeParoquiano || '—') +
                        ' &nbsp;|&nbsp; ' + _formatarDataHora(v.dataHora) +
                        ' &nbsp;|&nbsp; R$ ' + _moeda(v.valorFinal) + '</div>'
                    )
                    .on('click', function () {
                        $dropdown.removeClass('aberto');
                        $buscaVenda.val('Venda #' + v.idVenda + ' — ' + (v.nomeParoquiano || ''));
                        $idVenda.val(v.idVenda);
                        _carregarVenda(v.idVenda);
                    })
                    .appendTo($dropdown);
            });
        }, 250);
    });

    $(document).on('click', function (e) {
        if (!$(e.target).closest($buscaVenda).length && !$(e.target).closest($dropdown).length) {
            $dropdown.removeClass('aberto');
        }
    });

    $btnBuscar.on('click', function () {
        var id = parseInt($idVenda.val(), 10);
        if (!id || id <= 0) {
            validador.mostrarAlerta('Informe o número da venda ou selecione na busca.', 'aviso');
            return;
        }
        _carregarVenda(id);
    });

    // ══════════════════════════════════════════════════════════════════════════
    // CARREGAR VENDA + ITENS
    // ══════════════════════════════════════════════════════════════════════════

    async function _carregarVenda(idVenda) {
        if (ctrl.temItensSelecionados() &&
            !confirm('Há uma devolução em andamento. Deseja descartá-la e carregar outra venda?')) {
            return;
        }

        var res = await ctrl.buscarVenda(idVenda);
        if (!res.ok) {
            validador.mostrarAlerta(res.erro || 'Venda não encontrada.', 'erro');
            $cabecalho.hide();
            _renderizarItens();
            _atualizarTotais();
            return;
        }

        var v = res.venda;
        $infoVenda.text('#' + v.idVenda);
        $infoParoq.text(v.nomeParoquiano || '—');
        $infoData.text(_formatarDataHora(v.dataHora));
        $infoTotal.text('R$ ' + _moeda(v.valorFinal));
        $cabecalho.show();

        _renderizarItens();
        $reincorpora.prop('checked', true);
        ctrl.definirReincorpora(true);
        _atualizarTotais();
    }

    function _renderizarItens() {
        var itens = ctrl.getEstado().itens;
        $tbodyItens.empty();

        if (itens.length === 0) {
            $tbodyItens.html(
                '<tr><td colspan="6" class="tabela-vazia text-muted small">' +
                'Esta venda não possui itens.</td></tr>'
            );
            return;
        }

        itens.forEach(function (it) {
            var esgotado = it.qtdDevolvivel <= 0;

            // Coluna "Devolvível": destaca quanto resta; sinaliza itens já devolvidos.
            var celDevolvivel = esgotado
                ? '<span class="badge bg-secondary-subtle text-secondary">Devolvido</span>'
                : (it.qtdJaDevolvida > 0
                    ? '<strong>' + it.qtdDevolvivel + '</strong> ' +
                      '<span class="text-muted small">(−' + it.qtdJaDevolvida + ')</span>'
                    : '<strong>' + it.qtdDevolvivel + '</strong>');

            // Input limitado ao máximo devolvível; desabilitado quando nada resta.
            var celInput =
                '<input type="number" class="form-control form-control-sm dev-qtd-input mx-auto dev-qtd" ' +
                'min="0" max="' + it.qtdDevolvivel + '" value="0" ' +
                (esgotado ? 'disabled ' : '') +
                'data-idprod="' + it.idProd + '">';

            $('<tr>').attr('data-idprod', it.idProd)
                .html(
                    '<td class="text-start">' + _esc(it.nome) + '</td>' +
                    '<td>' + it.qtdVendida + '</td>' +
                    '<td>' + celDevolvivel + '</td>' +
                    '<td>R$ ' + _moeda(it.valorUni) + '</td>' +
                    '<td>' + celInput + '</td>' +
                    '<td class="dev-item-total" data-idprod="' + it.idProd + '">R$ 0,00</td>'
                )
                .appendTo($tbodyItens);
        });
    }

    $tbodyItens.on('input', '.dev-qtd', function () {
        var idProd = parseInt($(this).data('idprod'), 10);
        var res = ctrl.definirQuantidade(idProd, $(this).val());

        if (!res.ok && typeof res.ajustado !== 'undefined') {
            $(this).val(res.ajustado);
            validador.mostrarAlerta(res.erro, 'aviso');
        }

        $tbodyItens.find('.dev-item-total[data-idprod="' + idProd + '"]')
            .text('R$ ' + _moeda(ctrl.totalItem(idProd)));

        _atualizarTotais();
    });

    $reincorpora.on('change', function () {
        ctrl.definirReincorpora($(this).is(':checked'));
    });

    function _atualizarTotais() {
        var itens = ctrl.getEstado().itens.filter(function (it) { return it.qtdDevolver > 0; });
        $rQtd.text(itens.length);
        $totalDev.text('R$ ' + _moeda(ctrl.totalDevolucao()));
        $btnFinalizar.prop('disabled', !ctrl.podeFinalizar());
        _atualizarGuardiao();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // FINALIZAR
    // ══════════════════════════════════════════════════════════════════════════

    $btnFinalizar.on('click', async function () {
        if (!window.AGAPE.Utils.Auth.getInstance().estaLogado()) {
            validador.mostrarAlerta('Sessão expirada. Faça login novamente.', 'erro');
            setTimeout(function () { window.AGAPE.Utils.Auth.getInstance().logout(); }, 1500);
            return;
        }

        $btnFinalizar.prop('disabled', true)
            .html('<span class="spinner-border spinner-border-sm me-1"></span>Processando...');

        var resultado = await ctrl.finalizar();

        $btnFinalizar.html('<i class="bi bi-check2-circle me-1"></i>Confirmar Devolução');

        if (resultado.status === 'ok') {
            ctrl.resetar();
            _atualizarGuardiao();
            modalDevObj.hide();
            validador.mostrarAlerta(
                resultado.mensagem ||
                'Devolução registrada com sucesso! Crédito adicionado ao paroquiano.',
                'sucesso'
            );
            await _carregarLista();
        } else {
            $btnFinalizar.prop('disabled', false);
            validador.mostrarAlerta(resultado.erro || 'Erro ao registrar a devolução.', 'erro');
        }
    });

    // ══════════════════════════════════════════════════════════════════════════
    // UTILITÁRIOS
    // ══════════════════════════════════════════════════════════════════════════

    function _moeda(valor) {
        return parseFloat(valor || 0)
            .toFixed(2)
            .replace('.', ',')
            .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    function _esc(texto) {
        return $('<div>').text(!texto && texto !== 0 ? '' : String(texto)).html();
    }

    function _formatarDataHora(iso) {
        if (!iso) return '—';
        var d = new Date(String(iso).replace('T', ' ').replace(/-/g, '/'));
        if (isNaN(d)) return iso;
        var pad = function (n) { return String(n).padStart(2, '0'); };
        return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() +
               ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    $(inicializar);

}(jQuery));
