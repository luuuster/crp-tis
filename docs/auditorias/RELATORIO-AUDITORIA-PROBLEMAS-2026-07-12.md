# Relatório detalhado — problemas da auditoria do repositório

**Data:** 12/07/2026  
**Repositório:** `crp_ds` (CRP Design System + TalentAI)  
**Auditor:** Cursor (Auto)  
**Relatório técnico resumido:** [AUDITORIA-2026-07-12-repo-completa.md](AUDITORIA-2026-07-12-repo-completa.md)

> Este documento detalha **cada problema confirmado** na auditoria de 12/07/2026: o que é,
> por que importa, evidência no código, impacto, como corrigir e como saber que ficou pronto.
> Itens refutados e decisões deliberadas do projeto estão no final para contexto.

---

## 1. Resumo executivo

### Veredito

O repositório está em **bom estado técnico**: todos os gates automatizados passaram nesta sessão
(build, check WCAG, check:mock, 211 testes unitários do app, **131 testes e2e**). Não há achado
de severidade **ALTA** que bloqueie demonstração, desenvolvimento ou CI local.

Os problemas reais são principalmente de **consistência de dados mock**, **documentação
contraditória**, **trabalho em progresso não commitado** e **lacunas de proteção nos gates** —
não de funcionalidade quebrada hoje.

### Contagem por severidade

| Severidade | Quantidade | Bloqueia demo? |
|---|---:|---|
| ALTA | 0 | — |
| MÉDIA | 5 | Não |
| BAIXA | 7 | Não |

### Gates verificados (12/07/2026)

| Comando | Onde | Resultado |
|---|---|---|
| `npm run verify` | raiz | ✅ build + check + check:mock + 139 testes DS |
| `npx tsc --noEmit` | `app/` | ✅ |
| `npm run lint` | `app/` | ✅ |
| `npm run test` | `app/` | ✅ 211 testes Vitest |
| `npm run e2e` | `app/` | ✅ **131/131** Playwright (~11 min) |

---

## 2. Problemas de severidade MÉDIA

### M1 — Persona inconsistente entre telas (Diego e Jair)

**Regra violada:** [regra 10 — mock data e i18n](../../.cursor/rules/10-mock-data-i18n.mdc) §2:
*"Persona consistente entre telas: a mesma pessoa mantém nome/e-mail/vaga/histórico em Pipeline,
Entrevistas, Candidatos e no lado do candidato."*

#### O que está errado

A tela **Entrevistas IA** (`EntrevistasIA.tsx`) usa nomes e e-mails diferentes dos usados no
**Pipeline** (`pipeline/data.ts`) e na lista de **Candidatos** (`candidatos/types.ts`) para os
mesmos perfis (score 68 / Product Manager e score 82 / Backend).

| Campo | Entrevistas IA | Pipeline / Candidatos (canônico) |
|---|---|---|
| Candidato score 68 | **Diego Teste 2** · `diego.teste@example.com` | **Diego Teixeira** · `diego.teixeira@example.com` |
| Candidato score 82 | **Jair Gonçalves** · `jair.goncalves@example.com` | **Jair Carmona** · `jair.carmona@example.com` |

Os demais candidatos compartilhados (Mariana, Carla, Vitor, Larissa, Bianca, Gustavo, etc.)
**estão alinhados** entre as telas — o problema é localizado nestes dois registros.

#### Evidência

```135:136:app/src/pages/EntrevistasIA.tsx
  { id: '1', nome: 'Diego Teste 2', email: 'diego.teste@example.com', vaga: 'Product Manager', ... score: 68, ... },
  { id: '2', nome: 'Jair Gonçalves', email: 'jair.goncalves@example.com', vaga: 'Desenvolvedor Backend', ... score: 82, ... },
```

```65:66:app/src/pages/pipeline/data.ts
  { id: 'c7', nome: 'Jair Carmona', vaga: 'Desenvolvedor Backend', score: 82, fase: 'rh', ... },
  { id: 'c8', nome: 'Diego Teixeira', vaga: 'Product Manager', score: 68, fase: 'rh', ... },
```

```41:42:app/src/pages/candidatos/types.ts
  { id: '2', nome: 'Jair Carmona', email: 'jair.carmona@example.com', vaga: 'Desenvolvedor Backend', ... score: 82, ... },
  { id: '3', nome: 'Diego Teixeira', email: 'diego.teixeira@example.com', vaga: 'Product Manager', ... score: 68, ... },
```

O e2e de contraste ainda clica no nome antigo:

