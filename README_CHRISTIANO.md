# 📋 Guia de Defesa Técnica - Projeto Agape 2026 (Por: Christiano)

Este documento detalha as implementações técnicas e a visão arquitetural que apliquei para garantir que o sistema siga rigorosamente a **ERS (Especificação de Requisitos de Software) v9**.

---

## 🚀 1. Visão de Back-end Desacoplado (Generalização)
Um dos meus principais focos foi garantir que o **Back-end não seja dependente do Front-end**.
- **Independência de Interface:** Desenvolvi os controladores para que recebam dados de forma padronizada. Isso significa que a nossa implementação atual em HTML pode ser substituída por um aplicativo mobile ou outro sistema, e o Back-end continuará processando as regras de negócio corretamente.
- **Princípio da Responsabilidade Única:** O Front-end apenas captura e exibe os dados (Captura), enquanto a **Regra de Negócio Real** está protegida dentro das classes Java.

## 🏛️ 2. Arquitetura e Padrões (MVC e Singleton)
Seguindo o padrão de projeto aprovado:
- **Controllers (`CCompra`, `CParametrizacao`, `CInscricao`):** Atuam como os "maestros" do sistema. Eu implementei métodos de extração que limpam e validam os dados antes de qualquer processamento, seguindo os fluxos definidos na **ERS v9**.
- **Singleton (`ConexaoBD`):** Garanti que a comunicação com o MySQL seja eficiente e segura, evitando o desperdício de memória e conexões abertas.

## ⚙️ 3. Regras de Negócio em Funções Específicas
Para cada módulo, tive o cuidado de seguir as regras operacionais da paróquia:

### A. Parametrização (`ParametrizacaoDAO.java`)
- **Gestão de Registro Único:** Implementei uma lógica que garante que a paróquia tenha apenas uma configuração oficial. O sistema decide de forma inteligente entre um `INSERT` ou `UPDATE`, mantendo a integridade do banco.
- **Mapeamento Total:** Garanti a persistência de todos os 23 atributos, incluindo logotipos e dados fiscais, sem perda de informação.

### B. Gestão de Compras (`CCompra.java`)
- **Tratamento de Dados de Entrada:** Usei o método `parseSafeFloat` para criar uma camada de compatibilidade. O usuário pode digitar valores com vírgula ou ponto, e o sistema adapta o dado automaticamente sem gerar erros.
- **Consistência de Inventário:** Ao registrar uma compra, o sistema executa uma **Transação Atômica**: grava o histórico em `ItemCompra` e atualiza o saldo em `Produto` de forma simultânea. Se um falhar, o outro não é gravado, mantendo o estoque sempre auditável.

### C. Segurança no Cancelamento (`CInscricao.java`)
- **Validação de Fluxo:** Implementei a regra que impede o cancelamento de itens já inativos. Isso protege o banco de dados contra estados inconsistentes e garante que o histórico de motivos (`OBS`) seja preservado.

## 🛡️ 4. Robustez de Comunicação (JSON)
- **Blindagem de Dados:** Reescrevi o método `toJson` da classe `ResponseObject` para que ele realize o escape automático de caracteres especiais. Isso resolveu definitivamente os erros de comunicação que aconteciam quando o usuário digitava aspas ou quebras de linha em campos de texto (como Observações).

---
**Conclusão para a Apresentação:**
Toda a minha implementação foi guiada pelo documento **ERS v9**. O resultado é um sistema robusto, onde o Back-end funciona como um motor de regras independente, pronto para suportar qualquer tipo de interface de captura de dados.
