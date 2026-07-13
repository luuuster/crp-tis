# crp_plugins/ — instruções de domínio (herda o [AGENTS.md](../AGENTS.md) raiz)

4 plugins Figma + extensão Chrome. Papel na cadeia: **materializar downstream** o que `tokens/` e
o app definem — **a web é a fonte da verdade; o Figma é espelho** (fluxo web→plugin→Figma, **regra
12**; Token Studio DESCONTINUADO). Inventário e comandos por plugin: [README.md](README.md).

## Lei central: quase tudo aqui é GERADO

Os `*.json` (variables, components, screens, bundles de ícones) e `code.bundled.js` são
**artefatos dos exporters em `build/`** (`export:figma`, `export:components`, `export:screens`,
`icons`, `export:ext`). NUNCA editar à mão — corrigir o EXPORTER (ou `tokens/`/app) e regenerar.
Autorado aqui: `code.js`/lógica dos plugins, manifests, testes (`*.test.mjs`) e READMEs.

## Cadeia e regras aplicáveis

```text
tokens/ → Variables (figma-plugin) → ícones (figma-plugin-icons, regra 07)
        → ComponentSets (figma-plugin-components, regra 08) → telas (figma-plugin-screens)
        → fidelidade medida contra a web (regra 09)
```

## Armadilhas específicas (já custaram caro)

- **Regenerar a lib de ícones re-keya TODOS os componentes** → quebra toda referência em todo
  arquivo consumidor. Não regenerar para "ajustar cor": os ícones são brancos DE PROPÓSITO
  (recolor no uso via bind de Variable). Conserto de re-key: search + `swapComponent`.
- INSTANCE_SWAP perde bind de cor → recolorir os vetores bindando ao token do contexto.
- `paint.opacity` é ignorado com cor bindada → alpha mora NA Variable (`*-10`, `*-90`).
- API não seta `Position=Manual` em overlay (read-only) → clonar um overlay Manual existente.

## Validação (Definition of Done local)

`npm test` na raiz roda os testes puros de TODOS os plugins (320 variantes do button, bundles de
ícones, screens). Mudou um exporter: rode o export correspondente + o teste do plugin. Mudança
visível no Figma: verificar MEDIDO (regra 09) e lembrar que publicar a library é passo manual do usuário.
