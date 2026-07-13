# Auditoria completa do repositório — Cursor

**Data:** 12/07/2026  
**Escopo:** repositório inteiro (`crp_ds`) — tokens/DS, app TalentAI, plugins Figma, CI, governança, a11y, i18n, higiene  
**Método:** gates executáveis → fan-out por área → verificação de cada achado no código (arquivo:linha)  
**Agente:** Cursor (Auto)

---

## Veredito (1 frase)

O repositório está **saudável e acima da média** — todos os gates locais passaram (raiz + app + 131 e2e) — com achados reais mas **nenhum bloqueador de demonstração**; o principal débito é persona inconsistente em `EntrevistasIA`, WIP não commitado da remoção de `preview/`, e contradição documental LICENSE × SECURITY.

---

## Gates executados (esta sessão)

| Gate | Resultado |
|---|---|
| Raiz `npm run verify` (build + check + check:mock + 139 testes DS) | ✅ |
| App `tsc --noEmit` | ✅ |
| App `npm run lint` | ✅ |
| App `npm run test` (211 testes Vitest) | ✅ |
| App `npm run e2e` (131 testes Playwright: axe + contraste pixel + foco) | ✅ 131/131 |

---

## Achados confirmados

### ALTA

Nenhum achado ALTA verificado nesta sessão. Type-safety, lint, PII (`check:mock`), contraste e axe estão verdes localmente.

### MÉDIA

| # | Achado | Evidência | Correção proposta | Aceite |
|---|---|---|---|---|
| M1 | **Persona inconsistente entre telas** (regra 10 §2) — Diego e Jair divergem em `EntrevistasIA` vs Pipeline/Candidatos | `EntrevistasIA.tsx:135-136` ("Diego Teste 2", "Jair Gonçalves") · `pipeline/data.ts:65-66` ("Jair Carmona", "Diego Teixeira") · `candidatos/types.ts:41-42` (e-mails `jair.carmona@`, `diego.teixeira@`) · e2e ainda referencia "Diego Teste 2" em `contrast.spec.ts:72` | Alinhar nomes/e-mails com o banco canônico (`candidatos/types.ts`); atualizar e2e | Mesma pessoa = mesmo nome/e-mail em Pipeline, Candidatos, EntrevistasIA e e2e |
| M2 | **LICENSE contradiz SECURITY e regra 00** sobre visibilidade do repo | `LICENSE:3` ("privado") · `SECURITY.md:3` ("PÚBLICO") · `.cursor/rules/00-proposito.mdc:19` ("repositório é público") | Unificar: LICENSE proprietário **mas** repo público no GitHub (texto explícito) OU tornar repo privado de fato | Um único texto canônico; sem contradição entre LICENSE, SECURITY e regra 00 |
| M3 | **WIP não commitado** — remoção de `preview/` + `audit-dark.mjs` + ajustes correlatos | `git status` (16 arquivos M/D no início da sessão): `preview/*.html`, `build/audit-dark.mjs`, `package.json`, CI, README, regras 06 | Commit atômico com deletes + atualizações de script/CI/docs | `npm run verify` verde no commit; grep sem refs quebradas a `preview/` ou `audit:dark` |
| M4 | **`check.mjs` não valida resolução de `var()` nos artefatos a11y shippados** — só regex de presença | `build/check.mjs:108-154` (A11Y_ARTIFACTS por regex) vs `:236-239` (resolve só em `dist/tokens.css`) | Estender gate para resolver refs em `dist/base.css` e `dist/components/*` | Typo em token no CSS do botão reprova o build |
| M5 | **Escopo `@crp` incompatível com owner `luuuster` para GitHub Packages** (documentado, não resolvido) | `package.json:2,11` · `.npmrc:5` · `README.md` §Publicação | Renomear escopo OU remover promessa de publish | Estratégia explícita e coerente com consumo `file:..` |

### BAIXA

