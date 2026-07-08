## O que muda

<!-- Resumo em 1–3 frases: o que este PR faz e por quê. -->

## Como testar

<!-- Passos para ver a mudança funcionando (tela/rota/comando). -->

## Checklist

- [ ] `npm run check` verde na raiz (tokens/contraste) — se tocou em `tokens/` ou `build/`
- [ ] `npm run lint && npm run build && npm test` verdes em `app/` — se tocou no app
- [ ] i18n: chaves novas nas 3 línguas (pt-BR / en / es) — o teste de paridade acusa
- [ ] Sem cor/tipografia chumbada (100% tokens) e texto colorido com variante `-text`
- [ ] A11y: rótulos/`aria-*` nas superfícies novas (axe roda nos testes)
