/* Auth — singleton para controle de sessão via sessionStorage */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Utils = window.AGAPE.Utils || {};

window.AGAPE.Utils.Auth = (function () {

    var instancia = null;
    var CHAVE     = 'agape_sessao';

    function Auth() {}

    Auth.prototype.setSessao = function (token, usuario) {
        if (!token) {
            this.logout(false);
            return;
        }

        sessionStorage.setItem(CHAVE, JSON.stringify({
            token: token,
            usuario: usuario || null
        }));
    };

    Auth.prototype.setUsuario = function (usuario) {
        var sessao = this.getSessao() || {};
        sessao.usuario = usuario || null;
        sessionStorage.setItem(CHAVE, JSON.stringify(sessao));
    };

    Auth.prototype.getSessao = function () {
        try {
            return JSON.parse(sessionStorage.getItem(CHAVE));
        } catch (_) {
            return null;
        }
    };

    Auth.prototype.getToken = function () {
        var sessao = this.getSessao();
        return sessao && sessao.token ? sessao.token : null;
    };

    Auth.prototype.getUsuario = function () {
        var sessao = this.getSessao();
        return sessao && sessao.usuario ? sessao.usuario : null;
    };

    Auth.prototype.estaLogado = function () {
        return !!this.getToken();
    };

    // Páginas protegidas chamam isso no topo do IIFE.
    // Se não há sessão redireciona para login e retorna false.
    // Se há sessão exibe o body (que começa oculto) e retorna true.
    Auth.prototype.requireLogin = function () {
        if (!this.estaLogado()) {
            window.location.replace('../index.html');
            return false;
        }
        $('body').show();
        return true;
    };

    Auth.prototype.logout = function (redirecionar) {
        sessionStorage.removeItem(CHAVE);
        if (redirecionar !== false) {
            window.location.replace('../index.html');
        }
    };

    return {
        getInstance: function () {
            if (!instancia) {
                instancia = new Auth();
            }
            return instancia;
        }
    };

})();
