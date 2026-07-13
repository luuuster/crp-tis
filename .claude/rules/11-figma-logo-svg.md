<!-- GERADO por build/sync-rules.mjs a partir de .cursor/rules/11-figma-logo-svg.mdc — NÃO EDITAR AQUI.
     Edite o .mdc canônico e rode `npm run sync:rules`. O pretest reprova drift. -->

> **Quando aplicar:** Regra NORMATIVA para o LOGO da marca (TIS / Trevo) em qualquer trabalho no Figma. O logo DEVE ser o SVG REAL da aplicação (app/src/assets/logo/*.svg), instanciado do componente brand/Logo — NUNCA redesenhado, aproximado (bolinhas, retângulos) nem escrito como texto "TIS". As cores DEVEM ser Variables mode-aware (logo/icon + logo/wordmark), nunca hex chumbado. Aplicar sempre que um logo for para o Figma ou uma tela/lockup de marca for criada/reproduzida.

# 11 — Logo no Figma = SVG real da marca (paridade web↔Figma)

> **Regra normativa.** "DEVE" = obrigatório, "NUNCA" = proibido. Objetivo: o logo no Figma é **o mesmo
> SVG** que a web renderiza — símbolo + wordmark, geometria e cor exatas. Complementa a regra 07 (ícones
> = lucide real) e a 08 (tela = instâncias de componentes): o logo também é asset real componentizado,
> nunca desenho à mão.

## 1. Princípio

- O logo que vai para o Figma **DEVE** ser o **SVG real** da aplicação, em
  [`app/src/assets/logo/`](../../app/src/assets/logo/) — a mesma fonte que o `<Logo>` da web usa
  ([`composicoes/auth/Logo.tsx`](../../app/src/components/composicoes/auth/Logo.tsx)). Mesma fonte ⇒
  logo idêntico ao renderizado.
- **NUNCA** redesenhar o logo "parecido": nada de bolinhas/elipses aproximando o símbolo, retângulos,
  nem o wordmark digitado como **texto** ("TIS"/"Trevo"). Se não é o vetor do SVG, está errado.
- O logo é **brand-aware**: `crp` = **TIS** (símbolo azul), `marca-b` = **Trevo** (verde). A variante
  segue a marca ativa, como na web.

## 2. Mecanismo — instância do componente `brand/Logo` (componentizado!)

O logo **DEVE ser instância** do componente **`brand/Logo`** (página *Compoenentes*), não vetor solto
nem instância de biblioteca com cor chumbada. Cada tela que mostra o logo usa uma **instância** dele
(regra 08), dimensionada pela altura (a web usa `h-8` = 32 no topbar/DocShell, `h-12` = 48 nos painéis
de marca) mantendo o aspecto do SVG (**112×50**).

## 3. Cor = Variable mode-aware (nunca hex chumbado)

As duas formas do lockup **DEVEM** ter o `fill` **bindado a Variable** (coleção *Logo*, modos Light/Dark):

| Forma | Variable | Light | Dark |
|---|---|---|---|
| símbolo (cata-vento) | `logo/icon` | azul da marca (`#036EF2`) | branco |
| wordmark ("TIS") | `logo/wordmark` | `#212121` | branco |

Isso troca o logo sozinho entre claro/escuro — como a web troca `logo-dark.svg` ↔ `logo-white.svg`.
**NUNCA** usar uma variante de cor fixa (ex.: "full-preta") nem hex solto: alpha/cor moram na Variable
([[figma-token-alpha-not-paint-opacity]]). Fundo `bg-primary` (onBrand) = lockup 100% branco
(`logo-onbrand.svg`) — ambas as formas em branco.

## 4. Como (re)construir o componente (só se `brand/Logo` não existir)

1. Ler o SVG real (`app/src/assets/logo/logo-dark.svg` para crp; `trevo-dark.svg` para marca-b).
2. `figma.createNodeFromSvg(svg)` → **`frame.fills = []`** (o createNodeFromSvg deixa um fill no
   frame-raiz que vira quadrado sólido).
3. Bindar cada `VECTOR`: símbolo → `logo/icon`, wordmark → `logo/wordmark`
   (`figma.variables.setBoundVariableForPaint` — captura e reatribui o paint).
4. `figma.createComponentFromNode(frame)`; nomear `brand/Logo`; descrever a origem.
5. Verificar por screenshot em **light E dark** (o wordmark vira branco no dark).

## 5. Definition of Done (logo)

- [ ] Todo logo no Figma é **instância de `brand/Logo`** (0 aproximações à mão, 0 texto "TIS"/"Trevo").
- [ ] `logo/icon` e `logo/wordmark` bindados (mode-aware) — nenhuma cor chumbada.
- [ ] Aspecto 112×50 preservado; altura conforme o contexto (32 no topbar, 48 nos painéis).
- [ ] Variante certa por marca (TIS × Trevo) e por superfície (auto × onBrand).
- [ ] Screenshot conferido em light **e** dark; bate com a web ([[figma-fidelidade-pixel]]).
