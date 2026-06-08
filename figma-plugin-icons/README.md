# CRP DS — Ícones → Components (plugin Figma)

Sobe bibliotecas de ícones para o Figma **como Components**: cada ícone vira um **ComponentSet** com a
propriedade **`Size` = 16 / 20 / 24 / 32**, então a **busca** no painel **Assets** / no swap de instância é
por **nome do ícone**. Suporta **2 fontes** (escolhidas na UI):

| Fonte | Tipo | Prefixo / página | Estilos / eixos | Espessura |
|---|---|---|---|---|
| **Lucide** | traço (stroke) | `lucide/<nome>` · página *Lucide Icons* | — | ajustável (`border-width/*`) |
| **Google Material Symbols** | preenchido (fill) | `material-<estilo>[-fill]/<nome>` · página *Material \<Estilo\>[ Fill]* | **Outlined · Rounded · Sharp** + toggle **Preenchido** (fill) | — (sem traço) |

> **Eixos do Material:** trazemos **Estilo** (outlined/rounded/sharp) e **Fill** (outline/preenchido) — ambos
> existem como SVG no pacote. **Weight, Grade e Optical Size** ficam de fora (são eixos da *fonte variável*,
> não há SVG estático; só dariam via render da fonte — projeto à parte).

> Plugin **separado** do `figma-plugin/` (Tokens → Variables). Um não interfere no outro.

> **Sobre os 3 estilos do Material (peso 400):** **Rounded** é sempre distinto (cantos arredondados). Já
> **Outlined e Sharp são idênticos em ~47% dos ícones** — o Google só diferencia o Sharp onde há canto a
> "quadrar" (ex.: `folder` difere nos 3; `square`/`home`/`settings` têm Outlined = Sharp). Não é bug: o export
> carrega fielmente a arte do pacote `@material-symbols/svg-400`.

## Como rodar

1. **Gerar e embutir os ícones** (uma vez, ou ao atualizar as libs):
   ```bash
   npm run icons    # export (lucide-static + @material-symbols) + embed → code.bundled.js
   ```
   Isso **embute** os ícones no próprio plugin (comprimidos, ~4,7 MB) — você **não carrega arquivo** no Figma.
2. **Importar o plugin no Figma:** menu → Plugins → Development → *Import plugin from manifest…* →
   selecione `figma-plugin-icons/manifest.json` (aponta p/ o `code.bundled.js` gerado).
3. **Rodar:** abra o plugin →
   - **1 · Conjunto:** escolha a **Fonte** (Lucide / Google Material) e, p/ Material, o **Estilo**
     (Outlined/Rounded/Sharp) e o toggle **Preenchido** (outline/fill) — **já vem embutido**, carrega na hora.
     (O *file picker* abaixo é só **fallback**.)
   - **2 · Opções:** **Tamanhos** (16/20/24/32), **Espessura** (só Lucide), **Cor** (Variable) e **Filtro**.
   - **Preview:** mostra os ícones filtrados antes de gerar.
   - **3 · Gerar:** **Testar (30)** para validar com poucos, ou **Gerar** para o lote inteiro.

Cada fonte/estilo/fill vai p/ sua **própria página** (sem colidir): Lucide em *Lucide Icons* (`lucide/<nome>`),
Material em *Material Outlined/Rounded/Sharp* (+ *Fill*) com prefixo `material-<estilo>[-fill]/`. Busque no **Assets**.

> **Ícones embutidos:** o build comprime os 7 conjuntos (Lucide + 3 estilos Material × outline/fill, 14,8 MB → ~4,7 MB gzip)
> e injeta em `code.bundled.js`; a UI **descompacta sob demanda** (`DecompressionStream`). Por isso o Figma já
> abre com tudo, **sem carregar JSON**. Se a descompressão falhar (navegador antigo), cai no *file picker*.
> Atualizou a versão de uma lib? Rode `npm run icons` de novo e recarregue o plugin.

## Opções da UI

- **Cor (dropdown):** lista as Variables de cor do arquivo (default `primary-foreground`); stroke+fill ficam
  **ligados** a ela. Opção **“cor editável (sem bind)”** = cor fixa.
- **Tamanho + espessura em Variables (primitivos existentes, SEM collection nova):** o plugin **reusa os
  primitivos de `CRP/Primitives`** casando por **valor** — **`width/height` → `icon/*`** (icon/sm=16,
  icon/md=20, icon/lg=24, icon/xl=32) e **`strokeWeight` → `border-width/*`** (a UI escolhe 1 / 1.5 / 2 / 3 / 4
  por tamanho; default óptico 16/20→**1.5px**, 24→2px, 32→**3px**). Vetores com constraint `SCALE`. Edita central nos
  primitivos e os ícones seguem. Se os primitivos não existirem (o plugin de Variables ainda não rodou), não
  liga e a UI avisa. **`border-width/1-5` (1.5px)** e **`border-width/3` (3px)** foram adicionados em
  `tokens/core/border.json` p/ os meios-termos ópticos — rode o plugin de Variables (CRP) de novo p/ tê-los no arquivo.
