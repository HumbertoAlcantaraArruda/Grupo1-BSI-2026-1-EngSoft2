<div align="center">

# AGAPE
### Ambiente de Gestão e Apoio Pastoral Especializado

*Sistema de gestão paroquial desenvolvido como projeto acadêmico da disciplina de Engenharia de Software II — BSI 2026.1*

![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)

</div>

---

## Sobre o Projeto

O AGAPE é um sistema desktop/web voltado à gestão de paróquias, permitindo o controle de produtos, categorias e configurações institucionais. O projeto foi desenvolvido seguindo rigorosamente os padrões e princípios exigidos pela disciplina.

---

## Arquitetura e Padrões

| Camada | Padrão |
|---|---|
| Estrutural | **MVC** (Model — View — Controller) + **DAO** |
| Princípios | **SOLID** (SRP, OCP, LSP, ISP, DIP) |
| Responsabilidade | **GRASP** (Information Expert, Creator, Controller, Low Coupling, High Cohesion) |
| Design | **GOF** — Singleton e Façade |

### Fluxo de dados

```
View (HTML + JS)
    └── Controller (Singleton + Façade)
            └── Service (única camada que faz HTTP)
                    └── HttpClient
                            └── API REST (Java HttpServer)
                                    └── DAO
                                            └── MySQL
```

---

## Stack Tecnológica

### Backend
- **Java 21** com `com.sun.net.httpserver` (sem framework)
- **MySQL** via **JDBC** (MySQL Connector/J)
- Padrão de resposta: `{ status, code, messages, result }`

### Frontend
- **HTML5 + CSS3 + JavaScript ES6+** (sem build tools)
- **Bootstrap 5.3** — layout e componentes
- **jQuery 3.7** + **jQuery Mask Plugin 1.14** — interatividade e máscaras
- **Bootstrap Icons 1.11** — ícones
- Todas as bibliotecas servidas **localmente** (sem CDN)

---

## Módulos Implementados

| Módulo | Descrição | Filtros |
|---|---|---|
| **Produtos** | CRUD completo de produtos com valor e quantidade | Nome, Categoria, Quantidade (com operador >=, <=, >, <, =) |
| **Categoria de Produto** | Gerenciamento de categorias de produtos | Nome, Status (filtro no frontend) |
| **Categoria de Evento** | Gerenciamento de categorias de eventos | Nome, Status (filtro via API) |
| **Parametrização** | Configurações institucionais da entidade | — |

---

## Estrutura do Projeto

```
Grupo1-BSI-2026-1-EngSoft2/
├── BackEnd/
│   └── src/agape/
│       ├── control/          # Controllers HTTP (handlers por endpoint)
│       ├── dao/              # Acesso ao banco de dados
│       ├── model/            # Entidades (POJOs)
│       ├── util/             # ResponseObject e utilitários
│       └── Main.java         # Inicialização do servidor na porta 8080
│
└── FrontEnd/
    ├── assets/
    │   ├── css/agape.css     # Design system e identidade visual
    │   ├── img/              # Logotipos da entidade
    │   └── libs/             # Bootstrap, jQuery, Icons (locais)
    ├── controllers/          # Fachadas por caso de uso (Singleton)
    ├── models/               # Entidades com validações
    ├── services/             # Chamadas HTTP à API
    ├── utils/                # HttpClient, Mascaras, Validador, Sidebar
    └── views/                # HTML + JS de bind (sem lógica de negócio)
```

---

## Rotas da API

Base URL: `http://localhost:8080`

| Método | Rota | Descrição |
|---|---|---|
| GET | `/produto` | Lista produtos com filtros opcionais |
| POST | `/produto` | Cadastra produto |
| PUT | `/produto` | Atualiza produto |
| DELETE | `/produto?idProd={id}` | Remove produto |
| GET | `/categoriaProduto` | Lista todas as categorias de produto |
| POST | `/categoriaProduto` | Cadastra categoria de produto |
| PUT | `/categoriaProduto` | Atualiza categoria de produto |
| DELETE | `/categoriaProduto?idCatProd={id}` | Remove categoria de produto |
| GET | `/categoriaEvento` | Lista categorias de evento com filtros |
| POST | `/categoriaEvento` | Cadastra categoria de evento |
| PUT | `/categoriaEvento` | Atualiza categoria de evento |
| DELETE | `/categoriaEvento?idCatEvento={id}` | Remove categoria de evento |
| GET | `/parametrizacao` | Retorna configurações da entidade |
| POST | `/parametrizacao` | Salva configurações |
| POST | `/parametrizacao/logo` | Envia logotipos (base64) |

> Corpos de POST e PUT usam `application/x-www-form-urlencoded`.  
> Upload de logos usa `application/json` com imagem em base64.

---

## Como Executar

### Pré-requisitos

- Java 21+
- MySQL 8.0+
- IDE (IntelliJ IDEA ou NetBeans) ou JDK na linha de comando
- Navegador moderno + extensão Live Server (VS Code) **ou** Python 3

### 1. Banco de Dados

```sql
CREATE DATABASE agape;
USE agape;
-- Execute o script SQL de criação das tabelas
```

Configure a conexão em `BackEnd/src/agape/control/ConexaoBD.java`:

```java
private static final String URL    = "jdbc:mysql://localhost:3306/agape";
private static final String USUARIO = "seu_usuario";
private static final String SENHA   = "sua_senha";
```

### 2. Backend

```bash
# Via IntelliJ / NetBeans: execute a classe Main.java
# Via linha de comando (na pasta BackEnd/):
javac -cp lib/* -d out src/agape/**/*.java
java -cp out:lib/* agape.Main
```

O servidor iniciará em `http://localhost:8080`.

### 3. Frontend

```bash
# Opção 1 — VS Code com extensão Live Server
# Clique com botão direito em views/produtos.html → "Open with Live Server"

# Opção 2 — Python
cd FrontEnd
python -m http.server 5500
# Acesse: http://localhost:5500/views/produtos.html
```

> **Atenção:** o frontend acessa `http://localhost:8080` diretamente. O backend deve estar rodando antes de abrir o navegador.

---

## Identidade Visual

| Papel | Cor |
|---|---|
| Primária (botões, cabeçalhos de modal) | `#8C142A` |
| Hover / Ativo | `#730E29` |
| Estrutural (sidebar, cabeçalhos de tabela) | `#024040` |
| Sucesso | `#41733F` |
| Fundo | `#F2F2F2` |

---

## Equipe

Desenvolvido pelo **Grupo 1** — Bacharelado em Sistemas de Informação, 2026.1.

---

## Disciplina

> Engenharia de Software II — Projeto prático com aplicação obrigatória de MVC, DAO, SOLID, GRASP e padrões GOF (Singleton e Façade).
