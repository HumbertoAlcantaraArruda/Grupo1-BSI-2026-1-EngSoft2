/* FornecedorController — fachada do caso de uso Fornecedor */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Controllers = window.AGAPE.Controllers || {};

window.AGAPE.Controllers.FornecedorController = (function () {

    var instancia = null;

    function FornecedorController() {
        this._service    = window.AGAPE.Services.FornecedorService.getInstance();
        this._validador  = window.AGAPE.Utils.Validador.getInstance();
        this._listaCache = [];
    }

    FornecedorController.prototype.listar = async function () {
        var resultado = await this._service.listar();
        if (resultado.status === 'ok' && Array.isArray(resultado.dados)) {
            this._listaCache = resultado.dados;
        }
        return resultado;
    };

    // Filtragem local sobre _listaCache por nome e status
    FornecedorController.prototype.filtrar = function (filtros) {
        var lista = this._listaCache;

        if (filtros.nome && filtros.nome.trim() !== '') {
            var termo = filtros.nome.trim().toLowerCase();
            lista = lista.filter(function (f) {
                return f.nome && f.nome.toLowerCase().indexOf(termo) !== -1;
            });
        }

        if (filtros.status === 'ativo') {
            lista = lista.filter(function (f) {
                return f.ativo === 1 || f.ativo === true || f.ativo === '1';
            });
        } else if (filtros.status === 'inativo') {
            lista = lista.filter(function (f) {
                return f.ativo === 0 || f.ativo === false || f.ativo === '0';
            });
        }

        return { status: 'ok', dados: lista };
    };

    FornecedorController.prototype.cadastrar = async function (dados) {
        var fornecedor = new window.AGAPE.Models.Fornecedor(dados);
        var erros      = fornecedor.validar();
        if (erros.length > 0) return { status: 'error', erro: erros.join(' ') };
        return await this._service.cadastrar(fornecedor);
    };

    FornecedorController.prototype.alterar = async function (dados) {
        var fornecedor = new window.AGAPE.Models.Fornecedor(dados);
        var erros      = fornecedor.validar();
        if (erros.length > 0) return { status: 'error', erro: erros.join(' ') };
        return await this._service.alterar(fornecedor);
    };

    FornecedorController.prototype.excluir = async function (idFornec) {
        if (!idFornec) return { status: 'error', erro: 'ID do fornecedor não informado.' };
        return await this._service.excluir(idFornec);
    };

    return {
        getInstance: function () {
            if (!instancia) instancia = new FornecedorController();
            return instancia;
        }
    };

})();
