/* trocarSenha.js — View: troca de senha obrigatória no primeiro acesso */

(function ($) {

    var CHAVE_EMAIL = 'agape_primeiro_acesso_email';

    var emailPendente = sessionStorage.getItem(CHAVE_EMAIL);
    if (!emailPendente) {
        window.location.replace('../index.html');
        return;
    }

    if (window.AGAPE.Utils.Auth.getInstance().estaLogado()) {
        sessionStorage.removeItem(CHAVE_EMAIL);
        window.location.replace('../produtos/produtos.html');
        return;
    }

    var ctrl = window.AGAPE.Controllers.AuthController.getInstance();

    var $form            = $('#troca-form');
    var $inputSenhaAtual = $('#senhaAtual');
    var $inputNovaSenha  = $('#novaSenha');
    var $inputConfirmar  = $('#confirmarSenha');
    var $btnTrocar       = $('#btn-trocar');
    var $alertBox        = $('#troca-alert');
    var $alertMsg        = $('#troca-alert-msg');

    $('.toggle-password').on('click', function () {
        var $alvo   = $('#' + $(this).data('alvo'));
        var visivel = $alvo.prop('type') === 'text';
        $alvo.prop('type', visivel ? 'password' : 'text');
        $(this).find('i').attr('class', visivel ? 'bi bi-eye' : 'bi bi-eye-slash');
    });

    function _mostrarAlerta(msg) {
        $alertMsg.text(msg);
        $alertBox.addClass('visivel');
    }

    function _ocultarAlerta() {
        $alertBox.removeClass('visivel');
        $alertMsg.text('');
    }

    function _erro(id, msg) {
        $('#' + id + '-error').text(msg);
        $('#' + id).addClass('is-invalid');
    }

    function _limparErros() {
        ['senhaAtual', 'novaSenha', 'confirmarSenha'].forEach(function (id) {
            $('#' + id + '-error').text('');
            $('#' + id).removeClass('is-invalid');
        });
    }

    $form.on('submit', async function (e) {
        e.preventDefault();
        _limparErros();
        _ocultarAlerta();

        var senhaAtual     = $inputSenhaAtual.val();
        var novaSenha      = $inputNovaSenha.val();
        var confirmarSenha = $inputConfirmar.val();

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

        $btnTrocar.prop('disabled', true).html(
            '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Salvando...'
        );

        var resultado = await ctrl.trocarSenha(emailPendente, senhaAtual, novaSenha);

        $btnTrocar.prop('disabled', false).html('<i class="bi bi-check-circle"></i> Definir nova senha e entrar');

        if (resultado.status === 'ok') {
            window.location.replace('../produtos/produtos.html');
        } else {
            _mostrarAlerta(resultado.erro || 'Erro ao alterar a senha. Tente novamente.');
        }
    });

}(jQuery));
