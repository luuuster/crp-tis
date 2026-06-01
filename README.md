# CRP Design System — `@crp/design-tokens`

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
  core/                      # PRIMITIVOS (OKLCH): paleta completa do Tailwind v4 + marca, dimensão, tipografia
    color.json               #   26 paletas Tailwind + white/black + brand.<marca>.{primary,secondary}
    dimension.json           #   space (escala 0–96), radii (xs–4xl + base/full), breakpoints
    typography.json          #   font family/weight/size/lineHeight/leading/tracking
  semantic/base.json         # CONSTANTES do contrato (radius, chart-*)
  brand/{crp,marca-b}.json   # contrato que varia por MARCA (primary, ring, sidebar-primary…)
  mode/{light,dark}.json     # contrato que varia por MODO (background, card, border…)
  components/                # tier 3 (opcional, ainda não ligado aos themes)
build/
  build-tokens.mjs           # Style Dictionary v4 + sd-transforms → dist/
  check.mjs                  # valida refs, contrato e contraste WCAG
dist/                        # GERADO — não editar à mão
  tokens.css                 # :root + .dark + [data-brand] (CSS custom properties)
  theme.css                  # Tailwind v4 @theme inline (importe isto no app)
  tokens.{js,d.ts}           # brands/modes/themes para o provider de tema
preview/index.html           # preview visual da troca de tema/marca (abre direto no navegador)
```

## Comandos

```bash
npm install
npm run build     # gera dist/ a partir de tokens/
npm run check     # valida contrato, referências e contraste WCAG (AA)
npm run preview   # build + instrução para abrir preview/index.html
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

## Figma Variables (designers, plano free)

1. No Token Studio, **pull** dos tokens do GitHub.
2. **Export → Figma Variables** (ação manual do plugin; sync automático exigiria Pro/Enterprise).
3. Designers montam telas usando os Variables semânticos e trocam o **mode** brand×mode.

⚠️ Só escalares (cor/número/string/bool) viram Variables. Tipografia/sombra (compostos) viram **Styles**. OKLCH é exibido como aproximação **sRGB** no Figma.

## Versionamento (changesets)

- **major** → renomear/remover token (quebra os fronts) · **minor** → novo token · **patch** → mudar valor.
- `npx changeset` ao alterar tokens. O CI (GitHub Actions) gera changelog e publica em **GitHub Packages**.

## Publicação (GitHub Packages, privado/free)

Ajuste o escopo `@crp` em `package.json` e `.npmrc` para o dono do repo no GitHub.
O workflow `.github/workflows/build-tokens.yml` roda `build` + `check` e publica via changesets na `main`.

## Etapas manuais (fora deste repo de código)

- Instalar o plugin **Tokens Studio for Figma** e configurar **sync GitHub** apontando para `tokens/`, formato **DTCG**, multi-file.
- Validar na Fase 1 se a versão do plugin libera "Export to Figma Variables" no plano free.

Para qualquer tarefa no pipeline, use o subagente especializado: `.claude/agents/design-system.md`.
