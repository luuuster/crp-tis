# @crp/design-tokens

## 0.1.0

### Minor Changes

- 143c75a: Novos tokens de tinta (alpha do Tailwind → Variable), light+dark — lacunas de paridade web→Figma
  (no Figma o alpha mora na Variable, então esses alphas precisam existir como token):

  - `border-50` — divisor sutil do CardHeader e da paginação (`border-b border-border/50`);
  - `muted-20` — fundo quase-transparente da linha de filtros da tabela (`bg-muted/20`);
  - `muted-foreground-60` — ícone de dica (HelpCircle `aria-hidden`) no topo do campo do wizard
    (`text-muted-foreground/60`).

  Seguem o modo via `{border}`/`{muted}`/`{muted-foreground}` e espelham os irmãos `*-10`
  (`success-10`, `warning-10`). Não-gateados (separador/superfície/ícone decorativos e sutis, como os `*-10`).

- b71e423: Botão só-ícone: ícone cresce com a caixa (icon-md 20px, icon-lg 24px) em vez de 16px fixo. Novo grupo de token `button/icon-only-size` (xs=12, sm=16, md=20, lg=24), separado do `button/icon-size` (botão com texto, que segue 16px pra alinhar com o rótulo). Espelha button.tsx (`icon`→size-5, `icon-lg`→size-6).
- b71e423: Button: paridade web↔Figma (theme-aware), alinhamento da escala tipográfica ao produto e novo tier `xs` + Text style de rótulo mínimo.

  **Cor (camada `mode`, light/dark):**

  - **7 tokens alpha** (`color-mix` OKLCH, precedente do `warning-muted`): `primary-10`, `primary-15`, `secondary-10`, `secondary-15`, `destructive-10`, `destructive-15`, `warning-90` — usados pelos botões soft e pelos hovers.
  - **6 tokens de componente mode-aware** do Button (valor distinto por modo, espelhando os overrides `dark:` de `button.tsx`): `button-destructive-bg`, `button-outline-border`, `button-outline-bg`, `button-outline-hover-bg`, `button-ghost-hover-bg`, `button-destructive-outline-hover-bg`.

  **Correção de escala (dimensão, `components/button`):** realinhamento de valor ao `button.tsx`/`index.css` (fonte da verdade da web), medido no DOM. Nenhum token renomeado/removido.

  - `button-font-size-md` e `button-font-size-lg` passam a `{font.size.sm}` (14px), alinhando ao `button.tsx` — a base do cva é `text-sm`, e md/lg NÃO usam 16/18. (`sm` já era 14; sem mudança.)
  - `button-radius` passa de `{radius}` (10px) a `{radius-md}` (6px) — o botão usa `rounded-md` no cva e em todos os sizes.
  - `button-icon-size-md` (`{icon.20}` 20px) e `button-icon-size-lg` (`{icon.24}` 24px) passam a `{icon.16}` (16px) — a base do cva é `size-4` (16px) p/ sm/md/lg; só o `xs` cai p/ 12px. (`xs` 12 e `sm` 16 já corretos; sem mudança.)
  - `button-ring-width` passa de `{borderWidth.3}` (3px) a `{borderWidth.2}` (2px) — `.focus-ring` no `index.css` é `outline: 2px`. (`ring-offset` já era 2px; sem mudança.)

  **Novo tier `xs` do Button** (UI densa, fora da escala de toque) — 6 Variables em `CRP/Components`, espelhando `size="xs"` de `button.tsx` (`h-6`/`text-xs`/`gap-1`/`px-2`/`size-3`):

  - `button-height-xs` (24px), `button-font-size-xs` (12px), `button-icon-size-xs` (12px), `button-gap-xs` (4px), `button-padding-x-xs` (8px), `button-padding-y-xs` (4px).

  **Novo Text style `label-xs`** (12px · Source Sans 3 500) em `semantic/typography` — rótulo mínimo do botão `xs` (não existia 12/medium: só `caption` 12/400 e `overline` 12/600). Materializa como `Label/XSmall` no Figma.

  Contrato de cor: 275 → 288 vars/tema. `CRP/Modes` (Figma): 102 → 115 Variables. `CRP/Components` (Figma): 23 → 29 Variables. Text styles: 17 → 18. Sem breaking change: apenas adição de tokens + realinhamento de valor (md/lg de 16/18 → 14) — nenhum token renomeado/removido.

- d1f7b34: Tokens da superfície de campo `FIELD` (alpha do Tailwind → Variable), light+dark — a web usa
  `bg-muted/50` + `border-border/70` (repouso) e `hover:bg-muted/70` no input/trigger de select
  (`lib/surfaces.ts`) e no container de chips, mas esses alphas não existiam como token, então o
  espelho Figma saía branco em vez do cinza suave da web:

  - `muted-50` — fundo de repouso do campo/container de chips (`bg-muted/50`);
  - `muted-70` — fundo no hover (`hover:bg-muted/70`);
  - `border-70` — borda de repouso do campo/container (`border-border/70`).

  Seguem o modo via `{muted}`/`{border}` e espelham os irmãos `*-10`/`border-50`/`muted-20`.
  Superfície decorativa sutil, não-gateados.

