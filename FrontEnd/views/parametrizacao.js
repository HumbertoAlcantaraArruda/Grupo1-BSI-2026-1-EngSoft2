/* =====================================================================
   parametrizacao.js — Camada View (bind de eventos)
   REGRA: NÃO instancia Models. NÃO chama fetch. NÃO conhece Service.
   ===================================================================== */

(function () {

    var ctrl      = window.AGAPE.Controllers.ParametrizacaoController.getInstance();
    var mascaras  = window.AGAPE.Utils.Mascaras.getInstance();
    var validador = window.AGAPE.Utils.Validador.getInstance();

    /* ---- Referências ao formulário --------------------------------- */
    var form = document.getElementById('form-parametrizacao');

    var campos = {
        cnpj:               document.getElementById('cnpj'),
        razaoSocial:        document.getElementById('razaoSocial'),
        nomeFantasia:       document.getElementById('nomeFantasia'),
        responsavel:        document.getElementById('responsavel'),
        logradouro:         document.getElementById('logradouro'),
        numEndereco:        document.getElementById('numEndereco'),
        complemento:        document.getElementById('complemento'),
        bairro:             document.getElementById('bairro'),
        cidade:             document.getElementById('cidade'),
        uf:                 document.getElementById('uf'),
        cep:                document.getElementById('cep'),
        pais:               document.getElementById('pais'),
        email:              document.getElementById('email'),
        telefone1:          document.getElementById('telefone1'),
        telefone2:          document.getElementById('telefone2'),
        site:               document.getElementById('site'),
        inscricaoEstadual:  document.getElementById('inscricaoEstadual'),
        inscricaoMunicipal: document.getElementById('inscricaoMunicipal'),
        moedaPadrao:        document.getElementById('moedaPadrao'),
        fusoHorario:        document.getElementById('fusoHorario'),
        obs:                document.getElementById('obs')
    };

    /* ---- Referências aos uploads de logo -------------------------- */
    var inputLogoGrande   = document.getElementById('input-logo-grande');
    var inputLogoPequeno  = document.getElementById('input-logo-pequeno');
    var previewGrande     = document.getElementById('preview-logo-grande');
    var previewPequeno    = document.getElementById('preview-logo-pequeno');
    var btnSalvarLogos    = document.getElementById('btn-salvar-logos');

    var btnSalvar = document.getElementById('btn-salvar');

    /* Base64 das imagens selecionadas (carregado via FileReader) */
    var _logoGrandeBase64  = null;
    var _logoPequenoBase64 = null;
    var _nomeLogoGrande    = null;
    var _nomeLogoPequeno   = null;

    /* ---- Inicialização -------------------------------------------- */
    async function inicializar() {
        window.AGAPE.Utils.Sidebar.inicializar();
        _aplicarMascaras();
        await _carregarDados();
    }

    /* ---- Aplicar máscaras ----------------------------------------- */
    function _aplicarMascaras() {
        mascaras.aplicar('#cnpj',      'cnpj');
        mascaras.aplicar('#cep',       'cep');
        mascaras.aplicar('#telefone1', 'telefone');
        mascaras.aplicar('#telefone2', 'telefone');
    }

    /* ---- Carregar dados do backend e preencher o form ------------- */
    async function _carregarDados() {
        var resultado = await ctrl.carregar();

        if (resultado.status !== 'ok' || !resultado.dados) return;

        var d = resultado.dados;

        /* Preencher cada campo — máscaras aplicadas antes do .val */
        Object.keys(campos).forEach(function (chave) {
            if (campos[chave] && d[chave] !== undefined && d[chave] !== null) {
                campos[chave].value = d[chave];
            }
        });

        /* Mostrar logos atuais se existirem */
        if (d.logotipoGrande) {
            previewGrande.src = '../assets/img/' + d.logotipoGrande;
            previewGrande.classList.remove('d-none');
        }
        if (d.logotipoPequeno) {
            previewPequeno.src = '../assets/img/' + d.logotipoPequeno;
            previewPequeno.classList.remove('d-none');
        }
    }

    /* ---- Salvar parametrização ------------------------------------ */
    btnSalvar.addEventListener('click', async function () {
        if (!validador.validarFormulario(form)) return;

        var dados = {};
        Object.keys(campos).forEach(function (chave) {
            dados[chave] = campos[chave] ? campos[chave].value : '';
        });

        /* Limpar máscara do CNPJ antes de enviar */
        dados.cnpj = mascaras.apenasDigitos(dados.cnpj);

        var resultado = await ctrl.salvar(dados);

        if (resultado.status === 'ok') {
            validador.mostrarAlerta('Parametrização salva com sucesso!', 'sucesso');
            form.classList.remove('was-validated');
        } else {
            validador.mostrarAlerta(resultado.erro || 'Erro ao salvar.', 'erro');
        }
    });

    /* ---- Preview do logo grande ao selecionar arquivo ------------- */
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

    /* ---- Preview do logo pequeno ao selecionar arquivo ------------ */
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

    /* ---- Enviar logos ao backend ---------------------------------- */
    btnSalvarLogos.addEventListener('click', async function () {
        if (!_logoGrandeBase64 && !_logoPequenoBase64) {
            validador.mostrarAlerta('Selecione ao menos um arquivo de logotipo.', 'aviso');
            return;
        }

        var dadosLogo = {
            logoBase64:     _logoGrandeBase64  || '',
            nomeLogoGrande: _nomeLogoGrande    || 'logo_grande.png',
            logoHBase64:    _logoPequenoBase64 || '',
            nomeLogoPequeno: _nomeLogoPequeno  || 'logo_pequeno.png'
        };

        var resultado = await ctrl.atualizarLogos(dadosLogo);

        if (resultado.status === 'ok') {
            validador.mostrarAlerta('Logotipos atualizados com sucesso!', 'sucesso');
        } else {
            validador.mostrarAlerta(resultado.erro || 'Erro ao salvar logotipos.', 'erro');
        }
    });

    document.addEventListener('DOMContentLoaded', inicializar);

})();
