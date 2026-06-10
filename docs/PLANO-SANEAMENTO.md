# Plano de Saneamento Técnico — CRP Design System
### Documento de engenharia · v1 · 2026-06-10

---

## 1. Contexto

A auditoria completa do repositório `crp-tis` confirmou um Design System
maduro e production-ready: pipeline SSOT (Token Studio → `tokens/` DTCG →
Style Dictionary v4 → `dist/`), dois plugins Figma, app React de
demonstração e validação automática de contrato + contraste WCAG AA no CI.

A base é sólida. Mesmo assim, a auditoria isolou **6 pontos de atenção** —
dívidas pontuais, nenhuma bloqueante. Este documento é o plano de execução
profissional para resolvê-los **sem introduzir regressões**: cada tarefa
tem diagnóstico preciso (arquivo:linha real), passos verificáveis, código
correto ao estado atual, armadilhas conhecidas, estratégia de rollback e
*definition of done*.

**Princípios que regem todo o plano (não-negociáveis):**

1. **A SSOT é intocável.** Nada de editar `dist/` nem `figma-variables.json`
   à mão. Toda mudança nasce em `tokens/` ou em `src/`/`build/`.
2. **Toda alteração passa pelo portão.** `npm run build && npm run check &&
   npm test` tem de ficar verde **antes** de cada commit. O CI repete.
3. **Uma tarefa = um PR = um changeset** (quando afeta o pacote publicado),
   para diffs revisáveis e rollback cirúrgico.
4. **Aditivo antes de destrutivo.** Onde possível, adiciona-se a salvaguarda
   nova (ex.: check de coerência) e só depois remove-se o antigo.
5. **Sem ampliar superfície de bug.** Reuso dos utilitários já existentes
   (`permutateThemes`, `declaredVarNames`, helpers de `check.mjs`) em vez de
   reimplementar parsing.

**Decisões já tomadas com o dono do repo:**
- `figma-plugin/figma-variables.json` → **ignorar no git e gerar no CI**.
- Profundidade: **plano de ação executável**, à prova de bugs.

---

## 2. Mapa de dívidas → tarefas

| # | Tarefa | Prioridade | Esforço | Quebra pacote? | Changeset |
|---|--------|:---------:|:-------:|:--------------:|:---------:|
| 1 | Parar de versionar `figma-variables.json` | Alta | ~1h | Não | não |
| 2 | Fonte única de marcas + check de coerência no CI | Alta | ~4h | Não | patch (infra) |
| 3 | Suíte de testes do app React (Vitest) | Média-Alta | ~1 dia | Não (app é privado) | não |
| 4 | Regressão visual dos previews (Playwright) | Média | ~1 dia | Não | não |
| 5 | Versão + aviso de drift nos plugins Figma | Baixa-Média | ~3h | Não | não |
| 6 | Procedimento de sync dos componentes shadcn | Baixa | ~1h | Não | não |

**Sequência recomendada (com checkpoints):**
`Tarefa 1 → 2` (saneia o pipeline) → **checkpoint A** (CI verde) →
`Tarefa 3 → 4` (rede de segurança) → **checkpoint B** → `Tarefa 5 → 6`
(polimento) → **checkpoint final**.

---

## 3. Pré-voo (executar uma vez, antes de tudo)

Estabelecer a linha-de-base e a higiene de branch.

```bash
# 1. Branch de trabalho (já designada)
git checkout claude/charming-allen-ykfdnf

# 2. Estado limpo e verde ANTES de qualquer mudança (linha-de-base)
npm ci
npm run build && npm run check && npm test          # deve passar 100%
npm run export:figma                                 # gera o JSON atual
git status                                           # anotar o que aparece "sujo"

# 3. App também compila (linha-de-base do app)
cd app && npm ci && npm run typecheck && cd ..
```

> ⚠️ Se qualquer comando do pré-voo falhar, **pare** e corrija antes de
> iniciar as tarefas — não se constrói saneamento sobre base vermelha.

Cada tarefa abaixo é desenvolvida em **sub-branch própria** a partir da
branch de trabalho, ou em commits atômicos sequenciais na própria branch
(decisão do dono). Recomendado: commits atômicos com mensagem
convencional (`chore:`, `test:`, `ci:`, `docs:`).

---

