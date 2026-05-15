/* =====================================================================
   Validador — Integração com Bootstrap form-validation
   Padrão: Singleton (GOF)
   Responsabilidade: validar formulários e destacar campos (SRP)
   ===================================================================== */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Utils = window.AGAPE.Utils || {};

window.AGAPE.Utils.Validador = (function () {

    var instancia = null;

    /* ---- Construtor ------------------------------------------------- */
    function Validador() {}

    /* ---- Ativa validação visual Bootstrap e retorna se é válido ---- */
    /* Adiciona .was-validated ao formulário, acionando .is-invalid     */
    Validador.prototype.validarFormulario = function (formulario) {
        if (!formulario) return false;
        formulario.classList.add('was-validated');
        return formulario.checkValidity();
    };

    /* ---- Reseta o estado visual de validação e limpa os campos ----- */
    Validador.prototype.resetar = function (formulario) {
        if (!formulario) return;
        formulario.classList.remove('was-validated');
        formulario.reset();
        /* Remove classes Bootstrap de estado individualmente */
        var campos = formulario.querySelectorAll('.is-valid, .is-invalid');
        campos.forEach(function (campo) {
            campo.classList.remove('is-valid', 'is-invalid');
        });
    };

    /* ---- Destacar campo individualmente com mensagem customizada --- */
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
                : null;
            if (!feedback) {
                feedback = campo.nextElementSibling;
            }
            if (feedback && feedback.classList.contains('invalid-feedback') && mensagem) {
                feedback.textContent = mensagem;
            }
        }
    };

    /* ---- Verificar se campo tem valor preenchido ------------------- */
    Validador.prototype.campoPreenchido = function (valor) {
        return valor !== null && valor !== undefined && String(valor).trim() !== '';
    };

    /* ---- Mostrar alerta flutuante (Bootstrap toast/alert) ---------- */
    Validador.prototype.mostrarAlerta = function (mensagem, tipo) {
        /* tipo: 'sucesso' | 'erro' | 'aviso' */
        var classeBs = tipo === 'sucesso'
            ? 'alert-success'
            : tipo === 'aviso'
                ? 'alert-warning'
                : 'alert-danger';

        var icone = tipo === 'sucesso'
            ? 'bi-check-circle'
            : tipo === 'aviso'
                ? 'bi-exclamation-triangle'
                : 'bi-x-circle';

        var alerta = document.createElement('div');
        alerta.className = 'alert ' + classeBs + ' alert-dismissible fade show alerta-topo';
        alerta.setAttribute('role', 'alert');
        alerta.innerHTML =
            '<i class="bi ' + icone + ' me-2"></i>' +
            mensagem +
            '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>';

        document.body.appendChild(alerta);

        /* Remove automaticamente após 4 segundos */
        setTimeout(function () {
            if (alerta.parentElement) {
                alerta.classList.remove('show');
                setTimeout(function () {
                    if (alerta.parentElement) {
                        alerta.parentElement.removeChild(alerta);
                    }
                }, 300);
            }
        }, 4000);
    };

    /* ---- Interface Singleton --------------------------------------- */
    return {
        getInstance: function () {
            if (!instancia) {
                instancia = new Validador();
            }
            return instancia;
        }
    };

})();
