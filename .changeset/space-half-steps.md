---
"@crp/design-tokens": minor
---

Meios-passos na escala `space` (`space.0.5`/`1.5`/`2.5`/`3.5` = 2/6/10/14px) — os passos fracionários
do Tailwind (`gap-1.5`, `gap-2.5`, `p-3.5`…) que a web já usa mas a escala primitiva só tinha em
índices inteiros. Destrava a tokenização completa de gap/padding no Figma (antes esses valores ficavam
crus por falta de Variable equivalente). Fiel à web: são os mesmos valores que `calc(--spacing × n)` gera.
