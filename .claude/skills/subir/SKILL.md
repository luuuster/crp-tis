---
name: subir
description: Sobe tudo pro git e pra main com verificação — commit temático, push franklin, merge na main, push, volta pra franklin e reporta o placar (ahead/behind, tree limpo, conteúdo idêntico). Use quando o usuário pedir "suba tudo para o git", "suba para a main" ou variações.
---

# /subir — git → main verificado

Coreografia padrão deste repo (branch de trabalho `franklin`, merge em `main`), terminando SEMPRE com
o placar de verificação — nunca "subiu" sem provar.

## Passos

1. **Inventário**: `git status --short` + `git branch --show-current`.
   - Nada a commitar E nada à frente do origin → reportar "já está tudo no GitHub" com o placar (§4) e parar.
   - Arquivos não-rastreados INESPERADOS (não criados nesta conversa): perguntar antes de incluir.
2. **Commit(s) temático(s)**: agrupar mudanças por tema (não um commitão genérico). Mensagem no padrão
   do repo: `tipo(escopo): resumo` + corpo explicando O PORQUÊ + rodapé
   `Co-Authored-By:` conforme convenção da sessão. O pre-commit roda o doctor — se ele acusar
   corrupção, PARAR e investigar (não contornar).
3. **Subir**:
   ```bash
   git push origin franklin
   git checkout main && git merge franklin --no-edit -m "Merge branch 'franklin' — <resumo>"
   git push origin main
   git checkout franklin
   ```
   Conflito no merge → PARAR e mostrar ao usuário (nunca resolver silenciosamente escolhendo um lado).
4. **Placar de verificação (obrigatório no final)**:
   ```bash
   git status --short                                   # tree limpo?
   git rev-list --left-right --count origin/franklin...franklin   # 0 0?
   git rev-list --left-right --count origin/main...main           # 0 0?
   git diff main franklin --stat | tail -1              # conteúdo idêntico?
   ```
   Reportar em tabela: tree, franklin×origin, main×origin, main×franklin, hashes dos HEADs.

## Regras

- NUNCA force-push; NUNCA `--no-verify`.
- Se o CI da main importa pro contexto, lembrar o usuário de olhar o Actions após o push.
