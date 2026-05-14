# AGAPE — Frontend

Sistema de Gestão e Apoio Pastoral Especializado.

Stack: HTML5 + Bootstrap 5 + jQuery 3 + JavaScript ES6+ (vanilla, sem frameworks).

---

## Arquitetura

```
View (HTML + jQuery bind)
  └── chama apenas → Controller (Singleton + Façade)
        ├── instancia → Model (Entidade + validação própria)
        └── chama → Service/DAO (único lugar com fetch)
                      └── usa → ApiService (cliente HTTP central)
```

---

## Como criar um novo CRUD (passo a passo)

Siga os 4 passos abaixo para cada novo caso de uso (ex: Produtos, Eventos, Fornecedores).

### Passo 1 — Criar o Model (`scripts/models/NomeEntidade.js`)

O Model representa a entidade do banco e valida os próprios atributos (GRASP Information Expert).

```javascript
class Produto {
  // Campos privados (encapsulamento ES2022)
  #id; #nome; #preco; #estoque; #ativo;

  constructor({ id = null, nome = '', preco = 0, estoque = 0, ativo = true } = {}) {
    this.#id      = id;
    this.#nome    = String(nome).trim();
    this.#preco   = Number(preco);
    this.#estoque = Number(estoque);
    this.#ativo   = Boolean(ativo);
  }

  // Getters
  get id()      { return this.#id; }
  get nome()    { return this.#nome; }
  get preco()   { return this.#preco; }
  get estoque() { return this.#estoque; }
  get ativo()   { return this.#ativo; }

  // Setters
  set nome(v)    { this.#nome    = String(v).trim(); }
  set preco(v)   { this.#preco   = Number(v); }
  set estoque(v) { this.#estoque = Number(v); }

  // Information Expert: validação dos próprios atributos
  validarNome()   { return this.#nome.length >= 2; }
  validarPreco()  { return this.#preco >= 0; }

  validar() {
    const erros = [];
    if (!this.validarNome())  erros.push('Nome é obrigatório.');
    if (!this.validarPreco()) erros.push('Preço não pode ser negativo.');
    return erros;
  }

  // Serializa para envio ao backend (sem a instância Model)
  toDTO() {
    const dto = { nome: this.#nome, preco: this.#preco, estoque: this.#estoque, ativo: this.#ativo };
    if (this.#id) dto.id = this.#id;
    return dto;
  }

  // GRASP Creator: constrói a partir da resposta do backend
  static fromDTO(dto) {
    return new Produto({ id: dto.id, nome: dto.nome, preco: dto.preco, estoque: dto.estoque, ativo: dto.ativo });
  }
}
```

**Regras:**
- Sem `import`/`export` — arquivos são carregados na ordem via `<script>`.
- Nunca chamar `fetch` no Model.
- Nunca referenciar elementos DOM no Model.
- `validar()` retorna `string[]` (array de mensagens de erro; vazio = válido).

---

### Passo 2 — Criar o Service (`scripts/services/NomeService.js`)

O Service é a única camada que faz `fetch`. Implementa a interface `INomeService` (documentada em comentário).

```javascript
/**
 * Interface INomeService:
 *   listar(filtros, pagina, tamanho) : Promise<{ content, totalPages }>
 *   buscarPorId(id)                 : Promise<object>
 *   salvar(dto)                     : Promise<object>
 *   atualizar(id, dto)              : Promise<object>
 *   alterarStatus(id, ativo)        : Promise<void>
 */
class ProdutoService {
  static #instancia = null;
  #api;

  constructor() {
    if (ProdutoService.#instancia) return ProdutoService.#instancia;
    this.#api = ApiService.getInstance(); // DIP: usa ApiService (abstração HTTP)
    ProdutoService.#instancia = this;
  }

  static getInstance() {
    if (!ProdutoService.#instancia) new ProdutoService();
    return ProdutoService.#instancia;
  }

  async listar(filtros = {}, pagina = 0, tamanho = 15) {
    const params = new URLSearchParams({ page: pagina, size: tamanho });
    if (filtros.nome)       params.set('nome', filtros.nome);
    if (filtros.categoria)  params.set('categoria', filtros.categoria);
    return this.#api.get(`/produtos?${params}`);
  }

  async buscarPorId(id) { return this.#api.get(`/produtos/${id}`); }
  async salvar(dto)      { return this.#api.post('/produtos', dto); }
  async atualizar(id, dto) { return this.#api.put(`/produtos/${id}`, dto); }
  async alterarStatus(id, ativo) { return this.#api.put(`/produtos/${id}`, { ativo }); }
}
```

