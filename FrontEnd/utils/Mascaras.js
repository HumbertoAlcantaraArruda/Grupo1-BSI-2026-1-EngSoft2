/* =====================================================================
   Mascaras — Gerenciador de máscaras de entrada
   Padrão: Singleton (GOF) + mapa extensível (OCP)
   Depende: jQuery Mask Plugin (carregado globalmente)
   ===================================================================== */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Utils = window.AGAPE.Utils || {};

window.AGAPE.Utils.Mascaras = (function () {

    var instancia = null;

    /* ---- Mapa de máscaras (OCP: registrar() adiciona sem alterar) -- */
    var _mapa = {
        'data': {
            mascara: '00/00/0000'
        },
        'monetario': {
            mascara: '000.000.000.000.000,00',
            opcoes: { reverse: true }
        },
        'telefone': {
            /* Máscara dinâmica: 10 dígitos (fixo) ou 11 dígitos (celular) */
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
        'cpf': {
            mascara: '000.000.000-00'
        },
        'cnpj': {
            mascara: '00.000.000/0000-00'
        },
        'cep': {
            mascara: '00000-000'
        }
    };

    /* ---- Construtor ------------------------------------------------- */
    function Mascaras() {}

    /* ---- Aplicar máscara ao elemento ------------------------------- */
    Mascaras.prototype.aplicar = function (seletor, tipo) {
        var config = _mapa[tipo];
        if (!config) {
            console.warn('[Mascaras] Tipo "' + tipo + '" não encontrado no mapa.');
            return;
        }

        if (typeof config.mascara === 'function') {
            $(seletor).mask(config.mascara, config.opcoes || {});
        } else {
            if (config.opcoes) {
                $(seletor).mask(config.mascara, config.opcoes);
            } else {
                $(seletor).mask(config.mascara);
            }
        }
    };

    /* ---- Remover máscara de um elemento ---------------------------- */
    Mascaras.prototype.remover = function (seletor) {
        $(seletor).unmask();
    };

    /* ---- Registrar nova máscara (OCP: extensão sem modificação) ---- */
    Mascaras.prototype.registrar = function (tipo, config) {
        _mapa[tipo] = config;
    };

    /* ---- Converter valor monetário formatado para número ----------- */
    /* "1.234,56" -> 1234.56                                            */
    Mascaras.prototype.monetarioParaNumero = function (valorFormatado) {
        if (!valorFormatado) return 0;
        var limpo = valorFormatado
            .replace(/\./g, '')
            .replace(',', '.');
        var numero = parseFloat(limpo);
        return isNaN(numero) ? 0 : numero;
    };

    /* ---- Converter número para exibição monetária formatada -------- */
    /* 1234.56 -> "1.234,56"                                            */
    Mascaras.prototype.numeroParaMonetario = function (valor) {
        if (valor === null || valor === undefined) return '0,00';
        return parseFloat(valor)
            .toFixed(2)
            .replace('.', ',')
            .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    /* ---- Remover todos os caracteres não numéricos ----------------- */
    Mascaras.prototype.apenasDigitos = function (valor) {
        if (!valor) return '';
        return String(valor).replace(/\D/g, '');
    };

    /* ---- Interface Singleton --------------------------------------- */
    return {
        getInstance: function () {
            if (!instancia) {
                instancia = new Mascaras();
            }
            return instancia;
        }
    };

})();
