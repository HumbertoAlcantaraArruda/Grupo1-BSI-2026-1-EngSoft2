/* EventoController — fachada do caso de uso Evento */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Controllers = window.AGAPE.Controllers || {};

window.AGAPE.Controllers.EventoController = (function () {

    var instancia = null;

    function EventoController() {
        this._service            = window.AGAPE.Services.EventoService.getInstance();
        this._serviceCatEvento   = window.AGAPE.Services.CategoriaEventoService.getInstance();
        this._serviceUsuario     = window.AGAPE.Services.UsuarioService.getInstance();
        this._listaCache         = [];
    }

    EventoController.prototype.listar = async function () {
        var resultado = await this._service.listar();
        if (resultado.status === 'ok' && Array.isArray(resultado.dados)) {
            this._listaCache = resultado.dados;
        }
        return resultado;
    };

    EventoController.prototype.carregarCategorias = async function () {
        return await this._serviceCatEvento.listar();
    };

    EventoController.prototype.carregarUsuarios = async function () {
        return await this._serviceUsuario.listar();
    };

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
            lista = lista.filter(function (e) {
                return String(e.idCatEvento) === idCat;
            });
        }

        if (filtros.idEventoStatus) {
            var idStatus = String(filtros.idEventoStatus);
            lista = lista.filter(function (e) {
                return String(e.idEventoStatus) === idStatus;
            });
        }

        return { status: 'ok', dados: lista };
    };

    EventoController.prototype.cadastrar = async function (dados) {
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

    return {
        getInstance: function () {
            if (!instancia) instancia = new EventoController();
            return instancia;
        }
    };

})();
