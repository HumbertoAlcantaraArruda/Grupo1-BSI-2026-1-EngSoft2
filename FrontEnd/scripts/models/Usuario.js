/**
 * Usuario — Model / Entidade
 *
 * Padrões aplicados:
 *   GRASP / Information Expert → as validações de CPF, e-mail e login
 *                                ficam aqui, não no Controller.
 *   GRASP / Creator            → o Controller instancia via new Usuario(dto)
 *                                ou via Usuario.fromDTO(respostaBackend).
 *   SOLID / SRP                → representa APENAS a entidade Usuário e
 *                                valida seus próprios atributos.
 *   SOLID / LSP                → subclasses (ex: PessoaFisica extends Usuario)
 *                                podem substituir Usuario sem quebrar nada,
 *                                pois o contrato de getters/setters é mantido.
 *   GOF / Singleton            → NÃO aplicado aqui — Model é instanciado
 *                                múltiplas vezes (um por registro).
 *
 * Interface implícita IValidavel:
 *   validar()  : string[]   — retorna lista de erros (vazio = válido)
 *   toDTO()    : object     — serializa para envio ao backend
 *
 * Interface implícita IConvertivel:
 *   static fromDTO(dto) : Usuario — fábrica a partir de resposta do backend
 */
class Usuario {
  /* Campos privados (encapsulamento ES2022) */
  #id;
  #nome;
  #login;
  #cpf;
  #email;
  #telefone;
  #nivel;          // 'ADM' | 'COLABORADOR' | 'PAROQUIANO'
  #ativo;
  #primeiroAcesso;
  #dataCadastro;
  #senha;          // nunca retornada pelo backend; usada só no cadastro

  /**
   * GRASP Creator: o Controller cria via new Usuario({ ...campos }).
   * Todos os parâmetros têm valor padrão para não quebrar ao omitir.
   *
   * @param {object} dados
   */
  constructor({
    id            = null,
    nome          = '',
    login         = '',
    cpf           = '',
    email         = '',
    telefone      = '',
    nivel         = 'COLABORADOR',
    ativo         = true,
    primeiroAcesso = true,
    dataCadastro  = null,
    senha         = '',
  } = {}) {
    this.#id             = id;
    this.#nome           = String(nome).trim();
    this.#login          = String(login).trim().toLowerCase();
    this.#cpf            = String(cpf).replace(/\D/g, '');
    this.#email          = String(email).trim();
    this.#telefone       = String(telefone).replace(/\D/g, '');
    this.#nivel          = nivel;
    this.#ativo          = Boolean(ativo);
    this.#primeiroAcesso = Boolean(primeiroAcesso);
    this.#dataCadastro   = dataCadastro;
    this.#senha          = senha;
  }