## 4. Tarefa 1 — Remover `figma-variables.json` do versionamento

### Objetivo
Alinhar o JSON gerado (13.610 linhas) à mesma filosofia de `dist/` e dos
bundles de ícones: artefato gerado, **não** commitado. Elimina diffs
gigantes e ruidosos a cada mudança de token.

### Diagnóstico (estado atual confirmado)
- `figma-plugin/figma-variables.json` **está rastreado** (`git ls-files`).
- Gerado por `build/export-figma.mjs` (escreve em
  `figma-plugin/figma-variables.json`, linha 29/520).
- `.gitignore` já ignora `dist/`, `token-studio/` e os 7 bundles de ícones
  + `code.bundled.js` — mas **não** este JSON (inconsistência).
- O `pure.test.mjs` do plugin **não lê** o JSON (testa só funções puras),
  então removê-lo do repo não quebra `npm test`.

### Passos

1. **`.gitignore`** — adicionar no bloco de artefatos de plugin:
   ```gitignore
   # variables do Figma gerado (regenerado por `npm run export:figma` e no CI)
   figma-plugin/figma-variables.json
   ```

2. **Remover do índice mantendo o arquivo local:**
   ```bash
   git rm --cached figma-plugin/figma-variables.json
   ```

3. **CI** (`.github/workflows/build-tokens.yml`) — adicionar a geração
   **logo após o `check`** e antes dos testes, e publicar como artifact.
   Inserir entre os steps "Validar" (linha 36-37) e "Gerar ícones":
   ```yaml
   - name: Exportar figma-variables.json
     run: npm run export:figma

   - name: Publicar figma-variables.json (artifact)
     uses: actions/upload-artifact@v4
     with:
       name: figma-variables
       path: figma-plugin/figma-variables.json
       if-no-files-found: error
   ```

4. **`figma-plugin/README.md`** — adicionar nota no topo do passo-a-passo:
   o arquivo não vem no clone; gere com `npm run export:figma` (na raiz) ou
   baixe o artifact `figma-variables` da última execução do workflow.

### Armadilhas
- **Não** apagar o arquivo do disco (`git rm --cached`, não `git rm`) — o
  plugin local ainda precisa dele até regerar.
- Garantir que o step de export roda **antes** de qualquer step que dependa
  do JSON (hoje nenhum depende, mas mantém a ordem segura para o futuro).

### Rollback
Reverter o commit. Como o arquivo continua sendo gerável por
`npm run export:figma`, não há perda de dado.

### Definition of Done
- [ ] `git status` limpo após `npm run export:figma` (JSON não aparece).
- [ ] `git ls-files figma-plugin/` não lista mais o JSON.
- [ ] CI gera o JSON e sobe o artifact com sucesso.
- [ ] README do plugin explica como obtê-lo.

---

## 5. Tarefa 2 — Fonte única de marcas + check de coerência

### Objetivo
Hoje a lista de marcas/temas está **hardcoded em 3 arquivos de build**.
Adicionar uma marca exige tocar todos; esquecer um quebra o build de forma
obscura. Criar uma **fonte única derivável** e um **check automático** que
falha o CI se as configurações divergirem.

### Diagnóstico (duplicação confirmada — arquivo:linha)
| Local | Constante | Conteúdo |
|-------|-----------|----------|
| `build/build-tokens.mjs:27` | `SELECTOR` | `{ 'CRP-Light': ':root', 'CRP-Dark': '.dark', 'MarcaB-Light': …, 'MarcaB-Dark': … }` |
| `build/export-figma.mjs:37` | `THEMES` | `{ 'CRP-Light': {brand,mode}, … }` |
| `build/export-figma.mjs:262` | `BRANDS` | `[['CRP','brand/crp'], ['MarcaB','brand/marca-b']]` |
| `build/check.mjs:13` | `EXPECTED_SELECTORS` | espelho de `SELECTOR` |

Ponto-chave: `build-tokens.mjs:204-205` **já deriva** `brands`/`modes` de
`$themes.json` (`t.group === 'Brand'` / `'Mode'`). Ou seja, `$themes.json`
já é a fonte natural — falta consolidar os mapeamentos derivados em torno
dela e validar coerência.

### Estratégia (aditiva, não destrutiva)
Implementar em **duas fases** para não arriscar o build numa só tacada:

**Fase 2a — Check de coerência (puro ganho, zero risco):**
Adicionar a `build/check.mjs` uma asserção que confirma que as quatro
fontes concordam, **sem ainda refatorar** as constantes. Isso já trava o
CI contra o erro de "esqueci de atualizar um lugar".

```js
// build/check.mjs — nova seção "8) Coerência de marcas/temas"
import { readFileSync } from 'node:fs';
const $themes = JSON.parse(readFileSync(join(process.cwd(),'tokens/$themes.json'),'utf8'));
const brandThemes = $themes.filter(t => t.group === 'Brand').map(t => t.name); // ['CRP','MarcaB']
// derivar os temas brand×mode esperados e cruzar com EXPECTED_SELECTORS:
const expectedThemeNames = new Set(Object.keys(EXPECTED_SELECTORS)); // CRP-Light, …
// 1) todo brand deve ter Light E Dark mapeados num seletor
for (const b of brandThemes)
  for (const mode of ['Light','Dark'])
    if (!expectedThemeNames.has(`${b}-${mode}`))
      errors.push(`COERÊNCIA: tema ${b}-${mode} existe em $themes mas falta seletor em check/build.`);
// 2) nenhum seletor órfão (mapeado mas sem brand correspondente)
for (const name of expectedThemeNames) {
  const brand = name.split('-')[0];
  if (!brandThemes.includes(brand))
    errors.push(`COERÊNCIA: seletor ${name} não tem brand correspondente em $themes.`);
}
```
> Reusa `EXPECTED_SELECTORS` e o array `errors` já existentes em `check.mjs`.
> `build-tokens.mjs` já lança erro próprio se um tema do `$themes` não tiver
> seletor (linha 120) — o check antecipa isso com mensagem de coerência.

**Fase 2b — Consolidar em helper compartilhado (refator opcional, maior valor a longo prazo):**
Criar `build/lib/brands.mjs` exportando a derivação a partir de
`$themes.json`, e fazer `build-tokens.mjs`, `export-figma.mjs` e
`check.mjs` consumirem-no.

```js
// build/lib/brands.mjs
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Convenção de seletor: CRP (default) = sem [data-brand]; demais = [data-brand="<slug>"].
// Dark sempre via .dark. Slug = nome do brand em kebab (MarcaB → marca-b).
const slug = (s) => s.replace(/([a-z0-9])([A-Z])/g,'$1-$2').toLowerCase();

export function getThemeModel(root = process.cwd()) {
  const $themes = JSON.parse(readFileSync(join(root,'tokens/$themes.json'),'utf8'));
  const brands = [...new Set($themes.filter(t=>t.group==='Brand').map(t=>t.name))];
  const modes  = [...new Set($themes.filter(t=>t.group==='Mode').map(t=>t.name))];
  const isDefault = (b) => b === brands[0]; // o primeiro brand é o default (:root)
  const selectorFor = (b, mode) => {
    const base = isDefault(b) ? '' : `[data-brand="${slug(b)}"]`;
    return mode === 'Dark' ? (base ? `${base}.dark` : '.dark') : (base || ':root');
  };
  const themes = {};
  for (const b of brands) for (const m of modes) themes[`${b}-${m}`] = { brand:b, mode:m, selector:selectorFor(b,m) };
  return { brands, modes, themes };
}
```
> **Atenção à compatibilidade:** o helper deve reproduzir *exatamente* os
> seletores atuais (`:root`, `.dark`, `[data-brand="marca-b"]`,
> `[data-brand="marca-b"].dark`). Validar com diff do `dist/tokens.css`
> antes/depois (deve ser **byte-idêntico**). Se o slug de "MarcaB" não der
> "marca-b", manter um mapa de override explícito em vez de derivar.

A Fase 2b só é mergeada se o `dist/` gerado for idêntico ao anterior
(prova de não-regressão).

### Documentação
Atualizar `.claude/agents/design-system.md`: o "playbook de adicionar
marca" passa a ser (a) adicionar o tema em `$themes.json` + sets em
`brand/<slug>.json`; (b) rodar `npm run check` — o check de coerência
aponta qualquer ponta solta.

### Armadilhas
- A Fase 2a não deve gerar **falsos positivos** no estado atual — rodar
  contra o repo limpo e confirmar que passa antes de commitar.
