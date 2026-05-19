/* BrasilApiCnpj — singleton para consulta de dados cadastrais via BrasilAPI */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Utils = window.AGAPE.Utils || {};

window.AGAPE.Utils.BrasilApiCnpj = (function () {

    var instancia = null;

    function BrasilApiCnpj() {}

    /**
     * Consulta os dados cadastrais do CNPJ informado via BrasilAPI.
     * @param {string} cnpj  Apenas dígitos (14 chars) ou com máscara
     * @returns {Promise<{status:'ok',dados:object}|{status:'erro',mensagem:string}>}
     */
    BrasilApiCnpj.prototype.buscar = function (cnpj) {
        var digits = String(cnpj).replace(/\D/g, '');

        if (digits.length !== 14) {
            return Promise.resolve({
                status: 'erro',
                mensagem: 'CNPJ inválido. Informe 14 dígitos.'
            });
        }

        return new Promise(function (resolve) {
            $.ajax({
                url: 'https://brasilapi.com.br/api/cnpj/v1/' + digits,
                method: 'GET',
                dataType: 'json'
            })
            .done(function (dados) {
                resolve({ status: 'ok', dados: dados });
            })
            .fail(function (jqXHR) {
                var mensagem = jqXHR.status === 404
                    ? 'CNPJ não encontrado.'
                    : 'Erro ao consultar o CNPJ. Verifique sua conexão.';
                resolve({ status: 'erro', mensagem: mensagem });
            });
        });
    };

    return {
        getInstance: function () {
            if (!instancia) instancia = new BrasilApiCnpj();
            return instancia;
        }
    };

})();
