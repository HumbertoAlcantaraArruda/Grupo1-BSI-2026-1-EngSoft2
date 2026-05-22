/* fornecedor.js — View: vincula eventos ao DOM e delega ao Controller */

(function ($) {

    if (!window.AGAPE.Utils.Auth.getInstance().requireLogin()) return;

    var ctrl      = window.AGAPE.Controllers.FornecedorController.getInstance();
    var mascaras  = window.AGAPE.Utils.Mascaras.getInstance();
    var validador = window.AGAPE.Utils.Validador.getInstance();

    var $tabelaCorpo         = $('#tabela-corpo');
    var $modalEl             = $('#modal-fornecedor');
    var $formFornecedor      = $('#form-fornecedor');
    var $inputIdFornec       = $('#idFornec');
    var $inputNome           = $('#nome');
    var $inputContato        = $('#contato');
    var $inputTelefone1      = $('#telefone1');
    var $inputTelefone2      = $('#telefone2');
    var $inputEmail          = $('#email');
    var $inputSite           = $('#site');
    var $inputCnpj           = $('#cnpj');
    var $inputCep            = $('#cep');
    var $inputLogradouro     = $('#logradouro');
    var $inputCidade         = $('#cidade');
    var $selectUf            = $('#uf');
    var $inputObs            = $('#obs');
    var $selectAtivo         = $('#ativo');
    var $modalTitulo         = $('#modal-titulo');
    var $filtrNome           = $('#filtro-nome');
    var $filtrStatus         = $('#filtro-status');
    var $btnCadastrar        = $('#btn-cadastrar');
    var $btnFiltrar          = $('#btn-filtrar');
    var $btnLimpar           = $('#btn-limpar');
    var $btnSalvar           = $('#btn-salvar');
    var $btnConfirmarExcluir = $('#btn-confirmar-excluir');

    var modalObj        = new bootstrap.Modal($modalEl[0]);
    var modalExcluirObj = new bootstrap.Modal($('#modal-excluir')[0]);
    var idParaExcluir   = null;
    var _dt             = null;

    async function inicializar() {
        window.AGAPE.Utils.Sidebar.inicializar();
        mascaras.aplicar('#telefone1', 'telefone');
        mascaras.aplicar('#telefone2', 'telefone');
        mascaras.aplicar('#cnpj', 'cnpj');
        mascaras.aplicar('#cep', 'cep');
        _bindCepLookup();
        _bindCnpjLookup();
        await _carregarLista();
    }

    function _bindCepLookup() {
        var viaCep = window.AGAPE.Utils.ViaCep.getInstance();

        $inputCep.on('blur', async function () {
            var digits = mascaras.apenasDigitos($inputCep.val());
            $inputCep.removeClass('is-invalid is-valid');

            if (digits.length === 0) return;

            if (digits.length !== 8) {
                _limparCamposEndereco();
                validador.destacarCampo($inputCep[0], false, 'CEP inválido. Informe 8 dígitos.');
                return;
            }

            _limparCamposEndereco();
            $inputLogradouro.prop('disabled', true);
            $inputCidade.prop('disabled', true);
            $selectUf.prop('disabled', true);

            var resultado = await viaCep.buscar(digits);

            $inputLogradouro.prop('disabled', false);
            $inputCidade.prop('disabled', false);
            $selectUf.prop('disabled', false);

            if (resultado.status === 'ok') {
                var d = resultado.dados;
                $inputLogradouro.val(d.logradouro || '');
                $inputCidade.val(d.localidade     || '');
                $selectUf.val(d.uf                || '');
                validador.destacarCampo($inputCep[0], true);
            } else {
                validador.destacarCampo($inputCep[0], false, resultado.mensagem);
            }
        });
    }

    function _limparCamposEndereco() {
        $inputLogradouro.val('');
        $inputCidade.val('');
        $selectUf.val('');
    }

    function _bindCnpjLookup() {
        var brasilApi = window.AGAPE.Utils.BrasilApiCnpj.getInstance();

        $inputCnpj.on('blur', async function () {
            var digits = mascaras.apenasDigitos($inputCnpj.val());
            $inputCnpj.removeClass('is-invalid is-valid');

            if (digits.length === 0) return;

            if (digits.length !== 14) {
                _limparCamposCnpj();
                validador.destacarCampo($inputCnpj[0], false, 'CNPJ inválido. Informe 14 dígitos.');
                return;
            }

            _limparCamposCnpj();
            $inputCnpj.prop('disabled', true);

            var resultado = await brasilApi.buscar(digits);
            $inputCnpj.prop('disabled', false);

            if (resultado.status === 'ok') {
                var d = resultado.dados;
                $inputNome.val(
                    (d.nome_fantasia && d.nome_fantasia.trim())
                        ? d.nome_fantasia.trim()
                        : (d.razao_social || '').trim()
                );
                validador.destacarCampo($inputCnpj[0], true);
            } else {
                validador.destacarCampo($inputCnpj[0], false, resultado.mensagem);
            }
        });
    }

    function _limparCamposCnpj() {
        $inputNome.val('');
    }

    async function _carregarLista() {
        $tabelaCorpo.html('<tr><td colspan="6" class="tabela-vazia">Carregando...</td></tr>');
        _renderizarTabela(await ctrl.listar());
    }

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
        var dados = lista.map(function (f) {
            var ativo = (f.ativo === 1 || f.ativo === true || f.ativo === '1');
            return {
                idFornec:   f.idFornec,
                nome:       f.nome       || '',
                contato:    f.contato    || '',
                telefone1:  f.telefone1  || '',
                telefone2:  f.telefone2  || '',
                email:      f.email      || '',
                site:       f.site       || '',
                cnpj:       f.cnpj       || '',
                cep:        f.cep        || '',
                logradouro: f.logradouro || '',
                cidade:     f.cidade     || '',
                uf:         f.uf         || '',
                obs:        f.obs        || '',
                ativo:      ativo
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
                { data: 'nome',      render: function (d) { return _esc(d) || '—'; } },
                { data: 'contato',   render: function (d) { return _esc(d) || '—'; } },
                { data: 'telefone1', render: function (d) { return _esc(d) || '—'; } },
                { data: 'email',     render: function (d) { return _esc(d) || '—'; } },
                { data: 'ativo', render: function (d) {
                    return d ? '<span class="badge-ativo">Ativo</span>' : '<span class="badge-inativo">Inativo</span>';
                }},
                { data: null, orderable: false, render: function (d, t, row) {
                    return '<button class="btn-acao btn-editar me-1" ' +
                        'data-id="'         + row.idFornec              + '" ' +
                        'data-nome="'       + _esc(row.nome)        + '" ' +
                        'data-contato="'    + _esc(row.contato)     + '" ' +
                        'data-telefone1="'  + _esc(row.telefone1)   + '" ' +
                        'data-telefone2="'  + _esc(row.telefone2)   + '" ' +
                        'data-email="'      + _esc(row.email)       + '" ' +
                        'data-site="'       + _esc(row.site)        + '" ' +
                        'data-cnpj="'       + _esc(row.cnpj)        + '" ' +
                        'data-cep="'        + _esc(row.cep)         + '" ' +
                        'data-logradouro="' + _esc(row.logradouro)  + '" ' +
                        'data-cidade="'     + _esc(row.cidade)      + '" ' +
                        'data-uf="'         + _esc(row.uf)          + '" ' +
                        'data-obs="'        + _esc(row.obs)         + '" ' +
                        'data-ativo="'      + (row.ativo ? '1' : '0') + '" ' +
                        'title="Editar"><i class="bi bi-pencil"></i></button>' +
                        '<button class="btn-acao btn-excluir" ' +
                        'data-id="'   + row.idFornec      + '" ' +
                        'data-nome="' + _esc(row.nome) + '" ' +
                        'title="Excluir"><i class="bi bi-trash"></i></button>';
                }}
            ],
            language: {
                decimal: ',', thousands: '.',
                emptyTable:   'Nenhum fornecedor encontrado',
                info:         'Mostrando _START_ a _END_ de _TOTAL_ registro(s)',
                infoEmpty:    'Nenhum registro encontrado',
                infoFiltered: '(filtrado de _MAX_ no total)',
                lengthMenu:   'Mostrar _MENU_ por página',
                search:       'Buscar:',
                zeroRecords:  'Nenhum fornecedor encontrado',
                paginate: {
                    first: '<i class="bi bi-chevron-double-left"></i>',
                    last:  '<i class="bi bi-chevron-double-right"></i>',
                    next:  '<i class="bi bi-chevron-right"></i>',
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

    $tabelaCorpo.on('click', '.btn-excluir', function () {
        idParaExcluir = $(this).data('id');
        $('#excluir-nome').text($(this).data('nome'));
        modalExcluirObj.show();
    });

    function _limparModal() {
        $inputIdFornec.val('');
        $inputNome.val('');
        $inputContato.val('');
        $inputTelefone1.val('');
        $inputTelefone2.val('');
        $inputEmail.val('');
        $inputSite.val('');
        $inputCnpj.val('');
        $inputCep.val('');
        $inputLogradouro.val('');
        $inputCidade.val('');
        $selectUf.val('');
        $inputObs.val('');
        $selectAtivo.val('1');
        $selectAtivo.prop('disabled', true);
    }

    $btnCadastrar.on('click', function () {
        $modalTitulo.text('Cadastrar Fornecedor');
        validador.resetar($formFornecedor[0]);
        _limparModal();
        modalObj.show();
    });

    function _abrirModalEdicao(dados) {
        $modalTitulo.text('Alterar Fornecedor');
        validador.resetar($formFornecedor[0]);
        $inputIdFornec.val(dados.id);
        $inputNome.val(dados.nome       || '');
        $inputContato.val(dados.contato    || '');
        $inputTelefone1.val(dados.telefone1  || '');
        $inputTelefone2.val(dados.telefone2  || '');
        $inputEmail.val(dados.email      || '');
        $inputSite.val(dados.site       || '');
        $inputCnpj.val(dados.cnpj       || '');
        $inputCep.val(dados.cep        || '');
        $inputLogradouro.val(dados.logradouro || '');
        $inputCidade.val(dados.cidade     || '');
        $selectUf.val(dados.uf         || '');
        $inputObs.val(dados.obs        || '');
        $selectAtivo.val(dados.ativo === 0 ? '0' : '1');
        $selectAtivo.prop('disabled', false);
        modalObj.show();
    }

    $btnSalvar.on('click', async function () {
        if (!validador.validarFormulario($formFornecedor[0])) return;

        var dados = {
            idFornec:   $inputIdFornec.val()  || null,
            nome:       $inputNome.val().trim(),
            contato:    $inputContato.val().trim(),
            telefone1:  mascaras.apenasDigitos($inputTelefone1.val()),
            telefone2:  mascaras.apenasDigitos($inputTelefone2.val()),
            email:      $inputEmail.val().trim(),
            site:       $inputSite.val().trim(),
            cnpj:       mascaras.apenasDigitos($inputCnpj.val()),
            cep:        mascaras.apenasDigitos($inputCep.val()),
            logradouro: $inputLogradouro.val().trim(),
            cidade:     $inputCidade.val().trim(),
            uf:         $selectUf.val(),
            obs:        $inputObs.val().trim(),
            ativo:      $selectAtivo.val()
        };

        var resultado = dados.idFornec
            ? await ctrl.alterar(dados)
            : await ctrl.cadastrar(dados);

        if (resultado.status === 'ok') {
            modalObj.hide();
            validador.mostrarAlerta(
                dados.idFornec ? 'Fornecedor alterado com sucesso!' : 'Fornecedor cadastrado com sucesso!',
                'sucesso'
            );
            await _carregarLista();
        } else {
            validador.mostrarAlerta(resultado.erro || 'Erro ao salvar fornecedor.', 'erro');
        }
    });

    $btnConfirmarExcluir.on('click', async function () {
        if (!idParaExcluir) return;
        var resultado = await ctrl.excluir(idParaExcluir);
        modalExcluirObj.hide();
        idParaExcluir = null;
        if (resultado.status === 'ok') {
            validador.mostrarAlerta('Fornecedor excluído com sucesso!', 'sucesso');
            await _carregarLista();
        } else {
            validador.mostrarAlerta(resultado.erro || 'Erro ao excluir fornecedor.', 'erro');
        }
    });

    $btnFiltrar.on('click', function () {
        _renderizarTabela(ctrl.filtrar({ nome: $filtrNome.val(), status: $filtrStatus.val() }));
    });

    $btnLimpar.on('click', async function () {
        $filtrNome.val('');
        $filtrStatus.val('');
        await _carregarLista();
    });

    function _esc(texto) {
        return $('<div>').text(texto == null ? '' : String(texto)).html();
    }

    $(inicializar);

}(jQuery));