- O nome interno é `MarcaB` (sem hífen) em `$themes`/`THEMES`, mas o
  seletor/slug é `marca-b`. O helper precisa lidar com essa diferença
  (daí o `slug()` e o aviso acima).

### Rollback
Fase 2a e 2b são commits separados; reverter o de 2b mantém o ganho do
check de 2a.

### Definition of Done
- [ ] `npm run check` passa no repo atual com a nova seção de coerência.
- [ ] Inserir um tema inconsistente em `$themes.json` (ex.: `MarcaC-Light`
      sem seletor) faz `npm run check` **falhar** com mensagem clara.
- [ ] (Se 2b) `dist/tokens.css` byte-idêntico ao anterior (`git diff`
      vazio após rebuild).
- [ ] Playbook de marca atualizado no agente.

---

## 6. Tarefa 3 — Suíte de testes do app React (Vitest)

### Objetivo
O app (`app/`) tem lógica real — troca de marca/tema, validação de
formulário (react-hook-form + zod), navegação — e **zero testes**. Montar
rede de segurança com Vitest (nativo do Vite já em uso).

### Diagnóstico (alvos de teste confirmados)
- `app/src/App.tsx:25-30` — `useEffect` aplica `.dark` e
  `data-brand="marca-b"` no `<html>`; navegação por `view` (linha 67-75).
- `app/src/pages/LoginPage.tsx` — senha demo `'123456'` (linha 30), erro de
  credencial (linha 62-64), `onLogin` no sucesso (linha 68), `setTimeout`
  de 1100ms simulando auth (linha 61).
- `app/src/pages/RegisterPage.tsx`, `Dashboard.tsx`, `Showcase.tsx`.
- `app/package.json` ainda **não** tem dep nem script de teste.

### Passos

1. **Instalar dev deps em `app/`:**
   ```bash
   cd app
   npm i -D vitest @testing-library/react @testing-library/dom \
     @testing-library/jest-dom @testing-library/user-event jsdom
   ```

2. **Configurar Vitest** estendendo o `vite.config.ts` existente (preserva
   o alias `@` e o `server.fs.allow`):
   ```ts
   // app/vite.config.ts — adicionar ao defineConfig:
   test: {
     environment: 'jsdom',
     globals: true,
     setupFiles: ['./src/test/setup.ts'],
     css: false, // não processa Tailwind nos testes (mais rápido, sem ruído)
   },
   ```
   > Como o config importa `@tailwindcss/vite`, o plugin não interfere em
   > `vitest run`. Se houver conflito de tipos do `test`, adicionar
   > `/// <reference types="vitest/config" />` no topo.

3. **Setup** `app/src/test/setup.ts`:
   ```ts
   import '@testing-library/jest-dom/vitest'
   import { afterEach } from 'vitest'
   import { cleanup } from '@testing-library/react'
   afterEach(() => { cleanup(); document.documentElement.className = '';
     document.documentElement.removeAttribute('data-brand') })
   ```

4. **Scripts** em `app/package.json`:
   ```json
   "test": "vitest run",
   "test:watch": "vitest"
   ```

5. **Testes de alto valor** (foco em comportamento, não em pixels):

   - `app/src/App.test.tsx`
     - Renderiza em `login` por padrão.
     - Clicar no botão "Trocar para…" adiciona/remove `data-brand="marca-b"`
       no `documentElement`.
     - Clicar no toggle de tema adiciona/remove a classe `dark`.

   - `app/src/pages/LoginPage.test.tsx`
     - Email inválido → mensagem "Informe um e-mail válido." (zod).
     - Senha curta → "ao menos 6 caracteres".
     - Email válido + senha errada → alerta de credencial; `onLogin` **não**
       chamado.
     - Email válido + `123456` → `onLogin` chamado (usar `vi.useFakeTimers`
       ou `findBy*` com timeout para o `setTimeout` de 1100ms).
     - "Criar conta" dispara `onCreateAccount`.

   - `app/src/pages/RegisterPage.test.tsx` — validação dos campos + gate dos
     termos + estado de loading (smoke + 1-2 asserts principais).

   - `app/src/pages/smoke.test.tsx` — render sem erro de `Dashboard` e
     `Showcase` (cobre imports/recharts).

