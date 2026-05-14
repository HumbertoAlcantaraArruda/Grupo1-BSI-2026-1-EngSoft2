/**
 * SessionManager — Singleton
 *
 * Responsabilidades (SRP):
 *  - Armazenar e recuperar os dados do usuário logado.
 *  - Controlar tentativas de login e bloqueio.
 *  - Gerenciar timeout de inatividade (120 min).
 */
class SessionManager {
  static #instance    = null;
  static #SESSION_KEY = 'agape_session';
  static #ATTEMPTS_KEY= 'agape_attempts';
  static #MAX_ATTEMPTS    = 5;
  static #INACTIVITY_MS   = 120 * 60 * 1000;

  #user           = null;
  #loginAttempts  = 0;
  #inactivityTimer= null;

  constructor() {
    if (SessionManager.#instance) return SessionManager.#instance;
    SessionManager.#instance = this;
    this.#loadFromStorage();
  }

  static getInstance() {
    if (!SessionManager.#instance) new SessionManager();
    return SessionManager.#instance;
  }

  // ── Sessão ─────────────────────────────────────────────────
  setUser(userData) {
    this.#user = { ...userData, loginAt: Date.now() };
    sessionStorage.setItem(SessionManager.#SESSION_KEY, JSON.stringify(this.#user));
    this.#resetAttempts();
    this.#startInactivityTimer();
  }

  getUser()          { return this.#user; }
  isAuthenticated()  { return this.#user !== null; }

  hasRole(role) {
    if (!this.#user) return false;
    const lvl = { PAROQUIANO: 1, COLABORADOR: 2, ADM: 3 };
    return (lvl[this.#user.nivel] || 0) >= (lvl[role] || 0);
  }

  logout() {
    this.#user = null;
    sessionStorage.removeItem(SessionManager.#SESSION_KEY);
    this.#stopInactivityTimer();
    window.location.replace(Router.BASE + '/index.html');
  }

  // ── Tentativas ─────────────────────────────────────────────
  incrementAttempts() {
    this.#loginAttempts++;
    localStorage.setItem(SessionManager.#ATTEMPTS_KEY, this.#loginAttempts);
    return this.#loginAttempts;
  }

  getAttempts()  { return this.#loginAttempts; }
  isLockedOut()  { return this.#loginAttempts >= SessionManager.#MAX_ATTEMPTS; }
  getMaxAttempts() { return SessionManager.#MAX_ATTEMPTS; }

  #resetAttempts() {
    this.#loginAttempts = 0;
    localStorage.removeItem(SessionManager.#ATTEMPTS_KEY);
  }

  // ── Inatividade ────────────────────────────────────────────
  #startInactivityTimer() {
    this.#stopInactivityTimer();
    const reset = () => {
      this.#stopInactivityTimer();
      this.#inactivityTimer = setTimeout(() => this.logout(), SessionManager.#INACTIVITY_MS);
    };
    ['mousemove', 'keydown', 'click', 'touchstart'].forEach(ev =>
      document.addEventListener(ev, reset, { passive: true })
    );
    reset();
  }

  #stopInactivityTimer() {
    if (this.#inactivityTimer) {
      clearTimeout(this.#inactivityTimer);
      this.#inactivityTimer = null;
    }
  }

  // ── Persistência ───────────────────────────────────────────
  #loadFromStorage() {
    try {
      const raw = sessionStorage.getItem(SessionManager.#SESSION_KEY);
      if (raw) this.#user = JSON.parse(raw);
      this.#loginAttempts = parseInt(localStorage.getItem(SessionManager.#ATTEMPTS_KEY) || '0');
      if (this.#user) this.#startInactivityTimer();
    } catch {
      this.#user = null;
    }
  }
}
