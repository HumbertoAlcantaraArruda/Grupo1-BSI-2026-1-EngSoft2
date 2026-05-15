/* Mascaras — singleton para aplicar máscaras de entrada via jQuery Mask Plugin */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Utils = window.AGAPE.Utils || {};

window.AGAPE.Utils.Mascaras = (function () {

    var instancia = null;

    var _mapa = {
        'data': {
            mascara: '00/00/0000'
        },
        'monetario': {
            mascara: '000.000.000.000.000,00',
            opcoes: { reverse: true }
        },
        'telefone': {
            // Alterna entre 10 dígitos (fixo) e 11 (celular) conforme o usuário digita
            mascara: function (val) {
                return val.replace(/\D/g, '').length === 11
                    ? '(00) 00000-0000'
                    : '(00) 0000-00009';
            },
            opcoes: {
                onKeyPress: function (val, _e, campo, opts) {
                    var comportamento = function (v) {
                        return v.replace(/\D/g, '').length === 11
                            ? '(00) 00000-0000'
                            : '(00) 0000-00009';
                    };
                    campo.mask(comportamento.apply({}, [val]), opts);
                }
            }
        },
        'cpf':  { mascara: '000.000.000-00' },
        'cnpj': { mascara: '00.000.000/0000-00' },
        'cep':  { mascara: '00000-000' }
    };

    function Mascaras() {}

    Mascaras.prototype.aplicar = function (seletor, tipo) {
        var config = _mapa[tipo];
        if (!config) {
            console.warn('[Mascaras] Tipo "' + tipo + '" não encontrado.');
            return;
        }
        if (typeof config.mascara === 'function') {
            $(seletor).mask(config.mascara, config.opcoes || {});
        } else if (config.opcoes) {
            $(seletor).mask(config.mascara, config.opcoes);
        } else {
            $(seletor).mask(config.mascara);
        }
    };

    Mascaras.prototype.remover = function (seletor) {
        $(seletor).unmask();
    };

    // Adiciona nova máscara sem alterar as existentes
    Mascaras.prototype.registrar = function (tipo, config) {
        _mapa[tipo] = config;
    };

    // "1.234,56" → 1234.56
    Mascaras.prototype.monetarioParaNumero = function (valorFormatado) {
        if (!valorFormatado) return 0;
        var numero = parseFloat(
            valorFormatado.replace(/\./g, '').replace(',', '.')
        );
        return isNaN(numero) ? 0 : numero;
    };

    // 1234.56 → "1.234,56"
    Mascaras.prototype.numeroParaMonetario = function (valor) {
        if (valor === null || valor === undefined) return '0,00';
        return parseFloat(valor)
            .toFixed(2)
            .replace('.', ',')
            .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    Mascaras.prototype.apenasDigitos = function (valor) {
        if (!valor) return '';
        return String(valor).replace(/\D/g, '');
    };

    return {
        getInstance: function () {
            if (!instancia) instancia = new Mascaras();
            return instancia;
        }
    };

})();