6. **CI** — novo job no workflow (paralelo ao de tokens):
   ```yaml
   app:
     runs-on: ubuntu-latest
     defaults: { run: { working-directory: app } }
     steps:
       - uses: actions/checkout@v4
       - uses: actions/setup-node@v4
         with: { node-version: 20 }
       # o app depende de @crp/design-tokens via file:.. → buildar o dist primeiro
       - run: npm ci && npm run build       # na RAIZ, gera dist/ consumido pelo app
         working-directory: .
       - run: npm ci
       - run: npm run typecheck
       - run: npm test
   ```
   > **Crítico:** o app importa `@crp/design-tokens/tokens.css` de `dist/`.
   > O job precisa rodar `npm run build` na raiz **antes** do `npm ci` do
   > app, senão o import falha. Alternativa: `css:false` no Vitest já evita
   > resolver o CSS em teste — mas `npm run build` do app (tsc + vite build)
   > exige o dist. Para o job de teste puro, `css:false` basta; mantenha o
   > build da raiz se também rodar `vite build`.

### Armadilhas
- O `setTimeout(1100)` no login: usar `vi.useFakeTimers()` +
  `vi.advanceTimersByTimeAsync(1100)` **ou** `await screen.findByRole(...)`
  com `{ timeout: 2000 }`. Não usar `waitFor` sem timeout adequado.
- `user-event` precisa de `await` em cada interação (v14+).
- `toast` (sonner) e `TooltipProvider` podem exigir wrapper; testar
  `LoginPage` isolada (ela não depende do `TooltipProvider` do `App`).
- `cleanup` + reset do `documentElement` entre testes (já no setup) evita
  vazamento de estado de tema entre casos.

### Rollback
Tudo é aditivo (novas deps + novos arquivos `*.test.tsx` + 1 job CI).
Reverter o commit remove a suíte sem afetar o app em produção.

### Definition of Done
- [ ] `cd app && npm test` verde localmente.
- [ ] Cobre: troca de marca, troca de tema, 4 cenários de login, smoke de
      Register/Dashboard/Showcase.
- [ ] Job `app` verde no CI.

---

## 7. Tarefa 4 — Regressão visual dos previews (Playwright)

### Objetivo
O `check.mjs` valida lógica e contraste, mas **não** a saída visual. Uma
mudança sutil em `build/build-tokens.mjs` (ex.: ordem de seletor, perda de
uma var) pode alterar o CSS sem disparar alarme. Cobrir os `preview/*.html`
(que consomem `dist/` real) com screenshots versionados.

> **Nota de escopo:** é a tarefa de menor retorno imediato e maior custo de
> manutenção (baselines). Pode ser adiada para uma 2ª fase se a infra de CI
> não comportar Playwright agora. Mantida no plano por completude.

### Diagnóstico
- `preview/index.html`, `button.html`, `login.html`, `badge.html`,
  `typography.html` consomem `dist/tokens.css` direto (sem Tailwind/build).
- Trocam tema/marca alternando `.dark` / `[data-brand]` no `<html>` (mesma
  mecânica do `App.tsx`).

### Passos

1. **Dep + config na raiz:**
   ```bash
   npm i -D @playwright/test
   ```
   `playwright.config.ts`:
   ```ts
   import { defineConfig } from '@playwright/test'
   export default defineConfig({
     testDir: 'tests/visual',
     webServer: { command: 'npx serve -l 4321 .', port: 4321, reuseExistingServer: !process.env.CI },
     use: { baseURL: 'http://localhost:4321' },
     expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01 } },
   })
   ```

2. **Spec** `tests/visual/previews.spec.ts` — para cada preview × 4 temas
   (alternando `.dark`/`[data-brand]` via `page.evaluate`), `await
   expect(page).toHaveScreenshot()`.

3. **Baselines** geradas **dentro de container Linux fixo** (mesmo da CI)
   para evitar diffs de rendering de fonte entre SOs. Commitar em
   `tests/visual/__screenshots__/`. Adicionar `script test:visual`.

4. **CI** — step após o `build` (precisa do `dist/`):
   ```yaml
   - run: npx playwright install --with-deps chromium
   - run: npm run build && npx playwright test
   - uses: actions/upload-artifact@v4
     if: failure()
     with: { name: playwright-report, path: playwright-report }
   ```

