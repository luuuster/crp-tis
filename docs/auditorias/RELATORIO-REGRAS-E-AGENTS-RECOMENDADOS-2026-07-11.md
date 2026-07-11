# Relatório completo — regras e agents recomendados para o CRP DS / TalentAI

**Data:** 11 de julho de 2026  
**Repositório analisado:** `C:\Users\frank\Videos\crp_ds`  
**Documento orientador principal:** `PROPOSITO.md`  
**Escopo:** governança para IAs, regras de trabalho, agents especializados e lacunas de automação  
**Natureza:** relatório de recomendação; nenhuma regra ou agent foi criado ou alterado nesta análise

---

## 1. Resposta direta: sim, o propósito foi entendido

Este repositório não é uma aplicação de produção incompleta. Ele é um **mockup web navegável de alta fidelidade**, construído com padrões reais de front-end, UX/UI, acessibilidade e design system, para cumprir quatro funções centrais:

1. Permitir que produto, design e stakeholders visualizem e testem o sistema antes do backend existir.
2. Servir como referência executável para o front-end que construirá o produto real.
3. Registrar padrões de UX, componentes, estados, acessibilidade, temas, conteúdo e comportamento.
4. Materializar no Figma uma cópia mensurável do que existe na web, mantendo tokens, componentes, ícones e telas alinhados.

O modelo de autoridade correto é:

| Assunto | Fonte de verdade |
|---|---|
| Valores de design | `tokens/` em DTCG |
| Aparência e comportamento efetivamente observados | web renderizada em `app/` |
| API dos componentes | `app/src/components/ui/` e suas variantes reais |
| Fluxos e estados do produto | páginas/composições navegáveis + documentação viva |
| Figma | downstream: deve reproduzir tokens, componentes e medidas da web |
| `dist/`, JSONs dos plugins e bundles | artefatos gerados; nunca fonte autoral |
| Produção futura | consumidora dos contratos deste repositório, não objetivo operacional atual |

Uma frase adequada para orientar qualquer IA seria:

> Este é um contrato executável de UX/UI e front-end: dados fictícios, rigor real; a web define o comportamento renderizado, `tokens/` define os valores de design e o Figma reproduz ambos sem interpretação visual livre.

Essa definição é importante porque impede dois erros opostos:

- tratar o projeto como um protótipo descartável e aceitar baixa qualidade;
- tratá-lo como produção e introduzir backend, banco, autenticação, infraestrutura ou complexidade que não pertencem ao seu propósito.

---

## 2. O que são “regras” e o que são “agents”

### 2.1 Regras

Regras são instruções normativas e duradouras. Elas respondem:

- o que é permitido ou proibido;
- onde mora cada fonte de verdade;
- quais decisões são intencionais;
- qual validação é obrigatória;
- o que significa “pronto” para cada tipo de mudança.

Regras devem ser curtas o suficiente para serem aplicadas com consistência, versionadas junto do repositório e independentes de uma ferramenta específica sempre que possível.

### 2.2 Agents

Agents são especialistas acionados para tarefas delimitadas. Eles respondem:

- como auditar um fluxo de UX;
- como modificar tokens com segurança;
- como medir e reproduzir uma tela no Figma;
- como verificar acessibilidade;
- como validar a cadeia tokens → components → screens.

Um agent não deve substituir regras básicas. Se todos precisam saber que o projeto é um mockup e que o Figma é downstream, isso pertence à instrução raiz, não deve ser repetido de forma divergente em dez agents.

### 2.3 Gates executáveis

Regras dizem o que deve acontecer. Agents ajudam a executar. Gates provam o resultado.

Exemplos:

- regra: nenhuma cor bruta em UI;
- agent: revisor de front/design system identifica a correção;
- gate: lint/check falha quando uma cor bruta aparece.

O repositório já entende muito bem essa relação em acessibilidade e tokens. A recomendação é aplicar o mesmo modelo a UX, fidelidade Figma, documentação e dados mock.

---

## 3. Inventário do que já existe

### 3.1 Agents Claude versionados

Existem três agents em `.claude/agents/`:

| Agent | Função | Avaliação |
|---|---|---|
| `design-system` | Tokens, DTCG, Style Dictionary, temas e contrato shadcn | Forte, mas possui contradição sobre a fonte da verdade |
| `figma-web-fidelity` | Medição DOM e reprodução pixel-fiel no Figma | Muito relevante e alinhado ao propósito |
| `token-studio-export` | Exportar `tokens/` para bundle importável no Token Studio | Bem delimitado e corretamente read-only sobre `tokens/` |

Esses agents estão rastreados pelo Git e podem acompanhar o repositório.

### 3.2 Regras Cursor locais

Existem três regras em `.cursor/rules/`:

| Regra | Função | Avaliação |
|---|---|---|
| `06-accessibility.mdc` | WCAG 2.2 AA e Definition of Done de acessibilidade | Ampla e valiosa; precisa de alguns refinamentos normativos |
| `07-figma-icones-lucide.mdc` | Paridade de ícones web ↔ Figma | Muito alinhada ao propósito |
| `08-figma-atomic-design.mdc` | Construir telas Figma usando componentes/instâncias | Muito alinhada e detalhada |

Entretanto, toda a pasta `.cursor/` está ignorada no `.gitignore`. Portanto, essas regras:

- não fazem parte efetiva do repositório compartilhado;
- não chegam a outra máquina por clone;
- não são revisadas por PR;
- podem desaparecer sem registro;
- não orientam Claude, Codex ou outra IA;
- não possuem histórico confiável.

