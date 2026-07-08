# Vistoria do repositório — nível "profissional"

**Data:** 08/07/2026 · **Escopo:** o repositório inteiro (`crp_ds`) — git, CI/CD, governança, documentação, configs, dependências, segurança e higiene. O código do app já tem relatório próprio ([AUDITORIA.md](AUDITORIA-2026-07-04-app.md), corrigido em 04/07).
**Método:** inspeção determinística (git, npm audit, CI, hooks, configs, scripts, README×realidade) — cada achado verificado no repo.

> ## ✅ Status: ajustes aplicados (08/07/2026)
> **1.1** — o README §Publicação já documentava o estado (private:true = publish no-op, consumo via `file:..`); o placeholder do [.npmrc](../../.npmrc) foi resolvido com o requisito escopo=owner registrado. **1.2** — doctor refinado: truncamento agora exige corte no MEIO de linha (deleção até fronteira limpa = edição legítima) + bypass granular `DOCTOR_ALLOW` (testado nos 3 cenários). **1.3** — criados [CODEOWNERS](../../.github/CODEOWNERS), [PULL_REQUEST_TEMPLATE](../../.github/PULL_REQUEST_TEMPLATE.md) e [SECURITY.md](../../SECURITY.md) (branch protection fica na UI do GitHub). **1.4** — [LICENSE](../../LICENSE) proprietária + `license` no app. **1.5** — `npm audit fix`: raiz com **0 vulnerabilidades**. **1.6** — quickstart do README com os 3 apps (:5173/:5172/:5174).
> **B1** engines alinhadas (>=22) · **B2** author/repository/bugs preenchidos · **B3** `fetch --prune` + `fetch.prune=true` (30→12 refs; as restantes são PRs reais do dependabot) · **B4** auditorias consolidadas em `docs/auditorias/` · **B5** [.editorconfig](../../.editorconfig) criado (Prettier deliberadamente não adotado — estilo via ESLint) · **B6** meta description nos 3 HTMLs · **B7** resolvido com 1.1 · **B8** SECURITY.md.
> **Pendente (fora do repo):** branch protection na `main` (Settings → Branches: exigir CI verde + review de Code Owner) e merge/fechamento dos PRs abertos do dependabot.

---

## Veredito geral

O repositório está **bem acima da média** em profissionalismo. O que costuma faltar em projetos reais, aqui existe e funciona:

- **CI com 3 jobs paralelos** ([build-tokens.yml](../../.github/workflows/build-tokens.yml)): tokens (build + doctor + check de contrato/contraste WCAG + audit dark `--strict` + `npm audit` + testes dos plugins), **app** (lint + tsc/build + 211 testes Vitest com axe) e **e2e** (Playwright com axe REAL renderizado, contraste por pixel, screenshots como artefato).
- **Dependabot** configurado com grupos por família de peer-dependency e limite de PRs — config comentada e pensada.
- **Hook anti-corrupção** (`.githooks/pre-commit` + `build/doctor.mjs`) documentado em [docs/PROTECAO-CORRUPCAO.md](../PROTECAO-CORRUPCAO.md).
- **Zero segredos** no código, **zero artefato gerado rastreado** (dist/, test-results/, bundles de ícone — tudo no .gitignore, com comentário de como regenerar), **zero TODO/FIXME** pendente, **zero script morto** em `build/` (todos os ~20 .mjs são referenciados).
- `.gitattributes` completo (LF normalizado, binários protegidos), `packageManager` pinado (npm@11.11.0), commits em **conventional commits** consistentes, `docs/` com 15 documentos vivos, README de 16 KB com quickstart, a11y e publicação.

Os achados abaixo são o que separa "muito bom" de "impecável". **Nenhum é grave.**

---

## 1. Severidade MÉDIA

### 1.1 Pipeline de release configurado, mas inoperante
O repo promete publicação em GitHub Packages (README §"Publicação", CI com changesets/action, script `release`), mas:
- O escopo **`@crp`** não bate com o dono do repo (**`luuuster`**/crp-tis) — GitHub Packages **exige** escopo = owner; um `changeset publish` real falharia. O próprio [.npmrc](../../.npmrc) ainda tem o comentário-placeholder *"Troque @crp pelo escopo da sua org"*.
- Versão eterna em `0.0.0`, **nenhuma tag**, **nenhum changeset** jamais criado — o mecanismo nunca rodou.

**Correção:** decidir e executar um dos dois caminhos: (a) renomear o escopo para `@luuuster/*` (ou transferir o repo para uma org `crp`) e cortar a primeira release com changeset + tag; ou (b) remover a promessa de publicação do README/CI e assumir consumo por `file:..` (que é o que o app usa e funciona).

### 1.2 Falso positivo conhecido no pre-commit (doctor)
A heurística do [doctor.mjs](build/doctor.mjs) acusa "truncamento" quando **o disco é prefixo do HEAD** — mas apagar código legítimo do fim de um arquivo produz exatamente essa assinatura. Já aconteceu de verdade (commit de `candidaturas.ts` bloqueado, contornado com `--no-verify`, que desliga o hook INTEIRO).
**Correção:** (a) só acusar quando o corte cai no **meio de linha/palavra** (truncamento real raramente termina em `\n` limpo); (b) oferecer bypass granular documentado (ex.: `DOCTOR_ALLOW=caminho npm run doctor`) para não incentivar `--no-verify`.

