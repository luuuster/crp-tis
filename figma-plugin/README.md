# CRP DS — Tokens → Figma Variables (plugin de dev)

Plugin Figma que lê o bundle de tokens (`token-studio/tokens.json`) e **cria as Variables**
direto no arquivo aberto — sem Token Studio, sem plano Enterprise. Roda no plano **pro**.

> Por que um plugin? A REST API de escrita de Variables do Figma é **Enterprise-only**, e o
> conjunto MCP só *lê* Variables. A **Plugin API**, porém, escreve Variables em qualquer plano.

## Estrutura criada (Dois eixos: Brand × Mode)

| Collection | Modes | Conteúdo |
|---|---|---|
| `CRP/Primitives` | `Value` | `core/*`: 432 primitivos (cor, dimensão, tipografia) |
| `CRP/Base` | `Value` | `semantic/base`: `radius`, `chart-1..5` (alias dos primitivos) |
| `CRP/Brand` | `CRP`, `MarcaB` | `brand/*`: `primary`, `ring`, `sidebar-*` (alias dos primitivos) |
| `CRP/Mode` | `Light`, `Dark` | `mode/*`: `background`, `card`, `border`… (alias dos primitivos) |

O contrato é todo **alias**: o designer troca o mode (`Brand=CRP`+`Mode=Dark`, etc.) e as
Variables re-apontam sozinhas. Nomes usam `/` para virar grupos no painel do Figma
(ex.: `color/blue/600`, `font/size/base`).

## Como usar

1. Gere o bundle no repo:
   ```bash
   npm run export:ts        # → token-studio/tokens.json
   ```
2. No Figma desktop, abra o arquivo onde quer as Variables. Use um arquivo do time
   **CRP Tecnologia (pro)** — times *Starter* limitam a 1 mode por collection e o passo
   `Brand`/`Mode` (2 modes) vai falhar.
3. **Menu → Plugins → Development → Import plugin from manifest…** → selecione
   `figma-plugin/manifest.json` (só na 1ª vez).
4. Rode o plugin (**Plugins → Development → CRP DS — Tokens → Variables**).
5. Escolha o `token-studio/tokens.json` → **Criar Variables no Figma**.
6. Confira no painel **Variables**: 4 collections; em `CRP/Mode` alterne `Light`/`Dark`.

Rodar de novo é **idempotente**: reusa as collections/modes e atualiza as Variables
existentes pelo nome (não duplica).

## Conversões (Figma é sRGB e só guarda escalares)

- **Cor** → usa o hex sRGB de `$description` (exato); fallback OKLCH→sRGB se faltar.
- **Dimensão** (`rem`/`em` → px ×16, `px`/unitless direto, `calc()` avaliado) → `FLOAT`.
- **fontWeight** → `FLOAT`; **fontFamily** → `STRING`.
- Compostos (tipografia/sombra) **não** viram Variable no Figma — só escalares. Não há
  shadow/typography composto nos tokens atuais, então nada é perdido silenciosamente.

## Limitações honestas

- O clique de "Import plugin" e "Run" é **manual** no Figma (nenhuma ferramenta externa
  escreve Variables fora do Enterprise) — o plugin faz todo o resto em 1 clique.
- 4 modes combinados não são usados aqui (eixos separados ⇒ no máx. 2 modes/collection),
  então cabe folgado no plano pro.
- OKLCH é exibido como aproximação sRGB (limitação do Figma, não do plugin).
