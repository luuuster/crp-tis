# melhorias-claude.md — diagnóstico do setup (V1)

> **STATUS (2026-07-11): EXECUTADO.** Após aprovação do usuário, os candidatos §1–§8 foram implementados:
>
> | § | Candidato | Entregue como |
> |---|---|---|
> | 1 | Hosts automáticos | skill **`/hosts`** (`.claude/skills/hosts/`) |
> | 2 | Git→main verificado | skill **`/subir`** (`.claude/skills/subir/`) |
> | 3 | CLAUDE.md do repo | **`CLAUDE.md`** + **`AGENTS.md`** (canônico p/ toda IA) + `.cursor/rules/` **versionadas** |
> | 4 | Verify num comando | `npm run verify` na **raiz** (app já tinha) — documentado no AGENTS.md §4 |
> | 5 | Toolkit Figma | **`tools/measure.mjs`** (parametrizado) + §Snippets no agent `figma-web-fidelity` |
> | 6 | Skills fantasma Figma | contorno documentado no **CLAUDE.md** §Figma MCP |
> | 7 | Auditoria com verificação | skill **`/auditoria`** (`.claude/skills/auditoria/`) |
> | 8 | Gate dimensional | **`app/e2e/control-heights.spec.ts`** — 5 telas, escala 24/32/40/44, 5/5 verde |
>
> O §10 (mineração V2 da sessão de 312 MB) segue **pendente** — único item não executado.

> Candidatos a melhoria no setup do Claude Code para este repo, minerados das sessões de trabalho e
> ordenados por impacto. Cada grupo tem: evidência (números reais), veredito
> (**skill nova · automação · correção · nada**) e o candidato proposto.
>
> **Fontes desta V1:** mineração completa da sessão `1cd17eee` (130 MB, 23/jun→11/jul: 259 mensagens
> suas, 181 erros de ferramenta, fluxos quantificados) + a experiência vivida da sessão atual.
> **⏳ V2 (pendente):** minerar a sessão `57c7920f` (312 MB, a era de construção do DS/tokens) — duas
> tentativas caíram (timeout de API e encerramento do processo). Ver §10.

---

## 1. Subir os localhosts sozinho — **AUTOMAÇÃO** · impacto ALTO

**Evidência:** "suba o localhost / suba os hosts" pedido **24×** em 19 dias (é o abridor de quase toda
sessão); o assistente executou o trio de comandos ~50×; **74 notificações** de shells de dev mortos
entre sessões (os Vite morrem quando a sessão fecha e tudo recomeça).

**Candidato:** script `dev:all` (ou skill `/hosts`) que **checa as portas 5172/5173/5174 e sobe só o
que falta**, em background, respondendo com os 3 links prontos. Opcional: hook de SessionStart que faz
isso automaticamente ao abrir sessão neste repo. Elimina o pedido mais frequente do histórico.

## 2. Skill `/subir` (git → main verificado) — **SKILL NOVA** · impacto ALTO

**Evidência:** "suba tudo para o git e para a main" pedido **12×**, sempre a mesma coreografia
(add → commit temático → push franklin → merge main → push → voltar). E **2×** você cobrou depois:
"subiu ok? sem conflitos?" — a verificação pós-push também é sempre a mesma (0 ahead/0 behind nos dois
branches, tree limpo, conteúdo main≡franklin).

**Candidato:** skill `/subir` que executa a coreografia completa **e termina com o placar de
verificação** (o mesmo que hoje é feito à mão), num comando só.

## 3. Criar o `CLAUDE.md` do repo — **CORREÇÃO** · impacto ALTO

**Evidência:** o repo **não tem CLAUDE.md** — todo o conhecimento operacional mora na auto-memória de
UMA instância do Claude. Os erros repetidos provam o custo: **76×** "Edit sem Read antes", **15×**
confusão de cwd (raiz × `app/`), **5×** tsc global errado, e as armadilhas Windows descobertas a custo
nesta sessão (pipe `|` dentro de arg de `npm run` é reinterpretado pelo cmd.exe e mata workers do
Playwright; `npx` resolve playwright do cache stale; `npm ci` com dev server vivo → EPERM no
lightningcss → node_modules corrompido).

**Candidato:** `CLAUDE.md` versionado com: mapa de cwd e comandos canônicos (raiz × app), gotchas
Windows acima, as leis do DS (web manda · medir nunca chutar · token nasce em `tokens/` · verificar
antes de "pronto"), e o fluxo git do repo. *Converge com o
[RELATORIO-REGRAS-E-AGENTS](docs/auditorias/RELATORIO-REGRAS-E-AGENTS-RECOMENDADOS-2026-07-11.md), que
recomenda exatamente uma "instrução raiz" — duas análises independentes chegaram no mesmo lugar.*

## 4. Verificação padrão num comando — **AUTOMAÇÃO leve** · impacto MÉDIO-ALTO

**Evidência:** o ciclo `tsc + lint + test` foi digitado à mão **~60×** (`npx tsc` 71×, `npm run` 91×).
O HANDOFF já menciona um `npm run verify` no app — ou existe e não é usado, ou não existe e deveria.

