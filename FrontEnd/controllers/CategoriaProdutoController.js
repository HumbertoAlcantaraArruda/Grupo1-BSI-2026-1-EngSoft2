/* =====================================================================
   CategoriaProdutoController — Controller do caso de uso CategoriaProduto
   Padrão: Singleton + Façade (GOF)
   GRASP Controller: único ponto de entrada da View para o caso de uso
   GRASP Creator: cria instâncias de CategoriaProduto
   Observação: filtros são aplicados no frontend (API não suporta query filters)
   ===================================================================== */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Controllers = window.AGAPE.Controllers || {};

window.AGAPE.Controllers.CategoriaProdutoController = (function () {

    var instancia = null;

    /* ---- Construtor ------------------------------------------------- */
    function CategoriaProdutoController() {
        this._service  = window.AGAPE.Services.CategoriaProdutoService.getInstance();
        this._validador = window.AGAPE.Utils.Validador.getInstance();
        /* Cache da lista completa para filtragem no frontend */
        this._listaCache = [];
    }

    /* ---- Listar todas as categorias e armazenar em cache ---------- */
    CategoriaProdutoController.prototype.listar = async function () {
        var resultado = await this._service.listar();
        if (resultado.sucesso && Array.isArray(resultado.dados)) {
            this._listaCache = resultado.dados;
        }
        return resultado;
    };

    /* ---- Filtrar no frontend (API não aceita query params) -------- */
    /* filtros: { nome?, status? }                                      */
    /* status: 'ativo' | 'inativo' | '' (todos)                        */
    CategoriaProdutoController.prototype.filtrar = function (filtros) {
        var lista = this._listaCache;

        if (filtros.nome && filtros.nome.trim() !== '') {
            var termo = filtros.nome.trim().toLowerCase();
            lista = lista.filter(function (c) {
                return c.nome && c.nome.toLowerCase().indexOf(termo) !== -1;
            });
        }

        if (filtros.status === 'ativo') {
            lista = lista.filter(function (c) {
                return c.ativo === true || c.ativo === 1 || c.ativo === 'true';
            });
        } else if (filtros.status === 'inativo') {
            lista = lista.filter(function (c) {
                return c.ativo === false || c.ativo === 0 || c.ativo === 'false';
            });
        }

        return { sucesso: true, dados: lista };
    };

    /* ---- Cadastrar categoria (Creator: instancia CategoriaProduto) */
    CategoriaProdutoController.prototype.cadastrar = async function (dados) {
        var categoria = new window.AGAPE.Models.CategoriaProduto(dados);
        var erros = categoria.validar();

        if (erros.length > 0) {
            return { sucesso: false, erro: erros.join(' ') };
        }

        return await this._service.cadastrar(categoria);
    };

    /* ---- Alterar categoria ---------------------------------------- */
    CategoriaProdutoController.prototype.alterar = async function (dados) {
        var categoria = new window.AGAPE.Models.CategoriaProduto(dados);
        var erros = categoria.validar();

        if (erros.length > 0) {
            return { sucesso: false, erro: erros.join(' ') };
        }

        return await this._service.alterar(categoria);
    };

    /* ---- Excluir categoria ---------------------------------------- */
    CategoriaProdutoController.prototype.excluir = async function (idCatProd) {
        if (!idCatProd) {
            return { sucesso: false, erro: 'ID da categoria não informado.' };
        }
        return await this._service.excluir(idCatProd);
    };

    /* ---- Interface Singleton --------------------------------------- */
    return {
        getInstance: function () {
            if (!instancia) {
                instancia = new CategoriaProdutoController();
            }
            return instancia;
        }
    };

})();
