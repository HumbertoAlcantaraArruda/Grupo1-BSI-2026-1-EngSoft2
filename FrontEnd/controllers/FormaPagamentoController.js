/* FormaPagamentoController — fachada do caso de uso FormaPagamento */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Controllers = window.AGAPE.Controllers || {};

window.AGAPE.Controllers.FormaPagamentoController = (function () {

    var instancia = null;

    function FormaPagamentoController() {
        this._service = window.AGAPE.Services.FormaPagamentoService.getInstance();
    }

    FormaPagamentoController.prototype.listar = async function () {
        return await this._service.listar();
    };

    // filtros: { descricao?, ativo? }
    FormaPagamentoController.prototype.filtrar = async function (filtros) {
        var params = {};
        if (filtros.descricao && filtros.descricao.trim() !== '') params.descricao = filtros.descricao.trim();
        if (filtros.ativo === 'true' || filtros.ativo === 'false') params.ativo = filtros.ativo;
        return await this._service.listar(params);
    };

    FormaPagamentoController.prototype.cadastrar = async function (dados) {
        var forma = new window.AGAPE.Models.FormaPagamento(dados);
        var erros = forma.validar();
        if (erros.length > 0) return { status: 'error', erro: erros.join(' ') };
        return await this._service.cadastrar(forma);
    };

    FormaPagamentoController.prototype.alterar = async function (dados) {
        var forma = new window.AGAPE.Models.FormaPagamento(dados);
        var erros = forma.validar();
        if (erros.length > 0) return { status: 'error', erro: erros.join(' ') };
        return await this._service.alterar(forma);
    };

    FormaPagamentoController.prototype.excluir = async function (id) {
        if (!id) return { status: 'error', erro: 'ID da forma de pagamento não informado.' };
        return await this._service.excluir(id);
    };

    return {
        getInstance: function () {
            if (!instancia) instancia = new FormaPagamentoController();
            return instancia;
        }
    };

})();