```72:72:app/e2e/contrast.spec.ts
    await p.getByRole('button', { name: 'Diego Teste 2' }).click()
```

#### Por que importa

- Quebra a ilusão de produto coerente: o recrutador vê "Diego Teixeira" no Pipeline e
  "Diego Teste 2" em Entrevistas IA.
- **"Diego Teste 2"** parece placeholder de teste, não persona plausível — visível na UI real.
- O gate `check:mock` **não detecta** inconsistência entre fixtures; só valida domínio de e-mail
  e CPF.

#### Correção proposta

1. Em `EntrevistasIA.tsx`, trocar os dois registros para bater com `candidatos/types.ts`
   (fonte canônica do banco de candidatos).
2. Atualizar `contrast.spec.ts:72` para o nome alinhado (ex.: `'Diego Teixeira'`).
3. (Opcional, melhor a longo prazo) Extrair fixture compartilhada para um único módulo importado
   por Pipeline, Candidatos e Entrevistas IA.

#### Critério de aceite

- Mesmo `nome` + `email` + `vaga` + `score` para Diego e Jair em todas as telas que os exibem.
- `npm run e2e` verde após atualizar o seletor.
- Nenhuma ocorrência de `Diego Teste 2` ou `Jair Gonçalves` no `app/src/` (exceto histórico em docs).

#### Esforço estimado

~30 minutos (edição pontual + e2e).

---

### M2 — LICENSE contradiz SECURITY e regra 00 sobre visibilidade do repositório

#### O que está errado

Três documentos normativos dizem coisas diferentes sobre se o repositório é público ou privado:

| Documento | Afirmação |
|---|---|
| `LICENSE:3` | *"Este repositório é PROPRIETÁRIO e **privado**"* |
| `SECURITY.md:3` | *"Repositório **PÚBLICO** / protótipo (mockup)"* |
| `.cursor/rules/00-proposito.mdc:19` | *"O repositório é **público**"* |

O `package.json` declara `"private": true` — isso significa **npm não publica o pacote**, não que
o GitHub seja privado. São conceitos diferentes que se misturam na leitura.

#### Evidência

```1:7:LICENSE
Copyright (c) 2026 — Todos os direitos reservados.

Este repositório é PROPRIETÁRIO e privado (protótipo do CRP Design System / TalentAI).
...
SPDX-License-Identifier: UNLICENSED
```

```1:5:SECURITY.md
# Política de segurança

- **Repositório PÚBLICO / protótipo (mockup)** — sem dados reais de usuários; ...
```

#### Por que importa

- Quem lê só o LICENSE pode achar que o código não deveria estar no GitHub público.
- Quem lê SECURITY/regra 00 assume repositório público — coerente com a regra 10 (PII proibida
  porque *"o repositório é público"*).
- Risco de decisão errada em fork, clone ou política de contribuição.

#### Correção proposta (escolher UMA linha)

**Opção A (recomendada, alinha com o estado atual):** Repositório **público no GitHub**, código
**proprietário / UNLICENSED** (sem permissão de uso). Ajustar `LICENSE` para dizer explicitamente:
*"código proprietário; repositório hospedado publicamente para portfólio/mockup; sem licença de
uso, cópia ou distribuição"*.

**Opção B:** Tornar o repositório **privado no GitHub** e alinhar SECURITY + regra 00 para
"privado".

#### Critério de aceite

- LICENSE, SECURITY.md e regra 00 usam a **mesma** palavra (público ou privado) no sentido GitHub.
- `package.json` `private: true` continua explicado como "não publica no npm", se mantido.

#### Esforço estimado

~15 minutos (texto em 3 arquivos).

---

### M3 — Trabalho em progresso não commitado (remoção de `preview/` e `audit-dark.mjs`)

#### O que está errado

No início da auditoria (12/07/2026), o working tree tinha **16 arquivos modificados ou apagados**
sem commit — uma refatoração grande ainda não finalizada no git.

#### Arquivos envolvidos (lista do `git status`)

**Deletados:**
- `build/audit-dark.mjs`
- `preview/_editor.js`
- `preview/badge.html`
- `preview/button.html`
- `preview/index.html`
- `preview/login.html`
- `preview/typography.html`

**Modificados:**
- `.claude/rules/06-accessibility.md`
- `.cursor/rules/06-accessibility.mdc`
- `.github/workflows/build-tokens.yml`
- `README.md`
- `build/check.mjs`
- `build/lib/css.mjs`
- `build/lib/css.test.mjs`
- `package.json`
- `src/components/button.css`
- `tokens/AGENTS.md`

