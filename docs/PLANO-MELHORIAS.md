# Plano de Melhorias — CRP Design System
### 2026-06-10 · pós-auditorias rev. 1–5 · orientado a repo-VITRINE (não publicação)

> Estado de partida: zero bugs conhecidos em 6 dimensões auditadas; gates fatais (contraste texto,
> estados compostos, série gráfica, mutação provada); axe permanente no teste; ESLint jsx-a11y;
> Dependabot; doctor anti-corrupção. Este plano é evolução, não conserto.

## Fase 0 — Operacional (hoje, ~30 min)

| # | Item | Por quê | Pronto quando |
|---|---|---|---|
| 0.1 | Commitar o trabalho pendente no working tree (fixes rev. 4/5 + gates novos) e `cd app && npm install` | Nada disso está versionado ainda | CI verde nos 2 jobs |
| 0.2 | Regenerar `export:ts` + rodar o plugin nas 4 themes | `chart-3/4/6/8/9/11` mudaram de cor no light — o Figma está defasado | Variables batem com o dist (`verify:figma`) |
| 0.3 | Decidir a pasta do repo (mover p/ `C:\dev\crp_ds` ou confirmar que `Videos` não tem sync) | Encerra de vez o tema da visão truncada; o doctor vigia, mas causa conhecida > sintoma vigiado | 1 semana sem o doctor acusar nada |

## Fase 1 — Produto visual (1–2 semanas; é o coração da vitrine)

**1.1 Implementar o plano das telas Login/Cadastro** *(maior valor pendente — já está desenhado e
aprovado)*: `AuthLayout` compartilhado, faixa de marca no tablet (banner < lg), requisitos de senha
em `FormDescription` sr-only, checkbox de Termos com Zod, fix do heading do aside. Esforço: 1–2
dias. DoD: axe 0 nas 2 telas × 4 temas × 3 breakpoints; 23+ testes verdes; prints no README.

**1.2 Showcase → catálogo navegável (Storybook "de pobre", de propósito):** índice com âncoras por
componente; cada seção mostrando estados (hover/focus/disabled/loading) lado a lado e o NOME dos
tokens usados (ex.: chip "usa `--primary` / `--state-soft`"). Transforma a vitrine em documentação
viva sem adotar Storybook. Esforço: 2–3 dias incrementais.

**1.3 Screenshots automatizados no CI:** `shot.mjs` já existe — um step no job do app gerando
Login/Dashboard/Showcase × CRP/MarcaB × light/dark e publicando como artifact do PR. Quem revisa
VÊ a mudança visual sem rodar nada. Esforço: meio dia (navegador via `playwright-core` +
`channel: chrome` já é o padrão do script; no CI usar o chromium da action).

## Fase 2 — Fluxo de design (1 dia, na próxima sessão de Figma)

**2.1 Exercitar o ciclo Token Studio ponta a ponta** (nunca foi validado de verdade): Load from
JSON → editar 1 token → sync GitHub → PR → CI → plugin re-importa. Registrar o passo a passo com
prints em `docs/`. É a premissa central do projeto — 1 hora de validação manual compra muita
confiança.

**2.2 Arquivo Figma-vitrine:** rodar o plugin nas 4 themes num arquivo demo organizado (Cover,
página de Variables, página de Styles, exemplos aplicados). Vira o "lado design" do Showcase.

## Fase 3 — Robustez incremental (quando houver folga; nada é urgente)

**3.1 Playwright mínimo (a única dimensão ainda não coberta):** 1 spec — login → dashboard → troca
de tema — com axe REAL (contraste renderizado, que o jsdom não vê) em light/dark. Não é suite E2E;
é fechar a última lacuna de verificação. Esforço: meio dia.

**3.2 Testes formais de `build/lib/`** (`css.mjs`, `color.mjs`, `themes.mjs`, `doctor.mjs`): hoje
são provados por uso (gate verde) — testes unitários node:test documentam o contrato e protegem
refactors. Esforço: 1 dia.

**3.3 Política Dependabot:** PRs semanais vão chegar — combinar a rotina (CI verde = merge de
patch/minor; major espera). Lembrete já anotado no yml: ao migrar p/ Style Dictionary 5 +
sd-transforms 2.x, remover o override de `expr-eval-fork`.

## Fase 4 — Só se o repo mudar de natureza (registro, sem prazo)

- **Publicação real** (escopo `@owner`, remover `private`, 1.0.0 via changesets — pipeline pronto,
  falta só decisão) + `CONTRIBUTING.md`.
- **Storybook de verdade**, se mais gente for consumir os componentes.
- **components/button.json (tier 3):** decidir se ganha cor/estados ou permanece dimensional —
  pendência conceitual documentada desde a rev. 1.
- **Modo AAA opcional** (`prefers-contrast` já existe; um tema "high-contrast" completo seria o
  passo seguinte).

## O que este plano deliberadamente NÃO inclui

Prettier (diff gigante sem valor aqui), suite E2E extensa, monorepo/turborepo, CSS-in-JS, troca de
ferramentas que funcionam. O repo é vitrine: cada item acima ou melhora o que se VÊ, ou protege o
que já foi conquistado com custo mínimo.

## Ordem sugerida

`0.1 → 0.2 → 1.1 → 1.3 → 1.2 → 2.1 → 2.2 → 3.x conforme folga` (0.3 corre em paralelo desde já).
