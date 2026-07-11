# AGENTS.md — orientação canônica para QUALQUER IA neste repositório

> Este arquivo orienta **Claude, Codex, Cursor ou qualquer outro agente** que trabalhe aqui.
> É versionado, revisado por PR e normativo. Leia antes de qualquer mudança.
> Identidade completa do projeto: [PROPOSITO.md](PROPOSITO.md) (o §6 é o mapa mental de quem constrói).

## 1. O que é este projeto (em 3 linhas)

Mockup web navegável de alta fidelidade (TalentAI) + design system real (CRP DS) + espelho **medido**
no Figma. **Dados fictícios, rigor real**: a web define o comportamento renderizado, `tokens/` define
os valores de design, e o Figma reproduz ambos **sem interpretação visual livre**.

## 2. Mapa de autoridade (quem manda em quê)

| Assunto | Fonte da verdade |
|---|---|
| Valores de design (cor, medida, tipo) | `tokens/` (DTCG) — nunca hex/px chumbado |
| Aparência e comportamento reais | a web renderizada (`app/`) — medida, não suposta |
| API dos componentes | `app/src/components/ui/*` (variants/sizes do cva) |
| Figma | **downstream**: reproduz tokens/componentes/medidas da web |
| `dist/`, `*.json` dos plugins, bundles | artefatos GERADOS — nunca editar à mão |
| Produção futura | consumidora dos contratos daqui — **não** é objetivo atual |

## 3. Regras normativas (obrigatórias para TODA IA)

As regras detalhadas vivem em **[`.cursor/rules/`](.cursor/rules/)** — o diretório é do Cursor, mas as
regras são **normativas para qualquer agente** (estão versionadas e este arquivo as incorpora por
referência):

| Regra | Escopo | Quando aplicar |
|---|---|---|
| [`00-proposito.mdc`](.cursor/rules/00-proposito.mdc) | Constituição: propósito, fronteiras, matriz de fontes da verdade | SEMPRE (única always-apply) |
| [`06-accessibility.mdc`](.cursor/rules/06-accessibility.mdc) | **WCAG 2.2 AA integral** + Definition of Done de a11y | SEMPRE que houver UI/a11y |
| [`07-figma-icones-lucide.mdc`](.cursor/rules/07-figma-icones-lucide.mdc) | Ícone no Figma = lucide REAL, instância da lib, tokenizado | SEMPRE que houver ícone indo ao Figma |
| [`08-figma-atomic-design.mdc`](.cursor/rules/08-figma-atomic-design.mdc) | Tela no Figma = instâncias de componentes; faltou → cria antes (Atomic Design) | SEMPRE que criar/reproduzir tela no Figma |
| [`09-figma-fidelity.mdc`](.cursor/rules/09-figma-fidelity.mdc) | Contrato de fidelidade web→Figma: estado controlado, tolerâncias, idempotência | SEMPRE que medir/reproduzir/auditar superfície no Figma |
| [`10-mock-data-i18n.mdc`](.cursor/rules/10-mock-data-i18n.mdc) | Dados fictícios (PII proibida; gate `check:mock`) + 4 línguas | SEMPRE que criar/editar fixture, persona, locale ou teste |

Cada diretório principal tem instruções de domínio próprias — leia o **AGENTS.md local** antes de
mexer lá: [`tokens/`](tokens/AGENTS.md) · [`app/`](app/AGENTS.md) · [`crp_plugins/`](crp_plugins/AGENTS.md) · [`docs/`](docs/AGENTS.md).

E as **leis transversais** (aprendidas a custo — não repita os erros):

1. **Web manda.** Divergiu entre Figma/token/doc e a web renderizada? A web está certa.
2. **Medir, nunca chutar.** Cor/medida vêm do DOM (`getBoundingClientRect`/`getComputedStyle`) ou de
   cálculo sobre tokens (culori) — nunca "de olho" ou de memória.
3. **Token nasce em `tokens/`.** Nunca criar Figma Variable à mão; nunca editar `dist/`. Falta token?
   **PARE e alinhe com o usuário** antes de chumbar valor.
4. **Componente antes da tela.** No Figma, nada de elemento solto desenhado à mão.
5. **Verificar antes de dizer "pronto".** Rodar os gates (§5) e, quando visual, comparar screenshot
   medido. "Deveria funcionar" não é estado final; pendência não-verificável é DECLARADA, não afirmada.