#### Por que importa

- Quem clona o **HEAD** ainda tem `preview/` e `audit:dark`; quem está no working tree não.
- Commit **parcial** (só deletes, sem atualizar `package.json`/CI) quebraria `npm run audit:dark`
  e o job de CI que ainda referencia esse script no HEAD.
- A remoção em si está **coerente** no working tree (grep não acha refs quebradas em código ativo;
  `check.mjs` já varre `src/` em vez de `preview/`).

#### Correção proposta

1. **Commit atômico** com todos os 16 arquivos juntos.
2. Mensagem explicando o porquê: consolidar preview legado → app/docs; remover gate duplicado
   `audit-dark` (contraste já coberto por `check.mjs` + e2e pixel).
3. Rodar `npm run verify` (raiz) e `npm run verify` ou pelo menos `lint + test + e2e` (app) antes
   do commit.

#### Critério de aceite

- `git status` limpo após o commit.
- `npm run verify` verde na raiz.
- Nenhuma referência ativa a `preview/` (pasta raiz), `audit-dark.mjs` ou script `audit:dark`
  em `package.json`, CI ou scripts npm.

#### Esforço estimado

~1 hora (revisar diff + gates + commit).

---

### M4 — Gate `check.mjs` não valida resolução de `var()` nos artefatos a11y shippados

#### O que está errado

O `build/check.mjs` tem **dois níveis** de validação de referências CSS:

1. **`dist/tokens.css`** — resolve cada `var(--token)` e **reprova** referências não resolvidas
   (linhas 236–239).
2. **Artefatos a11y shippados** (`dist/base.css`, `dist/components/button.css`,
   `dist/components/button.js`) — validados apenas por **existência + regex** (linhas 108–154),
   sem checar se `var(--elevation-xs)`, `var(--radii-full)`, etc. resolvem de fato.

Se alguém renomear um token e esquecer de atualizar `src/components/button.css`, o build pode
**passar** enquanto o navegador **descarta silenciosamente** a propriedade CSS com `var()` inválido.

#### Evidência

```108:118:build/check.mjs
const A11Y_ARTIFACTS = [
  { file: 'base.css', label: 'base a11y', mustHave: [
    [/@layer\s+base/, '@layer base'],
    [/:focus-visible/, ':focus-visible'],
    ...
```

```236:239:build/check.mjs
  for (const [k, v] of Object.entries(scope)) {
    const r = resolve(v, scope);
    if (typeof r === 'string' && r.startsWith('var(')) errors.push(`[${label}] referência não resolvida: ${k} -> ${v}`);
  }
```

(A segunda passagem aplica-se ao escopo de `tokens.css`, não aos artefatos a11y.)

#### Por que importa

- Contradiz a promessa do gate: *"refs quebradas reprovam"* (regra 06 §4).
- Regressão silenciosa em sombra, radius ou altura do botão — cores podem ainda passar no e2e,
  mas medidas/comportamento degradam sem falha no CI da raiz.

#### Correção proposta

Estender `check.mjs` para, após o build:
1. Ler `dist/base.css` e `dist/components/*.css`.
2. Extrair declarações `var(--*)`.
3. Resolver contra o mesmo `makeResolve` usado em `tokens.css`.
4. Falhar o build se alguma referência ficar como `var(...)` não resolvido.

#### Critério de aceite

- Introduzir um typo proposital em `src/components/button.css` → `npm run check` **falha**.
- Com código correto → `npm run verify` verde.

#### Esforço estimado

~2–4 horas (implementação + teste em `css.test.mjs`).

---

### M5 — Escopo `@crp` incompatível com owner `luuuster` (GitHub Packages)

#### O que está errado

O pacote se chama `@crp/design-tokens`, o `.npmrc` aponta `@crp:registry` para GitHub Packages,
e o README descreve publicação — mas o repositório pertence a **`luuuster/crp-tis`**.

GitHub Packages **exige** que o escopo npm (`@crp`) coincida com o owner/org do GitHub (`@luuuster`).
Um `changeset publish` real falharia sem renomear escopo ou transferir o repo para uma org `crp`.

Hoje isso é **mitigado**: `"private": true` no `package.json` impede publish acidental; o app consome
via `"@crp/design-tokens": "file:.."` — e isso **funciona**.

#### Evidência

```2:7:package.json
  "name": "@crp/design-tokens",
  ...
  "private": true,
```

```1:5:.npmrc
# ... Para publicar, o escopo DEVE bater com o dono do repo no GitHub (ex.: @luuuster) —
# alinhar aqui e no `name` do package.json antes do primeiro release.
@crp:registry=https://npm.pkg.github.com
```

