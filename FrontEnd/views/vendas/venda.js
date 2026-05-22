/* venda.js — View binding do PDV (Ponto de Venda). */

(function ($) {

    if (!window.AGAPE.Utils.Auth.getInstance().requireLogin()) return;

    var ctrl      = window.AGAPE.Controllers.VendaController.getInstance();
    var mascaras  = window.AGAPE.Utils.Mascaras.getInstance();
    var validador = window.AGAPE.Utils.Validador.getInstance();

    // ── Referências: listagem ─────────────────────────────────────────────────

    var $tabelaCorpo   = $('#tabela-corpo');
    var $filtroDataIni    = $('#filtro-data-ini');
    var $filtroDataFim    = $('#filtro-data-fim');
    var $filtroColaborador= $('#filtro-colaborador');
    var $filtroParoquiano = $('#filtro-paroquiano');
    var $filtroFormaPag   = $('#filtro-forma-pag');
    var $filtroCredito    = $('#filtro-credito');
    var $btnFiltrar       = $('#btn-filtrar');
    var $btnLimpar        = $('#btn-limpar');
    var $btnNovaVenda  = $('#btn-nova-venda');

    // ── Referências: PDV — paroquiano ─────────────────────────────────────────

    var $pdvCpf      = $('#pdv-cpf');
    var $pdvBlocoPar = $('#pdv-bloco-par');
    var $pdvParNome  = $('#pdv-par-nome');
    var $pdvParSaldo = $('#pdv-par-saldo');

    // ── Referências: PDV — produto ────────────────────────────────────────────

    var $pdvBuscaProd    = $('#pdv-busca-prod');
    var $pdvDropdownProd = $('#pdv-dropdown-prod');
    var $pdvQtd          = $('#pdv-qtd');
    var $pdvBtnAddItem   = $('#pdv-btn-add-item');
    var $pdvTbodyItens   = $('#pdv-tbody-itens');
    var $pdvLinhaVaziaIt = $('#pdv-linha-vazia-itens');
    var $pdvProdSel      = $('#pdv-prod-selecionado');
    var $pdvProdSelTexto = $('#pdv-prod-selecionado-texto');

    // ── Referências: PDV — resumo / crédito ──────────────────────────────────

    var $pdvRBruto       = $('#pdv-r-bruto');
    var $pdvRSaldo       = $('#pdv-r-saldo');
    var $pdvInputCred    = $('#pdv-input-cred');
    var $pdvBtnCred      = $('#pdv-btn-cred');
    var $pdvCredFeedback = $('#pdv-cred-feedback');
    var $pdvTotalFinal   = $('#pdv-total-final');

    // ── Referências: PDV — pagamento ─────────────────────────────────────────

    var $pdvSelectForma   = $('#pdv-select-forma');
    var $pdvInputValPag   = $('#pdv-input-valor-pag');
    var $pdvInputParcelas = $('#pdv-input-parcelas');
    var $pdvBtnAddPag     = $('#pdv-btn-add-pag');
    var $pdvPagFeedback   = $('#pdv-pag-feedback');
    var $pdvTbodyPag      = $('#pdv-tbody-pag');
    var $pdvLinhaVaziaPag = $('#pdv-linha-vazia-pag');
    var $pdvRestante      = $('#pdv-restante');
    var $pdvTotalPago     = $('#pdv-total-pago');

    // ── Referências: botões ───────────────────────────────────────────────────

    var $pdvBtnFinalizar = $('#pdv-btn-finalizar');
    var $pdvBtnCancelar  = $('#pdv-btn-cancelar');
    var $pdvBtnFechar    = $('#pdv-btn-fechar');

    var modalPdvObj     = new bootstrap.Modal($('#modal-pdv')[0]);
    var modalCompObj    = new bootstrap.Modal($('#modal-comprovante')[0]);
    var modalDetalheObj = new bootstrap.Modal($('#modal-venda-detalhe')[0]);
    var $compCorpo      = $('#comp-corpo');
    var _dt             = null;

    var _produtoSelecionado = null;
    var _buscaTimer         = null;

    // ══════════════════════════════════════════════════════════════════════════
    // GUARDIÃO DE NAVEGAÇÃO
    // ══════════════════════════════════════════════════════════════════════════

    function _atualizarGuardiao() {
        window.AGAPE_VENDA_GUARDIAO = ctrl.temItens()
            ? function () { return true; }
            : null;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // INICIALIZAÇÃO
    // ══════════════════════════════════════════════════════════════════════════

    async function inicializar() {
        window.AGAPE.Utils.Sidebar.inicializar();
        mascaras.aplicar('#pdv-cpf', 'cpf');
        await _carregarFormasPag();
        await _carregarLista();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // LISTAGEM DE VENDAS
    // ══════════════════════════════════════════════════════════════════════════

    async function _carregarLista() {
        $tabelaCorpo.html(
            '<tr><td colspan="8" class="tabela-vazia">' +
            '<i class="bi bi-hourglass-split me-1"></i>Carregando...</td></tr>'
        );

        var filtros = {};
        if ($filtroDataIni.val())         filtros.dataInicio      = $filtroDataIni.val();
        if ($filtroDataFim.val())         filtros.dataFim         = $filtroDataFim.val();
        if ($filtroColaborador.val().trim()) filtros.nomeColaborador = $filtroColaborador.val().trim();
        if ($filtroParoquiano.val().trim())  filtros.nomeParoquiano  = $filtroParoquiano.val().trim();
        if ($filtroFormaPag.val())        filtros.idFormaPag      = $filtroFormaPag.val();
        if ($filtroCredito.val())         filtros.usouCredito     = $filtroCredito.val();

        _renderizarTabela(await ctrl.listar(filtros));
    }

    function _renderizarTabela(resultado) {
        if (resultado.status !== 'ok') {
            if (_dt) { _dt.destroy(); _dt = null; }
            $tabelaCorpo.html(
                '<tr><td colspan="8" class="tabela-vazia text-danger">' +
                '<i class="bi bi-exclamation-triangle me-1"></i>' +
                _esc(resultado.erro || 'Erro ao carregar vendas.') + '</td></tr>'
            );
            return;
        }

        var lista = Array.isArray(resultado.dados) ? resultado.dados : [];
        var dados = lista.map(function (v) {
            return {
                idVenda:        v.idVenda,
                dataHora:       v.dataHora,
                nomeParoquiano: v.nomeParoquiano  || '—',
                nomeColaborador:v.nomeColaborador || '—',
                descFormaPag:   v.descFormaPag    || '—',
                totBruto:       v.totBruto,
                credUtilizado:  v.credUtilizado,
                valorFinal:     v.valorFinal
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
                { data: 'dataHora',        render: function (d) { return _formatarDataHora(d); } },
                { data: 'nomeParoquiano',  className: 'text-start', render: function (d) { return _esc(d); } },
                { data: 'nomeColaborador', className: 'text-start', render: function (d) { return _esc(d); } },
                { data: 'descFormaPag',    render: function (d) {
                    var pags = _parsePagamentos(d);
                    if (!pags.length) return '—';
                    if (pags.length > 1)
                        return '<span class="badge bg-secondary">Múltiplas formas</span>';
                    return _esc(pags[0].forma);
                }},
                { data: 'totBruto',      render: function (d) { return 'R$ ' + _moeda(d); } },
                { data: 'credUtilizado', render: function (d) {
                    return d > 0 ? '<span class="text-success">- R$ ' + _moeda(d) + '</span>' : '—';
                }},
                { data: 'valorFinal', render: function (d) { return '<strong>R$ ' + _moeda(d) + '</strong>'; } },
                { data: null, orderable: false, render: function (d, t, row) {
                    return '<button class="btn btn-sm btn-outline-primary btn-visualizar" ' +
                           'title="Visualizar venda">' +
                           '<i class="bi bi-eye me-1"></i>Visualizar</button>';
                }}
            ],
            language: {
                decimal: ',', thousands: '.',
                emptyTable:   'Nenhuma venda encontrada',
                info:         'Mostrando _START_ a _END_ de _TOTAL_ venda(s)',
                infoEmpty:    'Nenhuma venda encontrada',
                infoFiltered: '(filtrado de _MAX_ no total)',
                lengthMenu:   'Mostrar _MENU_ por página',
                search:       'Buscar:',
                zeroRecords:  'Nenhuma venda encontrada',
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
        await _abrirModalVenda(d);
    });

    function _parsePagamentos(descFormaPag) {
        if (!descFormaPag || descFormaPag === '—' || descFormaPag === '') return [];
        return descFormaPag.split(',').map(function (f) {
            var parts = f.split('~~');
            return {
                forma: parts[0].trim(),
                valor: parts.length > 1 ? parseFloat(parts[1]) : null
            };
        }).filter(function (p) { return p.forma; });
    }

    async function _abrirModalVenda(d) {
        $('#det-titulo').html(
            '<i class="bi bi-receipt me-2"></i>Venda #' + d.idVenda +
            ' <span class="text-muted fw-normal fs-6 ms-2">' + _formatarDataHora(d.dataHora) + '</span>'
        );

        var pags    = _parsePagamentos(d.descFormaPag);
        var pagHtml = pags.length
            ? pags.map(function (p) {
                return '<div class="d-flex justify-content-between align-items-center py-1 border-bottom">' +
                    '<span>' + _esc(p.forma) + '</span>' +
                    (p.valor !== null ? '<strong>R$ ' + _moeda(p.valor) + '</strong>' : '') +
                '</div>';
              }).join('')
            : '<span class="text-muted">Sem registro de pagamento</span>';

        var credHtml = d.credUtilizado > 0
            ? '<span class="text-success fw-semibold">- R$ ' + _moeda(d.credUtilizado) + '</span>'
            : '<span class="text-muted">—</span>';

        // Produtos: placeholder enquanto carrega
        var itensHtml =
            '<div id="det-itens-loading" class="text-center py-2">' +
            '  <div class="spinner-border spinner-border-sm text-secondary" role="status"></div>' +
            '  <span class="text-muted small ms-2">Carregando produtos...</span>' +
            '</div>';

        $('#det-corpo').html(
            // ── Cabeçalho: paroquiano e colaborador ──────────────────────────
            '<div class="row g-3 mb-3">' +
                '<div class="col-sm-6">' +
                    '<div class="text-muted small mb-1">Paroquiano</div>' +
                    '<div class="fw-semibold">' + _esc(d.nomeParoquiano) + '</div>' +
                '</div>' +
                '<div class="col-sm-6">' +
                    '<div class="text-muted small mb-1">Colaborador</div>' +
                    '<div class="fw-semibold">' + _esc(d.nomeColaborador) + '</div>' +
                '</div>' +
            '</div>' +

            // ── Produtos ──────────────────────────────────────────────────────
            '<div class="mb-3">' +
                '<div class="text-muted small mb-2 fw-semibold text-uppercase" ' +
                     'style="letter-spacing:.05em">Produtos</div>' +
                '<div id="det-itens-container">' + itensHtml + '</div>' +
            '</div>' +

            // ── Formas de Pagamento ───────────────────────────────────────────
            '<div class="mb-3">' +
                '<div class="text-muted small mb-2 fw-semibold text-uppercase" ' +
                     'style="letter-spacing:.05em">Formas de Pagamento</div>' +
                pagHtml +
            '</div>' +

            // ── Totais ────────────────────────────────────────────────────────
            '<div class="row g-2 pt-2 border-top">' +
                '<div class="col-4 text-center">' +
                    '<div class="text-muted small">Total Bruto</div>' +
                    '<div>R$ ' + _moeda(d.totBruto) + '</div>' +
                '</div>' +
                '<div class="col-4 text-center">' +
                    '<div class="text-muted small">Crédito</div>' +
                    '<div>' + credHtml + '</div>' +
                '</div>' +
                '<div class="col-4 text-center">' +
                    '<div class="text-muted small">Total Final</div>' +
                    '<div class="fw-bold fs-5">R$ ' + _moeda(d.valorFinal) + '</div>' +
                '</div>' +
            '</div>'
        );

        modalDetalheObj.show();

        // Busca os itens da venda no backend e substitui o placeholder
        try {
            var http = window.AGAPE.Utils.HttpClient.getInstance();
            var resultado = await http.get('/venda', { idVenda: d.idVenda });

            var html = '';
            if (resultado.status === 'ok' && Array.isArray(resultado.dados) && resultado.dados.length) {
                html =
                    '<div class="table-responsive">' +
                    '<table class="table table-sm table-hover mb-0">' +
                    '<thead class="table-light">' +
                    '<tr>' +
                    '<th style="font-size:.8rem;">Produto</th>' +
                    '<th class="text-center" style="font-size:.8rem;">Qtd</th>' +
                    '<th class="text-end" style="font-size:.8rem;">Vlr Unit.</th>' +
                    '<th class="text-end" style="font-size:.8rem;">Subtotal</th>' +
                    '</tr></thead><tbody>';
                resultado.dados.forEach(function (item) {
                    html +=
                        '<tr>' +
                        '<td style="font-size:.82rem;">' + _esc(item.nomeProduto || '—') + '</td>' +
                        '<td class="text-center" style="font-size:.82rem;">' + item.quantidade + '</td>' +
                        '<td class="text-end" style="font-size:.82rem;">R$ ' + _moeda(item.valorUnitario) + '</td>' +
                        '<td class="text-end fw-semibold" style="font-size:.82rem;">R$ ' + _moeda(item.valorTotal) + '</td>' +
                        '</tr>';
                });
                html += '</tbody></table></div>';
            } else {
                html = '<span class="text-muted small fst-italic">Nenhum produto encontrado.</span>';
            }
            $('#det-itens-container').html(html);
        } catch (_) {
            $('#det-itens-container').html(
                '<span class="text-danger small">Erro ao carregar produtos.</span>'
            );
        }
    }

    $btnFiltrar.on('click', _carregarLista);

    $btnLimpar.on('click', async function () {
        $filtroDataIni.val('');
        $filtroDataFim.val('');
        $filtroColaborador.val('');
        $filtroParoquiano.val('');
        $filtroFormaPag.val('');
        $filtroCredito.val('');
        await _carregarLista();
    });

    // ══════════════════════════════════════════════════════════════════════════
    // PDV — ABERTURA E RESET
    // ══════════════════════════════════════════════════════════════════════════

    $btnNovaVenda.on('click', function () {
        _resetarPdv();
        modalPdvObj.show();
        setTimeout(function () { $pdvCpf.trigger('focus'); }, 400);
    });

    function _resetarPdv() {
        ctrl.resetar();
        _produtoSelecionado = null;

        $pdvCpf.val('').removeClass('is-invalid is-valid');
        $pdvBlocoPar.hide();

        $pdvBuscaProd.val('');
        $pdvDropdownProd.removeClass('aberto').html(
            '<div class="pdv-dropdown-item text-muted"><em>Aguardando busca...</em></div>'
        );
        $pdvQtd.val('1');
        $pdvProdSel.hide();

        $pdvInputCred.val('0').removeClass('is-invalid is-valid');
        _feedback($pdvCredFeedback, '');

        $pdvSelectForma.val('');
        $pdvInputValPag.val('').removeClass('is-invalid is-valid');
        $pdvInputParcelas.val('1').prop('disabled', true);
        $pdvSelectForma.removeClass('is-invalid');
        _feedback($pdvPagFeedback, '');

        _renderizarItensPdv();
        _renderizarPagamentosPdv();
        _atualizarResumoPdv();
        _atualizarGuardiao();
    }

    $pdvBtnCancelar.add($pdvBtnFechar).on('click', function () {
        ctrl.resetar();
        _atualizarGuardiao();
        modalPdvObj.hide();
    });

    // ══════════════════════════════════════════════════════════════════════════
    // PDV — CPF / PAROQUIANO
    // ══════════════════════════════════════════════════════════════════════════

    $pdvCpf.on('blur', async function () {
        var cpf = mascaras.apenasDigitos($pdvCpf.val());

        console.log(cpf);

        $pdvCpf.removeClass('is-invalid is-valid');

        if (cpf.length === 0) return;
        if (cpf.length !== 11) {
            validador.destacarCampo($pdvCpf[0], false, 'CPF deve ter 11 dígitos.');
            return;
        }

        var resultado = await ctrl.buscarParoquiano(cpf);

        console.log('O resultado foi: ', resultado);

        if (resultado.status === 'ok') {
            var p = resultado.dados;
            validador.destacarCampo($pdvCpf[0], true);
            $pdvParNome.text(p.nome);
            $pdvParSaldo.text('R$ ' + _moeda(p.saldoCredito));
            $pdvBlocoPar.show();
            ctrl.getEstado().paroquiano = p;
            _atualizarResumoPdv();
        } else {
            validador.destacarCampo($pdvCpf[0], false, resultado.erro || 'Paroquiano não encontrado.');
            $pdvBlocoPar.hide();
            ctrl.resetar();
            _atualizarResumoPdv();
            _atualizarGuardiao();
        }
    });

    // ══════════════════════════════════════════════════════════════════════════
    // PDV — BUSCA DE PRODUTO (dropdown com debounce)
    // ══════════════════════════════════════════════════════════════════════════

    $pdvBuscaProd.on('input', function () {
        clearTimeout(_buscaTimer);
        var nome = $pdvBuscaProd.val().trim();

        _produtoSelecionado = null;
        $pdvProdSel.hide();

        if (nome.length < 2) {
            $pdvDropdownProd.removeClass('aberto').html(
                '<div class="pdv-dropdown-item text-muted"><em>Digite ao menos 2 letras...</em></div>'
            );
            return;
        }

        $pdvDropdownProd.html(
            '<div class="pdv-dropdown-item text-muted"><em>Buscando...</em></div>'
        ).addClass('aberto');

        _buscaTimer = setTimeout(async function () {
            var res = await ctrl.buscarProdutos(nome);

            if (res.status !== 'ok' || !Array.isArray(res.dados) || res.dados.length === 0) {
                $pdvDropdownProd.html(
                    '<div class="pdv-dropdown-item text-muted"><em>Nenhum produto encontrado.</em></div>'
                );
                return;
            }

            $pdvDropdownProd.empty();
            res.dados.forEach(function (p) {
                $('<div>').addClass('pdv-dropdown-item')
                    .html(
                        '<div class="prod-nome">' + _esc(p.nome) + '</div>' +
                        '<div class="prod-info">R$ ' + _moeda(p.valorUni) +
                        ' &nbsp;|&nbsp; Estoque: ' + p.qtdeAtual + '</div>'
                    )
                    .on('click', function () { _selecionarProduto(p); })
                    .appendTo($pdvDropdownProd);
            });
        }, 350);
    });

    function _selecionarProduto(p) {
        _produtoSelecionado = p;
        $pdvBuscaProd.val(p.nome);
        $pdvDropdownProd.removeClass('aberto');
        $pdvProdSel.show();
        $pdvProdSelTexto.text(
            p.nome + ' — R$ ' + _moeda(p.valorUni) + ' (estoque: ' + p.qtdeAtual + ')'
        );
        $pdvQtd.trigger('focus');
    }

    $(document).on('click', function (e) {
        if (!$(e.target).closest($pdvBuscaProd).length && !$(e.target).closest($pdvDropdownProd).length) {
            $pdvDropdownProd.removeClass('aberto');
        }
    });

    $pdvBuscaProd.on('focus', function () {
        if ($pdvDropdownProd.children().length > 0 &&
            $pdvDropdownProd.html().indexOf('Aguardando') === -1) {
            $pdvDropdownProd.addClass('aberto');
        }
    });

    $pdvBtnAddItem.on('click', function () {
        if (!ctrl.getEstado().paroquiano) {
            validador.mostrarAlerta('Identifique o paroquiano antes de adicionar produtos.', 'aviso');
            return;
        }
        if (!_produtoSelecionado) {
            validador.mostrarAlerta('Selecione um produto na lista.', 'aviso');
            return;
        }

        var res = ctrl.adicionarItem(_produtoSelecionado, $pdvQtd.val());
        if (!res.ok) { validador.mostrarAlerta(res.erro, 'erro'); return; }

        _renderizarItensPdv();
        _atualizarResumoPdv();
        _atualizarGuardiao();

        $pdvBuscaProd.val('');
        $pdvProdSel.hide();
        $pdvDropdownProd.removeClass('aberto').html(
            '<div class="pdv-dropdown-item text-muted"><em>Aguardando busca...</em></div>'
        );
        $pdvQtd.val('1');
        _produtoSelecionado = null;
        $pdvBuscaProd.trigger('focus');
    });

    function _renderizarItensPdv() {
        var itens = ctrl.getEstado().itens;
        $pdvLinhaVaziaIt.toggle(itens.length === 0);
        $pdvTbodyItens.find('tr.pdv-item-row').remove();

        itens.forEach(function (item, idx) {
            $('<tr>').addClass('pdv-item-row text-center')
                .html(
                    '<td class="text-start small">' + _esc(item.nome) + '</td>' +
                    '<td>' + item.qtd + '</td>' +
                    '<td>R$ ' + _moeda(item.valorUni) + '</td>' +
                    '<td>R$ ' + _moeda(item.totalItem) + '</td>' +
                    '<td><button class="btn-acao btn-excluir" data-idx="' + idx + '" title="Remover">' +
                    '<i class="bi bi-trash"></i></button></td>'
                )
                .appendTo($pdvTbodyItens);
        });
    }

    $pdvTbodyItens.on('click', '.btn-excluir', function () {
        var item = ctrl.getEstado().itens[parseInt($(this).data('idx'), 10)];
        if (item) ctrl.removerItem(item.idProd);
        _renderizarItensPdv();
        _atualizarResumoPdv();
        _atualizarGuardiao();
    });

    // ══════════════════════════════════════════════════════════════════════════
    // PDV — CRÉDITO
    // ══════════════════════════════════════════════════════════════════════════

    $pdvBtnCred.on('click', function () {
        $pdvInputCred.removeClass('is-invalid is-valid');
        _feedback($pdvCredFeedback, '');

        var res = ctrl.aplicarCredito($pdvInputCred.val());
        if (!res.ok) {
            $pdvInputCred.addClass('is-invalid');
            _feedback($pdvCredFeedback, res.erro);
            return;
        }

        $pdvInputCred.addClass('is-valid');
        _atualizarResumoPdv();
    });

    // ══════════════════════════════════════════════════════════════════════════
    // PDV — PAGAMENTOS
    // ══════════════════════════════════════════════════════════════════════════

    $pdvSelectForma.on('change', function () {
        _aplicarRegraParcelamento();
    });

    $pdvInputParcelas.on('keydown', function (e) {
        if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
            e.preventDefault();
        }
    });

    $pdvInputParcelas.on('input', function () {
        var v = parseInt($(this).val(), 10);
        if (!v || v < 1) $(this).val('1');
    });

    function _aplicarRegraParcelamento() {
        var idFormaPag = parseInt($pdvSelectForma.val(), 10);
        var formas     = ctrl.getEstado().formasPag;
        var forma      = formas.find(function (f) { return f.idFormaPag === idFormaPag; });

        if (!forma) {
            $pdvInputParcelas.val('1').prop('disabled', true);
            return;
        }

        var permite = forma.permiteParcelar === true  ||
                      forma.permiteParcelar === 1     ||
                      forma.permiteParcelar === '1'   ||
                      forma.permiteParcelar === 'true';

        $pdvInputParcelas.val('1').prop('disabled', !permite);
    }

    $pdvBtnAddPag.on('click', function () {
        $pdvInputValPag.removeClass('is-invalid is-valid');
        $pdvSelectForma.removeClass('is-invalid');
        _feedback($pdvPagFeedback, '');

        var idFormaPag = parseInt($pdvSelectForma.val(), 10);
        if (!idFormaPag) {
            $pdvSelectForma.addClass('is-invalid');
            _feedback($pdvPagFeedback, 'Selecione uma forma de pagamento.');
            return;
        }

        var descricao      = $pdvSelectForma.find(':selected').text();
        var numeroParcelas = parseInt($pdvInputParcelas.val(), 10) || 1;
        var res = ctrl.adicionarPagamento(idFormaPag, descricao, $pdvInputValPag.val(), numeroParcelas);

        if (!res.ok) {
            $pdvInputValPag.addClass('is-invalid');
            _feedback($pdvPagFeedback, res.erro);
            return;
        }

        $pdvInputValPag.addClass('is-valid');
        _renderizarPagamentosPdv();
        _atualizarResumoPdv();

        $pdvSelectForma.val('');
        $pdvInputParcelas.val('1').prop('disabled', true);
        $pdvInputValPag.val(res.restante > 0 ? res.restante.toFixed(2) : '').removeClass('is-valid');
    });

    function _renderizarPagamentosPdv() {
        var pags = ctrl.getEstado().pagamentos;
        $pdvLinhaVaziaPag.toggle(pags.length === 0);
        $pdvTbodyPag.find('tr.pdv-pag-row').remove();

        pags.forEach(function (p, idx) {
            var parcelaLabel = p.numeroParcelas > 1
                ? '<span class="badge-parcela ms-1">' + p.numeroParcelas + 'x</span>'
                : '<span class="badge-parcela ms-1 bg-secondary">à vista</span>';

            $('<tr>').addClass('pdv-pag-row text-center')
                .html(
                    '<td class="text-start small">' + _esc(p.descricao) + parcelaLabel + '</td>' +
                    '<td>R$ ' + _moeda(p.valor) + '</td>' +
                    '<td><button class="btn-acao btn-excluir" data-idx="' + idx + '" title="Remover">' +
                    '<i class="bi bi-trash"></i></button></td>'
                )
                .appendTo($pdvTbodyPag);
        });
    }

    $pdvTbodyPag.on('click', '.btn-excluir', function () {
        ctrl.removerPagamento(parseInt($(this).data('idx'), 10));
        _renderizarPagamentosPdv();
        _atualizarResumoPdv();
    });

    // ══════════════════════════════════════════════════════════════════════════
    // PDV — FINALIZAR VENDA
    // ══════════════════════════════════════════════════════════════════════════

    $pdvBtnFinalizar.on('click', async function () {
        if (!window.AGAPE.Utils.Auth.getInstance().estaLogado()) {
            validador.mostrarAlerta('Sessão expirada. Você será redirecionado para o login.', 'erro');
            setTimeout(function () { window.AGAPE.Utils.Auth.getInstance().logout(); }, 2000);
            return;
        }

        $pdvBtnFinalizar.prop('disabled', true).text('Processando...');

        var resultado = await ctrl.efetuarVenda();

        $pdvBtnFinalizar.prop('disabled', false)
            .html('<i class="bi bi-check2-circle me-1"></i>Finalizar Venda');

        if (resultado.status === 'ok') {
            _exibirComprovante(resultado.dados);
            _atualizarGuardiao();
            modalPdvObj.hide();
            await _carregarLista();
        } else {
            validador.mostrarAlerta(resultado.erro || 'Erro ao finalizar a venda.', 'erro');
        }
    });

    // ══════════════════════════════════════════════════════════════════════════
    // PDV — COMPROVANTE NÃO FISCAL
    // ══════════════════════════════════════════════════════════════════════════

    function _exibirComprovante(venda) {
        var e = ctrl.getEstado();

        var itensHtml = e.itens.map(function (it) {
            return '<tr>' +
                '<td class="text-start">' + _esc(it.nome) + '</td>' +
                '<td class="text-center">' + it.qtd + '</td>' +
                '<td class="text-end">R$ ' + _moeda(it.valorUni) + '</td>' +
                '<td class="text-end">R$ ' + _moeda(it.totalItem) + '</td>' +
                '</tr>';
        }).join('');

        var pagHtml = e.pagamentos.map(function (p) {
            var parcInfo = p.numeroParcelas > 1
                ? ' (' + p.numeroParcelas + 'x de R$ ' + _moeda(p.valor / p.numeroParcelas) + ')'
                : ' (à vista)';
            return '<tr>' +
                '<td class="text-start">' + _esc(p.descricao) + parcInfo + '</td>' +
                '<td class="text-end">R$ ' + _moeda(p.valor) + '</td>' +
                '</tr>';
        }).join('');

        var temParcelado = e.pagamentos.some(function (p) { return p.numeroParcelas > 1; });

        $compCorpo.html(
            '<div class="text-center mb-3">' +
            '<h6 class="fw-bold">AGAPE — Gestão Paroquial</h6>' +
            '<small class="text-muted">Comprovante Não Fiscal</small>' +
            '</div>' +
            '<p class="mb-1"><strong>Paroquiano:</strong> ' + _esc(e.paroquiano.nome) + '</p>' +
            '<p class="mb-3"><strong>Venda nº:</strong> ' +
            (venda && venda.idVenda ? venda.idVenda : '—') + '</p>' +

            '<table class="table table-sm mb-3"><thead><tr>' +
            '<th class="text-start">Produto</th>' +
            '<th class="text-center">Qtd</th>' +
            '<th class="text-end">Unit.</th>' +
            '<th class="text-end">Total</th>' +
            '</tr></thead><tbody>' + itensHtml + '</tbody></table>' +

            '<div class="d-flex justify-content-between mb-1">' +
            '<span>Total Bruto:</span><strong>R$ ' + _moeda(e.totBruto) + '</strong></div>' +

            (e.credUtilizado > 0
                ? '<div class="d-flex justify-content-between mb-1 text-success">' +
                  '<span>Crédito utilizado:</span><strong>- R$ ' + _moeda(e.credUtilizado) + '</strong></div>'
                : '') +

            '<div class="d-flex justify-content-between fw-bold fs-6 mb-3">' +
            '<span>Total Final:</span><span>R$ ' + _moeda(e.totalFinal) + '</span></div>' +
            '<hr>' +
            '<p class="mb-1"><strong>Pagamentos:</strong></p>' +
            '<table class="table table-sm"><tbody>' + pagHtml + '</tbody></table>' +

            (temParcelado
                ? '<div class="alert alert-info py-1 small mt-2">' +
                  '<i class="bi bi-info-circle me-1"></i>' +
                  'Esta venda possui parcelas. Consulte o financeiro para o calendário de vencimentos.' +
                  '</div>'
                : '')
        );

        modalCompObj.show();
    }

    $('#comp-btn-imprimir').on('click', function () {
        window.print();
    });

    // ══════════════════════════════════════════════════════════════════════════
    // PDV — ATUALIZAR PAINEL DIREITO
    // ══════════════════════════════════════════════════════════════════════════

    function _atualizarResumoPdv() {
        var e = ctrl.getEstado();
        $pdvRBruto.text('R$ ' + _moeda(e.totBruto));
        $pdvRSaldo.text('R$ ' + _moeda(e.paroquiano ? e.paroquiano.saldoCredito : 0));
        $pdvTotalFinal.text('R$ ' + _moeda(e.totalFinal));
        $pdvRestante.text('R$ ' + _moeda(ctrl.getRestante()));
        $pdvTotalPago.text('R$ ' + _moeda(e.totalPago));
        $pdvBtnFinalizar.prop('disabled', !ctrl.podeFinalizar());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // FORMAS DE PAGAMENTO
    // ══════════════════════════════════════════════════════════════════════════

    async function _carregarFormasPag() {
        var resultado = await ctrl.listarFormasPag();

        $pdvSelectForma.html('<option value="">— selecione —</option>');

        if (resultado.status !== 'ok') {
            $('<option>').prop('disabled', true)
                .text('⚠ Erro ao carregar formas de pagamento')
                .appendTo($pdvSelectForma);
            console.warn('[PDV] Formas de pagamento:', resultado.erro);
            return;
        }

        var formas = ctrl.getEstado().formasPag;
        if (formas.length === 0) {
            $('<option>').prop('disabled', true)
                .text('Nenhuma forma de pagamento ativa cadastrada')
                .appendTo($pdvSelectForma);
            return;
        }

        formas.forEach(function (f) {
            $('<option>').val(f.idFormaPag).text(f.descricao).appendTo($pdvSelectForma);
            $('<option>').val(f.idFormaPag).text(f.descricao).appendTo($filtroFormaPag);
        });
    }

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
        var d = new Date(iso.replace('T', ' ').replace(/-/g, '/'));
        if (isNaN(d)) return iso;
        var pad = function (n) { return String(n).padStart(2, '0'); };
        return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() +
               ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    function _feedback($el, msg) {
        if (!$el || !$el.length) return;
        $el.text(msg);
        $el[0].style.setProperty('display', msg ? 'block' : 'none', 'important');
    }

    $(inicializar);

}(jQuery));
