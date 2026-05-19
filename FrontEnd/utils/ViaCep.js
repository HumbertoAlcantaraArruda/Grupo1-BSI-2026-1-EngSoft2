/* ViaCep — singleton para consulta de endereço via API pública do ViaCEP */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Utils = window.AGAPE.Utils || {};

window.AGAPE.Utils.ViaCep = (function () {

    var instancia = null;

    function ViaCep() {}

    /**
     * Consulta o endereço correspondente ao CEP informado.
     * @param {string} cep  Apenas dígitos (8 chars) ou com máscara (ex: "01310-100")
     * @returns {Promise<{status:'ok',dados:object}|{status:'erro',mensagem:string}>}
     */
    ViaCep.prototype.buscar = function (cep) {
        var digits = String(cep).replace(/\D/g, '');

        if (digits.length !== 8) {
            return Promise.resolve({
                status: 'erro',
                mensagem: 'CEP inválido. Informe 8 dígitos.'
            });
        }

        return new Promise(function (resolve) {
            $.getJSON('https://viacep.com.br/ws/' + digits + '/json/')
                .done(function (dados) {
                    if (dados.erro) {
                        resolve({ status: 'erro', mensagem: 'CEP não encontrado.' });
                    } else {
                        resolve({ status: 'ok', dados: dados });
                    }
                })
                .fail(function () {
                    resolve({
                        status: 'erro',
                        mensagem: 'Erro ao consultar o CEP. Verifique sua conexão.'
                    });
                });
        });
    };

    return {
        getInstance: function () {
            if (!instancia) instancia = new ViaCep();
            return instancia;
        }
    };

})();
