# Para que serve este projeto

> **Em uma frase:** este repositório é um **mockup web navegável de alta fidelidade** (o TalentAI) que serve de
> **fonte da verdade visual e técnica** para o sistema real que virá — e que se **espelha no Figma com fidelidade
> medida**, para que design e desenvolvimento trabalhem sobre a mesma verdade.

---

## 1. O que ele é

Um sistema de recrutamento e seleção **de mentira** (dados mock, sem backend), construído **com o rigor de um
sistema de verdade**: design system com tokens versionados, acessibilidade WCAG 2.2 AA validada em CI,
componentes shadcn/Tailwind reais, quatro temas (2 marcas × claro/escuro), três aplicações (recrutador,
candidato e hub de documentação), i18n em 4 idiomas e uma ponte automatizada **código → Figma**.

Ele **não** é o produto final — e isso é uma decisão, não uma limitação. Autenticação, CAPTCHA e dados são
simulados de propósito ([SECURITY.md](SECURITY.md)); não há banco nem API. O valor está em tudo o que vem
**antes** do backend: o design, os padrões, os fluxos e a experiência — prontos, testados e navegáveis.

## 2. Os papéis que ele cumpre

### a) Visualizar o sistema rapidamente
Antes de investir no sistema real, o TalentAI permite **navegar** o produto: abrir vaga com copiloto de IA,
funil de contratação, triagem por IA, agendamento de entrevista pelo candidato, mural de vagas, perfil,
calendário. Fluxo por fluxo, tela por tela, com dados plausíveis — decisões de produto e UX são tomadas
vendo a coisa funcionar, não imaginando um wireframe.

### b) Ajudar o front-end do sistema real
Quando o sistema de verdade for construído, este repo é o **manual executável** do front:

- **Componentes prontos** (`app/src/components/ui/` = primitivas shadcn; `composicoes/` = organismos da
  plataforma; `pages/` = telas) com a API real (`variant × size` do cva) que as telas usam.
- **Padrões resolvidos**: foco visível, estados de hover/disabled/loading, máscaras, formulários com
  validação, i18n (pt-BR/en/es/pt-AO), paginação, empty states, skeletons, error boundaries.
- **Gates automatizados** que o front real pode herdar: tsc estrito, lint com regras do DS, ~350 testes,
  e2e Playwright com axe real, contraste por pixel e foco visível nos 4 temas.

### c) Acessibilidade como barra, não como etapa
A11y aqui é **fatal no CI**: contraste textual (≥4.5:1) e não-textual (≥3:1) medidos por pixel renderizado
nos 4 temas; axe estrutural em telas e overlays abertos; navegação por teclado; `prefers-reduced-motion`,
`forced-colors` e `prefers-contrast` tratados; manifesto de a11y por componente. O sistema real nasce
sabendo **exatamente** o que precisa cumprir — e com os testes que provam.

### d) Design System de verdade (o CRP DS)
Os tokens são a **única fonte da verdade** (`tokens/` em DTCG → Style Dictionary → `dist/` para
Tailwind v4/shadcn): cores OKLCH em 3 camadas (primitivo → contrato → componente), multi-marca
(CRP, Marca B) × claro/escuro trocáveis em runtime, tipografia, espaçamento, raios, ícones, motion.
Nenhuma cor ou medida é chumbada à mão — quem muda um token muda o produto inteiro, no web **e** no Figma.

### e) Espelhar tudo no Figma — fiel de verdade
A parte mais incomum do projeto: **o Figma é downstream do código**, não o contrário.

- `crp_plugins/` leva ao Figma os **tokens** (Variables, 4 modos), os **ícones** (biblioteca Lucide/Material
  componentizada), os **componentes** (ComponentSets bindados nas Variables) e as **telas**.
- As telas no Figma são **cópias medidas** do web (DOM real via Playwright: `getBoundingClientRect`,
  `getComputedStyle`, cores compostas) — nunca aproximação "no olho". Se o botão tem 40px no web,
  tem 40px no Figma; montadas com **instâncias de componentes** (atomic design), nunca desenho solto.
- Resultado: o designer trabalha no Figma com **os mesmos tokens, os mesmos componentes e as mesmas
  medidas** que o desenvolvedor vê no navegador. Handoff sem tradução, sem deriva.

### f) Padrões e documentação do sistema
Arquitetura de informação, user flow completo, handoff do front ([app/HANDOFF.md](app/HANDOFF.md)),
histórico de decisões e auditorias datadas ([docs/](docs/)). O "porquê" de cada escolha fica registrado.

