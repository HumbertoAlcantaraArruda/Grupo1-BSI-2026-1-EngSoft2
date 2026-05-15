/* =====================================================================
   CategoriaEvento — Entidade / Model
   GRASP Information Expert: validações dos próprios atributos
   SOLID LSP: substituível onde um Model base for esperado
   ===================================================================== */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Models = window.AGAPE.Models || {};

window.AGAPE.Models.CategoriaEvento = (function () {

    /* ---- Construtor ------------------------------------------------- */
    function CategoriaEvento(dados) {
        dados = dados || {};
        this._id    = dados.id    || null;
        this._nome  = dados.nome  || '';
        this._ativo = _parsearBooleano(dados.ativo, true);
    }

    function _parsearBooleano(valor, padrao) {
        if (valor === true  || valor === 1 || valor === '1' || valor === 'true')  return true;
        if (valor === false || valor === 0 || valor === '0' || valor === 'false') return false;
        return padrao;
    }

    /* ---- Getters ---------------------------------------------------- */
    CategoriaEvento.prototype.getId    = function () { return this._id;    };
    CategoriaEvento.prototype.getNome  = function () { return this._nome;  };
    CategoriaEvento.prototype.getAtivo = function () { return this._ativo; };

    /* ---- Setters ---------------------------------------------------- */
    CategoriaEvento.prototype.setId    = function (v) { this._id    = v;           };
    CategoriaEvento.prototype.setNome  = function (v) { this._nome  = v;           };
    CategoriaEvento.prototype.setAtivo = function (v) { this._ativo = Boolean(v);  };

    /* ---- Validações individuais (Information Expert) --------------- */
    CategoriaEvento.prototype.validarNome = function () {
        return typeof this._nome === 'string' && this._nome.trim().length >= 2;
    };

    /* ---- Validação completa — retorna lista de erros --------------- */
    CategoriaEvento.prototype.validar = function () {
        var erros = [];
        if (!this.validarNome())
            erros.push('Nome deve ter pelo menos 2 caracteres.');
        return erros;
    };

    /* ---- Serializar para envio ao backend (x-www-form-urlencoded) -- */
    /* PUT body: id, ativo, nome                                         */
    /* POST body: nome (sem ativo e sem id conforme a rota)              */
    CategoriaEvento.prototype.paraFormData = function () {
        var dados = {
            nome:  this._nome,
            ativo: this._ativo ? 'true' : 'false'
        };
        if (this._id !== null && this._id !== undefined) {
            dados.id = this._id;
        }
        return dados;
    };

    /* ---- Serializar apenas para POST (apenas nome, sem id/ativo) -- */
    CategoriaEvento.prototype.paraFormDataCadastro = function () {
        return { nome: this._nome };
    };

    return CategoriaEvento;

})();
