<!-- GERADO por build/sync-rules.mjs a partir de .cursor/rules/09-figma-fidelity.mdc — NÃO EDITAR AQUI.
     Edite o .mdc canônico e rode `npm run sync:rules`. O pretest reprova drift. -->

> **Quando aplicar:** Contrato de fidelidade web → Figma — transforma "pixel-fiel" em critérios VERIFICÁVEIS (estado controlado, medição de DOM, tolerâncias declaradas, screenshot dos dois lados, idempotência) + AUDITORIA PROFUNDA por nó antes de "pronto" (0 cor crua inclusive DENTRO de instâncias, componentes, slots ocultos e vetores de ícone). Aplicar sempre que uma superfície da web for reproduzida, corrigida ou auditada no Figma.

# 09 — Contrato de fidelidade web → Figma

> **Regra normativa.** "Pixel-fiel" não é impressão — é um contrato mensurável. Complementa as
> regras 07 (ícones lucide), 08 (telas por instâncias) e **12** (procedência/fluxo web→plugin→Figma;
> o Figma é ESPELHO). O executor de referência é o agent
> [figma-web-fidelity](../../.claude/agents/figma-web-fidelity.md), com revisão do
> [figma-flow-guardian](../../.claude/agents/figma-flow-guardian.md).

## 1. Estado controlado ANTES de medir

- **Viewport declarado** (padrão 1440px de largura), **tema declarado** (marca × light/dark) e
  **estado declarado** (logado? overlay aberto? qual rota?). Medição sem esses 3 é inválida.
- Fontes carregadas (`document.fonts.ready`) e animações assentadas antes de capturar.
- A mesma superfície DEVE ser capturada dos DOIS lados (screenshot web + screenshot Figma).

## 2. Como medir (nunca "no olho")

- Medidas: `getBoundingClientRect` · estilos: `getComputedStyle` — via `node tools/measure.mjs
  <url> <seletor...>` (parametrizado; não recriar scripts descartáveis).
- Cores: RESOLVIDAS e COMPOSTAS (OKLCH→sRGB via canvas/culori; alpha composto sobre o fundo real).
  No Figma, cor entra **bindada à Variable** do token — nunca hex solto (alpha mora NA Variable).
- Tipografia: família, peso, tamanho E line-height exatos do computed style.

## 3. Tolerâncias (fora disso = drift, e drift é bug)

| Dimensão | Tolerância |
|---|---|
| Largura/altura/posição/espaçamento | **±1px** (arredondamento de subpixel) |
| Cor | **exata** (mesmo hex resolvido; sem "quase igual") |
| Fonte (família/peso/tamanho/line-height) | **exata** |
| Conteúdo textual | equivalente ao estado capturado |

## 4. Construção e reexecução

- Toda peça é **instância de componente** (regra 08); ícone é instância da lib lucide (regra 07).
- Reexecutar um export/plugin DEVE ser idempotente: atualiza em vez de duplicar página/lib/tela.
- Padrão reversível para substituições em massa: renomear o antigo para `OLD:*`, instanciar o novo,
  verificar medido, SÓ ENTÃO remover o `OLD:*`.
- Relatório de entrega: antes/depois com as medidas coletadas e os desvios encontrados (se um lado
  não pôde ser verificado, DECLARAR — não afirmar fidelidade sem os dois screenshots).

## 5. Auditoria PROFUNDA antes de "pronto" (DoD — obrigatória)

"Pronto" só existe depois de uma **auditoria por nó, RECURSIVA** da tela/componente inteiro — **não
basta olhar as superfícies de topo**. Cor crua e ícone errado se escondem DENTRO das instâncias, no
componente-master, em **slots ocultos** (spinner, ícone com default desligado) e nos **vetores de
ícone**. (Lição real: o ícone Download do botão Exportar ficou branco cru/invisível, e 640 fills
crus do `atom/button` passaram — porque a varredura contou só "as superfícies criadas".)

- **0 cor crua** — `rawColorCount: 0` **PROVADO por varredura** (não afirmado): todo paint SOLID
  (fill **E** stroke), inclusive **dentro de instâncias**, no **master**, em **slots ocultos** e nos
  **vetores de ícone**, está **bindado a Variable** (ou removido, se wrapper invisível sem token). O
  alpha mora NA Variable, nunca no `paint.opacity`.
- **Shadow via effect style** existente (nunca raw); ring/borda = **stroke bindado**, separado da sombra.
- **Ícone = lucide real** (regra 07), recolorido **bindado** ao token do contexto — o INSTANCE_SWAP
  perde a cor, então **religar sempre**. Nenhum vetor à mão, nenhum ícone branco visível.
- **Cada valor medido vs a web** (pixel/DOM via `getComputedStyle`/amostragem de pixel), nunca "no
  olho" nem de relatório de terceiro.
- **Screenshot dos dois lados conferido** antes de "pronto"; pendência não-verificável é DECLARADA.

Executor/gate: o [figma-pipeline-validator](../../.claude/agents/figma-pipeline-validator.md)
(auditor read-only) roda essa varredura profunda como **gate final** de toda tela — falhou = não está
pronto.
