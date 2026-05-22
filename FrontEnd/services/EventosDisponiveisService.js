/* EventosDisponiveisService — chamadas HTTP para /eventosDisponiveis */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Services = window.AGAPE.Services || {};

window.AGAPE.Services.EventosDisponiveisService = (function () {

    var instancia = null;

    function EventosDisponiveisService() {
        this._http = window.AGAPE.Utils.HttpClient.getInstance();
    }

    /** Lista eventos com período de inscrição ativo. */
    EventosDisponiveisService.prototype.listar = async function () {
        return await this._http.get('/eventosDisponiveis', {});
    };

    /** Inscreve o usuário logado no evento. */
    EventosDisponiveisService.prototype.inscrever = async function (idEvento) {
        return await this._http.postJson('/eventosDisponiveis', { idEvento: idEvento });
    };

    /** Cancela a inscrição do usuário logado no evento. */
    EventosDisponiveisService.prototype.cancelar = async function (idEvento) {
        return await this._http.delete('/eventosDisponiveis', { idEvento: idEvento });
    };

    return {
        getInstance: function () {
            if (!instancia) instancia = new EventosDisponiveisService();
            return instancia;
        }
    };

})();
