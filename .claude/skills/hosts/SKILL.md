---
name: hosts
description: Sobe os 3 dev servers do TalentAI (recrutador :5173, candidato :5172, docs :5174) — só os que estiverem fora do ar — e devolve os links prontos. Use quando o usuário pedir "suba o localhost", "suba os hosts" ou variações.
---

# /hosts — subir os dev servers do TalentAI

Objetivo: deixar os 3 servers de pé SEM duplicar processos, e responder com os links.

## Passos

1. **Checar o que já está de pé** (uma chamada):
   ```bash
   for p in 5173 5172 5174; do (echo > /dev/tcp/127.0.0.1/$p) >/dev/null 2>&1 && echo "$p UP" || echo "$p DOWN"; done
   ```
2. **Para cada porta DOWN**, subir o server correspondente em background (`run_in_background: true`),
   cada um em chamada própria, a partir de `app/`:
   - 5173 → `npm run dev`
   - 5172 → `npm run dev:candidato`
   - 5174 → `npm run dev:mapa`
   Pré-requisito: `dist/` da raiz precisa existir (se `ls ../dist/tokens.css` falhar, rodar antes
   `npm run build` na raiz).
3. **Confirmar**: repetir a checagem de portas até as 3 responderem (dar ~3s aos que subiram agora).
4. **Responder** com a tabela de links:
   - Recrutador → http://localhost:5173
   - Candidato → http://localhost:5172
   - Docs/galeria → http://localhost:5174 (galeria em /componentes)

## Regras

- NUNCA matar processos existentes nas portas — se já está UP, só reporta.
- Se uma porta está ocupada mas não responde como Vite, avisar o usuário em vez de forçar.
- Os processos ficam em background e morrem quando a sessão fecha — é esperado; rodar /hosts de novo.
