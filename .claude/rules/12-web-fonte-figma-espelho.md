<!-- GERADO por build/sync-rules.mjs a partir de .cursor/rules/12-web-fonte-figma-espelho.mdc — NÃO EDITAR AQUI.
     Edite o .mdc canônico e rode `npm run sync:rules`. O pretest reprova drift. -->

> **Quando aplicar:** Regra NORMATIVA de PROCEDÊNCIA e FLUXO — a WEB é a fonte da verdade (é onde o sistema existe: cores, gaps, paddings, telas, comportamento), e o Figma é um ESPELHO downstream, cópia fiel e medida da web (finalidade: apresentação a clientes + devs verem as telas), gerado pelos plugins próprios. Fluxo obrigatório: desenvolver na web PRIMEIRO → plugins → Figma. Token Studio está DESCONTINUADO. Exceção: uma PROPOSTA de tela desenhada no Figma (intenção, isenta de fidelidade) que depois vira web e volta como espelho. Aplicar SEMPRE que uma superfície for criada/sincronizada/decidida entre web e Figma.

# 12 — Web é a fonte da verdade · Figma é o espelho (fluxo web → plugin → Figma)

> **Regra normativa.** "DEVE" = obrigatório, "NUNCA" = proibido. Define **procedência e direção**: de
> onde nasce a verdade e como ela chega ao Figma. Complementa a 09 (contrato de fidelidade — o *como*
> medir) e a 08 (tela = instâncias de componentes). O executor é o agente
> [figma-flow-guardian](../../.claude/agents/figma-flow-guardian.md); o construtor do espelho é o
> [figma-web-fidelity](../../.claude/agents/figma-web-fidelity.md).

## 1. Papéis e autoridade

- **A WEB é a fonte da verdade.** O sistema existe de fato em `app/` (renderizado) consumindo
  `tokens/` — é lá que vivem cores, gaps, paddings, telas e comportamento reais. Divergiu? **A web
  está certa** (a origem do valor se corrige na origem — regra 00).
- **O Figma é um ESPELHO downstream**: cópia **fiel e medida** da web, **gerada pelos plugins
  próprios** (`crp_plugins/`). Sua finalidade é **apresentação a clientes** e permitir que **devs
  vejam as telas**. O Figma **NUNCA** é fonte da verdade e **NUNCA** decide um valor de design.
- **Token Studio está DESCONTINUADO.** O plugin próprio (`crp_plugins/figma-plugin`) importa
  Variables/styles direto ao Figma — não há mais motivo para o caminho paralelo. **NUNCA** usar
  Token Studio como via de trabalho (nem "Load from JSON" do `tokens/token-studio/tokens.json`).

## 2. Fluxo padrão (implementação → espelho)

Ordem **obrigatória** para qualquer tela/componente que exista ou vá existir de verdade:

1. **Desenvolver na WEB primeiro** (`app/`), com o padrão do DS (tokens/componentes/a11y).
2. **Gates verdes** (regra 00 §3 / AGENTS.md §5) — a web é o estado válido.
3. **Passar pelos plugins próprios** (`npm run export:figma` / `export:components` / `export:icons` /
   `export:screens`) → importar pelo plugin **CRP DS**.
4. **Duplicar a tela no Figma MEDINDO** a web (regra 09: estado controlado, `tools/measure.mjs`,
   tolerâncias, screenshot dos dois lados). O resultado é o **espelho**.
- Reexecutar é **idempotente**: atualiza o espelho, não duplica (regra 09).

## 3. Exceção — ideação Figma-first (PROPOSTA de intenção)

Você pode **desenhar no Figma primeiro** uma tela NOVA que quer redesenhar — para mostrar **onde**
quer as coisas e **como** imagina. Isso é uma **PROPOSTA**, não o espelho. Os **dois estados** de uma
superfície no Figma:

| Estado | Segue fidelidade (07/08/09/11)? | É fonte da verdade? | Vida |
|---|---|---|---|
| **Espelho** | **SIM** — componentes, pixel-fiel medido, tokenizado, lucide, logo SVG | Não (cópia da web) | permanente, nas páginas "Alta Fidelidade" |
| **Proposta** | **NÃO** — ISENTA | Não (é *brief* de intenção) | **transitória**; vira espelho e é aposentada |

- A proposta é deliberadamente **solta**: pode ser **baixa/média fidelidade** (wireframe de onde as
  coisas ficam) OU **alta fidelidade "na pressa"** (sem a cor/gap certos, elementos à mão). É
  **best-effort** — você tenta se aproximar da web, mas **erros ali são esperados e OK**. Ela mostra
  **intenção, não especificação**, e por isso é **ISENTA das regras 07/08/09/11**.
- **Justamente por ser rascunho (possivelmente "errado") a proposta DEVE ser marcada e isolada**,
  para NUNCA ser confundida com o espelho:
  - vive em página dedicada (ex.: **"Propostas / Rascunho"**) — **NUNCA** nas páginas "Alta Fidelidade";
  - nome com prefixo claro (ex.: **`PROPOSTA:`**).
- **Ciclo de vida obrigatório (o loop só fecha no fim):**
  1. **Proposta** desenhada no Figma (isenta, marcada).
  2. **Web desenvolvida conforme a proposta, mas com o padrão que já existe** — tokens/componentes/
     gaps corretos. **A proposta define o QUÊ/ONDE; o DS define o COMO** (os valores certos).
  3. Pronta e verificada na web → **o espelho medido (regra 09) SUBSTITUI a proposta**.
  4. A **proposta é APOSENTADA** (removida/arquivada). Nenhuma proposta fica órfã.

## 4. Proibido (NUNCA)

- Editar/criar tela à mão no Figma **como se fosse o espelho** (fora do fluxo web→plugin→Figma).
- Usar **Token Studio** como via de trabalho.
- Fazer o **espelho** divergir da web sem passar pela **web primeiro** (bug/ajuste nasce na web).
- Deixar uma **proposta** virar permanente, ser publicada como espelho, ou ser tratada como fonte da
  verdade. Proposta sem loop fechado é drift.
- Criar Figma Variable à mão ou editar `dist/`/bundles gerados (regra 00) — o espelho vem do pipeline.

## 5. Definition of Done (fluxo web → Figma)

- [ ] A tela/mudança existe e está **verde na web** primeiro (não foi "decidida" no Figma).
- [ ] O **espelho** foi gerado pelos **plugins** e **medido** contra a web (regra 09: bate nas tolerâncias).
- [ ] **Token Studio não foi usado** em nenhum passo.
- [ ] Se houve **proposta** Figma-first: estava **marcada/isolada** (página + prefixo), **fora** da
      Alta Fidelidade, e o **loop fechou** (virou web → virou espelho → proposta aposentada). Nenhuma
      proposta órfã.
- [ ] Passou pelo **[figma-flow-guardian](../../.claude/agents/figma-flow-guardian.md)** (fluxo + paridade), read-only.
