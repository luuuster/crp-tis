# CRP DS — Tokens → Figma Variables + Styles (plugin de dev)

Plugin Figma que lê o bundle **pré-resolvido** (`figma-plugin/figma-variables.json`) e **cria as
Variables e os Styles** direto no arquivo aberto — sem Token Studio, sem plano Enterprise. As
Variables (cor/dimensão/número/família) precisam de **pro** p/ os 2 modes; os **Styles** (texto,
cor, efeito, grid) funcionam em **qualquer plano**.

> Por que um plugin? A REST API de escrita de Variables do Figma é **Enterprise-only**, e o MCP só
> *lê* Variables. A **Plugin API** escreve em qualquer plano.

## Dois JSONs (um para cada destino)

| Arquivo | Gerar com | Para |
|---|---|---|
| `token-studio/tokens.json` | `npm run export:ts` | **Token Studio** (DTCG multi-set, com `$themes`/`$metadata`; entende compostos) |
| `figma-plugin/figma-variables.json` | `npm run export:figma` | **este plugin** (collections já resolvidas; o Figma não entende composto) |

São diferentes de propósito: o Figma precisa do contrato **já fundido por tema** (marca + mode
juntos) e dos compostos **decompostos** — coisas que o exportador do Figma faz e o do Token Studio
não. Rode os dois de uma vez com `npm run export`.

## Estrutura criada (5 collections, **2 eixos**)

| Collection | Modes | Conteúdo |
|---|---|---|
| `CRP/Primitives` | `Value` | paleta `core/*` (cor, dimensão, número, família) — valores crus |
| `CRP/Brand` | `CRP` · `MarcaB` | **âncoras de marca**: cor (`brand-primary`, `brand-ring`, `brand-primary-on-dark`…) **e família tipográfica** (`brand-font-heading/body/mono`) → alias do primitivo de cada marca |
| `CRP/Modes` | `Light` · `Dark` | **cor do contrato** (`background`, `primary`, `ring`, `link`, `*-text`, charts…) — tokens de marca aliasam **`CRP/Brand`**; o resto aliasa **`CRP/Primitives`** |
| `CRP/Base` | `Value` | semânticos **invariáveis por marca** (radius, spacing, opacity, state, layer) + **tipografia escalar** (`text/h1/font-size`, `…/line-height`, `…/weight`) — **sem** `font-family` (essa é de marca, vive em `CRP/Brand`) |
| `CRP/Components` | `Value` | `components/*` (button…) → alias dos primitivos |

**Dois eixos independentes:** `CRP/Primitives` + `CRP/Brand` **alimentam** `CRP/Modes`. Você troca a
**marca** (`CRP`/`MarcaB`) e o **modo** (`Light`/`Dark`) separadamente — não há os 4 combinados.
Ex.: `Modes.primary` = `Light → Brand.brand-primary`, `Dark → Brand.brand-primary-on-dark`; e
`Brand.brand-primary` = `CRP → crp/700`, `MarcaB → marca-b/700`. Então `primary` segue **os dois
eixos** ao mesmo tempo. Isso só funciona porque a fonte é **simétrica** (mode/light e mode/dark
definem o contrato inteiro, referenciando as âncoras de marca) — sem isso, `primary` ficava partido
entre marca e modo e o import quebrava.

Tipografia: cada papel `text/<role>` é **expandido** em escalares bindáveis — `…/font-size`,
`…/line-height`, `…/letter-spacing`, `…/font-weight` (FLOAT). A **família é de marca**: vive em
`CRP/Brand` como STRING (`brand-font-heading/body/mono`) e troca com o eixo `CRP`/`MarcaB`
(CRP=Inter/Source Sans 3, Marca B=Montserrat/Roboto).

Cada Variable recebe ainda **scopes** (cor→fills/stroke, raio→corner-radius…) e **Dev Mode code
syntax** `var(--token)`.

## Styles criados (compostos — o que não cabe em Variable)

O Figma só guarda **escalares** em Variables; tipografia, sombra e grid são **Styles**. O export
resolve cada um pronto e o plugin cria (idempotente, reusa pelo nome):