Este é um dos maiores problemas encontrados.

### 3.3 Instrução universal

Não existe `AGENTS.md` autorado pelo projeto. O único encontrado está dentro de uma dependência em `node_modules`, portanto não pertence ao repositório.

Sem um `AGENTS.md` raiz, cada ferramenta enxerga uma parte diferente da intenção:

- Claude enxerga os agents versionados;
- Cursor enxerga regras locais ignoradas;
- Codex e outras ferramentas não recebem automaticamente nenhuma dessas duas estruturas;
- novas pessoas dependem de descobrir manualmente `PROPOSITO.md`, README e HANDOFF.

### 3.4 Governança já existente

O repositório também possui:

- `PROPOSITO.md`;
- README raiz;
- `app/HANDOFF.md`;
- README por plugin;
- documentação de acessibilidade/UX;
- auditorias históricas;
- template de PR;
- CODEOWNERS;
- CI abrangente;
- doctor e pre-commit;
- manifests/testes dos plugins.

A base documental é rica. O problema é que a autoridade entre esses documentos não está formalmente ordenada.

---

## 4. Diagnóstico das lacunas atuais

### 4.1 Falta uma constituição central para qualquer IA

`PROPOSITO.md` explica muito bem o projeto, mas é um documento humano longo. Falta uma instrução operacional curta, normativa e automaticamente descoberta por agentes.

Essa constituição deve informar, antes de qualquer tarefa:

- este é um mockup, não produção;
- qualidade de UI/UX/a11y é de nível real;
- `tokens/` é a fonte versionada dos valores;
- a web renderizada é a fonte de aparência/comportamento;
- Figma é downstream;
- arquivos gerados não são editados;
- dados devem ser fictícios;
- não introduzir backend sem solicitação explícita;
- decisões deliberadas não devem ser “corrigidas” por auditorias genéricas;
- toda conclusão precisa de evidência proporcional.

### 4.2 As regras Cursor não são patrimônio do repositório

Como `.cursor/` está ignorada, hoje as três regras mais normativas existem apenas localmente. Isso contradiz a proposta de um repositório que deve servir como contrato para pessoas e IAs futuras.

Recomendação técnica futura:

- manter configurações pessoais ignoradas;
- versionar especificamente `.cursor/rules/*.mdc`;
- ou gerar adaptadores Cursor a partir de documentos canônicos versionados.

Não é recomendável copiar manualmente a mesma regra em vários formatos sem uma origem declarada, porque versões inevitavelmente divergem.

### 4.3 Há uma contradição sobre a fonte dos tokens

O agent `design-system` afirma:

> Token Studio é a única fonte da verdade; fluxo Token Studio → GitHub.

Mas o README, `PROPOSITO.md` e o agent `token-studio-export` afirmam:

> `tokens/` é a fonte versionada; Token Studio é uma ferramenta opcional de edição/importação.

Para o propósito atual, a segunda definição é mais coerente:

```text
tokens/ versionado
  ├─> dist/ web
  ├─> bundle Token Studio
  └─> Variables/Styles Figma
```

Token Studio pode editar e devolver JSON, mas o estado canônico é o que foi revisado/commitado em `tokens/`.

Essa contradição deve ser resolvida antes de criar novos agents, pois qualquer agent de tokens herdará a ambiguidade.

### 4.4 “Web manda” precisa ser definido com precisão

A frase é boa, mas pode ser mal interpretada. A regra correta deve separar domínios:

- tokens mandam nos valores de design;
- API/CVA do componente manda nas variantes e propriedades;
- DOM renderizado manda na medida/aparência resultante;
- especificação de UX manda na intenção do fluxo;
- Figma nunca manda sobre nenhuma dessas fontes.

Sem essa matriz, um agent pode concluir incorretamente que deve alterar um token para copiar um bug acidental da web ou que a medição visual substitui a intenção do componente.

### 4.5 Regras especializadas estão aplicadas sempre

As regras Cursor usam `alwaysApply: true`. Isso significa que instruções extensas de ícones e Atomic Design podem entrar em tarefas sem relação com Figma, aumentando contexto, custo e chance de conflito.

Recomendação:

- somente propósito/limites e segurança de edição devem ser globais;
- acessibilidade deve disparar em UI, CSS, tokens, componentes e páginas;
- ícones Figma deve disparar em `crp_plugins/figma-plugin-icons`, specs/telas Figma e tarefas explicitamente Figma;
- Atomic Design deve disparar em componentes/telas e Figma, não em toda tarefa documental;
- cada regra deve ter globs e gatilhos claros.

### 4.6 Algumas normas de acessibilidade estão absolutas demais

A regra atual contém decisões úteis, mas mistura três categorias:

1. exigência WCAG;
2. convenção interna do CRP DS;
3. preferência de implementação.

Exemplos que precisam de nuance:

- `aria-disabled` não é sempre superior ao `disabled` nativo. Controles genuinamente indisponíveis podem e normalmente devem usar semântica nativa; `aria-disabled` é útil quando a descoberta/foco precisa ser preservada e exige bloqueio manual completo.
- exatamente um `<h1>` é uma boa convenção de projeto, mas não deve ser descrita como obrigação literal da WCAG.
- manter spinner girando sob `prefers-reduced-motion` é uma decisão do projeto, não a única solução acessível; feedback não animado também pode ser válido.
- axe e Lighthouse são automações; teste manual com leitor de tela é outra categoria.

Separar “WCAG exige”, “CRP DS decidiu” e “recomendação” tornará a regra mais tecnicamente precisa e mais útil para o front real.

