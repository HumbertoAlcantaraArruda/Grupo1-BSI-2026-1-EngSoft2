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
        this._idCatEvento = dados.idCatEvento || null;
        this._nome        = dados.nome        || '';
        this._ativo       = _parsearBooleano(dados.ativo, true);
    }

    function _parsearBooleano(valor, padrao) {
        if (valor === true  || valor === 1 || valor === '1' || valor === 'true')  return true;
        if (valor === false || valor === 0 || valor === '0' || valor === 'false') return false;
        return padrao;
    }

    /* ---- Getters ---------------------------------------------------- */
    CategoriaEvento.prototype.getIdCatEvento = function () { return this._idCatEvento; };
    CategoriaEvento.prototype.getNome        = function () { return this._nome;        };
    CategoriaEvento.prototype.getAtivo       = function () { return this._ativo;       };

    /* ---- Setters ---------------------------------------------------- */
    CategoriaEvento.prototype.setIdCatEvento = function (v) { this._idCatEvento = v;          };
    CategoriaEvento.prototype.setNome        = function (v) { this._nome        = v;          };
    CategoriaEvento.prototype.setAtivo       = function (v) { this._ativo       = Boolean(v); };

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
    /* PUT body: idCatEvento, ativo, nome                                */
    /* POST body: nome (sem ativo e sem idCatEvento conforme a rota)     */
    CategoriaEvento.prototype.paraFormData = function () {
        var dados = {
            nome:  this._nome,
            ativo: this._ativo ? 'true' : 'false'
        };
        if (this._idCatEvento !== null && this._idCatEvento !== undefined) {
            dados.idCatEvento = this._idCatEvento;
        }
        return dados;
    };

    /* ---- Serializar apenas para POST (apenas nome, sem id/ativo) -- */
    CategoriaEvento.prototype.paraFormDataCadastro = function () {
        return { nome: this._nome };
    };

    return CategoriaEvento;

})();