| Tipo | Origem | O que vira | Detalhe |
|---|---|---|---|
| **Text** | `semantic/typography` `text/*` | **1 conjunto, cada categoria é PASTA** (17): `Display/Base`, `Heading/H1…H6`, `Body/Large·Base·Small`, `Label/…`, `Link/Base`, `Caption/Base`, `Overline/Base`, `Code/Base` | **vinculado às Variables** em TODOS os campos: `fontFamily`→`brand-font-*` (troca por **modo de marca**), `fontWeight`/`fontSize`/`lineHeight`/`letterSpacing`→`CRP/Base`. `lineHeight`/`letterSpacing` são **traduzidos p/ px** no export (razão/em × tamanho). `code` mantém família concreta (mono é de sistema, igual nas 2 marcas) |
| **Effect** | `elevation` (por modo) | `Elevation/Light/xs…xl` + `Elevation/Dark/xs…xl` (10) | sombra CSS **decomposta** em camadas Figma; Style não tem modes → 2 pastas |
| **Paint** | contrato de cor `CRP/Modes` | `Color/<token>` (100) | **ligado à Variable** (`setBoundVariableForPaint`): NÃO duplica cor — segue Brand × Light/Dark vivo; cor crua só como fallback |
| **Grid** | `breakpoint` + `space` | `Grid/Baseline 4/8` + `Columns/sm…2xl` (7) | baseline 4/8px e 12 colunas (gutter/margem 24px) por breakpoint |

**Por que Paint Styles se já há Variables de cor?** Porque ficam **ligados** à Variable, não são
cópia: trocar Brand/Modes propaga ao Style. Servem p/ aplicação rápida e p/ libs que consomem
Styles — sem risco de divergir do build (o `verify:figma` confere os vínculos).

**Escolher a marca nos Text Styles** = **aplicar o modo de marca** (`CRP`/`MarcaB`) no frame/página —
o mesmo eixo da cor. Como a `fontFamily` está **vinculada** à `brand-font-*`, um único `Heading/H1`
renderiza **Inter** num frame CRP e **Montserrat** num frame MarcaB. Editar uma Variable (tamanho,
peso, família…) **propaga** para o Style.

## Como usar

1. Gere o bundle do Figma no repo:
   ```bash
   npm run export:figma     # → figma-plugin/figma-variables.json
   ```
2. No Figma **desktop**, abra o arquivo onde quer as Variables (use um arquivo de time **pro** —
   times *Starter* limitam modes por collection; `CRP/Brand` e `CRP/Modes` têm 2 modes cada).
3. **Menu → Plugins → Development → Import plugin from manifest…** → `figma-plugin/manifest.json`
   (só na 1ª vez).
4. Rode o plugin → escolha `figma-plugin/figma-variables.json` → em **"O que criar"** marque as
   **collections** (Primitives/Brand/Modes/Base/Components) e as **famílias de style** (Text/Paint/
   Effect/Grid) que quer — granular, não tudo-ou-nada. Clique **Pré-visualizar** (mostra o plano:
   `+novos · ~atualizar · −remover`) e depois **Criar**. (O plugin lembra suas escolhas no próximo uso.)
5. No painel **Variables**: 5 collections. Combine os 2 eixos no frame: **CRP/Brand** (`CRP`/`MarcaB`) × **CRP/Modes** (`Light`/`Dark`). Em **Text/Color/Effect/Grid styles**: as 4 famílias de Styles.

### Recursos de escrita segura
- **Pré-visualizar (dry-run)**: calcula o diff **sem escrever** — quantos serão criados/atualizados/
  removidos por collection e família, com a **lista de remoções** por nome. **Avisa dependências
  faltantes**: se você marcar uma camada que aliasa/binda outra não selecionada nem presente no arquivo
  (ex.: só `Modes` sem `Brand`/`Primitives`, ou só Text styles sem `Base`/`Brand`), mostra quais vínculos
  ficariam **vazios** — antes de escrever.
- **Import resiliente**: cada valor de Variable é aplicado de forma isolada — um valor/alias inválido é
  contado e logado (`valores com erro`) e o import **segue** em vez de abortar (igual aos styles).
- **Remover órfãos (prune)** *(opt-in)*: apaga o que é **nosso** e sumiu do bundle (ex.: styles
  renomeados como `Display` → `Display/Base`). Escopo seguro: só Variables dentro das collections
  `CRP/*` e Styles nos **nossos namespaces** (`Display/ Heading/ Body/ … Color/ Elevation/ Grid/ Columns/`)
  ou no registro do que o plugin criou antes. Nunca toca em styles/vars de fora. Sempre revele com
  **Pré-visualizar** primeiro.
- **Aplicar à seleção**: botões **Marca** (CRP/MarcaB) e **Modo** (Light/Dark) aplicam o modo de
  Variable aos frames selecionados — testa a tipografia-por-marca e a cor na hora.
- **Progresso + Cancelar + Copiar log**: imports grandes mostram barra de progresso e podem ser
  cancelados (resultado parcial); o log é copiável.

### Auditoria de sincronia (Figma = fonte da verdade)
Ao carregar o arquivo, um **selo de saúde** mostra na hora se o Figma está **em dia** ou tem
divergências/órfãos. O botão **Auditar** (read-only, não escreve) detalha:
- **divergem** — Variables/Styles **editados à mão** no Figma cujo valor não bate mais com o bundle
  (cor trocada, alias mexido, fontSize alterado);
