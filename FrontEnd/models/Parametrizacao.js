/* =====================================================================
   Parametrizacao — Entidade / Model
   GRASP Information Expert: validações dos próprios atributos
   Tabela de registro único (upsert); PK = cnpj
   ===================================================================== */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Models = window.AGAPE.Models || {};

window.AGAPE.Models.Parametrizacao = (function () {

    function Parametrizacao(dados) {
        dados = dados || {};
        this._cnpj               = dados.cnpj               || '';
        this._razaoSocial        = dados.razaoSocial        || '';
        this._nomeFantasia       = dados.nomeFantasia       || '';
        this._logradouro         = dados.logradouro         || '';
        this._numEndereco        = dados.numEndereco        || '';
        this._complemento        = dados.complemento        || '';
        this._bairro             = dados.bairro             || '';
        this._cidade             = dados.cidade             || '';
        this._uf                 = dados.uf                 || '';
        this._cep                = dados.cep                || '';
        this._pais               = dados.pais               || '';
        this._email              = dados.email              || '';
        this._telefone1          = dados.telefone1          || '';
        this._telefone2          = dados.telefone2          || '';
        this._site               = dados.site               || '';
        this._responsavel        = dados.responsavel        || '';
        this._inscricaoEstadual  = dados.inscricaoEstadual  || '';
        this._inscricaoMunicipal = dados.inscricaoMunicipal || '';
        this._logotipoGrande     = dados.logotipoGrande     || '';
        this._logotipoPequeno    = dados.logotipoPequeno    || '';
        this._moedaPadrao        = dados.moedaPadrao        || '';
        this._fusoHorario        = dados.fusoHorario        || '';
        this._obs                = dados.obs                || '';
    }

    /* ---- Getters ---------------------------------------------------- */
    Parametrizacao.prototype.getCnpj               = function () { return this._cnpj;               };
    Parametrizacao.prototype.getRazaoSocial        = function () { return this._razaoSocial;        };
    Parametrizacao.prototype.getNomeFantasia       = function () { return this._nomeFantasia;       };
    Parametrizacao.prototype.getLogradouro         = function () { return this._logradouro;         };
    Parametrizacao.prototype.getNumEndereco        = function () { return this._numEndereco;        };
    Parametrizacao.prototype.getComplemento        = function () { return this._complemento;        };
    Parametrizacao.prototype.getBairro             = function () { return this._bairro;             };
    Parametrizacao.prototype.getCidade             = function () { return this._cidade;             };
    Parametrizacao.prototype.getUf                 = function () { return this._uf;                 };
    Parametrizacao.prototype.getCep                = function () { return this._cep;                };
    Parametrizacao.prototype.getPais               = function () { return this._pais;               };
    Parametrizacao.prototype.getEmail              = function () { return this._email;              };
    Parametrizacao.prototype.getTelefone1          = function () { return this._telefone1;          };
    Parametrizacao.prototype.getTelefone2          = function () { return this._telefone2;          };
    Parametrizacao.prototype.getSite               = function () { return this._site;               };
    Parametrizacao.prototype.getResponsavel        = function () { return this._responsavel;        };
    Parametrizacao.prototype.getInscricaoEstadual  = function () { return this._inscricaoEstadual;  };
    Parametrizacao.prototype.getInscricaoMunicipal = function () { return this._inscricaoMunicipal; };
    Parametrizacao.prototype.getLogotipoGrande     = function () { return this._logotipoGrande;     };
    Parametrizacao.prototype.getLogotipoPequeno    = function () { return this._logotipoPequeno;    };
    Parametrizacao.prototype.getMoedaPadrao        = function () { return this._moedaPadrao;        };
    Parametrizacao.prototype.getFusoHorario        = function () { return this._fusoHorario;        };
    Parametrizacao.prototype.getObs                = function () { return this._obs;                };

    /* ---- Validações (Information Expert) --------------------------- */
    Parametrizacao.prototype.validarCnpj = function () {
        var d = this._cnpj.replace(/\D/g, '');
        return d.length === 14;
    };

    Parametrizacao.prototype.validarRazaoSocial = function () {
        return this._razaoSocial.trim().length >= 2;
    };

    Parametrizacao.prototype.validarNomeFantasia = function () {
        return this._nomeFantasia.trim().length >= 2;
    };

    Parametrizacao.prototype.validar = function () {
        var erros = [];
        if (!this.validarCnpj())        erros.push('CNPJ inválido — informe os 14 dígitos.');
        if (!this.validarRazaoSocial()) erros.push('Razão Social deve ter pelo menos 2 caracteres.');
        if (!this.validarNomeFantasia()) erros.push('Nome Fantasia deve ter pelo menos 2 caracteres.');
        return erros;
    };

    /* ---- Serializar para POST x-www-form-urlencoded ---------------- */
    Parametrizacao.prototype.paraFormData = function () {
        return {
            cnpj:               this._cnpj,
            razaoSocial:        this._razaoSocial,
            nomeFantasia:       this._nomeFantasia,
            logradouro:         this._logradouro,
            numEndereco:        this._numEndereco,
            complemento:        this._complemento,
            bairro:             this._bairro,
            cidade:             this._cidade,
            uf:                 this._uf,
            cep:                this._cep,
            pais:               this._pais,
            email:              this._email,
            telefone1:          this._telefone1,
            telefone2:          this._telefone2,
            site:               this._site,
            responsavel:        this._responsavel,
            inscricaoEstadual:  this._inscricaoEstadual,
            inscricaoMunicipal: this._inscricaoMunicipal,
            logotipoGrande:     this._logotipoGrande,
            logotipoPequeno:    this._logotipoPequeno,
            moedaPadrao:        this._moedaPadrao,
            fusoHorario:        this._fusoHorario,
            obs:                this._obs
        };
    };

    return Parametrizacao;

})();
