---
"@crp/design-tokens": minor
---

Button: paridade web↔Figma (theme-aware), alinhamento da escala tipográfica ao produto e novo tier `xs` + Text style de rótulo mínimo.

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