### 4.7 Documentos vivos possuem informações divergentes

Foram observados exemplos:

- template de PR ainda menciona três idiomas, mas o projeto possui quatro, incluindo pt-AO;
- `app/HANDOFF.md` ainda contém frase apontando Token Studio como fonte dos tokens;
- instruções antigas podem usar estrutura anterior de pastas/componentes;
- auditorias datadas são históricas, enquanto alguns leitores podem interpretá-las como estado atual.

Falta uma regra explícita de ciclo de vida documental: vivo, gerado, histórico ou decisão.

### 4.8 Falta um guardião de UX e fluxo

O repositório tem forte validação de acessibilidade e tokens, mas não há agent especializado em avaliar:

- objetivo da pessoa em cada fluxo;
- continuidade entre telas;
- estados vazios/loading/erro/sucesso;
- prevenção e recuperação de erro;
- clareza de labels/microcopy;
- consistência de navegação;
- carga cognitiva;
- coerência do fluxo do recrutador e candidato;
- diferença entre uma demonstração navegável e um comportamento que o produto real deveria herdar.

Esse é um vazio importante porque UX/UI é uma das finalidades principais declaradas.

### 4.9 Falta um guardião de padrões de front-end transferíveis

O projeto deve ajudar o front real, mas não há agent dedicado a distinguir:

- padrão reutilizável que deve migrar;
- conveniência específica de mockup;
- dado/comportamento simulado;
- componente de DS versus composição de produto;
- componente local versus compartilhado;
- API pública do componente versus detalhe interno.

Sem esse papel, o mockup pode continuar bonito, mas se tornar menos útil como manual executável.

### 4.10 Falta validar o pipeline Figma como cadeia completa

Já existem agents para tokens, Token Studio e fidelidade manual, mas falta um agent que trate o pipeline como contrato integrado:

```text
tokens → Variables/Styles → ícones → ComponentSets → telas → comparação com web
```

Ele deve verificar dependências, cobertura, nomes, IDs/keys, reexecução idempotente, drift e fidelidade materializada — não apenas a validade isolada do JSON.

### 4.11 Falta uma regra forte para dados mock e conteúdo

Como o repositório é público e simula recrutamento, deve existir uma regra específica:

- usar `example.com` e telefones/documentos reservados claramente fictícios;
- não copiar currículos, nomes, e-mails ou casos de pessoas reais;
- manter fixtures determinísticas;
- representar diversidade sem estereótipos;
- evitar dados que pareçam produção;
- manter consistência de uma mesma pessoa entre telas;
- distinguir placeholder de dado persistido;
- garantir paridade de conteúdo nos quatro idiomas.

`SECURITY.md` cobre parte disso, mas não funciona como playbook diário para criação de telas.

### 4.12 Falta governar permissões locais de IA

`.claude/settings.local.json` possui centenas de permissões permitidas acumuladas. O arquivo é local e ignorado, o que é correto para preferências pessoais, mas esse volume tende a esconder permissões antigas e comandos excessivamente específicos.

Uma política de projeto deve dizer:

- configurações pessoais não são fonte normativa;
- agentes recebem ferramentas mínimas;
- publicação, push, remoção, edição de histórico e ações externas exigem escopo explícito;
- leitura, build e testes podem ser autorizados conforme o papel;
- agents de auditoria devem ser read-only.

---

## 5. Arquitetura recomendada para regras e agents

### 5.1 Camada 1 — constituição universal

Criar futuramente um `AGENTS.md` na raiz, curto e normativo, referenciando `PROPOSITO.md`.

Ele deve ser a primeira fonte operacional para qualquer IA e conter:

- propósito e não objetivos;
- matriz de fontes de verdade;
- mapa do repositório;
- decisões protegidas;
- política de arquivos gerados;
- dados mock/privacidade;
- validação por área;
- segurança do worktree;
- regra de documentação;
- links para instruções de domínio.

O `AGENTS.md` não deve repetir 160 linhas de WCAG ou o manual completo do Figma. Deve encaminhar para regras especializadas.

### 5.2 Camada 2 — instruções por domínio

Criar instruções locais, caso a ferramenta suporte herança por diretório:

```text
AGENTS.md                         # propósito e leis comuns
tokens/AGENTS.md                  # tokens/DTCG/temas
app/AGENTS.md                     # front, UX, i18n, a11y, mock data
crp_plugins/AGENTS.md             # pipeline e segurança dos plugins
docs/AGENTS.md                    # documentos vivos vs históricos
```

Vantagens:

- contexto especializado somente onde necessário;
- menos duplicação;
- manutenção mais simples;
- regras aplicadas por proximidade;
- qualquer IA compatível entende o projeto sem depender de Cursor/Claude.

### 5.3 Camada 3 — adaptadores por ferramenta

- `.cursor/rules/*.mdc`: globs/gatilhos, referenciando as regras canônicas.
- `.claude/agents/*.md`: especialistas delimitados.
- skills/agents de outras ferramentas: wrappers equivalentes, sem inventar nova política.

Princípio: **uma política, vários adaptadores**.

### 5.4 Camada 4 — gates executáveis

Cada regra com risco de regressão deve apontar para um gate:

| Regra | Gate esperado |
|---|---|
| Tokens | build/check/doctor |
| Acessibilidade | axe, contraste, foco, mobile |
| i18n | paridade de chaves e smoke de troca |
| Dados mock | scanner de domínio/PII e determinismo |
| Figma | validação de spec/dependências/drift |
| Rotas | testes de cada entrypoint/deep link |
| Documentação viva | markdown links + referências/contagens geradas |
| Handoff | checklist de padrão transferível versus mock-only |

