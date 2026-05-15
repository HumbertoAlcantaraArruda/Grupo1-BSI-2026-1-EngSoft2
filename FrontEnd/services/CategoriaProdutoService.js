/* =====================================================================
   CategoriaProdutoService — Camada de acesso a dados para CategoriaProduto
   Padrão: Singleton (GOF)
   SOLID SRP: única responsabilidade — chamadas HTTP para /categoriaProduto
   SOLID DIP: Controllers dependem desta interface, não de fetch direto

   Interface ICategoriaProdutoService:
   ---------------------------------------------------------------
   listar()                  → Promise<{ sucesso, dados?, erro? }>
   cadastrar(categoria)      → Promise<{ sucesso, dados?, erro? }>
   alterar(categoria)        → Promise<{ sucesso, dados?, erro? }>
   excluir(idCatProd)        → Promise<{ sucesso, dados?, erro? }>

   Observação: GET /categoriaProduto NÃO aceita filtros via query.
   Os filtros de Nome e Status são aplicados no frontend pelo Controller.
   ===================================================================== */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Services = window.AGAPE.Services || {};

window.AGAPE.Services.CategoriaProdutoService = (function () {

    var instancia = null;

    /* ---- Construtor ------------------------------------------------- */
    function CategoriaProdutoService() {
        this._http = window.AGAPE.Utils.HttpClient.getInstance();
    }

    /* ---- Listar todas as categorias (sem filtros de query) --------- */
    CategoriaProdutoService.prototype.listar = async function () {
        return await this._http.get('/categoriaProduto');
    };

    /* ---- Cadastrar nova categoria (POST x-www-form-urlencoded) ----- */
    CategoriaProdutoService.prototype.cadastrar = async function (categoria) {
        return await this._http.post('/categoriaProduto', categoria.paraFormData());
    };

    /* ---- Alterar categoria (PUT x-www-form-urlencoded) ------------- */
    CategoriaProdutoService.prototype.alterar = async function (categoria) {
        return await this._http.put('/categoriaProduto', categoria.paraFormData());
    };

    /* ---- Excluir categoria por ID ---------------------------------- */
    CategoriaProdutoService.prototype.excluir = async function (idCatProd) {
        return await this._http.delete('/categoriaProduto', { idCatProd: idCatProd });
    };

    /* ---- Interface Singleton --------------------------------------- */
    return {
        getInstance: function () {
            if (!instancia) {
                instancia = new CategoriaProdutoService();
            }
            return instancia;
        }
    };

})();
