/**
 * Toast — Singleton
 * Exibe notificações flutuantes no topo direito da tela.
 * Verde = sucesso | Amarelo = alerta | Vermelho = erro | Azul-esverdeado = info
 * Auto-dismiss em 3s. Acessível via aria-live.
 */
class Toast {
  static #instance  = null;
  #container        = null;

  constructor() {
    if (Toast.#instance) return Toast.#instance;
    Toast.#instance = this;
    this.#initContainer();
  }

  static getInstance() {
    if (!Toast.#instance) new Toast();
    return Toast.#instance;
  }

  #initContainer() {
    this.#container = document.getElementById('toast-container');
    if (!this.#container) {
      this.#container = document.createElement('div');
      this.#container.id = 'toast-container';
      this.#container.className = 'toast-container';
      this.#container.setAttribute('aria-live', 'polite');
      this.#container.setAttribute('aria-atomic', 'false');
      document.body.appendChild(this.#container);
    }
  }

  #show(type, title, message = '', duration = 3000) {
    const iconMap = {
      success: 'bi-check-circle-fill',
      error:   'bi-x-circle-fill',
      warning: 'bi-exclamation-triangle-fill',
      info:    'bi-info-circle-fill',
    };

    const el = document.createElement('div');
    el.className = `toast-item toast-${type}`;
    el.setAttribute('role', 'alert');
    el.innerHTML = `
      <i class="bi ${iconMap[type] || iconMap.info} toast-icon"></i>
      <div class="toast-body">
        <div class="toast-title">${this.#escape(title)}</div>
        ${message ? `<div class="toast-message">${this.#escape(message)}</div>` : ''}
      </div>
      <button class="toast-close" aria-label="Fechar notificação">
        <i class="bi bi-x"></i>
      </button>`;

    this.#container.appendChild(el);

    const remove = () => {
      el.classList.add('removing');
      setTimeout(() => el.remove(), 300);
    };

    el.querySelector('.toast-close').addEventListener('click', remove);
    if (duration > 0) setTimeout(remove, duration);

    return el;
  }

  #escape(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  success(title, message = '') { return this.#show('success', title, message); }
  error(title, message = '')   { return this.#show('error',   title, message); }
  warning(title, message = '') { return this.#show('warning', title, message); }
  info(title, message = '')    { return this.#show('info',    title, message); }
}
