# docs/ — instruções de domínio (herda o [AGENTS.md](../AGENTS.md) raiz)

Aqui mora o **registro datado** do projeto — NÃO é onboarding (onboarding = README, PROPOSITO.md,
AGENTS.md raiz e HANDOFF do app). Antes de citar qualquer documento daqui como estado atual,
confira a data no nome/cabeçalho.

## Ciclo de vida documental (toda página tem UMA categoria)

| Categoria | Onde | Regra |
|---|---|---|
| **Vivo/canônico** | README.md, PROPOSITO.md, AGENTS.md, app/HANDOFF.md, crp_plugins/README.md | DEVE refletir o HEAD; mudança arquitetural atualiza na MESMA entrega |
| **Histórico** | `docs/auditorias/`, `docs/planos/`, relatórios datados | Retrato de uma data/commit — **NUNCA reescrever o passado** |
| **Decisão** | seções "decisões" nos vivos + PROPOSITO.md | Registra o PORQUÊ; só muda com nova decisão explícita |
| **Gerado** | `dist/`, JSONs de plugins, bundles | Não editar; nem documentar como se fosse fonte |
| **Referência externa** | `docs/referencias-a11y-ux/` | Consolidação com data de revisão; não é normativo por si |

## Regras locais

1. **Auditoria não se apaga nem se "corrige"**: achado remediado ganha uma **seção de remediação**
   (data + commits) ANEXADA ao relatório original — a evidência fica.
2. Nome de arquivo datado: `TITULO-AAAA-MM-DD.md`, indexado no [README.md](README.md) da pasta.
3. Link relativo SEMPRE (o repo muda de máquina); mover arquivo = revisar quem aponta para ele.
4. Precedência quando textos divergem: AGENTS.md raiz (operacional) > PROPOSITO.md (identidade) >
   README (visão geral) > docs históricos (contexto). Divergência entre vivos é BUG documental —
   corrigir no mesmo PR.
5. Número/contagem em doc vivo (quantos componentes, quantas telas) envelhece: prefira derivar do
   código ou datar a afirmação.
