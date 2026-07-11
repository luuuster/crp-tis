---
name: auditoria
description: Auditoria completa do repo/app com achados VERIFICADOS no código (não hipóteses de agente), relatório arquivado em docs/auditorias/ no padrão datado, e lista priorizada acionável. Use quando o usuário pedir "faça uma auditoria", "procure problemas/bugs/inconsistências" ou "relatório de problemas".
---

# /auditoria — auditar com verificação e arquivar

O ciclo deste repo: auditar → **verificar cada achado** → arquivar datado → transformar em backlog.
A taxa de falso-positivo de agentes é ALTA — achado não-verificado NÃO entra no relatório.

## Passos

1. **Gates primeiro** (baratos e objetivos): raiz `npm run verify`; app `npx tsc --noEmit && npm run
   lint && npm run test`; e2e se o foco for UI. Falhas de gate são achados de prioridade máxima.
2. **Fan-out por área** (subagentes em paralelo, conforme o escopo pedido): front/telas, DS/tokens,
   a11y, i18n, higiene de código, CI/repo. Cada um retorna achados com arquivo:linha.
3. **VERIFICAR cada achado no código** (etapa obrigatória — ler o trecho, reproduzir quando der).
   Refutados são descartados; confirmados ganham evidência (arquivo:linha + por quê).
4. **Classificar**: ALTA / MÉDIA / BAIXA, com correção proposta e critério de aceite por item.
   Respeitar as fronteiras do projeto (mockup por design — ver AGENTS.md §3.7: backend/auth/etc.
   não são achados, são decisões).
5. **Arquivar**: escrever `docs/auditorias/AUDITORIA-<AAAA-MM-DD>-<escopo>.md` no padrão dos
   existentes e atualizar a linha "mais recente" em `docs/README.md`.
6. **Responder** com: veredito em 1 frase, tabela dos confirmados por severidade, o que foi REFUTADO
   (e por quê — evita re-investigação), e a ordem de execução recomendada. NÃO corrigir nada ainda —
   correção é decisão do usuário sobre o relatório.
