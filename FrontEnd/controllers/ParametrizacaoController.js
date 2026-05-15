/* ParametrizacaoController — fachada do caso de uso Parametrizacao */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Controllers = window.AGAPE.Controllers || {};

window.AGAPE.Controllers.ParametrizacaoController = (function () {

    var instancia = null;

    function ParametrizacaoController() {
        this._service   = window.AGAPE.Services.ParametrizacaoService.getInstance();
        this._validador = window.AGAPE.Utils.Validador.getInstance();
    }

    ParametrizacaoController.prototype.carregar = async function () {
        return await this._service.buscar();
    };

    ParametrizacaoController.prototype.salvar = async function (dados) {
        var p     = new window.AGAPE.Models.Parametrizacao(dados);
        var erros = p.validar();
        if (erros.length > 0) return { status: 'error', erro: erros.join(' ') };
        return await this._service.salvar(p);
    };

    // dadosLogo: { logoBase64?, nomeLogoGrande?, logoHBase64?, nomeLogoPequeno? }
    ParametrizacaoController.prototype.atualizarLogos = async function (dadosLogo) {
        if (!dadosLogo.logoBase64 && !dadosLogo.logoHBase64) {
            return { status: 'error', erro: 'Nenhum arquivo de logotipo selecionado.' };
        }
        return await this._service.atualizarLogos(dadosLogo);
    };

    return {
        getInstance: function () {
            if (!instancia) instancia = new ParametrizacaoController();
            return instancia;
        }
    };

})();
