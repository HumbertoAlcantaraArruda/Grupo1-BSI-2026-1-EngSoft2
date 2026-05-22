/* InscricaoService — chamadas HTTP para /realizarInscricao */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Services = window.AGAPE.Services || {};

window.AGAPE.Services.InscricaoService = (function () {

    var instancia = null;

    function InscricaoService() {
        this._http = window.AGAPE.Utils.HttpClient.getInstance();
    }

    /** Fluxo 2.1 — verifica paroquiano pelo CPF */
    InscricaoService.prototype.verificarCpf = async function (cpf) {
        return await this._http.get('/realizarInscricao', { cpf: cpf });
    };

    /** Confirma a inscrição (transacional no backend) */
    InscricaoService.prototype.confirmar = async function (inscricao) {
        return await this._http.postJson('/realizarInscricao', inscricao.paraJson());
    };

    return {
        getInstance: function () {
            if (!instancia) instancia = new InscricaoService();
            return instancia;
        }
    };

})();
