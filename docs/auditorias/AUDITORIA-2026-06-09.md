# Auditoria Completa — CRP Design System
### 2026-06-09 · revisão sincera de todo o repositório · rev. 2

> **Errata (rev. 2):** o achado original nº 1 ("152 arquivos modificados sem commit")
> era um falso positivo de fim de linha: HEAD com LF, working tree Windows com CRLF.
> `git diff --ignore-cr-at-eol` mostra zero diferenças de conteúdo. A árvore está limpa
> (`main` em `e167d30`). Achado removido e notas recalculadas.

## Veredito

Projeto **maduro e acima da média** para um design system desse porte. Pipeline SSOT real (Token Studio → DTCG → Style Dictionary → Tailwind v4/shadcn), validação automática de contraste WCAG no CI e a11y de comportamento de verdade — não de fachada. Os problemas existentes são operacionais e de manutenção, nenhum bloqueante.

**Estado verificado hoje:** `npm run build` ✅ · `npm run check` ✅ · `npm test` ✅ (53/53) · `tsc --noEmit` do app ✅.

| Área | Nota |
|---|---|
| Arquitetura de tokens (3 tiers, SSOT) | 9/10 |
| Validação e a11y (check.mjs, contraste AA fatal) | 9/10 |
| App React demo | 8.5/10 |
| Plugins Figma | 6.5/10 |
| Tratamento de erros nos scripts de build | 6/10 |
| Testabilidade (build scripts e app sem testes) | 5/10 |
| Higiene de git | 8/10 |

---

## O que está BOM

**1. Pipeline SSOT é o ponto mais forte do projeto.** Primitivos emitidos uma única vez em `:root`, temas sem duplicação, `theme.css` com `@theme inline` correto para Tailwind v4, metadados TS (`tokens.js/.d.ts`) para o provider. 489 primitivos, 265 vars de contrato por tema, 4 temas (CRP/MarcaB × Light/Dark).

**2. `check.mjs` é um gate de qualidade raro de se ver.** Contraste WCAG AA (4.5:1) fatal, contraste não-textual 3:1 (WCAG 1.4.11) em rings/outlines, validação das variantes soft com `color-mix()` contra superfícies reais, ordem de z-index, refs resolvidas, e presença dos artefatos de a11y no dist.

**3. A11y de comportamento é real.** `src/a11y/base.css` (focus-visible com `--ring`, reduced-motion, forced-colors), `button.css` com 5 estilos × intents × estados, e `button.js` com guard de `aria-disabled` em captura (preventDefault + stopImmediatePropagation) — idempotente, 1 listener delegado.

**4. App demo é exemplar na integração.** Zero cor hardcoded; troca de marca/tema em runtime via `data-brand` + `.dark` sem rebuild. RegisterPage é referência: checklist de senha com `aria-live="polite"`, fonte única `PWD_RULES` alimentando Zod e UI, upload acessível por teclado, fix de autofill do Chrome. Dashboard usa `accessibilityLayer` do Recharts.

**5. Decisões de cor documentadas e corretas.** OKLCH com rampas monotônicas, shade-âncora carregando o HEX exato da marca, e o trade-off do `#036EF2` (4.44:1 < AA) resolvido com `primary.700` no botão e a cor exata preservada no ring — documentado no README.

**6. Autoconsciência técnica.** `docs/PLANO-SANEAMENTO.md` já mapeia 6 dívidas com diagnóstico arquivo:linha, rollback e definition of done. Poucos projetos têm isso.

---

## O que está RUIM (em ordem de prioridade)

### 🔴 1. Fins de linha não normalizados (sem `.gitattributes`)
O repositório tem blobs LF no histórico e CRLF no working tree Windows. Sem `.gitattributes`, qualquer ferramenta/CI com `core.autocrlf` diferente vê o repo inteiro como modificado (foi exatamente o falso positivo da rev. 1 desta auditoria) e corre risco de commits que reescrevem 41 mil linhas só de EOL. **Ação (~5 min):** criar `.gitattributes` com `* text=auto` (e `*.svg text`, `*.json text` se quiser ser explícito) + `git add --renormalize .` em um commit isolado.

### 🔴 2. `figma-variables.json` (13.610 linhas) versionado
Inconsistente com `dist/` e com os bundles de ícones (ignorados). Gera diffs gigantes a cada mudança de token. Já está como Tarefa 1 do plano de saneamento — só falta executar (`git rm --cached` + `.gitignore` + gerar no CI).