6. **Padrões dimensionais são lei**: controles 40px (md) / 44 (lg) / 32 (sm) / 24 (xs denso);
   ícones 12/16/20/24; rótulo de botão 14px; radius 6. Exceção só documentada.
7. **Mockup por design**: NÃO propor backend, auth real, banco, telemetria de produção. A fronteira
   está em [SECURITY.md](SECURITY.md) e [PROPOSITO.md](PROPOSITO.md) §4.

### Especialistas disponíveis (`.claude/agents/` — read-only quando são auditores)

| Agent | Papel |
|---|---|
| `design-system` | editar/validar tokens, temas, contrato shadcn |
| `token-studio-export` | gerar o bundle de import do Token Studio |
| `figma-web-fidelity` | medir a web e construir/corrigir superfícies no Figma |
| `figma-pipeline-validator` | auditar a cadeia tokens→Variables→ícones→components→telas (drift, keys, idempotência) |
| `frontend-pattern-reviewer` | revisar padrões do app (nível de abstração, CVA, transferível × mock-only) |
| `ux-flow-auditor` | auditar jornadas/fluxos como UX sênior (estados, continuidade, microcopy) |
| `accessibility-auditor` | executar a regra 06 de verdade (gates + inspeção), separando WCAG × convenção |

## 4. Comandos canônicos

| Onde | Comando | O quê |
|---|---|---|
| raiz | `npm run build` | tokens → `dist/` (obrigatório antes do app na 1ª vez) |
| raiz | `npm run verify` | build + check (WCAG fatal) + check:mock (PII) + testes do DS |
| raiz | `npm run check:mock` | gate da regra 10: e-mail só em domínio fictício, CPF válido proibido |
| raiz | `npm run export:figma` / `export:components` / `icons` / `export:ts` / `export:ext` | artefatos dos plugins (`crp_plugins/`) |
| app | `npm run dev` / `dev:candidato` / `dev:mapa` | :5173 recrutador · :5172 candidato · :5174 docs/galeria |
| app | `npm run verify` | lint + vitest + build + e2e (a matriz completa) |
| app | `npm run e2e` | Playwright: axe real + contraste por pixel + foco, nos 4 temas |

## 5. Definition of Done (qualquer entrega)

1. Gates verdes no nível certo (raiz: `verify`; app: `tsc + lint + test`, e2e quando toca UI).
2. A11y conforme a regra 06 (contraste AA nos 4 temas, teclado, semântica, estados).
3. Se visual: screenshot/medição comparados com a web.
4. Se tocou `tokens/`: changeset criado; `export:figma` re-gerado quando relevante.
5. Commits temáticos com mensagem explicando o PORQUÊ; push segue o fluxo do repo
   (branch `franklin` → merge `main`, ambos verificados 0 ahead/0 behind depois).

## 6. Estrutura (onde mexer)

```
tokens/        fonte da verdade dos valores (DTCG)          → tokens/AGENTS.md
build/         compilador + gates (check.mjs, doctor.mjs, check-mock-data.mjs, exporters)
dist/          GERADO — não editar
src/           fontes autoradas da a11y de comportamento (base.css, button.css/js)
app/           TalentAI — consumidor de referência           → app/AGENTS.md
crp_plugins/   4 plugins Figma + extensão Chrome             → crp_plugins/AGENTS.md
docs/          histórico datado — registro, NÃO onboarding   → docs/AGENTS.md
.cursor/rules/ regras normativas 00 + 06–10 (valem para toda IA)
```

## 7. Armadilhas conhecidas (Figma e ambiente)

- **Regenerar a lib de ícones re-keya tudo** (quebra toda referência). Consertar = search + swapComponent.
- **INSTANCE_SWAP perde bind de cor** → recolorir o vetor bindando ao token do contexto.
- **`paint.opacity` é ignorado com cor bindada** → alpha mora NA Variable (`*-10`, `*-90`).
- **`forceMount` no app é deliberado** (a11y de tabs) — não "otimizar".
- Ambiente **Windows**: ver [CLAUDE.md](CLAUDE.md) §Ambiente (gotchas de cmd/npm que já causaram corrupção).
