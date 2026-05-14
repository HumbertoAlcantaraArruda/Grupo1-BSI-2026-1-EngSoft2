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
  #logoBase64  = null;
  #logoHBase64 = null;

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
  }

  async init() {
    if (!this.#session.hasRole('ADM')) {
      Toast.show('Acesso restrito a Administradores.', 'error');
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
        Toast.show('CEP não encontrado. Preencha o endereço manualmente.', 'warning');
        return;
      }

      // Preenche campos — edição manual permanece liberada
      $('#param-logradouro').val(data.logradouro   ?? '');
      $('#param-bairro').val(data.bairro            ?? '');
      $('#param-cidade').val(data.localidade        ?? '');
      $('#param-estado').val(data.uf                ?? '');

      Toast.show('Endereço preenchido via CEP!', 'success');
      document.getElementById('param-numero').focus();

    } catch {
      Toast.show('Erro ao consultar ViaCEP. Preencha o endereço manualmente.', 'warning');
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
      Toast.show('Selecione um arquivo de imagem (PNG, JPG).', 'warning');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      Toast.show('Imagem muito grande. Máximo: 2 MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const base64 = e.target.result;
      if (tipo === 'logo') {
        this.#logoBase64 = base64;
        $('#preview-logo').attr('src', base64).removeClass('d-none');
        $('#icon-logo, #label-logo').addClass('d-none');
      } else {
        this.#logoHBase64 = base64;
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
      this.#fillForm(d);
    } catch (err) {
      if (err.status === 404) {
        // Primeiro cadastro: form vazio, campos com defaults
        this.#fillForm({});
      } else {
        Toast.show(err.message || 'Erro ao carregar configurações.', 'error');
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
    $('#param-logradouro').val(s('logradouro'));
    $('#param-numero').val(s('numero'));
    $('#param-complemento').val(s('complemento'));
    $('#param-bairro').val(s('bairro'));
    $('#param-cidade').val(s('cidade'));
    $('#param-estado').val(s('estado'));
    $('#param-pais').val(d.pais ?? 'Brasil');
    $('#param-telefone1').val(d.telefone1 ? Mask.phone(d.telefone1) : '');
    $('#param-telefone2').val(d.telefone2 ? Mask.phone(d.telefone2) : '');
    $('#param-whatsapp').val(d.whatsapp ? Mask.phone(d.whatsapp) : '');
    $('#param-email').val(s('email'));
    $('#param-site').val(s('site'));
    $('#param-responsavel').val(s('responsavel'));
    $('#param-moeda').val(d.moeda ?? 'BRL');
    $('#param-fuso').val(d.fuso ?? 'America/Sao_Paulo');
    $('#param-obs').val(s('observacoes'));

    // Logos
    if (d.logoUrl) {
      $('#preview-logo').attr('src', d.logoUrl).removeClass('d-none');
      $('#icon-logo, #label-logo').addClass('d-none');
    }
    if (d.logoHUrl) {
      $('#preview-logoh').attr('src', d.logoHUrl).removeClass('d-none');
      $('#icon-logoh, #label-logoh').addClass('d-none');
    }
  }

  // ── Salvar ────────────────────────────────────────────────
  async #save() {
    const form = document.getElementById('form-param');
    form.classList.add('was-validated');
    if (!form.checkValidity()) {
      Toast.show('Preencha os campos obrigatórios.', 'warning');
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
      Toast.show('Configurações salvas com sucesso!', 'success');
      this.#logoBase64 = this.#logoHBase64 = null;
    } catch (err) {
      Toast.show(err.message || 'Erro ao salvar configurações.', 'error');
    } finally {
      btn.prop('disabled', false).html('<i class="bi bi-check-lg me-1"></i>Salvar Configurações');
      form.classList.remove('was-validated');
    }
  }
}
