# Plano — Pipeline CODE → FIGMA · plugin novo "CRP DS — Components"
### 2026-06-10 · v2 (decisão: plugin DEDICADO p/ componentes + telas, separado do plugin de tokens)

> **Norte:** code-first. O código é a fonte da verdade; o Figma é o espelho para visualizar,
> aprovar e desenhar. Divisão de trabalho entre os plugins (padrão já estabelecido no repo):
>
> | Plugin | Responsabilidade | Estado |
> |---|---|---|
> | `figma-plugin/` (CRP DS — Tokens) | Variables (4 modes, scopes, codeSyntax) + Styles ligados | ✅ pronto |
> | `figma-plugin-icons/` | Components de ícones (Lucide/Material) | ✅ pronto |
> | **`figma-plugin-components/` (NOVO)** | **ComponentSets (Button, TextField…) BINDADOS nas Variables/Styles existentes + montagem de telas com as instâncias** | ❌ este plano |

---

## Arquitetura do plugin novo

### Princípio nº 1: ele NÃO cria tokens — ele PROCURA e BINDA
Ao abrir, o plugin resolve as dependências que o plugin de tokens já criou no arquivo:
`figma.variables.getLocalVariablesAsync()` + collections (`CRP/Primitives`, `CRP/Brand`,
`CRP/Modes`, `CRP/Base`…) e `getLocalTextStylesAsync()` — indexados POR NOME (mesma convenção do
export). **Se faltar dependência** (variable/style que o spec referencia), o plugin lista o que
falta e instrui: "rode o plugin CRP DS — Tokens primeiro". Nada de fallback silencioso — é o
`validateBundle` desta camada.

### Estrutura (espelha os plugins existentes)
```
figma-plugin-components/
  manifest.json        # id próprio, dynamic-page, networkAccess none
  code.js              # lógica: deps → criação/update → telas (funções puras extraídas p/ teste)
  ui.html              # 2 abas: "Componentes" | "Telas" (createElement/textContent, padrão do repo)
  pure.test.mjs        # specs→plano de variantes, resolução de binds, drift — sem Figma (fakes)
build/export-components.mjs  # código → figma-components.json (spec)
build/export-screens.mjs     # código → figma-screens.json (page-spec)
```

### Aba 1 — Componentes
1. Lê `figma-components.json` (gerado do código — ver "Specs" abaixo).
2. Para cada componente: cria/ATUALIZA (idempotente, registry por nome — mesmo padrão do plugin de
   ícones) um **ComponentSet** com eixos de variante (`style × intent × size × state`).
3. Cada node: auto-layout (padding/gap/radius **bindados** via `setBoundVariable` nas Variables
   dimensionais), fills/strokes **bindados** (`setBoundVariableForPaint`) nas Variables de cor,
   texto com **Text Style** existente aplicado (`Label/Base` etc.).
4. Estados compostos (hover/active usam color-mix no CSS, que não existe no Figma): cor RESOLVIDA
   (mesma matemática do check.mjs, que já valida AA) com nota no description do node — marcadas no
   spec como `"snapshot": true` p/ o verify saber que ali não há bind.
5. Chunking + progresso + cancelamento (infra já provada nos outros 2 plugins). Prune opt-in com
   preview, só no namespace do plugin (`CRP Components/`).

### Aba 2 — Telas (passo final)
1. Lê `figma-screens.json`: árvore de auto-layout frames + **instâncias dos ComponentSets da aba 1**
   (por nome + propriedades de variante) + textos/conteúdo.
2. Cria 1 página "CRP Screens" com cada tela × 4 combinações (CRP/MarcaB × Light/Dark — trocando o
   MODO das Variables no frame, não duplicando estilos).
3. Pré-condição dura: os ComponentSets da aba 1 existem (senão lista o que falta).
4. Resultado: telas EDITÁVEIS, feitas dos mesmos componentes ligados aos mesmos tokens — paridade
   com o app por construção.

## Specs (lado repo — a fonte continua sendo o código)

### `export-components.mjs` → `figma-components.json`
Lê tier 3 (`tokens/components/*.json`) + a anatomia dos componentes auditados (`src/components/
button.css`…) e emite por componente: eixos de variante, anatomia auto-layout, e o **mapa
propriedade→token** (sempre por REFERÊNCIA — `{button.radius}`, `{primary}` — quem resolve é o
Figma). Estados compostos: já resolvidos pelo build (lib/css color-mix) com `snapshot: true`.

