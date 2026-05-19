/* ValidadorCpf — valida CPF pelo algoritmo oficial de dígitos verificadores */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Utils = window.AGAPE.Utils || {};

window.AGAPE.Utils.ValidadorCpf = (function () {

    var SEQUENCIAS_INVALIDAS = [
        '00000000000', '11111111111', '22222222222', '33333333333',
        '44444444444', '55555555555', '66666666666', '77777777777',
        '88888888888', '99999999999'
    ];

    function _calcularDigito(trecho, pesoInicial) {
        var soma = 0;
        for (var i = 0; i < trecho.length; i++) {
            soma += parseInt(trecho.charAt(i), 10) * (pesoInicial - i);
        }
        var resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }

    /**
     * Valida um CPF pelo algoritmo oficial (dígitos verificadores).
     * @param {string} cpf  Apenas dígitos (11 chars) ou com máscara (000.000.000-00)
     * @returns {{ valido: boolean, mensagem: string }}
     */
    function validar(cpf) {
        var digits = String(cpf || '').replace(/\D/g, '');

        if (digits.length !== 11) {
            return { valido: false, mensagem: 'CPF inválido. Informe 11 dígitos.' };
        }

        if (SEQUENCIAS_INVALIDAS.indexOf(digits) !== -1) {
            return { valido: false, mensagem: 'CPF inválido. Por favor, verifique os números.' };
        }

        var d1 = _calcularDigito(digits.substring(0, 9), 10);
        if (d1 !== parseInt(digits.charAt(9), 10)) {
            return { valido: false, mensagem: 'CPF inválido. Por favor, verifique os números.' };
        }

        var d2 = _calcularDigito(digits.substring(0, 10), 11);
        if (d2 !== parseInt(digits.charAt(10), 10)) {
            return { valido: false, mensagem: 'CPF inválido. Por favor, verifique os números.' };
        }

        return { valido: true, mensagem: '' };
    }

    return { validar: validar };

})();
