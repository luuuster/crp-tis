# CRP Design System — `@crp/design-tokens`

> ## 🖥️ Quer rodar o **APP** (TalentAI)? → vá para [`app/`](app/)
> **Este README é só do Design System (os tokens).** O app React fica na pasta **[`app/`](app/README.md)**.
> Rodar:
> ```bash
> npm install && npm run build   # 1) na RAIZ: gera o dist/ dos tokens (o app importa @crp/design-tokens/tokens.css)
> cd app && npm install && npm run dev   # 2) sobe o app em http://localhost:5173
> ```
> ⚠️ O passo 1 (`npm run build` na raiz) **não é opcional** — sem ele a pasta `dist/` não existe e o app quebra ao subir.
> O [`preview/index.html`](preview/index.html) citado abaixo é só a **vitrine dos tokens** (Botões/Texto/Charts), **não** o app.

Pipeline de **Single Source of Truth (SSOT)** para os tokens do produto CRP.

```
Token Studio (Figma)  →  GitHub (tokens/*.json)  →  ┬→  Figma Variables (designers)
   fonte da verdade        versionado                └→  dist/ (Tailwind v4 / shadcn → front-ends)
```

- **Token Studio** é a **fonte da verdade**. Ninguém edita CSS nem Figma Variables à mão.
- **Designers** consomem **Figma Variables** (gerados a partir do Token Studio).
- **Front-ends** consomem `@crp/design-tokens` (Tailwind v4 + shadcn/ui).
- Multi-marca (`CRP`, `MarcaB`, …) × **Light/Dark**. Cores em **OKLCH**.

## Estrutura

```
tokens/                      # SSOT (sincronizado pelo Token Studio, formato DTCG)
  $metadata.json             # ordem dos token sets
  $themes.json               # grupos Brand × Mode → 4 themes
  core/                      # PRIMITIVOS — paridade total com o Tailwind v4 (+ marca)
    color.json               #   22 paletas oficiais (OKLCH) + white/black + brand.<marca>.{primary,secondary}
    dimension.json           #   space (0–96), radii (xs–4xl + base/full), breakpoints, container (3xs–7xl)
    typography.json          #   font family/weight/size/lineHeight/leading/tracking
    shadow.json              #   shadow, inset-shadow, drop-shadow, text-shadow (compostos → só CSS)
    effect.json              #   blur, perspective, aspect
    motion.json              #   ease (cubic-bezier), duration, animate (keyframes vêm do @import tailwindcss)
    border.json              #   border-width (escala de espessuras; também liga a espessura dos ícones)
    icon.json                #   icon (tamanhos de ícone; vira icon/* nas Figma Variables)
  semantic/                  # tier 2 invariável (1 mode): constantes do contrato
    {opacity,spacing,state,radius,typography,layer}.json
  brand/{crp,marca-b}.json   # contrato que varia por MARCA (primary, ring, sidebar-primary…)
  mode/{light,dark}.json     # contrato que varia por MODO (background, card, border…, elevation.* = sombra por modo)
  components/button.json     # tier 3 (ligado aos themes) — HOJE só consome tokens DIMENSIONAIS do botão
                             #   (padding/altura/ícone/gap por tamanho); cor/estado ficam no semantic
                             #   (state.json) + anatomia por intent no src/components/button.css — por design,
                             #   p/ cor de componente nunca divergir do contrato da marca
src/                         # FONTES autoradas da a11y de comportamento (SSOT desses CSS/JS)
  a11y/base.css              #   foco global (--ring) + reduced-motion + forced-colors + prefers-contrast (@layer base)
  components/button.css      #   o componente .btn auditado (intents/estilos/tamanhos/estados, @layer components)
  components/button.js       #   guard de ativação p/ [aria-disabled="true"] (1 listener delegado, idempotente)
build/
  lib/{css,themes}.mjs       # compartilhados: parse/resolve/color-mix de CSS · marcas/temas derivados do $themes.json
  build-tokens.mjs           # Style Dictionary v4 + sd-transforms → dist/ (+ emite os fontes de src/ com header)
  check.mjs                  # valida refs, contrato, contraste WCAG (repouso E estados hover/active) e artefatos a11y
dist/                        # GERADO — não editar à mão
  tokens.css                 # :root + .dark + [data-brand] (CSS custom properties)
  theme.css                  # Tailwind v4 @theme inline (importe isto no app)
  base.css                   # a11y agnóstica de framework (gerado de src/a11y/base.css)
  components/button.css      # componente .btn (gerado de src/components/button.css)
  components/button.js       # guard aria-disabled (gerado de src/components/button.js)
  tokens.{js,d.ts}           # brands/modes/themes para o provider de tema
preview/index.html           # preview visual da troca de tema/marca (abre direto no navegador)
```

