/* AuthController — validação de credenciais e delegação ao AuthService */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Controllers = window.AGAPE.Controllers || {};

window.AGAPE.Controllers.AuthController = (function () {

    var instancia = null;

    function AuthController() {
        this._service = window.AGAPE.Services.AuthService.getInstance();
        this._auth    = window.AGAPE.Utils.Auth.getInstance();
    }

    AuthController.prototype.login = async function (email, senha) {
        if (!email || email.trim() === '') {
            return { status: 'error', erro: 'Informe o e-mail.' };
        }
        if (!senha || senha.trim() === '') {
            return { status: 'error', erro: 'Informe a senha.' };
        }

        var resultado = await this._service.login(email.trim(), senha);

        //var resultado = await window.AGAPE.Services.AuthService.getInstance().login(email, senha);

        console.log("Sessao dentro de authController", resultado);

        if (resultado.status === 'ok' && resultado.dados && resultado.dados.token) {
            this._auth.setSessao(resultado.dados.token, resultado.dados.usuario);
        }

        return resultado;
    };

    AuthController.prototype.logout = function () {
        this._auth.logout();
    };

    return {
        getInstance: function () {
            if (!instancia) instancia = new AuthController();
            return instancia;
        }
    };

})();
