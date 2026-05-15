/* CategoriaEventoService — chamadas HTTP para /categoriaEvento
   Filtros suportados pela rota GET: ?nome= e ?ativo=true|false */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Services = window.AGAPE.Services || {};

window.AGAPE.Services.CategoriaEventoService = (function () {

    var instancia = null;

    function CategoriaEventoService() {
        this._http = window.AGAPE.Utils.HttpClient.getInstance();
    }

    CategoriaEventoService.prototype.listar = async function (filtros) {
        return await this._http.get('/categoriaEvento', filtros || {});
    };

    // POST envia apenas nome (sem ativo), conforme a rota de cadastro
    CategoriaEventoService.prototype.cadastrar = async function (categoria) {
        return await this._http.post('/categoriaEvento', categoria.paraFormDataCadastro());
    };

    CategoriaEventoService.prototype.alterar = async function (categoria) {
        return await this._http.put('/categoriaEvento', categoria.paraFormData());
    };

    CategoriaEventoService.prototype.excluir = async function (id) {
        return await this._http.delete('/categoriaEvento', { idCatEvento: id });
    };

    return {
        getInstance: function () {
            if (!instancia) instancia = new CategoriaEventoService();
            return instancia;
        }
    };

})();
