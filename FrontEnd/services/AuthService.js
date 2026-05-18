/* AuthService — chamadas HTTP para autenticação de usuário */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Services = window.AGAPE.Services || {};

window.AGAPE.Services.AuthService = (function () {

    var instancia = null;

    function AuthService() {
        this._http = window.AGAPE.Utils.HttpClient.getInstance();
    }

    AuthService.prototype.login = async function (email, senha) {
        return await this._http.post('/login', { email: email, senha: senha });
    };

    AuthService.prototype.trocarSenha = async function (email, senhaAtual, novaSenha) {
        return await this._http.post('/trocarSenha', {
            email:      email,
            senhaAtual: senhaAtual,
            novaSenha:  novaSenha
        });
    };

    return {
        getInstance: function () {
            if (!instancia) instancia = new AuthService();
            return instancia;
        }
    };

})();
