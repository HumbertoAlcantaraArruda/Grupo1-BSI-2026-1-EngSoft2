/* CaixaService — chamadas HTTP para RF_F4 Abrir, RF_F5 Atualizar e RF_F6 Fechar Caixa */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Services = window.AGAPE.Services || {};

window.AGAPE.Services.CaixaService = (function () {

    var instancia = null;

    function CaixaService() {
        this._http = window.AGAPE.Utils.HttpClient.getInstance();
    }

    /** RF_F4 — Consulta o caixa aberto do operador autenticado. */
    CaixaService.prototype.consultarAberto = async function () {
        return await this._http.get('/caixa');
    };

    /** RF_F4 — Abre um novo caixa com o valor inicial informado. */
    CaixaService.prototype.abrir = async function (valorInicial) {
        return await this._http.post('/caixa/abrir', { valorInicial: valorInicial });
    };

    /** RF_F5 — Registra um Suprimento ou Sangria no caixa aberto.
     *  @param {string} tipo   'SUPRIMENTO' | 'SANGRIA'
     *  @param {number} valor  Valor positivo
     *  @param {string} motivo Descrição da movimentação
     */
    CaixaService.prototype.atualizar = async function (tipo, valor, motivo) {
        return await this._http.post('/caixa/atualizar', {
            tipo:   tipo,
            valor:  valor,
            motivo: motivo
        });
    };

    /** RF_F6 — Fecha o caixa aberto e recebe o resumo consolidado. */
    CaixaService.prototype.fechar = async function () {
        return await this._http.post('/caixa/fechar', {});
    };

    return {
        getInstance: function () {
            if (!instancia) instancia = new CaixaService();
            return instancia;
        }
    };

})();
