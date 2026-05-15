/* =====================================================================
   Produto — Entidade / Model
   GRASP Information Expert: validações dos próprios atributos
   SOLID LSP: substituível onde um Model base for esperado
   ===================================================================== */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Models = window.AGAPE.Models || {};

window.AGAPE.Models.Produto = (function () {

    /* ---- Construtor (Creator: instanciado pelo ProdutosController) - */
    function Produto(dados) {
        dados = dados || {};
        this._idProd    = dados.idProd    || null;
        this._idCatProd = dados.idCatProd || null;
        this._nome      = dados.nome      || '';
        this._valorUni  = (dados.valorUni !== undefined && dados.valorUni !== null)
            ? parseFloat(dados.valorUni) : null;
        this._qtdeAtual = (dados.qtdeAtual !== undefined && dados.qtdeAtual !== null)
            ? parseInt(dados.qtdeAtual, 10) : null;
    }

    /* ---- Getters ---------------------------------------------------- */
    Produto.prototype.getIdProd    = function () { return this._idProd;    };
    Produto.prototype.getIdCatProd = function () { return this._idCatProd; };
    Produto.prototype.getNome      = function () { return this._nome;      };
    Produto.prototype.getValorUni  = function () { return this._valorUni;  };
    Produto.prototype.getQtdeAtual = function () { return this._qtdeAtual; };

    /* ---- Setters ---------------------------------------------------- */
    Produto.prototype.setIdProd    = function (v) { this._idProd    = v;                   };
    Produto.prototype.setIdCatProd = function (v) { this._idCatProd = v;                   };
    Produto.prototype.setNome      = function (v) { this._nome      = v;                   };
    Produto.prototype.setValorUni  = function (v) { this._valorUni  = parseFloat(v);       };
    Produto.prototype.setQtdeAtual = function (v) { this._qtdeAtual = parseInt(v, 10);     };

    /* ---- Validações individuais (Information Expert) --------------- */
    Produto.prototype.validarNome = function () {
        return typeof this._nome === 'string' && this._nome.trim().length >= 2;
    };

    Produto.prototype.validarCategoria = function () {
        return this._idCatProd !== null &&
               this._idCatProd !== undefined &&
               String(this._idCatProd).trim() !== '';
    };

    Produto.prototype.validarValorUni = function () {
        return this._valorUni !== null &&
               !isNaN(this._valorUni) &&
               this._valorUni >= 0;
    };

    Produto.prototype.validarQtdeAtual = function () {
        return this._qtdeAtual !== null &&
               !isNaN(this._qtdeAtual) &&
               this._qtdeAtual >= 0;
    };

    /* ---- Validação completa — retorna lista de erros --------------- */
    Produto.prototype.validar = function () {
        var erros = [];
        if (!this.validarNome())
            erros.push('Nome deve ter pelo menos 2 caracteres.');
        if (!this.validarCategoria())
            erros.push('Categoria de produto é obrigatória.');
        if (!this.validarValorUni())
            erros.push('Valor unitário deve ser um número maior ou igual a zero.');
        if (!this.validarQtdeAtual())
            erros.push('Quantidade deve ser um número inteiro maior ou igual a zero.');
        return erros;
    };

    /* ---- Serializar para envio ao backend (x-www-form-urlencoded) -- */
    Produto.prototype.paraFormData = function () {
        var dados = {
            nome:      this._nome,
            idCatProd: this._idCatProd,
            valorUni:  this._valorUni,
            qtdeAtual: this._qtdeAtual
        };
        if (this._idProd !== null && this._idProd !== undefined) {
            dados.idProd = this._idProd;
        }
        return dados;
    };

    return Produto;

})();
