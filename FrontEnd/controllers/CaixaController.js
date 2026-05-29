/* CaixaController — fachada dos casos de uso RF_F4, RF_F5 e RF_F6 */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Controllers = window.AGAPE.Controllers || {};

window.AGAPE.Controllers.CaixaController = (function () {

    var instancia = null;

    function CaixaController() {
        this._service   = window.AGAPE.Services.CaixaService.getInstance();
        this._caixaAtual = null; // { idCaixa, valorInicial, valorFinal, dataHoraAbertura }
    }

    /** Retorna o caixa em memória (pode ser null). */
    CaixaController.prototype.getCaixaAtual = function () {
        return this._caixaAtual;
    };

    // ── RF_F4 – Consultar caixa aberto ───────────────────────────────────────

    /** Consulta o backend e armazena o caixa aberto, se houver. */
    CaixaController.prototype.consultarAberto = async function () {
        var resultado = await this._service.consultarAberto();
        if (resultado.status === 'ok') {
            this._caixaAtual = resultado.dados;
        } else {
            this._caixaAtual = null;
        }
        return resultado;
    };

    // ── RF_F4 – Abrir Caixa ──────────────────────────────────────────────────

    CaixaController.prototype.abrir = async function (valorInicialStr) {
        var valor = _parseValor(valorInicialStr);

        if (isNaN(valor) || valor < 0) {
            return { status: 'error', erro: 'O valor inicial deve ser um número maior ou igual a zero.' };
        }

        var resultado = await this._service.abrir(valor);
        if (resultado.status === 'ok') {
            this._caixaAtual = resultado.dados;
        }
        return resultado;
    };

    // ── RF_F5 – Atualizar Caixa (Suprimento / Sangria) ───────────────────────

    CaixaController.prototype.atualizar = async function (tipo, valorStr, motivo) {
        tipo   = (tipo || '').trim().toUpperCase();
        motivo = (motivo || '').trim();

        if (tipo !== 'SUPRIMENTO' && tipo !== 'SANGRIA') {
            return { status: 'error', erro: 'Selecione o tipo: Suprimento ou Sangria.' };
        }

        var valor = _parseValor(valorStr);
        if (isNaN(valor) || valor <= 0) {
            return { status: 'error', erro: 'O valor deve ser maior que zero.' };
        }

        if (!motivo) {
            return { status: 'error', erro: 'O motivo da movimentação é obrigatório.' };
        }

        return await this._service.atualizar(tipo, valor, motivo);
    };

    // ── RF_F6 – Fechar Caixa ─────────────────────────────────────────────────

    CaixaController.prototype.fechar = async function () {
        var resultado = await this._service.fechar();
        if (resultado.status === 'ok') {
            this._caixaAtual = null;
        }
        return resultado;
    };

    // ── Auxiliar ─────────────────────────────────────────────────────────────

    function _parseValor(str) {
        if (str === null || str === undefined || String(str).trim() === '') return NaN;
        // Aceita tanto "1234.56" quanto "1.234,56"
        var limpo = String(str).trim().replace(/\./g, '').replace(',', '.');
        return parseFloat(limpo);
    }

    return {
        getInstance: function () {
            if (!instancia) instancia = new CaixaController();
            return instancia;
        }
    };

})();