## Comandos

```bash
npm install
npm run build     # gera dist/ a partir de tokens/
npm run check     # valida contrato, referências e contraste WCAG (AA)
npm run preview   # build + instrução para abrir preview/index.html
npm run export:ts # gera token-studio/tokens.json (bundle p/ importar no Token Studio)
```

## Cores das marcas

Cada marca tem rampa própria em `color.brand.<marca>.<papel>` (50–950 + `DEFAULT`). O **shade-âncora** e o `DEFAULT` carregam o HEX exato informado; a rampa é gerada de forma monotônica (mesma hue, croma em sino).

| Marca | Papel | HEX | Onde fica a cor exata |
|-------|-------|-----|------------------------|
| CRP | primary | `#036EF2` | `color.brand.crp.primary.600` (= DEFAULT) |
| CRP | secondary | `#8e51ff` | `color.brand.crp.secondary.600` |
| Marca B | primary | `#B30631` | `color.brand.marca-b.primary.700` |
| Marca B | secondary | `#2886F3` | `color.brand.marca-b.secondary.500` |

**Botão primary (AA):** texto branco sobre `#036EF2` dá só **4.44:1** (< AA 4.5), então o `primary` da CRP usa `brand.crp.primary.700` (mais escuro); a cor exata segue em `ring` (`600`). Já `#B30631` é escuro e passa com folga (**6.75:1**), então a Marca B usa `brand.marca-b.primary.700` (= cor exata) no botão e no ring.

**Secundárias** (`#8e51ff`, `#2886F3`) ficam disponíveis **apenas** como primitivos em `color.brand.<marca>.secondary.*` — não aplicadas ao contrato shadcn (prontas para usar onde você decidir). Os `chart-*` usam paleta genérica do Tailwind (não as cores de marca).

> Os primitivos `core/*` foram semeados do Tailwind v4 + marcas por `build/seed-palette.mjs` (config `BRANDS` no topo). Para trocar uma cor de marca, adicionar marca, ou atualizar do Tailwind: edite o script e rode `node build/seed-palette.mjs` (⚠ sobrescreve `core/`), **ou** edite direto no Token Studio.

## Taxonomia (3 tiers)

1. **Primitivo** (`core/*`) — valores crus em OKLCH, agnósticos de marca/modo. Ex.: `color.blue.600`.
2. **Semântico / contrato** (`semantic/base`, `brand/*`, `mode/*`) — usa os **nomes do shadcn** (`background`, `primary`, `border`, `radius`…). É aqui que **marca** e **light/dark** são resolvidos.
3. **Componente** (`components/*`) — opcional, referencia o contrato.

> Front-ends e componentes consomem **apenas** o contrato (tier 2/3), nunca primitivos.

## Como o tema é trocado

`dist/tokens.css` define o contrato sob seletores:

| Tema | Seletor |
|------|---------|
| CRP · Light | `:root` |
| CRP · Dark | `.dark` |
| MarcaB · Light | `[data-brand="marca-b"]` |
| MarcaB · Dark | `[data-brand="marca-b"].dark` |

No app: `<html class="dark" data-brand="marca-b">`. Dark via classe (padrão `next-themes`), marca via `data-brand`. A marca default (CRP) não usa `data-brand`.

## Uso com shadcn/ui (front-end)

```bash
npx shadcn@latest init        # Tailwind v4, components.json com cssVariables: true
```

No `globals.css` do app, troque os blocos chumbados do shadcn por:

```css
@import "@crp/design-tokens/theme.css";   /* já traz tailwindcss + tokens + @theme inline */
```

Os componentes (`npx shadcn@latest add button card …`) passam a pegar as cores/raios do DS e respondem a `.dark`/`[data-brand]` automaticamente.

## Acessibilidade (a11y) no produto

A a11y de **comportamento** (foco global, `prefers-reduced-motion`, `forced-colors`, e o componente `.btn` acessível) é **shippada no `dist/`** — não fica só nos previews. Importe:

