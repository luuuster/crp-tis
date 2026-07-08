# Auditoria — CRP Design System
### 2026-06-10 · rev. 4 · dimensões novas: CVEs, DOM renderizado (axe), mutação dos gates, build de produção, cantos nunca auditados

> Base: `main` em `7d0cf3c` (pós-merge). Métodos novos desta rodada — nada aqui repete análise estática
> já feita nas revs. 1–3.

## Veredito

O núcleo continua impecável — e agora com provas mais fortes: **os gates de qualidade foram testados
por mutação (4/4 quebras propositais detectadas)** e **0 vulnerabilidades em dependências de
produção**. A rodada encontrou **9 itens novos**, todos pequenos: 3 de acessibilidade em DOM
renderizado (a dimensão que as auditorias anteriores declaradamente não cobriam), 1 CVE em
dependência de build, e 5 de manutenção/DX.

## O que foi provado nesta rodada

| Dimensão nova | Resultado |
|---|---|
| Mutação M1: ref de token quebrada | ✅ gate falhou como devia |
| Mutação M2: var de contrato removida | ✅ gate falhou como devia |
| Mutação M3: borda outline enfraquecida (1.4.11) | ✅ gate falhou como devia |
| Mutação M4: tinta soft acima do teto AA | ✅ gate falhou como devia |
| `npm audit` produção (raiz e app) | ✅ 0 vulnerabilidades |
| `vite build` produção do app | ✅ compila (ver achado 5) |
| axe-core: App, LoginPage, RegisterPage | ✅ 0 violações |
| Manifests dos 2 plugins Figma | ✅ corretos (networkAccess "none", dynamic-page) |

## Achados novos

### 🟡 1. axe `serious`: Progress sem nome acessível (Dashboard e Showcase)
`Dashboard.tsx:116` (`<Progress value={t.pct} />`, 3 instâncias) e `Showcase.tsx:169` — leitor de
tela anuncia "barra de progresso" sem dizer *do quê*. WCAG 4.1.2.
**Fix:** `aria-label` (ex.: `aria-label={\`Progresso de ${t.nome}\`}`) ou `aria-labelledby` apontando
para o texto adjacente.

### 🟡 2. axe `serious`: Slider sem nome acessível (Showcase)
`Showcase.tsx:173` (`<Slider defaultValue={[40]} …>`) — input ARIA sem rótulo. WCAG 4.1.2.
**Fix:** `aria-label="Exemplo de slider"` (ou label visível com `aria-labelledby`).

### 🟡 3. axe `moderate`: salto de heading no Showcase (h1 → h3)
O `AccordionTrigger` (shadcn) renderiza `<h3>`; a página tem `<h1>` (Showcase.tsx:55) e as seções
não têm `<h2>`, então a hierarquia pula um nível. WCAG 1.3.1 / boas práticas.
**Fix:** dar `<h2>` aos títulos de seção do Showcase, ou ajustar o nível do Accordion.

### 🟡 4. CVE high em dependência de BUILD: `expr-eval-fork` via `@tokens-studio/sd-transforms` 1.2
`npm audit`: GHSA-jc85-fpwf-qm7x (eval sem restrição de funções). **Só atinge devDependencies** — o
código roda no SEU build, com input controlado (seus tokens), então o risco prático é baixo; mas
"profissional" inclui CI de auditoria limpo. **Fix:** subir para `sd-transforms@2.0.3` (major). Como
é breaking, validar com o gate completo + diff do dist (mesma técnica de neutralidade da rev. 3).

### 🔵 5. Bundle de produção > 500 kB num chunk único
`vite build` avisa: recharts + radix + páginas num só chunk. Para demo é ok; para produção, lazy:
`const Dashboard = lazy(() => import('./pages/Dashboard'))` (e Showcase) corta o chunk inicial pela
metade.

### 🔵 6. `app/scripts/shot.mjs` depende de `playwright-core` que NÃO está nas devDependencies
Em máquina nova o script quebra com "Cannot find module". Não é referenciado em nenhum script npm.
**Fix:** adicionar `playwright-core` às devDeps do app (ou documentar `npm i -D playwright-core`
no comentário do script).

### 🔵 7. `preview/_editor.js`: listeners de `document` não são removidos no fechar
`mouseover/click/keydown/mousemove/mouseup` (linhas 190–301) persistem após `close` (linha 309), e
`__crpEditor=false` permite reinjetar → handlers duplicados (undo duplo, seleção dupla). Inofensivo
no uso normal (handlers ficam inertes); é robustez. **Fix:** registrar com `AbortController` e
`signal`, abortando no close.

### 🔵 8. `.cursor/rules/` existe no disco mas NÃO está no git
A regra de acessibilidade do Cursor não é versionada — um colaborador novo não a recebe. Decida:
commitar (recomendado, é convenção do projeto) ou adicionar `.cursor/` ao `.gitignore` (se for
preferência pessoal).

### 🔵 9. `docs/PLANO-SANEAMENTO.md` desatualizado
As 6 tarefas do plano foram executadas hoje, mas o documento segue fraseado como dívida aberta.
**Fix:** banner "✅ concluído em 2026-06-10 (ver AUDITORIA-rev2/rev3)" no topo, ou arquivar.

## Falsos positivos descartados nesta rodada

"Showcase quebra sem TooltipProvider" (o App.tsx:34 provê globalmente — comportamento correto);
"manifest sem version" (manifests do Figma não usam campo version — é gerenciado na publicação);
"2 memory leaks críticos no _editor.js" (rebaixado: os listeners ficam inertes; virou o achado 7,
baixo); RadioGroup do Showcase (têm `<label htmlFor>` corretos — axe não os acusou).

## Conclusão

A pirâmide inverteu: as primeiras auditorias acharam problemas de arquitetura e validação; esta só
achou rótulos ARIA faltando em 2 páginas demo, um CVE de build com upgrade conhecido e itens de
polimento. Os 4 testes de mutação provam que o sistema de validação não é decorativo — quebras
reais são barradas no build. Corrigidos os itens 1–3 (são ~6 linhas no total) e o 4 (um bump com
gate), o repositório fica sem nenhum problema conhecido em **nenhuma** das dimensões auditadas:
estática, valores, execução, dependências, DOM renderizado e mutação.
