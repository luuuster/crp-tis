# tokens/ — instruções de domínio (herda o [AGENTS.md](../AGENTS.md) raiz)

Fonte da verdade dos **valores de design** (DTCG: `$value`/`$type` por token). Tudo aqui é
autorado e revisado por PR; `dist/` e os JSONs dos plugins são gerados a partir daqui.

## Estrutura e taxonomia

- `core/{color,dimension,typography}` — **primitivos** (OKLCH na cor; paleta Tailwind 50–950 +
  `brand.<marca>.*`). Componentes NUNCA consomem primitivos direto.
- `semantic/base` — constantes do contrato (`radius`, `chart-*`) compartilhadas entre marcas.
- `brand/{crp,marca-b}` — o que varia por marca (`primary*`, `ring`, `sidebar-*`).
- `mode/{light,dark}` — o que varia por modo (o resto do contrato shadcn).
- `components/*` — tokens de componente (tier 3, opcional). DEVEM espelhar o que o shadcn
  RENDERIZA (medir o DOM; ver memória do projeto — `text-sm`, `rounded-md`, `size-4`).
- `$metadata.json` (ordem dos sets) e `$themes.json` (Brand × Mode → 4 permutações). **Leia os
  dois ANTES de mexer.**

## Leis locais

1. Nomes do contrato: **flat, top-level, shadcn** (`card-foreground`); NUNCA grupo com `DEFAULT`.
2. `$type` **por token**, nunca no root do set (colisão de token-fantasma).
3. Sem composto DTCG (typography/shadow como objeto) — a tipografia é escalar. Precisou? PARE e pergunte.
4. Cor translúcida tokenizada = alpha NA variável (`*-10`, `*-90` via color-mix), não no paint.
5. Token novo de contrato entra também no `REQUIRED` de `build/check.mjs` (gate ou não existe).
6. Falta token para um caso? **PARE e alinhe com o usuário** — nunca chumbar valor no consumidor.

## Validação (Definition of Done local)

`npm run build && npm run check` na raiz — check termina em
`✅ contrato completo, refs resolvidas, contraste crítico AA` (4 permutações; FATAL bloqueia).
Mudou valor/nome: **changeset** (patch/minor/major conforme tabela do agent design-system) e,
quando relevante ao Figma, `npm run export:figma` regenerado. Auditoria dark: `npm run audit:dark -- --strict`.
