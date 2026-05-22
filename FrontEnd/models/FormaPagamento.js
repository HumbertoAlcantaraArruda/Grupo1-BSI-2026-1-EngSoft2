/* FormaPagamento — entidade com validações e serialização para o backend */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Models = window.AGAPE.Models || {};

window.AGAPE.Models.FormaPagamento = (function () {

    function FormaPagamento(dados) {
        dados = dados || {};
        this._idFormaPag      = dados.idFormaPag      || null;
        this._descricao       = dados.descricao       || '';
        this._ativo           = _parsearBooleano(dados.ativo, true);
        this._permiteParcelar = _parsearBooleano(dados.permiteParcelar, false);
    }

    function _parsearBooleano(valor, padrao) {
        if (valor === true  || valor === 1 || valor === '1' || valor === 'true')  return true;
        if (valor === false || valor === 0 || valor === '0' || valor === 'false') return false;
        return padrao;
    }

    FormaPagamento.prototype.getIdFormaPag      = function () { return this._idFormaPag;      };
    FormaPagamento.prototype.getDescricao       = function () { return this._descricao;       };
    FormaPagamento.prototype.getAtivo           = function () { return this._ativo;           };
    FormaPagamento.prototype.getPermiteParcelar = function () { return this._permiteParcelar; };

    FormaPagamento.prototype.setIdFormaPag      = function (v) { this._idFormaPag      = v;          };
    FormaPagamento.prototype.setDescricao       = function (v) { this._descricao       = v;          };
    FormaPagamento.prototype.setAtivo           = function (v) { this._ativo           = Boolean(v); };
    FormaPagamento.prototype.setPermiteParcelar = function (v) { this._permiteParcelar = Boolean(v); };

    FormaPagamento.prototype.validar = function () {
        var erros = [];
        if (typeof this._descricao !== 'string' || this._descricao.trim().length < 2)
            erros.push('Descrição deve ter pelo menos 2 caracteres.');
        return erros;
    };

    // PUT envia idFormaPag + descricao + ativo
    FormaPagamento.prototype.paraFormData = function () {
        var dados = {
            descricao: this._descricao,
            ativo:     this._ativo ? 'true' : 'false'
        };
        if (this._idFormaPag !== null && this._idFormaPag !== undefined) {
            dados.idFormaPag = this._idFormaPag;
        }
        return dados;
    };

    // POST envia descricao + permiteParcelar (ativo padrão=1 no backend)
    FormaPagamento.prototype.paraFormDataCadastro = function () {
        return {
            descricao:       this._descricao,
            permiteParcelar: this._permiteParcelar ? 'true' : 'false'
        };
    };

    return FormaPagamento;

})();
