/* index.js — View: login, vincula eventos ao DOM e delega ao AuthController */

(function () {

    // Se já existe uma sessão ativa, pula direto para a área logada.
    if (window.AGAPE.Utils.Auth.getInstance().estaLogado()) {
        window.location.href = './produtos.html';
        return;
    }

    var ctrl = window.AGAPE.Controllers.AuthController.getInstance();

    var imgLogo    = document.getElementById('login-logo');
    var form       = document.getElementById('login-form');
    var inputEmail = document.getElementById('email');
    var inputSenha = document.getElementById('senha');
    var btnLogin   = document.getElementById('btn-login');
    var alertBox   = document.getElementById('login-alert');
    var alertMsg   = document.getElementById('login-alert-msg');
    var emailError = document.getElementById('email-error');
    var senhaError = document.getElementById('senha-error');
    var toggleBtn  = document.getElementById('toggle-password');

    async function inicializar() {
        await _carregarLogo();

        toggleBtn.addEventListener('click', function () {
            var visivel = inputSenha.type === 'text';
            inputSenha.type = visivel ? 'password' : 'text';
            toggleBtn.querySelector('i').className = visivel ? 'bi bi-eye' : 'bi bi-eye-slash';
        });

        inputEmail.addEventListener('input', _ocultarAlerta);
        inputSenha.addEventListener('input', _ocultarAlerta);

        form.addEventListener('submit', _onSubmit);
    }

    async function _carregarLogo() {
        try {
            var resultado = await ctrl.carregarLogo();
            if (resultado.status === 'ok' && resultado.dados && resultado.dados.logotipoGrande) {
                imgLogo.src = '../assets/img/' + resultado.dados.logotipoGrande;
            }
        } catch (_) {
            // mantém a imagem padrão já definida no src
        }
    }

    function _mostrarAlerta(msg) {
        alertMsg.textContent = msg;
        alertBox.classList.add('visivel');
    }

    function _ocultarAlerta() {
        alertBox.classList.remove('visivel');
        alertMsg.textContent = '';
    }

    function _limparErros() {
        emailError.textContent = '';
        senhaError.textContent = '';
        inputEmail.classList.remove('is-invalid');
        inputSenha.classList.remove('is-invalid');
    }

    async function _onSubmit(e) {
        e.preventDefault();
        _limparErros();
        _ocultarAlerta();

        var email = inputEmail.value.trim();
        var senha = inputSenha.value;

        var temErro = false;
        if (!email) {
            emailError.textContent = 'Informe o e-mail.';
            inputEmail.classList.add('is-invalid');
            temErro = true;
        }
        if (!senha) {
            senhaError.textContent = 'Informe a senha.';
            inputSenha.classList.add('is-invalid');
            temErro = true;
        }
        if (temErro) return;

        btnLogin.disabled = true;
        btnLogin.innerHTML =
            '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Entrando...';

        var resultado = await ctrl.login(email, senha);

        btnLogin.disabled = false;
        btnLogin.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Entrar';


        if (resultado.status === 'ok') {
            window.location.href = './produtos.html';
        } else {
            _mostrarAlerta('Inválido - Revise suas credenciais');
        }
    }

    document.addEventListener('DOMContentLoaded', inicializar);

})();
