/**
 * venda.js — View binding do PDV (Ponto de Venda).
 *
 * Responsabilidades (SRP):
 *   - Captura eventos do DOM e delega ao VendaController.
 *   - Renderiza o estado retornado pelo Controller.
 *   - Registra o Guardião de Navegação enquanto há itens na venda.
 *
 * Padrões:
 *   MVC View       — sem lógica de negócio; apenas apresentação e eventos.
 *   Controller (GRASP) — toda decisão fica em VendaController.
 *   Low Coupling (GRASP) — comunica com Sidebar via flag global (window.AGAPE_VENDA_GUARDIAO).
 */

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

    // ── Referências: PDV — paroquiano ─────────────────────────────────────────

    var pdvCpf          = document.getElementById('pdv-cpf');
    var pdvBlocoPar     = document.getElementById('pdv-bloco-par');
    var pdvParNome      = document.getElementById('pdv-par-nome');
    var pdvParSaldo     = document.getElementById('pdv-par-saldo');

    // ── Referências: PDV — produto (dropdown estilo Select2) ──────────────────

    var pdvBuscaProd      = document.getElementById('pdv-busca-prod');
    var pdvDropdownProd   = document.getElementById('pdv-dropdown-prod');
    var pdvQtd            = document.getElementById('pdv-qtd');
    var pdvBtnAddItem     = document.getElementById('pdv-btn-add-item');
    var pdvTbodyItens     = document.getElementById('pdv-tbody-itens');
    var pdvLinhaVaziaIt   = document.getElementById('pdv-linha-vazia-itens');
    var pdvProdSel        = document.getElementById('pdv-prod-selecionado');
    var pdvProdSelTexto   = document.getElementById('pdv-prod-selecionado-texto');

    // ── Referências: PDV — resumo / crédito ──────────────────────────────────

    var pdvRBruto       = document.getElementById('pdv-r-bruto');
    var pdvRSaldo       = document.getElementById('pdv-r-saldo');
    var pdvInputCred    = document.getElementById('pdv-input-cred');
    var pdvBtnCred      = document.getElementById('pdv-btn-cred');
    var pdvCredFeedback = document.getElementById('pdv-cred-feedback');
    var pdvTotalFinal   = document.getElementById('pdv-total-final');

    // ── Referências: PDV — pagamento ─────────────────────────────────────────

    var pdvSelectForma   = document.getElementById('pdv-select-forma');
    var pdvInputValPag   = document.getElementById('pdv-input-valor-pag');
    var pdvInputParcelas = document.getElementById('pdv-input-parcelas');
    var pdvBtnAddPag     = document.getElementById('pdv-btn-add-pag');
    var pdvPagFeedback   = document.getElementById('pdv-pag-feedback');
    var pdvTbodyPag      = document.getElementById('pdv-tbody-pag');
    var pdvLinhaVaziaPag = document.getElementById('pdv-linha-vazia-pag');
    var pdvRestante      = document.getElementById('pdv-restante');
    var pdvTotalPago     = document.getElementById('pdv-total-pago');

    // ── Referências: botões ───────────────────────────────────────────────────

    var pdvBtnFinalizar  = document.getElementById('pdv-btn-finalizar');
    var pdvBtnCancelar   = document.getElementById('pdv-btn-cancelar');
    var pdvBtnFechar     = document.getElementById('pdv-btn-fechar');

    var modalPdvEl   = document.getElementById('modal-pdv');
    var modalPdvObj  = new bootstrap.Modal(modalPdvEl);
    var modalCompObj = new bootstrap.Modal(document.getElementById('modal-comprovante'));
    var compCorpo    = document.getElementById('comp-corpo');

    var _produtoSelecionado = null;
    var _buscaTimer         = null;

    // ══════════════════════════════════════════════════════════════════════════
    // GUARDIÃO DE NAVEGAÇÃO
    // Registra função global consultada pelo Sidebar antes de navegar.
    // Low Coupling (GRASP) — Sidebar não importa venda.js; usa contrato global.
    // ══════════════════════════════════════════════════════════════════════════

    function _atualizarGuardiao() {
        // Sidebar.js verifica window.AGAPE_VENDA_GUARDIAO antes de cada navegação
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
                '<td>R$ ' + _moeda(v.totBruto) + '</td>' +
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

        pdvCpf.value = '';
        pdvCpf.classList.remove('is-invalid', 'is-valid');
        pdvBlocoPar.style.display = 'none';

        pdvBuscaProd.value = '';
        pdvDropdownProd.classList.remove('aberto');
        pdvDropdownProd.innerHTML = '<div class="pdv-dropdown-item text-muted"><em>Aguardando busca...</em></div>';
        pdvQtd.value = '1';
        pdvProdSel.style.display = 'none';

        pdvInputCred.value = '0';
        pdvInputCred.classList.remove('is-invalid', 'is-valid');
        _feedback(pdvCredFeedback, '');

        pdvSelectForma.value = '';
        pdvInputValPag.value = '';
        pdvInputParcelas.value = '1';
        pdvInputValPag.classList.remove('is-invalid', 'is-valid');
        pdvSelectForma.classList.remove('is-invalid');
        _feedback(pdvPagFeedback, '');

        _renderizarItensPdv();
        _renderizarPagamentosPdv();
        _atualizarResumoPdv();
        _atualizarGuardiao(); // Limpa o guardião ao resetar
    }

    // Cancelar / fechar: reseta e remove guardião
    [pdvBtnCancelar, pdvBtnFechar].forEach(function (btn) {
        btn.addEventListener('click', function () {
            ctrl.resetar();
            _atualizarGuardiao();
            modalPdvObj.hide();
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // PDV — PASSO 2-3: CPF / PAROQUIANO
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

        console.log("O resultado foi: ",resultado);

        if (resultado.status === 'ok') {
            var p = resultado.dados;
            validador.destacarCampo(pdvCpf, true);
            pdvParNome.textContent  = p.nome;
            pdvParSaldo.textContent = 'R$ ' + _moeda(p.saldoCredito);
            pdvBlocoPar.style.display = '';
            ctrl.getEstado().paroquiano = p;
            _atualizarResumoPdv();
        } else {
            validador.destacarCampo(pdvCpf, false,
                resultado.erro || 'Paroquiano não encontrado.');
            pdvBlocoPar.style.display = 'none';
            ctrl.resetar();
            _atualizarResumoPdv();
            _atualizarGuardiao();
        }
    });

    // ══════════════════════════════════════════════════════════════════════════
    // PDV — PASSOS 4-7: BUSCA DE PRODUTO (dropdown estilo Select2)
    // Implementa comportamento equivalente ao Select2 com debounce e dropdown
    // dinâmico, usando apenas as libs locais do projeto (jQuery + nativo).
    // ══════════════════════════════════════════════════════════════════════════

    pdvBuscaProd.addEventListener('input', function () {
        clearTimeout(_buscaTimer);
        var nome = pdvBuscaProd.value.trim();

        _produtoSelecionado = null;
        pdvProdSel.style.display = 'none';

        if (nome.length < 2) {
            pdvDropdownProd.classList.remove('aberto');
            pdvDropdownProd.innerHTML =
                '<div class="pdv-dropdown-item text-muted"><em>Digite ao menos 2 letras...</em></div>';
            return;
        }

        pdvDropdownProd.innerHTML =
            '<div class="pdv-dropdown-item text-muted"><em>Buscando...</em></div>';
        pdvDropdownProd.classList.add('aberto');

        // Debounce de 350ms (evita requisição a cada tecla — equivalente ao Select2)
        _buscaTimer = setTimeout(async function () {
            var res = await ctrl.buscarProdutos(nome);

            if (res.status !== 'ok' || !Array.isArray(res.dados) || res.dados.length === 0) {
                pdvDropdownProd.innerHTML =
                    '<div class="pdv-dropdown-item text-muted"><em>Nenhum produto encontrado.</em></div>';
                return;
            }

            pdvDropdownProd.innerHTML = '';
            res.dados.forEach(function (p) {
                var div = document.createElement('div');
                div.className = 'pdv-dropdown-item';
                div.innerHTML =
                    '<div class="prod-nome">' + _esc(p.nome) + '</div>' +
                    '<div class="prod-info">R$ ' + _moeda(p.valorUni) +
                    ' &nbsp;|&nbsp; Estoque: ' + p.qtdeAtual + '</div>';
                div.addEventListener('click', function () {
                    _selecionarProduto(p);
                });
                pdvDropdownProd.appendChild(div);
            });
        }, 350);
    });

    function _selecionarProduto(p) {
        _produtoSelecionado = p;
        pdvBuscaProd.value  = p.nome;
        pdvDropdownProd.classList.remove('aberto');
        pdvProdSel.style.display = '';
        pdvProdSelTexto.textContent =
            p.nome + ' — R$ ' + _moeda(p.valorUni) + ' (estoque: ' + p.qtdeAtual + ')';
        pdvQtd.focus();
    }

    // Fecha dropdown ao clicar fora
    document.addEventListener('click', function (e) {
        if (!pdvBuscaProd.contains(e.target) && !pdvDropdownProd.contains(e.target)) {
            pdvDropdownProd.classList.remove('aberto');
        }
    });

    pdvBuscaProd.addEventListener('focus', function () {
        if (pdvDropdownProd.children.length > 0 &&
            pdvDropdownProd.innerHTML.indexOf('Aguardando') === -1) {
            pdvDropdownProd.classList.add('aberto');
        }
    });

    // Passo 6-7: Adicionar item à venda
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
        _atualizarGuardiao(); // Ativa guardião quando o primeiro item é adicionado

        // Limpa para próxima busca
        pdvBuscaProd.value = '';
        pdvProdSel.style.display = 'none';
        pdvDropdownProd.classList.remove('aberto');
        pdvDropdownProd.innerHTML =
            '<div class="pdv-dropdown-item text-muted"><em>Aguardando busca...</em></div>';
        pdvQtd.value = '1';
        _produtoSelecionado = null;
        pdvBuscaProd.focus();
    });

    // Passo 7: Renderizar tabela de itens
    function _renderizarItensPdv() {
        var itens = ctrl.getEstado().itens;
        pdvLinhaVaziaIt.style.display = itens.length === 0 ? '' : 'none';

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
                _atualizarGuardiao(); // Recalcula guardião ao remover item
            });
        });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PDV — PASSOS 9-11: CRÉDITO
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
    // PDV — PASSO 12: PAGAMENTOS (com suporte a parcelas)
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

        var descricao    = pdvSelectForma.options[pdvSelectForma.selectedIndex].textContent;
        var numeroParcelas = parseInt(pdvInputParcelas.value, 10) || 1;
        var res = ctrl.adicionarPagamento(idFormaPag, descricao, pdvInputValPag.value, numeroParcelas);

        if (!res.ok) {
            pdvInputValPag.classList.add('is-invalid');
            _feedback(pdvPagFeedback, res.erro);
            return;
        }

        pdvInputValPag.classList.add('is-valid');
        _renderizarPagamentosPdv();
        _atualizarResumoPdv();

        pdvSelectForma.value     = '';
        pdvInputParcelas.value   = '1';
        pdvInputValPag.value     = res.restante > 0 ? res.restante.toFixed(2) : '';
        pdvInputValPag.classList.remove('is-valid');
    });

    // Renderizar tabela de pagamentos
    function _renderizarPagamentosPdv() {
        var pags = ctrl.getEstado().pagamentos;
        pdvLinhaVaziaPag.style.display = pags.length === 0 ? '' : 'none';

        Array.from(pdvTbodyPag.querySelectorAll('tr.pdv-pag-row')).forEach(function (tr) {
            tr.remove();
        });

        pags.forEach(function (p, idx) {
            var parcelaLabel = p.numeroParcelas > 1
                ? '<span class="badge-parcela ms-1">' + p.numeroParcelas + 'x</span>'
                : '<span class="badge-parcela ms-1 bg-secondary">à vista</span>';

            var tr = document.createElement('tr');
            tr.className = 'pdv-pag-row text-center';
            tr.innerHTML =
                '<td class="text-start small">' + _esc(p.descricao) + parcelaLabel + '</td>' +
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
    // PDV — PASSO 13: FINALIZAR VENDA
    // ══════════════════════════════════════════════════════════════════════════

    pdvBtnFinalizar.addEventListener('click', async function () {
        pdvBtnFinalizar.disabled    = true;
        pdvBtnFinalizar.textContent = 'Processando...';

        var resultado = await ctrl.efetuarVenda();

        pdvBtnFinalizar.disabled = false;
        pdvBtnFinalizar.innerHTML = '<i class="bi bi-check2-circle me-1"></i>Finalizar Venda';

        if (resultado.status === 'ok') {
            _exibirComprovante(resultado.dados);
            _atualizarGuardiao(); // Remove guardião após venda concluída
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
                ? ' (' + p.numeroParcelas + 'x de R$ ' +
                  _moeda(p.valor / p.numeroParcelas) + ')'
                : ' (à vista)';
            return '<tr>' +
                '<td class="text-start">' + _esc(p.descricao) + parcInfo + '</td>' +
                '<td class="text-end">R$ ' + _moeda(p.valor) + '</td>' +
                '</tr>';
        }).join('');

        var temParcelado = e.pagamentos.some(function (p) { return p.numeroParcelas > 1; });

        compCorpo.innerHTML =
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
                  '<span>Crédito utilizado:</span><strong>- R$ ' +
                  _moeda(e.credUtilizado) + '</strong></div>'
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
                : '');

        modalCompObj.show();
    }

    // Botão imprimir comprovante
    document.getElementById('comp-btn-imprimir').addEventListener('click', function () {
        window.print();
    });

    // ══════════════════════════════════════════════════════════════════════════
    // PDV — ATUALIZAR PAINEL DIREITO
    // ══════════════════════════════════════════════════════════════════════════

    function _atualizarResumoPdv() {
        var e = ctrl.getEstado();
        pdvRBruto.textContent     = 'R$ ' + _moeda(e.totBruto);
        pdvRSaldo.textContent     = 'R$ ' + _moeda(e.paroquiano ? e.paroquiano.saldoCredito : 0);
        pdvTotalFinal.textContent = 'R$ ' + _moeda(e.totalFinal);
        pdvRestante.textContent   = 'R$ ' + _moeda(ctrl.getRestante());
        pdvTotalPago.textContent  = 'R$ ' + _moeda(e.totalPago);
        pdvBtnFinalizar.disabled  = !ctrl.podeFinalizar();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CARREGAMENTO DAS FORMAS DE PAGAMENTO (consultadas do banco a cada carregamento)
    // ══════════════════════════════════════════════════════════════════════════

    async function _carregarFormasPag() {
        var resultado = await ctrl.listarFormasPag();

        pdvSelectForma.innerHTML = '<option value="">— selecione —</option>';

        if (resultado.status !== 'ok') {
            // Informa o usuário que as formas não puderam ser carregadas
            var opt = document.createElement('option');
            opt.disabled     = true;
            opt.textContent  = '⚠ Erro ao carregar formas de pagamento';
            pdvSelectForma.appendChild(opt);
            console.warn('[PDV] Formas de pagamento:', resultado.erro);
            return;
        }

        var formas = ctrl.getEstado().formasPag;
        if (formas.length === 0) {
            var opt = document.createElement('option');
            opt.disabled    = true;
            opt.textContent = 'Nenhuma forma de pagamento ativa cadastrada';
            pdvSelectForma.appendChild(opt);
            return;
        }

        formas.forEach(function (f) {
            var opt = document.createElement('option');
            opt.value       = f.idFormaPag;
            opt.textContent = f.descricao;
            pdvSelectForma.appendChild(opt);
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
