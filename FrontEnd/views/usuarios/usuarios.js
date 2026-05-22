/* usuarios.js — View: vincula eventos ao DOM e delega ao Controller */

(function ($) {

    var auth = window.AGAPE.Utils.Auth.getInstance();
    if (!auth.requireLogin()) return;

    var usuarioLogado = auth.getUsuario();
    if (!usuarioLogado || usuarioLogado.nivel !== 'ADM') {
        window.location.replace('../index.html');
        return;
    }

    var ctrl      = window.AGAPE.Controllers.UsuarioController.getInstance();
    var mascaras  = window.AGAPE.Utils.Mascaras.getInstance();
    var validador = window.AGAPE.Utils.Validador.getInstance();

    var $tabelaCorpo          = $('#tabela-corpo');
    var $modalEl              = $('#modal-usuario');
    var $formUsuario          = $('#form-usuario');
    var $inputIdUsuario       = $('#idUsuario');
    var $inputNome            = $('#nome');
    var $inputCpf             = $('#cpf');
    var $inputEmail           = $('#email');
    var $selectNivel          = $('#nivel');
    var $modalTitulo          = $('#modal-titulo');
    var $filtrNome            = $('#filtro-nome');
    var $filtrNivel           = $('#filtro-nivel');
    var $filtrStatus          = $('#filtro-status');
    var $btnCadastrar         = $('#btn-cadastrar');
    var $btnFiltrar           = $('#btn-filtrar');
    var $btnLimpar            = $('#btn-limpar');
    var $btnSalvar            = $('#btn-salvar');
    var $btnConfirmarStatus   = $('#btn-confirmar-status');
    var $btnConfirmarExcluir  = $('#btn-confirmar-excluir');
    var $btnConfirmarReset    = $('#btn-confirmar-reset');

    var modalObj        = new bootstrap.Modal($modalEl[0]);
    var modalStatusObj  = new bootstrap.Modal($('#modal-status')[0]);
    var modalExcluirObj = new bootstrap.Modal($('#modal-excluir')[0]);
    var modalResetObj   = new bootstrap.Modal($('#modal-reset-senha')[0]);

    var idUsuarioLogado = usuarioLogado ? Number(usuarioLogado.idUsuario) : null;

    var idParaStatus  = null;
    var acaoStatus    = null;
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
        $inputCpf.on('blur', function () {
            var digits = mascaras.apenasDigitos($inputCpf.val());
            if (digits.length === 0) {
                $inputCpf.removeClass('is-invalid is-valid');
                return;
            }
            var resultado = window.AGAPE.Utils.ValidadorCpf.validar(digits);
            validador.destacarCampo($inputCpf[0], resultado.valido, resultado.mensagem);
        });
    }

    async function _carregarLista() {
        $tabelaCorpo.html('<tr><td colspan="6" class="tabela-vazia">Carregando...</td></tr>');
        _renderizarTabela(await ctrl.listar());
    }



    var _dt = null;

    function _renderizarTabela(resultado) {
        if (resultado.status !== 'ok') {
            if (_dt) { _dt.destroy(); _dt = null; }
            $tabelaCorpo.html(
                '<tr><td colspan="6" class="tabela-vazia text-danger">' +
                '<i class="bi bi-exclamation-triangle me-1"></i>' +
                _esc(resultado.erro || 'Erro ao carregar dados.') +
                '</td></tr>'
            );
            return;
        }

        var lista = Array.isArray(resultado.dados) ? resultado.dados : [];
        var dados = lista.map(function (u) {
            return {
                idUsuario: u.idUsuario,
                nome:      u.nome,
                cpf:       u.cpf,
                email:     u.email,
                nivel:     u.nivel,
                status:    u.status
            };
        });

        if (_dt) {
            _dt.clear().rows.add(dados).draw();
            return;
        }

        _dt = $tabelaCorpo.closest('table').DataTable({
            dom: '<"top d-flex justify-content-end" f>rt<"bottom d-flex justify-content-between" l p>',
            searching: false,
            info: false,
            data: dados,
            columnDefs: [
                { className: 'text-center', targets: '_all' }
            ],
            columns: [
                { data: 'nome',  render: function (d) { return _esc(d); } },
                { data: 'cpf',   render: function (d) { return _formatarCpf(d); } },
                { data: 'email', render: function (d) { return _esc(d); } },
                { data: 'nivel', render: function (d) { return _badgeNivel(d); } },
                { data: 'status', render: function (d) {
                    var ativo = d === 1 || d === '1';
                    return ativo ? '<span class="badge-ativo">Ativo</span>' : '<span class="badge-inativo">Inativo</span>';
                }},
                { data: null, orderable: false, render: function (d, t, row) {
                    var ativo = row.status === 1 || row.status === '1';
                    var btnToggle = ativo
                        ? '<button class="btn-acao btn-desativar me-1" data-id="' + row.idUsuario + '" data-nome="' + _esc(row.nome) + '" title="Desativar"><i class="bi bi-person-dash"></i></button>'
                        : '<button class="btn-acao btn-ativar me-1" data-id="' + row.idUsuario + '" data-nome="' + _esc(row.nome) + '" title="Ativar"><i class="bi bi-person-check"></i></button>';
                    return '<button class="btn-acao btn-editar me-1" ' +
                        'data-id="'    + row.idUsuario   + '" ' +
                        'data-nome="'  + _esc(row.nome)  + '" ' +
                        'data-cpf="'   + _esc(row.cpf)   + '" ' +
                        'data-email="' + _esc(row.email) + '" ' +
                        'data-nivel="' + _esc(row.nivel) + '" title="Editar">' +
                        '<i class="bi bi-pencil"></i></button>' +
                        btnToggle +
                        '<button class="btn-acao btn-reset-senha me-1" ' +
                        'data-id="'   + row.idUsuario   + '" ' +
                        'data-nome="' + _esc(row.nome)  + '" title="Resetar Senha">' +
                        '<i class="bi bi-key"></i></button>' +
                        '<button class="btn-acao btn-excluir" ' +
                        'data-id="'   + row.idUsuario   + '" ' +
                        'data-nome="' + _esc(row.nome)  + '" title="Excluir">' +
                        '<i class="bi bi-trash"></i></button>';
                }}
            ],
            language: {
                decimal: ',', thousands: '.',
                emptyTable:   'Nenhum usuário encontrado',
                info:         'Mostrando _START_ a _END_ de _TOTAL_ registro(s)',
                infoEmpty:    'Nenhum registro encontrado',
                infoFiltered: '(filtrado de _MAX_ no total)',
                lengthMenu:   'Mostrar _MENU_ por página',
                search:       'Buscar:',
                zeroRecords:  'Nenhum usuário encontrado',
                paginate: {
                    first: '<i class="bi bi-chevron-double-left"></i>',
                    last: '<i class="bi bi-chevron-double-right"></i>',
                    next: '<i class="bi bi-chevron-right"></i>',
                    previous: '<i class="bi bi-chevron-left"></i>'
                }
            },
            pageLength: 10,
            lengthMenu: [5, 10, 25, 50],
            order: [[0, 'asc']]
        });
    }

    $tabelaCorpo.on('click', '.btn-editar', function () {
        _abrirModalEdicao($(this).data());
    });

    $tabelaCorpo.on('click', '.btn-ativar', function () {
        if ($(this).data('id') === idUsuarioLogado) {
            validador.mostrarAlerta('Você não tem permissão para realizar esta ação na sua própria conta.', 'erro');
            return;
        }
        idParaStatus = $(this).data('id');
        acaoStatus   = 'ativar';
        $('#status-msg').text('Deseja ativar o usuário:');
        $('#status-nome').text($(this).data('nome'));
        $btnConfirmarStatus.attr('class', 'btn btn-success btn-sm')
            .html('<i class="bi bi-person-check me-1"></i>Ativar');
        modalStatusObj.show();
    });

    $tabelaCorpo.on('click', '.btn-desativar', function () {
        if ($(this).data('id') === idUsuarioLogado) {
            validador.mostrarAlerta('Você não tem permissão para realizar esta ação na sua própria conta.', 'erro');
            return;
        }
        idParaStatus = $(this).data('id');
        acaoStatus   = 'desativar';
        $('#status-msg').text('Deseja desativar o usuário:');
        $('#status-nome').text($(this).data('nome'));
        $btnConfirmarStatus.attr('class', 'btn btn-warning btn-sm')
            .html('<i class="bi bi-person-dash me-1"></i>Desativar');
        modalStatusObj.show();
    });

    $tabelaCorpo.on('click', '.btn-excluir', function () {
        if ($(this).data('id') === idUsuarioLogado) {
            validador.mostrarAlerta('Você não tem permissão para realizar esta ação na sua própria conta.', 'erro');
            return;
        }
        idParaExcluir = $(this).data('id');
        $('#excluir-nome').text($(this).data('nome'));
        modalExcluirObj.show();
    });

    $tabelaCorpo.on('click', '.btn-reset-senha', function () {
        idParaReset = $(this).data('id');
        $('#reset-nome').text($(this).data('nome'));
        modalResetObj.show();
    });

    function _badgeNivel(nivel) {
        var cores = { ADM: '#024040', COLAB: '#8C142A', PAROQ: '#6c757d' };
        var cor   = cores[nivel] || '#6c757d';
        var label = _NIVEIS[nivel] || nivel;
        return '<span style="background:' + cor + ';color:#fff;font-size:.75rem;' +
               'padding:.3em .65em;border-radius:.375rem;font-weight:500">' + label + '</span>';
    }

    function _formatarCpf(cpf) {
        var d = String(cpf || '').replace(/\D/g, '');
        if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        return _esc(String(cpf || ''));
    }

    $btnCadastrar.on('click', function () {
        $modalTitulo.text('Cadastrar Usuário');
        validador.resetar($formUsuario[0]);
        $inputIdUsuario.val('');
        $inputNome.val('');
        $inputCpf.val('');
        $inputEmail.val('');
        $selectNivel.val('');
        $selectNivel.prop('disabled', false);
        $('#aviso-nivel-proprio').remove();
        modalObj.show();
    });

    function _abrirModalEdicao(dados) {
        $modalTitulo.text('Alterar Usuário');
        validador.resetar($formUsuario[0]);
        $inputIdUsuario.val(dados.id);
        $inputNome.val(dados.nome  || '');
        $inputCpf.val(_formatarCpf(dados.cpf));
        $inputEmail.val(dados.email || '');
        $selectNivel.val(dados.nivel || '');

        $selectNivel.prop('disabled', true);

        $('#aviso-nivel-proprio').remove();
        $('<small>')
            .attr('id', 'aviso-nivel-proprio')
            .addClass('text-muted mt-1 d-block')
            .text('O nível de acesso não pode ser alterado após o cadastro.')
            .appendTo($selectNivel.parent());

        modalObj.show();
    }

    $btnSalvar.on('click', async function () {
        var _cpfDigits     = mascaras.apenasDigitos($inputCpf.val());
        var _cpfAlgoValido = true;
        if (_cpfDigits.length > 0) {
            var _cpfResult = window.AGAPE.Utils.ValidadorCpf.validar(_cpfDigits);
            validador.destacarCampo($inputCpf[0], _cpfResult.valido, _cpfResult.mensagem);
            _cpfAlgoValido = _cpfResult.valido;
        }

        if (!validador.validarFormulario($formUsuario[0]) || !_cpfAlgoValido) return;

        var novoCadastro = !$inputIdUsuario.val();
        var dados = {
            idUsuario: $inputIdUsuario.val() || null,
            nome:      $inputNome.val().trim(),
            cpf:       $inputCpf.val(),
            email:     $inputEmail.val().trim(),
            nivel:     $selectNivel.val()
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

    $btnConfirmarStatus.on('click', async function () {
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

    $btnConfirmarExcluir.on('click', async function () {
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

    $btnConfirmarReset.on('click', async function () {
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

    $btnFiltrar.on('click', function () {
        _renderizarTabela(ctrl.filtrar({
            nome:   $filtrNome.val(),
            nivel:  $filtrNivel.val(),
            status: $filtrStatus.val()
        }));
    });

    $btnLimpar.on('click', async function () {
        $filtrNome.val('');
        $filtrNivel.val('');
        $filtrStatus.val('');
        await _carregarLista();
    });

    function _esc(texto) {
        return $('<div>').text(texto == null ? '' : String(texto)).html();
    }

    $(inicializar);

}(jQuery));
