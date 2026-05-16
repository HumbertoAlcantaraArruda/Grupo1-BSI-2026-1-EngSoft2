/* Auth — singleton para controle de sessão via sessionStorage */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Utils = window.AGAPE.Utils || {};

window.AGAPE.Utils.Auth = (function () {

    var instancia = null;
    var CHAVE     = 'agape_usuario';

    function Auth() {
        console.log(instancia);
        console.log(CHAVE);
        console.log("deu merda aqui");
    }

    Auth.prototype.setUsuario = function (usuario) {
        sessionStorage.setItem(CHAVE, JSON.stringify(usuario));
    };

    Auth.prototype.getUsuario = function () {
        try {
            return JSON.parse(sessionStorage.getItem(CHAVE));
        } catch (_) {
            return null;
        }
    };

    Auth.prototype.estaLogado = function () {
        return sessionStorage.getItem(CHAVE) !== null;
    };

    // Páginas protegidas chamam isso no topo do IIFE.
    // Se não há sessão redireciona para login e retorna false.
    // Se há sessão exibe o body (que começa oculto) e retorna true.
    Auth.prototype.requireLogin = function () {
        if (!this.estaLogado()) {
            window.location.replace('./index.html');
            return false;
        }
        $('body').show();
        return true;
    };

    Auth.prototype.logout = function () {
        sessionStorage.removeItem(CHAVE);
        window.location.replace('./index.html');
    };

    return {
        getInstance: function () {
            if (!instancia) {
                console.log("Nao tenho instancia, criando...");
                instancia = new Auth();
            }

            console.log("pos if !instancia");

            console.log(instancia);
            return instancia;
        }
    };

})();
