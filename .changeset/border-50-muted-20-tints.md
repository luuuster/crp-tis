---
"@crp/design-tokens": minor
---

Novos tokens de tinta (alpha do Tailwind → Variable), light+dark — lacunas de paridade web→Figma
(no Figma o alpha mora na Variable, então esses alphas precisam existir como token):

- `border-50` — divisor sutil do CardHeader e da paginação (`border-b border-border/50`);
- `muted-20` — fundo quase-transparente da linha de filtros da tabela (`bg-muted/20`);
- `muted-foreground-60` — ícone de dica (HelpCircle `aria-hidden`) no topo do campo do wizard
  (`text-muted-foreground/60`).

Seguem o modo via `{border}`/`{muted}`/`{muted-foreground}` e espelham os irmãos `*-10`
(`success-10`, `warning-10`). Não-gateados (separador/superfície/ícone decorativos e sutis, como os `*-10`).
