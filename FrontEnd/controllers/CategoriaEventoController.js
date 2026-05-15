/* CategoriaEventoController — fachada do caso de uso CategoriaEvento
   Filtros nome e ativo são enviados à API como query params */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Controllers = window.AGAPE.Controllers || {};

window.AGAPE.Controllers.CategoriaEventoController = (function () {

    var instancia = null;

    function CategoriaEventoController() {
        this._service   = window.AGAPE.Services.CategoriaEventoService.getInstance();
        this._validador = window.AGAPE.Utils.Validador.getInstance();
    }

    CategoriaEventoController.prototype.listar = async function () {
        return await this._service.listar();
    };

    // ativo: 'true' | 'false' | '' (omitido — lista todos)
    CategoriaEventoController.prototype.filtrar = async function (filtros) {
        var params = {};
        if (filtros.nome && filtros.nome.trim() !== '') params.nome  = filtros.nome.trim();
        if (filtros.ativo === 'true' || filtros.ativo === 'false')   params.ativo = filtros.ativo;
        return await this._service.listar(params);
    };

    CategoriaEventoController.prototype.cadastrar = async function (dados) {
        var categoria = new window.AGAPE.Models.CategoriaEvento(dados);
        var erros     = categoria.validar();
        if (erros.length > 0) return { status: 'error', erro: erros.join(' ') };
        return await this._service.cadastrar(categoria);
    };

    CategoriaEventoController.prototype.alterar = async function (dados) {
        var categoria = new window.AGAPE.Models.CategoriaEvento(dados);
        var erros     = categoria.validar();
        if (erros.length > 0) return { status: 'error', erro: erros.join(' ') };
        return await this._service.alterar(categoria);
    };

    CategoriaEventoController.prototype.excluir = async function (id) {
        if (!id) return { status: 'error', erro: 'ID da categoria não informado.' };
        return await this._service.excluir(id);
    };

    return {
        getInstance: function () {
            if (!instancia) instancia = new CategoriaEventoController();
            return instancia;
        }
    };

})();
