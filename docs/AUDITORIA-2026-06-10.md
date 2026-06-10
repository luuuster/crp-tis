# Auditoria Completa — CRP Design System
### 2026-06-10 · re-auditoria pós-saneamento (sequência da AUDITORIA-2026-06-09)

## Veredito

O saneamento da última auditoria foi **executado quase por completo e bem feito**. Das 10 pendências de ontem, 8 foram resolvidas de verdade (verificadas linha a linha, não só pelo commit). O projeto segue maduro; o que resta é majoritariamente refinamento — com **uma exceção crítica que continua aberta: `.gitattributes`**.

**Estado verificado hoje (ambiente limpo):**

| Verificação | Resultado |
|---|---|
| `npm run build` | ✅ 489 primitivos · 4 temas · 265 vars/tema |
| `npm run check` | ✅ contrato, refs, contraste AA, coerência marcas/temas |
| `npm test` (raiz) | ✅ 58/58 |
| `tsc --noEmit` (app) | ✅ |
| `vitest run` (app) | ✅ 15/15 |

## Status das correções de ontem

| Achado de 2026-06-09 | Status |
|---|---|
| figma-variables.json versionado | ✅ Fora do git, gerado no CI como artifact |
| innerHTML sem sanitização | ✅ `esc()` aplicado nos dois plugins (ver nota 8) |
| Constantes de marca triplicadas | 🟡 Parcial (ver achado 4) |
| Exports sem fail-loud | ✅ exit 1 em artefato incompleto |
| audit-dark nunca falha | 🟡 `--strict` existe, mas CI não o chama (achado 7) |
| seed-palette sem proteção | ✅ `--force` + backup com timestamp |
| Zero testes no app | ✅ Vitest + Testing Library, 15 testes, job no CI |
| Plugin Figma sem testes | 🟡 Funções puras cobertas; sync segue sem teste (achado 2) |
| Error Boundary ausente | ✅ Presente e ativo no App.tsx |
| `.gitattributes` ausente | 🔴 **Não executado** (achado 1) |

## Achados

### 🔴 1. `.gitattributes` continua ausente — e o problema se manifestou de novo hoje
Hoje, **159 arquivos aparecem como modificados** no `git status`, e `git diff --ignore-cr-at-eol` mostra **zero diferenças de conteúdo** — é 100% ruído de CRLF, o mesmo falso positivo que contaminou a rev. 1 da auditoria de ontem. Era o item nº 1 do plano de ação e não foi feito.
**Ação (~5 min):** criar `.gitattributes` com `* text=auto` + `git add --renormalize .` em commit isolado.

### 🟠 2. Lógica de risco do `figma-plugin/code.js` segue sem teste
`pure.test.mjs` cobre apenas funções puras. Sync de Variables, auditoria de 4 temas e migração de rename — o código que pode corromper um arquivo Figma — continuam sem rede de proteção. O plugin de ícones mostra o caminho (lógica extraída + 58 testes).
**Ação:** extrair a lógica de sync/auditoria para módulos puros testáveis, como já foi feito no plugin de ícones.

### 🟠 3. `check.mjs` não valida contraste em `:hover`/`:active` (WCAG 1.4.3 / 1.4.11)
O gate valida repouso (texto, soft sobre tinta real, borda outline 3:1), mas `.btn.solid:hover`, `.btn.outline:hover` e `.btn.soft:hover/active` compõem fundo com `color-mix(... var(--state-overlay) ...)` e **nenhum estado composto é verificado**. Em dark, é plausível um hover cair abaixo de AA sem ninguém notar.
**Ação:** computar o `color-mix` dos estados (mesma técnica já usada para soft em repouso) e validar AA/3:1 por tema.

### 🟡 4. Centralização de marcas/temas ficou pela metade
`build-tokens.mjs`, `check.mjs` e `export-token-studio.mjs` já leem `$themes.json` ✅ — mas `audit-dark.mjs`, `export-figma.mjs`, `seed-palette.mjs` e `verify-figma.mjs` ainda hardcodam marca/seletor. Adicionar uma marca hoje ainda exige ~4 edições.
**Ação:** terminar a migração para leitura de `$themes.json` nos 4 scripts restantes.

### 🟡 5. `parseBlocks`/`resolve` duplicados em `check.mjs` e `audit-dark.mjs`
Parsing de CSS e resolução de vars copiados entre os dois. Divergência silenciosa é questão de tempo.
**Ação:** extrair `build/lib/css.mjs` compartilhado.

