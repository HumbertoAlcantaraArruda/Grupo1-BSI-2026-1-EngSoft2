/**
 * VendasService — CRUD e operações de vendas.
 */
class VendasService {
  #api = ApiService.getInstance();

  registrar(itens, formaPagamentoId, caixaId, paroquianoId = null) {
    return this.#api.post('/vendas', { itens, formaPagamentoId, caixaId, paroquianoId });
  }

  buscar(filtros = {}) {
    const params = new URLSearchParams(filtros).toString();
    return this.#api.get(`/vendas${params ? '?' + params : ''}`);
  }

  buscarPorId(id) {
    return this.#api.get(`/vendas/${id}`);
  }

  registrarDevolucao(vendaId, itens, opcao) {
    // opcao: 'REINTEGRAR' | 'DESCARTAR'
    return this.#api.post(`/vendas/${vendaId}/devolucao`, { itens, opcao });
  }

  emitirComprovante(vendaId) {
    return this.#api.get(`/vendas/${vendaId}/comprovante`);
  }
}
