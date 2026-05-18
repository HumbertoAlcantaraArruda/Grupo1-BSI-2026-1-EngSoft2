/* FormaPagamentoService — chamadas HTTP para /formaPagamento */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Services = window.AGAPE.Services || {};

window.AGAPE.Services.FormaPagamentoService = (function () {

    var instancia = null;

    function FormaPagamentoService() {
        this._http = window.AGAPE.Utils.HttpClient.getInstance();
    }

    // filtros: { descricao?, ativo? }
    FormaPagamentoService.prototype.listar = async function (filtros) {
        return await this._http.get('/formaPagamento', filtros || {});
    };

    FormaPagamentoService.prototype.cadastrar = async function (forma) {
        return await this._http.post('/formaPagamento', forma.paraFormDataCadastro());
    };

    FormaPagamentoService.prototype.alterar = async function (forma) {
        return await this._http.put('/formaPagamento', forma.paraFormData());
    };

    FormaPagamentoService.prototype.excluir = async function (idFormaPag) {
        return await this._http.delete('/formaPagamento', { idFormaPag: idFormaPag });
    };

    return {
        getInstance: function () {
            if (!instancia) instancia = new FormaPagamentoService();
            return instancia;
        }
    };

})();