---

## 6. Regras recomendadas

### R00 — Propósito e fronteiras do projeto

**Prioridade:** obrigatória, imediata  
**Aplicação:** global  
**Destino recomendado:** `AGENTS.md` raiz e adaptador Cursor curto

Conteúdo essencial:

- mockup web navegável, sem backend por design;
- padrões de front/UX/a11y devem ter rigor real;
- nunca introduzir produção/backend/auth por iniciativa própria;
- dados reais são proibidos;
- o resultado precisa ser útil para designer e front futuro;
- Figma é downstream;
- divergência web↔Figma é bug;
- mudanças devem preservar o caráter demonstrável do fluxo.

Esta regra evitaria recomendações genéricas de produção que conflitam com o propósito e também impediria que “é só mockup” fosse usado para aceitar UI de baixa qualidade.

### R01 — Matriz de fontes da verdade e precedência

**Prioridade:** obrigatória, imediata  
**Aplicação:** global

Deve registrar formalmente:

```text
tokens/               → valores e taxonomia do design
button.tsx/CVA        → API do Button
DOM renderizado       → resultado visual mensurável
fluxo/documento vivo  → intenção de UX
Figma                 → cópia downstream
dist/ e JSON gerado   → artefato, nunca origem
```

Também deve explicar como resolver conflitos:

1. identificar o domínio da divergência;
2. consultar a fonte daquele domínio;
3. corrigir a origem;
4. regenerar downstream;
5. medir novamente.

### R02 — Arquivos autorados, gerados e proibidos de editar

**Prioridade:** alta  
**Aplicação:** `tokens/`, `build/`, `dist/`, `token-studio/`, `crp_plugins/`

Deve listar:

- arquivos/pastas autorados;
- artefatos gerados;
- comando gerador;
- se o artefato é rastreado ou ignorado;
- como verificar stale output;
- proibição de corrigir diretamente `dist/` ou JSON gerado.

O doctor já protege parte disso. A regra deve ser o mapa humano/IA do mesmo contrato.

### R03 — Arquitetura de front-end e classificação de componentes

**Prioridade:** obrigatória  
**Aplicação:** `app/src/**/*`

Deve consolidar:

- `components/ui`: primitivas genéricas e API estável;
- `components/composicoes`: organismos/templates com contexto do produto;
- `pages`: telas e componentes locais;
- peça usada por várias telas deve ser promovida conscientemente;
- não duplicar componente para mudar apenas estilo;
- variante recorrente pertence ao CVA/DS;
- lógica pura deve sair de componentes grandes quando beneficiar teste/handoff;
- mocks e adapters devem ficar distinguíveis da UI transferível.

Essa regra é complementar à regra Atomic Design: uma governa o código web; a outra governa a materialização Figma.

### R04 — UX, estados e comportamento de mockup

**Prioridade:** obrigatória  
**Aplicação:** páginas, composições, i18n, fluxos e testes

Deve exigir, para todo fluxo relevante:

- objetivo do usuário e ponto de entrada;
- caminho feliz;
- estado vazio;
- carregamento;
- erro e recuperação;
- confirmação para ação destrutiva;
- sucesso e próximo passo;
- cancelamento/voltar;
- preservação de contexto;
- comportamento mobile e teclado;
- microcopy consistente;
- dados plausíveis e determinísticos.

Também deve separar:

- comportamento que o produto real deve herdar;
- simulação necessária apenas para a demonstração;
- decisão ainda não definida, que deve ser marcada como tal.

### R05 — Governança do Design System e tokens

**Prioridade:** obrigatória  
**Aplicação:** `tokens/**`, `build/**`, estilos e componentes

Já existe no agent `design-system`, mas falta como regra universal curta.

Deve afirmar:

- `tokens/` versionado é SSOT;
- Token Studio é editor/importador opcional, não autoridade paralela;
- três níveis: primitivo → semântico → componente;
- componentes consomem contrato, não primitivos;
- não usar cor/medida bruta quando existe token;
- token novo exige definição nos temas aplicáveis, build, check e export Figma;
- breaking change de token exige changeset adequado;
- estado inexistente não deve ser inventado só no Figma.

### R06 — Acessibilidade WCAG 2.2 AA

**Prioridade:** manter, revisar  
**Aplicação:** UI, CSS, tokens, páginas e testes

A regra atual deve ser preservada, mas reorganizada em:

- **exigência WCAG**;
- **convenção CRP DS**;
- **boa prática recomendada**;
- **verificação automatizada**;
- **verificação manual**.

Revisões prioritárias:

- nuançar `disabled` versus `aria-disabled`;
- classificar um único `<h1>` como convenção interna;
- aceitar feedback de loading acessível sem obrigar rotação;
- separar axe/Lighthouse de leitor de tela humano;
- aplicar por globs em vez de globalmente em qualquer tarefa.

### R07 — Ícones web ↔ Figma

**Prioridade:** manter  
**Aplicação:** ícones, componentes/telas Figma

A regra existente está alinhada. Melhorias:

- não depender somente de IDs/library keys hardcoded sem mecanismo de verificação;
- declarar versão da biblioteca Lucide que originou o bundle;
- validar nome canônico e geometria automaticamente;
- registrar exceção formal para Material Symbols onde o produto realmente usa Material;
- atualizar Definition of Done para distinguir instância de biblioteca e fallback SVG.

### R08 — Atomic Design e instâncias no Figma

**Prioridade:** manter  
**Aplicação:** componentes e telas Figma

A regra existente é adequada. Melhorias:

- reduzir enumerações manuais que envelhecem;
- derivar inventário de componentes do código/manifests;
- explicitar componentes locais versus publicados;
- verificar que tela não contém substitutos desenhados manualmente quando já existe componente;
- registrar tolerância numérica de fidelidade.

### R09 — Contrato de fidelidade web → Figma

**Prioridade:** obrigatória  
**Aplicação:** app, scripts de medição e todos os plugins Figma

Deve transformar “pixel-fiel” em critérios verificáveis:

- viewport/estado/tema conhecidos;
- fonte carregada antes de medir;
- medidas via `getBoundingClientRect`;
- estilos via `getComputedStyle`;
- cores compostas corretamente;
- tolerância de dimensão, cor e tipografia declarada;
- screenshot web e Figma da mesma superfície;
- relatório de drift;
- nenhuma medida “no olho”;
- toda instância aponta para componente correto;
- reexecução não duplica bibliotecas/telas.

Exemplo de tolerâncias a decidir:

- dimensões: ±0,5 px;
- cor: ΔE definido ou tolerância por canal;
- espaçamento: ±0,5 px;
- fonte: família/peso/tamanho exatos;
- conteúdo: equivalência textual do estado capturado.

### R10 — Dados mock, privacidade e determinismo

**Prioridade:** obrigatória  
**Aplicação:** fixtures, páginas, testes, docs e screenshots

Deve exigir:

- `example.com` para e-mails fictícios;
- documentos/telefones inequivocamente sintéticos;
- proibição de copiar dados reais;
- nomes fictícios consistentes entre módulos;
- geradores determinísticos ou seed fixa;
- datas controladas quando afetam screenshot/teste;
- nenhum segredo em mock;
- nenhum dado do relatório de auditoria reproduzido integralmente se for potencialmente pessoal;
- conteúdo inclusivo e não estereotipado.

### R11 — i18n e content design

**Prioridade:** alta  
**Aplicação:** locales, páginas, labels e testes

Deve cobrir os quatro idiomas atuais:

- pt-BR como fonte editorial definida;
- en, es e pt-AO com paridade de chaves;
- nomes acessíveis não ambíguos;
- datas, números e plurais localizados;
- não concatenar frases traduzidas;
- microcopy acionável;
- tom consistente;
- texto de erro descreve ação de recuperação;
- expansão de texto não quebra layout;
- pseudo-localização futura recomendada.

### R12 — Matriz de verificação por tipo de mudança

**Prioridade:** obrigatória  
**Aplicação:** global

Em vez de “rode tudo sempre”, definir uma matriz:

| Mudança | Validação mínima |
|---|---|
| Token | build, check, dark strict, export/verify Figma |
| Componente UI | lint, typecheck, unit, axe, contraste/foco nos 4 temas, galeria |
| Página/fluxo | unit relevante, E2E do fluxo, mobile, teclado, screenshot |
| i18n | paridade, troca de idioma, layout expandido |
| Plugin | teste puro, schema/deps, dry-run/idempotência, execução controlada |
| Tela Figma | medição web, materialização, screenshot/drift |
| Documento vivo | links, comandos e rotas verificados |
| Auditoria histórica | data/commit/escopo, sem reescrever o passado |

Essa regra evita tanto validação insuficiente quanto custo desnecessário.

### R13 — Documentação viva, histórica, gerada e decisões

**Prioridade:** alta  
**Aplicação:** `docs/**`, README, HANDOFF e relatórios

Todo documento deve declarar uma categoria:

- **vivo/canônico**: precisa refletir HEAD;
- **histórico/auditoria**: representa data/commit específico;
- **decisão/ADR**: registra decisão e status;
- **gerado**: não editar;
- **referência externa consolidada**: possui data de revisão.

Também deve definir:

- links relativos corretos após mover arquivos;
- números/contagens gerados quando possível;
- auditoria recebe seção de remediação sem apagar evidência original;
- PROPOSITO e AGENTS têm precedência definida;
- mudanças arquiteturais atualizam README/HANDOFF/diagramas na mesma entrega.

### R14 — Segurança do worktree e colaboração com IA

**Prioridade:** alta  
**Aplicação:** global

Deve incluir:

- sempre inspecionar `git status` antes/depois;
- alterações existentes pertencem ao usuário;
- não reverter arquivo não autorado pelo agent;
- não editar artefato gerado;
- cuidado com mudanças concorrentes durante testes;
- não publicar/commit/push sem solicitação;
- não limpar histórico automaticamente;
- usar `apply_patch`/edição localizada;
- validar paths após reorganização;
- auditoria não modifica código;
- registrar limitações quando um gate não puder ser executado.

---

## 7. Agents novos recomendados

### A01 — `repository-purpose-guardian`

**Prioridade:** essencial  
**Papel:** guardião do escopo e triagem de tarefas

Responsabilidades:

- ler `PROPOSITO.md` e classificar a solicitação;
- impedir scope creep para produção/backend;
- identificar qual fonte de verdade e quais especialistas se aplicam;
- proteger decisões intencionais como dados mock, ausência de backend e `forceMount` deliberado;
- produzir plano de validação proporcional.

Não deve:

- implementar a tarefa inteira;
- substituir agents especializados;
- recusar melhorias reais de UI sob argumento de “é mockup”.

Observação: se o `AGENTS.md` raiz for muito bom, este agent pode ser dispensável. A função pode existir como checklist de triagem, não necessariamente como subagent separado.

### A02 — `frontend-pattern-reviewer`

**Prioridade:** essencial  
**Papel:** proteger a utilidade do repositório como manual executável do front real

