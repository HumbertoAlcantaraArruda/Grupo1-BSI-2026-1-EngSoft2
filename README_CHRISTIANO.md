# 🛡️ Módulo do Christiano - Backend Agape 2026

Este documento contém os guias e links para consulta e teste das funcionalidades desenvolvidas pelo Christiano.

## 🚀 Endpoints Disponíveis (Localhost:8080)

| Funcionalidade | Método | Link / URL | Parâmetros Principais |
| :--- | :--- | :--- | :--- |
| **Parametrização** | GET | [Ver Dados](http://localhost:8080/parametrizacao) | Nenhum |
| **Salvar Parâmetros** | POST | `http://localhost:8080/parametrizacao` | `cnpj`, `razaoSocial`, `endereco`, etc. |
| **Cancelar Inscrição** | POST | `http://localhost:8080/cancelarInscricao` | `idInscricao`, `obs` |
| **Efetuar Compra** | POST | `http://localhost:8080/comprar` | `idFornecedor`, `idProdutos`, `quantidades` |

## 🛠️ Como Testar (Exemplos)

### 1. Cancelamento com Lista de Espera
No Postman, use o método **POST** com `x-www-form-urlencoded`:
- `idInscricao`: 6
- `obs`: Desistência por motivo pessoal

### 2. Compra de Produtos e Estoque
No Postman, use o método **POST**:
- `idFornecedor`: 1
- `valorTotal`: 40.50
- `idProdutos`: 1,2
- `quantidades`: 1,1
- `valoresUnitarios`: 25.50,15.00

## 📂 Arquitetura Técnica
O sistema segue o padrão **Singleton** para conexão com o banco e passa a variável `Connection conn` por parâmetro para todos os DAOs, garantindo que as transações (Commit/Rollback) funcionem corretamente.

---
*Documentação gerada para auxílio ao desenvolvedor Christiano.*
