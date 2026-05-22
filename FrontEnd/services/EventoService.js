/* EventoService — chamadas HTTP para /evento */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Services = window.AGAPE.Services || {};

window.AGAPE.Services.EventoService = (function () {

    var instancia = null;

    function EventoService() {
        this._http = window.AGAPE.Utils.HttpClient.getInstance();
    }

    EventoService.prototype.listar = async function (filtros) {
        return await this._http.get('/evento', filtros || {});
    };

    EventoService.prototype.cadastrar = async function (evento) {
        return await this._http.post('/evento', evento.paraFormData());
    };

    EventoService.prototype.alterar = async function (evento) {
        return await this._http.put('/evento', evento.paraFormData());
    };

    EventoService.prototype.excluir = async function (idEvento) {
        return await this._http.delete('/evento', { idEvento: idEvento });
    };

    return {
        getInstance: function () {
            if (!instancia) instancia = new EventoService();
            return instancia;
        }
    };

})();