## 3. Como as peças se conectam

```
                         tokens/ (DTCG — fonte da verdade)
                                      │  npm run build
                                      ▼
                            dist/ (theme.css, tokens.css)
                          ┌───────────┴───────────┐
                          ▼                       ▼
                 app/ (TalentAI)          crp_plugins/ (Figma)
             recrutador :5173             tokens → Variables
             candidato  :5172             ícones → biblioteca
             docs/galeria :5174           componentes → ComponentSets
                          │                telas → páginas montadas
                          │  medição (Playwright, DOM real)
                          └───────────► Figma = cópia MEDIDA do web
```

O ciclo de mudança: **token muda → web muda → Figma re-materializa**. Nunca o contrário, nunca à mão.

## 4. O que ele deliberadamente NÃO é

| Não é | Por quê |
|---|---|
| Sistema em produção | Sem backend/auth/dados reais — mockup por design |
| Protótipo descartável | O DS, os componentes, os testes e os padrões migram para o sistema real |
| Figma "inspirado" no web | O Figma é cópia **medida** — divergência é bug, não interpretação |
| Documentação estática | Tudo é executável e validado em CI; se a doc mente, o build quebra |

## 5. Para quem serve

- **UX/UI Designer** — trabalha no Figma com tokens/componentes idênticos aos do produto; a galeria
  (`:5174/componentes`) é o styleguide vivo; o mockup navegável é o campo de teste de UX.
- **Front-end** — copia padrões prontos e testados; herda a barra de a11y e os gates de CI.
- **Produto/stakeholders** — navegam o sistema antes de ele existir; decidem vendo.
- **Quem for construir o sistema real** — encontra aqui o contrato: o que o sistema deve **parecer**,
  como deve **se comportar** e o que deve **cumprir** (a11y, temas, i18n, estados).

---

## 6. O repositório visto por dentro — o entendimento da IA que trabalha nele

*Esta seção é o entendimento detalhado de quem constrói o repo no dia a dia (a IA, em par com o Frank).
Serve de "mapa mental" para qualquer pessoa — ou agente — que chegue depois.*

### 6.1 A leitura de arquitetura

O repo é, na prática, **dois pacotes e uma ponte**:

1. **A raiz é o pacote de tokens** (`@crp/design-tokens`) — um compilador de design: `tokens/` (DTCG)
   entra, `build/` transforma (Style Dictionary v4 + sd-transforms + scripts próprios), `dist/` sai.
   Tudo em `dist/` é **artefato**: tem header "GERADO", é gitignored ou sobrescrito, e editá-lo à mão
   é considerado corrupção (o `doctor` existe literalmente para flagrar isso).
2. **`app/` é o consumidor de referência** — o TalentAI importa o pacote via `file:..` e prova que o
   contrato funciona: 3 entradas Vite multi-página (recrutador `index.html`, candidato `candidato.html`,
   docs `mapa.html`), trocando 4 temas em runtime com um atributo no `<html>`.
3. **`crp_plugins/` é a ponte para o Figma** — 4 plugins + 1 extensão, **um por trabalho**, encadeados
   por contrato de NOME: o de tokens materializa Variables; o de ícones cria a biblioteca; o de
   componentes **procura** as Variables por nome e binda (nunca cria); o de telas instancia os
   componentes. Se falta uma dependência, o plugin **para e lista** — nunca chuta.

O fio que costura tudo: **fail-loud**. O `check.mjs` derruba o build por contraste; o `export-components`
aborta por referência ausente; o teste puro de cada plugin roda no `npm test` da raiz; o pre-commit roda
o doctor. O repo prefere quebrar cedo a mentir tarde.

### 6.2 As leis do repo (o método embutido, aprendido a custo)

Estas regras não estão só em documentos — foram **estabelecidas em correções reais** ao longo do
desenvolvimento e governam qualquer mudança:

- **Web manda.** O `app/src/` é a fonte da verdade de aparência e comportamento. O Figma copia o web;
  o token descreve o web; se divergem, quem está errado nunca é o web renderizado.
- **Medir, nunca chutar.** Cor e medida saem de `getBoundingClientRect`/`getComputedStyle` do DOM real
  (ou de cálculo com culori sobre os tokens) — não de memória, não "de olho". Contraste se calcula
  ANTES de escolher o valor, e o e2e confirma DEPOIS por pixel renderizado.