Deve analisar:

- componente correto e nível correto de abstração;
- reuso versus duplicação;
- API de variantes e estados;
- separação de lógica pura/UI/mock;
- padrões que devem migrar ao produto real;
- coerência com shadcn, Tailwind e tokens;
- responsividade e semântica;
- manutenção de galeria/demos.

Saída esperada:

- achados por severidade;
- padrão transferível identificado;
- detalhe mock-only explicitado;
- testes necessários;
- impacto no Figma/handoff.

### A03 — `ux-flow-auditor`

**Prioridade:** essencial  
**Papel:** revisar experiência e lógica do fluxo como UX Designer sênior

Deve percorrer uma jornada real, por exemplo:

```text
recrutador cria vaga
→ publica
→ candidato encontra
→ candidata-se
→ acompanha processo
→ agenda entrevista
→ recrutador avalia
```

Critérios:

- objetivo e expectativa;
- visibilidade do estado;
- consistência com mundo real;
- prevenção/recuperação de erros;
- carga cognitiva;
- feedback;
- continuidade entre telas;
- acessibilidade cognitiva;
- mobile;
- clareza da microcopy;
- caminhos incompletos ou impossíveis.

Esse agent deve trabalhar sobre navegador e documentação, preferencialmente read-only em auditorias.

### A04 — `accessibility-auditor`

**Prioridade:** essencial  
**Papel:** executar a regra de acessibilidade, não apenas repeti-la

Deve:

- selecionar superfícies afetadas;
- executar axe, contraste por pixel, foco e mobile;
- inspecionar nome/role/value;
- revisar teclado e retorno de foco;
- separar falha WCAG de convenção interna;
- registrar o que exige teste manual;
- nunca afirmar teste com leitor de tela se não o realizou.

O agent deve ser inicialmente read-only. Um agent separado de correção pode implementar achados quando solicitado.

### A05 — `figma-pipeline-validator`

**Prioridade:** essencial  
**Papel:** validar a ponte completa código → Figma

Deve verificar:

- tokens/variables/styles presentes;
- aliases corretos;
- biblioteca de ícones e versões;
- dependências dos ComponentSets;
- variantes/properties correspondentes ao CVA;
- components usados pelas telas;
- idempotência e ausência de duplicação;
- cobertura de telas exportadas;
- drift web↔Figma;
- gaps conhecidos do runtime dos plugins.

Diferença para `figma-web-fidelity`:

- `figma-web-fidelity` mede e constrói uma superfície;
- `figma-pipeline-validator` audita contratos, cadeia, cobertura e repetibilidade do sistema inteiro.

### A06 — `visual-regression-verifier`

**Prioridade:** alta  
**Papel:** comparar visualmente estados web e, quando aplicável, Figma

Deve operar com uma matriz controlada:

- marcas;
- light/dark;
- desktop/mobile;
- estados principais;
- overlays abertos;
- locale relevante;
- screenshot baseline.

Deve diferenciar:

- alteração intencional;
- regressão;
- antialias/renderização;
- diferença de conteúdo/dados;
- diferença real de layout/token.

Não deve aprovar apenas por “parece igual”. Precisa registrar tolerância e evidência.

### A07 — `mock-content-i18n-reviewer`

**Prioridade:** alta  
**Papel:** qualidade dos dados fictícios, microcopy e quatro idiomas

Responsabilidades:

- detectar PII plausível;
- validar domínios reservados;
- conferir coerência de candidatos/vagas/datas entre telas;
- revisar tom, clareza e ação das mensagens;
- verificar paridade i18n;
- testar expansão de texto;
- identificar texto hardcoded;
- preservar plausibilidade do cenário de recrutamento.

Pode combinar duas funções porque conteúdo mock e i18n compartilham os mesmos artefatos e riscos.

### A08 — `handoff-documentation-curator`

**Prioridade:** alta  
**Papel:** garantir que o repositório continue útil para designer e front futuro

Deve manter:

- README/HANDOFF/PROPOSITO coerentes;
- mapa de telas e fluxos;
- padrão transferível versus mock-only;
- comandos/portas/rotas;
- decisões arquiteturais;
- links e referências;
- status de auditorias/remediações;
- instruções de Figma.

Deve ser acionado após mudanças arquiteturais, componentes públicos, fluxo, idioma, pipeline Figma ou estrutura de pastas.

---

## 8. Agents existentes: manter, corrigir ou fundir

### `design-system`

**Decisão:** manter e corrigir.

Mudança essencial:

```text
Antes: Token Studio é a única fonte da verdade.
Depois: tokens/ versionado é a fonte da verdade; Token Studio é editor/importador opcional.
```

Outras melhorias:

- ler regra R01 antes de atuar;
- distinguir edição de token de exportação;
- declarar impacto web/Figma;
- verificar os quatro temas;
- não repetir toda a documentação do README quando um link canônico basta.

### `figma-web-fidelity`

**Decisão:** manter e tornar mais verificável.

Melhorias:

- saída estruturada com medidas coletadas;
- tolerâncias explícitas;
- captura do mesmo estado/viewport/tema;
- relatório antes/depois;
- não hardcode de file/library key sem validação;
- fechar recursos/processos;
- diferenciar construir de auditar.

### `token-studio-export`

**Decisão:** manter.

É corretamente limitado e read-only sobre `tokens/`. Ajustar somente contagens fixas, caso sets/themes mudem, preferindo derivá-las do bundle.

### Relação entre os três

