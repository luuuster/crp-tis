# Auditoria Rigorosa — CRP Design System
### 2026-06-10 · rev. 2 (tarde) · lista exaustiva de TODOS os problemas atuais

> Metodologia: 4 varreduras paralelas (build/plugins, valores de tokens, app React, higiene de repo),
> cada achado de severidade média ou maior **verificado individualmente** contra o código e por execução
> em ambiente limpo. Achados não confirmados foram descartados e estão listados ao final.

## ⚠️ Veredito — uma emergência e um repositório excelente

Existe **um problema crítico que domina todos os outros**: o working tree no seu disco está
**corrompido**. Já o **HEAD do git está 100% íntegro e verde** — inclusive com TODOS os achados da
auditoria da manhã já corrigidos em commits de hoje.

| Verificação (no HEAD, ambiente limpo) | Resultado |
|---|---|
| `npm run build` | ✅ |
| `npm run check` (com hover/active fatal) | ✅ |
| `npm run audit:dark -- --strict` | ✅ |
| `npm test` (raiz, com bundles gerados) | ✅ 71/71 |
| `tsc --noEmit` (app) | ✅ |
| `vitest run` (app) | ✅ 18/18 |
| No working tree do disco | ❌ build quebra, 1 suite de teste quebra |

---

## 🔴 CRÍTICO

### 1. 19 arquivos corrompidos/truncados no disco (o build está quebrado AGORA)
`git diff` de conteúdo (ignorando EOL) mostra 19 arquivos com **17 inserções e 327 deleções** vs HEAD —
e o padrão é de **escrita interrompida**, não de edição:

- `build/build-tokens.mjs` — cortado no meio de um comentário (`"Camada base agnóstic"`), 10.905 de 11.437 bytes. **`npm run build` morre com SyntaxError.**
- `figma-plugin/pure.test.mjs` — perdeu **160 linhas** (os testes de sync de hoje). **`npm test` falha.**
- `app/src/components/ui/dialog.tsx` — contém bytes NUL (git o trata como **binário**).
- `build/check.mjs` e `tokens/mode/dark.json` — prefixos byte-exatos do HEAD (truncamento puro).
- `.github/workflows/build-tokens.yml` — termina em `"workin"` (meio de palavra). README idem (`"tentando p"`).
- `preview/login.html` e `tokens/mode/light.json` — linha final preenchida com **centenas de espaços**.
- Demais: `app/ui/button.tsx`, `build/{audit-dark,export-figma,seed-palette,verify-figma}.mjs`, `figma-plugin/ui.html`, `figma-plugin-icons/ui.html`, `src/a11y/base.css`, `src/components/button.css`, `tokens/semantic/state.json`.

**Ação imediata:** `git restore .` (o HEAD tem a versão boa e mais recente de tudo) e em seguida
`npm run build && npm run check && npm test` para confirmar. **Importante:** investigar a causa —
truncamento no meio de palavra + padding de espaços + bytes NUL sugere escrita interrompida ou
interferência de sincronização de nuvem na pasta (`C:\Users\frank\Videos`). Até identificar, faça
commits frequentes: o git foi o que salvou o trabalho de hoje.

## 🟠 ALTO

*(nenhum — após o restore, não há problema funcional de severidade alta no HEAD)*

## 🟡 MÉDIO

### 2. 117 de 290 cores OKLCH estão fora do gamut sRGB → Figma ≠ navegador
Verificado programaticamente com culori: 117 valores (ex.: `orange.500 oklch(70.5% 0.213 47.604)`,
toda a faixa 200–700 de red/orange/amber…) não são representáveis em sRGB. É herança intencional do
Tailwind v4, e navegadores modernos mapeiam para P3. **Mas** o export para Figma
(`export-figma.mjs`/`verify-figma.mjs`) **clampa para sRGB** — as Variables no Figma ficam levemente
diferentes do que o browser renderiza em telas P3, e o `verify-figma` não detecta porque compara os
dois lados já clampados. Ação: documentar o trade-off no README; opcionalmente reportar no export
quantos tokens sofreram clamp.

### 3. `token-studio/tokens.json` no disco está desatualizado (stale)
O bundle no disco (gerado 02:59) **diverge** do que `npm run export:ts` gera agora — os tokens de
`state.json`/`dark.json`/`light.json` mudaram depois dele. Quem importar esse bundle no Token Studio
reintroduz valores antigos no SSOT. Ação: regenerar após o restore; considerar gerá-lo no CI como
artifact (mesma política do figma-variables.json).

### 4. Auditoria do plugin não acusa MODO ausente no Figma (`code.js:383,495`)
`if (modeId === undefined) continue;` — se a collection no Figma só tem o modo Light e o bundle exige
Light+Dark, o drift dos valores Dark é silenciosamente pulado e a auditoria dá "OK". Ação: contar e
reportar modos ausentes.

### 5. `npm test` falha num clone limpo
3 suites (bundle/material/run) dependem de `lucide-icons.json`/`material-*.json`, que são gitignorados
e só existem após `npm run icons` (que demora minutos). Confirmei: clone limpo → ENOENT. O CI faz a
ordem certa, mas um dev novo não descobre isso pelo erro. Ação: `pretest` que valida presença dos
bundles e instrui rodar `npm run icons` (sem gerá-los automaticamente).

### 6. Conversão de cor duplicada (`export-figma.mjs:99–119` ≅ `verify-figma.mjs:75–95`)
`hexToRgb`/`oklchToRgb` copiadas — a extração de `build/lib/css.mjs` cobriu parse/resolve/color-mix,
mas não a conversão de cor. Mesmo risco de divergência silenciosa que motivou a lib. Ação: mover para
`build/lib/`.

