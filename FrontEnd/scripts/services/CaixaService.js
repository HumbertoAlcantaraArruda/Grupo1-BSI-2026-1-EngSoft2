/**
 * CaixaService — Gerenciamento do fluxo de caixa.
 */
class CaixaService {
  #api = ApiService.getInstance();

  abrir(valorInicial, responsavelId) {
    return this.#api.post('/caixa/abrir', { valorInicial, responsavelId });
  }

  fechar(caixaId, dadosFechamento) {
    return this.#api.post(`/caixa/${caixaId}/fechar`, dadosFechamento);
  }

  buscarAberto(usuarioId) {
    return this.#api.get(`/caixa/aberto?usuarioId=${usuarioId}`);
  }

  registrarMovimentacao(caixaId, tipo, valor, descricao) {
    // tipo: 'ENTRADA' | 'SAIDA'
    return this.#api.post(`/caixa/${caixaId}/movimentacao`, { tipo, valor, descricao });
  }

  buscarExtrato(caixaId) {
    return this.#api.get(`/caixa/${caixaId}/extrato`);
  }
}
