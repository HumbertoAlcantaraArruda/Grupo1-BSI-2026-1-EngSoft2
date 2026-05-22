/* parametrizacao.js — View: gerencia o formulário de configuração do sistema */

(function ($) {

    if (!window.AGAPE.Utils.Auth.getInstance().requireLogin()) return;

    var ctrl      = window.AGAPE.Controllers.ParametrizacaoController.getInstance();
    var mascaras  = window.AGAPE.Utils.Mascaras.getInstance();
    var validador = window.AGAPE.Utils.Validador.getInstance();

    var $form = $('#form-parametrizacao');

    var campos = {
        cnpj:               $('#cnpj'),
        razaoSocial:        $('#razaoSocial'),
        nomeFantasia:       $('#nomeFantasia'),
        responsavel:        $('#responsavel'),
        logradouro:         $('#logradouro'),
        numEndereco:        $('#numEndereco'),
        complemento:        $('#complemento'),
        bairro:             $('#bairro'),
        cidade:             $('#cidade'),
        uf:                 $('#uf'),
        cep:                $('#cep'),
        pais:               $('#pais'),
        email:              $('#email'),
        telefone1:          $('#telefone1'),
        telefone2:          $('#telefone2'),
        site:               $('#site'),
        inscricaoEstadual:  $('#inscricaoEstadual'),
        inscricaoMunicipal: $('#inscricaoMunicipal'),
        moedaPadrao:        $('#moedaPadrao'),
        fusoHorario:        $('#fusoHorario'),
        obs:                $('#obs')
    };

    var $inputLogoGrande  = $('#input-logo-grande');
    var $inputLogoPequeno = $('#input-logo-pequeno');
    var $previewGrande    = $('#preview-logo-grande');
    var $previewPequeno   = $('#preview-logo-pequeno');
    var $btnSalvarLogos   = $('#btn-salvar-logos');
    var $btnSalvar        = $('#btn-salvar');

    var _logoGrandeBase64  = null;
    var _logoPequenoBase64 = null;
    var _nomeLogoGrande    = null;
    var _nomeLogoPequeno   = null;

    async function inicializar() {
        window.AGAPE.Utils.Sidebar.inicializar();
        _exibirBannerPendente();
        mascaras.aplicar('#cnpj',      'cnpj');
        mascaras.aplicar('#cep',       'cep');
        mascaras.aplicar('#telefone1', 'telefone');
        mascaras.aplicar('#telefone2', 'telefone');
        _bindCepLookup();
        _bindCnpjLookup();
        await _carregarDados();
    }

    function _bindCepLookup() {
        var viaCep = window.AGAPE.Utils.ViaCep.getInstance();
        var $camposEndereco = [campos.logradouro, campos.bairro, campos.cidade, campos.uf];

        campos.cep.on('blur', async function () {
            var digits = mascaras.apenasDigitos(campos.cep.val());
            campos.cep.removeClass('is-invalid is-valid');

            if (digits.length === 0) return;

            if (digits.length !== 8) {
                _limparCamposEndereco();
                validador.destacarCampo(campos.cep[0], false, 'CEP inválido. Informe 8 dígitos.');
                return;
            }

            _limparCamposEndereco();
            $.each($camposEndereco, function (_, $el) { $el.prop('disabled', true); });

            var resultado = await viaCep.buscar(digits);
            $.each($camposEndereco, function (_, $el) { $el.prop('disabled', false); });

            if (resultado.status === 'ok') {
                var d = resultado.dados;
                campos.logradouro.val(d.logradouro || '');
                campos.bairro.val(d.bairro         || '');
                campos.cidade.val(d.localidade     || '');
                campos.uf.val(d.uf                 || '');
                validador.destacarCampo(campos.cep[0], true);
                campos.numEndereco[0].focus();
            } else {
                validador.destacarCampo(campos.cep[0], false, resultado.mensagem);
            }
        });
    }

    function _limparCamposEndereco() {
        campos.logradouro.val('');
        campos.bairro.val('');
        campos.cidade.val('');
        campos.uf.val('');
    }

    function _bindCnpjLookup() {
        var brasilApi = window.AGAPE.Utils.BrasilApiCnpj.getInstance();

        campos.cnpj.on('blur', async function () {
            var digits = mascaras.apenasDigitos(campos.cnpj.val());
            campos.cnpj.removeClass('is-invalid is-valid');

            if (digits.length === 0) return;

            if (digits.length !== 14) {
                _limparCamposCnpj();
                validador.destacarCampo(campos.cnpj[0], false, 'CNPJ inválido. Informe 14 dígitos.');
                return;
            }

            _limparCamposCnpj();
            campos.cnpj.prop('disabled', true);

            var resultado = await brasilApi.buscar(digits);
            campos.cnpj.prop('disabled', false);

            if (resultado.status === 'ok') {
                var d = resultado.dados;
                campos.razaoSocial.val(d.razao_social  || '');
                campos.nomeFantasia.val(d.nome_fantasia || '');
                validador.destacarCampo(campos.cnpj[0], true);
            } else {
                validador.destacarCampo(campos.cnpj[0], false, resultado.mensagem);
            }
        });
    }

    function _limparCamposCnpj() {
        campos.razaoSocial.val('');
        campos.nomeFantasia.val('');
    }

    function _exibirBannerPendente() {
        if (sessionStorage.getItem('agape_param_pendente') !== '1') return;

        $('<div>')
            .attr('id', 'banner-param-pendente')
            .addClass('alert alert-warning d-flex align-items-center gap-2 mb-0 rounded-0')
            .css({
                position:      'sticky',
                top:           0,
                'z-index':     90,
                'border-left': 'none',
                'border-right':'none',
                'border-top':  'none'
            })
            .html(
                '<i class="bi bi-exclamation-triangle-fill flex-shrink-0"></i>' +
                '<span><strong>Atenção:</strong> Os dados da empresa ainda não foram preenchidos. ' +
                'Preencha e salve as informações abaixo para liberar o acesso ao sistema.</span>'
            )
            .prependTo($('.area-conteudo'));
    }

    async function _carregarDados() {
        var resultado = await ctrl.carregar();
        console.log(resultado);
        if (resultado.status !== 'ok' || !resultado.dados) return;

        var d = resultado.dados;

        Object.keys(campos).forEach(function (chave) {
            if (campos[chave].length && d[chave] !== undefined && d[chave] !== null) {
                campos[chave].val(d[chave]);
            }
        });

        if (d.logotipoGrande)  { $previewGrande.attr('src',  '../assets/img/' + d.logotipoGrande).removeClass('d-none');  }
        if (d.logotipoPequeno) { $previewPequeno.attr('src', '../assets/img/' + d.logotipoPequeno).removeClass('d-none'); }

        if (d.razaoSocial && d.razaoSocial.trim() !== '') {
            sessionStorage.removeItem('agape_param_pendente');
            $('#banner-param-pendente').remove();
        }
    }

    $btnSalvar.on('click', async function () {
        if (!validador.validarFormulario($form[0])) return;

        var dados = {};
        Object.keys(campos).forEach(function (chave) {
            dados[chave] = campos[chave].length ? campos[chave].val() : '';
        });

        dados.cnpj = mascaras.apenasDigitos(dados.cnpj);

        var resultado = await ctrl.salvar(dados);
        if (resultado.status === 'ok') {
            sessionStorage.removeItem('agape_param_pendente');
            $('#banner-param-pendente').remove();
            validador.mostrarAlerta('Parametrização salva com sucesso!', 'sucesso');
            $form.removeClass('was-validated');
        } else {
            validador.mostrarAlerta(resultado.erro || 'Erro ao salvar.', 'erro');
        }
    });

    $inputLogoGrande.on('change', function () {
        var arquivo = this.files[0];
        if (!arquivo) return;
        _nomeLogoGrande = arquivo.name;
        var reader = new FileReader();
        reader.onload = function (e) {
            _logoGrandeBase64 = e.target.result;
            $previewGrande.attr('src', e.target.result).removeClass('d-none');
        };
        reader.readAsDataURL(arquivo);
    });

    $inputLogoPequeno.on('change', function () {
        var arquivo = this.files[0];
        if (!arquivo) return;
        _nomeLogoPequeno = arquivo.name;
        var reader = new FileReader();
        reader.onload = function (e) {
            _logoPequenoBase64 = e.target.result;
            $previewPequeno.attr('src', e.target.result).removeClass('d-none');
        };
        reader.readAsDataURL(arquivo);
    });

    $btnSalvarLogos.on('click', async function () {
        if (!_logoGrandeBase64 && !_logoPequenoBase64) {
            validador.mostrarAlerta('Selecione ao menos um arquivo de logotipo.', 'aviso');
            return;
        }

        var resultado = await ctrl.atualizarLogos({
            logoBase64:      _logoGrandeBase64  || '',
            nomeLogoGrande:  _nomeLogoGrande    || 'logo_grande.png',
            logoHBase64:     _logoPequenoBase64 || '',
            nomeLogoPequeno: _nomeLogoPequeno   || 'logo_pequeno.png'
        });

        if (resultado.status === 'ok') {
            validador.mostrarAlerta('Logotipos atualizados com sucesso!', 'sucesso');
        } else {
            validador.mostrarAlerta(resultado.erro || 'Erro ao salvar logotipos.', 'erro');
        }
    });

    $(inicializar);

}(jQuery));
