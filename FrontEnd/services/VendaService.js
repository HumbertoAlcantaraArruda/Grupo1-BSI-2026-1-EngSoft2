/* VendaService — chamadas HTTP para o caso de uso Realizar Venda */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Services = window.AGAPE.Services || {};

window.AGAPE.Services.VendaService = (function () {

    var instancia = null;

    function VendaService() {
        this._http = window.AGAPE.Utils.HttpClient.getInstance();
    }

    /** Lista vendas registradas; filtros: { dataInicio, dataFim } (ambos opcionais). */
    VendaService.prototype.listar = async function (filtros) {
        return await this._http.get('/venda', filtros || {});
    };

    /** Passo 2.1 — busca paroquiano por CPF (apenas dígitos). */
    VendaService.prototype.buscarParoquiano = async function (cpf) {
        return await this._http.get('/paroquiano', { cpf: cpf });
    };

    /** Passo 3.1 — busca produtos por nome (usa o endpoint /produto existente). */
    VendaService.prototype.buscarProdutos = async function (nome) {
        return await this._http.get('/produto', { nome: nome });
    };

    /** Passo 15 — lista formas de pagamento ativas. */
    VendaService.prototype.listarFormasPag = async function () {
        return await this._http.get('/formaPagamento');
    };

    /** Passo 19 — envia todos os dados da venda para o backend (transação única). */
    VendaService.prototype.efetuarVenda = async function (dados) {
        return await this._http.post('/venda', dados);
    };

    /** Verifica se há caixa aberto antes de abrir o PDV. */
    VendaService.prototype.checkCaixaAberto = async function () {
        return await this._http.get('/venda', { checkCaixa: '1' });
    };

    /** Exclusão transacional: estorna estoque/caixa e apaga a venda. */
    VendaService.prototype.deletarVenda = async function (idVenda) {
        return await this._http.delete('/venda', { idVenda: idVenda });
    };

    /**
     * Carrega os dados completos de uma venda para edição (SOMENTE LEITURA).
     * Não altera o banco — o estorno só ocorre ao finalizar a edição.
     */
    VendaService.prototype.carregarEdicao = async function (idVenda) {
        return await this._http.get('/venda', { carregarEdicao: idVenda });
    };

    return {
        getInstance: function () {
            if (!instancia) instancia = new VendaService();
            return instancia;
        }
    };

})();