```js
import "@crp/design-tokens/theme.css";              // (ou tokens.css) — o contrato de tokens
import "@crp/design-tokens/base.css";                // foco global (--ring) + reduced-motion + forced-colors
import "@crp/design-tokens/components/button.css";   // o componente .btn (intents/estilos/tamanhos/estados)
import "@crp/design-tokens/components/button.js";    // guard de ativação p/ [aria-disabled="true"] (auto-instala)
```

> **Decisão — `base.css` é export separado, não `@import` no `theme.css`.** O `theme.css` é a ponte Tailwind (`@theme inline`) e o app Tailwind já tem preflight/reset próprio. Embutir resets de a11y ali arriscaria conflito de cascata e duplicação. Como export à parte (`./base.css`), o consumo é explícito e opcional, e a base usa `@layer base` (baixa especificidade — o app sobrescreve quando precisar). O botão usa `@layer components`.

### Contrato de markup (o que o consumidor deve seguir)

- **`type="button"`** em todo `<button>` que não submete (evita submit implícito dentro de `<form>`).
- **Só-ícone** SEMPRE com **`aria-label`** (o rótulo acessível; preservado inclusive carregando).
- **Ícones** (`<svg>`) com **`aria-hidden="true"` `focusable="false"`** (decorativos; não entram na árvore nem no tab).
- **Desabilitado** = **`aria-disabled="true"`** (NÃO o atributo nativo `disabled`): o botão segue **focável** e descobrível (o leitor anuncia "desabilitado"); a ativação por mouse/teclado fica inerte pelo **guard** de `button.js`.
- **Loading** = **`aria-busy="true"` + `aria-disabled="true"`**, com o **nome acessível preservado** (use `opacity` no conteúdo, nunca `visibility:hidden`/`display:none`); o spinner é um `<span class="btn-spinner" data-crp-motion="essential" aria-hidden="true">` decorativo. O **`data-crp-motion="essential"`** é o que mantém o loader **girando (mais devagar) sob `prefers-reduced-motion`** em vez de congelar — sem ele, a base.css zera a animação e o anel fica parado.
- **Foco** usa **`--ring`** (anel da marca) via `:focus-visible` — nunca o outline preto default.
- **Tamanhos `xs`/`icon-xs` (24px)** atendem o **mínimo** do WCAG 2.5.8 (alvo ≥ 24px) **sem folga** — são "AA-only", para UI densa (toolbars, tabelas). Em superfícies touch ou ações primárias, prefira `sm`+ (a recomendação AAA/plataforma é ≥ 44px).

```html
<!-- normal -->        <button type="button" class="btn solid intent-primary md"><span>Salvar</span></button>
<!-- só-ícone -->      <button type="button" class="btn solid icon-only" aria-label="Adicionar"><svg aria-hidden="true" focusable="false">…</svg></button>
<!-- desabilitado -->  <button type="button" class="btn solid" aria-disabled="true"><span>Salvar</span></button>
<!-- loading -->       <button type="button" class="btn solid" aria-busy="true" aria-disabled="true"><span>Salvar</span><span class="btn-spinner" data-crp-motion="essential" aria-hidden="true"></span></button>
```

### Garantias

- **WCAG 2.2 AA.** Contraste **textual** (≥ 4.5:1) e **não-textual / 1.4.11** (≥ 3:1: borda de outline em repouso e anel de foco) são validados em **CI** (`npm run check`) nos 4 temas (CRP/MarcaB × Light/Dark).
- O `check.mjs` também falha o build se `dist/base.css`, `dist/components/button.css` ou `dist/components/button.js` faltarem ou perderem suas regras-chave (foco+`--ring`, `prefers-reduced-motion`, `forced-colors`, estados do botão, guard `aria-disabled`).
- Fonte da verdade desses artefatos = **`src/`** (autorado). O build LÊ `src/` e ESCREVE em `dist/` com header "GERADO" — **nunca edite `dist/` à mão**. Os previews (`preview/button.html`, `preview/login.html`) **consomem o `dist/`** — a demo prova o artefato shippado, sem CSS/JS duplicado.

## Carregar os tokens no Token Studio (bootstrap, arquivo único)

Os tokens nascem como JSON no repo. Para levá-los ao plugin via **Load from JSON**:

1. `npm run export:ts` → gera `token-studio/tokens.json` (8 sets + `$themes` + `$metadata`).
2. No Token Studio (Figma): **Settings → ative "Use DTCG format"**.
3. **Load from file/JSON** → selecione `token-studio/tokens.json`.
4. Confirme os 8 sets + 4 themes; aplique `CRP-Light` para validar.