```text
design-system
  edita/valida tokens/
       ↓
token-studio-export
  gera bundle importável
       ↓
figma-pipeline-validator
  valida materialização e contratos
       ↓
figma-web-fidelity
  mede/corrige a fidelidade de superfícies
```

---

## 9. Agents que não são necessários agora

Evitar criar agents apenas porque existem em projetos de produção.

### Não necessários como parte permanente

- backend architect;
- database designer;
- API engineer;
- authentication specialist;
- cloud infrastructure engineer;
- Kubernetes/SRE;
- production observability agent;
- payment/security compliance operacional;
- data migration agent.

Esses papéis pertencem ao produto real. Podem ser usados futuramente para escrever uma seção de handoff ou requisitos de migração, mas não devem dirigir mudanças no mockup.

### Segurança ainda é necessária, mas com escopo correto

Um agent de segurança útil aqui deve focar:

- dados reais acidentais;
- plugins Figma e importação de SVG/JSON;
- dependências e supply chain;
- permissões CI;
- secrets;
- HTML injection;
- publicação do repositório.

Ele não deve exigir backend/auth de produção como condição para considerar uma tela mock pronta.

### Performance também precisa de contexto

Um agent genérico poderia remover `forceMount` por enxergá-lo apenas como custo. `PROPOSITO.md` diz que a preservação de estado é deliberada.

O papel correto é:

- medir;
- documentar o trade-off;
- impedir degradação descontrolada;
- não alterar decisão protegida sem autorização.

---

## 10. Quantos agents criar de fato

Não é recomendável criar todos imediatamente. Muitos agents sobrepostos geram:

- roteamento confuso;
- repetição de regras;
- respostas inconsistentes;
- manutenção alta;
- agentes que raramente são usados;
- divergência de Definition of Done.

### Núcleo mínimo recomendado

Manter os três existentes, corrigindo `design-system`, e adicionar quatro:

1. `frontend-pattern-reviewer`;
2. `ux-flow-auditor`;
3. `accessibility-auditor`;
4. `figma-pipeline-validator`.

As funções de visual regression, mock/i18n e documentação podem inicialmente existir como checklists/regras. Transformá-las em agents somente quando houver uso recorrente.

### Critério para criar um agent

Criar quando todas forem verdadeiras:

- tarefa recorrente;
- entrada e saída bem definidas;
- conhecimento especializado próprio;
- ferramentas específicas;
- Definition of Done verificável;
- não duplica outro agent;
- pelo menos três usos previsíveis.

Se não cumprir isso, use uma regra/checklist, não um agent.

---

## 11. Estrutura de arquivos sugerida

Exemplo de arquitetura futura:

```text
AGENTS.md
PROPOSITO.md

tokens/
  AGENTS.md

app/
  AGENTS.md

crp_plugins/
  AGENTS.md

docs/
  AGENTS.md
  governanca-ia/
    fontes-da-verdade.md
    matriz-de-validacao.md
    dados-mock.md
    documentacao.md

.cursor/
  rules/
    00-purpose.mdc
    03-frontend.mdc
    04-ux-flows.mdc
    05-design-tokens.mdc
    06-accessibility.mdc
    07-figma-icons.mdc
    08-figma-atomic-design.mdc
    09-figma-fidelity.mdc
    10-mock-data-i18n.mdc

.claude/
  agents/
    design-system.md
    token-studio-export.md
    figma-web-fidelity.md
    frontend-pattern-reviewer.md
    ux-flow-auditor.md
    accessibility-auditor.md
    figma-pipeline-validator.md
```

Os números 01–02 podem ficar no `AGENTS.md`/instruções de domínio, evitando um arquivo Cursor para cada ideia.

---

## 12. Conteúdo mínimo recomendado para o `AGENTS.md` raiz

O documento não deve ser gigantesco. Um esqueleto adequado:

```md
# CRP DS / TalentAI — instruções para agentes

## Leia primeiro
- PROPOSITO.md

## Propósito
- Mockup web navegável de alta fidelidade, sem backend/dados reais.
- Referência executável para UX/UI, DS, a11y, front e Figma.

## Fontes da verdade
- tokens/ = valores de design.
- app renderizado = aparência/comportamento.
- componentes/CVA = API de UI.
- Figma = downstream medido.
- dist e bundles = gerados.

## Fronteiras
- Não introduzir backend/auth/infra sem pedido explícito.
- Não usar dados reais.
- Não editar artefatos gerados.
- Não remover decisões deliberadas sem confirmar propósito.

## Verificação
- Tokens: ...
- App/UI: ...
- Figma: ...
- Docs: ...

## Worktree
- Preserve mudanças existentes.
- Inspecione status antes/depois.
- Não commit/push/publicação sem solicitação.

## Instruções por domínio
- tokens/AGENTS.md
- app/AGENTS.md
- crp_plugins/AGENTS.md
- docs/AGENTS.md
```

O detalhamento fica nos arquivos de domínio, não na raiz.

---

## 13. Matriz recomendada de acionamento

| Solicitação | Regra principal | Agent principal | Agents de apoio |
|---|---|---|---|
| Criar/mudar token | R05 | `design-system` | accessibility, pipeline Figma |
| Exportar Token Studio | R05 | `token-studio-export` | design-system se fonte inválida |
| Criar componente web | R03/R05/R06 | frontend reviewer | a11y, visual regression |
| Criar fluxo/tela | R04/R06 | UX flow auditor | frontend, a11y |
| Copiar tela ao Figma | R07/R08/R09 | figma web fidelity | pipeline validator |
| Auditar Figma inteiro | R09 | pipeline validator | fidelity verifier |
| Revisar acessibilidade | R06 | accessibility auditor | UX/frontend |
| Alterar locale/microcopy | R11 | mock-content/i18n | UX, a11y |
| Mover pastas/arquitetura | R02/R13/R14 | frontend/repo guardian | docs curator |
| Atualizar auditoria | R13 | docs curator | especialista do achado |