#### Por que importa

- Documentação promete pipeline de release que **não pode funcionar** sem mudança estrutural.
- Versão eterna `0.0.0`, changesets presentes mas sem release real — confusão para quem for
  consumir o DS fora do monorepo.

#### Correção proposta (decisão de produto)

| Caminho | Ação |
|---|---|
| **A — Publicar de verdade** | Renomear para `@luuuster/design-tokens` (ou criar org `crp`), primeiro changeset + tag |
| **B — Monorepo only** | Remover/simplificar README §Publicação, changesets/action no CI, manter só `file:..` |

#### Critério de aceite

- README e `package.json` descrevem **uma** estratégia, sem placeholder "troque @crp".
- Se caminho A: `changeset publish` de teste em staging com sucesso.

#### Esforço estimado

B: ~1 h (docs). A: meio dia+ (rename, CI, consumidores).

---

## 3. Problemas de severidade BAIXA

### B1 — Token `surface-ring` com hex+alpha fixo em vez de `color-mix`

**Onde:** `tokens/mode/light.json:108`, `tokens/mode/dark.json:106`

**O quê:** `surface-ring` usa `#080a0f0a` (light) e `#ffffff1a` (dark) em vez de
`color-mix(in oklch, {color.neutral.950} 4%, transparent)` como prescreve `tokens/AGENTS.md` lei 4.

**Impacto:** Se `neutral.950` mudar no futuro, o ring **não acompanha**. Hoje está documentado
como decorativo (abaixo de 3:1 de propósito) e **não quebra** contraste no gate.

**Correção:** Migrar para `color-mix` OU registrar exceção explícita no `tokens/AGENTS.md`.

**Esforço:** ~30 min.

---

### B2 — Rótulos em português fixos no chrome da vaga pública

**Onde:** `app/src/lib/vaga.tsx:94-117`

**Strings afetadas:** "Descrição da vaga", "Sobre o desafio", "Objetivo", "Responsabilidades",
"Requisitos", "Operação & condições", "Processo seletivo", "Benefícios".

**Impacto:** Com idioma `en` ou `es`, a **prosa mockada** da vaga pode ficar em PT (decisão
aceitável), mas os **rótulos de seção** são chrome de UI e deveriam seguir i18n (regra 10 §3).

**Correção:** Mover para namespace `vagas.json` nas 4 línguas OU documentar em `HANDOFF.md` que
chrome de vaga mock fica só em PT.

**Esforço:** 1–2 h se i18n completo.

---

### B3 — Sem testes unitários em `masks.ts` e `password.ts`

**Onde:**
- `app/src/lib/masks.ts` — máscaras CPF, CNPJ, telefone, data
- `app/src/lib/password.ts` — regras `PWD_RULES`, `senhaForte`

**Impacto:** Lógica usada em formulários de cadastro/acesso sem rede de segurança; regressão
só aparece em e2e ou manualmente.

**Correção:** Criar `masks.test.ts` e `password.test.ts` (padrão já existe em `datetime.test.ts`,
`format.test.ts`, etc.).

**Esforço:** ~1 h.

---

### B4 — `aria-label` em inglês em primitivas shadcn

**Onde (produção, não demos):**

| Arquivo | Linha | Texto |
|---|---|---|
| `sidebar.tsx` | 287 | `"Toggle Sidebar"` |
| `spinner.tsx` | 9 | `"Loading"` |
| `breadcrumb.tsx` | 8 | `"breadcrumb"` |
| `pagination.tsx` | 15 | `"pagination"` |

**Impacto:** Leitor de tela anuncia inglês mesmo com UI em pt-BR/en/es. Impacto **baixo** para
landmarks genéricos; maior no sidebar toggle e spinner.

**Correção:** Props com default i18n no app wrapper, ou `aria-label` via `t()` nos pontos de uso.

**Esforço:** 1–2 h.

---

### B5 — Comentários e docs desatualizados após remoção de `preview/`

**Exemplos:**

| Arquivo | Trecho stale |
|---|---|
| `build/build-tokens.mjs:231` | *"Consumidos pelo app E pelos previews"* |
| `docs/PLANO-SANEAMENTO.md:399-407` | Plano de screenshots em `preview/*.html` |
| `docs/auditorias/VISTORIA-2026-07-08-repo.md:78` | Diz que `check.mjs` varre `preview/` |

**Impacto:** Confunde agentes e humanos que leem docs como instrução vigente.

