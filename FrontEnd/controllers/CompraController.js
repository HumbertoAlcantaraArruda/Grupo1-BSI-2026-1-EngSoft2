/* CompraController — fachada do caso de uso Efetuar Compra */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Controllers = window.AGAPE.Controllers || {};

window.AGAPE.Controllers.CompraController = (function () {

    var instancia = null;

    function CompraController() {
        this._compraService      = window.AGAPE.Services.CompraService.getInstance();
        this._fornecedorService  = window.AGAPE.Services.FornecedorService.getInstance();
        this._produtoService     = window.AGAPE.Services.ProdutoService.getInstance();
    }

    CompraController.prototype.carregarFornecedores = async function () {
        return await this._fornecedorService.listar();
    };

    CompraController.prototype.carregarProdutos = async function () {
        return await this._produtoService.listar();
    };

    CompraController.prototype.efetuarCompra = async function (dados) {
        if (!dados.idFornecedor) {
            return { status: 'error', erro: 'Selecione um fornecedor.' };
        }
        if (!dados.idUsuario) {
            return { status: 'error', erro: 'Usuário não autenticado.' };
        }
        if (!dados.idProdutos || dados.idProdutos.trim() === '') {
            return { status: 'error', erro: 'Adicione pelo menos um produto à compra.' };
        }
        return await this._compraService.efetuarCompra(dados);
    };

    return {
        getInstance: function () {
            if (!instancia) instancia = new CompraController();
            return instancia;
        }
    };

})();