---

## 14. Definition of Done para os próprios agents

Todo agent deve declarar:

1. **Gatilho:** quando deve ser usado.
2. **Não gatilho:** quando não deve ser usado.
3. **Entradas obrigatórias:** arquivos, rotas, node Figma, tema, viewport.
4. **Autoridade:** read-only, pode editar, pode gerar, nunca publica.
5. **Processo:** etapas em ordem.
6. **Saída:** formato esperado.
7. **Gates:** comandos e evidências.
8. **Limitações:** o que não pôde ser verificado.
9. **Handoff:** qual agent recebe uma lacuna fora do escopo.

Agents atuais fazem parte disso, mas poderiam explicitar melhor “não gatilho”, autoridade e formato de saída.

---

## 15. Plano de implantação recomendado

### Fase 0 — corrigir inconsistências

1. Declarar oficialmente `tokens/` como SSOT versionado.
2. Corrigir o agent `design-system`.
3. Corrigir `app/HANDOFF.md`.
4. Atualizar template de PR para quatro idiomas.
5. Revisar termos WCAG versus convenções internas.

### Fase 1 — criar a fundação universal

1. Criar `AGENTS.md` raiz.
2. Criar `app/AGENTS.md`.
3. Criar `tokens/AGENTS.md`.
4. Criar `crp_plugins/AGENTS.md`.
5. Definir documentos vivos/históricos em `docs/AGENTS.md`.

### Fase 2 — versionar/adaptar regras

1. Permitir no Git apenas `.cursor/rules/`.
2. Manter configurações pessoais do Cursor ignoradas.
3. Adicionar globs às regras especializadas.
4. Fazer regras Cursor apontarem para documentos canônicos.
5. Evitar `alwaysApply` em regras longas de Figma.

### Fase 3 — agents essenciais

1. Criar `frontend-pattern-reviewer`.
2. Criar `ux-flow-auditor`.
3. Criar `accessibility-auditor`.
4. Criar `figma-pipeline-validator`.
5. Usá-los em tarefas reais e ajustar com base em falhas observadas.

### Fase 4 — transformar regras em gates

1. Scanner de dados mock/PII.
2. Verificador de links/documentos vivos.
3. Manifesto de cobertura de telas Figma.
4. Relatório de drift web↔Figma.
5. Matriz E2E por três aplicações.
6. Pseudo-localização/expansão de texto.

---

## 16. Priorização final

### Fazer primeiro

| Item | Motivo |
|---|---|
| `AGENTS.md` raiz | Faz qualquer IA entender o propósito e as fronteiras |
| Resolver SSOT Token Studio × `tokens/` | Evita mudanças no sentido errado |
| Versionar regras Cursor | Hoje regras críticas só existem localmente |
| Regra de UX/fluxos | UX é central ao projeto e está sem guardião especializado |
| Agent de acessibilidade | A regra existe, mas falta executor especializado |
| Agent do pipeline Figma | A proposta mais distintiva do repo precisa de auditor ponta a ponta |

### Fazer depois

| Item | Motivo |
|---|---|
| Agent visual regression | Útil após baseline/tolerâncias formalizados |
| Agent mock/i18n | Pode começar como regra e scanner |
| Agent de documentação | Vale quando mudanças documentais forem recorrentes |
| Mais agents especializados | Somente com casos de uso recorrentes comprovados |

### Não fazer agora

- criar dezenas de agents pequenos;
- duplicar toda a documentação em cada prompt;
- criar agent de backend/produção;
- transformar decisões do mockup em problemas genéricos;
- permitir que Figma se torne origem paralela;
- deixar regras importantes apenas em configuração local.

---

## 17. Parecer final

O repositório já possui mais conhecimento operacional do que a maioria dos projetos: acessibilidade detalhada, design system, fidelidade Figma, Atomic Design, pipeline de tokens, handoff e gates reais. O que falta não é simplesmente “mais documentação”. Falta organizar esse conhecimento numa hierarquia que qualquer IA consiga aplicar sem contradição.

A arquitetura ideal é:

```text
PROPOSITO.md
    explica por que o projeto existe
        ↓
AGENTS.md raiz
    transforma o propósito em leis operacionais universais
        ↓
AGENTS.md por domínio + regras versionadas
    definem como trabalhar em cada parte
        ↓
agents especializados
    executam tarefas recorrentes e delimitadas
        ↓
gates automáticos
    provam que o resultado respeita o contrato
```

O núcleo recomendado não é grande:

- manter e corrigir os três agents existentes;
- adicionar quatro agents essenciais;
- criar uma constituição raiz;
- versionar as regras Cursor;
- formalizar 10–14 regras, mas aplicar apenas as relevantes por glob/tarefa;
- converter as regras mais críticas em validações executáveis.

Com isso, uma IA nova entenderá que deve:

- construir um mockup, não um backend;
- tratar UX/UI/a11y com rigor real;
- produzir padrões transferíveis para o front;
- respeitar `tokens/` e componentes existentes;
- medir a web antes de tocar no Figma;
- usar instâncias, não desenhos aproximados;
- preservar decisões deliberadas;
- provar cada conclusão.

Essa é a governança compatível com o propósito descrito em `PROPOSITO.md`.

---

**Fim do relatório.**