**Candidato:** garantir/usar `verify` nos dois níveis (raiz = build+check+test; app = tsc+lint+vitest)
e uma skill `/verificar` que escolhe a matriz certa conforme o que mudou (DS, app ou e2e-subset).
Documentar no CLAUDE.md (§3).

## 5. Toolkit de Figma (boilerplate + medição) — **SKILL/BIBLIOTECA** · impacto MÉDIO-ALTO

**Evidência:** 606 chamadas `use_figma`; **190** começam com o mesmíssimo prefixo de navegação de
página; walk-up de parent reescrito 60×; conversor hex→RGB inline 14×; ciclo
`get_screenshot → curl → Read` repetido **104×**; **~30 scripts `measure-*.mjs` quase idênticos**
acumulados no scratchpad (um novo por componente medido).

**Candidato:** (a) um `tools/measure.mjs` **parametrizado e versionado** (url + seletor → rect,
computed styles, cores compostas) no lugar das 30 cópias; (b) snippets canônicos de `use_figma`
(navegação, walk-up, recolor de vetor, dump de Variables) anexados ao agent `figma-web-fidelity`;
(c) usar `node.screenshot()` inline (retorna a imagem na própria chamada — elimina o ciclo curl).

## 6. Skills fantasma do Figma MCP — **CORREÇÃO pequena** · impacto MÉDIO

**Evidência:** **7 falhas** "Unknown skill: figma-use/figma-generate-design" — a instrução do MCP do
Figma manda invocar skills que não estão registradas localmente; o contorno (ler o resource
`skill://figma/...` via ReadMcpResourceTool) foi redescoberto várias vezes.

**Candidato:** instalar o plugin de skills do Figma OU registrar um atalho local; no mínimo, anotar o
contorno no CLAUDE.md (§3) para nunca mais redescobrir.

## 7. Skill `/auditoria` — **SKILL NOVA** · impacto MÉDIO

**Evidência:** você pediu **5 auditorias completas** (06-26, 07-01, 07-07, 07-08, 07-11) e **4×**
colou um relatório de volta no chat para virar backlog manualmente. O ciclo
auditoria → arquivo em `docs/auditorias/` → correções verificadas já é o ritmo do repo — mas é
re-coreografado à mão a cada vez.

**Candidato:** skill `/auditoria` que roda a matriz (gates + agentes por área), **verifica cada achado
no código antes de reportar** (a taxa de falso-positivo dos agentes é alta), arquiva o relatório
datado em `docs/auditorias/` no padrão do repo e emite a lista de achados priorizada e acionável.

## 8. Gate dimensional (o "40px é 40px") — **CORREÇÃO opcional** · impacto MÉDIO-BAIXO

**Evidência:** a bronca mais forte das sessões: *"porque ainda esta na altura de 36px? eu já não disse
que o padrão é 40px? caramba"* — e ela **voltou 4×** (#62, #67, #184, #208), porque nenhum gate mede
dimensão de controle (o e2e mede contraste e foco, não altura).

**Candidato:** um passe no e2e que mede `min-height` dos controles interativos das telas (botões,
selects, inputs) contra os tokens `--button-height-*` e falha fora da escala. Mata a regressão na
origem. (As memórias do Claude já cobrem a regra; o gate cobre os descuidos.)

## 9. O que NÃO precisa de nada — **NADA**

- **Desconfiança do "pronto"** (7+ cobranças "está tudo certo? 100%?"): já virou método — memória
  *verify-before-done* + verificação real em toda entrega. O sinal confirma que deve continuar.
- **Fidelidade web↔Figma**: as memórias e o agent `figma-web-fidelity` já capturam as regras (medir,
  atomic design, re-key, swap/recolor). Reforçado agora pelo `PROPOSITO.md` §6.
- **Sessões gigantes (18 compactions, 6 "continue")**: a memória persistente + PROPOSITO já dão
  continuidade; não vale ferramenta nova. Hábito que ajuda: sessões por tarefa.

---

## 10. ⏳ Lembrete — V2 deste diagnóstico

**Falta minerar a sessão `57c7920f` (312 MB, junho/2026)** — a era de construção do DS (tokens,
plugins, seed de paletas, primeiras auditorias). Duas tentativas de mineração caíram (timeout de API;
encerramento do processo durante retomada). Para a V2:

1. Minerar em **chunks menores** (extração local via script de streaming → analisar só o extrato),
   em vez de um agente único de longa duração.
2. Cruzar os padrões da fase de construção com os desta V1 (a hipótese: os fluxos repetidos eram
   outros — build/check/seed — e devem reforçar os candidatos §3 e §4).
3. Rever a ordenação de impacto com o dataset completo e promover a V2 deste arquivo.

*Artefatos parciais da tentativa: `analyze.mjs` / `corrections.json` / `user_list.txt` /
`patterns.mjs` no scratchpad da sessão `1cd17eee` (podem acelerar a V2 se ainda existirem).*
