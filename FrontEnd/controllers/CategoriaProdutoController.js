/* CategoriaProdutoController — fachada do caso de uso CategoriaProduto
   A API não aceita filtros via query; filtragem é feita localmente sobre _listaCache */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Controllers = window.AGAPE.Controllers || {};

window.AGAPE.Controllers.CategoriaProdutoController = (function () {

    var instancia = null;

    function CategoriaProdutoController() {
        this._service    = window.AGAPE.Services.CategoriaProdutoService.getInstance();
        this._validador  = window.AGAPE.Utils.Validador.getInstance();
        this._listaCache = [];
    }

    // Armazena resultado no cache para uso posterior em filtrar()
    CategoriaProdutoController.prototype.listar = async function () {
        var resultado = await this._service.listar();
        if (resultado.status === 'ok' && Array.isArray(resultado.dados)) {
            this._listaCache = resultado.dados;
        }
        return resultado;
    };

    // filtros.status: 'ativo' | 'inativo' | '' (todos)
    CategoriaProdutoController.prototype.filtrar = function (filtros) {
        var lista = this._listaCache;

        if (filtros.nome && filtros.nome.trim() !== '') {
            var termo = filtros.nome.trim().toLowerCase();
            lista = lista.filter(function (c) {
                return c.nome && c.nome.toLowerCase().indexOf(termo) !== -1;
            });
        }

        if (filtros.status === 'ativo') {
            lista = lista.filter(function (c) {
                return c.ativo === true || c.ativo === 1 || c.ativo === 'true';
            });
        } else if (filtros.status === 'inativo') {
            lista = lista.filter(function (c) {
                return c.ativo === false || c.ativo === 0 || c.ativo === 'false';
            });
        }

        return { status: 'ok', dados: lista };
    };

    CategoriaProdutoController.prototype.cadastrar = async function (dados) {
        var categoria = new window.AGAPE.Models.CategoriaProduto(dados);
        var erros     = categoria.validar();
        if (erros.length > 0) return { status: 'error', erro: erros.join(' ') };
        return await this._service.cadastrar(categoria);
    };

    CategoriaProdutoController.prototype.alterar = async function (dados) {
        var categoria = new window.AGAPE.Models.CategoriaProduto(dados);
        var erros     = categoria.validar();
        if (erros.length > 0) return { status: 'error', erro: erros.join(' ') };
        return await this._service.alterar(categoria);
    };

    CategoriaProdutoController.prototype.excluir = async function (idCatProd) {
        if (!idCatProd) return { status: 'error', erro: 'ID da categoria não informado.' };
        return await this._service.excluir(idCatProd);
    };

    return {
        getInstance: function () {
            if (!instancia) instancia = new CategoriaProdutoController();
            return instancia;
        }
    };

})();
