---
"@crp/design-tokens": minor
---

Papel `text.h3` redefinido para **Bold + tracking-tight** (Inter 700 · 30px · -0.025em), alinhando
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
