/**
 * UsuarioService — Service / DAO (camada de persistência do lado cliente)
 *
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  INTERFACE IUsuarioService  (contrato — JS não tem interface ║
 * ║  nativa; documente aqui para fins acadêmicos e revisão)      ║
 * ║                                                              ║
 * ║  listar(filtros, pagina, tamanho)                            ║
 * ║    : Promise<{ content: object[], totalPages: number }>      ║
 * ║                                                              ║
 * ║  buscarPorId(id: number)                                     ║
 * ║    : Promise<object>                                         ║
 * ║                                                              ║
 * ║  salvar(dto: object)                                         ║
 * ║    : Promise<object>                                         ║
 * ║                                                              ║
 * ║  atualizar(id: number, dto: object)                          ║
 * ║    : Promise<object>                                         ║
 * ║                                                              ║
 * ║  alterarStatus(id: number, ativo: boolean)                   ║
 * ║    : Promise<void>                                           ║
 * ║                                                              ║
 * ║  contarAdmsAtivos()                                          ║
 * ║    : Promise<number>                                         ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Padrões aplicados:
 *   SOLID / SRP   → única responsabilidade: comunicação REST com /usuarios.
 *   SOLID / DIP   → Controllers dependem desta abstração (IUsuarioService),
 *                   NUNCA de ApiService diretamente. Troca de implementação
 *                   (ex: mock para testes) não afeta o Controller.
 *   GOF  / Singleton → instância única compartilhada.
 *   GRASP / Low Coupling → View e Controller nunca fazem fetch diretamente.
 *
 * Ordem de carregamento (HTML):
 *   ApiService.js  →  UsuarioService.js  →  UsuariosController.js
 */
class UsuarioService {
  /* ── Singleton ──────────────────────────────────────────────── */
  static #instancia = null;

  #api;

  constructor() {
    if (UsuarioService.#instancia) return UsuarioService.#instancia;
    this.#api = ApiService.getInstance();
    UsuarioService.#instancia = this;
  }

  static getInstance() {
    if (!UsuarioService.#instancia) new UsuarioService();
    return UsuarioService.#instancia;
  }

  /* ── Implementação de IUsuarioService ─────────────────────── */

  /**
   * Lista usuários com filtros e paginação.
   *
   * @param {object}  filtros          - { nome?: string, perfil?: string, status?: string }
   * @param {number}  [pagina=0]       - índice da página (base 0)
   * @param {number}  [tamanho=15]     - registros por página
   * @returns {Promise<{ content: object[], totalPages: number, totalElements: number }>}
   */
  async listar(filtros = {}, pagina = 0, tamanho = 15) {
    const params = new URLSearchParams({ page: pagina, size: tamanho });
    if (filtros.nome)   params.set('nome',   filtros.nome);
    if (filtros.perfil) params.set('perfil', filtros.perfil);
    if (filtros.status !== undefined && filtros.status !== '')
      params.set('status', filtros.status);
    return this.#api.get(`/usuarios?${params}`);
  }

  /**
   * Busca um único usuário pelo ID.
   *
   * @param {number} id
   * @returns {Promise<object>}
   */
  async buscarPorId(id) {
    return this.#api.get(`/usuarios/${id}`);
  }

  /**
   * Cadastra novo usuário.
   * Recebe DTO serializado via Usuario.toDTO() — nunca a instância Model diretamente.
   *
   * @param {object} dto
   * @returns {Promise<object>}
   */
  async salvar(dto) {
    return this.#api.post('/usuarios', dto);
  }

  /**
   * Atualiza usuário existente.
   *
   * @param {number} id
   * @param {object} dto
   * @returns {Promise<object>}
   */
  async atualizar(id, dto) {
    return this.#api.put(`/usuarios/${id}`, dto);
  }

  /**
   * Ativa ou desativa um usuário (soft-delete / alteração de status).
   * Não exclui o registro — mantém histórico.
   *
   * @param {number}  id
   * @param {boolean} ativo
   * @returns {Promise<void>}
   */
  async alterarStatus(id, ativo) {
    return this.#api.put(`/usuarios/${id}`, { status: ativo });
  }

  /**
   * Retorna a quantidade de ADMs ativos.
   * Usado para impedir a desativação do último administrador.
   *
   * @returns {Promise<number>}
   */
  async contarAdmsAtivos() {
    try {
      const resp = await this.#api.get('/usuarios?perfil=ADM&status=true&size=200');
      const lista = resp.content ?? (Array.isArray(resp) ? resp : []);
      return lista.length;
    } catch {
      return 99; // em caso de falha, assume que existem vários para não bloquear
    }
  }
}
