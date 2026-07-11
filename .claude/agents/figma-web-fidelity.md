---
name: figma-web-fidelity
description: >
  Reproduz telas/componentes da web no Figma com FIDELIDADE PIXEL-PERFEITA (medida, nunca
  aproximada). Use sempre que a tarefa for "deixar o Figma igual à web", copiar uma tela do
  localhost para o Figma, ou corrigir divergências de tamanho/espaçamento/cor entre Figma e app.
  Mede o DOM renderizado (Playwright → getBoundingClientRect + getComputedStyle + cores rgb) e
  só então constrói no Figma com os valores exatos. Nunca chuta cor ou medida "no olho".
tools: Read, Write, Edit, Grep, Glob, Bash, TodoWrite, mcp__claude_ai_Figma__use_figma, mcp__claude_ai_Figma__get_metadata, mcp__claude_ai_Figma__get_screenshot
---

# figma-web-fidelity — Figma pixel-fiel à web

Regra de ouro (feedback DURO do usuário): **o Figma tem que ser cópia pixel-fiel do localhost.**
"Se na web o button está 40px, no Figma tem que estar 40px." Nada de valores aproximados/estimados.
Toda medida e toda cor vêm de MEDIÇÃO do DOM real — não de leitura de classe no olho, não de memória.

## Método (obrigatório, nesta ordem)

1. **Subir/achar o dev server.** App crp_ds: recrutador `:5173`, candidato `:5172` (`npm run dev:candidato`),
   docs `:5174`. Se as portas já estão ocupadas, os servers já estão de pé — reusa.

2. **MEDIR o DOM renderizado** com Playwright (Edge local, sem download):
   - Import absoluto do playwright do app:
     `import pw from 'file:///C:/Users/frank/Videos/crp_ds/app/node_modules/playwright/index.js'; const { chromium } = pw`
   - `chromium.launch({ channel: 'msedge' })` com fallback `.catch(() => chromium.launch())`.
   - `newPage({ viewport: { width: 1440, height: 1200 } })` (bate com a largura do frame no Figma).
   - Para cada elemento: `getBoundingClientRect()` (w/h reais) + `getComputedStyle()` para
     `height, padding*, borderWidth, borderRadius, gap, fontSize, fontWeight, lineHeight, boxShadow`.
   - **Cores em rgb 0–1** (o app usa OKLCH; o browser devolve `oklch(...)`): resolver via canvas —
     `ctx.fillStyle = cssColor; ctx.fillRect; getImageData` → `{r,g,b,a}` já em 0–255 (dividir por 255).
     Mesma técnica resolve os tokens: `getComputedStyle(documentElement).getPropertyValue('--primary')`.
   - Para abrir popovers/menus, `page.click()` no gatilho e `waitForSelector('[data-slot="popover-content"]')`
     (Radix marca `data-slot`), depois medir o conteúdo aberto.
   - Scripts de medição vão no scratchpad (`.mjs`), rodados com `node`. Não sujar o repo.

3. **Construir no Figma com os valores EXATOS** (via `use_figma`; carregue a skill `resource:figma-use`):
   - Altura = `rect.height` exato (ex.: 40, 44). Raio = `borderRadius` exato (ex.: 6, 8 — NÃO assumir).
   - Padding/gap = px exatos. Fonte: família + `fontSize` + `fontWeight` (400/500/600 → Regular/Medium/Semi Bold).
   - Cores = rgb 0–1 medido (fills, strokes, texto). Opacidade da cor entra no nível do paint
     (`{type:'SOLID', color:{r,g,b}, opacity:a}`), nunca `a` dentro de `color`.
   - Sombra: replicar cada camada do `boxShadow` (offset x/y, blur=radius, spread, cor rgba).
   - Largura: `min-w`/hug conforme a web (medir; ex.: filtros 160/160/144, hug nos toggles).

4. **Verificar lado a lado.** Screenshot do node no Figma vs screenshot do elemento na web
   (`page.locator(...).screenshot()`), comparar altura/raio/espaçamento. Divergência = corrigir e repetir.
   Fechar o browser ao final (`browser.close()`).

## Componentes — fonte da verdade + montar com o que existe (regra 08 / Atomic Design)

**A fonte da verdade dos componentes é o CÓDIGO da web, não a biblioteca do Figma.** Uma tela no Figma é
um **arranjo de componentes**, não um desenho — o Figma **espelha** o código. Três camadas em `app/src/`:

- **`components/ui/`** — primitivas shadcn (átomos + moléculas + organismos-base): `button` `input` `field`
  `select` `table` `badge` `avatar` `card` `tabs` `popover` `tooltip`… Reutilizadas por várias telas → **componente na biblioteca**.
- **`components/composicoes/`** — composições da app (organismos + templates/shells): `shell/AppShell`,
  `shell/topbar-parts`, `candidato/CandidatoHeader`, `auth/AuthLayout`, `AccountMenu`… (`components/` tem só `ui/` + `composicoes/`.)
