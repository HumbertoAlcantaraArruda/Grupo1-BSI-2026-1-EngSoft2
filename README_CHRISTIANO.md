# 📋 Guia de Defesa Técnica - Projeto Agape 2026 (Por: Christiano)

Este documento detalha as implementações técnicas e a visão arquitetural que apliquei, integrando o código diretamente com as especificações da **ERS (Especificação de Requisitos de Software)**.

---

## 🚀 1. Visão de Back-end Desacoplado (Generalização)
Um dos meus principais focos foi garantir que o **Back-end seja um motor de regras independente**.
- **Independência de Interface:** Os controladores foram desenhados para serem agnósticos. A nossa implementação atual em HTML/JS é apenas uma das "faces" possíveis; o Back-end está pronto para suportar Mobile ou Desktop sem alterações nas regras de negócio.
- **Princípio da Responsabilidade Única:** O Front-end captura os dados, mas a **inteligência e proteção dos dados** residem nas classes Java.

---

## 🏛️ 2. Mapeamento de Regras de Negócio (Flashes da ERS)

Para cada funcionalidade, tive o cuidado de seguir o fluxo documental. Abaixo, destaco como o código reflete a ERS:

### A. Gestão de Compras (`CCompra.java`)
> **Flash ERS:** *"As compras realizadas junto aos fornecedores podem ser registradas no sistema, atualizando automaticamente o estoque com as quantidades recebidas."*

- **Minha Implementação:** Desenvolvi a função `efetuarCompraDeProdutos` que executa essa regra de forma atômica. Ela registra o custo histórico em `ItemCompra` e dispara o gatilho de atualização de saldo no `ProdutoDAO`.
- **Tratamento de Dados:** Implementei o `parseSafeFloat` para garantir que o fluxo não seja interrompido por erros de formatação decimal (vírgula/ponto), garantindo a robustez exigida na ERS.

### B. Cancelamento de Inscrições (`CInscricao.java`)
> **Flash ERS:** *"O cancelamento de inscrições pode ser realizado... em situações administrativas. Em caso de cancelamento, a vaga liberada é atribuída automaticamente ao primeiro inscrito da lista de espera."*

- **Minha Implementação:** No método de cancelamento, adicionei a trava de segurança que verifica o status atual antes de processar. Isso garante que o fluxo de "liberação de vaga" ocorra apenas para inscrições que estavam efetivamente ativas, protegendo a lógica da lista de espera mencionada na ERS.
- **Auditoria:** Garanti a persistência da `OBS` (motivo), cumprindo o requisito de registro de situações administrativas.

### C. Parametrização do Sistema (`ParametrizacaoDAO.java`)
> **Flash ERS:** *"O sistema deve integrar informações de eventos e produtos... padronizando as informações e apoio à tomada de decisão."*

- **Minha Implementação:** Foquei na padronização total. Mapeei os 23 atributos institucionais (CNPJ, Endereço, Dados da FIPP/Unoeste) para que o sistema tenha uma "identidade única", conforme as referências da página de Dados da Empresa na ERS.
- **UX Inteligente:** Criei o modal de comparação no Front-end para que o Administrador revise as mudanças antes da persistência, evitando alterações acidentais em dados sensíveis da instituição.

---

## 🛠️ 3. Arquitetura Técnica e Estabilidade
- **Padrão Singleton:** Mantive a classe `ConexaoBD` centralizada, garantindo que todas as operações sigam o princípio de conexão única e eficiente.
- **Blindagem JSON (`ResponseObject.java`):** Para cumprir o requisito de "Tolerância a Falhas (TF)" da ERS, reescrevi a serialização JSON. Agora, o sistema é imune a caracteres especiais, garantindo que a troca de dados entre Java e Web seja sempre íntegra.

---

**Conclusão:**
Minha atuação no projeto foi além da codificação; realizou uma **tradução técnica da ERS para o ambiente Java**. O sistema resultante não é apenas um software funcional, mas um motor de regras de negócio desacoplado, resiliente e fiel aos requisitos acadêmicos e operacionais estabelecidos.