- d1f7b34: Papel `text.h3` redefinido para **Bold + tracking-tight** (Inter 700 · 30px · -0.025em), alinhando
  o h3 ao padrão de h1/h2 (o h4–h6 seguem SemiBold/normal). Antes era SemiBold/tracking normal, mas o
  tratamento REAL de título de 30px no app sempre foi bold+tight — aplicado com o utilitário CRU
  `font-heading text-3xl font-bold tracking-tight` (fora da escala `ty-*`), então nenhum papel o
  capturava e esses headings não conseguiam usar text style (nem no espelho Figma).

  - token `semantic/typography.text.h3`: peso `{font.weight.bold}`, tracking `{font.tracking.tight}`;
  - reflete nas vars `--text-h3-*` (4 temas + `tokens.css`), na classe `.ty-h3` e no Figma text style
    `Heading/H3` (campos bindados a Variable);
  - headings adotados/normalizados para `ty-h3`: `PageHeader`, `StatCard` (composicoes/page.tsx),
    `JobGenerator` ("Nova vaga"), `VagasList`, `Showcase` — de `text-3xl font-bold tracking-tight` cru;
  - os 2 usos existentes de `ty-h3` (login/registro em `AuthLayout`, tela de erro em `ErrorBoundary`)
    passam de SemiBold para Bold+tight — mudança mínima, mais consistente.

  Decisão: reusar o h3 em vez de criar um papel `title` novo (h3 quase não era usado — 2 lugares),
  evitando redundância de dois papéis a 30/36.

- b71e423: Ícones: migração da escala de tamanho de **t-shirt** para **numérica por px** (`icon/<px>`) + 4 novos tamanhos.

  **Motivo:** `icon-16` é inequívoco (a escala t-shirt exigia decorar `sm=16`) e a UI do app já usa 14/18/28, que não existiam como token.

  **Fonte (`build/seed-palette.mjs`) e primitivos (`tokens/core/icon.json`):** o objeto `icon` passa a usar chaves numéricas por px. Renomeações (valor inalterado): `icon.xs`→`icon.12`, `icon.sm`→`icon.16`, `icon.md`→`icon.20`, `icon.lg`→`icon.24`, `icon.xl`→`icon.32`, `icon.2xl`→`icon.40`, `icon.3xl`→`icon.48`. **Novos:** `icon.8` (8px), `icon.14` (14px), `icon.18` (18px), `icon.28` (28px), `icon.36` (36px). Gera `--icon-8 … --icon-48` no CSS e `icon/8 … icon/48` nas Figma Variables.

  **Refs de componente (`tokens/components/button.json`):** `button-icon-size` atualiza os refs para os novos nomes — valores finais **idênticos**: `xs` → `{icon.12}` (12px), `sm/md/lg` → `{icon.16}` (16px).

  **Sem breaking change para consumidores:** o app usa `size-N` do Tailwind (não referencia `--icon-*` por nome) e o plugin de ícones casa o primitivo **por valor** (`icon/16`=16 continua batendo). Consumidores internos por nome (preview, testes e docs do plugin/React) foram atualizados no mesmo trabalho.

  **Materialização Figma:** ao re-materializar, as Variables `icon/*` são renomeadas (t-shirt→px) e 4 são criadas (`icon/8·14·18·28`). Sistema auto-curável: `button-icon-size` re-materializa apontando p/ `icon/16`; o plugin de ícones re-casa por valor. Preferir **rename in-place** (preserva o ID e os binds existentes); mesmo em delete+create os binds se re-resolvem por valor.

- a33b12e: Meios-passos na escala `space` (`space.0.5`/`1.5`/`2.5`/`3.5` = 2/6/10/14px) — os passos fracionários
  do Tailwind (`gap-1.5`, `gap-2.5`, `p-3.5`…) que a web já usa mas a escala primitiva só tinha em
  índices inteiros. Destrava a tokenização completa de gap/padding no Figma (antes esses valores ficavam
  crus por falta de Variable equivalente). Fiel à web: são os mesmos valores que `calc(--spacing × n)` gera.
- e34b738: Novo token `success-10` (tinta SUCCESS a 10%, light+dark) — fundo do selo/badge soft de status
  "Aberta" (StatusBadge, o status mais frequente), espelhando o `bg-success/10` da web.
  Fecha a lacuna de paridade com os irmãos (`warning-10`, `destructive-10`, `primary-10`) e destrava
  o bind no Figma (o alpha mora na Variable; par de texto: `success-text`, AA em light e dark).
- a33b12e: Novo token `warning-10` (tinta WARNING a 10%, light+dark) — fundo dos selos/badges soft de aviso,
  espelhando o `bg-warning/10` da web (tag de urgência do prazo no VagaCard, alertas do briefing).
  Completa a família de tintas (`primary-10/15`, `secondary-10/15`, `destructive-10/15`, `warning-90`)
  e destrava o bind no Figma (par de texto: `warning-text`).
- d1f7b34: 16 tokens de tinta do wizard `/vagas/nova` (alpha do Tailwind → Variable), light+dark — paridade
  web→Figma (no Figma o alpha mora na Variable). Espelham `bg-*/N`, `ring-*/N`, `border-*/N` usados no
  Stepper, CharlieRail, StepBriefing/Perfil, ReviewStep e TopBar do Gerador:

  - primary: `primary-5`, `primary-50`
  - destructive: `destructive-5`, `destructive-40`
  - success/warning: `success-5`, `warning-5`
  - muted: `muted-30`, `muted-40`, `muted-60`
  - border: `border-40`, `border-60`
  - foreground: `foreground-6`, `foreground-8`, `foreground-40`
  - accent/secondary: `accent-40`, `secondary-90`

  Seguem marca/modo via o token semântico (`color-mix(in oklch, {token} N%, transparent)`) e espelham
  os irmãos `*-10`. Superfícies/anéis/divisores decorativos e sutis, não-gateados.