**Regras:**
- Singleton obrigatório.
- Nunca referencia DOM nem lógica de negócio.
- Sempre delega para `ApiService.getInstance()` — nunca usa `fetch` diretamente.

---

### Passo 3 — Criar o Controller (`scripts/controllers/NomeController.js`)

O Controller é o coração do caso de uso: Singleton + Façade. A View só conhece os métodos públicos.

```javascript
class ProdutosController {
  static #instancia = null;

  // DIP: dependências injetadas como abstrações
  #servico;   // IProdutoService
  #sessao;    // Sessao
  #mascaras;  // Mascaras
  #validador; // Validador

  #produtos = [];
  #filters  = {};
  #page     = 1;
  #perPage  = 15;

  constructor() {
    if (ProdutosController.#instancia) return ProdutosController.#instancia;
    // GRASP Creator: o Controller resolve suas dependências
    this.#servico   = ProdutoService.getInstance();
    this.#sessao    = Sessao.getInstance();
    this.#mascaras  = Mascaras.getInstance();
    this.#validador = Validador.getInstance();
    ProdutosController.#instancia = this;
  }

  static getInstance() {
    if (!ProdutosController.#instancia) new ProdutosController();
    return ProdutosController.#instancia;
  }

  // ═══════════════════════════════════════════════════════
  // FAÇADE — métodos públicos chamados pela View (somente estes)
  // ═══════════════════════════════════════════════════════

  async init() {
    // Verificar acesso, aplicar máscaras, associar eventos, carregar lista
    this.#aplicarMascaras();
    this.#associarEventos();
    await this.#carregar();
  }

  async filtrar()       { this.#coletarFiltros(); this.#page = 1; await this.#carregar(); }
  async limparFiltros() { this.#filters = {}; this.#page = 1; await this.#carregar(); }
  async abrirModal(id)  { await this.#abrirModal(id); }
  async salvar()        { await this.#salvar(); }

  // ═══════════════════════════════════════════════════════
  // PRIVADO — implementação interna oculta da View
  // ═══════════════════════════════════════════════════════

  #aplicarMascaras() {
    this.#mascaras.aplicarA(document.getElementById('produto-preco'), 'moeda');
  }

  #associarEventos() {
    $('#btn-filtrar').on('click',        () => this.filtrar());
    $('#btn-limpar').on('click',         () => this.limparFiltros());
    $('#btn-novo').on('click',           () => this.abrirModal(null));
    $('#btn-salvar').on('click',         () => this.salvar());
  }

  async #carregar() {
    // Chama this.#servico.listar() → renderiza tabela
  }

  async #abrirModal(id) {
    // id null → novo; id preenchido → editar
    // Creator: constrói Produto via Produto.fromDTO(dto)
  }

  async #salvar() {
    const form = document.getElementById('form-produto');
    if (!this.#validador.validarFormulario(form)) return;

    const dados   = { nome: $('#produto-nome').val(), preco: /* desmascarar */ 0 };
    const produto = new Produto(dados);         // Creator
    const erros   = produto.validar();          // Information Expert

    if (erros.length) {
      Toast.show('Corrija os erros.', 'warning');
      return;
    }

    const id = $('#produto-id').val() || null;
    if (id) {
      await this.#servico.atualizar(id, produto.toDTO());
    } else {
      await this.#servico.salvar(produto.toDTO());
    }
    await this.#carregar();
  }

  #coletarFiltros() {
    this.#filters = {};
    const nome = $('#filtro-nome').val().trim();
    if (nome) this.#filters.nome = nome;
    // Filtro 2 (obrigatório): categoria, status, etc.
  }
}
```

**Regras:**
- Singleton obrigatório.
- Todos os métodos públicos são da Façade — a View não conhece mais nada.
- `new Produto(dados)` e `Produto.fromDTO(dto)` só acontecem aqui (Creator).
- `produto.validar()` é chamado aqui, não na View (Information Expert no Model).

---

### Passo 4 — Criar a View (`views/nome/list.html`)

A View **nunca** instancia Models, nunca chama Services, nunca usa `fetch`. Só inicializa o Controller e responde a eventos da UI.

