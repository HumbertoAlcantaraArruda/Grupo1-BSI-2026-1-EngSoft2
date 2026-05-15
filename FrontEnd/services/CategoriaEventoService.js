/* =====================================================================
   CategoriaEventoService — Camada de acesso a dados para CategoriaEvento
   Padrão: Singleton (GOF)
   SOLID SRP: única responsabilidade — chamadas HTTP para /categoriaEvento
   SOLID DIP: Controllers dependem desta interface, não de fetch direto

   Interface ICategoriaEventoService:
   ---------------------------------------------------------------
   listar(filtros)           → Promise<{ sucesso, dados?, erro? }>
   cadastrar(categoria)      → Promise<{ sucesso, dados?, erro? }>
   alterar(categoria)        → Promise<{ sucesso, dados?, erro? }>
   excluir(id)               → Promise<{ sucesso, dados?, erro? }>

   Filtros suportados pela rota GET /categoriaEvento:
     ?nome={nome}  ?ativo={true|false}
   ===================================================================== */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Services = window.AGAPE.Services || {};

window.AGAPE.Services.CategoriaEventoService = (function () {

    var instancia = null;

    /* ---- Construtor ------------------------------------------------- */
    function CategoriaEventoService() {
        this._http = window.AGAPE.Utils.HttpClient.getInstance();
    }

    /* ---- Listar categorias com filtros opcionais (nome, ativo) ---- */
    CategoriaEventoService.prototype.listar = async function (filtros) {
        return await this._http.get('/categoriaEvento', filtros || {});
    };

    /* ---- Cadastrar nova categoria (POST — envia apenas nome) ------ */
    CategoriaEventoService.prototype.cadastrar = async function (categoria) {
        return await this._http.post('/categoriaEvento', categoria.paraFormDataCadastro());
    };

    /* ---- Alterar categoria (PUT — envia id, ativo, nome) ---------- */
    CategoriaEventoService.prototype.alterar = async function (categoria) {
        return await this._http.put('/categoriaEvento', categoria.paraFormData());
    };

    /* ---- Excluir categoria por ID --------------------------------- */
    CategoriaEventoService.prototype.excluir = async function (id) {
        return await this._http.delete('/categoriaEvento', { id: id });
    };

    /* ---- Interface Singleton --------------------------------------- */
    return {
        getInstance: function () {
            if (!instancia) {
                instancia = new CategoriaEventoService();
            }
            return instancia;
        }
    };

})();
