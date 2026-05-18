/* Fornecedor — entidade com validações e serialização para o backend */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Models = window.AGAPE.Models || {};

window.AGAPE.Models.Fornecedor = (function () {

    function Fornecedor(dados) {
        dados = dados || {};
        this._idFornec   = dados.idFornec   || null;
        this._nome       = dados.nome       || '';
        this._telefone1  = dados.telefone1  || '';
        this._telefone2  = dados.telefone2  || '';
        this._email      = dados.email      || '';
        this._site       = dados.site       || '';
        this._contato    = dados.contato    || '';
        this._cep        = dados.cep        || '';
        this._logradouro = dados.logradouro || '';
        this._cnpj       = dados.cnpj       || '';
        this._cidade     = dados.cidade     || '';
        this._uf         = dados.uf         || '';
        this._obs        = dados.obs        || '';
        this._ativo      = _parsearAtivo(dados.ativo, 1);
    }

    function _parsearAtivo(valor, padrao) {
        if (valor === 1  || valor === '1'  || valor === true  || valor === 'true')  return 1;
        if (valor === 0  || valor === '0'  || valor === false || valor === 'false') return 0;
        return padrao;
    }

    Fornecedor.prototype.getIdFornec   = function () { return this._idFornec;   };
    Fornecedor.prototype.getNome       = function () { return this._nome;       };
    Fornecedor.prototype.getTelefone1  = function () { return this._telefone1;  };
    Fornecedor.prototype.getTelefone2  = function () { return this._telefone2;  };
    Fornecedor.prototype.getEmail      = function () { return this._email;      };
    Fornecedor.prototype.getSite       = function () { return this._site;       };
    Fornecedor.prototype.getContato    = function () { return this._contato;    };
    Fornecedor.prototype.getCep        = function () { return this._cep;        };
    Fornecedor.prototype.getLogradouro = function () { return this._logradouro; };
    Fornecedor.prototype.getCnpj       = function () { return this._cnpj;       };
    Fornecedor.prototype.getCidade     = function () { return this._cidade;     };
    Fornecedor.prototype.getUf         = function () { return this._uf;         };
    Fornecedor.prototype.getObs        = function () { return this._obs;        };
    Fornecedor.prototype.getAtivo      = function () { return this._ativo;      };

    Fornecedor.prototype.setIdFornec   = function (v) { this._idFornec   = v; };
    Fornecedor.prototype.setNome       = function (v) { this._nome       = v; };
    Fornecedor.prototype.setTelefone1  = function (v) { this._telefone1  = v; };
    Fornecedor.prototype.setTelefone2  = function (v) { this._telefone2  = v; };
    Fornecedor.prototype.setEmail      = function (v) { this._email      = v; };
    Fornecedor.prototype.setSite       = function (v) { this._site       = v; };
    Fornecedor.prototype.setContato    = function (v) { this._contato    = v; };
    Fornecedor.prototype.setCep        = function (v) { this._cep        = v; };
    Fornecedor.prototype.setLogradouro = function (v) { this._logradouro = v; };
    Fornecedor.prototype.setCnpj       = function (v) { this._cnpj       = v; };
    Fornecedor.prototype.setCidade     = function (v) { this._cidade     = v; };
    Fornecedor.prototype.setUf         = function (v) { this._uf         = v; };
    Fornecedor.prototype.setObs        = function (v) { this._obs        = v; };
    Fornecedor.prototype.setAtivo      = function (v) { this._ativo      = _parsearAtivo(v, 1); };

    Fornecedor.prototype.validarNome = function () {
        return typeof this._nome === 'string' && this._nome.trim().length >= 2;
    };

    Fornecedor.prototype.validar = function () {
        var erros = [];
        if (!this.validarNome()) erros.push('Nome deve ter pelo menos 2 caracteres.');
        return erros;
    };

    Fornecedor.prototype.paraFormData = function () {
        var dados = {
            nome:       this._nome,
            telefone1:  this._telefone1,
            telefone2:  this._telefone2,
            email:      this._email,
            site:       this._site,
            contato:    this._contato,
            cep:        this._cep,
            logradouro: this._logradouro,
            cnpj:       this._cnpj,
            cidade:     this._cidade,
            uf:         this._uf,
            obs:        this._obs,
            ativo:      this._ativo
        };
        if (this._idFornec !== null && this._idFornec !== undefined) {
            dados.idFornec = this._idFornec;
        }
        return dados;
    };

    return Fornecedor;

})();
