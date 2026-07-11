# crp_plugins/ — plugins de dev do CRP DS

Todos os plugins do pipeline **code → Figma** (+ a extensão de navegador), um diretório por trabalho.
Cada plugin tem README próprio com o passo a passo; os artefatos `.json` que eles consomem são
**gerados** pelos scripts de `build/` (gitignored — rode o export antes de usar).

| Plugin | Faz | Artefato de entrada | Gerar com |
|---|---|---|---|
| [`figma-plugin/`](figma-plugin/) | **Variables** (4 collections Brand × Mode) + Styles ligados | `figma-plugin/figma-variables.json` | `npm run export:figma` |
| [`figma-plugin-icons/`](figma-plugin-icons/) | biblioteca de **ícones** (Lucide/Material) como Components | bundles embutidos no plugin | `npm run icons` |
| [`figma-plugin-components/`](figma-plugin-components/) | **ComponentSets shadcn** (Button 320, Input 2) bindados nas Variables | `figma-plugin-components/figma-components.json` | `npm run export:components` |
| [`figma-plugin-screens/`](figma-plugin-screens/) | **telas** montadas com instâncias dos componentes | `figma-plugin-screens/figma-screens.json` | `npm run export:screens` |
| [`crp-editor-extension/`](crp-editor-extension/) | extensão Chrome **CRP Inspector** (inspeciona tokens no app) | `crp-editor-extension/tokens.json` | `npm run export:ext` |

Ordem típica no Figma: **Tokens → Ícones → Componentes → Telas** (cada um procura o que o anterior
criou — por NOME, nunca cria tokens por conta própria). Import: Figma → *Import plugin from manifest*
→ `manifest.json` do diretório.

Testes da lógica pura de cada plugin rodam no `npm test` da raiz.
