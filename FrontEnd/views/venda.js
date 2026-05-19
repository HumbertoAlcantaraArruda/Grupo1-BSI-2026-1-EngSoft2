/* venda.js — Listagem de vendas + PDV (modal) */

(function () {

    if (!window.AGAPE.Utils.Auth.getInstance().requireLogin()) return;

    var ctrl      = window.AGAPE.Controllers.VendaController.getInstance();
    var mascaras  = window.AGAPE.Utils.Mascaras.getInstance();
    var validador = window.AGAPE.Utils.Validador.getInstance();

    // ── Referências: listagem ─────────────────────────────────────────────────

    var tabelaCorpo   = document.getElementById('tabela-corpo');
    var filtroDataIni = document.getElementById('filtro-data-ini');
    var filtroDataFim = document.getElementById('filtro-data-fim');
    var btnFiltrar    = document.getElementById('btn-filtrar');
    var btnLimpar     = document.getElementById('btn-limpar');
    var btnNovaVenda  = document.getElementById('btn-nova-venda');

    // ── Referências: PDV ──────────────────────────────────────────────────────

    var pdvCpf          = document.getElementById('pdv-cpf');
    var pdvBlocoPar     = document.getElementById('pdv-bloco-par');
    var pdvParNome      = document.getElementById('pdv-par-nome');
    var pdvParSaldo     = document.getElementById('pdv-par-saldo');

    var pdvBuscaProd    = document.getElementById('pdv-busca-prod');
    var pdvSelectProd   = document.getElementById('pdv-select-prod');
    var pdvQtd          = document.getElementById('pdv-qtd');
    var pdvBtnAddItem   = document.getElementById('pdv-btn-add-item');
    var pdvTbodyItens   = document.getElementById('pdv-tbody-itens');
    var pdvLinhaVaziaIt = document.getElementById('pdv-linha-vazia-itens');

    var pdvRBruto       = document.getElementById('pdv-r-bruto');
    var pdvRSaldo       = document.getElementById('pdv-r-saldo');
    var pdvInputCred    = document.getElementById('pdv-input-cred');
    var pdvBtnCred      = document.getElementById('pdv-btn-cred');
    var pdvCredFeedback = document.getElementById('pdv-cred-feedback');
    var pdvTotalFinal   = document.getElementById('pdv-total-final');

    var pdvSelectForma  = document.getElementById('pdv-select-forma');
    var pdvInputValPag  = document.getElementById('pdv-input-valor-pag');
    var pdvBtnAddPag    = document.getElementById('pdv-btn-add-pag');
    var pdvPagFeedback  = document.getElementById('pdv-pag-feedback');
    var pdvTbodyPag     = document.getElementById('pdv-tbody-pag');
    var pdvLinhaVaziaPag= document.getElementById('pdv-linha-vazia-pag');
    var pdvRestante     = document.getElementById('pdv-restante');
    var pdvTotalPago    = document.getElementById('pdv-total-pago');

    var pdvBtnFinalizar = document.getElementById('pdv-btn-finalizar');
    var pdvBtnCancelar  = document.getElementById('pdv-btn-cancelar');
    var pdvBtnFechar    = document.getElementById('pdv-btn-fechar');

    var modalPdvEl      = document.getElementById('modal-pdv');
    var modalPdvObj     = new bootstrap.Modal(modalPdvEl);
    var modalCompObj    = new bootstrap.Modal(document.getElementById('modal-comprovante'));
    var compCorpo       = document.getElementById('comp-corpo');

    var _produtoSelecionado = null;
    var _buscaTimer         = null;

    // ── Inicialização ─────────────────────────────────────────────────────────

    async function inicializar() {
        window.AGAPE.Utils.Sidebar.inicializar();
        mascaras.aplicar('#pdv-cpf', 'cpf');
        await _carregarFormasPag();
        await _carregarLista();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // LISTAGEM
    // ══════════════════════════════════════════════════════════════════════════

    async function _carregarLista() {
        tabelaCorpo.innerHTML =
            '<tr><td colspan="8" class="tabela-vazia">' +
            '<i class="bi bi-hourglass-split me-1"></i>Carregando...</td></tr>';

        var filtros = {};
        if (filtroDataIni.value) filtros.dataInicio = filtroDataIni.value;
        if (filtroDataFim.value) filtros.dataFim    = filtroDataFim.value;

        var resultado = await ctrl.listar(filtros);
        _renderizarTabela(resultado);
    }

    function _renderizarTabela(resultado) {
        if (resultado.status !== 'ok') {
            tabelaCorpo.innerHTML =
                '<tr><td colspan="8" class="tabela-vazia text-danger">' +
                '<i class="bi bi-exclamation-triangle me-1"></i>' +
                _esc(resultado.erro || 'Erro ao carregar vendas.') + '</td></tr>';
            return;
        }

        var lista = Array.isArray(resultado.dados) ? resultado.dados : [];

        if (lista.length === 0) {
            tabelaCorpo.innerHTML =
                '<tr><td colspan="8" class="tabela-vazia">' +
                '<i class="bi bi-inbox me-1"></i>Nenhuma venda encontrada.</td></tr>';
            return;
        }

        tabelaCorpo.innerHTML = lista.map(function (v) {
            return '<tr>' +
                '<td>' + v.idVenda + '</td>' +
                '<td>' + _formatarDataHora(v.dataHora) + '</td>' +
                '<td class="text-start">' + _esc(v.nomeParoquiano  || '—') + '</td>' +
                '<td class="text-start">' + _esc(v.nomeColaborador || '—') + '</td>' +
                '<td>' + _esc(v.descFormaPag || '—') + '</td>' +
                '<td>R$ ' + _moeda(v.totBruto)      + '</td>' +
                '<td>' + (v.credUtilizado > 0
                    ? '<span class="text-success">- R$ ' + _moeda(v.credUtilizado) + '</span>'
                    : '—') + '</td>' +
                '<td><strong>R$ ' + _moeda(v.valorFinal) + '</strong></td>' +
                '</tr>';
        }).join('');
    }

    btnFiltrar.addEventListener('click', _carregarLista);

    btnLimpar.addEventListener('click', async function () {
        filtroDataIni.value = '';
        filtroDataFim.value = '';
        await _carregarLista();
    });

    // ══════════════════════════════════════════════════════════════════════════
    // PDV — ABERTURA E RESET
    // ══════════════════════════════════════════════════════════════════════════

    btnNovaVenda.addEventListener('click', function () {
        _resetarPdv();
        modalPdvObj.show();
        setTimeout(function () { pdvCpf.focus(); }, 400);
    });

    function _resetarPdv() {
        ctrl.resetar();
        _produtoSelecionado = null;

        pdvCpf.value  = '';
        pdvCpf.classList.remove('is-invalid', 'is-valid');
        pdvBlocoPar.style.display = 'none';

        pdvBuscaProd.value    = '';
        pdvSelectProd.innerHTML = '<option value="">— selecione —</option>';
        pdvQtd.value          = '1';

        pdvInputCred.value    = '0';
        pdvInputCred.classList.remove('is-invalid', 'is-valid');
        _feedback(pdvCredFeedback, '');

        pdvInputValPag.value  = '';
        pdvSelectForma.value  = '';
        pdvInputValPag.classList.remove('is-invalid', 'is-valid');
        _feedback(pdvPagFeedback, '');

        _renderizarItensPdv();
        _renderizarPagamentosPdv();
        _atualizarResumoPdv();
    }

    // Cancelar / fechar zera estado
    [pdvBtnCancelar, pdvBtnFechar].forEach(function (btn) {
        btn.addEventListener('click', function () {
            ctrl.resetar();
            modalPdvObj.hide();
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // PDV — PASSO 2: CPF / PAROQUIANO
    // ══════════════════════════════════════════════════════════════════════════

    pdvCpf.addEventListener('blur', async function () {
        var cpf = mascaras.apenasDigitos(pdvCpf.value);
        pdvCpf.classList.remove('is-invalid', 'is-valid');

        if (cpf.length === 0) return;

        if (cpf.length !== 11) {
            validador.destacarCampo(pdvCpf, false, 'CPF deve ter 11 dígitos.');
            return;
        }

        var resultado = await ctrl.buscarParoquiano(cpf);

        if (resultado.status === 'ok') {
            var p = resultado.dados;
            validador.destacarCampo(pdvCpf, true);
            pdvParNome.textContent  = p.nome;
            pdvParSaldo.textContent = 'R$ ' + _moeda(p.saldoCredito);
            pdvBlocoPar.style.display = '';
            // Garante que o estado interno do controller tem o paroquiano
            ctrl.getEstado().paroquiano = p;
            _atualizarResumoPdv();
        } else {
            validador.destacarCampo(pdvCpf, false,
                resultado.erro || 'Paroquiano não encontrado.');
            pdvBlocoPar.style.display = 'none';
            ctrl.resetar();
            _atualizarResumoPdv();
        }
    });

    // ══════════════════════════════════════════════════════════════════════════
    // PDV — PASSO 3-8: PRODUTO / ITENS
    // ══════════════════════════════════════════════════════════════════════════

    pdvBuscaProd.addEventListener('input', function () {
        clearTimeout(_buscaTimer);
        var nome = pdvBuscaProd.value.trim();
        pdvSelectProd.innerHTML = '<option value="">— buscando... —</option>';
        _produtoSelecionado = null;

        if (nome.length < 2) {
            pdvSelectProd.innerHTML = '<option value="">— selecione —</option>';
            return;
        }

        _buscaTimer = setTimeout(async function () {
            var res = await ctrl.buscarProdutos(nome);
            pdvSelectProd.innerHTML = '<option value="">— selecione —</option>';
            if (res.status !== 'ok' || !Array.isArray(res.dados)) return;
            res.dados.forEach(function (p) {
                var opt = document.createElement('option');
                opt.value       = JSON.stringify(p);
                opt.textContent = p.nome +
                    ' — R$ ' + _moeda(p.valorUni) +
                    '  (est: ' + p.qtdeAtual + ')';
                pdvSelectProd.appendChild(opt);
            });
        }, 350);
    });

    pdvSelectProd.addEventListener('change', function () {
        _produtoSelecionado = null;
        if (!this.value) return;
        try { _produtoSelecionado = JSON.parse(this.value); } catch (_) {}
    });

    pdvBtnAddItem.addEventListener('click', function () {
        if (!ctrl.getEstado().paroquiano) {
            validador.mostrarAlerta('Identifique o paroquiano antes de adicionar produtos.', 'aviso');
            return;
        }
        if (!_produtoSelecionado) {
            validador.mostrarAlerta('Selecione um produto na lista.', 'aviso');
            return;
        }

        var res = ctrl.adicionarItem(_produtoSelecionado, pdvQtd.value);
        if (!res.ok) { validador.mostrarAlerta(res.erro, 'erro'); return; }

        _renderizarItensPdv();
        _atualizarResumoPdv();

        // Limpa para próxima busca
        pdvBuscaProd.value      = '';
        pdvSelectProd.innerHTML = '<option value="">— selecione —</option>';
        pdvQtd.value            = '1';
        _produtoSelecionado     = null;
        pdvBuscaProd.focus();
    });

    function _renderizarItensPdv() {
        var itens = ctrl.getEstado().itens;
        pdvLinhaVaziaIt.style.display = itens.length === 0 ? '' : 'none';

        // Remove linhas de itens (não a linha vazia)
        Array.from(pdvTbodyItens.querySelectorAll('tr.pdv-item-row')).forEach(function (tr) {
            tr.remove();
        });

        itens.forEach(function (item, idx) {
            var tr = document.createElement('tr');
            tr.className = 'pdv-item-row text-center';
            tr.innerHTML =
                '<td class="text-start small">' + _esc(item.nome) + '</td>' +
                '<td>' + item.qtd + '</td>' +
                '<td>R$ ' + _moeda(item.valorUni) + '</td>' +
                '<td>R$ ' + _moeda(item.totalItem) + '</td>' +
                '<td>' +
                '<button class="btn-acao btn-excluir" data-idx="' + idx + '" title="Remover">' +
                '<i class="bi bi-trash"></i></button></td>';
            pdvTbodyItens.appendChild(tr);
        });

        pdvTbodyItens.querySelectorAll('.btn-excluir').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var item = ctrl.getEstado().itens[parseInt(this.dataset.idx, 10)];
                if (item) ctrl.removerItem(item.idProd);
                _renderizarItensPdv();
                _atualizarResumoPdv();
            });
        });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PDV — PASSOS 9-14: CRÉDITO E TOTAL FINAL
    // ══════════════════════════════════════════════════════════════════════════

    pdvBtnCred.addEventListener('click', function () {
        pdvInputCred.classList.remove('is-invalid', 'is-valid');
        _feedback(pdvCredFeedback, '');

        var res = ctrl.aplicarCredito(pdvInputCred.value);
        if (!res.ok) {
            pdvInputCred.classList.add('is-invalid');
            _feedback(pdvCredFeedback, res.erro);
            return;
        }

        pdvInputCred.classList.add('is-valid');
        _atualizarResumoPdv();
    });

    // ══════════════════════════════════════════════════════════════════════════
    // PDV — PASSOS 17-17.1.3: PAGAMENTO
    // ══════════════════════════════════════════════════════════════════════════

    pdvBtnAddPag.addEventListener('click', function () {
        pdvInputValPag.classList.remove('is-invalid', 'is-valid');
        pdvSelectForma.classList.remove('is-invalid');
        _feedback(pdvPagFeedback, '');

        var idFormaPag = parseInt(pdvSelectForma.value, 10);
        if (!idFormaPag) {
            pdvSelectForma.classList.add('is-invalid');
            _feedback(pdvPagFeedback, 'Selecione uma forma de pagamento.');
            return;
        }

        var descricao = pdvSelectForma.options[pdvSelectForma.selectedIndex].textContent;
        var res = ctrl.adicionarPagamento(idFormaPag, descricao, pdvInputValPag.value);

        if (!res.ok) {
            pdvInputValPag.classList.add('is-invalid');
            _feedback(pdvPagFeedback, res.erro);
            return;
        }

        pdvInputValPag.classList.add('is-valid');
        _renderizarPagamentosPdv();
        _atualizarResumoPdv();

        // Pré-preenche com o restante para facilitar o próximo lançamento
        pdvSelectForma.value  = '';
        pdvInputValPag.value  = res.restante > 0 ? res.restante.toFixed(2) : '';
        pdvInputValPag.classList.remove('is-valid');
    });

    function _renderizarPagamentosPdv() {
        var pags = ctrl.getEstado().pagamentos;
        pdvLinhaVaziaPag.style.display = pags.length === 0 ? '' : 'none';

        Array.from(pdvTbodyPag.querySelectorAll('tr.pdv-pag-row')).forEach(function (tr) {
            tr.remove();
        });

        pags.forEach(function (p, idx) {
            var tr = document.createElement('tr');
            tr.className = 'pdv-pag-row text-center';
            tr.innerHTML =
                '<td class="text-start small">' + _esc(p.descricao) + '</td>' +
                '<td>R$ ' + _moeda(p.valor) + '</td>' +
                '<td>' +
                '<button class="btn-acao btn-excluir" data-idx="' + idx + '" title="Remover">' +
                '<i class="bi bi-trash"></i></button></td>';
            pdvTbodyPag.appendChild(tr);
        });

        pdvTbodyPag.querySelectorAll('.btn-excluir').forEach(function (btn) {
            btn.addEventListener('click', function () {
                ctrl.removerPagamento(parseInt(this.dataset.idx, 10));
                _renderizarPagamentosPdv();
                _atualizarResumoPdv();
            });
        });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PDV — PASSO 19: FINALIZAR VENDA
    // ══════════════════════════════════════════════════════════════════════════

    pdvBtnFinalizar.addEventListener('click', async function () {
        pdvBtnFinalizar.disabled    = true;
        pdvBtnFinalizar.textContent = 'Processando...';

        var resultado = await ctrl.efetuarVenda();

        pdvBtnFinalizar.disabled = false;
        pdvBtnFinalizar.innerHTML = '<i class="bi bi-check2-circle me-1"></i>Finalizar Venda';

        if (resultado.status === 'ok') {
            // Passo 22 — emitirComprovante
            _exibirComprovante(resultado.dados);
            modalPdvObj.hide();
            await _carregarLista();   // atualiza a listagem
        } else {
            validador.mostrarAlerta(resultado.erro || 'Erro ao finalizar a venda.', 'erro');
        }
    });

    // ══════════════════════════════════════════════════════════════════════════
    // PDV — PASSO 22: COMPROVANTE
    // ══════════════════════════════════════════════════════════════════════════

    function _exibirComprovante(venda) {
        var e = ctrl.getEstado();

        var itensHtml = e.itens.map(function (it) {
            return '<tr>' +
                '<td class="text-start">' + _esc(it.nome) + '</td>' +
                '<td class="text-center">' + it.qtd + '</td>' +
                '<td class="text-center">R$ ' + _moeda(it.valorUni) + '</td>' +
                '<td class="text-center">R$ ' + _moeda(it.totalItem) + '</td>' +
                '</tr>';
        }).join('');

        var pagHtml = e.pagamentos.map(function (p) {
            return '<tr>' +
                '<td class="text-start">' + _esc(p.descricao) + '</td>' +
                '<td class="text-center">R$ ' + _moeda(p.valor) + '</td>' +
                '</tr>';
        }).join('');

        compCorpo.innerHTML =
            '<p class="mb-1"><strong>Paroquiano:</strong> ' + _esc(e.paroquiano.nome) + '</p>' +
            '<p class="mb-3"><strong>Venda nº:</strong> ' + (venda && venda.idVenda ? venda.idVenda : '—') + '</p>' +

            '<table class="table table-sm mb-3"><thead><tr>' +
            '<th class="text-start">Produto</th><th class="text-center">Qtd</th>' +
            '<th class="text-center">Unitário</th><th class="text-center">Total</th>' +
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
            '<table class="table table-sm"><tbody>' + pagHtml + '</tbody></table>';

        modalCompObj.show();
    }

    // ── Atualiza displays do painel direito ───────────────────────────────────

    function _atualizarResumoPdv() {
        var e = ctrl.getEstado();
        pdvRBruto.textContent       = 'R$ ' + _moeda(e.totBruto);
        pdvRSaldo.textContent       = 'R$ ' + _moeda(e.paroquiano ? e.paroquiano.saldoCredito : 0);
        pdvTotalFinal.textContent   = 'R$ ' + _moeda(e.totalFinal);
        pdvRestante.textContent     = 'R$ ' + _moeda(ctrl.getRestante());
        pdvTotalPago.textContent    = 'R$ ' + _moeda(e.totalPago);
        pdvBtnFinalizar.disabled    = !ctrl.podeFinalizar();
    }

    // ── Passo 15: Carrega formas de pagamento ─────────────────────────────────

    async function _carregarFormasPag() {
        var resultado = await ctrl.listarFormasPag();
        if (resultado.status !== 'ok') return;

        var formas = ctrl.getEstado().formasPag;
        pdvSelectForma.innerHTML = '<option value="">— forma —</option>';
        formas.forEach(function (f) {
            var opt = document.createElement('option');
            opt.value       = f.idFormaPag;
            opt.textContent = f.descricao;
            pdvSelectForma.appendChild(opt);
        });
    }

    // ── Utilitários ───────────────────────────────────────────────────────────

    function _moeda(valor) {
        return parseFloat(valor || 0)
            .toFixed(2)
            .replace('.', ',')
            .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    function _esc(texto) {
        if (!texto && texto !== 0) return '';
        return String(texto)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function _formatarDataHora(iso) {
        if (!iso) return '—';
        var d = new Date(iso.replace('T', ' ').replace(/-/g, '/'));
        if (isNaN(d)) return iso;
        var pad = function (n) { return String(n).padStart(2, '0'); };
        return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() +
               ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    function _feedback(el, msg) {
        if (!el) return;
        el.textContent = msg;
        el.style.setProperty('display', msg ? 'block' : 'none', 'important');
    }

    document.addEventListener('DOMContentLoaded', inicializar);

})();
