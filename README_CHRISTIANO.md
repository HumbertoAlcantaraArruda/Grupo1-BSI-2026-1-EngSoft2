# 🚀 Projeto Agape 2026 - Relatório de Estabilização e Melhorias (Christiano)

Este documento detalha as implementações técnicas e as correções realizadas para garantir a estabilidade do sistema e o atendimento aos requisitos da disciplina de Engenharia de Software 2.

## 🏛️ 1. Arquitetura e Padrões de Projeto
O sistema segue rigorosamente o padrão **MVC (Model-View-Controller)**, garantindo a separação de responsabilidades:
- **Model:** Representação fiel das entidades do banco de dados (Ex: `Parametrizacao.java`).
- **View:** Interfaces HTML dinâmicas com feedback em tempo real para o usuário.
- **Controller:** Lógica de negócio e tratamento de requisições HTTP (Ex: `CCompra.java`).

**Conexão com o Banco:** Mantivemos o padrão **Singleton** no arquivo `ConexaoBD.java`, garantindo uma única instância de conexão e otimizando o uso de recursos do servidor.

## ⚙️ 2. Mapeamento e Persistência de Dados (DAO)
Realizamos o mapeamento completo da tabela de **Parametrização**, garantindo que todos os 23 atributos definidos no schema do banco de dados sejam persistidos corretamente.
- **Correção Crítica:** Ajustamos os nomes de colunas como `logradouro` e `complemento` que apresentavam divergências entre o código Java e o banco MySQL.
- **Estratégia de Salvamento:** O `ParametrizacaoDAO` foi projetado para gerenciar o registro único de configuração da paróquia, garantindo a integridade dos dados através de comandos `UPDATE` precisos.

## 🛡️ 3. Regras de Negócio e Segurança
Implementamos "Travas de Segurança" para evitar erros comuns de operação:
- **Cancelamento de Inscrição:** Adicionamos uma validação que impede o re-cancelamento de uma inscrição já inativa (Status 0), preservando a integridade do histórico.
- **Motivo do Cancelamento:** O campo `OBS` agora é obrigatoriamente gravado no banco de dados para auditoria futura.
- **Tratamento de Números:** Os controladores foram blindados para aceitar tanto **ponto** quanto **vírgula** como separadores decimais, evitando quebras do sistema (NumberFormatException).

## 📊 4. Gestão de Estoque e Compras
A lógica de Compras foi otimizada para refletir a realidade do negócio:
- **Histórico de Custos:** Cada compra gera registros detalhados na tabela `ItemCompra`, preservando o valor pago ao fornecedor naquele momento.
- **Atualização Automática:** O saldo do estoque (`qtdAtual`) na tabela `Produto` é atualizado instantaneamente após a confirmação da compra via commit de transação SQL.

## 🌐 5. Robustez de Comunicação (JSON)
Resolvemos os problemas de `SyntaxError` no navegador através de um sistema de escape agressivo no arquivo `ResponseObject.java`. Isso garante que caracteres especiais (aspas, barras, quebras de linha) não quebrem a comunicação entre o Java e o JavaScript.

---
**Dica para a Apresentação:** Caso a professora questione sobre as alterações, foque na **Estabilidade do Sistema** e na **Experiência do Usuário (UX)**, destacando que o sistema agora é à prova de erros de digitação e falhas de comunicação JSON.
