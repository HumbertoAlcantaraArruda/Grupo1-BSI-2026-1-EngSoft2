# AGAPE — Frontend

Sistema de Gestão e Apoio Pastoral Especializado — módulos: Produtos, Categoria de Produto e Categoria de Evento.

---

## a) Como baixar e organizar as bibliotecas locais

Baixe cada arquivo e coloque na pasta indicada:

| Biblioteca | URL de download | Destino |
|---|---|---|
| Bootstrap 5.3.3 (zip) | https://github.com/twbs/bootstrap/releases/download/v5.3.3/bootstrap-5.3.3-dist.zip | Extraia e copie `bootstrap.min.css` → `assets/libs/bootstrap/css/` e `bootstrap.bundle.min.js` → `assets/libs/bootstrap/js/` |
| jQuery 3.7.1 | https://code.jquery.com/jquery-3.7.1.min.js | `assets/libs/jquery/jquery.min.js` |
| jQuery Mask Plugin 1.14.16 | https://github.com/igorescobar/jQuery-Mask-Plugin/releases/download/1.14.16/jquery.mask.min.js | `assets/libs/jquery-mask/jquery.mask.min.js` |
| Bootstrap Icons 1.11.3 (zip) | https://github.com/twbs/icons/releases/download/v1.11.3/bootstrap-icons-1.11.3.zip | Extraia e copie `bootstrap-icons.min.css` e a pasta `fonts/` para `assets/libs/icons/` |

Após a organização, a pasta `assets/libs/` deve ter esta estrutura:

```
assets/libs/
├── bootstrap/
│   ├── css/bootstrap.min.css
│   └── js/bootstrap.bundle.min.js
├── jquery/
│   └── jquery.min.js
├── jquery-mask/
│   └── jquery.mask.min.js
└── icons/
    ├── bootstrap-icons.min.css
    └── fonts/
        ├── bootstrap-icons.woff
        └── bootstrap-icons.woff2
```

---

## b) Como rodar o projeto

O frontend é um conjunto de arquivos estáticos. Escolha uma das opções abaixo:

**Opção 1 — VS Code com Live Server (recomendado)**
1. Instale a extensão "Live Server" no VS Code.
2. Abra a pasta `FrontEnd/` no VS Code.
3. Clique com o botão direito em qualquer arquivo `.html` da pasta `views/` e escolha **"Open with Live Server"**.
4. O navegador abrirá em `http://127.0.0.1:5500/views/produtos.html`.

**Opção 2 — Python HTTP Server**
```bash
# Na raiz do projeto FrontEnd/:
python -m http.server 5500

# Acesse no navegador:
# http://localhost:5500/views/produtos.html
```

**Opção 3 — Node.js serve**
```bash
npx serve .
```

> O backend Java deve estar rodando em `http://localhost:8080` antes de abrir o frontend.

---

## c) Como criar um novo módulo CRUD

Para criar o módulo **Estoque**, por exemplo, siga esta ordem exata e crie estes 5 arquivos:

### Passo 1 — Model (`models/Estoque.js`)

```javascript
window.AGAPE.Models.Estoque = (function () {
    function Estoque(dados) {
        dados = dados || {};
        this._id   = dados.id   || null;
        this._nome = dados.nome || '';
        // ... demais atributos
    }

    // Getters, Setters e validações dos próprios atributos (Information Expert)
    Estoque.prototype.validar = function () {
        var erros = [];
        if (!this._nome || this._nome.trim().length < 2)
            erros.push('Nome deve ter pelo menos 2 caracteres.');
        return erros;
    };

    Estoque.prototype.paraFormData = function () {
        var dados = { nome: this._nome };
        if (this._id) dados.id = this._id;
        return dados;
    };

    return Estoque;
})();
```

### Passo 2 — Service (`services/EstoqueService.js`)

```javascript
window.AGAPE.Services.EstoqueService = (function () {
    var instancia = null;

    function EstoqueService() {
        this._http = window.AGAPE.Utils.HttpClient.getInstance();
    }

    EstoqueService.prototype.listar    = async function (filtros) { return await this._http.get('/estoque', filtros); };
    EstoqueService.prototype.cadastrar = async function (obj)     { return await this._http.post('/estoque', obj.paraFormData()); };
    EstoqueService.prototype.alterar   = async function (obj)     { return await this._http.put('/estoque', obj.paraFormData()); };
    EstoqueService.prototype.excluir   = async function (id)      { return await this._http.delete('/estoque', { id }); };

    return { getInstance: function () { if (!instancia) instancia = new EstoqueService(); return instancia; } };
})();
```

### Passo 3 — Controller (`controllers/EstoqueController.js`)

```javascript
window.AGAPE.Controllers.EstoqueController = (function () {
    var instancia = null;

    function EstoqueController() {
        this._service = window.AGAPE.Services.EstoqueService.getInstance();
    }

    EstoqueController.prototype.listar    = async function ()      { return await this._service.listar(); };
    EstoqueController.prototype.cadastrar = async function (dados) {
        var obj    = new window.AGAPE.Models.Estoque(dados);
        var erros  = obj.validar();
        if (erros.length > 0) return { sucesso: false, erro: erros.join(' ') };
        return await this._service.cadastrar(obj);
    };
    // ... alterar, excluir seguem o mesmo padrão

    return { getInstance: function () { if (!instancia) instancia = new EstoqueController(); return instancia; } };
})();
```

### Passo 4 — View HTML (`views/estoque.html`)

Copie `views/produtos.html`, substitua:
- Título e `<title>` para "Estoque"
- Colunas da tabela pelos atributos de Estoque
- IDs dos campos do formulário pelos atributos de Estoque
- `colspan` da tabela conforme o número de colunas
- Referências aos scripts: `../models/Estoque.js`, `../services/EstoqueService.js`, `../controllers/EstoqueController.js`, `./estoque.js`

### Passo 5 — View JS (`views/estoque.js`)

Copie `views/produtos.js`, substitua:
- `ProdutosController` por `EstoqueController`
- IDs dos campos (`#nome`, `#valorUni`, etc.) pelos campos de Estoque
- Lógica de renderização da tabela pelos atributos de Estoque

### Passo 6 — Plugar na Sidebar (`utils/Sidebar.js`)

Adicione o novo item ao array `_itens`:

```javascript
{
    rotulo: 'Estoque',
    href:   'estoque.html',
    icone:  'bi-archive'
}
```

### Resumo da ordem de desenvolvimento

```
models/Estoque.js
services/EstoqueService.js
controllers/EstoqueController.js
views/estoque.html
views/estoque.js
utils/Sidebar.js  ← adicionar item
```

> Regra de ouro: a View **nunca** importa ou chama diretamente Service, Model ou fetch. Tudo passa pelo Controller.
