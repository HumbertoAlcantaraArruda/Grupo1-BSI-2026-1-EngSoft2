/* parametrizacao.js — View: gerencia o formulário de configuração do sistema */

(function () {

    if (!window.AGAPE.Utils.Auth.getInstance().requireLogin()) return;

    var ctrl      = window.AGAPE.Controllers.ParametrizacaoController.getInstance();
    var mascaras  = window.AGAPE.Utils.Mascaras.getInstance();
    var validador = window.AGAPE.Utils.Validador.getInstance();

    var form = document.getElementById('form-parametrizacao');

    var campos = {
        cnpj: document.getElementById('cnpj'), razaoSocial: document.getElementById('razaoSocial'),
        nomeFantasia: document.getElementById('nomeFantasia'), responsavel: document.getElementById('responsavel'),
        logradouro: document.getElementById('logradouro'), numEndereco: document.getElementById('numEndereco'),
        complemento: document.getElementById('complemento'), bairro: document.getElementById('bairro'),
        cidade: document.getElementById('cidade'), uf: document.getElementById('uf'),
        cep: document.getElementById('cep'), pais: document.getElementById('pais'),
        email: document.getElementById('email'), telefone1: document.getElementById('telefone1'),
        telefone2: document.getElementById('telefone2'), site: document.getElementById('site'),
        inscricaoEstadual: document.getElementById('inscricaoEstadual'),
        inscricaoMunicipal: document.getElementById('inscricaoMunicipal'),
        moedaPadrao: document.getElementById('moedaPadrao'), fusoHorario: document.getElementById('fusoHorario'),
        obs: document.getElementById('obs')
    };

    var inputLogoGrande  = document.getElementById('input-logo-grande');
    var inputLogoPequeno = document.getElementById('input-logo-pequeno');
    var previewGrande    = document.getElementById('preview-logo-grande');
    var previewPequeno   = document.getElementById('preview-logo-pequeno');
    var btnSalvarLogos   = document.getElementById('btn-salvar-logos');
    var btnSalvar        = document.getElementById('btn-salvar');

    // Armazena base64 e nome dos arquivos selecionados enquanto aguarda o envio
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
        var camposEndereco = [campos.logradouro, campos.bairro, campos.cidade, campos.uf];

        campos.cep.addEventListener('blur', async function () {
            var digits = mascaras.apenasDigitos(campos.cep.value);
            campos.cep.classList.remove('is-invalid', 'is-valid');

            if (digits.length === 0) return;

            if (digits.length !== 8) {
                _limparCamposEndereco();
                validador.destacarCampo(campos.cep, false, 'CEP inválido. Informe 8 dígitos.');
                return;
            }

            _limparCamposEndereco();
            camposEndereco.forEach(function (el) { el.disabled = true; });

            var resultado = await viaCep.buscar(digits);
            camposEndereco.forEach(function (el) { el.disabled = false; });

            if (resultado.status === 'ok') {
                var d = resultado.dados;
                campos.logradouro.value = d.logradouro || '';
                campos.bairro.value     = d.bairro     || '';
                campos.cidade.value     = d.localidade || '';
                campos.uf.value         = d.uf         || '';
                validador.destacarCampo(campos.cep, true);
                campos.numEndereco.focus();
            } else {
                validador.destacarCampo(campos.cep, false, resultado.mensagem);
            }
        });
    }

    function _limparCamposEndereco() {
        campos.logradouro.value = '';
        campos.bairro.value     = '';
        campos.cidade.value     = '';
        campos.uf.value         = '';
    }

    function _bindCnpjLookup() {
        var brasilApi = window.AGAPE.Utils.BrasilApiCnpj.getInstance();

        campos.cnpj.addEventListener('blur', async function () {
            var digits = mascaras.apenasDigitos(campos.cnpj.value);
            campos.cnpj.classList.remove('is-invalid', 'is-valid');

            if (digits.length === 0) return;

            if (digits.length !== 14) {
                _limparCamposCnpj();
                validador.destacarCampo(campos.cnpj, false, 'CNPJ inválido. Informe 14 dígitos.');
                return;
            }

            _limparCamposCnpj();
            campos.cnpj.disabled = true;

            var resultado = await brasilApi.buscar(digits);
            campos.cnpj.disabled = false;

            if (resultado.status === 'ok') {
                var d = resultado.dados;
                campos.razaoSocial.value  = d.razao_social  || '';
                campos.nomeFantasia.value = d.nome_fantasia || '';
                validador.destacarCampo(campos.cnpj, true);
            } else {
                validador.destacarCampo(campos.cnpj, false, resultado.mensagem);
            }
        });
    }

    function _limparCamposCnpj() {
        campos.razaoSocial.value  = '';
        campos.nomeFantasia.value = '';
    }

    function _exibirBannerPendente() {
        if (sessionStorage.getItem('agape_param_pendente') !== '1') return;

        var banner = document.createElement('div');
        banner.id  = 'banner-param-pendente';
        banner.className = 'alert alert-warning d-flex align-items-center gap-2 mb-0 rounded-0';
        banner.style.cssText = 'position:sticky;top:0;z-index:90;border-left:none;border-right:none;border-top:none;';
        banner.innerHTML =
            '<i class="bi bi-exclamation-triangle-fill flex-shrink-0"></i>' +
            '<span><strong>Atenção:</strong> Os dados da empresa ainda não foram preenchidos. ' +
            'Preencha e salve as informações abaixo para liberar o acesso ao sistema.</span>';

        var areaConteudo = document.querySelector('.area-conteudo');
        if (areaConteudo) areaConteudo.insertBefore(banner, areaConteudo.firstChild);
    }

    async function _carregarDados() {
        var resultado = await ctrl.carregar();
        console.log(resultado);
        if (resultado.status !== 'ok' || !resultado.dados) return;

        var d = resultado.dados;

        Object.keys(campos).forEach(function (chave) {
            if (campos[chave] && d[chave] !== undefined && d[chave] !== null) {
                campos[chave].value = d[chave];
            }
        });

        if (d.logotipoGrande)  { previewGrande.src  = '../assets/img/' + d.logotipoGrande;  previewGrande.classList.remove('d-none');  }
        if (d.logotipoPequeno) { previewPequeno.src = '../assets/img/' + d.logotipoPequeno; previewPequeno.classList.remove('d-none'); }

        if (d.razaoSocial && d.razaoSocial.trim() !== '') {
            sessionStorage.removeItem('agape_param_pendente');
            var banner = document.getElementById('banner-param-pendente');
            if (banner) banner.remove();
        }
    }

    btnSalvar.addEventListener('click', async function () {
        if (!validador.validarFormulario(form)) return;

        var dados = {};
        Object.keys(campos).forEach(function (chave) {
            dados[chave] = campos[chave] ? campos[chave].value : '';
        });

        // Remove máscara antes de enviar
        dados.cnpj = mascaras.apenasDigitos(dados.cnpj);

        var resultado = await ctrl.salvar(dados);
        if (resultado.status === 'ok') {
            sessionStorage.removeItem('agape_param_pendente');
            var banner = document.getElementById('banner-param-pendente');
            if (banner) banner.remove();
            validador.mostrarAlerta('Parametrização salva com sucesso!', 'sucesso');
            form.classList.remove('was-validated');
        } else {
            validador.mostrarAlerta(resultado.erro || 'Erro ao salvar.', 'erro');
        }
    });

    inputLogoGrande.addEventListener('change', function () {
        var arquivo = this.files[0];
        if (!arquivo) return;
        _nomeLogoGrande = arquivo.name;
        var reader = new FileReader();
        reader.onload = function (e) {
            _logoGrandeBase64 = e.target.result;
            previewGrande.src = e.target.result;
            previewGrande.classList.remove('d-none');
        };
        reader.readAsDataURL(arquivo);
    });

    inputLogoPequeno.addEventListener('change', function () {
        var arquivo = this.files[0];
        if (!arquivo) return;
        _nomeLogoPequeno = arquivo.name;
        var reader = new FileReader();
        reader.onload = function (e) {
            _logoPequenoBase64 = e.target.result;
            previewPequeno.src = e.target.result;
            previewPequeno.classList.remove('d-none');
        };
        reader.readAsDataURL(arquivo);
    });

    btnSalvarLogos.addEventListener('click', async function () {
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

    document.addEventListener('DOMContentLoaded', inicializar);

})();