- **faltando** — itens do bundle ainda não criados; **órfãos** — nossos itens que sumiram do bundle;
- **contraste AA** — recalcula WCAG dos pares fg/bg do contrato (`audit.contrastPairs`, emitido pelo
  export) sobre os valores **atuais** nas **2 marcas × Light/Dark** (4 temas: CRP-Light/Dark e
  MarcaB-Light/Dark). Cada reprova mostra o tema. Só reprova se houve drift (o build já garante AA).

**Sincronizar (corrigir drift em 1 clique):** quando a auditoria acha **divergem/faltando**, aparece o botão
**Sincronizar** — ele **reaplica só esses itens** do bundle (Variables e Styles), sem rodar o **Criar** inteiro,
e **re-audita** no fim (o painel volta a "em dia"). Fecha o loop Auditar → corrigir.

**Guard de versão:** o bundle carrega `"$schema"` (`crp-figma-variables/2`); o plugin **avisa** se for de uma
versão que ele não conhece, em vez de importar errado em silêncio.

### Higiene de publicação
Checkbox **"Ocultar primitivos da publicação"** → marca `CRP/Primitives` como `hiddenFromPublishing`.
A biblioteca publicada expõe só o contrato semântico (Brand/Modes/Base/Components). (Aplicado ao **Criar**,
se Primitives estiver selecionado; vale só p/ assets locais.)

### Gerar no canvas (opcional)
- **Folha de tokens** — paleta do contrato, tipografia (aplicando os Text Styles) e elevação, numa página.
- **Button de exemplo** — um Button ligado aos `components/button` + fill `primary` + `Text/Label/Base`.
Usam os Variables/Styles **já importados** (avisam se faltar).

Rodar de novo é **idempotente** (reusa collections/modes/variáveis **e styles** pelo nome; não duplica).

## Conversões (feitas no export, não no plugin)

- **Cor** → hex sRGB do `$description` (exato); fallback OKLCH→sRGB. Entregue como `{r,g,b,a}`.
- **Dimensão/número/duração** → `FLOAT` (`rem`/`em`→px ×16, `s`→ms, `calc()` avaliado).
- **fontFamily** → `STRING` com o **nome** da 1ª família. **fontWeight** → `FLOAT`.
- Contrato de cor = **alias** do primitivo resolvido por tema (trocar o primitivo propaga).
- **Nome único entre collections** é **invariante do build**: aliases resolvem por **nome puro** (sem
  qualificador de collection), então um nome repetido em duas collections mis-bindaria em silêncio. O
  `verify:figma` **falha** (fatal) se houver duplicado; o plugin ainda avisa defensivamente ao importar.

## Limitações honestas

- "Import plugin" e "Run" são **manuais** no Figma (escrita de Variables fora do Enterprise só via
  plugin) — o plugin faz todo o resto em 1 clique.
- **Text Styles** usam a fonte **instalada no arquivo**: o plugin **pré-carrega** Inter, Source Sans 3,
  Montserrat e Roboto (as famílias das marcas) p/ a família vinculada renderizar em qualquer modo; se
  faltar, casa a mais próxima (e loga). Instale as 4 fontes p/ fidelidade 100%.
- `line-height`/`letter-spacing` são **vinculados em px** (o Figma não vincula razão/%): o export
  **traduz** `razão×tamanho` e `em×tamanho` por papel. É um **snapshot** — mudou um token de tamanho,
  **regenere** (`npm run export:figma`) p/ recomputar. O CSS continua razão/em (escalável).
- Quirk conhecido do Figma: ao trocar a Variable de **família**, o texto às vezes só repinta após
  "Recompute text layout in selection" (ou tocar no texto). Não é erro do plugin.
- **Effect** e **Grid** são Styles de valor único (sem modes) — por isso a elevação tem `Light/` e
  `Dark/` separados, e o grid é derivado de `breakpoint`/`space` (não há token de grid explícito).
- `easing` (cubic-bezier) não tem Style equivalente no Figma — fica só como token/CSS.
- **Prune / Auditoria / Gerar no canvas** rodam dentro do Figma (não dá p/ testar fora dele): por isso
  o prune é **opt-in + escopado + com dry-run**, a auditoria é **read-only**, e a geração só usa o que já
  existe. Tudo guardado (nunca fatal).
- **`documentAccess: dynamic-page`** está **ligado** no manifest (todo caminho de leitura já é async-first;
  só restam fallbacks síncronos guardados que não rodam sob dynamic-page). Future-proof p/ a direção do Figma.
- **Toasts**: ações (importar, sincronizar, aplicar modo, gerar) também avisam via `figma.notify`, além do log.
- **Adiados de propósito** (próxima rodada): **import em 1 undo** (exige carregar fontes antes de escrever —
  só validável no Figma), **yield na main thread** p/ imports grandes, e **aviso ao recriar var por troca de tipo**.
