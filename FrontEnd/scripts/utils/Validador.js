/**
 * Validador — Singleton utilitário de validação de formulários.
 *
 * Integra com Bootstrap 5 (classe was-validated + feedback inline).
 * Complementa a validação nativa do HTML5 com regras de negócio customizadas.
 *
 * Padrões aplicados:
 *   SOLID / SRP   → única responsabilidade: validar formulários e campos.
 *   SOLID / OCP   → novas regras adicionadas via Validador.registrarRegra()
 *                   sem alterar código existente.
 *   SOLID / ISP   → interface mínima: validarFormulario(), marcarInvalido(),
 *                   marcarValido(), limpar(). Não mistura com persistência.
 *   GOF  / Singleton → instância única.
 *   GRASP / High Cohesion → só faz validação; não formata, não faz fetch.
 *
 * Uso típico no Controller:
 *   const v = Validador.getInstance();
 *   if (!v.validarFormulario(form)) return;
 *   const cpfOk = v.validarCampo(document.getElementById('cpf'), 'cpf', m.validarCpf.bind(m));
 *   if (!cpfOk) return;
 */
class Validador {
  /* ── Singleton ──────────────────────────────────────────────── */
  static #instancia = null;

  /* ── OCP: mapa de regras customizadas ───────────────────────
     Chave: nome da regra. Valor: { fn: (valor) => bool, msg: string }  */
  static #regras = {};

  constructor() {
    if (Validador.#instancia) return Validador.#instancia;
    Validador.#instancia = this;
  }

  static getInstance() {
    if (!Validador.#instancia) new Validador();
    return Validador.#instancia;
  }

  /* ── OCP: extensão de regras ─────────────────────────────── */

  /**
   * Registra uma regra de validação customizada (sem modificar a classe).
   *
   * @param {string}   nome    - identificador (ex: 'cpf', 'placa')
   * @param {Function} fn      - (valor: string) => boolean
   * @param {string}   mensagem - exibida ao usuário quando inválido
   *
   * Exemplo:
   *   Validador.registrarRegra('placa', v => /^[A-Z]{3}\d{4}$/.test(v), 'Placa inválida.');
   */
  static registrarRegra(nome, fn, mensagem) {
    Validador.#regras[nome] = { fn, mensagem };
  }

  /* ── API pública ──────────────────────────────────────────── */

  /**
   * Valida um formulário inteiro pelo mecanismo nativo do Bootstrap 5.
   * Adiciona a classe was-validated para exibir feedback inline.
   *
   * @param {HTMLFormElement} form
   * @returns {boolean} true se o formulário é válido
   */
  validarFormulario(form) {
    form.classList.add('was-validated');
    return form.checkValidity();
  }

  /**
   * Remove o estado de validação do formulário e faz reset dos campos.
   *
   * @param {HTMLFormElement} form
   */
  limpar(form) {
    form.classList.remove('was-validated');
    form.reset();
    form.querySelectorAll('.is-invalid, .is-valid').forEach(el => {
      el.classList.remove('is-invalid', 'is-valid');
    });
  }

  /**
   * Remove apenas as classes de validação (sem resetar valores).
   *
   * @param {HTMLFormElement} form
   */
  limparClasses(form) {
    form.classList.remove('was-validated');
    form.querySelectorAll('.is-invalid, .is-valid').forEach(el => {
      el.classList.remove('is-invalid', 'is-valid');
    });
  }

  /**
   * Marca um campo como inválido e exibe mensagem no .invalid-feedback adjacente.
   *
   * @param {HTMLElement} campo
   * @param {string}      mensagem
   */
  marcarInvalido(campo, mensagem) {
    campo.classList.remove('is-valid');
    campo.classList.add('is-invalid');
    const feedback = campo.parentElement?.querySelector('.invalid-feedback')
                  ?? campo.nextElementSibling;
    if (feedback && feedback.classList.contains('invalid-feedback')) {
      feedback.textContent = mensagem;
    }
  }

  /**
   * Marca um campo como válido.
   *
   * @param {HTMLElement} campo
   */
  marcarValido(campo) {
    campo.classList.remove('is-invalid');
    campo.classList.add('is-valid');
  }

  /**
   * Remove marcação de validação de um campo específico.
   *
   * @param {HTMLElement} campo
   */
  limparCampo(campo) {
    campo.classList.remove('is-invalid', 'is-valid');
  }

  /**
   * Valida um campo contra uma função customizada e marca visualmente.
   *
   * @param {HTMLElement} campo
   * @param {Function}    fnValidacao  - (valor: string) => boolean
   * @param {string}      mensagem     - mensagem de erro
   * @returns {boolean}
   */
  validarCampo(campo, fnValidacao, mensagem) {
    if (!campo.value.trim()) {
      // Campo vazio: delegar ao Bootstrap (required nativo)
      this.limparCampo(campo);
      return false;
    }
    const valido = fnValidacao(campo.value);
    if (valido) {
      this.marcarValido(campo);
    } else {
      this.marcarInvalido(campo, mensagem);
    }
    return valido;
  }

  /**
   * Aplica uma regra registrada via registrarRegra() a um campo.
   *
   * @param {HTMLElement} campo
   * @param {string}      nomeRegra
   * @returns {boolean}
   */
  aplicarRegra(campo, nomeRegra) {
    const regra = Validador.#regras[nomeRegra];
    if (!regra) throw new Error(`Regra não registrada: "${nomeRegra}"`);
    return this.validarCampo(campo, regra.fn, regra.mensagem);
  }

  /**
   * Exibe lista de erros retornada por Model.validar() em um container.
   * O container deve existir no HTML com classe d-none por padrão.
   *
   * @param {string[]} erros
   * @param {string}   [seletor='#form-erros'] - CSS selector do <ul> ou <div>
   */
  exibirErros(erros, seletor = '#form-erros') {
    const container = document.querySelector(seletor);
    if (!container) return;
    if (!erros.length) {
      container.classList.add('d-none');
      container.innerHTML = '';
      return;
    }
    container.classList.remove('d-none');
    container.innerHTML = erros.map(e => `<li>${e}</li>`).join('');
  }

  /**
   * Configura validação em tempo real em um campo (ao sair do foco).
   * Ideal para CPF, CNPJ — valida ao blur, não ao input.
   *
   * @param {HTMLElement} campo
   * @param {Function}    fnValidacao
   * @param {string}      mensagem
   */
  configurarBlur(campo, fnValidacao, mensagem) {
    campo.addEventListener('blur', () => {
      if (!campo.value.trim()) return; // ignora campo vazio (Bootstrap cuida do required)
      this.validarCampo(campo, fnValidacao, mensagem);
    });
    // Limpa marcação enquanto digita para não irritar o usuário
    campo.addEventListener('input', () => this.limparCampo(campo));
  }
}