## 🔵 BAIXO

### 7. Formato OKLCH inconsistente nas paletas de marca
242 valores usam `oklch(97.1% …)` (percentual) e 48 — exatamente as paletas `brand.*` — usam
`oklch(0.971 …)` (decimal). Funciona (parsers aceitam ambos), mas dificulta comparação e gera risco em
ferramentas que esperam um formato só. Ação: normalizar para percentual.

### 8. `export-figma.mjs:250` — `SSOT.brands.find((b) => b.isDefault).set` sem guarda
Se `$themes.json` vier sem grupos de Brand, o erro é um TypeError opaco em vez de mensagem clara.

### 9. `build/lib/css.mjs:32` — limite de profundidade 10 silencioso
Cadeia de `var()` com mais de 10 níveis retorna o `var()` não resolvido sem aviso. Hoje as cadeias são
curtas; um `throw`/warning custaria uma linha.

### 10. `code.js:367,492` — `setVariableCodeSyntax` com `catch {}` vazio
Se falhar, o Dev Mode fica sem code syntax (`var(--token)`) e ninguém é avisado. Logar em `stats`.

### 11. Login/Register: promessa simulada sem guarda de unmount
`LoginPage.tsx:61–64` (`await setTimeout 1100ms` → `form.setFocus`) e `RegisterPage.tsx:107` (toast +
callback) executam após o componente poder ter sido desmontado. Em app demo é cosmético; com auth real
vira bug. Ação: flag de montagem/AbortController.

### 12. `package.json` sem `engines`/`packageManager` (raiz e app)
Node mínimo não declarado — um dev com Node 16 descobre por erro críptico do Style Dictionary.

### 13. CI sem cache de npm
`actions/setup-node@v4` sem `cache: 'npm'` — dois `npm ci` completos por run.

### 14. `dist/primitives.css` é intermediário não documentado
Gerado e consumido pelo próprio build (concatenado no tokens.css), fica no dist sem estar nos
`exports` nem no README. Remover após o build ou documentar.

### 15. `.claude/settings.local.json` untracked e não ignorado
Aparece como `??` no git status. É config local — adicionar ao `.gitignore`.

### 16. Nomes de arquivo com `=` em `tokens/logo/` (`Tipo=full-preta.svg`)
Convenção de export do Figma; funciona, mas exige encoding em URLs e confunde algumas ferramentas.

### 17. `code.js:112` — `fullName.replace('CRP/', '')` frágil
O filtro de collections da UI depende dessa string literal; renomear o prefixo das collections quebra o
filtro silenciosamente (collections passam a importar sempre). Centralizar o prefixo numa constante.

### 18. `minifySvg` por regex (`export-lucide-figma.mjs:24–31`)
Colapsa espaços inclusive dentro de atributos. Entrada é controlada (lucide/material), risco teórico —
mas um teste de "SVG continua parseável" custaria pouco.

### 19. `ErrorBoundary` só loga no console
Sem persistência/telemetria do erro. Adequado para demo; registrar como dívida para produção.

---

## Falsos positivos descartados na verificação (para registro)

Das varreduras automatizadas, **descartei após verificação**: "dist/ vazio" e "token-studio/tokens.json
não existe" (ambos existem); "aria-busy pode virar string 'undefined'" (React omite atributos
undefined); "double-submit no Button com isLoading" (o handler é trocado por `preventDefault` — está
protegido); "getByLabelText('Senha') quebrado" (os 18 testes passam; FormLabel renderiza `<label
htmlFor>` real); "`<label htmlFor>` não funciona com Checkbox Radix" (button é labelable, funciona);
"'CRP-Light' hardcoded no check.mjs" (removido no refactor de hoje); "runFix ignora CANCELLED" (tem 2
checks); "$type fora de posição no border.json" (ordem de chaves JSON é irrelevante); "paletas de marca
hardcoded" (são primitivos — é o design correto); "motion órfão" (primitivos são consumidos
downstream; já mapeados no @theme hoje).

## O que foi corrigido hoje (confirmado commit a commit)

`.gitattributes` + renormalização ✅ · `audit:dark --strict` no CI ✅ · contraste hover/active fatal no
check ✅ · `build/lib/css.mjs` + `themes.mjs` (fim das constantes em 5 scripts) ✅ · `prefers-contrast:
more` ✅ · `innerHTML` → `createElement`/`textContent` ✅ · testes da lógica de sync do plugin ✅ ·
focus ring do Dialog padronizado ✅ · `isLoading`/`aria-busy` no Button ✅ · motion no `@theme` ✅ ·
exceção do primary-foreground dark documentada ✅ · 3 testes novos no app (15→18) ✅.

## Plano de ação

1. **AGORA:** `git restore .` → rodar build/check/test para confirmar → investigar a causa da
   corrupção (sync de nuvem? editor?) antes de continuar editando.
2. **Hoje:** regenerar `token-studio/tokens.json` (achado 3) · `.gitignore` p/ settings.local (15).
3. **Esta semana:** modos ausentes no drift (4) · pretest dos bundles (5) · conversão de cor na lib (6)
   · `engines` + cache de CI (12, 13).
4. **Quando tocar nos arquivos:** demais itens baixos (7–11, 14, 16–19).

## Conclusão

O conteúdo versionado está no melhor estado da história do projeto — toda a dívida das duas auditorias
anteriores foi paga, com validação de contraste em estados compostos que pouquíssimos design systems
têm. O único incêndio é externo ao código: arquivos corrompidos no disco, resolvível em um comando
porque o git está íntegro. Depois do restore, a lista acima é toda de melhoria incremental — nenhum
item bloqueia uso ou publicação.
