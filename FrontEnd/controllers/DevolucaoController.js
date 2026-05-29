/**
 * DevolucaoController — Facade frontend do caso de uso "Realizar Devolução" (RF_F8).
 *
 * GOF Facade        — interface única para buscar venda, gerenciar itens a devolver
 *                     e finalizar a devolução.
 * GOF Singleton     — uma única instância por sessão.
 * Controller (GRASP) — coordena view e serviço sem conhecer HTML.
 * SRP (SOLID)       — só cuida do estado/regra da devolução no cliente; HTTP fica no Service.
 */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Controllers = window.AGAPE.Controllers || {};

window.AGAPE.Controllers.DevolucaoController = (function () {

    var instancia = null;

    function DevolucaoController() {
        this._service = window.AGAPE.Services.DevolucaoService.getInstance();
        this._estado  = _estadoInicial();
    }

    /**
     * Estado de uma devolução em andamento.
     * itens: [{ idProd, nome, valorUni, qtdVendida, qtdDevolver }]
     */
    function _estadoInicial() {
        return {
            venda:          null,   // { idVenda, nomeParoquiano, idUsuario, ... }
            itens:          [],
            reincorporaEst: true
        };
    }

    // ── Busca de vendas (Select2) ─────────────────────────────────────────────

    DevolucaoController.prototype.listarVendas = async function (filtros) {
        return await this._service.listarVendas(filtros || {});
    };

    // ── Fluxo 1-2: Buscar venda + itens ───────────────────────────────────────

    DevolucaoController.prototype.buscarVenda = async function (idVenda) {
        var resultado = await this._service.buscarVenda(idVenda);
        if (resultado.status !== 'ok' || !resultado.dados) {
            return { ok: false, erro: resultado.erro || 'Venda não encontrada.' };
        }

        var dados = resultado.dados;
        var venda = dados.venda;
        var itens = Array.isArray(dados.itens) ? dados.itens : [];

        this._estado = _estadoInicial();
        this._estado.venda = venda;

        // Information Expert — o Controller monta a lista de itens devolvíveis
        this._estado.itens = itens.map(function (it) {
            return {
                idProd:      it.idProd,
                nome:        it.nomeProduto || ('Produto ' + it.idProd),
                valorUni:    parseFloat(it.valorUnitario) || 0,
                qtdVendida:  parseInt(it.quantidade, 10) || 0,
                qtdDevolver: 0
            };
        });

        return { ok: true, venda: venda, itens: this._estado.itens };
    };

    // ── Fluxo 4: Seleção / quantidade ─────────────────────────────────────────

    /**
     * Define a quantidade a devolver de um item, validando 0 <= qtd <= qtdVendida
     * (Fluxo 4.1). Information Expert — o Controller conhece os limites.
     */
    DevolucaoController.prototype.definirQuantidade = function (idProd, qtd) {
        qtd = parseInt(qtd, 10);
        if (isNaN(qtd) || qtd < 0) qtd = 0;

        var item = this._itemPorProd(idProd);
        if (!item) return { ok: false, erro: 'Item não encontrado.' };

        if (qtd > item.qtdVendida) {
            item.qtdDevolver = item.qtdVendida;
            return {
                ok: false,
                erro: 'Máximo devolvível de "' + item.nome + '": ' + item.qtdVendida + '.',
                ajustado: item.qtdVendida
            };
        }

        item.qtdDevolver = qtd;
        return { ok: true };
    };

    DevolucaoController.prototype.definirReincorpora = function (valor) {
        this._estado.reincorporaEst = !!valor;
    };

    // ── Cálculos em tempo real ────────────────────────────────────────────────

    /** Total de um item = valorUni × qtdDevolver. */
    DevolucaoController.prototype.totalItem = function (idProd) {
        var item = this._itemPorProd(idProd);
        if (!item) return 0;
        return +(item.valorUni * item.qtdDevolver).toFixed(2);
    };

    /** Valor total da devolução (somatório dos itens selecionados). */
    DevolucaoController.prototype.totalDevolucao = function () {
        return +this._estado.itens.reduce(function (s, it) {
            return s + it.valorUni * it.qtdDevolver;
        }, 0).toFixed(2);
    };

    /** Há pelo menos um item com quantidade a devolver? (ativa o Guardião) */
    DevolucaoController.prototype.temItensSelecionados = function () {
        return this._estado.itens.some(function (it) { return it.qtdDevolver > 0; });
    };

    DevolucaoController.prototype.podeFinalizar = function () {
        return this._estado.venda !== null && this.temItensSelecionados();
    };

    // ── Fluxo 8: Finalizar ────────────────────────────────────────────────────

    DevolucaoController.prototype.finalizar = async function () {
        if (!this.podeFinalizar()) {
            return { status: 'error', erro: 'Selecione ao menos um produto e a quantidade a devolver.' };
        }

        var selecionados = this._estado.itens.filter(function (it) { return it.qtdDevolver > 0; });

        var dados = {
            idVenda:          this._estado.venda.idVenda,
            idsProdutos:      selecionados.map(function (i) { return i.idProd; }).join(','),
            quantidades:      selecionados.map(function (i) { return i.qtdDevolver; }).join(','),
            valoresUnitarios: selecionados.map(function (i) { return i.valorUni.toFixed(2); }).join(','),
            reincorporaEst:   this._estado.reincorporaEst ? '1' : '0'
        };

        return await this._service.realizar(dados);
    };

    // ── Acesso ao estado ──────────────────────────────────────────────────────

    DevolucaoController.prototype.getEstado = function () { return this._estado; };
    DevolucaoController.prototype.resetar   = function () { this._estado = _estadoInicial(); };

    DevolucaoController.prototype._itemPorProd = function (idProd) {
        idProd = parseInt(idProd, 10);
        return this._estado.itens.find(function (it) { return it.idProd === idProd; }) || null;
    };

    return {
        getInstance: function () {
            if (!instancia) instancia = new DevolucaoController();
            return instancia;
        }
    };

})();
