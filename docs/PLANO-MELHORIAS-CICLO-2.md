# Plano de Melhorias — Ciclo 2 (USO INTERNO)
### 2026-06-10 · sucede o PLANO-MELHORIAS.md (ciclo 1 entregue no PR #2)

> **Natureza do repo (norte de todas as decisões):** projeto INTERNO da empresa — não é publicado
> em lugar nenhum. Serve como **vitrine/mockup para aprovação** (fluxos, tokens, temas com
> stakeholders) e como **referência viva para o time de front** desenvolver as telas verdadeiras.
> Tudo neste plano melhora um desses dois papéis; o que não melhora, fica fora.

---

## Trilha A — Aprovação (fazer stakeholders verem e decidirem sem rodar nada)

### A1. Vitrine distribuível sem servidor
**O quê:** o CI já builda o app — empacotar `app/dist/` + `preview/` num `vitrine.zip` (artifact de
todo PR e da main) que qualquer pessoa baixa, extrai e abre no navegador. Sem deploy, sem rede,
sem exposição.
**Como:** `vite.config.ts` com `base: './'` (paths relativos p/ abrir via file://) + step de
`upload-artifact`. Se a empresa tiver um servidor interno/intranet, o mesmo zip serve para
hospedar lá — mas o zip já resolve sozinho.
**Esforço:** 2–3 h. **DoD:** baixar o artifact, dar dois cliques no index.html, trocar marca/tema.

### A2. Pacote de aprovação por PR
**O quê:** os 12 screenshots do e2e viram um **`aprovacao.html`** único (grade: telas × 4 temas,
lado a lado, com data e SHA) gerado no CI — o artefato que se manda no chat/e-mail para "aprova?".
**Por quê:** aprovador não baixa zip nem abre PR; ele olha UMA página com tudo.
**Esforço:** meio dia (script que monta o HTML estático com as imagens embutidas em base64).
**DoD:** anexo único auto-contido com as 12 vistas.

### A3. Regressão visual (proteção do que foi aprovado)
**O quê:** `toHaveScreenshot()` do Playwright com baselines versionados — depois que um visual é
APROVADO, qualquer mudança não-intencional fica vermelha no CI.
**Por quê:** no fluxo de aprovação, o baseline é literalmente "o que foi aprovado"; o diff de
pixel vira o guardião da decisão do stakeholder.
**Esforço:** meio dia + rotina de `--update-snapshots` quando a mudança FOR intencional.

## Trilha B — Aprovação de TOKENS / lado design (manual, sessão de Figma)

### B1. Ciclo Token Studio ponta a ponta *(item manual nº 1 — é o fluxo de aprovação de token)*
Load from JSON → designer edita 1 token → sync GitHub → PR (CI valida contraste/contrato
automaticamente!) → aprovação → plugin re-importa. Documentar com prints em
`docs/FLUXO-TOKEN-STUDIO.md`. **Este fluxo é o coração do "aprovar tokens"** — o gate do check
vira o revisor técnico automático da proposta do designer.

### B2. Re-import + arquivo Figma-vitrine
Re-importar (6 `chart-*` mudaram no light) e montar o arquivo demo organizado (Cover, Variables,
Styles, exemplos nas 2 marcas). É a vitrine do lado design — onde se aprova visual antes de
existir tela.

### B3. Code Connect no Dev Mode *(alto valor no seu cenário)*
`integration/react/` já está pronto e nunca foi ligado. Com Code Connect, o designer aprova no
Figma e **o dev da tela verdadeira vê o código React real** de cada componente no Dev Mode — é
exatamente a ponte mockup→produto que você descreveu. Esforço: 2–3 h (exige seat Dev Mode).

## Trilha C — Handoff ao front (o repo como referência p/ as telas REAIS) ★ trilha principal

### C1. Guia de consumo interno: `docs/GUIA-DO-FRONT.md`
**O quê:** o documento que o dev da tela verdadeira abre no dia 1:
- como consumir `@crp/design-tokens` no projeto real **sem publicar** (via `git+ssh://` no
  package.json apontando p/ o repo interno, ou checkout + `file:`; se a empresa permitir,
  GitHub Packages PRIVADO da org — visibilidade restrita não é publicação pública — mas é opcional);
- o contrato: quais vars existem (`--primary`, `--state-*`, `.ty-*`…), o que é proibido (cor na
  mão, `--*` cru quando há classe), como ligar `data-brand`/`.dark`;
- **receitas copy-paste**: formulário com RHF+Zod no padrão do Cadastro, página nova com
  `AuthLayout`, gráfico com `chart-*`, botão com `isLoading`;
- checklist de PR de tela nova (axe 0, tokens só do contrato, foco visível).
**Por quê:** hoje esse conhecimento está espalhado em README + código + sua cabeça. O guia é o
multiplicador do repo. **Esforço:** 1 dia. **DoD:** um dev que nunca viu o repo monta uma tela
no padrão em 1 tarde.

### C2. Mais 1–2 fluxos de tela que o produto real vai precisar
**O quê:** além de auth+dashboard, mockar os próximos fluxos que o time vai construir (ex.: CRUD
com tabela+filtros+modal de confirmação; página de perfil/configurações). Cada fluxo aprovado aqui
é uma tela que o front não precisa decidir do zero.
**Por quê:** é o propósito declarado do repo — visualizar fluxo e aprovar ANTES de codar o real.
**Esforço:** 1–2 dias por fluxo, reusando o catálogo. **Priorizar pelo roadmap do produto real.**

### C3. Segundo componente auditado: Input/Field (`src/components/field.css`)
Mesma receita do button (estados validados no check.mjs, preview próprio). Formulário é o caso
nº 1 das telas reais — entregar o campo "oficial" auditado poupa o front de reinventar foco/erro/
disabled. **Esforço:** 1–2 dias.

### C4. Tier 3 ligado aos temas
`components/button.json` (e o futuro `field.json`) ganham cor/estado e entram nos themes — fecha a
arquitetura de 3 tiers e, no Figma, os componentes ganham suas próprias Variables (aprovação de
token por componente). **Fazer antes do C3 nascer**, p/ o field já vir no padrão. **Esforço:** 1 dia.

## Trilha D — Rotina e proteção

- **D1. Branch protection na main** (5 min): exigir os 3 checks; sem push direto. Num repo de
  aprovação, a main É o aprovado.
- **D2. Política Dependabot**: patch/minor verde = merge; major espera (anotado no yml o caso
  SD5/sd-transforms 2.x → remover override).
- **D3. (Opcional) Issue upstream no axe-core** sobre a conversão OKLCH: com caso mínimo GENÉRICO
  (3 cores, zero contexto da empresa). Só se você quiser contribuir — nada do projeto vaza.

## Trilha E — Validação humana (~2 h, uma vez por marco)

- **E1.** Leitor de tela (NVDA) nas telas de auth e no fluxo novo de C2.
- **E2.** Teclado puro (tab order, foco visível, sem armadilha) nos 4 temas.
- **E3.** Zoom 200%/400% (reflow) — o banner < lg já ajuda; confirmar que nada corta.

---

## Ordem sugerida

| Quando | Itens | Entrega p/ a empresa |
|---|---|---|
| Esta semana | A1 + A2 · D1 | Stakeholder aprova sem rodar nada |
| Próxima sessão de Figma | B1 → B2 (· B3) | Fluxo de aprovação de token funcionando |
| Semana seguinte | C1 (guia) · A3 | Front começa tela real no padrão; aprovado fica protegido |
| Na sequência | C4 → C3 · C2 conforme roadmap | DS cresce junto com o produto |
| Por marco | E1–E3 | Selo humano de a11y |

## Fora do plano (decisão, não esquecimento)

Qualquer publicação/exposição externa (Pages público, npm público, links abertos) — **vetado pela
natureza do projeto**. Prettier, Storybook, monorepo, SSR — manutenção sem ganho aqui. Publicação
em GitHub Packages privado fica como OPÇÃO dentro de C1, só se a política da empresa permitir;
o caminho padrão de consumo é via repo interno (`git+ssh`/`file:`).
