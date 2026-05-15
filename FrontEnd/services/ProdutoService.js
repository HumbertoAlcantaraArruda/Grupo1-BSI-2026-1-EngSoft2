/* =====================================================================
   ProdutoService — Camada de acesso a dados para Produto
   Padrão: Singleton (GOF)
   SOLID SRP: única responsabilidade — chamadas HTTP para /produto
   SOLID DIP: Controllers dependem desta interface, não de fetch direto

   Interface IProdutoService (contrato esperado pelos Controllers):
   ---------------------------------------------------------------
   listar(filtros)      → Promise<{ sucesso, dados?, erro? }>
   cadastrar(produto)   → Promise<{ sucesso, dados?, erro? }>
   alterar(produto)     → Promise<{ sucesso, dados?, erro? }>
   excluir(idProd)      → Promise<{ sucesso, dados?, erro? }>
   listarCategorias()   → Promise<{ sucesso, dados?, erro? }>
   ===================================================================== */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Services = window.AGAPE.Services || {};

window.AGAPE.Services.ProdutoService = (function () {

    var instancia = null;

    /* ---- Construtor ------------------------------------------------- */
    function ProdutoService() {
        this._http = window.AGAPE.Utils.HttpClient.getInstance();
    }

    /* ---- Listar produtos com filtros opcionais --------------------- */
    /* Filtros: { nome?, idCatProd?, operador?, quantidade? }           */
    ProdutoService.prototype.listar = async function (filtros) {
        return await this._http.get('/produto', filtros || {});
    };

    /* ---- Cadastrar novo produto (POST x-www-form-urlencoded) ------- */
    ProdutoService.prototype.cadastrar = async function (produto) {
        return await this._http.post('/produto', produto.paraFormData());
    };

    /* ---- Alterar produto existente (PUT x-www-form-urlencoded) ----- */
    ProdutoService.prototype.alterar = async function (produto) {
        return await this._http.put('/produto', produto.paraFormData());
    };

    /* ---- Excluir produto por ID ------------------------------------ */
    ProdutoService.prototype.excluir = async function (idProd) {
        return await this._http.delete('/produto', { idProd: idProd });
    };

    /* ---- Listar categorias de produto para popular selects --------- */
    ProdutoService.prototype.listarCategorias = async function () {
        return await this._http.get('/categoriaProduto');
    };

    /* ---- Interface Singleton --------------------------------------- */
    return {
        getInstance: function () {
            if (!instancia) {
                instancia = new ProdutoService();
            }
            return instancia;
        }
    };

})();
