/* UsuarioService — chamadas HTTP para /usuarios e /usuario */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Services = window.AGAPE.Services || {};

window.AGAPE.Services.UsuarioService = (function () {

    var instancia = null;

    function UsuarioService() {
        this._http = window.AGAPE.Utils.HttpClient.getInstance();
    }

    UsuarioService.prototype.listar = async function () {
        return await this._http.get('/usuarios');
    };

    UsuarioService.prototype.cadastrar = async function (usuario) {
        return await this._http.post('/usuarios', usuario.paraFormData(true));
    };

    UsuarioService.prototype.alterar = async function (usuario) {
        return await this._http.put('/usuario', usuario.paraFormData(false));
    };

    UsuarioService.prototype.ativar = async function (id) {
        return await this._http.post('/usuario/ativar', { id: id });
    };

    UsuarioService.prototype.desativar = async function (id) {
        return await this._http.post('/usuario/desativar', { id: id });
    };

    UsuarioService.prototype.excluir = async function (id) {
        return await this._http.delete('/usuario', { id: id });
    };

    return {
        getInstance: function () {
            if (!instancia) instancia = new UsuarioService();
            return instancia;
        }
    };

})();
