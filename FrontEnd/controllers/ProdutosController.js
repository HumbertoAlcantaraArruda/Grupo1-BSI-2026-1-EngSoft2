/* =====================================================================
   ProdutosController — Controller do caso de uso Produtos
   Padrão: Singleton + Façade (GOF)
   GRASP Controller: único ponto de entrada da View para o caso de uso
   GRASP Creator: cria instâncias de Produto
   SOLID SRP: coordena Model + Service + Validador sem assumir papel deles
   ===================================================================== */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Controllers = window.AGAPE.Controllers || {};

window.AGAPE.Controllers.ProdutosController = (function () {

    var instancia = null;

    /* ---- Construtor ------------------------------------------------- */
    function ProdutosController() {
        /* Depende de abstrações (DIP): Service e utilitários via suas interfaces */
        this._service  = window.AGAPE.Services.ProdutoService.getInstance();
        this._validador = window.AGAPE.Utils.Validador.getInstance();
    }

    /* ---- Listar todos os produtos (sem filtros) ------------------- */
    /* Fachada: a View chama este método e recebe dados prontos         */
    ProdutosController.prototype.listar = async function () {
        return await this._service.listar();
    };

    /* ---- Filtrar produtos — monta apenas os params preenchidos ---- */
    ProdutosController.prototype.filtrar = async function (filtros) {
        var params = {};

        if (filtros.nome && filtros.nome.trim() !== '') {
            params.nome = filtros.nome.trim();
        }

        if (filtros.idCatProd && filtros.idCatProd !== '') {
            params.idCatProd = filtros.idCatProd;
        }

        /* Filtro composto: operador + quantidade (ambos obrigatórios) */
        if (filtros.operador && filtros.operador !== '' &&
            filtros.quantidade !== undefined && filtros.quantidade !== '') {
            params.operador  = filtros.operador;
            params.quantidade = filtros.quantidade;
        }

        return await this._service.listar(params);
    };

    /* ---- Cadastrar produto (Creator: instancia Produto aqui) ------ */
    ProdutosController.prototype.cadastrar = async function (dados) {
        var produto = new window.AGAPE.Models.Produto(dados);
        var erros = produto.validar();

        if (erros.length > 0) {
            return { status: 'error', erro: erros.join(' ') };
        }

        return await this._service.cadastrar(produto);
    };

    /* ---- Alterar produto ------------------------------------------ */
    ProdutosController.prototype.alterar = async function (dados) {
        var produto = new window.AGAPE.Models.Produto(dados);
        var erros = produto.validar();

        if (erros.length > 0) {
            return { status: 'error', erro: erros.join(' ') };
        }

        return await this._service.alterar(produto);
    };

    /* ---- Excluir produto ------------------------------------------ */
    ProdutosController.prototype.excluir = async function (idProd) {
        if (!idProd) {
            return { status: 'error', erro: 'ID do produto não informado.' };
        }
        return await this._service.excluir(idProd);
    };

    /* ---- Carregar categorias para o select de filtro/formulário --- */
    ProdutosController.prototype.carregarCategorias = async function () {
        return await this._service.listarCategorias();
    };

    /* ---- Interface Singleton --------------------------------------- */
    return {
        getInstance: function () {
            if (!instancia) {
                instancia = new ProdutosController();
            }
            return instancia;
        }
    };

})();