```html
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <title>AGAPE — Produtos</title>
  <link rel="stylesheet" href="../../assets/css/bootstrap.css">
  <link rel="stylesheet" href="../../assets/css/theme.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
</head>
<body>
  <div class="app-layout">
    <div id="sidebar-root"></div>
    <div class="main-content">

      <!-- Filtros (mínimo 2, não podem ser PK) -->
      <div class="card mb-3">
        <div class="card-body py-3">
          <div class="row g-2 align-items-end">
            <!-- Filtro 1: Nome -->
            <div class="col-sm-4">
              <input type="text" class="form-control form-control-sm" id="filtro-nome"
                placeholder="Buscar por nome...">
            </div>
            <!-- Filtro 2: Categoria (NÃO é PK) -->
            <div class="col-sm-3">
              <select class="form-select form-select-sm" id="filtro-categoria">
                <option value="">Todas as categorias</option>
              </select>
            </div>
            <div class="col-sm-3 d-flex gap-2">
              <button class="btn btn-sm btn-primary" id="btn-filtrar">Filtrar</button>
              <button class="btn btn-sm btn-outline-secondary" id="btn-limpar">Limpar</button>
            </div>
            <div class="col-sm-2 text-end">
              <button class="btn btn-sm btn-primary" id="btn-novo">
                <i class="bi bi-plus-lg me-1"></i> Novo
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabela -->
      <div class="card">
        <div class="card-body p-0">
          <table class="table table-hover mb-0">
            <thead>
              <tr>
                <th>#</th><th>Nome</th><th>Preço</th><th>Estoque</th>
                <th class="text-center">Status</th><th class="text-center">Ações</th>
              </tr>
            </thead>
            <tbody id="tbody-produtos"></tbody>
          </table>
        </div>
      </div>

    </div>
  </div>

  <!-- Modal Produto -->
  <div class="modal fade" id="modal-produto" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="modal-produto-title">Novo Produto</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <form id="form-produto" novalidate>
            <input type="hidden" id="produto-id">
            <div class="row g-3">
              <div class="col-md-8">
                <label class="form-label">Nome <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="produto-nome" required maxlength="120">
                <div class="invalid-feedback">Nome é obrigatório.</div>
              </div>
              <div class="col-md-4">
                <label class="form-label">Preço <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="produto-preco" required
                  inputmode="numeric" placeholder="R$ 0,00">
                <div class="invalid-feedback">Informe o preço.</div>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button type="button" class="btn btn-primary" id="btn-salvar">
            <i class="bi bi-check-lg me-1"></i> Salvar
          </button>
        </div>
      </div>
    </div>
  </div>

  <!--
    Ordem de carregamento obrigatória (MVC + Singleton):
    1. Bootstrap + jQuery
    2. Utils base (SessionManager antes de Sessao)
    3. Services (ApiService antes dos Services específicos)
    4. Services/facades (ParametrizacaoFacade)
    5. Models
    6. Controllers
  -->
  <script src="../../assets/js/bootstrap.bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>

  <script src="../../scripts/utils/SessionManager.js"></script>
  <script src="../../scripts/utils/Sessao.js"></script>
  <script src="../../scripts/utils/Toast.js"></script>
  <script src="../../scripts/utils/Mask.js"></script>
  <script src="../../scripts/utils/Mascaras.js"></script>
  <script src="../../scripts/utils/Validador.js"></script>
  <script src="../../scripts/utils/Router.js"></script>
  <script src="../../scripts/utils/SidebarLoader.js"></script>

  <script src="../../scripts/services/ApiService.js"></script>
  <script src="../../scripts/services/AuthService.js"></script>
  <script src="../../scripts/services/facades/ParametrizacaoFacade.js"></script>
  <script src="../../scripts/services/ProdutoService.js"></script>

  <script src="../../scripts/models/Produto.js"></script>

  <script src="../../scripts/controllers/DashboardController.js"></script>
  <script src="../../scripts/controllers/ProdutosController.js"></script>

  <script>
    document.addEventListener('DOMContentLoaded', async () => {
      Router.protect();                     // redireciona se não autenticado
      await SidebarLoader.load();           // carrega sidebar dinamicamente
      new DashboardController().init();     // carrega logo/nome da empresa
      ProdutosController.getInstance().init(); // inicializa o caso de uso
    });
  </script>
</body>
</html>
```

**Regras:**
- A View **não cria** `new Produto()` — quem cria é o Controller.
- A View **não chama** `ProdutoService.listar()` — quem chama é o Controller.
- A View **só chama** métodos públicos do Controller (Façade): `init()`, `filtrar()`, `salvar()`, `abrirModal()`.
- A View usa `Router.protect()` para garantir autenticação antes de qualquer coisa.

