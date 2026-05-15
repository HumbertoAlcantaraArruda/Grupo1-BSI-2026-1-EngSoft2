/* CategoriaProdutoService — chamadas HTTP para /categoriaProduto
   A rota GET não aceita filtros; filtragem é feita no frontend pelo Controller */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Services = window.AGAPE.Services || {};

window.AGAPE.Services.CategoriaProdutoService = (function () {

    var instancia = null;

    function CategoriaProdutoService() {
        this._http = window.AGAPE.Utils.HttpClient.getInstance();
    }

    CategoriaProdutoService.prototype.listar = async function () {
        return await this._http.get('/categoriaProduto');
    };

    CategoriaProdutoService.prototype.cadastrar = async function (categoria) {
        return await this._http.post('/categoriaProduto', categoria.paraFormData());
    };

    CategoriaProdutoService.prototype.alterar = async function (categoria) {
        return await this._http.put('/categoriaProduto', categoria.paraFormData());
    };

    CategoriaProdutoService.prototype.excluir = async function (idCatProd) {
        return await this._http.delete('/categoriaProduto', { idCatProd: idCatProd });
    };

    return {
        getInstance: function () {
            if (!instancia) instancia = new CategoriaProdutoService();
            return instancia;
        }
    };

})();
