# AGAPE - FRONTEND

Antes de iniciar qualquer implementação, alteração estrutural ou criação de novos componentes, você DEVE analisar e respeitar a estrutura atual existente do projeto.

NÃO reorganize pastas, NÃO renomeie diretórios e NÃO crie uma nova arquitetura sem antes verificar como o sistema já está organizado.

O sistema AGAPE é um sistema WEB desenvolvido em Java utilizando arquitetura MVC.

---

# Regra Obrigatória

Sempre verificar:

- Estrutura atual de diretórios
- Organização atual das telas
- Convenções já utilizadas
- Componentes já existentes
- Padrão visual atual
- Forma atual de comunicação entre camadas
- Estrutura dos controllers
- Estrutura das entidades/models
- Estrutura de persistência DAO
- Organização de assets
- Padronização de nomes

Antes de sugerir qualquer alteração arquitetural.

---

# Objetivo

O objetivo é manter:

- Consistência arquitetural
- Padronização
- Baixo acoplamento
- Alta coesão
- Facilidade de manutenção
- Compatibilidade com código existente

Conforme princípios SOLID e GRASP. :contentReference[oaicite:0]{index=0} :contentReference[oaicite:1]{index=1}

---

# Arquitetura Obrigatória

O projeto segue obrigatoriamente:

- MVC
- DAO
- SOLID
- GRASP
- GOF (Singleton e Façade)

Conforme exigido pela disciplina. :contentReference[oaicite:2]{index=2}

---

# Frontend WEB

O frontend é responsável apenas por:

- Interface visual
- Navegação
- Captura de eventos
- Validações visuais
- Máscaras
- Comunicação com Controllers

A camada View NÃO deve conter:

- SQL
- Regras de negócio
- Persistência
- Regras financeiras
- Controle de estoque

Conforme MVC ensinado em aula. :contentReference[oaicite:3]{index=3}

---

# Tecnologias Esperadas

Verifique quais tecnologias o projeto já utiliza antes de implementar.

Possíveis tecnologias já existentes:

- HTML
- CSS
- JavaScript
- Bootstrap
- JSP
- Servlets
- Java MVC
- JDBC
- MySQL Connector

Nunca assumir frameworks sem verificar a estrutura atual.

---

# Regras para Novos Arquivos

Ao criar novos arquivos:

- Seguir exatamente o padrão atual do projeto
- Manter nomenclaturas existentes
- Reutilizar componentes existentes
- Evitar duplicação
- Seguir padrão visual existente

---

# Estrutura

Antes de criar:

- novas pastas
- novos módulos
- novos componentes
- novos serviços
- novos helpers
- novos utilitários

Você DEVE verificar se já existe uma estrutura equivalente no projeto.

---

# Componentização

Sempre reutilizar:

- componentes existentes
- layouts existentes
- tabelas existentes
- formulários existentes
- estilos existentes

Evitar recriar componentes já implementados.

---

# Validações Obrigatórias

Manter as validações exigidas pela disciplina:

- Campos obrigatórios
- Máscaras
- Dois filtros mínimos nas consultas
- CRUD completo quando necessário

Conforme instruções oficiais. :contentReference[oaicite:4]{index=4}

---

# Controle de Acesso

Verificar implementação atual de:

- login
- permissões
- níveis de acesso
- sessão
- usuário ativo/inativo

Antes de modificar autenticação.

Conforme requisitos do projeto AGAPE.

---

# Objetivo Arquitetural

Toda implementação deve priorizar:

- Alta coesão
- Baixo acoplamento
- Reutilização
- Clareza arquitetural
- Padronização visual
- Facilidade de manutenção

Conforme GRASP, SOLID e MVC