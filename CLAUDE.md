# CLAUDE.md — entrada do Claude Code neste repo

@AGENTS.md

> O arquivo acima ([AGENTS.md](AGENTS.md)) é a orientação canônica (identidade, autoridade, regras
> normativas 06/07/08, DoD). O que segue é o operacional específico do Claude Code nesta máquina.

## Ambiente (Windows) — gotchas que JÁ causaram estrago

- **Nunca use `|` dentro de argumento de `npm run`** (ex.: `npm run e2e -- --grep "A|B"`): o cmd.exe
  reinterpreta o pipe e mata os workers do Playwright com erros fantasma. Use o binário direto:
  `node node_modules/playwright/cli.js test --grep "A|B"` (bash passa o argv intacto ao node).
- **Não use `npx playwright`** — resolve uma cópia STALE do cache do npx (`ERR_MODULE_NOT_FOUND`
  intermitente). Sempre o binário local (`npm run e2e` ou `node node_modules/playwright/cli.js`).
- **Não rode `npm ci` no `app/` com dev server Vite vivo**: o `lightningcss.node` fica travado →
  EPERM no meio da remoção → `node_modules` corrompido (sem `.bin/`, sem pacotes). Se acontecer:
  `npm install` REPARA (incremental, não deleta o que está travado); `npm ci` só com servers parados.
- **cwd importa e confunde**: a raiz (`crp_ds/`) e o app (`crp_ds/app/`) são pacotes DIFERENTES.
  Prefixe os comandos com `cd` explícito; `tsc`/`eslint`/`vitest` são do app, `check`/`doctor`/
  exporters são da raiz.
- **Read antes de Edit, sempre** (76 falhas históricas por pular isso). Para substituição de 1 linha
  já conhecida, `sed -i` é aceitável.

## Figma MCP

- Antes de `use_figma`: a skill `figma-use` NÃO está registrada localmente — leia o resource
  `skill://figma/figma-use/SKILL.md` via `ReadMcpResourceTool` (server `claude.ai Figma`) e passe
  `skillNames: "resource:figma-use"`.
- `setCurrentPageAsync` no MÁXIMO 1× por chamada; multi-página = chamadas paralelas.
- Screenshot: use `await node.screenshot()` INLINE (retorna a imagem na resposta) — não use o ciclo
  get_screenshot → curl → Read.
- Snippets canônicos (navegação, recolor de vetor, walk-up, dump de Variables): ver
  [.claude/agents/figma-web-fidelity.md](.claude/agents/figma-web-fidelity.md) §Snippets.
- Medição de DOM parametrizada: `node tools/measure.mjs <url> <seletor...>` (não recriar scripts).

## Fluxos prontos (skills do projeto)

- **/hosts** — sobe os 3 dev servers que estiverem fora do ar e devolve os links.
- **/subir** — coreografia git completa (commit → franklin → merge main → push) + placar de verificação.
- **/auditoria** — auditoria com verificação de achados + arquivamento em `docs/auditorias/`.

## Memória

O Claude mantém auto-memória em `~/.claude/projects/.../memory/` (aprendizados de sessão). Regras
duradouras do PROJETO pertencem AQUI (CLAUDE.md/AGENTS.md/rules) — a memória é da instância, o repo
é de todos. Ao descobrir uma regra nova que vale para qualquer agente, promova-a para cá via PR.