O script valida compatibilidade (refs, sets vs `$themes`/`$metadata`, `$type`) e falha se algo quebraria o import. Detalhes no agente `token-studio-export` (`.claude/agents/`).

> ⚠️ **`token-studio/tokens.json` é GERADO e gitignored** (como o `figma-variables.json`). Ele NÃO acompanha
> o git, então pode ficar **stale** se você mudou tokens depois de gerá-lo — **rode `npm run export:ts`
> antes de importar**. O CI também o publica como **artifact** (`token-studio`) a cada build da `main`,
> então dá pra baixar a versão canônica de lá em vez de regenerar.

## Figma Variables (designers)

Duas rotas para levar os tokens a **Figma Variables**:

**A) Plugin próprio (direto, 1 clique — recomendado).** `figma-plugin/` é um plugin de dev que
lê o `token-studio/tokens.json` e **cria as Variables** no arquivo aberto, sem Token Studio nem
Enterprise (a Plugin API escreve Variables em qualquer plano; a REST API de escrita é Enterprise-only).
Cria 4 collections no eixo **Brand × Mode**: `CRP/Primitives`, `CRP/Base`, `CRP/Brand` (modes CRP/MarcaB),
`CRP/Mode` (modes Light/Dark) — contrato todo como **alias** dos primitivos. Passo a passo em
[`figma-plugin/README.md`](figma-plugin/README.md). Use um arquivo do time **pro** (times *Starter*
limitam modes).

**B) Token Studio (manual).** Pull dos tokens do GitHub → **Export → Figma Variables** (ação manual
do plugin; sync automático exigiria Pro/Enterprise).

⚠️ Só escalares (cor/número/string/bool) viram Variables. Tipografia/sombra (compostos) viram **Styles**.

### Gamut de cor (sRGB × P3) — trade-off conhecido

As paletas usam **OKLCH wide-gamut** (herança do Tailwind v4): **117 das 290** cores ficam **fora do
sRGB** (faixas mais saturadas de red/orange/amber etc.). Implicações:

- **No browser:** telas P3 renderizam essas cores na saturação real (CSS `oklch()` é gamut-aware).
- **No Figma:** o modelo de cor é **sRGB**, então o export (`build/lib/color.mjs`) **clampa** cada canal
  a `0..1`. As Variables ficam levemente menos saturadas que o browser nessas 117 cores. O
  `npm run export:figma` **loga a contagem** (`Gamut: 117/290 …`) a cada build, para o trade-off ficar visível.
- **Verificação:** `verify-figma.mjs` compara Figma vs CSS **ambos já clampados em sRGB** — então confirma
  que a *conversão* está correta, não que o Figma iguala o P3 do browser (não há como: o Figma é sRGB).

É **intencional** e não bloqueia nada: a paleta canônica (browser/produção) preserva o wide-gamut; só a
representação no Figma é clampada. Se algum dia o Figma suportar P3, basta remover o clamp em `color.mjs`.

## Versionamento (changesets)

- **major** → renomear/remover token (quebra os fronts) · **minor** → novo token · **patch** → mudar valor.
- `npx changeset` ao alterar tokens. O CI (GitHub Actions) gera changelog e publica em **GitHub Packages**.

## Publicação (GitHub Packages, privado/free)

**Estado atual (intencional):** o pacote está em `version: 0.0.0` e **`private: true`** — ainda **não**
é publicado. O app consome os tokens via link local (`"@crp/design-tokens": "file:.."`), então publicar
não é necessário para desenvolver. Com `private: true`, o passo de release do CI (`changeset publish`)
vira um no-op e a `main` fica verde (em vez de falhar tentando publicar a 0.0.0).

**Para publicar de verdade**, quando quiser distribuir o pacote:
1. Alinhe o escopo `@crp` ao dono do repo no GitHub Packages (ex.: `@<owner>/design-tokens`) em
   `package.json` + `.npmrc` — o registry exige que o escopo bata com o owner/org.
2. Remova `private: true` do `package.json`.
3. `npx changeset` (bump de versão) e merge na `main` — o workflow `build-tokens.yml` roda
   `build` + `check` e publica via changesets.

## Etapas manuais (fora deste repo de código)

- Instalar o plugin **Tokens Studio for Figma** e configurar **sync GitHub** apontando para `tokens/`, formato **DTCG**, multi-file.
- Validar na Fase 1 se a versão do plugin libera "Export to Figma Variables" no plano free.

Para qualquer tarefa no pipeline, use o subagente especializado: `.claude/agents/design-system.md`.
