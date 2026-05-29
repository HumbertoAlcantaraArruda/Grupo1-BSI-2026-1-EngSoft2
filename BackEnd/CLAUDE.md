# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

AGAPE (Ambiente de Gestão e Apoio Pastoral Especializado) — BackEnd module. A Java HTTP API built on the JDK's embedded `com.sun.net.httpserver.HttpServer`, running on port 8080. No framework, no Maven/Gradle — just raw JDBC + MySQL.

---

## Build & Run

This project has no Maven/Gradle. It is built via IntelliJ IDEA (`.iml` file). The sole external dependency is `lib/mysql-connector-j-9.7.0.jar`.

**Compile manually:**
```bash
javac -d out/production/BackEnd \
  -cp lib/mysql-connector-j-9.7.0.jar \
  src/agape/Main.java \
  src/agape/control/*.java \
  src/agape/dao/*.java \
  src/agape/model/*.java \
  src/agape/util/*.java
```

**Run:**
```bash
java -cp out/production/BackEnd:lib/mysql-connector-j-9.7.0.jar agape.Main
```
Server starts at `http://localhost:8080` (printed to stdout on launch).

**No test infrastructure exists.**

---

## Architecture

### Layer Flow

```
HTTP Request → Controller (agape/control/) → DAO (agape/dao/) → MySQL (remote)
                     ↓
              ResponseObject (agape/util/) → JSON response
```

### Controllers (`agape/control/`)
- Implement `com.sun.net.httpserver.HttpHandler`
- Each controller is a **Singleton** (e.g., `CUsuario.getInstancia()`)
- Route registration happens in `Main.java` via `server.createContext()`
- Pattern: `handle()` dispatches to `handleGet()`, `handlePost()`, `handlePut()`, `handleDelete()` based on `exchange.getRequestMethod()`
- All controllers set CORS headers on every response (including OPTIONS preflight)

### DAOs (`agape/dao/`)
- Raw JDBC with `PreparedStatement` — no ORM
- Each DAO has a private `mapear(ResultSet rs)` method that maps a row to a model instance
- All methods accept a `Connection` parameter (passed from controller), enabling transaction scope
- Insert methods return the generated key via `Statement.RETURN_GENERATED_KEYS`

### Models (`agape/model/`)
- Plain POJOs with private fields + getters/setters
- Each model implements a manual `toJson()` method using `StringBuilder` (no JSON library)
- `java.time.LocalDateTime` used for timestamps

### Utilities (`agape/util/`)
- **`ResponseObject`**: Standard response envelope `{ status, code, messages[], result }`. Serializes the `result` field by calling `toJson()` via reflection — so every model returned in a response must implement `toJson()`.
- **`Criptografia`**: Static `hashSenha(String)` — SHA-256 hex digest used for passwords.

### Database Connection (`agape/control/ConexaoBD.java`)
- Singleton. Reads `config.properties` from classpath for `db.url`, `db.user`, `db.password`
- Single shared `Connection` instance — no pooling. Validates connection health before reuse (checks `isClosed()`)
- Database: remote MySQL at `mysql.humcode.com.br:3306`

### Transactions
Controllers like `CCompra` and `CInscricao` manage transactions manually: `conn.setAutoCommit(false)` → business logic → `conn.commit()` / `conn.rollback()` in catch block.

---

## Key Conventions

- **Singletons**: Every controller class has a private constructor and a static `getInstancia()` method.
- **JSON serialization**: No library (Jackson, Gson, etc.). All `toJson()` methods are hand-written in each model. When adding a new field to a model, update its `toJson()` method.
- **HTTP status codes in use**: 200, 201, 400, 401, 403, 404, 409, 500 — returned via `ResponseObject`.
- **Query parameter parsing**: Controllers read URL query strings via `exchange.getRequestURI().getQuery()` and split manually. Body is read from `exchange.getRequestBody()`.
- **Mandatory architectural patterns** (per course requirements): MVC, DAO, SOLID, GRASP, GOF Singleton and Façade.

---

## Routes

| Path | Controller | Methods |
|------|-----------|---------|
| `/login` | CUsuario | POST |
| `/cadastrar` | CUsuario | POST |
| `/usuarios` | CUsuario | GET, POST |
| `/usuario` | CUsuario | GET, PUT, POST |
| `/comprar` | CCompra | POST |
| `/parametrizacao` | CParametrizacao | GET, PUT |
| `/cancelarInscricao` | CInscricao | POST |
| `/categoriaEvento` | CCategoriaEvento | GET, POST, PUT |
| `/produto` | CProduto | GET, POST, PUT, DELETE |
