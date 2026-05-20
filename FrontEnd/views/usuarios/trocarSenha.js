/* trocarSenha.js — View: troca de senha obrigatória no primeiro acesso */

(function () {

    var CHAVE_EMAIL = 'agape_primeiro_acesso_email';

    // Se não há e-mail de primeiro acesso pendente nem sessão, volta ao login
    var emailPendente = sessionStorage.getItem(CHAVE_EMAIL);
    if (!emailPendente) {
        window.location.replace('./index.html');
        return;
    }

    // Se já está logado (sessão completa), vai para a área interna
    if (window.AGAPE.Utils.Auth.getInstance().estaLogado()) {
        sessionStorage.removeItem(CHAVE_EMAIL);
        window.location.replace('./produtos.html');
        return;
    }

    var ctrl = window.AGAPE.Controllers.AuthController.getInstance();

    var form            = document.getElementById('troca-form');
    var inputSenhaAtual = document.getElementById('senhaAtual');
    var inputNovaSenha  = document.getElementById('novaSenha');
    var inputConfirmar  = document.getElementById('confirmarSenha');
    var btnTrocar       = document.getElementById('btn-trocar');
    var alertBox        = document.getElementById('troca-alert');
    var alertMsg        = document.getElementById('troca-alert-msg');

    // Botões de mostrar/ocultar senha
    document.querySelectorAll('.toggle-password').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var alvo   = document.getElementById(this.dataset.alvo);
            var visivel = alvo.type === 'text';
            alvo.type   = visivel ? 'password' : 'text';
            this.querySelector('i').className = visivel ? 'bi bi-eye' : 'bi bi-eye-slash';
        });
    });

    function _mostrarAlerta(msg) {
        alertMsg.textContent = msg;
        alertBox.classList.add('visivel');
    }

    function _ocultarAlerta() {
        alertBox.classList.remove('visivel');
        alertMsg.textContent = '';
    }

    function _erro(id, msg) {
        var el = document.getElementById(id + '-error');
        if (el) el.textContent = msg;
        var input = document.getElementById(id);
        if (input) input.classList.add('is-invalid');
    }

    function _limparErros() {
        ['senhaAtual', 'novaSenha', 'confirmarSenha'].forEach(function (id) {
            var el = document.getElementById(id + '-error');
            if (el) el.textContent = '';
            var input = document.getElementById(id);
            if (input) input.classList.remove('is-invalid');
        });
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        _limparErros();
        _ocultarAlerta();

        var senhaAtual    = inputSenhaAtual.value;
        var novaSenha     = inputNovaSenha.value;
        var confirmarSenha = inputConfirmar.value;

        var temErro = false;

        if (!senhaAtual) {
            _erro('senhaAtual', 'Informe a senha atual.');
            temErro = true;
        }
        if (!novaSenha) {
            _erro('novaSenha', 'Informe a nova senha.');
            temErro = true;
        } else if (novaSenha.length < 8) {
            _erro('novaSenha', 'A nova senha deve ter pelo menos 8 caracteres.');
            temErro = true;
        } else if (novaSenha === senhaAtual) {
            _erro('novaSenha', 'A nova senha deve ser diferente da senha atual.');
            temErro = true;
        }
        if (!confirmarSenha) {
            _erro('confirmarSenha', 'Confirme a nova senha.');
            temErro = true;
        } else if (confirmarSenha !== novaSenha) {
            _erro('confirmarSenha', 'As senhas não coincidem.');
            temErro = true;
        }

        if (temErro) return;

        btnTrocar.disabled = true;
        btnTrocar.innerHTML =
            '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Salvando...';

        var resultado = await ctrl.trocarSenha(emailPendente, senhaAtual, novaSenha);

        btnTrocar.disabled = false;
        btnTrocar.innerHTML = '<i class="bi bi-check-circle"></i> Definir nova senha e entrar';

        if (resultado.status === 'ok') {
            window.location.replace('./produtos.html');
        } else {
            _mostrarAlerta(resultado.erro || 'Erro ao alterar a senha. Tente novamente.');
        }
    });

})();
