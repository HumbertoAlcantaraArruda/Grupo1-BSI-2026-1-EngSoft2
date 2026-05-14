/**
 * Sessao — Singleton de gerenciamento de sessão do usuário.
 *
 * Fornece API em português que delega para SessionManager (existente),
 * garantindo compatibilidade retroativa com controllers antigos enquanto
 * os novos usam a nomenclatura padronizada pela disciplina.
 *
 * Padrões aplicados:
 *   GOF  / Singleton → instância única (static #instancia + getInstance()).
 *   SOLID / SRP      → única responsabilidade: armazenar e expor
 *                      os dados do usuário autenticado e nível de acesso.
 *   SOLID / ISP      → interface mínima exposta:
 *                      definirUsuario(), usuario, autenticado,
 *                      temPermissao(), encerrar().
 *   GRASP / Low Coupling → Controllers/Views não acessam sessionStorage
 *                          diretamente; passam por esta fachada.
 *
 * Hierarquia de níveis (do menor para o maior):
 *   PAROQUIANO (1) < COLABORADOR (2) < ADM (3)
 *
 * Uso:
 *   const sessao = Sessao.getInstance();
 *   if (!sessao.temPermissao('ADM')) { ... }
 *   sessao.definirUsuario({ id: 1, nome: 'Maria', nivel: 'ADM' });
 *   const nome = sessao.usuario?.nome;
 *   sessao.encerrar();
 */
class Sessao {
  /* ── Singleton ──────────────────────────────────────────────── */
  static #instancia = null;

  /* Delega para SessionManager para não duplicar lógica de storage */
  #sm;

  constructor() {
    if (Sessao.#instancia) return Sessao.#instancia;
    this.#sm = SessionManager.getInstance();
    Sessao.#instancia = this;
  }

  static getInstance() {
    if (!Sessao.#instancia) new Sessao();
    return Sessao.#instancia;
  }

  /* ── API em português ────────────────────────────────────────── */

  /**
   * Armazena os dados do usuário autenticado na sessão.
   * Deve ser chamado pelo AuthController após login bem-sucedido.
   *
   * @param {object} dadosUsuario - objeto retornado pelo backend
   */
  definirUsuario(dadosUsuario) {
    this.#sm.setUser(dadosUsuario);
  }

  /**
   * Retorna os dados do usuário logado, ou null se não autenticado.
   * @type {object|null}
   */
  get usuario() {
    return this.#sm.getUser();
  }

  /**
   * Indica se existe um usuário autenticado na sessão.
   * @type {boolean}
   */
  get autenticado() {
    return this.#sm.isAuthenticated();
  }

  /**
   * Verifica se o usuário logado possui ao menos o nível indicado.
   * Exemplo: temPermissao('ADM') → true apenas para ADMs.
   *          temPermissao('COLABORADOR') → true para COLABORADOR e ADM.
   *
   * @param {string} nivel - 'ADM' | 'COLABORADOR' | 'PAROQUIANO'
   * @returns {boolean}
   */
  temPermissao(nivel) {
    return this.#sm.hasRole(nivel);
  }

  /**
   * Encerra a sessão e redireciona para a tela de login.
   */
  encerrar() {
    this.#sm.logout();
  }

  /* ── Tentativas de login (para uso em AuthController) ────────── */

  /** Incrementa contador de tentativas falhas. @returns {number} */
  incrementarTentativas()   { return this.#sm.incrementAttempts(); }

  /** Número atual de tentativas falhas. @type {number} */
  get tentativas()          { return this.#sm.getAttempts(); }

  /** Número máximo de tentativas permitidas. @type {number} */
  get maxTentativas()       { return this.#sm.getMaxAttempts(); }

  /** Indica se o acesso está bloqueado por excesso de tentativas. @type {boolean} */
  get bloqueado()           { return this.#sm.isLockedOut(); }

  /* ── Atalhos de leitura ─────────────────────────────────────── */

  /** Nome do usuário logado. @type {string} */
  get nome()   { return this.usuario?.nome  ?? ''; }

  /** Nível do usuário logado. @type {string} */
  get nivel()  { return this.usuario?.nivel ?? ''; }

  /** ID do usuário logado. @type {number|null} */
  get id()     { return this.usuario?.id    ?? null; }
}
