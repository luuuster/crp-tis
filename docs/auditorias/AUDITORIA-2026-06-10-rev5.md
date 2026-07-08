# Auditoria — CRP Design System
### 2026-06-10 · rev. 5 · foco: tokens e plugins Figma (a pedido)

> Base: `main 7d0cf3c` + correções da rev. 4 no working tree. Métodos: leitura dirigida dos fluxos
> de risco dos plugins (prune/rename/codegen/protocolo) + verificações programáticas que nenhum
> gate cobre (contraste de série gráfica, round-trip do bundle, scopes do export).

## O que foi verificado e está CORRETO (com prova)

| Verificação | Resultado |
|---|---|
| Round-trip `export:ts`: bundle ≡ concatenação exata dos 19 sets de `tokens/` | ✅ idênticos |
| Handler de **codegen** no Dev Mode (manifest declara a capability) | ✅ existe (code.js:1137) |
| **Prune**: opt-in por checkbox com aviso + "Pré-visualizar antes" | ✅ consentido, não silencioso |
| Aviso defensivo de **nome duplicado** entre collections do bundle | ✅ existe (code.js:294) |
| **Scopes** das Variables no export (`scopesFor`, 701 entradas) | ✅ implementado |
| Protocolo de mensagens ui.html ↔ code.js (dois plugins) | ✅ sem descasamentos |
| `code.bundled.js` do plugin de ícones vs fonte | ✅ em sincronia |
| Badges chart-1..12 (texto sobre fill, solid e soft) no check.mjs | ✅ validados, AA fatal |

Quatro claims de varredura automatizada foram **descartados com evidência**: "prune deleta sem
confirmação" (há checkbox + aviso + preview), "codegen ausente" (existe), "rename sem aviso de
duplicata" (aviso na linha 294), "bundle de ícones defasado" (em sincronia).

## Achados

### 🟡 1. `chart-3` e `chart-4` reprovam contraste não-textual (3:1) nos temas Light
Medido com culori sobre o dist real: `chart-3` = **2.25:1** e `chart-4` = **2.83:1** contra
`--background` E `--card`, em CRP-Light e MarcaB-Light (dark passa; chart-1/2/5 passam). O
`check.mjs` valida os chart-* como *badge* (texto sobre o fill — passa), mas **não valida a série
gráfica contra a superfície** — exatamente o uso em linhas/barras do Recharts (WCAG 1.4.11,
objetos gráficos).
**Mitigação atual:** o app só usa `chart-1` (Dashboard.tsx:29), e com `accessibilityLayer` +
tooltip — o risco é **latente, no contrato**: qualquer consumidor que use chart-3/4 num gráfico
light herda a reprovação.
**Ação:** escurecer o shade de chart-3/4 no light (ex.: 500→600) OU adicionar o par
`chart-N × background/card` ao check (fatal ou aviso documentado). A segunda opção impede
regressão para sempre.

### 🔵 2. Texto do prune promete menos do que o critério executa
A UI diz "apaga Variables/Styles **NOSSOS**", mas o critério real é *qualquer* variable nas
collections `CRP/*` ausente do bundle — **incluindo variables criadas à mão pelo usuário dentro
delas**. O aviso já diz "só toca nas collections CRP/*", então é nuance de texto, não bug.
**Ação (1 linha):** trocar por "apaga QUALQUER Variable/Style das collections CRP/* que não esteja
no bundle (inclusive criadas à mão nelas)". Alternativa mais segura: prune poupar variables sem o
nosso `codeSyntax`.

### 🔵 3. Export Material sem indicador de progresso
`export:material` gera 6 bundles (~20 s cada aqui; minutos no total) com output só ao final de cada
um. Sem timeout/progresso por estilo, parece travado. DX local apenas (o CI tem timeout próprio).
**Ação:** logar progresso por lote de ícones ou por estilo iniciado.

### 🔵 4. Auditoria de Styles é mais rasa que a de Variables (registrar a intenção)
O `runAudit` compara Variables a fundo (valores por modo, aliases, drift) mas Styles só em
presença/ligação — fontName/lineHeight de um Text Style alterado à mão no Figma não acusam drift.
Parece escolha pragmática; **documentar no README do plugin** para não parecer cobertura completa.

### ℹ️ 5. lineHeight vira px inteiro no Figma (30 variables) — limitação da plataforma
O export converte ratio×fontSize para número (px) arredondado — é o que o Figma aceita. Sem ação;
registrado para ninguém "corrigir" isso no futuro achando que é bug.

## Conclusão

Tokens e plugins saem desta rodada com **um achado de substância** (chart-3/4 no light — latente,
6 valores de token ou 1 regra de check) e três polimentos. O restante do que parecia suspeito caiu
com prova em mãos. Nível geral: os fluxos perigosos do plugin (prune, rename, sync) têm consenso de
UI, avisos defensivos e testes — acima do padrão de plugins Figma internos.