- **Token nasce em `tokens/`.** Nunca se cria Figma Variable à mão, nunca se edita `dist/`. Falta um
  token? Para-se e alinha-se antes de chumbar um valor — chumbado hoje é bug de tema amanhã.
- **Componente antes da tela** (atomic design). Tela no Figma é arranjo de instâncias; peça solta
  desenhada à mão é dívida. Se o componente não existe, cria-se primeiro — espelhando a API real do
  código (variants/sizes do cva), não uma versão "parecida".
- **Verificar antes de dizer "pronto".** Toda entrega fecha com validação real (tsc, lint, testes, e2e,
  screenshot medido) — "deve funcionar" não é estado final. As perguntas "está tudo certo? 100%?"
  moldaram o repo: a resposta precisa ser demonstrável.
- **40px é 40px.** Padrões dimensionais (altura de controles, escala de ícones 12/16/20/24, rótulo 14px,
  radius 6) são lei; a exceção documentada existe (`xs` denso), a exceção silenciosa não.

### 6.3 Onde mora cada verdade (mapa de navegação)

| Pergunta | Fonte da verdade |
|---|---|
| Que cor/medida é essa? | `tokens/` (fonte) → `dist/tokens.css` (resolvido por tema) |
| Como o componente se comporta? | `app/src/components/ui/*` (o cva é o contrato) |
| O que o usuário vê de fato? | DOM renderizado (Playwright) — nunca o que o código "sugere" |
| O que existe pronto no DS? | galeria `:5174/componentes` + `a11y-manifest` |
| O Figma está certo? | comparar com o web MEDIDO; divergência = bug no Figma |
| Por que essa decisão foi tomada? | `docs/` (histórico datado) + mensagens de commit longas |
| O que é gerado vs. autorado? | header "GERADO" + `.gitignore` — na dúvida, `git ls-files` |

### 6.4 O que este repo tem de incomum (e vale preservar)

- **A inversão código → Figma.** A indústria inteira faz Figma → código e convive com deriva. Aqui o
  Figma é alvo de compilação: plugins materializam, medição valida, divergência é bug rastreável.
- **Contraste por pixel, não por fé.** O e2e compõe o fundo real camada a camada (com alpha, em OKLCH
  via culori) e mede o texto renderizado — porque o axe erra OKLCH e "conferi no olho" não é gate.
- **Docs como registro, não como promessa.** `docs/` se declara histórico datado; o guia vivo é o
  README + HANDOFF + a galeria. Documentação que não é executável envelhece — aqui ela é arquivada
  com data em vez de fingir atualidade.
- **Auditoria vira backlog.** O repo se audita (interna e externamente), arquiva o relatório em
  `docs/auditorias/` e converte achados em correções verificadas — o ciclo já rodou 6+ vezes.
- **Disciplina de mudança**: changesets mesmo sem publicar (o hábito antes da necessidade), doctor
  anti-corrupção no pre-commit, CI com permissões mínimas e release só com tudo verde.

### 6.5 As fronteiras que eu respeito (armadilhas conhecidas)

- **Regenerar a biblioteca de ícones re-keya tudo** — toda referência (botões, telas) quebra. Conserta-se
  com `search + swapComponent`, mas evita-se regenerar sem necessidade real.
- **INSTANCE_SWAP perde o bind de cor** (limitação do Figma): quem consome recolore o vetor bindando ao
  token do contexto. Os ícones da biblioteca são brancos DE PROPÓSITO (picker de fundo preto).
- **`paint.opacity` é ignorado com cor bindada** — alpha translúcido mora NA Variable (`*-10`, `*-90`),
  nunca no paint.
- **`forceMount` no app é deliberado** (tabs reais com `aria-controls` válido + estado preservado) —
  não é bug de performance a "corrigir".
- **Mockup ≠ produção**: não se propõe backend/auth/telemetria real aqui. A fronteira está documentada
  (SECURITY.md, seção 4 acima) e é intencional.
- **O histórico git lembra o que o HEAD esqueceu** (ex.: dados já higienizados) — limpeza de histórico
  é decisão explícita do dono, nunca automática.

### 6.6 Em uma frase

**É o protótipo que se recusa a ser tratado como protótipo** — conteúdo de mentira com disciplina de
verdade — e é exatamente essa recusa que o torna útil como fonte da verdade para o designer, para o
front, para o produto e para a IA que o constrói.
