# Ideias de plugins Figma — backlog (futuro)

> **Status:** backlog. Não começar antes de fechar o que está em voo (ver _Pré-requisitos_ no fim).
> **Contexto:** hoje temos 2 plugins de **entrada** — `figma-plugin/` (Tokens → Variables, + auditoria de
> drift) e `figma-plugin-icons/` (Ícones → Components). O gap do fluxo não é mais _empurrar coisa pra dentro_
> do Figma; é **governança, QA e saída**. É aí que estão os plugins de maior ROI.

Ranqueado pelo encaixe real com o que já temos (reuso de código + valores do projeto: token-driven,
a11y-bar WCAG 2.2 AA, multi-marca, verify-before-done).

---

## 1. Linter de uso de token (detached / hardcoded) — **o que mais falta**

**Problema:** garantimos que os tokens _entram_ certos, mas **nada garante que o designer os usa**. Empurrar
token sem guard de adoção é metade do trabalho.

**O que faz:** varre o arquivo (`figma.root.findAll`) e acha o que **deveria** estar ligado a Variable e não
está:
- fill / stroke com cor sólida crua (não bound),
- `fontSize` / `lineHeight` solto,
- `padding` / `gap` / `cornerRadius` de auto-layout raw,
- sombra destacada de style.

Reporta por nó (com link de seleção) e **sugere o token que casa por valor**. Modo **fix**: liga
automaticamente ao token correspondente.

**Reusa o que já existe:**
- o _match por valor_ (igual o icons plugin casa `icon/*` e `border-width/*` por valor),
- o **`numClose` / tolerância float32** que resolvemos na auditoria do `figma-plugin/` → vira o "modo fix"
  (o Figma guarda float32; o match precisa ser tolerante).

**Esforço:** médio. **Por que vale:** fecha o ciclo de governança — é o que falta depois de "tokens entram".

---

## 2. Checador de contraste no canvas (os 4 temas) — **encaixa no a11y-bar**

**O que faz:** seleciona um frame → o plugin acha os pares texto/superfície, **troca os modos das Variables**
(CRP/MarcaB × Light/Dark) e calcula o contraste **real** de cada par. Sai relatório por par × tema, marcando
`< 4.5` (texto) e `< 3.0` (UI/large).

**Reusa o que já existe:**
- a **MESMA lógica do [build/check.mjs](../build/check.mjs)** (ratio WCAG + tabela `PAIRS`) → build-time e
  design-time com a **mesma régua**. É a continuação direta do achado `muted-foreground/muted = 4.35`, só que
  pego **no design**, antes de virar token.

**Esforço:** médio (mais barato **depois** que o plano do contraste landar — herda `PAIRS`/ratio prontos).
**Por que vale:** estende a barra de a11y para dentro do design; alinhado com a memória `a11y-bar`.
**Honesto:** texto sobre gradiente/imagem é difícil — focar em superfície sólida.

---

## 3. Matriz marca × modo (QA visual dos 4 temas)

**O que faz:** pega uma seleção e renderiza/exporta as **4 combinações lado a lado** (CRP/MarcaB × Light/Dark)
para revisar de uma vez. Pode rodar o **#2** em cima de cada render.

**Reusa:** troca de modos das Variables (mesma mecânica do #2).
**Esforço:** médio. **Por que vale:** resolve a dor real de multi-marca — hoje se troca modo na mão e compara
de memória.

---

## 4. Gerador de página "Foundations" (doc viva)

**O que faz:** lê as Variables e **desenha** sozinho a rampa de cor (swatch + nome + valor + token), a escala
de tipografia, espaçamento, raios e sombras — uma página sempre sincronizada com o export.

**Reusa:** o export de Variables que o `figma-plugin/` já produz.
**Esforço:** médio-alto (é layout). **Por que vale:** referência viva para designers; some o "qual é o token
mesmo?".

---

## Não construir (Figma já faz nativo — seria retrabalho)

- **Trocador de tema simples** → os _modes_ das Variables já fazem.
- **Re-sync de tokens** → já é o `figma-plugin/`.
- **Bind de 1 variável avulsa** → nativo no Dev Mode / painel.

---

## Recomendação

- **#1 (linter de uso)** e **#2 (contraste no canvas)** são os de **maior retorno** e os que mais
  **reaproveitam código já escrito** (match-por-valor + `numClose`; e o `check.mjs`).
- Ordem sugerida quando for a hora: **#2 primeiro** (herda `check.mjs` já provado), depois **#1**, depois #3/#4.

## Pré-requisitos (fechar antes de começar qualquer um)

1. **Plano do contraste** (`muted-foreground/muted` AA + par **fatal** no `check.mjs` + tolerância float32 na
   auditoria) — toca token + barra de a11y; é dívida já identificada. O #2 herda essa base.
2. **Validar o `figma-plugin-icons/` no Figma de verdade** (recarregar, confirmar `DecompressionStream` +
   geração dos Components) — hoje está "verde em teste", não "validado no Figma".
3. **Commitar/landar** a branch atual (`feat/figma-plugin-export-and-aa`) — está com muita coisa não-commitada.

Só depois disso escolher **um** plugin novo — construir sobre base ainda não consolidada (#1 e #2 dependem de
`numClose` e `check.mjs`, que ainda vão mudar/landar) é trabalho ao contrário.
