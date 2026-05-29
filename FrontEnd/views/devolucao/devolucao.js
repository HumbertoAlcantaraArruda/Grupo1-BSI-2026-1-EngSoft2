/* devolucao.js — View binding do caso de uso Realizar Devolução (RF_F8). */

(function ($) {

    if (!window.AGAPE.Utils.Auth.getInstance().requireLogin()) return;

    var ctrl      = window.AGAPE.Controllers.DevolucaoController.getInstance();
    var validador = window.AGAPE.Utils.Validador.getInstance();

    // ── Referências ───────────────────────────────────────────────────────────

    var $buscaVenda   = $('#dev-busca-venda');
    var $dropdown     = $('#dev-dropdown-venda');
    var $idVenda      = $('#dev-id-venda');
    var $btnBuscar    = $('#dev-btn-buscar');

    var $painel       = $('#dev-painel');
    var $infoVenda    = $('#dev-info-venda');
    var $infoParoq    = $('#dev-info-paroquiano');
    var $infoData     = $('#dev-info-data');
    var $infoTotal    = $('#dev-info-total');

    var $tbodyItens   = $('#dev-tbody-itens');
    var $reincorpora  = $('#dev-reincorpora');
    var $totalDev     = $('#dev-total-devolucao');
    var $btnCancelar  = $('#dev-btn-cancelar');
    var $btnFinalizar = $('#dev-btn-finalizar');

    var _vendasCache = [];
    var _buscaTimer  = null;

    // ══════════════════════════════════════════════════════════════════════════
    // GUARDIÃO DE NAVEGAÇÃO
    // ══════════════════════════════════════════════════════════════════════════

    // Ativa o guardião (interceptado pela Sidebar) quando há itens selecionados.
    function _atualizarGuardiao() {
        window.AGAPE_DEVOLUCAO_GUARDIAO = ctrl.temItensSelecionados()
            ? function () { return true; }
            : null;
    }

    // Aviso nativo ao recarregar/fechar a aba com devolução em andamento.
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
        await _carregarVendas();
    }

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
        // Se já havia uma devolução em andamento, confirma o descarte
        if (ctrl.temItensSelecionados() &&
            !confirm('Há uma devolução em andamento. Deseja descartá-la e carregar outra venda?')) {
            return;
        }

        var res = await ctrl.buscarVenda(idVenda);
        if (!res.ok) {
            validador.mostrarAlerta(res.erro || 'Venda não encontrada.', 'erro');
            $painel.hide();
            _atualizarGuardiao();
            return;
        }

        var v = res.venda;
        $infoVenda.text('#' + v.idVenda);
        $infoParoq.text(v.nomeParoquiano || '—');
        $infoData.text(_formatarDataHora(v.dataHora));
        $infoTotal.text('R$ ' + _moeda(v.valorFinal));

        _renderizarItens();
        $reincorpora.prop('checked', true);
        ctrl.definirReincorpora(true);
        _atualizarTotais();
        $painel.show();
    }

    function _renderizarItens() {
        var itens = ctrl.getEstado().itens;
        $tbodyItens.empty();

        if (itens.length === 0) {
            $tbodyItens.html(
                '<tr><td colspan="5" class="text-muted small text-center py-3">' +
                'Esta venda não possui itens.</td></tr>'
            );
            return;
        }

        itens.forEach(function (it) {
            $('<tr>').attr('data-idprod', it.idProd)
                .html(
                    '<td class="text-start">' + _esc(it.nome) + '</td>' +
                    '<td>' + it.qtdVendida + '</td>' +
                    '<td>R$ ' + _moeda(it.valorUni) + '</td>' +
                    '<td>' +
                        '<input type="number" class="form-control form-control-sm dev-qtd-input mx-auto dev-qtd" ' +
                        'min="0" max="' + it.qtdVendida + '" value="0" ' +
                        'data-idprod="' + it.idProd + '">' +
                    '</td>' +
                    '<td class="dev-item-total" data-idprod="' + it.idProd + '">R$ 0,00</td>'
                )
                .appendTo($tbodyItens);
        });
    }

    // Atualização em tempo real ao digitar a quantidade
    $tbodyItens.on('input', '.dev-qtd', function () {
        var idProd = parseInt($(this).data('idprod'), 10);
        var res = ctrl.definirQuantidade(idProd, $(this).val());

        if (!res.ok && typeof res.ajustado !== 'undefined') {
            $(this).val(res.ajustado);
            validador.mostrarAlerta(res.erro, 'aviso');
        }

        // Atualiza total do item
        $tbodyItens.find('.dev-item-total[data-idprod="' + idProd + '"]')
            .text('R$ ' + _moeda(ctrl.totalItem(idProd)));

        _atualizarTotais();
    });

    $reincorpora.on('change', function () {
        ctrl.definirReincorpora($(this).is(':checked'));
    });

    function _atualizarTotais() {
        $totalDev.text('R$ ' + _moeda(ctrl.totalDevolucao()));
        $btnFinalizar.prop('disabled', !ctrl.podeFinalizar());
        _atualizarGuardiao();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CANCELAR / FINALIZAR
    // ══════════════════════════════════════════════════════════════════════════

    $btnCancelar.on('click', function () {
        ctrl.resetar();
        _atualizarGuardiao();
        $painel.hide();
        $buscaVenda.val('');
        $idVenda.val('');
    });

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
            // Libera o guardião ANTES de resetar para permitir nova operação livremente
            ctrl.resetar();
            _atualizarGuardiao();
            $painel.hide();
            $buscaVenda.val('');
            $idVenda.val('');
            validador.mostrarAlerta(
                (resultado.mensagem) ||
                'Devolução registrada com sucesso! Crédito adicionado ao paroquiano.',
                'sucesso'
            );
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
