/* InscricaoController — fachada frontend do RF_F3: Realizar Inscrição
 *
 * GRASP Controller — orquestra o fluxo sem conter regras de domínio.
 * GOF Singleton    — instância única obtida por getInstance().
 * GOF Facade       — consolida verificação de CPF, categorias e eventos
 *                    em um único ponto de acesso para a View.
 */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Controllers = window.AGAPE.Controllers || {};

window.AGAPE.Controllers.InscricaoController = (function () {

    var instancia = null;

    function InscricaoController() {
        this._service          = window.AGAPE.Services.InscricaoService.getInstance();
        this._serviceCatEvento = window.AGAPE.Services.CategoriaEventoService.getInstance();
        this._serviceEvento    = window.AGAPE.Services.EventoService.getInstance();
    }

    // ── Passo 1: Identificação (Fluxo 2.1) ────────────────────────────────

    /** Verifica se o CPF pertence a um Paroquiano ativo. */
    InscricaoController.prototype.verificarCpf = async function (cpf) {
        var cpfLimpo = cpf.replace(/\D/g, '');
        if (cpfLimpo.length !== 11)
            return { status: 'error', erro: 'CPF deve conter 11 dígitos.' };
        return await this._service.verificarCpf(cpfLimpo);
    };

    // ── Passo 2: Categorias (Fluxo 4.1) ───────────────────────────────────

    /** Carrega categorias de eventos ativas. */
    InscricaoController.prototype.carregarCategorias = async function () {
        return await this._serviceCatEvento.listar();
    };

    // ── Passo 3: Eventos por Categoria (Fluxo 6.1) ────────────────────────

    /**
     * Carrega eventos ativos da categoria selecionada.
     * GOF Facade — consolida a chamada de filtro em um único método.
     */
    InscricaoController.prototype.carregarEventosPorCategoria = async function (idCatEvento) {
        if (!idCatEvento) return { status: 'error', erro: 'Selecione uma categoria.' };
        // Filtra apenas eventos Ativos (idEventoStatus=1)
        return await this._serviceEvento.listar({ idCatEvento: idCatEvento, idEventoStatus: 1 });
    };

    // ── Passo 5: Confirmação ───────────────────────────────────────────────

    /** Confirma a inscrição após validação local no model. */
    InscricaoController.prototype.confirmar = async function (idUsuario, idEvento) {
        // GRASP Information Expert — model valida antes de chamar o service
        var inscricao = new window.AGAPE.Models.Inscricao({ idUsuario: idUsuario, idEvento: idEvento });
        var erros = inscricao.validar();
        if (erros.length > 0) return { status: 'error', erro: erros.join(' ') };
        return await this._service.confirmar(inscricao);
    };

    return {
        getInstance: function () {
            if (!instancia) instancia = new InscricaoController();
            return instancia;
        }
    };

})();
