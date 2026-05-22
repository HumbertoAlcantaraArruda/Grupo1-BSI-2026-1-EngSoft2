/* EventoController — fachada do caso de uso RF_F1: Controlar Eventos
 *
 * GRASP: Controller — recebe chamadas da View, valida via Model e delega ao Service.
 * SOLID SRP — orquestra o fluxo sem conter regras de negócio nem SQL.
 * GOF Singleton — instância única obtida por getInstance().
 */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Controllers = window.AGAPE.Controllers || {};

window.AGAPE.Controllers.EventoController = (function () {

    var instancia = null;

    function EventoController() {
        this._service          = window.AGAPE.Services.EventoService.getInstance();
        this._serviceCatEvento = window.AGAPE.Services.CategoriaEventoService.getInstance();
        this._serviceUsuario   = window.AGAPE.Services.UsuarioService.getInstance();
        this._listaCache       = [];
    }

    // ── Listagem ──────────────────────────────────────────────────────────

    EventoController.prototype.listar = async function () {
        var resultado = await this._service.listar();
        if (resultado.status === 'ok' && Array.isArray(resultado.dados)) {
            this._listaCache = resultado.dados;
        }
        return resultado;
    };

    // ── Combos auxiliares ─────────────────────────────────────────────────

    EventoController.prototype.carregarCategorias = async function () {
        return await this._serviceCatEvento.listar();
    };

    EventoController.prototype.carregarUsuarios = async function () {
        return await this._serviceUsuario.listar();
    };

    // ── Filtro em memória ─────────────────────────────────────────────────

    EventoController.prototype.filtrar = function (filtros) {
        var lista = this._listaCache;

        if (filtros.nome && filtros.nome.trim() !== '') {
            var termo = filtros.nome.trim().toLowerCase();
            lista = lista.filter(function (e) {
                return e.nome && e.nome.toLowerCase().indexOf(termo) !== -1;
            });
        }
        if (filtros.idCatEvento) {
            var idCat = String(filtros.idCatEvento);
            lista = lista.filter(function (e) { return String(e.idCatEvento) === idCat; });
        }
        if (filtros.idEventoStatus) {
            var idSt = String(filtros.idEventoStatus);
            lista = lista.filter(function (e) { return String(e.idEventoStatus) === idSt; });
        }

        return { status: 'ok', dados: lista };
    };

    // ── CRUD ──────────────────────────────────────────────────────────────

    EventoController.prototype.cadastrar = async function (dados) {
        // SOLID SRP: validação está no model (Information Expert)
        if (!dados.vagasDisp) dados.vagasDisp = dados.totVagas;
        var evento = new window.AGAPE.Models.Evento(dados);
        var erros  = evento.validar();
        if (erros.length > 0) return { status: 'error', erro: erros.join(' ') };
        return await this._service.cadastrar(evento);
    };

    EventoController.prototype.alterar = async function (dados) {
        var evento = new window.AGAPE.Models.Evento(dados);
        var erros  = evento.validar();
        if (erros.length > 0) return { status: 'error', erro: erros.join(' ') };
        return await this._service.alterar(evento);
    };

    EventoController.prototype.excluir = async function (idEvento) {
        if (!idEvento) return { status: 'error', erro: 'ID do evento não informado.' };
        return await this._service.excluir(idEvento);
    };

    // ── Operações de estado (RF_F1) ────────────────────────────────────────

    /** Abre o evento (status → Ativo). novaData obrigatório ao reabrir cancelado. */
    EventoController.prototype.abrir = async function (idEvento, novaDataEvento) {
        if (!idEvento) return { status: 'error', erro: 'ID do evento não informado.' };
        return await this._service.abrir(idEvento, novaDataEvento || null);
    };

    /** Finaliza o evento (status → Finalizado). */
    EventoController.prototype.finalizar = async function (idEvento) {
        if (!idEvento) return { status: 'error', erro: 'ID do evento não informado.' };
        return await this._service.finalizar(idEvento);
    };

    /** Cancela o evento (status → Cancelado). */
    EventoController.prototype.cancelar = async function (idEvento) {
        if (!idEvento) return { status: 'error', erro: 'ID do evento não informado.' };
        return await this._service.cancelar(idEvento);
    };

    /** Adia o evento (status → Adiado) com nova data. */
    EventoController.prototype.adiar = async function (idEvento, novaDataEvento) {
        if (!idEvento)       return { status: 'error', erro: 'ID do evento não informado.' };
        if (!novaDataEvento) return { status: 'error', erro: 'Nova data do evento é obrigatória.' };
        return await this._service.adiar(idEvento, novaDataEvento);
    };

    return {
        getInstance: function () {
            if (!instancia) instancia = new EventoController();
            return instancia;
        }
    };

})();
