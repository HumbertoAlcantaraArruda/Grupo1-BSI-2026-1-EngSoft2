/* EventoService — chamadas HTTP para /evento (leitura) e /controlarEvento (escrita) */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Services = window.AGAPE.Services || {};

window.AGAPE.Services.EventoService = (function () {

    var instancia = null;

    function EventoService() {
        this._http = window.AGAPE.Utils.HttpClient.getInstance();
    }

    // ── Leitura (/evento — sem transação no backend) ──────────────────────

    EventoService.prototype.listar = async function (filtros) {
        return await this._http.get('/evento', filtros || {});
    };

    /** Retorna responsável, inscritos e lista de espera de um evento. */
    EventoService.prototype.buscarDetalhe = async function (idEvento) {
        return await this._http.get('/detalheEvento', { idEvento: idEvento });
    };

    /** ADM remove uma inscrição específica pelo id. */
    EventoService.prototype.removerInscrito = async function (idInscricao) {
        return await this._http.delete('/detalheEvento', { idInscricao: idInscricao });
    };

    // ── Escrita (/controlarEvento — todas com transação no backend) ────────

    EventoService.prototype.cadastrar = async function (evento) {
        return await this._http.postJson('/controlarEvento',
            Object.assign({ acao: 'criar' }, evento.paraJson()));
    };

    EventoService.prototype.alterar = async function (evento) {
        return await this._http.putJson('/controlarEvento', evento.paraJson());
    };

    EventoService.prototype.excluir = async function (idEvento) {
        return await this._http.delete('/controlarEvento', { idEvento: idEvento });
    };

    // ── Operações de estado (RF_F1) ────────────────────────────────────────

    // novaDataEvento: obrigatório ao reabrir cancelado; omitido nos demais casos
    EventoService.prototype.abrir = async function (idEvento, novaDataEvento) {
        var payload = { acao: 'abrir', idEvento: idEvento };
        if (novaDataEvento) payload.novaDataEvento = novaDataEvento;
        return await this._http.postJson('/controlarEvento', payload);
    };

    EventoService.prototype.finalizar = async function (idEvento) {
        return await this._http.postJson('/controlarEvento',
            { acao: 'finalizar', idEvento: idEvento });
    };

    EventoService.prototype.cancelar = async function (idEvento) {
        return await this._http.postJson('/controlarEvento',
            { acao: 'cancelar', idEvento: idEvento });
    };

    EventoService.prototype.adiar = async function (idEvento, novaDataEvento) {
        return await this._http.postJson('/controlarEvento',
            { acao: 'adiar', idEvento: idEvento, novaDataEvento: novaDataEvento });
    };

    return {
        getInstance: function () {
            if (!instancia) instancia = new EventoService();
            return instancia;
        }
    };

})();