### 1.3 Governança de PR/branch inexistente
Não há `CODEOWNERS`, `PULL_REQUEST_TEMPLATE.md`, `ISSUE_TEMPLATE/`, nem indício de branch protection; o fluxo `franklin → main` é merge direto sem revisão formal. Para 1 pessoa é tolerável, mas "repo profissional" pede pelo menos: CODEOWNERS (1 linha), template de PR e branch protection na `main` exigindo o CI verde.

### 1.4 Licenciamento inconsistente
Raiz declara `"license": "UNLICENSED"` (correto para privado), mas **[app/package.json](../../app/package.json) não tem campo `license`** e não existe arquivo `LICENSE`/aviso de proprietário.
**Correção:** `"license": "UNLICENSED"` também no app + (opcional) um `LICENSE` curto "proprietário — todos os direitos reservados".

### 1.5 Vulnerabilidade moderada na raiz (fix disponível)
`js-yaml` (DoS de complexidade quadrática) via devDependency do changesets — `npm audit fix` resolve. O CI aceita moderates de propósito (gate em high+, com justificativa em comentário no workflow), o que é uma política válida, mas o fix é grátis.

### 1.6 README principal não cobre o produto inteiro
O quickstart só sobe o recrutador (**:5173**); o portal do candidato (**:5172**, `dev:candidato`) e o hub de docs (**:5174**, `dev:mapa`) não aparecem no README da raiz (o [app/README.md](../../app/README.md) existe, mas o principal é a porta de entrada). Também não há screenshot/GIF — um repo vitrine merece.

---

## 2. Severidade BAIXA

| # | Achado | Correção |
|---|---|---|
| B1 | **Engines divergentes**: raiz exige `node >=22`, app `>=20` (CI roda 22 nos dois). | Alinhar ambos em `>=22`. |
| B2 | **Metadados de pacote incompletos**: sem `author`, `repository`, `bugs` nos dois package.json. | Preencher (`repository: github:luuuster/crp-tis`). |
| B3 | **~25 refs stale de dependabot** no clone local (`git remote prune origin --dry-run` lista; não são PRs abertos). | `git fetch --prune` + `git config fetch.prune true`. |
| B4 | **Relatórios de auditoria espalhados**: 7 `AUDITORIA-*.md` em docs/ + `AUDITORIA.md` e `VISTORIA.md` na raiz. | Consolidar em `docs/auditorias/` com convenção `AAAA-MM-DD-escopo.md`; raiz fica só com README. |
| B5 | **Sem `.editorconfig` e sem formatter** (estilo mantido só por ESLint + disciplina). | `.editorconfig` mínimo (indent/eol/charset); Prettier é opcional — se entrar, com `eslint-config-prettier`. |
| B6 | **HTMLs sem `<meta name="description">`** (index/candidato/mapa têm título + favicon + lang; o `lang` estático é ok — o runtime troca via i18n). | Adicionar description curta por página. |
| B7 | **`.changeset/` presente porém nunca usado** (consequência do item 1.1). | Resolver junto com 1.1 — usar de verdade ou remover. |
| B8 | **Política de vulnerabilidade só em comentário de workflow**. | Um `SECURITY.md` de 5 linhas registrando o gate (falha em high+; moderates avaliados caso a caso). |

---

## 3. O que foi verificado e está LIMPO ✅

- **Segredos**: nenhum token/chave/senha em código, configs ou workflows (scan por padrões). `.npmrc` sem credencial (auth via `GITHUB_TOKEN` do CI).
- **Artefatos**: nada gerado está rastreado — `dist/`, `test-results/`, `playwright-report/`, bundles de ícones, exports do Figma: todos ignorados **com comentário de como regenerar**.
- **CI cobre o repo inteiro**: tokens + app (lint/tsc/testes) + e2e com axe renderizado — a suspeita de "app sem gate de CI" foi **refutada** lendo o workflow.
- **build/*.mjs**: 0 scripts órfãos, 0 referências quebradas (cruzei scripts npm × arquivos × imports).
- **TODO/FIXME/HACK**: 0 reais (as 123 ocorrências do grep ingênuo eram "TODO o fluxo" em português).
- **Histórico git**: conventional commits (`feat(app): …`) consistentes, mensagens descritivas em pt-BR.
- **Pastas da raiz** que pareciam órfãs são todas parte do DS e referenciadas: `src/` (a11y + componentes do pacote), `preview/` (páginas que o `check.mjs` varre), `integration/react`, `crp-editor-extension/` (com README próprio), `token-studio/` (gerada, ignorada).
- **`.gitignore`/`.gitattributes`**: completos e comentados.
- **npm audit no app**: 0 vulnerabilidades.

---

## 4. Roadmap sugerido (ordem de valor)

1. **1.2** — corrigir a heurística do doctor + bypass granular (evita o próximo `--no-verify`).
2. **1.5** — `npm audit fix` na raiz (1 comando).
3. **1.4 + B1 + B2** — licença, engines e metadados (um commit de package.json).
4. **1.3** — CODEOWNERS + template de PR + branch protection na main.
5. **1.6** — README: quickstart com os 3 apps + 1 screenshot.
6. **1.1/B7** — decidir o destino da publicação (escopo certo + primeira release, OU remover).
7. **B3–B6, B8** — higiene final (prune, consolidar auditorias, editorconfig, meta description, SECURITY.md).
