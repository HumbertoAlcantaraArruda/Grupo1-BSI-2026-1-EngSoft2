/* Evento — entidade com validações e serialização para o backend */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Models = window.AGAPE.Models || {};

window.AGAPE.Models.Evento = (function () {

    function Evento(dados) {
        dados = dados || {};
        this._idEvento                 = dados.idEvento                 || null;
        this._idUsuarioResponsavel     = dados.idUsuarioResponsavel     || null;
        this._idCatEvento              = dados.idCatEvento              || null;
        this._nome                     = dados.nome                     || '';
        this._dataInicio               = dados.dataInicio               || '';
        this._dataFim                  = dados.dataFim                  || '';
        this._totVagas                 = dados.totVagas != null ? Number(dados.totVagas) : null;
        this._vagasDisp                = dados.vagasDisp != null ? Number(dados.vagasDisp) : null;
        this._idEventoStatus           = dados.idEventoStatus           || 1;
        this._dataEvento               = dados.dataEvento               || '';
        this._dataAberturaListaEspera  = dados.dataAberturaListaEspera  || null;
        this._valorInscricao           = dados.valorInscricao != null ? dados.valorInscricao : null;
        this._imagemEvento             = dados.imagemEvento             || null;
        this._imagemBase64             = dados.imagemBase64             || null;
        this._nomeImagemEvento         = dados.nomeImagemEvento         || null;
    }

    Evento.prototype.getIdEvento                = function () { return this._idEvento;                };
    Evento.prototype.getIdUsuarioResponsavel    = function () { return this._idUsuarioResponsavel;    };
    Evento.prototype.getIdCatEvento             = function () { return this._idCatEvento;             };
    Evento.prototype.getNome                    = function () { return this._nome;                    };
    Evento.prototype.getDataInicio              = function () { return this._dataInicio;              };
    Evento.prototype.getDataFim                 = function () { return this._dataFim;                 };
    Evento.prototype.getTotVagas                = function () { return this._totVagas;                };
    Evento.prototype.getVagasDisp               = function () { return this._vagasDisp;               };
    Evento.prototype.getIdEventoStatus          = function () { return this._idEventoStatus;          };
    Evento.prototype.getDataEvento              = function () { return this._dataEvento;              };
    Evento.prototype.getDataAberturaListaEspera = function () { return this._dataAberturaListaEspera; };
    Evento.prototype.getValorInscricao          = function () { return this._valorInscricao;          };
    Evento.prototype.getImagemEvento            = function () { return this._imagemEvento;            };

    Evento.prototype.setIdEvento                = function (v) { this._idEvento                = v; };
    Evento.prototype.setIdUsuarioResponsavel    = function (v) { this._idUsuarioResponsavel    = v; };
    Evento.prototype.setIdCatEvento             = function (v) { this._idCatEvento             = v; };
    Evento.prototype.setNome                    = function (v) { this._nome                    = v; };
    Evento.prototype.setDataInicio              = function (v) { this._dataInicio              = v; };
    Evento.prototype.setDataFim                 = function (v) { this._dataFim                 = v; };
    Evento.prototype.setTotVagas                = function (v) { this._totVagas                = v != null ? Number(v) : null; };
    Evento.prototype.setVagasDisp               = function (v) { this._vagasDisp               = v != null ? Number(v) : null; };
    Evento.prototype.setIdEventoStatus          = function (v) { this._idEventoStatus          = v; };
    Evento.prototype.setDataEvento              = function (v) { this._dataEvento              = v; };
    Evento.prototype.setDataAberturaListaEspera = function (v) { this._dataAberturaListaEspera = v || null; };
    Evento.prototype.setValorInscricao          = function (v) { this._valorInscricao          = v || null; };
    Evento.prototype.setImagemEvento            = function (v) { this._imagemEvento            = v || null; };
    Evento.prototype.setImagemBase64            = function (v) { this._imagemBase64            = v || null; };
    Evento.prototype.setNomeImagemEvento        = function (v) { this._nomeImagemEvento        = v || null; };

    Evento.prototype.validar = function () {
        var erros = [];
        if (!this._nome || this._nome.trim().length < 2)
            erros.push('Nome deve ter pelo menos 2 caracteres.');
        if (!this._idCatEvento)
            erros.push('Selecione uma categoria.');
        if (!this._idUsuarioResponsavel)
            erros.push('Selecione o responsável.');
        if (!this._dataInicio)
            erros.push('Informe a data de início.');
        if (!this._dataFim)
            erros.push('Informe a data de término.');
        if (!this._dataEvento)
            erros.push('Informe a data do evento.');
        if (this._totVagas === null || this._totVagas <= 0)
            erros.push('Total de vagas deve ser maior que zero.');
        return erros;
    };

    Evento.prototype.paraJson = function () {
        var dados = {
            nome:                    this._nome,
            idCatEvento:             this._idCatEvento,
            idUsuarioResponsavel:    this._idUsuarioResponsavel,
            dataInicio:              this._dataInicio,
            dataFim:                 this._dataFim,
            dataEvento:              this._dataEvento,
            totVagas:                this._totVagas,
            vagasDisp:               this._vagasDisp,
            idEventoStatus:          this._idEventoStatus
        };
        if (this._idEvento !== null && this._idEvento !== undefined) dados.idEvento = this._idEvento;
        if (this._dataAberturaListaEspera) dados.dataAberturaListaEspera = this._dataAberturaListaEspera;
        if (this._valorInscricao != null)  dados.valorInscricao          = this._valorInscricao;
        if (this._imagemBase64)            dados.imagemBase64            = this._imagemBase64;
        if (this._nomeImagemEvento)        dados.nomeImagemEvento        = this._nomeImagemEvento;
        return dados;
    };

    // Mantido por compatibilidade
    Evento.prototype.paraFormData = Evento.prototype.paraJson;

    return Evento;

})();
