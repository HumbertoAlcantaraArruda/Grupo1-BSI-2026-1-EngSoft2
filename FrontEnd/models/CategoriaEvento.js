/* CategoriaEvento — entidade com validações e serialização para o backend */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Models = window.AGAPE.Models || {};

window.AGAPE.Models.CategoriaEvento = (function () {

    function CategoriaEvento(dados) {
        dados = dados || {};
        this._idCatEvento = dados.idCatEvento || null;
        this._nome        = dados.nome        || '';
        // Aceita boolean, número (0/1) ou string ('true'/'false')
        this._ativo       = _parsearBooleano(dados.ativo, true);
    }

    function _parsearBooleano(valor, padrao) {
        if (valor === true  || valor === 1 || valor === '1' || valor === 'true')  return true;
        if (valor === false || valor === 0 || valor === '0' || valor === 'false') return false;
        return padrao;
    }

    CategoriaEvento.prototype.getIdCatEvento = function () { return this._idCatEvento; };
    CategoriaEvento.prototype.getNome        = function () { return this._nome;        };
    CategoriaEvento.prototype.getAtivo       = function () { return this._ativo;       };

    CategoriaEvento.prototype.setIdCatEvento = function (v) { this._idCatEvento = v;          };
    CategoriaEvento.prototype.setNome        = function (v) { this._nome        = v;          };
    CategoriaEvento.prototype.setAtivo       = function (v) { this._ativo       = Boolean(v); };

    CategoriaEvento.prototype.validarNome = function () {
        return typeof this._nome === 'string' && this._nome.trim().length >= 2;
    };

    CategoriaEvento.prototype.validar = function () {
        var erros = [];
        if (!this.validarNome()) erros.push('Nome deve ter pelo menos 2 caracteres.');
        return erros;
    };

    // PUT envia idCatEvento + nome + ativo
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

    // POST envia apenas nome (sem id e sem ativo, conforme a rota)
    CategoriaEvento.prototype.paraFormDataCadastro = function () {
        return { nome: this._nome };
    };

    return CategoriaEvento;

})();