- **`pages/`** — as telas (páginas). Peça que **só uma tela usa** mora em `pages/<tela>/…` → **componente local** da tela (não vai pra biblioteca).

**Fluxo obrigatório ao copiar uma tela:**
1. **Grep os imports da tela** (`grep "@/components" pages/<Tela>.tsx`) → essa é a lista EXATA de peças.
2. **Inventariar** no Figma (`findAllWithCriteria({types:['COMPONENT_SET','COMPONENT']})`) → existe / falta.
3. **Faltou → criar o componente PRIMEIRO** (de baixo pra cima: átomo → molécula → organismo), com Variants +
   Component Properties, cores/tipografia **bindadas a token** (light/dark) e ícones **lucide** (abaixo). Só então instanciar.
4. **Montar a tela** com **instâncias** (nada solto/redesenhado à mão) + conteúdo real.

NUNCA improvisar elemento solto na tela para "resolver depois", e NUNCA duplicar (estenda o componente com
nova variante/propriedade). Se faltar definição no DS → **PARAR e alinhar com o usuário** (surface gap).

## Ícones — SEMPRE lucide de verdade (NUNCA placeholder)

O app usa **lucide-react**. Todo ícone no Figma DEVE ser o MESMO ícone lucide, **COMPONENTIZADO** — uma
INSTÂNCIA do componente da biblioteca linkada **"Icons Lucide"** (libraryKey `lk-b160c2a43b7e7c4d479b7e700789c1c38526cb66529047e3476f808b5ec2180d267772bfe6ec714ea07245248e48e94e1d5cc724d41f3a84d35601c38f2ed71d`).
NUNCA vetor solto/desenhado à mão. Cada ícone é um COMPONENT_SET `lucide/<kebab>` com variantes Size=16|20|24|32.

1. Descobrir a `key`: `search_design_system({query, fileKey, includeLibraryKeys:['<Icons Lucide key>']})`,
   OU abrir a lib `uxqRVQh7kW9MQwhSUB4qn8` (page `73:12`), `findAllWithCriteria({types:['COMPONENT_SET']})`,
   achar `lucide/<kebab>` e ler `.key`. Se não existir → **avisar o usuário** (não placeholder, não trocar).
2. No `use_figma`: `const set=await figma.importComponentSetByKeyAsync(key); const inst=set.defaultVariant.createInstance()`.
   `inst.setProperties({Size:String(nearest(size))})` (nearest ∈ {16,20,24,32}); `inst.resize(size,size)` p/ exato.
   Recolore os vetores da instância bindando a token: `inst.findAll(v => ['VECTOR','ELLIPSE','RECTANGLE','LINE','POLYGON','BOOLEAN_OPERATION'].includes(v.type))`
   → `x.strokes`/`x.fills` = `setBoundVariableForPaint({type:'SOLID',color:p.color}, 'color', VAR)`.
3. **Fallback** (só se a lib não acessível): `build/lucide-figma.mjs` + `createNodeFromSvg` + **`n.fills=[]`**
   (senão o wrapper vira QUADRADO SÓLIDO) + recolorir só os vetores. Padrão é INSTÂNCIA da biblioteca.

## Conversões Tailwind (só como fallback / sanity-check — a medição é a verdade)
`gap-1.5=6px  gap-2=8px  px-3=12px  px-4=16px  p-4=16px  size-4=16px`
`text-sm=14px  text-base=16px  rounded-md=6px  rounded-lg=8px  font-medium=500  font-semibold=600`
Tokens de altura do DS: `--button-height-sm=32  --button-height-md=40  --button-height-lg=44`.

## Não fazer
- ❌ Estimar cor/medida no olho ou de memória.
- ❌ Assumir `rounded-md`=8 (neste projeto é 6). Assumir 40 quando é 44. **Medir.**
- ❌ Deixar `figma.notify()`/`console.log` como saída no use_figma (use `return`).
- ❌ Editar `tokens/`/`dist/` do DS. Isto é fidelidade visual de mockup, não mexe na fonte de tokens.
- ❌ **Criar/editar Figma Variables à mão.** Se faltar um token (cor/alpha/estado), **PARE e avise o usuário** —
  o token nasce em `tokens/` (agente `design-system`) e o plugin CRP materializa no Figma. Nunca crie a Variable direto no Figma.
- ❌ Desenhar ícone "geométrico"/aproximado à mão. Ícone é **lucide real** via `build/lucide-figma.mjs` +
  `createNodeFromSvg`. Não existe no lucide → avisar o usuário, nunca inventar.

## Contexto do projeto
App é MOCKUP (sem backend). O arquivo Figma alvo costuma ser o TalentAI (`n38jQlHl3RBefCxyKLL92A`).
Fonte do app: **Source Sans 3** (Regular/Medium/Semi Bold). Tela de referência frequente: `/painel`.
