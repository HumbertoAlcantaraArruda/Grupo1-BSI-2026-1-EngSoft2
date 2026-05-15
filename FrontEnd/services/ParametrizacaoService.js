/* =====================================================================
   ParametrizacaoService — Camada de acesso a dados para Parametrizacao
   Padrão: Singleton (GOF)
   SOLID SRP: única responsabilidade — chamadas HTTP para /parametrizacao

   Interface IParametrizacaoService:
   ---------------------------------------------------------------
   buscar()               → Promise<{ status, dados?, erro? }>
   salvar(parametrizacao) → Promise<{ status, dados?, erro? }>
   atualizarLogos(dados)  → Promise<{ status, dados?, erro? }>
   ===================================================================== */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Services = window.AGAPE.Services || {};

window.AGAPE.Services.ParametrizacaoService = (function () {

    var instancia = null;

    function ParametrizacaoService() {
        this._http = window.AGAPE.Utils.HttpClient.getInstance();
    }

    /* ---- Buscar parametrização atual (GET) ------------------------- */
    ParametrizacaoService.prototype.buscar = async function () {
        return await this._http.get('/parametrizacao');
    };

    /* ---- Salvar parametrização (POST x-www-form-urlencoded) -------- */
    ParametrizacaoService.prototype.salvar = async function (parametrizacao) {
        return await this._http.post('/parametrizacao', parametrizacao.paraFormData());
    };

    /* ---- Atualizar logos (POST JSON com base64) -------------------- */
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