  /* ── Getters ─────────────────────────────────────────────── */
  get id()             { return this.#id; }
  get nome()           { return this.#nome; }
  get login()          { return this.#login; }
  get cpf()            { return this.#cpf; }
  get email()          { return this.#email; }
  get telefone()       { return this.#telefone; }
  get nivel()          { return this.#nivel; }
  get ativo()          { return this.#ativo; }
  get primeiroAcesso() { return this.#primeiroAcesso; }
  get dataCadastro()   { return this.#dataCadastro; }

  /* ── Setters com guarda básica ───────────────────────────── */
  set nome(v)     { this.#nome     = String(v).trim(); }
  set login(v)    { this.#login    = String(v).trim().toLowerCase(); }
  set cpf(v)      { this.#cpf      = String(v).replace(/\D/g, ''); }
  set email(v)    { this.#email    = String(v).trim(); }
  set telefone(v) { this.#telefone = String(v).replace(/\D/g, ''); }
  set ativo(v)    { this.#ativo    = Boolean(v); }
  set senha(v)    { this.#senha    = v; }

  set nivel(v) {
    const permitidos = ['ADM', 'COLABORADOR', 'PAROQUIANO'];
    if (!permitidos.includes(v)) throw new Error(`Nível inválido: ${v}`);
    this.#nivel = v;
  }

  /* ── Information Expert: validações dos próprios atributos ── */

  /**
   * Valida CPF pelo algoritmo oficial da Receita Federal.
   * (Information Expert — quem sabe validar CPF é o próprio Usuário.)
   * @returns {boolean}
   */
  validarCpf() {
    const v = this.#cpf;
    if (v.length !== 11 || /^(\d)\1{10}$/.test(v)) return false;
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += +v[i] * (10 - i);
    let r = (soma * 10) % 11;
    if (r === 10 || r === 11) r = 0;
    if (r !== +v[9]) return false;
    soma = 0;
    for (let i = 0; i < 10; i++) soma += +v[i] * (11 - i);
    r = (soma * 10) % 11;
    if (r === 10 || r === 11) r = 0;
    return r === +v[10];
  }

  /**
   * Valida e-mail com regex RFC básica.
   * @returns {boolean}
   */
  validarEmail() {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.#email);
  }

  /**
   * Valida nome (mínimo 3 caracteres).
   * @returns {boolean}
   */
  validarNome() {
    return this.#nome.length >= 3;
  }

  /**
   * Valida login: mínimo 3 caracteres, apenas letras, números, ponto, hífen e underscore.
   * @returns {boolean}
   */
  validarLogin() {
    return /^[a-z0-9._-]{3,}$/.test(this.#login);
  }

  /**
   * Valida nível de acesso.
   * @returns {boolean}
   */
  validarNivel() {
    return ['ADM', 'COLABORADOR', 'PAROQUIANO'].includes(this.#nivel);
  }

  /**
   * Executa TODAS as validações e retorna lista de erros.
   * Array vazio significa que o objeto é válido.
   * O Controller chama este método e delega resultado ao Validador/View.
   * @returns {string[]}
   */
  validar() {
    const erros = [];
    if (!this.validarNome())   erros.push('Nome deve ter ao menos 3 caracteres.');
    if (!this.validarLogin())  erros.push('Login inválido (mín. 3 caracteres, apenas a-z, 0-9, . - _).');
    if (!this.validarCpf())    erros.push('CPF inválido.');
    if (!this.validarEmail())  erros.push('E-mail inválido.');
    if (!this.validarNivel())  erros.push('Nível de acesso inválido.');
    return erros;
  }

  /* ── Serialização ────────────────────────────────────────── */

  /**
   * Serializa para DTO de envio ao backend.
   * CPF e telefone são enviados sem formatação.
   * @returns {object}
   */
  toDTO() {
    const dto = {
      nome:          this.#nome,
      login:         this.#login,
      cpf:           this.#cpf,
      email:         this.#email,
      telefone:      this.#telefone || null,
      nivel:         this.#nivel,
      ativo:         this.#ativo,
      primeiroAcesso:this.#primeiroAcesso,
    };
    if (this.#id)    dto.id    = this.#id;
    if (this.#senha) dto.senha = this.#senha;
    return dto;
  }

  /**
   * GRASP Creator: constrói um Usuario a partir de resposta do backend.
   * Centraliza o mapeamento campo-a-campo em um único lugar.
   *
   * @param {object} dto - Objeto retornado pelo endpoint /usuarios
   * @returns {Usuario}
   */
  static fromDTO(dto) {
    return new Usuario({
      id:             dto.id,
      nome:           dto.nome,
      login:          dto.login ?? dto.cpf ?? '',   // fallback: login = cpf
      cpf:            dto.cpf,
      email:          dto.email ?? '',
      telefone:       dto.telefone ?? '',
      nivel:          dto.nivel,
      ativo:          dto.status ?? dto.ativo ?? true,
      primeiroAcesso: dto.primeiroAcesso ?? false,
      dataCadastro:   dto.dataCadastro ?? null,
    });
  }
}
