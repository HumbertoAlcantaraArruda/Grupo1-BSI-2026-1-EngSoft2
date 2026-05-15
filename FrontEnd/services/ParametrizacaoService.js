/* ParametrizacaoService — chamadas HTTP para /parametrizacao */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Services = window.AGAPE.Services || {};

window.AGAPE.Services.ParametrizacaoService = (function () {

    var instancia = null;

    function ParametrizacaoService() {
        this._http = window.AGAPE.Utils.HttpClient.getInstance();
    }

    ParametrizacaoService.prototype.buscar = async function () {
        return await this._http.get('/parametrizacao');
    };

    ParametrizacaoService.prototype.salvar = async function (parametrizacao) {
        return await this._http.post('/parametrizacao', parametrizacao.paraFormData());
    };

    // Logos enviados como JSON com base64 para /parametrizacao/logo
    ParametrizacaoService.prototype.atualizarLogos = async function (dadosLogo) {
        return await this._http.postJson('/parametrizacao/logo', dadosLogo);
    };

    return {
        getInstance: function () {
            if (!instancia) instancia = new ParametrizacaoService();
            return instancia;
        }
    };

})();