5. **Doc:** como atualizar baselines intencionalmente
   (`npx playwright test --update-snapshots`) — apenas quando a mudança
   visual for desejada e revisada.

### Armadilhas
- **Flakiness de fonte:** gerar baseline e rodar CI no **mesmo** ambiente
  (Ubuntu da Action). Nunca commitar baseline gerada no macOS/Windows.
- Desativar animações na captura (`prefers-reduced-motion` via emulação) e
  esperar `fonts.ready`.
- `dist/tokens.css` precisa existir antes de servir → `npm run build` no
  step.

### Rollback
Aditivo. Reverter remove specs/baselines/step sem afetar o pipeline.

### Definition of Done
- [ ] `npm run test:visual` verde localmente (após `npm run build`).
- [ ] Alterar uma cor de contrato e rodar acusa diff.
- [ ] Baseline atualizável com flag documentada; report sobe como artifact
      em falha no CI.

---

## 8. Tarefa 5 — Versão + aviso de drift nos plugins Figma

### Objetivo
Os `manifest.json` dos plugins **não têm versão** (confirmado: só `name`,
`id`, `api`, `main`, `ui`…). O usuário não percebe quando está com plugin
ou bundle desatualizado. O JSON de variables já carrega
`$schema: 'crp-figma-variables/2'` (export-figma.mjs:503) — alinhar e expor.

### Passos

1. **Versão visível** — adicionar um campo de versão derivado da versão do
   pacote a cada plugin. Como `manifest.json` do Figma não tem campo
   `version` oficial, usar uma constante no `code.js`/`ui.html` (ou injetar
   no build). Exibir discretamente no rodapé da `ui.html` de cada plugin.

2. **Aviso de drift de schema** (plugin de variables) — no `code.js`, ao
   carregar o JSON, comparar `doc.$schema` com o esperado
   (`'crp-figma-variables/2'`) e, se divergir, exibir aviso **não-bloqueante**
   na UI: "bundle gerado para schema X, plugin espera Y — rode
   `npm run export:figma` e recarregue".

3. **Aviso de drift de bundle** (plugin de ícones) — análogo: registrar a
   versão do bundle embutido e avisar se o JSON carregado pelo usuário for
   de versão diferente.

4. **Changelog por plugin** — seção "## Changelog" em
   `figma-plugin/README.md` e `figma-plugin-icons/README.md` registrando
   mudanças de comportamento relevantes.

### Armadilhas
- Não transformar o aviso em erro fatal — é informativo; o plugin deve
  seguir funcionando (graceful degradation).
- Manter a versão em **um** lugar (idealmente lida do `package.json`) para
  não recriar o problema de duplicação da Tarefa 2.

### Rollback
Aditivo (campo + rodapé + checagem condicional). Reverter não afeta a
criação de Variables/Components.

### Definition of Done
- [ ] UI de ambos os plugins mostra a versão.
- [ ] Carregar um JSON de schema/versão divergente dispara aviso visível e
      não-fatal.
- [ ] Changelog presente nos dois READMEs.

---

## 9. Tarefa 6 — Procedimento de sync dos componentes shadcn

### Objetivo
Os ~56 componentes em `app/src/components/ui/` são cópias do shadcn,
sujeitos a drift do upstream. Não há bug — falta **procedimento documentado**
e um guardião leve contra cor hardcoded.

### Passos

1. **Seção em `app/README.md`** — "Atualizando componentes shadcn":
   - regenerar com `npx shadcn@latest add <comp>`;
   - **invariante do DS:** zero cor hardcoded — usar sempre o contrato
     (`bg-primary`, `text-foreground`, `border-border`…). Isso é o que faz
     marca + light/dark funcionarem (ver `App.tsx:25-30`);
   - checklist pós-update: `npm run typecheck` + `npm test` (Tarefa 3).

2. **Baseline de versão** — anotar em `app/components.json` (ou no README) a
   versão/registry do shadcn usada como referência.

3. **(Opcional) Guardião** `app/scripts/check-shadcn-drift.mjs` — varre
   `app/src/components/ui/*.tsx` e alerta se encontrar cor hardcoded
   (`#hex`, `rgb(`, `hsl(`, `oklch(` literal). Espelha a filosofia do lint
   de uso-de-cor já existente em `check.mjs:156-174`. Plugável como script
   npm (`npm run lint:colors`) e, se desejado, no job `app` do CI.

