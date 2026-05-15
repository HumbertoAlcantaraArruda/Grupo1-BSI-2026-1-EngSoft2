/* CategoriaProduto — entidade com validações e serialização para o backend */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Models = window.AGAPE.Models || {};

window.AGAPE.Models.CategoriaProduto = (function () {

    function CategoriaProduto(dados) {
        dados = dados || {};
        this._idCatProd = dados.idCatProd || null;
        this._nome      = dados.nome      || '';
        // Aceita boolean, número (0/1) ou string ('true'/'false')
        this._ativo     = _parsearBooleano(dados.ativo, true);
    }

    function _parsearBooleano(valor, padrao) {
        if (valor === true  || valor === 1 || valor === '1' || valor === 'true')  return true;
        if (valor === false || valor === 0 || valor === '0' || valor === 'false') return false;
        return padrao;
    }

    CategoriaProduto.prototype.getIdCatProd = function () { return this._idCatProd; };
    CategoriaProduto.prototype.getNome      = function () { return this._nome;      };
    CategoriaProduto.prototype.getAtivo     = function () { return this._ativo;     };

    CategoriaProduto.prototype.setIdCatProd = function (v) { this._idCatProd = v;           };
    CategoriaProduto.prototype.setNome      = function (v) { this._nome      = v;           };
    CategoriaProduto.prototype.setAtivo     = function (v) { this._ativo     = Boolean(v);  };

    CategoriaProduto.prototype.validarNome = function () {
        return typeof this._nome === 'string' && this._nome.trim().length >= 2;
    };

    CategoriaProduto.prototype.validar = function () {
        var erros = [];
        if (!this.validarNome()) erros.push('Nome deve ter pelo menos 2 caracteres.');
        return erros;
    };

    // Inclui idCatProd apenas na edição (PUT)
    CategoriaProduto.prototype.paraFormData = function () {
        var dados = {
            nome:  this._nome,
            ativo: this._ativo ? 'true' : 'false'
        };
        if (this._idCatProd !== null && this._idCatProd !== undefined) {
            dados.idCatProd = this._idCatProd;
        }
        return dados;
    };

    return CategoriaProduto;

})();