- **Prever (dry-run):** o botão **Prever** mostra, sem mexer no canvas, quantos seriam **novos / atualizados /
  órfãos** (útil antes de Sincronizar).
- **Persistência:** o bundle carregado (**sem as tags**, p/ caber na cota ~1MB) e as opções (tamanhos,
  espessura, cor, modo) ficam no `clientStorage` — reabrir o plugin já vem pronto, sem re-carregar o JSON.
  Busca por **tag** só volta ao recarregar o arquivo. (Se ainda exceder a cota, degrada e avisa.)
- **Preview:** grid dos ícones filtrados (primeiros 120) dentro do plugin.
- **Ocultar aliases / Só essenciais (só Lucide):** o bundle Lucide marca os **249 aliases** (nomes alternativos
  p/ a mesma arte), ocultos por padrão; **Só essenciais** filtra ~190 ícones comuns de UI. No Material esses
  controles somem (não há aliases, e os nomes diferem dos do Lucide).
- **Ao gerar — modo:**
  - **Pular existentes (retomar):** não recria o que já existe (padrão).
  - **Sincronizar:** **sobrescreve** os ícones selecionados (atualiza a arte) e **remove órfãos** —
    ComponentSets `lucide/*` cujo ícone não existe mais na lib. Use ao subir uma versão nova do Lucide.

## Scripts

| Comando | |
|---|---|
| `npm run export:lucide` | regenera `lucide-icons.json` (com flags de alias) a partir da devDependency `lucide-static`. |
| `npm run export:material` | regenera `material-{outlined,rounded,sharp}.json` a partir de `@material-symbols/svg-400`. |
| `npm run export:icons` | os dois acima (Lucide + Material). É o passo que o CI roda antes dos testes. |
| `npm run verify:lucide` | regenera o bundle Lucide **e** roda os testes. |
| `npm run verify:material` | regenera os bundles Material **e** roda os testes. |

## O que cada componente é

- **1 ComponentSet por ícone**, nome `lucide/arrow-right`, com 4 variantes **`Size=16/20/24/32`**.
- Cada variante = `createNodeFromSvg` do SVG Lucide **reescalado** (perf: 1 parse + **clone** por tamanho).
- **Tamanho e espessura ligados a primitivos de `CRP/Primitives`** (sem collection nova): `width/height`
  → `icon/*` (por valor), `strokeWeight` → `border-width/*`. Mude o primitivo e os ícones seguem.
- **Cor:** stroke **e** fill **ligados à Variable de cor escolhida** (default `primary-foreground`) → os
  ícones **seguem o tema**. O bind cobre os ~9 ícones Lucide que usam `fill` (ex.: `palette`, `images`).
  “Cor editável” na UI = cor fixa sem bind. ⚠ `primary-foreground` é clara (texto sobre o primary) — num
  board claro pode ficar quase invisível. As variantes em si são **transparentes** (compõem sobre qualquer fundo).

## Escala — leia antes de "Gerar tudo"

1962 ícones × 4 tamanhos = **7.848 components**. É pesado: pode levar **minutos** e gerar um arquivo
grande. Por isso:
- **Teste com 30** primeiro (botão dedicado).
- **Filtre** o que precisa (ex.: `arrow`, `chevron`, `user`) em vez de subir tudo.
- **Pular existentes** (ligado por padrão): re-rodar **retoma** sem duplicar.
- **Cancelar** interrompe a qualquer momento (o que já foi criado permanece).

## Limitações conhecidas

- **Undo:** por gerar em lotes com `await` (pra UI não travar), o Figma cria **vários passos de undo** —
  Cmd+Z não desfaz tudo de uma vez. Para reverter, **apague o frame/página** gerado (1 ação).

## Arquivos

| Arquivo | |
|---|---|
| `manifest.json` | manifesto do plugin (sem rede, sem codegen). |
| `code.js` | lógica: cria os ComponentSets `lucide/<nome>`, cor ligada, grid, progresso, cancelar, retomar. |
| `ui.html` | UI: carregar bundle, tamanhos, filtro, ações, progresso. |
| `lucide-icons.json` | **artefato** gerado por `npm run export:lucide` — não editar à mão. |
| `bundle.test.mjs` · `run.test.mjs` | testes de integridade do bundle e de lógica do plugin (`npm test`). |

## Fonte da verdade

Os ícones vêm da devDependency **`lucide-static`** (lido direto de `node_modules/`, sem cópia no repo).
Para atualizar a versão: `npm i -D lucide-static@latest && npm run export:lucide`.
O `lucide-icons.json` é **gerado** — nunca editar manualmente.
