---
"@crp/design-tokens": minor
---

Tokens da superfície de campo `FIELD` (alpha do Tailwind → Variable), light+dark — a web usa
`bg-muted/50` + `border-border/70` (repouso) e `hover:bg-muted/70` no input/trigger de select
(`lib/surfaces.ts`) e no container de chips, mas esses alphas não existiam como token, então o
espelho Figma saía branco em vez do cinza suave da web:

- `muted-50` — fundo de repouso do campo/container de chips (`bg-muted/50`);
- `muted-70` — fundo no hover (`hover:bg-muted/70`);
- `border-70` — borda de repouso do campo/container (`border-border/70`).

Seguem o modo via `{muted}`/`{border}` e espelham os irmãos `*-10`/`border-50`/`muted-20`.
Superfície decorativa sutil, não-gateados.
