/* =====================================================================
   CategoriaProduto — Entidade / Model
   GRASP Information Expert: validações dos próprios atributos
   SOLID LSP: substituível onde um Model base for esperado
   ===================================================================== */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Models = window.AGAPE.Models || {};

window.AGAPE.Models.CategoriaProduto = (function () {

    /* ---- Construtor ------------------------------------------------- */
    function CategoriaProduto(dados) {
        dados = dados || {};
        this._idCatProd = dados.idCatProd || null;
        this._nome      = dados.nome      || '';
        /* ativo: aceita boolean, string 'true'/'false' ou 1/0 */
        this._ativo     = _parsearBooleano(dados.ativo, true);
    }

    function _parsearBooleano(valor, padrao) {
        if (valor === true  || valor === 1 || valor === '1' || valor === 'true')  return true;
        if (valor === false || valor === 0 || valor === '0' || valor === 'false') return false;
        return padrao;
    }

    /* ---- Getters ---------------------------------------------------- */
    CategoriaProduto.prototype.getIdCatProd = function () { return this._idCatProd; };
    CategoriaProduto.prototype.getNome      = function () { return this._nome;      };
    CategoriaProduto.prototype.getAtivo     = function () { return this._ativo;     };

    /* ---- Setters ---------------------------------------------------- */
    CategoriaProduto.prototype.setIdCatProd = function (v) { this._idCatProd = v;              };
    CategoriaProduto.prototype.setNome      = function (v) { this._nome      = v;              };
    CategoriaProduto.prototype.setAtivo     = function (v) { this._ativo     = Boolean(v);    };

    /* ---- Validações individuais (Information Expert) --------------- */
    CategoriaProduto.prototype.validarNome = function () {
        return typeof this._nome === 'string' && this._nome.trim().length >= 2;
    };

    /* ---- Validação completa — retorna lista de erros --------------- */
    CategoriaProduto.prototype.validar = function () {
        var erros = [];
        if (!this.validarNome())
            erros.push('Nome deve ter pelo menos 2 caracteres.');
        return erros;
    };

    /* ---- Serializar para envio ao backend (x-www-form-urlencoded) -- */
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
