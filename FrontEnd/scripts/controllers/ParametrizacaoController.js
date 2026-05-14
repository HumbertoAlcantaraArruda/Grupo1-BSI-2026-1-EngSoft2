/**
 * ParametrizacaoController — Configurações da organização.
 *
 * Padrões aplicados:
 *  • SOLID / SRP: controller cuida apenas de dados da parametrização.
 *  • ViaCEP: auto-preenche endereço ao digitar CEP válido (8 dígitos).
 *  • Drag & Drop: logo principal e logo horizontal via FileReader.
 *  • "Ativo padrão": status sempre ativo; botão de salvar re-habilita após
 *    primeiro registro (comportamento espelhado nos demais CRUDs).
 */
class ParametrizacaoController {
  #api;
  #session;
  #toast;
  #logoBase64  = null;
  #logoHBase64 = null;
  #logoNome    = null;
  #logoHNome   = null;

  // Máscaras inline para CNPJ e CEP (não presentes em Mask.js)
  static #maskCnpj = v =>
    v.replace(/\D/g,'')
     .replace(/(\d{2})(\d)/,'$1.$2')
     .replace(/(\d{3})(\d)/,'$1.$2')
     .replace(/(\d{3})(\d)/,'$1/$2')
     .replace(/(\d{4})(\d{1,2})$/,'$1-$2')
     .slice(0,18);

  static #maskCep = v =>
    v.replace(/\D/g,'').replace(/(\d{5})(\d{1,3})$/,'$1-$2').slice(0,9);

  constructor() {
    this.#api     = ApiService.getInstance();
    this.#session = SessionManager.getInstance();
    this.#toast   = Toast.getInstance();
  }

  async init() {
    if (!this.#session.hasRole('ADM')) {
      this.#toast.error('Acesso restrito a Administradores.');
      setTimeout(() => window.location.replace('../dashboard.html'), 1500);
      return;
    }

    this.#applyMasks();
    this.#bindEvents();
    this.#setupDropzones();
    await this.#load();

  }

  // ── Máscaras ──────────────────────────────────────────────
  #applyMasks() {
    const cnpjEl = document.getElementById('param-cnpj');
    cnpjEl.addEventListener('input', () => {
      cnpjEl.value = ParametrizacaoController.#maskCnpj(cnpjEl.value);
    });

    const cepEl = document.getElementById('param-cep');
    cepEl.addEventListener('input', () => {
      cepEl.value = ParametrizacaoController.#maskCep(cepEl.value);
    });

