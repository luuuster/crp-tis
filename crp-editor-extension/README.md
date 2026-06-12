# CRP Inspector (extensão Chrome)

Inspeciona **telas reais** (seu app, um staging, ou um preview gerado por IA), mostra **onde os tokens
do CRP estão — ou não — sendo usados**, deixa você **editar em tokens** e gera um **redline** pronto
pro front ou pra uma IA implementar. Sem passar pelo Figma.

> Não é um clone do Figma. É um **inspetor + redline na linguagem do design system**, sobre código real
> (DOM/CSS). O que você ajusta vira instrução em **nomes de token** (`var(--primary)`, `ty-h2`,
> `var(--radius)`), não valores crus.

## O que faz

- **Auditar** — varre a página e dá um **placar de aderência**: cada cor/raio/tipografia ✓ casa com um
  token ou ✗ desvia (com o token mais próximo sugerido). Clique num desvio → ele rola até o elemento e seleciona.
- **Editar em tokens** — selecione um elemento e "snape" cor/fundo/raio/tipografia no token mais próximo.
  Aplica o **valor resolvido** (funciona em qualquer página) e **registra o nome do token**.
- **Exportar redline** — gera as mudanças em **Markdown** (pro dev ler) e um **bloco pra IA** (cole no
  Claude/Cursor e ele implementa com os tokens certos). Desfazer passo a passo.
- **Tema de referência** — CRP/MarcaB × claro/escuro (o casamento muda com o tema).

## Instalar (load unpacked — uso pessoal, sem loja)

1. Na **raiz do repo**, gere a referência de tokens (precisa do `dist` buildado):
   ```bash
   npm run build && npm run export:ext
   ```
   Isso (re)gera `crp-editor-extension/tokens.json` e `tokens.js` a partir de `dist/tokens.css`.
2. Em `chrome://extensions`, ligue **Modo do desenvolvedor**.
3. **Carregar sem compactação** → selecione a pasta `crp-editor-extension/`.
4. Abra qualquer página e **clique no ícone** do CRP Inspector (liga/desliga).

> Páginas `chrome://`, a Chrome Web Store e PDFs bloqueiam injeção — é esperado.

## Estrutura

| Arquivo | Papel |
|---|---|
| `manifest.json` | MV3; permissões mínimas (`activeTab` + `scripting`) |
| `background.js` | clique no ícone → injeta/fecha o inspetor na aba ativa |
| `content/inspector.js` | a ferramenta (Auditar/Editar/Exportar) injetada na página |
| `lib/match.js` | lógica **pura** de casamento (cor ΔE OKLab, raio, tipografia) + redline — testada |
| `tokens.json` / `tokens.js` | **gerados** de `dist/tokens.css` (`npm run export:ext`) — não editar à mão |
| `match.test.mjs` | testes (`node --test`) da lib pura — rodam no `npm test` da raiz |

## Limitações conscientes (v1)

- Casamento é **heurístico** (cor mais próxima pode achatar tons sutis) — por isso o snap mostra o token
  e marca `✓` só quando é exato.
- **Estados** (`:hover`, `:focus`) não são re-tematizados (estilo inline não cobre pseudo-classes).
- **Gradientes/imagens/sombras** são ignorados (só cor sólida casa limpo).
- Reaplicar tokens em **qualquer** site mostra o valor resolvido; o redline carrega o nome do token.
