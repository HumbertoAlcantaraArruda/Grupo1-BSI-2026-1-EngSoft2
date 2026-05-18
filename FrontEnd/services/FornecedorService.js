/* FornecedorService — chamadas HTTP para /fornecedor */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Services = window.AGAPE.Services || {};

window.AGAPE.Services.FornecedorService = (function () {

    var instancia = null;

    function FornecedorService() {
        this._http = window.AGAPE.Utils.HttpClient.getInstance();
    }

    FornecedorService.prototype.listar = async function (filtros) {
        return await this._http.get('/fornecedor', filtros || {});
    };

    FornecedorService.prototype.cadastrar = async function (fornecedor) {
        return await this._http.post('/fornecedor', fornecedor.paraFormData());
    };

    FornecedorService.prototype.alterar = async function (fornecedor) {
        return await this._http.put('/fornecedor', fornecedor.paraFormData());
    };

    FornecedorService.prototype.excluir = async function (idFornec) {
        return await this._http.delete('/fornecedor', { idFornec: idFornec });
    };

    return {
        getInstance: function () {
            if (!instancia) instancia = new FornecedorService();
            return instancia;
        }
    };

})();
