<!-- GERADO por build/sync-rules.mjs a partir de .cursor/rules/00-proposito.mdc — NÃO EDITAR AQUI.
     Edite o .mdc canônico e rode `npm run sync:rules`. O pretest reprova drift. -->

> **Quando aplicar:** Constituição do repositório — propósito, fronteiras e matriz de fontes da verdade. É a ÚNICA regra sempre aplicada; as demais (06–12) disparam por contexto. Orienta qualquer IA (Claude, Codex, Cursor) antes de qualquer mudança.

# 00 — Propósito, fronteiras e fontes da verdade

> Versão operacional curta de [PROPOSITO.md](../../PROPOSITO.md) e [AGENTS.md](../../AGENTS.md)
> (que detalha leis, comandos e Definition of Done). Divergiu daqui? O AGENTS.md manda.

## 1. O que é (e o que NÃO é)

- **Mockup web navegável de alta fidelidade** (TalentAI) + design system real (CRP DS) + espelho
  **medido** no Figma. **Dados fictícios, rigor real.**
- "É só mockup" NUNCA justifica UI de baixa qualidade — front/UX/a11y têm rigor de produção.
- **NUNCA** introduzir backend, banco, auth real, telemetria ou infra de produção por iniciativa
  própria (fronteira em [SECURITY.md](../../SECURITY.md) e PROPOSITO.md §4).
- **NUNCA** usar dados reais de pessoas (regra 10). O repositório é público.
- Decisões deliberadas não são bugs a "corrigir": dados mock, ausência de backend, `forceMount`
  nas tabs, ícones brancos na lib do Figma. Na dúvida, PARE e pergunte.

## 2. Matriz de fontes da verdade (por domínio)

```text
tokens/ (DTCG)          → valores de design (cor, medida, tipo) — nunca hex/px chumbado
componentes + CVA       → API de variantes/tamanhos (app/src/components/ui/*)
WEB (DOM renderizado)   → FONTE DA VERDADE do sistema: aparência/medida/comportamento (medir, nunca supor)
fluxo/página + docs     → intenção de UX
Figma                   → ESPELHO downstream: cópia MEDIDA da web via plugins (p/ clientes/devs) — nunca fonte
Token Studio            → DESCONTINUADO — o plugin próprio importa Variables/styles direto (regra 12)
dist/, JSONs de plugin  → GERADOS — nunca editar, nunca fonte
```

**Resolução de conflito:** (1) identifique o domínio da divergência; (2) consulte a fonte DAQUELE
domínio; (3) corrija a origem, nunca o artefato; (4) regenere o downstream; (5) meça de novo.
"Web manda" significa que o RENDERIZADO ganha de Figma/doc — não que um bug da web deva ser
copiado para os tokens: bug se corrige na origem dele.

**Fluxo web → Figma:** desenvolve-se na WEB primeiro → plugins próprios → Figma (espelho medido, p/
apresentação a clientes/devs). O contrato completo — incluindo a exceção da PROPOSTA Figma-first
(intenção, isenta de fidelidade) que depois vira web e volta como espelho — é a **regra 12**.

## 3. Antes de dizer "pronto"

Gates verdes no nível certo (raiz `npm run verify`; app `tsc + lint + test`, e2e quando toca UI) e,
se visual, screenshot/medição comparados com a web. Pendência não-verificável é DECLARADA, não
afirmada. Detalhes: AGENTS.md §5.