    Mask.applyTo(document.getElementById('param-telefone1'), 'phone');
    Mask.applyTo(document.getElementById('param-telefone2'), 'phone');
    Mask.applyTo(document.getElementById('param-whatsapp'),  'phone');
  }

  // ── Eventos ───────────────────────────────────────────────
  #bindEvents() {
    // ViaCEP: dispara após 8 dígitos digitados
    $('#param-cep').on('input', () => {
      const raw = $('#param-cep').val().replace(/\D/g,'');
      if (raw.length === 8) this.#buscarCep(raw);
    });

    $('#param-cep').on('blur', () => {
      const raw = $('#param-cep').val().replace(/\D/g,'');
      if (raw.length === 8) this.#buscarCep(raw);
    });

    $('#btn-salvar-param').on('click', () => this.#save());
    $('#btn-confirm-logo').on('click', () => this.#saveLogos());

    // Inputs de arquivo para logos
    document.getElementById('input-logo').addEventListener('change', e => {
      this.#lerArquivoImagem(e.target.files[0], 'logo');
    });
    document.getElementById('input-logoh').addEventListener('change', e => {
      this.#lerArquivoImagem(e.target.files[0], 'logoh');
    });
  }

  // ── ViaCEP ────────────────────────────────────────────────
  async #buscarCep(cepRaw) {
    const wrap = document.getElementById('cep-wrap');
    wrap.classList.add('loading');

    try {
      const resp = await fetch(`https://viacep.com.br/ws/${cepRaw}/json/`);
      if (!resp.ok) throw new Error('Resposta inválida do ViaCEP');
      const data = await resp.json();

      if (data.erro) {
        this.#toast.warning('CEP não encontrado. Preencha o endereço manualmente.');
        return;
      }

      // Preenche campos — edição manual permanece liberada
      $('#param-logradouro').val(data.logradouro   ?? '');
      $('#param-bairro').val(data.bairro            ?? '');
      $('#param-cidade').val(data.localidade        ?? '');
      $('#param-estado').val(data.uf                ?? '');

      this.#toast.success('Endereço preenchido via CEP!');
      document.getElementById('param-numero').focus();

    } catch {
      this.#toast.warning('Erro ao consultar ViaCEP. Preencha o endereço manualmente.');
    } finally {
      wrap.classList.remove('loading');
    }
  }

  // ── Drag & Drop / Upload de Logos ─────────────────────────
  #setupDropzones() {
    // Expõe função global para o handler ondrop inline no HTML
    window.__param_dropLogo = (event, tipo) => {
      event.preventDefault();
      document.getElementById(`dropzone-logo${tipo === 'logo' ? '' : '-h'}`).classList.remove('dragover');
      const file = event.dataTransfer?.files?.[0];
      if (file) this.#lerArquivoImagem(file, tipo);
    };
  }

  #lerArquivoImagem(file, tipo) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.#toast.warning('Selecione um arquivo de imagem (PNG, JPG).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.#toast.warning('Imagem muito grande. Máximo: 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const base64 = e.target.result;
      if (tipo === 'logo') {
        this.#logoBase64 = base64;
        this.#logoNome   = file.name;
        $('#preview-logo').attr('src', base64).removeClass('d-none');
        $('#icon-logo, #label-logo').addClass('d-none');
      } else {
        this.#logoHBase64 = base64;
        this.#logoHNome   = file.name;
        $('#preview-logoh').attr('src', base64).removeClass('d-none');
        $('#icon-logoh, #label-logoh').addClass('d-none');
      }
    };
    reader.readAsDataURL(file);
  }

  // ── Carregar ──────────────────────────────────────────────
  async #load() {
    $('#param-loading').removeClass('d-none');
    $('#form-param').addClass('d-none');

    try {
      const d = await this.#api.get('/parametrizacao');

      if(d.status === "ok" || d.code === 200) {
        const result = d.result;

        console.log(result);

        this.#fillForm(result);
      }


    } catch (err) {
      if (err.status === 404) {
        // Primeiro cadastro: form vazio, campos com defaults
        this.#fillForm({});
      } else {
        console.log(err);
        // Toast.show(err.message || 'Erro ao carregar configurações.', 'error');
      }
    } finally {
      $('#param-loading').addClass('d-none');
      $('#form-param').removeClass('d-none');
    }
  }

  #fillForm(d) {
    const s = k => String(d[k] ?? '');
    $('#param-razaoSocial').val(s('razaoSocial'));
    $('#param-cnpj').val(d.cnpj ? ParametrizacaoController.#maskCnpj(d.cnpj) : '');
    $('#param-nomeFantasia').val(s('nomeFantasia'));
    $('#param-inscricaoEstadual').val(s('inscricaoEstadual'));
    $('#param-inscricaoMunicipal').val(s('inscricaoMunicipal'));
    $('#param-cep').val(d.cep ? ParametrizacaoController.#maskCep(d.cep) : '');
    $('#param-logradouro').val(s('endereco'));
    $('#param-numero').val(s('numEndereco'));
    $('#param-complemento').val(s('complemento'));
    $('#param-bairro').val(s('bairro'));
    $('#param-cidade').val(s('cidade'));
    $('#param-estado').val(s('uf'));
    $('#param-pais').val(s('pais'));
    $('#param-telefone1').val(d.telefone1 ? Mask.phone(d.telefone1) : '');
    $('#param-telefone2').val(d.telefone2 ? Mask.phone(d.telefone2) : '');
    // $('#param-whatsapp').val(d.whatsapp ? Mask.phone(d.whatsapp) : '');
    $('#param-email').val(s('email'));
    $('#param-site').val(s('site'));
    $('#param-responsavel').val(s('responsavel'));
    $('#param-moeda').val(s('moedaPadrao'));
    $('#param-fuso').val(s('fusoHorario'));
    $('#param-obs').val(s('obs'));

    // Logos
    const logoGrande = s('logotipoGrande');
    if (logoGrande) {
      $('#preview-logo')
        .off('error')
        .on('error', function () {
          $(this).addClass('d-none');
          $('#icon-logo').removeClass('d-none');
          $('#label-logo').removeClass('d-none').html('Erro ao carregar imagem.<br><small class="text-danger">' + logoGrande + '</small>');
        })
        .attr('src', '../../assets/img/' + logoGrande)
        .removeClass('d-none');
      $('#icon-logo, #label-logo').addClass('d-none');
    }

    const logoPequeno = s('logotipoPequeno');
    if (logoPequeno) {
      $('#preview-logoh')
        .off('error')
        .on('error', function () {
          $(this).addClass('d-none');
          $('#icon-logoh').removeClass('d-none');
          $('#label-logoh').removeClass('d-none').html('Erro ao carregar imagem.<br><small class="text-danger">' + logoPequeno + '</small>');
        })
        .attr('src', '../../assets/img/' + logoPequeno)
        .removeClass('d-none');
      $('#icon-logoh, #label-logoh').addClass('d-none');
    }
  }

  // ── Salvar Logos ──────────────────────────────────────────
  async #saveLogos() {
    if (!this.#logoBase64 && !this.#logoHBase64) {
      this.#toast.warning('Selecione ao menos uma imagem antes de confirmar.');
      return;
    }

    const btn = $('#btn-confirm-logo');
    btn.prop('disabled', true).html('<div class="spinner-border spinner-border-sm"></div>');

    try {
      const payload = {};
      if (this.#logoBase64)  { payload.logoBase64  = this.#logoBase64;  payload.nomeLogoGrande  = this.#logoNome;  }
      if (this.#logoHBase64) { payload.logoHBase64 = this.#logoHBase64; payload.nomeLogoPequeno = this.#logoHNome; }

      const res = await this.#api.post('/parametrizacao/logo', payload);

      this.#toast.success('Logotipos salvos com sucesso!');
      this.#logoBase64 = this.#logoHBase64 = this.#logoNome = this.#logoHNome = null;

      // Atualiza previews com o nome gravado pelo servidor
      const r = res.result ?? {};
      if (r.logotipoGrande) {
        $('#preview-logo').off('error').attr('src', '../../assets/img/' + r.logotipoGrande).removeClass('d-none');
        $('#icon-logo, #label-logo').addClass('d-none');
      }
      if (r.logotipoPequeno) {
        $('#preview-logoh').off('error').attr('src', '../../assets/img/' + r.logotipoPequeno).removeClass('d-none');
        $('#icon-logoh, #label-logoh').addClass('d-none');
      }
    } catch (err) {
      this.#toast.error(err.message || 'Erro ao salvar logotipos.');
    } finally {
      btn.prop('disabled', false).html('<i class="bi bi-check-lg me-1"></i>Confirmar');
    }
  }

  // ── Salvar ────────────────────────────────────────────────
  async #save() {
    const form = document.getElementById('form-param');
    form.classList.add('was-validated');
    if (!form.checkValidity()) {
      this.#toast.warning('Preencha os campos obrigatórios.');
      return;
    }

    const payload = {
      razaoSocial:        $('#param-razaoSocial').val().trim(),
      cnpj:               $('#param-cnpj').val().replace(/\D/g,''),
      nomeFantasia:       $('#param-nomeFantasia').val().trim(),
      inscricaoEstadual:  $('#param-inscricaoEstadual').val().trim(),
      inscricaoMunicipal: $('#param-inscricaoMunicipal').val().trim(),
      cep:                $('#param-cep').val().replace(/\D/g,''),
      logradouro:         $('#param-logradouro').val().trim(),
      numero:             $('#param-numero').val().trim(),
      complemento:        $('#param-complemento').val().trim(),
      bairro:             $('#param-bairro').val().trim(),
      cidade:             $('#param-cidade').val().trim(),
      estado:             $('#param-estado').val(),
      pais:               $('#param-pais').val().trim(),
      telefone1:          Mask.rawPhone($('#param-telefone1').val()),
      telefone2:          Mask.rawPhone($('#param-telefone2').val()),
      whatsapp:           Mask.rawPhone($('#param-whatsapp').val()),
      email:              $('#param-email').val().trim(),
      site:               $('#param-site').val().trim(),
      responsavel:        $('#param-responsavel').val().trim(),
      moeda:              $('#param-moeda').val(),
      fuso:               $('#param-fuso').val(),
      observacoes:        $('#param-obs').val().trim(),
      ...(this.#logoBase64  && { logoBase64:  this.#logoBase64  }),
      ...(this.#logoHBase64 && { logoHBase64: this.#logoHBase64 }),
    };

    const btn = $('#btn-salvar-param');
    btn.prop('disabled', true).html('<div class="spinner-border spinner-border-sm me-1"></div> Salvando...');

    try {
      await this.#api.post('/parametrizacao', payload);
      this.#toast.success('Configurações salvas com sucesso!');
      this.#logoBase64 = this.#logoHBase64 = null;
    } catch (err) {
      this.#toast.error(err.message || 'Erro ao salvar configurações.');
    } finally {
      btn.prop('disabled', false).html('<i class="bi bi-check-lg me-1"></i>Salvar Configurações');
      form.classList.remove('was-validated');
    }
  }
}
