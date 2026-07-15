---
"@crp/design-tokens": minor
---

16 tokens de tinta do wizard `/vagas/nova` (alpha do Tailwind → Variable), light+dark — paridade
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
