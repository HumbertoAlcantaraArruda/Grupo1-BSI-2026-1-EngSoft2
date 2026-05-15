/* Validador — singleton para validação visual de formulários via Bootstrap */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Utils = window.AGAPE.Utils || {};

window.AGAPE.Utils.Validador = (function () {

    var instancia = null;

    function Validador() {}

    // Aciona a validação visual do Bootstrap e retorna se o formulário é válido
    Validador.prototype.validarFormulario = function (formulario) {
        if (!formulario) return false;
        formulario.classList.add('was-validated');
        return formulario.checkValidity();
    };

    Validador.prototype.resetar = function (formulario) {
        if (!formulario) return;
        formulario.classList.remove('was-validated');
        formulario.reset();
        formulario.querySelectorAll('.is-valid, .is-invalid').forEach(function (campo) {
            campo.classList.remove('is-valid', 'is-invalid');
        });
    };

    Validador.prototype.destacarCampo = function (campo, valido, mensagem) {
        if (!campo) return;
        if (valido) {
            campo.classList.remove('is-invalid');
            campo.classList.add('is-valid');
        } else {
            campo.classList.remove('is-valid');
            campo.classList.add('is-invalid');
            var feedback = campo.parentElement
                ? campo.parentElement.querySelector('.invalid-feedback')
                : campo.nextElementSibling;
            if (feedback && feedback.classList.contains('invalid-feedback') && mensagem) {
                feedback.textContent = mensagem;
            }
        }
    };

    Validador.prototype.campoPreenchido = function (valor) {
        return valor !== null && valor !== undefined && String(valor).trim() !== '';
    };

    // Exibe alerta flutuante que some automaticamente após 4 segundos
    // tipo: 'sucesso' | 'erro' | 'aviso'
    Validador.prototype.mostrarAlerta = function (mensagem, tipo) {
        var classeBs = tipo === 'sucesso' ? 'alert-success'
                     : tipo === 'aviso'   ? 'alert-warning'
                                          : 'alert-danger';
        var icone    = tipo === 'sucesso' ? 'bi-check-circle'
                     : tipo === 'aviso'   ? 'bi-exclamation-triangle'
                                          : 'bi-x-circle';

        var alerta = document.createElement('div');
        alerta.className = 'alert ' + classeBs + ' alert-dismissible fade show alerta-topo';
        alerta.setAttribute('role', 'alert');
        alerta.innerHTML =
            '<i class="bi ' + icone + ' me-2"></i>' +
            mensagem +
            '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>';

        document.body.appendChild(alerta);

        setTimeout(function () {
            if (alerta.parentElement) {
                alerta.classList.remove('show');
                setTimeout(function () {
                    if (alerta.parentElement) alerta.parentElement.removeChild(alerta);
                }, 300);
            }
        }, 4000);
    };

    return {
        getInstance: function () {
            if (!instancia) instancia = new Validador();
            return instancia;
        }
    };

})();
