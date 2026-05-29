/* DevolucaoService — chamadas HTTP do caso de uso Realizar Devolução (RF_F8) */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Services = window.AGAPE.Services || {};

window.AGAPE.Services.DevolucaoService = (function () {

    var instancia = null;

    function DevolucaoService() {
        this._http = window.AGAPE.Utils.HttpClient.getInstance();
    }

    /** Lista vendas (reusa /venda) para o Select2 de seleção de venda. */
    DevolucaoService.prototype.listarVendas = async function (filtros) {
        return await this._http.get('/venda', filtros || {});
    };

    /** Busca uma venda + seus itens para montar a seleção de devolução. */
    DevolucaoService.prototype.buscarVenda = async function (idVenda) {
        return await this._http.get('/devolucao', { idVenda: idVenda });
    };

    /** Envia a devolução para registro transacional no backend. */
    DevolucaoService.prototype.realizar = async function (dados) {
        return await this._http.post('/devolucao', dados);
    };

    return {
        getInstance: function () {
            if (!instancia) instancia = new DevolucaoService();
            return instancia;
        }
    };

})();