### 🟠 3. `figma-plugin/code.js` monolítico (1.143 linhas) com ~5% de cobertura
O `pure.test.mjs` testa só funções puras; sync de variables, auditoria de 4 temas e migração de rename — a lógica mais arriscada — não têm teste. O plugin de ícones está bem melhor (~70%, 53 testes). **Ação:** extrair a lógica testável de `code.js` para módulos puros, como já foi feito no plugin de ícones.

### 🟠 4. `innerHTML` nos dois ui.html (11 + 14 ocorrências)
Risco real é baixo (dados vêm dos bundles locais e nomes de tokens, não de input externo), mas é frágil: um nome de token/ícone com `<` quebra ou injeta markup. **Ação:** trocar por `textContent`/`createElement` onde for texto; manter `innerHTML` só para SVG confiável dos bundles.

### 🟠 5. Constantes de marca/tema triplicadas
`SELECTOR`, `THEMES`, `BRANDS` hardcoded em `build-tokens.mjs`, `export-figma.mjs`, `check.mjs` (e `audit-dark.mjs` hardcoda os seletores dark). Adicionar uma marca exige 3–4 edições sincronizadas. Já é a Tarefa 2 do saneamento. **Ação:** fonte única (ler de `$themes.json`) + check de coerência.

### 🟡 6. I/O sem tratamento de erro nos exports
`export-figma.mjs`, `embed-icons.mjs`, `export-token-studio.mjs`: `writeFileSync` sem try-catch; `embed-icons` pula bundles ausentes com warning e gera `code.bundled.js` incompleto sem falhar; warnings de set fora do `$metadata.tokenSetOrder` não bloqueiam. **Ação:** falhar alto (`exit 1`) quando o artefato sair incompleto.

### 🟡 7. `audit-dark.mjs` só reporta, nunca falha
Encontra bug de cor (⛔) e sai com código 0. Quem roda e ignora deixa o bug passar. **Ação:** exit 1 quando houver bug (ou flag `--strict` ligada no CI).

### 🟡 8. `seed-palette.mjs` sobrescreve `tokens/core/` sem confirmação nem backup
Tem o aviso ⚠ no header, mas uma execução acidental destrói edições feitas via Token Studio. **Ação:** flag `--force` + backup automático.

### 🟡 9. Zero testes no app e nos build scripts
App: sem unit/E2E (fluxo de auth, validação, a11y). Build: refactor em `stripComments`/`declaredVarNames` não tem rede de proteção. Já mapeado nas Tarefas 3–4 do saneamento (Vitest + Playwright).

### 🔵 10. Menores
- `style={{ fontFamily: 'var(--font-heading)' }}` inline em Dashboard/Showcase — usar classe `.ty-*` ou utility.
- Sem Error Boundary no App.tsx.
- `version: 0.0.0` + `private: true` + `publishConfig` + `npm run release` no CI: intencional (commit `6b9e2fd`), mas merece 2 linhas no README explicando o plano de publicação.
- Parsing de CSS (`parseBlocks`, `resolve`, contraste) duplicado em check/verify-figma/audit-dark — extrair `build/lib/`.
- Links "Termos/Política" no Register sem `preventDefault()`.

---

## Plano de ação resumido

1. **Hoje:** `.gitattributes` + `git add --renormalize .` (commit isolado) e commitar esta auditoria.
2. **Esta semana:** executar Tarefas 1 e 2 do PLANO-SANEAMENTO (figma-variables fora do git; fonte única de marcas) + tornar `audit-dark` fatal + try-catch nos exports.
3. **Próximas 2 semanas:** modularizar `figma-plugin/code.js` com testes; sanitizar `innerHTML`; Vitest no app.
4. **Depois:** Playwright nos previews, Error Boundary, `build/lib/` compartilhado, definir versão 1.0.0 e política de publicação.

## Conclusão sincera

A fundação (tokens, contrato, validação, a11y) está em nível profissional — melhor que muito DS de empresa grande. O que pesa contra é manutenção: artefato gerado no git, EOL sem normalizar, e a lógica mais perigosa (plugin de Variables) sendo a menos testada. Nada disso é difícil de resolver, e metade já está diagnosticada no seu próprio plano de saneamento. Executá-lo é o próximo passo óbvio.
