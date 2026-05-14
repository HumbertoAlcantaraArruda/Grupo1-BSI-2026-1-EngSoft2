/**
 * ParametrizacaoFacade — Singleton / Façade
 *
 * Responsabilidades:
 *   1. Carregar os dados da parametrização UMA vez por sessão (cache).
 *   2. Verificar, em todo acesso, se a parametrização já existe no banco;
 *      se não existir, redirecionar automaticamente para a tela de configuração.
 *   3. Fornecer a todas as telas: logo, razão social, nome fantasia, CNPJ etc.
 *   4. Invalidar o cache após o usuário salvar a parametrização.
 *
 * Padrões aplicados:
 *   GOF  / Singleton  → instância única; dados carregados 1 vez por sessão.
 *   GOF  / Façade     → esconde a complexidade de verificar/carregar/cachear
 *                       parametrização. O consumer chama apenas inicializar().
 *   SOLID / SRP       → única responsabilidade: gerenciar o ciclo de vida dos
 *                       dados da parametrização da empresa.
 *   GRASP / Low Coupling → qualquer tela acessa ParametrizacaoFacade.getInstance()
 *                          sem conhecer ApiService ou sessionStorage.
 *
 * Fluxo de uso (em DashboardController, por exemplo):
 *   const facade = ParametrizacaoFacade.getInstance();
 *   await facade.inicializar({ redirecionarSeVazio: true });
 *   document.getElementById('empresa-nome').textContent = facade.razaoSocial;
 *
 * Ordem de carregamento (HTML):
 *   ApiService.js  →  SessionManager.js  →  Router.js  →  ParametrizacaoFacade.js
 */
class ParametrizacaoFacade {
  /* ── Singleton ──────────────────────────────────────────────── */
  static #instancia = null;

  #api;
  #dados      = null;   // cache em memória (válido por toda a sessão)
  #carregando = false;  // mutex simples para evitar requisições paralelas

  constructor() {
    if (ParametrizacaoFacade.#instancia) return ParametrizacaoFacade.#instancia;
    this.#api = ApiService.getInstance();
    ParametrizacaoFacade.#instancia = this;
  }

  static getInstance() {
    if (!ParametrizacaoFacade.#instancia) new ParametrizacaoFacade();
    return ParametrizacaoFacade.#instancia;
  }

  /* ── API pública ──────────────────────────────────────────── */

  /**
   * Carrega a parametrização do backend (apenas na primeira chamada por sessão).
   * Nas chamadas seguintes, retorna o cache imediatamente.
   *
   * @param {object}  [opcoes]
   * @param {boolean} [opcoes.redirecionarSeVazio=false]
   *        Se true e não houver parametrização cadastrada, redireciona
   *        automaticamente para a tela de configuração.
   * @returns {Promise<object|null>} dados da parametrização ou null se não configurada
   */
  async inicializar({ redirecionarSeVazio = false } = {}) {
    // Cache hit: retorna imediatamente
    if (this.#dados !== null) return this.#dados;

    // Evita requisições concorrentes
    if (this.#carregando) {
      await this.#aguardarCarregamento();
      return this.#dados;
    }

    this.#carregando = true;

    try {
      const resp = await this.#api.get('/parametrizacao');
      this.#dados = resp;
    } catch (err) {
      if (err.status === 404) {
        this.#dados = null;
        if (redirecionarSeVazio) {
          this.#redirecionarParaParametrizacao();
          return null;
        }
      } else {
        // Erro de rede ou servidor — não redireciona, apenas loga
        console.warn('[ParametrizacaoFacade] Erro ao carregar parametrização:', err.message);
        this.#dados = null;
      }
    } finally {
      this.#carregando = false;
    }

    return this.#dados;
  }

  /**
   * Invalida o cache. Deve ser chamado pelo ParametrizacaoController
   * logo após salvar com sucesso, para forçar recarga na próxima tela.
   */
  invalidar() {
    this.#dados = null;
  }

  /* ── Getters de conveniência ─────────────────────────────── */

  /** @type {boolean} */
  get estaConfigurado() { return this.#dados !== null; }

  /** @type {string} */
  get razaoSocial()  { return this.#dados?.razaoSocial  ?? 'AGAPE'; }

  /** @type {string} */
  get nomeFantasia() { return this.#dados?.nomeFantasia ?? ''; }

  /** @type {string} */
  get cnpj()         { return this.#dados?.cnpj         ?? ''; }

  /** @type {string|null} URL da logo principal (quadrada) */
  get logoUrl()      { return this.#dados?.logoUrl      ?? null; }

  /** @type {string|null} URL da logo horizontal */
  get logoHUrl()     { return this.#dados?.logoHUrl     ?? null; }

  /** @type {string} */
  get cidade()       { return this.#dados?.cidade       ?? ''; }

  /** @type {string} */
  get estado()       { return this.#dados?.estado       ?? ''; }

  /** @type {string} */
  get email()        { return this.#dados?.email        ?? ''; }

  /** @type {string} */
  get telefone()     { return this.#dados?.telefone1    ?? ''; }

  /** @type {string} Moeda padrão (ex: 'BRL'). */
  get moeda()        { return this.#dados?.moeda        ?? 'BRL'; }

  /**
   * Aplica logo e razão social em elementos da página.
   * Conveniente para evitar repetição em todos os controllers.
   *
   * @param {object} [seletores]
   * @param {string} [seletores.logo='#empresa-logo']        - <img> da logo
   * @param {string} [seletores.nome='#empresa-nome']        - <span> da razão social
   * @param {string} [seletores.logoH='#empresa-logo-h']     - <img> da logo horizontal
   */
  aplicarNaTela({
    logo   = '#empresa-logo',
    nome   = '#empresa-nome',
    logoH  = '#empresa-logo-h',
  } = {}) {
    const logoEl  = document.querySelector(logo);
    const nomeEl  = document.querySelector(nome);
    const logoHEl = document.querySelector(logoH);

    if (logoEl  && this.logoUrl)  { logoEl.src  = this.logoUrl;  logoEl.classList.remove('d-none'); }
    if (logoHEl && this.logoHUrl) { logoHEl.src = this.logoHUrl; logoHEl.classList.remove('d-none'); }
    if (nomeEl) nomeEl.textContent = this.razaoSocial;
  }

  /* ── Privados ────────────────────────────────────────────── */

  #redirecionarParaParametrizacao() {
    const base = typeof Router !== 'undefined' ? Router.BASE : '';
    const url  = `${base}/views/parametrizacao/index.html`;
    // Evita loop infinito: não redireciona se já estiver na tela de parametrização
    if (window.location.pathname.includes('parametrizacao')) return;
    window.location.replace(url);
  }

  /**
   * Aguarda o término do carregamento atual (mutex simples com polling).
   * Resolve em até ~1 segundo; após isso retorna o que houver.
   */
  #aguardarCarregamento() {
    return new Promise(resolve => {
      let tentativas = 0;
      const intervalo = setInterval(() => {
        if (!this.#carregando || tentativas++ > 20) {
          clearInterval(intervalo);
          resolve();
        }
      }, 50);
    });
  }
}