### Armadilhas
- O guardião deve ignorar ocorrências legítimas (ex.: `transparent`,
  `currentColor`, valores em comentários). Começar como **aviso**, não erro,
  para não travar o CI com falsos positivos.

### Rollback
Puramente documental + script opcional. Reverter é inócuo.

### Definition of Done
- [ ] `app/README.md` descreve o procedimento de update + checklist.
- [ ] Versão de referência do shadcn registrada.
- [ ] (Se feito) `npm run lint:colors` aponta qualquer cor hardcoded
      introduzida em `ui/`.

---

## 10. Verificação end-to-end (após cada tarefa e no final)

**Portão local (rodar antes de cada commit):**
```bash
# Pipeline de tokens — deve continuar 100% verde
npm ci
npm run build
npm run check            # contrato + refs + WCAG AA + (Tarefa 2) coerência
npm run export:figma     # gera o JSON (Tarefa 1: agora ignorado pelo git)
npm test                 # testes dos plugins/bundles

# App (Tarefa 3)
cd app && npm ci && npm run typecheck && npm test && cd ..

# Visual (Tarefa 4, se implementada)
npm run build && npm run test:visual
```

**Checagens manuais por tarefa:**
| Tarefa | Como provar que funciona |
|--------|--------------------------|
| 1 | `git status` limpo após `export:figma`; artifact aparece no CI |
| 2 | Inserir `MarcaC-Light` em `$themes.json` sem seletor → `npm run check` falha com "COERÊNCIA…"; (2b) `git diff dist/tokens.css` vazio |
| 3 | `cd app && npm test` verde; abrir `npm run dev` e trocar marca/tema confere comportamento testado |
| 4 | Mudar uma cor de contrato → `npm run test:visual` acusa diff |
| 5 | Carregar plugin no Figma: rodapé mostra versão; JSON antigo → aviso |
| 6 | Introduzir `#fff` num componente `ui/` → `lint:colors` aponta |

**Checkpoints de integração:**
- **Checkpoint A** (pós-1 e 2): push da branch, CI inteiro verde.
- **Checkpoint B** (pós-3 e 4): job `app` e visual verdes no CI.
- **Checkpoint final** (pós-5 e 6): smoke manual dos 2 plugins no Figma +
  app rodando nos 4 temas.

---

## 11. Registro de riscos

| Risco | Prob. | Impacto | Mitigação |
|-------|:-----:|:-------:|-----------|
| Refator 2b muda o `dist/` sutilmente | Média | Alto | Gate de diff byte-idêntico; 2b só mergeia se `git diff dist/` vazio |
| Teste de login flaky pelo `setTimeout` | Média | Médio | Fake timers / `findBy*` com timeout explícito |
| Baselines visuais flaky entre SOs | Alta | Médio | Gerar/rodar no mesmo container Linux; `maxDiffPixelRatio` |
| App CI falha por `dist/` ausente | Média | Médio | `npm run build` na raiz antes do job do app; `css:false` no Vitest |
| Aviso de drift vira erro fatal no plugin | Baixa | Alto | Aviso não-bloqueante, testado com JSON divergente |
| Esquecer changeset na Tarefa 2 | Baixa | Baixo | Checklist de PR; 2 é infra (patch ou sem publish) |

---

## 12. Fora de escopo (notas, não tarefas)

- **DRY dos exportadores de ícones** (`export-lucide`, `export-material`,
  `embed`): refator possível, mas não é bug e tem custo/benefício baixo.
- **Compostos (shadow/typography) viram Styles, não Variables:** tradeoff
  intencional do formato Figma (ver export-figma.mjs:17-20), não dívida.
- **Changesets para o app:** o app é `private`/demo linkado via `file:..`;
  só `@crp/design-tokens` publica. Manter como está.

---

## 13. Entregável deste planejamento

Ao aprovar, o **primeiro artefato** a ser criado é este documento dentro do
repositório, em **`docs/PLANO-SANEAMENTO.md`** (o "arquivo sobre isso"
pedido), versionado na branch `claude/charming-allen-ykfdnf`. Em seguida,
as tarefas 1→6 são executadas na sequência da §2, cada uma com seu commit
atômico e validada pelo portão da §10.