### `export-screens.mjs` → `figma-screens.json`
v1: page-spec autorado dos fluxos mockados (Login, Register, Dashboard) — árvore simples:
`frame(autolayout col, gap {space.6}) > instance(Button, {style: solid, intent: primary, size:
md}, text: "Entrar")`. v2 (depois): gerador assistido — Playwright extrai a árvore/medidas do DOM
renderizado e produz o rascunho do spec, mapeando valor→token via dist/tokens.css.

### Verificação (gate, como tudo no repo)
`verify-figma` ganha módulo de componentes: cada variante do spec existe? Os binds apontam p/ as
Variables/Styles certos (por nome)? Snapshots de cor batem com a matemática do check (tolerância
sRGB)? Roda contra o mesmo arquivo após o import.

## Fases e esforço

| Fase | Entrega | Esforço |
|---|---|---|
| **0** | Pré-requisitos: mergear PR #2 · re-importar tokens (6 chart-* mudaram) · **tier 3 do Button ligado aos temas** (as Variables `--button-*` que o plugin vai bindar) | 1 dia |
| **1** | `export-components.mjs` + spec do **Button** (piloto: 5 estilos × 6 intents × 4 sizes; eixo `state` opcional via flag p/ não explodir 720 variantes na 1ª rodada) | 1–2 dias |
| **2** | Plugin novo, aba Componentes: deps→lookup→ComponentSet do Button bindado + `pure.test.mjs` | 2–3 dias |
| **3** | **TextField**: nasce do DS auditado (`src/components/field.css` — ainda não existe; criar na receita do button: estados focus/invalid/disabled validados no check) + `field.json` tier 3 + entrada no spec | 2 dias |
| **4** | verify de componentes no gate | 0,5 dia |
| **5** | Aba Telas + `export-screens.mjs` (Login como piloto, 4 temas) | 1–2 dias |
| **6** | Demais telas/fluxos + v2 do gerador de spec (assistido por DOM) | contínuo |

**Total até "Button + TextField no Figma, bindados, com tela de Login montada": ~7–9 dias úteis.**

## Recorte de variantes do Button (DECIDIDO)

O spec declara **combinações VÁLIDAS**, nunca o produto cartesiano dos eixos. Recorte padrão:

| Estilo | Intents | Tamanhos | Estados |
|---|---|---|---|
| solid / outline / soft / ghost | 6 (primary…info) | sm / md / lg | default (+ `disabled` como PROPRIEDADE booleana, não eixo) |
| **link** | **só 1 (cor `--link`)** | sm / md / lg | **nenhum** — decisão de design: link não tem outras intents nem estados no kit |

= 4×6×3 + 3 = **75 variantes** + propriedade `disabled`. `xs` e os estados interativos
(hover/active/focus/loading) existem no código e ficam atrás de flag do export — só entram se um
dia houver protótipo clicável; mockup estático não posiciona botão em hover.
(Nota: o CSS tecnicamente compõe `.link` com qualquer intent — o spec é quem fixa o recorte de
design; se quiser, o check pode ganhar um aviso de "combinação fora do kit" usada no app.)

## Riscos anotados antes de doer

- **Explosão de variantes**: contida pelo recorte acima (75, não 720). O chunking/progresso da
  infra existente cobre o caso da flag de estados completos ligada.
- **color-mix → snapshot**: documentado por node; mudar o token base exige re-rodar a aba 1 (o
  verify acusa drift, como hoje acusa nos Styles).
- **Nomes são o contrato** entre os 2 plugins (Variables/Styles por nome): renomear token =
  re-rodar os dois na ordem (tokens → components). O plugin valida e lista ausências, nunca chuta.
- **Page-spec (telas v1) é manual**: aceitável p/ 2–3 telas; o gerador assistido (fase 6) existe
  p/ não virar "segundo JSX" mantido à mão.
- **Instâncias e overrides**: re-rodar a aba Telas recria frames — quem editou em cima perde
  override. Mitigação: páginas geradas têm sufixo de data; designer trabalha em cópia.
