/* usuarios.js — View: vincula eventos ao DOM e delega ao Controller */

(function () {

    var auth = window.AGAPE.Utils.Auth.getInstance();
    if (!auth.requireLogin()) return;

    // Apenas ADM acessa esta página
    var usuarioLogado = auth.getUsuario();
    if (!usuarioLogado || usuarioLogado.nivel !== 'ADM') {
        window.location.replace('./index.html');
        return;
    }

    var ctrl      = window.AGAPE.Controllers.UsuarioController.getInstance();
    var mascaras  = window.AGAPE.Utils.Mascaras.getInstance();
    var validador = window.AGAPE.Utils.Validador.getInstance();

    var tabelaCorpo          = document.getElementById('tabela-corpo');
    var modalEl              = document.getElementById('modal-usuario');
    var formUsuario          = document.getElementById('form-usuario');
    var inputIdUsuario       = document.getElementById('idUsuario');
    var inputNome            = document.getElementById('nome');
    var inputCpf             = document.getElementById('cpf');
    var inputEmail           = document.getElementById('email');
    var selectNivel          = document.getElementById('nivel');
    var modalTitulo          = document.getElementById('modal-titulo');
    var filtrNome            = document.getElementById('filtro-nome');
    var filtrNivel           = document.getElementById('filtro-nivel');
    var filtrStatus          = document.getElementById('filtro-status');
    var btnCadastrar         = document.getElementById('btn-cadastrar');
    var btnFiltrar           = document.getElementById('btn-filtrar');
    var btnLimpar            = document.getElementById('btn-limpar');
    var btnSalvar            = document.getElementById('btn-salvar');
    var btnConfirmarStatus   = document.getElementById('btn-confirmar-status');
    var btnConfirmarExcluir  = document.getElementById('btn-confirmar-excluir');
    var btnConfirmarReset    = document.getElementById('btn-confirmar-reset');

    var modalObj        = new bootstrap.Modal(modalEl);
    var modalStatusObj  = new bootstrap.Modal(document.getElementById('modal-status'));
    var modalExcluirObj = new bootstrap.Modal(document.getElementById('modal-excluir'));
    var modalResetObj   = new bootstrap.Modal(document.getElementById('modal-reset-senha'));

    var idUsuarioLogado = usuarioLogado ? Number(usuarioLogado.idUsuario) : null;

    var idParaStatus  = null;
    var acaoStatus    = null; // 'ativar' | 'desativar'
    var idParaExcluir = null;
    var idParaReset   = null;

    var _NIVEIS = { ADM: 'Administrador', COLAB: 'Colaborador', PAROQ: 'Paroquiano' };

    async function inicializar() {
        window.AGAPE.Utils.Sidebar.inicializar();
        mascaras.aplicar('#cpf', 'cpf');
        _bindCpfValidacao();
        await _carregarLista();
    }

    function _bindCpfValidacao() {
        inputCpf.addEventListener('blur', function () {
            var digits = mascaras.apenasDigitos(inputCpf.value);

            if (digits.length === 0) {
                inputCpf.classList.remove('is-invalid', 'is-valid');
                return;
            }
            var resultado = window.AGAPE.Utils.ValidadorCpf.validar(digits);
            validador.destacarCampo(inputCpf, resultado.valido, resultado.mensagem);
        });
    }

    async function _carregarLista() {
        tabelaCorpo.innerHTML = '<tr><td colspan="6" class="tabela-vazia">Carregando...</td></tr>';
        _renderizarTabela(await ctrl.listar());
    }

    function _renderizarTabela(resultado) {
        if (resultado.status !== 'ok') {
            tabelaCorpo.innerHTML =
                '<tr><td colspan="6" class="tabela-vazia text-danger">' +
                '<i class="bi bi-exclamation-triangle me-1"></i>' +
                _escapar(resultado.erro || 'Erro ao carregar dados.') +
                '</td></tr>';
            return;
        }

        var lista = Array.isArray(resultado.dados) ? resultado.dados : [];

        if (lista.length === 0) {
            tabelaCorpo.innerHTML =
                '<tr><td colspan="6" class="tabela-vazia">' +
                '<i class="bi bi-inbox me-1"></i>Nenhum usuário encontrado.' +
                '</td></tr>';
            return;
        }

        var html = lista.map(function (u) {
            var ativo      = u.status === 1 || u.status === '1';
            var badgeStatus = ativo
                ? '<span class="badge-ativo">Ativo</span>'
                : '<span class="badge-inativo">Inativo</span>';
            var badgeNivel = _badgeNivel(u.nivel);
            var cpfFmt     = _formatarCpf(u.cpf);

            var btnToggle = ativo
                ? '<button class="btn-acao btn-desativar me-1" ' +
                  'data-id="' + u.idUsuario + '" data-nome="' + _escapar(u.nome) + '" ' +
                  'title="Desativar"><i class="bi bi-person-dash"></i></button>'
                : '<button class="btn-acao btn-ativar me-1" ' +
                  'data-id="' + u.idUsuario + '" data-nome="' + _escapar(u.nome) + '" ' +
                  'title="Ativar"><i class="bi bi-person-check"></i></button>';

            return (
                '<tr>' +
                '<td class="text-start">' + _escapar(u.nome) + '</td>' +
                '<td>' + cpfFmt + '</td>' +
                '<td>' + _escapar(u.email) + '</td>' +
                '<td>' + badgeNivel + '</td>' +
                '<td>' + badgeStatus + '</td>' +
                '<td>' +
                '<button class="btn-acao btn-editar me-1" ' +
                'data-id="'    + u.idUsuario     + '" ' +
                'data-nome="'  + _escapar(u.nome)  + '" ' +
                'data-cpf="'   + _escapar(u.cpf)   + '" ' +
                'data-email="' + _escapar(u.email) + '" ' +
                'data-nivel="' + _escapar(u.nivel) + '" ' +
                'title="Editar"><i class="bi bi-pencil"></i></button>' +
                btnToggle +
                '<button class="btn-acao btn-reset-senha me-1" ' +
                'data-id="'   + u.idUsuario      + '" ' +
                'data-nome="' + _escapar(u.nome) + '" ' +
                'title="Resetar Senha"><i class="bi bi-key"></i></button>' +
                '<button class="btn-acao btn-excluir" ' +
                'data-id="' + u.idUsuario + '" data-nome="' + _escapar(u.nome) + '" ' +
                'title="Excluir"><i class="bi bi-trash"></i></button>' +
                '</td></tr>'
            );
        }).join('');

        tabelaCorpo.innerHTML = html;
        _bindBotoesTabela();
    }

    function _badgeNivel(nivel) {
        var cores = { ADM: '#024040', COLAB: '#8C142A', PAROQ: '#6c757d' };
        var cor   = cores[nivel] || '#6c757d';
        var label = _NIVEIS[nivel] || nivel;
        return '<span style="background:' + cor + ';color:#fff;font-size:.75rem;' +
               'padding:.3em .65em;border-radius:.375rem;font-weight:500">' + label + '</span>';
    }

    function _formatarCpf(cpf) {
        var d = (cpf || '').replace(/\D/g, '');
        if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        return _escapar(cpf || '');
    }

    function _bindBotoesTabela() {
        document.querySelectorAll('.btn-editar').forEach(function (btn) {
            btn.addEventListener('click', function () { _abrirModalEdicao(this.dataset); });
        });
        document.querySelectorAll('.btn-ativar').forEach(function (btn) {
            btn.addEventListener('click', function () {
                if (Number(this.dataset.id) === idUsuarioLogado) {
                    validador.mostrarAlerta('Você não tem permissão para realizar esta ação na sua própria conta.', 'erro');
                    return;
                }
                idParaStatus = this.dataset.id;
                acaoStatus   = 'ativar';
                document.getElementById('status-msg').textContent  = 'Deseja ativar o usuário:';
                document.getElementById('status-nome').textContent = this.dataset.nome;
                btnConfirmarStatus.className = 'btn btn-success btn-sm';
                btnConfirmarStatus.innerHTML = '<i class="bi bi-person-check me-1"></i>Ativar';
                modalStatusObj.show();
            });
        });
        document.querySelectorAll('.btn-desativar').forEach(function (btn) {
            btn.addEventListener('click', function () {
                if (Number(this.dataset.id) === idUsuarioLogado) {
                    validador.mostrarAlerta('Você não tem permissão para realizar esta ação na sua própria conta.', 'erro');
                    return;
                }
                idParaStatus = this.dataset.id;
                acaoStatus   = 'desativar';
                document.getElementById('status-msg').textContent  = 'Deseja desativar o usuário:';
                document.getElementById('status-nome').textContent = this.dataset.nome;
                btnConfirmarStatus.className = 'btn btn-warning btn-sm';
                btnConfirmarStatus.innerHTML = '<i class="bi bi-person-dash me-1"></i>Desativar';
                modalStatusObj.show();
            });
        });
        document.querySelectorAll('.btn-excluir').forEach(function (btn) {
            btn.addEventListener('click', function () {
                if (Number(this.dataset.id) === idUsuarioLogado) {
                    validador.mostrarAlerta('Você não tem permissão para realizar esta ação na sua própria conta.', 'erro');
                    return;
                }
                idParaExcluir = this.dataset.id;
                document.getElementById('excluir-nome').textContent = this.dataset.nome;
                modalExcluirObj.show();
            });
        });
        document.querySelectorAll('.btn-reset-senha').forEach(function (btn) {
            btn.addEventListener('click', function () {
                idParaReset = this.dataset.id;
                document.getElementById('reset-nome').textContent = this.dataset.nome;
                modalResetObj.show();
            });
        });
    }

    btnCadastrar.addEventListener('click', function () {
        modalTitulo.textContent  = 'Cadastrar Usuário';
        validador.resetar(formUsuario);
        inputIdUsuario.value = '';
        inputNome.value      = '';
        inputCpf.value       = '';
        inputEmail.value     = '';
        selectNivel.value    = '';
        selectNivel.disabled = false;
        var aviso = document.getElementById('aviso-nivel-proprio');
        if (aviso) aviso.remove();
        modalObj.show();
    });

    function _abrirModalEdicao(dados) {
        modalTitulo.textContent   = 'Alterar Usuário';
        validador.resetar(formUsuario);
        inputIdUsuario.value      = dados.id;
        inputNome.value           = dados.nome  || '';
        inputCpf.value            = _formatarCpf(dados.cpf);
        inputEmail.value          = dados.email || '';
        selectNivel.value         = dados.nivel || '';

        var editandoSiMesmo = Number(dados.id) === idUsuarioLogado;
        selectNivel.disabled = editandoSiMesmo;

        var avisoNivel = document.getElementById('aviso-nivel-proprio');
        if (editandoSiMesmo) {
            if (!avisoNivel) {
                avisoNivel = document.createElement('small');
                avisoNivel.id        = 'aviso-nivel-proprio';
                avisoNivel.className = 'text-muted mt-1 d-block';
                avisoNivel.textContent = 'Você não pode alterar seu próprio nível de acesso.';
                selectNivel.parentElement.appendChild(avisoNivel);
            }
        } else if (avisoNivel) {
            avisoNivel.remove();
        }

        modalObj.show();
    }

    btnSalvar.addEventListener('click', async function () {
        var _cpfDigits     = mascaras.apenasDigitos(inputCpf.value);
        var _cpfAlgoValido = true;
        if (_cpfDigits.length > 0) {
            var _cpfResult = window.AGAPE.Utils.ValidadorCpf.validar(_cpfDigits);
            validador.destacarCampo(inputCpf, _cpfResult.valido, _cpfResult.mensagem);
            _cpfAlgoValido = _cpfResult.valido;
        }

        if (!validador.validarFormulario(formUsuario) || !_cpfAlgoValido) return;

        var novoCadastro = !inputIdUsuario.value;
        var dados = {
            idUsuario: inputIdUsuario.value || null,
            nome:      inputNome.value.trim(),
            cpf:       inputCpf.value,
            email:     inputEmail.value.trim(),
            nivel:     selectNivel.value
        };

        var resultado = novoCadastro
            ? await ctrl.cadastrar(dados)
            : await ctrl.alterar(dados);

        if (resultado.status === 'ok') {
            modalObj.hide();
            validador.mostrarAlerta(
                novoCadastro ? 'Usuário cadastrado com sucesso!' : 'Usuário alterado com sucesso!',
                'sucesso'
            );
            await _carregarLista();
        } else {
            validador.mostrarAlerta(resultado.erro || 'Erro ao salvar usuário.', 'erro');
        }
    });

    btnConfirmarStatus.addEventListener('click', async function () {
        if (!idParaStatus) return;
        var acao      = acaoStatus;
        var resultado = acao === 'ativar'
            ? await ctrl.ativar(idParaStatus)
            : await ctrl.desativar(idParaStatus);
        modalStatusObj.hide();
        idParaStatus = acaoStatus = null;
        if (resultado.status === 'ok') {
            validador.mostrarAlerta(
                acao === 'ativar' ? 'Usuário ativado com sucesso!' : 'Usuário desativado com sucesso!',
                'sucesso'
            );
            await _carregarLista();
        } else {
            validador.mostrarAlerta(resultado.erro || 'Erro ao alterar status.', 'erro');
        }
    });

    btnConfirmarExcluir.addEventListener('click', async function () {
        if (!idParaExcluir) return;
        var resultado = await ctrl.excluir(idParaExcluir);
        modalExcluirObj.hide();
        idParaExcluir = null;
        if (resultado.status === 'ok') {
            validador.mostrarAlerta('Usuário excluído com sucesso!', 'sucesso');
            await _carregarLista();
        } else {
            validador.mostrarAlerta(resultado.erro || 'Erro ao excluir usuário.', 'erro');
        }
    });

    btnConfirmarReset.addEventListener('click', async function () {
        if (!idParaReset) return;
        var resultado = await ctrl.resetarSenha(idParaReset);
        modalResetObj.hide();
        idParaReset = null;
        if (resultado.status === 'ok') {
            validador.mostrarAlerta('Senha resetada para o padrão do perfil com sucesso!', 'sucesso');
        } else {
            validador.mostrarAlerta(resultado.erro || 'Erro ao resetar senha.', 'erro');
        }
    });

    btnFiltrar.addEventListener('click', function () {
        _renderizarTabela(ctrl.filtrar({
            nome:   filtrNome.value,
            nivel:  filtrNivel.value,
            status: filtrStatus.value
        }));
    });

    btnLimpar.addEventListener('click', async function () {
        filtrNome.value = filtrNivel.value = filtrStatus.value = '';
        await _carregarLista();
    });

    function _escapar(texto) {
        if (texto === null || texto === undefined) return '';
        return String(texto)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    document.addEventListener('DOMContentLoaded', inicializar);

})();
