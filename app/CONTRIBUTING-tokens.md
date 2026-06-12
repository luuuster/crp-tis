# Regras de cor, foco e tipografia (token-driven)

Esta tela é a **base do sistema**. Para não voltarmos a corrigir as mesmas coisas no olho, o app é
**correto por construção** + **guardado por automação**. Resumo do que vale e do que a máquina cobra.

## A regra de ouro
**Nunca chumbe valor.** Cor, sombra, anel e tamanho saem de **tokens do DS**. Se o token que você
precisa **não existe**, **PARE e alinhe** para criá-lo no DS (`tokens/*.json` → `build && check`) — não
invente um `rgba()`/opacidade na tela. Foi assim que nasceram `--surface-ring` e `--elevation-panel-*`.

## Cor de texto: fill × `-text` × `-foreground`
| Quero… | Use | Nunca |
|---|---|---|
| Texto/ícone **colorido** sobre fundo claro/card | `text-primary-text`, `text-destructive-text`, `text-secondary-text`, `text-success-text`, `text-link` | `text-primary` (fill) — **reprova contraste** |
| Texto **sobre um fill sólido** (ex.: dentro de `bg-primary`) | `text-primary-foreground` etc. | — |
| **Superfície** sólida / tintura | `bg-primary`, `bg-primary/10`, `fill-primary` (indicador) | — |

Atalho para "ícone em círculo tonal": **`toneBadge`** de [src/lib/surfaces.ts](src/lib/surfaces.ts)
(`bg-X/10` + `text-X-text`, AA nos 4 temas).

## Foco
Use **`focus-visible:focus-ring`** (utilitário único em [src/index.css](src/index.css)) ou, em elementos
"crus", `focusRing` de [src/lib/focus.ts](src/lib/focus.ts). É **outline** (não `ring`): nunca colide com
um anel de repouso e não é cortado por `overflow`. **Não** crie anel de foco com `ring-*` à mão.

## Superfícies
`FIELD` / `FLOAT` / `CARD` de [src/lib/surfaces.ts](src/lib/surfaces.ts) — anéis e sombras já vêm de token
(`ring-surface-ring`, `shadow-panel-l|r`). Reuse em vez de recriar.

## Tipografia
Base **16px**, piso **14px**. **12px é raríssimo** e só via `.ty-caption`/`.ty-overline` ou `text-xs`.
Nada de `text-[13px]`/`text-[0.8rem]` arbitrário.

## O que a máquina cobra (`npm run verify`)
- **`npm run lint`** → regra local `crp/design-tokens`: reprova fill-como-texto, cor chumbada (hex/rgb/
  oklch) e tipografia < 14px. (Exceções legítimas: `// eslint-disable-next-line crp/design-tokens` **com
  justificativa** — ver [chart.tsx](src/components/ui/chart.tsx).)
- **`npm run e2e`** → [e2e/contrast.spec.ts](e2e/contrast.spec.ts) mede **contraste por pixel real**
  (culori, não axe — o axe erra OKLCH) e [e2e/focus-visible.spec.ts](e2e/focus-visible.spec.ts) garante
  **indicador de foco visível ≥3:1** — nos 4 temas (CRP/Marca-B × claro/escuro).
- **`npm run build`** → `tsc` + Vite.

Regressão **reprova o build**, não o seu olho.