| # | Achado | Evidência | Correção |
|---|---|---|---|
| B1 | `surface-ring` com hex+alpha baked em vez de `color-mix` sobre primitivo | `tokens/mode/light.json:108` · `tokens/mode/dark.json:106` | Migrar para `color-mix` ou documentar exceção no `tokens/AGENTS.md` |
| B2 | Rótulos PT chumbados em chrome de vaga pública | `app/src/lib/vaga.tsx:94-117` | i18n ou decisão documentada de "prosa mock só em PT" |
| B3 | Lacunas de teste em `masks.ts` e `password.ts` | arquivos sem `*.test` | Testes unitários baratos |
| B4 | `aria-label` fixo em inglês em primitivas shadcn | `sidebar.tsx:287`, `spinner.tsx:9`, etc. | i18n ou override no app |
| B5 | Comentários/docs stale pós-remoção de `preview/` | `build/build-tokens.mjs:231` · `docs/PLANO-SANEAMENTO.md:399-407` · `docs/auditorias/VISTORIA-2026-07-08-repo.md:78` | Atualizar ou marcar histórico |
| B6 | PR template incompleto vs matriz real de CI | `.github/PULL_REQUEST_TEMPLATE.md` vs workflow | Listar doctor, check:mock, e2e, sync:rules |
| B7 | `app/package.json` sem campo `bugs` (raiz tem) | `app/package.json` | Alinhar metadados |

---

## Refutados (não entrar no backlog)

| Hipótese | Por quê refutado |
|---|---|
| E2E vermelho / 32 falhas (relatório 11/07 Codex) | **131/131 passaram** nesta sessão (`npm run e2e`, ~11 min) |
| Gmail / PII real no app | `grep @gmail` em `app/` → 0; `check:mock` OK em 272 arquivos |
| Refs quebradas pós-delete de `preview/` no working tree | Grep em código ativo (`*.mjs,*.json,*.yml,*.ts,*.tsx`) → sem `preview/` ou `audit:dark` quebrado; `check.mjs:184` usa `src/` |
| Backend/auth simulado = bug | **Decisão deliberada** (mockup por design — AGENTS.md §3, SECURITY.md) |
| `forceMount` nas tabs = bug | **Decisão deliberada** (a11y — app/AGENTS.md) |
| CI do app ausente | Workflow único com jobs `build`, `app`, `e2e` (`.github/workflows/build-tokens.yml`) |

---

## Áreas LIMPAS (verificadas)

- **Design system:** build 4 temas, 797 declarações, contraste AA fatal no `check.mjs`, sync-rules espelho em dia (6 regras).
- **Segurança mock:** e-mails só `@example.com` / `@talentai.com`; sem CPF válido.
- **i18n:** 16 namespaces × 4 línguas; `parity.test.ts` passando.
- **A11y automatizada:** axe estrutural, contraste por pixel nos 4 temas, foco visível — tudo verde no e2e.
- **Plugins Figma:** 139 testes no pacote raiz cobrindo pure functions dos 4 plugins + extensão.
- **Higiene:** sem TODO/FIXME reais; sem segredos óbvios; `dist/` e artefatos gerados gitignored.

---

## Ordem de execução recomendada

1. **M3** — commit atômico do WIP `preview/` + `audit-dark` (desbloqueia estado limpo).
2. **M1** — alinhar personas EntrevistasIA + e2e.
3. **M2** — resolver LICENSE × SECURITY × regra 00 (1 parágrafo cada).
4. **M4** — gate de `var()` nos artefatos a11y (proteção contra regressão silenciosa).
5. **M5** — decisão publish vs `file:..` only.
6. **B1–B7** — higiene incremental.

---

## Relação com auditorias anteriores

- [VISTORIA-2026-07-08-repo.md](VISTORIA-2026-07-08-repo.md) — maioria dos itens B1–B8 **já remediados** (CODEOWNERS, SECURITY.md, editorconfig, etc.).
- [AUDITORIA-2026-07-11-completa.md](AUDITORIA-2026-07-11-completa.md) — útil para contexto de deploy/produção; **e2e e gmail refutados** nesta sessão; itens de produção (auth real, backend) permanecem como fronteira, não como bugs.
