/* UsuarioController — fachada do caso de uso Usuario */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Controllers = window.AGAPE.Controllers || {};

window.AGAPE.Controllers.UsuarioController = (function () {

    var instancia = null;

    function UsuarioController() {
        this._service    = window.AGAPE.Services.UsuarioService.getInstance();
        this._listaCache = [];
    }

    UsuarioController.prototype.listar = async function () {
        var resultado = await this._service.listar();
        if (resultado.status === 'ok' && Array.isArray(resultado.dados)) {
            this._listaCache = resultado.dados;
        }
        return resultado;
    };

    UsuarioController.prototype.filtrar = function (filtros) {
        var lista = this._listaCache;

        if (filtros.nome && filtros.nome.trim() !== '') {
            var termo = filtros.nome.trim().toLowerCase();
            lista = lista.filter(function (u) {
                return u.nome && u.nome.toLowerCase().indexOf(termo) !== -1;
            });
        }

        if (filtros.nivel && filtros.nivel !== '') {
            lista = lista.filter(function (u) { return u.nivel === filtros.nivel; });
        }

        if (filtros.status === 'ativo') {
            lista = lista.filter(function (u) { return u.status === 1 || u.status === '1'; });
        } else if (filtros.status === 'inativo') {
            lista = lista.filter(function (u) { return u.status === 0 || u.status === '0'; });
        }

        return { status: 'ok', dados: lista };
    };

    UsuarioController.prototype.cadastrar = async function (dados) {
        var usuario = new window.AGAPE.Models.Usuario(dados);
        var erros   = usuario.validar(true);
        if (erros.length > 0) return { status: 'error', erro: erros.join(' ') };
        return await this._service.cadastrar(usuario);
    };

    UsuarioController.prototype.alterar = async function (dados) {
        var usuario = new window.AGAPE.Models.Usuario(dados);
        var erros   = usuario.validar(false);
        if (erros.length > 0) return { status: 'error', erro: erros.join(' ') };
        return await this._service.alterar(usuario);
    };

    UsuarioController.prototype.ativar = async function (id) {
        if (!id) return { status: 'error', erro: 'ID do usuário não informado.' };
        return await this._service.ativar(id);
    };

    UsuarioController.prototype.desativar = async function (id) {
        if (!id) return { status: 'error', erro: 'ID do usuário não informado.' };
        return await this._service.desativar(id);
    };

    UsuarioController.prototype.excluir = async function (id) {
        if (!id) return { status: 'error', erro: 'ID do usuário não informado.' };
        return await this._service.excluir(id);
    };

    UsuarioController.prototype.resetarSenha = async function (id) {
        if (!id) return { status: 'error', erro: 'ID do usuário não informado.' };
        return await this._service.resetarSenha(id);
    };

    return {
        getInstance: function () {
            if (!instancia) instancia = new UsuarioController();
            return instancia;
        }
    };

})();
