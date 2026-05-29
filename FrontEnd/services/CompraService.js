/* CompraService — chamadas HTTP para /comprar */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Services = window.AGAPE.Services || {};

window.AGAPE.Services.CompraService = (function () {

    var instancia = null;

    function CompraService() {
        this._http = window.AGAPE.Utils.HttpClient.getInstance();
    }

    // dadosCompra: { idFornecedor, idUsuario, valorTotal, idProdutos, quantidades, valoresUnitarios }
    CompraService.prototype.efetuarCompra = async function (dadosCompra) {
        return await this._http.post('/comprar', dadosCompra);
    };

    return {
        getInstance: function () {
            if (!instancia) instancia = new CompraService();
            return instancia;
        }
    };

})();
