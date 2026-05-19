/* VendaController — fachada do caso de uso "Realizar Venda de Produtos" */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Controllers = window.AGAPE.Controllers || {};

window.AGAPE.Controllers.VendaController = (function () {

    var instancia = null;

    function VendaController() {
        this._service     = window.AGAPE.Services.VendaService.getInstance();
        this._estado      = _estadoInicial();
        this._listaCache  = [];
    }

    VendaController.prototype.listar = async function (filtros) {
        var resultado = await this._service.listar(filtros || {});
        if (resultado.status === 'ok' && Array.isArray(resultado.dados)) {
            this._listaCache = resultado.dados;
        }
        return resultado;
    };

    function _estadoInicial() {
        return {
            paroquiano:    null,   // { idUsuario, nome, cpf, saldoCredito }
            itens:         [],     // [{ idProd, nome, valorUni, qtd, totalItem }]
            totBruto:      0,
            credUtilizado: 0,
            totalFinal:    0,
            formasPag:     [],     // [{ idFormaPag, descricao }] — carregadas da API
            pagamentos:    [],     // [{ idFormaPag, descricao, valor }]
            totalPago:     0
        };
    }

    // ── Passo 2.1 ─────────────────────────────────────────────────────────────

    VendaController.prototype.buscarParoquiano = async function (cpf) {
        var digits = cpf.replace(/\D/g, '');
        if (digits.length !== 11) {
            return { status: 'error', erro: 'CPF deve ter 11 dígitos.' };
        }
        var resultado = await this._service.buscarParoquiano(digits);
        if (resultado.status === 'ok') {
            this._estado.paroquiano = resultado.dados;
        }
        return resultado;
    };

    // ── Passo 3.1 ─────────────────────────────────────────────────────────────

    VendaController.prototype.buscarProdutos = async function (nome) {
        if (!nome || nome.trim().length < 2) {
            return { status: 'error', erro: 'Informe ao menos 2 caracteres.' };
        }
        return await this._service.buscarProdutos(nome.trim());
    };

    // ── Passos 4-8 ────────────────────────────────────────────────────────────

    /** Passo 4 — verifEstoque; passos 5-8 — criarItemVenda, addItem, calcTotalItemVenda, dadosItem. */
    VendaController.prototype.adicionarItem = function (produto, qtd) {
        qtd = parseInt(qtd, 10);
        if (isNaN(qtd) || qtd <= 0) {
            return { ok: false, erro: 'Quantidade inválida.' };
        }
        // Passo 4 — verifEstoque
        if (produto.qtdeAtual < qtd) {
            return {
                ok: false,
                erro: 'Estoque insuficiente para "' + produto.nome +
                      '". Disponível: ' + produto.qtdeAtual + '.'
            };
        }

        var e = this._estado;
        var existente = null;
        for (var i = 0; i < e.itens.length; i++) {
            if (e.itens[i].idProd === produto.idProd) { existente = e.itens[i]; break; }
        }

        if (existente) {
            var novaQtd = existente.qtd + qtd;
            if (produto.qtdeAtual < novaQtd) {
                return {
                    ok: false,
                    erro: 'Estoque insuficiente para "' + produto.nome +
                          '". Disponível: ' + produto.qtdeAtual + '.'
                };
            }
            existente.qtd       = novaQtd;
            existente.totalItem = +(existente.valorUni * novaQtd).toFixed(2);
        } else {
            // Passo 5 — criarItemVenda
            var totalItem = +(produto.valorUni * qtd).toFixed(2);
            e.itens.push({
                idProd:    produto.idProd,
                nome:      produto.nome,
                valorUni:  produto.valorUni,
                qtd:       qtd,
                totalItem: totalItem
            });
        }

        this._recalcularTotais();
        return { ok: true };
    };

    VendaController.prototype.removerItem = function (idProd) {
        this._estado.itens = this._estado.itens.filter(function (i) {
            return i.idProd !== idProd;
        });
        this._recalcularTotais();
    };

    // ── Passos 9-14 ───────────────────────────────────────────────────────────

    /** Passos 12.1.1 / 13 — aplicarCred, calcTotalFinal. */
    VendaController.prototype.aplicarCredito = function (valorCred) {
        valorCred = parseFloat(valorCred) || 0;
        var e = this._estado;

        if (valorCred < 0) {
            return { ok: false, erro: 'O crédito não pode ser negativo.' };
        }
        if (!e.paroquiano) {
            return { ok: false, erro: 'Nenhum paroquiano selecionado.' };
        }
        if (valorCred > e.paroquiano.saldoCredito) {
            return {
                ok: false,
                erro: 'Crédito solicitado (R$ ' + valorCred.toFixed(2) +
                      ') supera o saldo disponível (R$ ' +
                      parseFloat(e.paroquiano.saldoCredito).toFixed(2) + ').'
            };
        }
        if (valorCred > e.totBruto) {
            return { ok: false, erro: 'O crédito não pode superar o total da venda.' };
        }

        e.credUtilizado = +valorCred.toFixed(2);
        this._recalcularTotais();
        return { ok: true };
    };

    // ── Passo 15 ─────────────────────────────────────────────────────────────

    VendaController.prototype.listarFormasPag = async function () {
        var resultado = await this._service.listarFormasPag();
        if (resultado.status === 'ok' && Array.isArray(resultado.dados)) {
            this._estado.formasPag = resultado.dados.filter(function (f) {
                return f.ativo === 1 || f.ativo === true || f.ativo === '1';
            });
        }
        return resultado;
    };

    // ── Passos 17-17.1.3 ─────────────────────────────────────────────────────

    /** Passo 17.1 — processarPagamento + 17.1.1 atualizarTotalPago. */
    VendaController.prototype.adicionarPagamento = function (idFormaPag, descricao, valor) {
        valor = parseFloat(valor) || 0;
        var e = this._estado;
        var restante = +(e.totalFinal - e.totalPago).toFixed(2);

        if (valor <= 0) {
            return { ok: false, erro: 'O valor deve ser maior que zero.' };
        }
        if (valor > restante + 0.005) {
            return {
                ok: false,
                erro: 'O valor (R$ ' + valor.toFixed(2) +
                      ') supera o restante a pagar (R$ ' + restante.toFixed(2) + ').'
            };
        }

        e.pagamentos.push({ idFormaPag: idFormaPag, descricao: descricao, valor: +valor.toFixed(2) });
        e.totalPago = +(e.totalPago + valor).toFixed(2);
        return { ok: true, restante: +(e.totalFinal - e.totalPago).toFixed(2) };
    };

    VendaController.prototype.removerPagamento = function (indice) {
        var e = this._estado;
        if (indice < 0 || indice >= e.pagamentos.length) return;
        e.totalPago = +(e.totalPago - e.pagamentos[indice].valor).toFixed(2);
        if (e.totalPago < 0) e.totalPago = 0;
        e.pagamentos.splice(indice, 1);
    };

    // ── Passo 19 — Finalizar ─────────────────────────────────────────────────

    VendaController.prototype.podeFinalizar = function () {
        var e = this._estado;
        return e.paroquiano !== null &&
               e.itens.length > 0 &&
               e.pagamentos.length > 0 &&
               Math.abs(e.totalFinal - e.totalPago) < 0.01;
    };

    VendaController.prototype.efetuarVenda = async function () {
        if (!this.podeFinalizar()) {
            return { status: 'error', erro: 'Venda incompleta. Verifique os dados antes de finalizar.' };
        }

        var e = this._estado;
        var dados = {
            idParoquiano:     e.paroquiano.idUsuario,
            totBruto:         e.totBruto.toFixed(2),
            credUtilizado:    e.credUtilizado.toFixed(2),
            valorFinal:       e.totalFinal.toFixed(2),
            idsProdutos:      e.itens.map(function (i) { return i.idProd; }).join(','),
            quantidades:      e.itens.map(function (i) { return i.qtd; }).join(','),
            valoresUnitarios: e.itens.map(function (i) { return i.valorUni.toFixed(2); }).join(','),
            idFormasPag:      e.pagamentos.map(function (p) { return p.idFormaPag; }).join(','),
            valoresPag:       e.pagamentos.map(function (p) { return p.valor.toFixed(2); }).join(',')
        };

        return await this._service.efetuarVenda(dados);
    };

    // ── Acesso ao estado ──────────────────────────────────────────────────────

    VendaController.prototype.getEstado    = function () { return this._estado; };
    VendaController.prototype.getRestante  = function () {
        return Math.max(0, +(this._estado.totalFinal - this._estado.totalPago).toFixed(2));
    };

    VendaController.prototype.resetar = function () {
        this._estado = _estadoInicial();
    };

    // ── Utilitário interno ────────────────────────────────────────────────────

    VendaController.prototype._recalcularTotais = function () {
        var e = this._estado;
        e.totBruto    = +e.itens.reduce(function (s, i) { return s + i.totalItem; }, 0).toFixed(2);
        e.totalFinal  = +Math.max(0, e.totBruto - e.credUtilizado).toFixed(2);
    };

    return {
        getInstance: function () {
            if (!instancia) instancia = new VendaController();
            return instancia;
        }
    };

})();