---

## Checklist para cada novo CRUD

Antes de considerar um caso de uso completo, verifique:

- [ ] **Model criado** em `scripts/models/` com `validar()` e `toDTO()` e `fromDTO()`
- [ ] **Service criado** em `scripts/services/` implementando a interface documentada no comentário
- [ ] **Controller criado** em `scripts/controllers/` como Singleton + Façade, com `init()` público
- [ ] **View criada** em `views/nome/` carregando os scripts na ordem correta
- [ ] **2 filtros não-PK** na tela de consulta
- [ ] **Máscaras aplicadas** via `Mascaras.aplicarA()` no Controller
- [ ] **Validação Bootstrap** via `Validador.validarFormulario()` antes de salvar
- [ ] **CPF/CNPJ validado** via `Model.validarCpf()` ou `Mascaras.validarCnpj()` (Information Expert)
- [ ] **Campos obrigatórios** com `required` no HTML e `.invalid-feedback` adjacente
- [ ] **Soft-delete** implementado (ativar/desativar, nunca excluir fisicamente usuários)
- [ ] **Controle de acesso** via `Sessao.temPermissao('ADM')` no Controller
- [ ] **ParametrizacaoFacade** inicializada na tela principal se necessário
- [ ] **Route protegida** em `Router.js` com o perfil correto
- [ ] **Singleton** confirmado no Controller e no Service

---

## Mapeamento de Padrões → Arquivos (resumo para apresentação)

| Padrão | Arquivo(s) |
|--------|-----------|
| SRP | Cada arquivo tem 1 responsabilidade |
| OCP | `Mascaras.registrar()`, `Validador.registrarRegra()` |
| LSP | Subclasses de Model mantêm contrato `validar()/toDTO()/fromDTO()` |
| ISP | Interfaces documentadas nos Services; `Validador` com API mínima |
| DIP | Controllers → Services (abstração), não → ApiService (concreto) |
| Information Expert | `validarCpf()` em `Usuario.js`; `validarCnpj()` em `Mascaras.js` |
| Creator | Controllers criam Models (`new Usuario(dados)`, `Usuario.fromDTO(dto)`) |
| Controller (GRASP) | 1 Controller por caso de uso (`UsuariosController`, `ProdutosController`...) |
| Low Coupling | View → Controller; Controller → Service; Model não conhece ninguém |
| High Cohesion | Cada classe com responsabilidade única e bem delimitada |
| Singleton | `Sessao`, `Mascaras`, `Validador`, `ParametrizacaoFacade`, `ApiService`, todos os Services e Controllers |
| Façade | `UsuariosController` (View só chama métodos públicos); `ParametrizacaoFacade` (qualquer tela chama `inicializar()`) |

---

## Ordem de carregamento dos scripts (todas as telas protegidas)

```html
<!-- 1. Libs externas -->
<script src="../../assets/js/bootstrap.bundle.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>

<!-- 2. Utils (SessionManager ANTES de Sessao; Mask ANTES de Mascaras) -->
<script src="../../scripts/utils/SessionManager.js"></script>
<script src="../../scripts/utils/Sessao.js"></script>
<script src="../../scripts/utils/Toast.js"></script>
<script src="../../scripts/utils/Mask.js"></script>
<script src="../../scripts/utils/Mascaras.js"></script>
<script src="../../scripts/utils/Validador.js"></script>
<script src="../../scripts/utils/Router.js"></script>
<script src="../../scripts/utils/SidebarLoader.js"></script>

<!-- 3. Services (ApiService ANTES dos demais) -->
<script src="../../scripts/services/ApiService.js"></script>
<script src="../../scripts/services/AuthService.js"></script>
<script src="../../scripts/services/facades/ParametrizacaoFacade.js"></script>
<script src="../../scripts/services/SeuService.js"></script>

<!-- 4. Models -->
<script src="../../scripts/models/SuaEntidade.js"></script>

<!-- 5. Controllers (DashboardController ANTES do Controller específico) -->
<script src="../../scripts/controllers/DashboardController.js"></script>
<script src="../../scripts/controllers/SeuController.js"></script>

<!-- 6. Bootstrap mínimo da página -->
<script>
  document.addEventListener('DOMContentLoaded', async () => {
    Router.protect();
    await SidebarLoader.load();
    new DashboardController().init();
    SeuController.getInstance().init();
  });
</script>
```
