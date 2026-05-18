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

        if (resultado.status === 'ok' && resultado.dados) {
            if (resultado.dados.primeiroAcesso === 1) {
                sessionStorage.setItem('agape_primeiro_acesso_email', resultado.dados.email || email.trim());
                return { status: 'primeiroAcesso' };
            }
            if (resultado.dados.token) {
                this._auth.setSessao(resultado.dados.token, resultado.dados.usuario);

                if (resultado.dados.usuario && resultado.dados.usuario.nivel === 'ADM') {
                    var pendente = await this._checarParamPendente();
                    if (pendente) {
                        sessionStorage.setItem('agape_param_pendente', '1');
                        return { status: 'parametrizacaoPendente' };
                    } else {
                        sessionStorage.removeItem('agape_param_pendente');
                    }
                }
            }
        }

        return resultado;
    };

    AuthController.prototype._checarParamPendente = async function () {
        try {
            var svc = window.AGAPE.Services.ParametrizacaoService
                ? window.AGAPE.Services.ParametrizacaoService.getInstance()
                : null;
            if (!svc) return false;
            var r = await svc.buscar();
            if (r.status !== 'ok' || !r.dados) return true;
            return !r.dados.razaoSocial || r.dados.razaoSocial.trim() === '';
        } catch (_) {
            return false;
        }
    };

    AuthController.prototype.trocarSenha = async function (email, senhaAtual, novaSenha) {
        if (!email || !senhaAtual || !novaSenha)
            return { status: 'error', erro: 'Todos os campos são obrigatórios.' };
        if (novaSenha.length < 8)
            return { status: 'error', erro: 'A nova senha deve ter pelo menos 8 caracteres.' };
        if (novaSenha === senhaAtual)
            return { status: 'error', erro: 'A nova senha deve ser diferente da senha atual.' };

        var resultado = await this._service.trocarSenha(email, senhaAtual, novaSenha);

        if (resultado.status === 'ok' && resultado.dados && resultado.dados.token) {
            sessionStorage.removeItem('agape_primeiro_acesso_email');
            this._auth.setSessao(resultado.dados.token, resultado.dados.usuario);
        }

        return resultado;
    };

    AuthController.prototype.carregarLogo = async function () {
        return await window.AGAPE.Services.ParametrizacaoService.getInstance().buscar();
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
