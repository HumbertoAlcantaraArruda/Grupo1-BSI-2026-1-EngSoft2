/* ProdutosController — fachada do caso de uso Produtos */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Controllers = window.AGAPE.Controllers || {};

window.AGAPE.Controllers.ProdutosController = (function () {

    var instancia = null;

    function ProdutosController() {
        this._service   = window.AGAPE.Services.ProdutoService.getInstance();
        this._validador = window.AGAPE.Utils.Validador.getInstance();
    }

    ProdutosController.prototype.listar = async function () {
        return await this._service.listar();
    };

    // Envia apenas os filtros preenchidos; operador exige quantidade e vice-versa
    ProdutosController.prototype.filtrar = async function (filtros) {
        var params = {};

        if (filtros.nome && filtros.nome.trim() !== '') {
            params.nome = filtros.nome.trim();
        }
        if (filtros.idCatProd && filtros.idCatProd !== '') {
            params.idCatProd = filtros.idCatProd;
        }
        if (filtros.operador && filtros.operador !== '' &&
            filtros.quantidade !== undefined && filtros.quantidade !== '') {
            params.operador   = filtros.operador;
            params.quantidade = filtros.quantidade;
        }

        return await this._service.listar(params);
    };

    ProdutosController.prototype.cadastrar = async function (dados) {
        var produto = new window.AGAPE.Models.Produto(dados);
        var erros   = produto.validar();
        if (erros.length > 0) return { status: 'error', erro: erros.join(' ') };
        return await this._service.cadastrar(produto);
    };

    ProdutosController.prototype.alterar = async function (dados) {
        var produto = new window.AGAPE.Models.Produto(dados);
        var erros   = produto.validar();
        if (erros.length > 0) return { status: 'error', erro: erros.join(' ') };
        return await this._service.alterar(produto);
    };

    ProdutosController.prototype.excluir = async function (idProd) {
        if (!idProd) return { status: 'error', erro: 'ID do produto não informado.' };
        return await this._service.excluir(idProd);
    };

    ProdutosController.prototype.carregarCategorias = async function () {
        return await this._service.listarCategorias();
    };

    return {
        getInstance: function () {
            if (!instancia) instancia = new ProdutosController();
            return instancia;
        }
    };

})();
