/**
 * AuthController — Controlador da tela de Login.
 *
 * Responsabilidades (SRP):
 *  - Aplicar máscara de CPF.
 *  - Validar campos antes de submeter.
 *  - Delegar autenticação ao AuthService.
 *  - Exibir feedback visual (erros, bloqueio, loading).
 *  - Redirecionar conforme perfil após login.
 */
class AuthController {
  static #instance = null;

  static getInstance() {
    if (!AuthController.#instance) {
      AuthController.#instance = new AuthController();
    }
    return AuthController.#instance;
  }

  #authService = new AuthService();
  #session     = SessionManager.getInstance();
  #toast       = Toast.getInstance();

  init() {
    // Redireciona quem já está logado
    if (this.#session.isAuthenticated()) {
      Router.navigateTo(Router.getHomeByRole(this.#session.getUser().nivel));
      return;
    }

    Mask.applyTo(document.getElementById('cpf'), 'cpf'); //Aplica máscara de CPF
    this.#bindTogglePassword(); // Permite mostrar/ocultar senha
    this.#bindForm(); // Configura submissão do formulário
    this.#applyLockoutIfNeeded(); // Aplica bloqueio se necessário (após 5 tentativas)
  }

  // ── Mostrar/ocultar senha ──────────────────────────────────
  #bindTogglePassword() {
    $('#toggle-password').on('click', function () {
      const $input = $('#senha');
      const isPass = $input.attr('type') === 'password';
      $input.attr('type', isPass ? 'text' : 'password');
      $(this).find('i').toggleClass('bi-eye bi-eye-slash');
    });
  }

  // ── Submissão do formulário ────────────────────────────────
  #bindForm() {
    $('#login-form').on('submit', async (e) => {
      e.preventDefault();
      if (this.#session.isLockedOut()) return;
      await this.#handleLogin();
    });
  }

  async #handleLogin() {
    // MODO DESENVOLVIMENTO — validação e autenticação desabilitadas.
    // Injeta um usuário ADM fictício para permitir navegação livre pelo sistema.

    

    this.#session.setUser({
      id:    1,
      nome:  'Administrador Dev',
      cpf:   '00000000000',
      email: 'dev@agape.local',
      nivel: 'ADM',
    });
    this.#toast.success('Modo Dev', 'Logado como Administrador (sem validação).');
    setTimeout(() => Router.navigateTo(Router.getHomeByRole('ADM')), 700);
  }

  // ── Bloqueio após 5 tentativas ─────────────────────────────
  #applyLockoutIfNeeded() {
    if (this.#session.isLockedOut()) this.#applyLockout();
  }

  #applyLockout() {
    $('#login-form input').prop('disabled', true);
    $('#btn-login').prop('disabled', true).html('<i class="bi bi-lock-fill me-2"></i>Bloqueado');
    this.#showLoginAlert('warning', 'Acesso bloqueado após 5 tentativas. Contate o administrador.');
    $('#login-error').removeClass('visible');
  }

  // ── Utilitários de UI ──────────────────────────────────────
  #setLoading(loading) {
    if (loading) {
      $('#btn-login')
        .prop('disabled', true)
        .html('<span class="spinner-border spinner-border-sm me-2" role="status"></span>Entrando...');
    } else {
      $('#btn-login')
        .prop('disabled', false)
        .html('<i class="bi bi-box-arrow-in-right me-2"></i>Entrar');
    }
  }

  #showFieldError(id, msg) {
    $(`#${id}`).text(msg).addClass('visible');
  }

  #showLoginAlert(type, msg) {
    const $el = $('#login-alert');
    $el.removeClass('alert-danger alert-warning')
       .addClass(`alert-${type}`)
       .find('#login-alert-msg').text(msg);
    $el.addClass('visible');
  }

  #clearErrors() {
    $('.field-error').removeClass('visible');
    $('#login-alert').removeClass('visible');
  }
}
