# app/ — instruções de domínio (herda o [AGENTS.md](../AGENTS.md) raiz)

TalentAI — o **consumidor de referência** do CRP DS: mockup navegável (recrutador :5173,
candidato :5172, docs/galeria :5174). Pacote PRÓPRIO (não confundir cwd com a raiz).
Mapa completo de telas/decisões: [HANDOFF.md](HANDOFF.md).

## Arquitetura (onde cada coisa mora)

- `src/components/ui/` — primitivas shadcn (átomos/moléculas), API genérica via CVA, sem regra de
  negócio. Variante recorrente pertence ao CVA, não a `className` repetido em página.
- `src/components/composicoes/` — organismos/templates COM contexto do produto.
- `src/pages/` — telas; componente usado por 1 tela só pode viver ao lado dela; usado por 2+ →
  promover conscientemente para `composicoes/`.
- Entradas Vite: `index.html` (recrutador) · `candidato.html` · `mapa.html` (docs). Rotas do
  candidato/docs no preview vêm de `ROTAS_*` em `vite.config.ts` — mexeu em rota, mexa lá.
- i18n: 4 línguas (regra 10) — pt-BR fonte, en/es paridade total, pt-AO por override.

## Decisões deliberadas (NÃO "otimizar")

- `forceMount` nas tabs = a11y/preservação de estado.
- Transições suaves (eased + fade) em toda troca de estado — nunca pop de render condicional.
- Fotos fake externas (randomuser) + fallback de iniciais.
- Tipografia: base 16px, mínima 14px (12px raríssimo e documentado).
- Escala de controles 24/32/40/44 — vigiada pelo e2e `control-heights.spec.ts`.
- Sem stroke/borda dura; texto colorido usa tokens `*-text` (AA por tema), nunca o fill.

## Validação (Definition of Done local)

- Sempre: `npx tsc --noEmit && npm run lint && npm test` (aqui em `app/`).
- Tocou UI: `npm run e2e` (axe real + contraste por pixel + foco + alturas, nos 4 temas).
  Grep no Windows: `node node_modules/playwright/cli.js test --grep "..."` (NUNCA `|` via npm run).
- Matriz completa: `npm run verify`. Dados mock: `npm run check:mock` (raiz).
