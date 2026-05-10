# 📋 Guia de Defesa Técnica - Projeto Agape 2026 (Por: Christiano)

Este documento serve como base para a minha explicação técnica sobre as implementações e correções que realizei no sistema, focando na arquitetura, regras de negócio e estabilidade.

---

## 1. Estrutura Arquitetural (MVC e Singleton)
Ao analisar o projeto, tive o cuidado de manter a arquitetura **MVC** proposta inicialmente. Na minha implementação:
- **Controllers (`CCompra`, `CParametrizacao`, `CInscricao`):** Eu centralizei toda a lógica de tratamento de dados aqui. Tive a preocupação de garantir que o Backend nunca confie cegamente no que vem do Frontend, por isso implementei métodos de extração e limpeza de parâmetros (`extrairParam`).
- **Padrão Singleton:** No arquivo `ConexaoBD`, segui a regra de garantir que apenas uma conexão com o MySQL seja aberta por vez, evitando sobrecarga no servidor de banco de dados.

## 2. Implementação da Parametrização (`ParametrizacaoDAO.java`)
Nesta parte, meu foco foi a **Integridade dos Dados**. 
- **Mapeamento:** Eu mapeei manualmente todos os 23 atributos da tabela `Parametrizacao`. Verifiquei campo por campo (CNPJ, Inscrições, Logos, etc.) para garantir que nenhum dado fosse perdido no trajeto entre a tela e o banco.
- **Regra de Negócio:** Na função `salvar`, tive o cuidado de implementar uma lógica que identifica se já existe uma configuração. Se existir, o sistema faz um `UPDATE` preciso. Caso contrário, faz um `INSERT`. Isso evita a duplicidade de configurações na paróquia.
- **Diferencial (UX):** Na View (`parametrizacao.html`), desenvolvi uma lógica em JavaScript que compara o "Antes" e o "Depois". Antes de gravar, eu mostro para o usuário exatamente o que ele mudou, seguindo as melhores práticas de usabilidade.

## 3. Lógica de Compra e Gestão de Estoque (`CCompra.java`)
Esta é uma das partes mais sensíveis do sistema. Minha lógica aqui seguiu as seguintes regras:
- **Tratamento de Números:** No método `parseSafeFloat`, implementei uma regra que aceita tanto o formato brasileiro (vírgula) quanto o americano (ponto). Isso evita que o sistema trave (`NumberFormatException`) se o usuário digitar `150,50`.
- **Atomicidade (Transação):** Na função `efetuarCompraDeProdutos`, utilizei o conceito de **Transação SQL** (`setAutoCommit(false)`). Ou eu gravo a compra e atualizo o estoque de todos os itens com sucesso, ou eu cancelo tudo (`rollback`) se houver um erro no meio do caminho. Isso garante que o estoque nunca fique errado.
- **Atualização de Saldo:** Chamei o método `atualizarEstoque` do `ProdutoDAO` para que, a cada item comprado, o sistema some automaticamente a quantidade ao saldo atual do produto.

## 4. Regras de Segurança no Cancelamento (`CInscricao.java`)
Para a tela de cancelamento, apliquei uma regra de negócio crítica:
- **Verificação de Status:** Antes de processar qualquer cancelamento, eu verifico no banco se a inscrição já não está cancelada (Status 0). Se estiver, o sistema bloqueia a ação. Isso impede que o usuário tente "cancelar o que já foi cancelado", gerando erros de lógica.
- **Persistência de Observação:** Garanti que o motivo do cancelamento (`OBS`) seja capturado via `URLDecoder` para tratar caracteres especiais e gravado no campo correto do banco.

## 5. Estabilização da Comunicação JSON (`ResponseObject.java`)
Muitos erros de "SyntaxError" aconteciam no Frontend por causa de caracteres especiais. 
- **Solução Técnica:** Eu reescrevi o método `toJson` da classe `ResponseObject`. Agora, ele faz um "escape" automático de aspas e quebras de linha em qualquer resultado (`result`). Isso blindou o sistema contra falhas de comunicação entre o Java e o navegador.

---
**Conclusão para a Banca:**
Cada linha de código que alterei teve o objetivo de tornar o sistema Agape **resiliente**. Eu foquei em tratar os erros na origem (Backend) e dar um feedback claro para o usuário no destino (Frontend).
