/* =====================================================================
   CategoriaEventoController — Controller do caso de uso CategoriaEvento
   Padrão: Singleton + Façade (GOF)
   GRASP Controller: único ponto de entrada da View para o caso de uso
   GRASP Creator: cria instâncias de CategoriaEvento
   Observação: filtros nome e ativo são enviados à API como query params
   ===================================================================== */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Controllers = window.AGAPE.Controllers || {};

window.AGAPE.Controllers.CategoriaEventoController = (function () {

    var instancia = null;

    /* ---- Construtor ------------------------------------------------- */
    function CategoriaEventoController() {
        this._service  = window.AGAPE.Services.CategoriaEventoService.getInstance();
        this._validador = window.AGAPE.Utils.Validador.getInstance();
    }

    /* ---- Listar todas as categorias (sem filtros) ------------------ */
    CategoriaEventoController.prototype.listar = async function () {
        return await this._service.listar();
    };

    /* ---- Filtrar via query string (API suporta nome e ativo) ------ */
    /* filtros: { nome?, ativo? }                                       */
    /* ativo: 'true' | 'false' | '' (omitido — lista todos)            */
    CategoriaEventoController.prototype.filtrar = async function (filtros) {
        var params = {};

        if (filtros.nome && filtros.nome.trim() !== '') {
            params.nome = filtros.nome.trim();
        }

        if (filtros.ativo === 'true' || filtros.ativo === 'false') {
            params.ativo = filtros.ativo;
        }

        return await this._service.listar(params);
    };

    /* ---- Cadastrar categoria (Creator: instancia CategoriaEvento) - */
    CategoriaEventoController.prototype.cadastrar = async function (dados) {
        var categoria = new window.AGAPE.Models.CategoriaEvento(dados);
        var erros = categoria.validar();

        if (erros.length > 0) {
            return { sucesso: false, erro: erros.join(' ') };
        }

        return await this._service.cadastrar(categoria);
    };

    /* ---- Alterar categoria ---------------------------------------- */
    CategoriaEventoController.prototype.alterar = async function (dados) {
        var categoria = new window.AGAPE.Models.CategoriaEvento(dados);
        var erros = categoria.validar();

        if (erros.length > 0) {
            return { sucesso: false, erro: erros.join(' ') };
        }

        return await this._service.alterar(categoria);
    };

    /* ---- Excluir categoria ---------------------------------------- */
    CategoriaEventoController.prototype.excluir = async function (id) {
        if (!id) {
            return { sucesso: false, erro: 'ID da categoria não informado.' };
        }
        return await this._service.excluir(id);
    };

    /* ---- Interface Singleton --------------------------------------- */
    return {
        getInstance: function () {
            if (!instancia) {
                instancia = new CategoriaEventoController();
            }
            return instancia;
        }
    };

})();