### 🟡 6. `prefers-contrast: more` ausente
`base.css` cobre `reduced-motion` e `forced-colors`, mas usuários com "aumentar contraste" não recebem reforço — relevante justamente para `.btn.soft` (tinta de baixa opacidade) e `.btn.outline` (borda fina).
**Ação:** bloco `@media (prefers-contrast: more)` engrossando ring/bordas e subindo a opacidade do soft.

### 🟡 7. `audit:dark --strict` não roda no CI
O flag fail-loud foi implementado, mas `build-tokens.yml` não chama o script — o bug de cor dark que ele detecta só é pego se alguém rodar localmente.
**Ação:** adicionar `npm run audit:dark -- --strict` ao job de tokens.

### 🟡 8. `innerHTML` ainda é o mecanismo padrão nos dois `ui.html` (12 + 15 ocorrências)
A sanitização com `esc()` resolve o risco imediato, mas a abordagem segue frágil: cada novo render precisa lembrar do `esc()`.
**Ação:** migrar texto para `textContent`/`createElement`; reservar `innerHTML` ao SVG confiável dos bundles.

### 🔵 9. Assimetria `primary-foreground` entre modos
`mode/light.json:10` referencia `{brand-primary-foreground}`; `mode/dark.json:24` hardcoda `{color.white}` (com `$description`). Funciona hoje, mas uma marca futura com foreground off-white atualizaria o light e deixaria o dark para trás.
**Ação:** alinhar o dark para `{brand-primary-foreground}` ou registrar a exceção no README.

### 🔵 10. Tokens de motion não chegam ao `@theme` do Tailwind
`--ease-*`, `--duration-default` e `--animate-*` são emitidos em `dist/tokens.css` (`:root`) mas não mapeados em `dist/theme.css`. Hoje os valores coincidem com os defaults do Tailwind v4; se um dia divergirem, as utilities (`ease-in`, `animate-spin`…) não acompanharão o DS.
**Ação:** mapear motion no `@theme inline` ou documentar que motion segue os defaults do Tailwind.

### 🔵 11. Focus ring inconsistente no `dialog.tsx`
Botão de fechar usa `focus:ring-2 focus:ring-ring` (100%), enquanto o padrão do projeto (`focus.ts`, `button.tsx`) é `focus-visible:ring-[3px] ring-ring/50`.
**Ação:** harmonizar com `focusRing` de `lib/focus.ts`.

### 🔵 12. Menores
- README não documenta `core/border.json` e `core/icon.json` na seção Estrutura (ambos integrados e funcionando).
- `button.tsx` não oferece prop `isLoading` que ligue `aria-busy`/`aria-disabled` automaticamente — `button.css` já prevê o estado, mas depende do consumidor lembrar.
- Tamanhos `xs`/`icon-xs` = 24px: atendem o mínimo do WCAG 2.5.8 sem folga; documentar como "AA-only, UI densa".
- `tokens/components/button.json` (tier 3) só consome tokens dimensionais — esclarecer no README se cor/estado virão ou se é por design.

## Falsos positivos descartados durante a verificação

Três achados levantados na varredura **não se confirmaram** e foram excluídos: "primary-foreground ausente no dark.json" (existe, linha 24); "CI do app não reporta falha de teste" (o job `app` roda `npm test` e falha corretamente); "tokens de motion órfãos = crítico" (primitivos são consumidos downstream por design — rebaixado para o achado 10).

## Plano de ação

1. **Hoje:** `.gitattributes` + `git add --renormalize .` (commit isolado). É a terceira vez que o ruído de EOL aparece.
2. **Esta semana:** `audit:dark --strict` no CI (1 linha) · terminar centralização de marcas (achado 4) · extrair `build/lib/css.mjs` (achado 5).
3. **Próximas 2 semanas:** contraste de `:hover`/`:active` no check.mjs (achado 3) · modularizar e testar o sync do figma-plugin (achado 2).
4. **Depois:** `prefers-contrast` · migração de `innerHTML` · alinhamentos 🔵.

## Conclusão

Ontem para hoje: 8 de 10 pendências resolvidas com qualidade — testes reais, fail-loud de verdade, sanitização aplicada. O repositório está com tudo verde num ambiente limpo. As duas dívidas com dente são as mesmas de antes: **EOL sem normalizar** (trivial, e segue mordendo) e **a lógica mais perigosa do projeto — o sync de Variables — sendo a menos testada**. O resto é polimento de um projeto que já está acima da média.
