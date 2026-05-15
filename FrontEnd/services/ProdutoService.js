/* ProdutoService — chamadas HTTP para /produto */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Services = window.AGAPE.Services || {};

window.AGAPE.Services.ProdutoService = (function () {

    var instancia = null;

    function ProdutoService() {
        this._http = window.AGAPE.Utils.HttpClient.getInstance();
    }

    // filtros: { nome?, idCatProd?, operador?, quantidade? }
    ProdutoService.prototype.listar = async function (filtros) {
        return await this._http.get('/produto', filtros || {});
    };

    ProdutoService.prototype.cadastrar = async function (produto) {
        return await this._http.post('/produto', produto.paraFormData());
    };

    ProdutoService.prototype.alterar = async function (produto) {
        return await this._http.put('/produto', produto.paraFormData());
    };

    ProdutoService.prototype.excluir = async function (idProd) {
        return await this._http.delete('/produto', { idProd: idProd });
    };

    // Carrega categorias para popular os selects da tela de Produtos
    ProdutoService.prototype.listarCategorias = async function () {
        return await this._http.get('/categoriaProduto');
    };

    return {
        getInstance: function () {
            if (!instancia) instancia = new ProdutoService();
            return instancia;
        }
    };

})();
