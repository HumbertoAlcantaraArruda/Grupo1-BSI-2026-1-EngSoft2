(function ($) {

    if (window.AGAPE.Utils.Auth.getInstance().estaLogado()) {
        window.location.href = './inscricoes/inscricao.html';
        return;
    }

    var ctrl = window.AGAPE.Controllers.AuthController.getInstance();

    var $imgLogo = $('#login-logo');
    var $form = $('#login-form');
    var $inputEmail = $('#email');
    var $inputSenha = $('#senha');
    var $btnLogin = $('#btn-login');
    var $alertBox = $('#login-alert');
    var $alertMsg = $('#login-alert-msg');
    var $emailError = $('#email-error');
    var $senhaError = $('#senha-error');
    var $toggleBtn = $('#toggle-password');

    async function inicializar() {
        await _carregarLogo();
        _vincularEventos();
    }

    function _vincularEventos() {

        $toggleBtn.on('click', function (e) {
            e.preventDefault();
            var $icon = $toggleBtn.find('i');
            var isPassword = $inputSenha.prop('type') === 'password';

            $inputSenha.prop('type', isPassword ? 'text' : 'password');
            $icon.toggleClass('bi-eye bi-eye-slash');
        });

        // Ocultar alertas ao digitar
        $inputEmail.on('input', _ocultarAlerta);
        $inputSenha.on('input', _ocultarAlerta);

        // Submissão do formulário
        $form.on('submit', _onSubmit);
    }


    async function _carregarLogo() {
        try {
            var resultado = await ctrl.carregarLogo();
            if (resultado.status === 'ok' && resultado.dados?.logotipoGrande) {
                $imgLogo.attr('src', '../assets/img/' + resultado.dados.logotipoGrande);
            }
        } catch (_) {
            // Mantém a imagem padrão já definida no src
        }
    }


    function _mostrarAlerta(msg) {
        $alertMsg.text(msg);
        $alertBox.addClass('visivel');
    }

    function _ocultarAlerta() {
        $alertBox.removeClass('visivel');
        $alertMsg.text('');
    }

    function _limparErros() {
        $emailError.text('');
        $senhaError.text('');
        $inputEmail.removeClass('is-invalid');
        $inputSenha.removeClass('is-invalid');
    }

    async function _onSubmit(e) {
        e.preventDefault();

        _limparErros();
        _ocultarAlerta();

        var email = $inputEmail.val().trim();
        var senha = $inputSenha.val();
        var temErro = false;

        // Validação de e-mail
        if (!email) {
            $emailError.text('Informe o e-mail.');
            $inputEmail.addClass('is-invalid');
            $inputEmail.focus();
            temErro = true;
        }

        // Validação de senha
        if (!senha) {
            $senhaError.text('Informe a senha.');
            $inputSenha.addClass('is-invalid');
            if (!temErro) {
                $inputSenha.focus();
            }
            temErro = true;
        }

        if (temErro) return;

        // Desabilita botão e exibe spinner
        $btnLogin
            .prop('disabled', true)
            .html(
                '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Entrando...'
            );

        // Realiza login
        var resultado = await ctrl.login(email, senha);

        // Reabilita botão
        $btnLogin
            .prop('disabled', false)
            .html('<i class="bi bi-box-arrow-in-right"></i> Entrar');

        // Trata resultado
        if (resultado.status === 'ok') {
            window.location.href = './inscricoes/inscricao.html';
        } else if (resultado.status === 'primeiroAcesso') {
            window.location.href = './usuarios/trocarSenha.html';
        } else if (resultado.status === 'parametrizacaoPendente') {
            window.location.href = './parametrizacoes/parametrizacao.html';
        } else {
            _mostrarAlerta('Inválido - Revise suas credenciais');
        }
    }

    $(document).ready(inicializar);

})(jQuery);