**Correção:** Atualizar textos vivos; em docs históricos, adicionar nota *"estado em 08/07; preview
removido em 07/2026"*.

**Esforço:** ~30 min.

---

### B6 — Template de PR incompleto vs matriz real de CI

**Onde:** `.github/PULL_REQUEST_TEMPLATE.md`

**O quê:** Checklist cita `npm run check`, lint, build e test do app — mas **não** menciona:
- `npm run doctor` (anti-corrupção)
- `npm run check:mock` (PII)
- `npm run e2e` (a11y renderizada)
- `sync:rules --check` (pretest da raiz)

**Impacto:** PRs podem mergear sem lembrar gates que o CI roda — risco de surpresa no pipeline.

**Correção:** Expandir checklist alinhado a `.github/workflows/build-tokens.yml`.

**Esforço:** ~15 min.

---

### B7 — `app/package.json` sem campo `bugs`

**Onde:** Raiz tem `"bugs": { "url": "https://github.com/luuuster/crp-tis/issues" }`;
`app/package.json` não tem o campo.

**Impacto:** Metadado incompleto; ferramentas npm/github podem não linkar issues do app.

**Correção:** Copiar o mesmo bloco `bugs` (e opcionalmente `repository`) para `app/package.json`.

**Esforço:** 5 min.

---

## 4. O que NÃO é problema (refutado ou decisão deliberada)

### Refutado nesta auditoria

| Hipótese | Evidência de refutação |
|---|---|
| E2E com 32 falhas (relatório 11/07) | **131/131 passaram** em 12/07/2026 |
| E-mails Gmail / PII real no app | `grep @gmail` em `app/` → 0; `check:mock` OK em 272 arquivos |
| Referências quebradas a `preview/` no working tree | Código ativo limpo; `check.mjs:184` usa `src/components` + `src/a11y` |
| App sem gate no CI | Workflow tem jobs `app` (lint/tsc/test) e `e2e` separados |

### Decisões do projeto — não tratar como bugs

| Item | Onde está documentado |
|---|---|
| Sem backend, banco ou API real | `PROPOSITO.md`, `SECURITY.md`, regra 00 |
| Auth/CAPTCHA simulados no cliente (`localStorage`) | `SECURITY.md`, `app/HANDOFF.md` |
| `forceMount` em todas as tabs pós-login | `app/AGENTS.md` (a11y + estado) |
| Prosa mock (bios, análises IA) não traduzida | Regra 10 §3 |
| Ícones brancos na lib Figma | Regra 07 |

---

## 5. O que está limpo (para contexto)

- **350 testes automatizados** passando no total (139 raiz + 211 app), mais 131 e2e.
- **Contraste WCAG AA** fatal no `check.mjs` + validação por pixel no e2e (4 temas × 2 marcas).
- **axe-core** estrutural em telas, overlays, gerador mobile, vitrine de componentes.
- **i18n:** 16 namespaces, paridade `en`/`es`/`pt-BR`, `pt-AO` por override — `parity.test.ts` verde.
- **Tokens:** 4 temas, 797 declarações, 0 uso de cor de preenchimento como texto em `src/`.
- **Plugins Figma:** testes de pure functions, idempotência, drift, bundles.
- **Governança:** CODEOWNERS, Dependabot, SECURITY.md, doctor no pre-commit, sync-rules espelho.

---

## 6. Roadmap recomendado (ordem de valor)

```
1. M3  → commit atômico do WIP (desbloqueia estado limpo no git)
2. M1  → personas Diego/Jair + e2e
3. M2  → LICENSE × SECURITY × regra 00
4. M4  → gate var() nos artefatos a11y
5. M5  → decisão publish vs file:.. only
6. B3  → testes masks/password (rápido, alto retorno)
7. B5  → limpar docs stale do preview
8. B2, B4, B1, B6, B7 → conforme prioridade de produto
```

---

## 7. Como usar este relatório

- **Backlog:** cada item M* e B* vira um ticket/issue com o critério de aceite da seção correspondente.
- **PR:** referenciar o ID (ex. "fix(M1): alinha persona EntrevistasIA").
- **Remediação:** quando corrigir, anexar seção "Remediado em DD/MM/AAAA" neste arquivo ou no
  [AUDITORIA-2026-07-12-repo-completa.md](AUDITORIA-2026-07-12-repo-completa.md) — não apagar a
  evidência original (regra em `docs/AGENTS.md`).

---

*Gerado na auditoria de 12/07/2026. Gates reexecutáveis: raiz `npm run verify`; app `npm run verify`.*
