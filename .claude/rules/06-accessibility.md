<!-- GERADO por build/sync-rules.mjs a partir de .cursor/rules/06-accessibility.mdc — NÃO EDITAR AQUI.
     Edite o .mdc canônico e rode `npm run sync:rules`. O pretest reprova drift. -->

> **Quando aplicar:** Regra de acessibilidade (WCAG 2.2 AA) — FONTE DA VERDADE para criar/revisar qualquer componente, tela, token ou CSS do crp Design System. Cobre contraste (textual + não-textual), foco, teclado, ARIA/semântica, estados (disabled/loading), formulários, motion, forced-colors, alvo de toque, responsividade e o protocolo de revisão (Definition of Done). Aplicar SEMPRE que houver UI ou a11y envolvida.

# 06 — Acessibilidade (WCAG 2.2 AA) · crp Design System

> **Regra normativa.** "DEVE" = obrigatório, "NUNCA" = proibido. Esta é a fonte da verdade para
> revisão de componentes e telas. Docs de apoio (contexto e links canônicos):
> [`docs/referencias-a11y-ux/`](../../docs/referencias-a11y-ux/) — WCAG, MDN, A11y Project, heurísticas.

## 0. Escopo e nível-alvo

- **Alvo: WCAG 2.2 nível AA em 100%** dos tokens, componentes, telas e artefatos shippados.
  Buscar **AAA** quando viável: **2.5.5** (alvo ≥44px) e **2.4.13** (aparência do foco).
- Aplica à **foundation** (`tokens/`, `dist/base.css`, `dist/components/*`), aos **componentes** (`@crp/ui`)
  e às **telas** (app).
- **"Pronto" só existe com a a11y verificada** (§7). Não basta o feliz-caminho. Validação real > "deveria estar ok".
- Sempre testar em **light E dark** e em **mobile (320px) + zoom 200%**.

## 1. Princípios (POUR) — o que significam aqui

1. **Perceptível** — contraste mínimo; cor nunca sozinha; `alt` correto; dark+light com tokens semânticos.
2. **Operável** — 100% por teclado; alvo de toque; foco visível; `prefers-reduced-motion`; sem armadilha de foco.
3. **Compreensível** — `lang="pt-BR"`; labels visíveis; erros acionáveis em pt-BR; comportamento previsível.
4. **Robusto** — HTML semântico; ARIA só quando o nativo não basta; nome/role/valor expostos.

---

## 2. Regras normativas

### 2.1 Cor e contraste — 1.4.1, 1.4.3, 1.4.11
- **Texto:** contraste **≥ 4.5:1** (normal) e **≥ 3:1** (grande: ≥18.66px bold ou ≥24px). **FATAL** no `check.mjs`.
- **Não-textual (1.4.11) ≥ 3:1:** bordas, ícones, **anel de foco**, limites de UI e estados. **FATAL** no `check.mjs`
  (borda do `outline` e `--ring` são recompostos com culori e reprovam <3:1).
- **NUNCA usar só cor** para transmitir informação/estado (1.4.1) — sempre **cor + ícone + texto** (ou sublinhado em link).
- Acento de TEXTO de variantes não-sólidas (outline/ghost/soft/link) DEVE usar os tokens **`*-text` mode-aware**
  (`primary-text`, `destructive-text`, …; shade mais claro no dark) — `--primary` puro reprova como texto no dark.
- Validar em **light E dark**, nas duas marcas.

### 2.2 Foco — 2.4.7, 2.4.11, 2.4.13, 1.4.11
- Foco **sempre visível**, via `:focus-visible` (nunca em mouse-only), cor = **`--ring`**, `outline-offset` **positivo**,
  contraste **≥3:1**, **não cortado** por `overflow` nem obscurecido (2.4.11). Vem de **`dist/base.css`**.
- **NUNCA** `outline: none` sem um substituto visível equivalente.
- Overlays (modal/drawer/popover) DEVEM ter **focus trap** + **`Esc`** para fechar; foco retorna ao gatilho.
- Ordem de foco = **ordem do DOM = ordem visual** (2.4.3). `tabindex` positivo é proibido.

### 2.3 Teclado — 2.1.1, 2.1.2
- Tudo operável **só com teclado**: Tab/Shift+Tab, Enter/Space (ativar), Esc (fechar), Setas (listas/menus/tabs).
- **NUNCA** `<div onClick>`/`<span onClick>` para interação — usar `<button>` (ação) ou `<a>` (navegação) nativos.
- Sem armadilha de foco (2.1.2).

### 2.4 Alvo de toque — 2.5.8 (AA ≥24px) · decisão crp (≥44px nas ações principais)
- Botões/inputs com **`min-height`** via `--button-height-*` (md/lg = 40/44px). Icon-only **quadrado** (`min-width = min-height`).
- Alvos próximos DEVEM ter espaçamento; mobile mira **≥44px**.

### 2.5 Movimento — 2.3.1, 2.3.3, 2.2.2
- **`@media (prefers-reduced-motion: reduce)`** DEVE zerar animação/transição **decorativa** (vem de `dist/base.css`;
  no app usar `motion-reduce:`).
- **Movimento ESSENCIAL** (ex.: spinner de "carregando") é **exceção** — é feedback de status, isento do 2.3.3.
  **NUNCA congele um loader** (anel parado parece quebrado e some o status): mantenha a indicação, apenas mais
  contida (girar mais devagar). Marque o elemento com **`data-crp-motion="essential"`** — a base.css não o reseta
  (a exclusão mora na camada base porque, em `!important`, a camada mais antiga vence o `* !important`).
- **NUNCA** piscar > 3x/s (2.3.1). Auto-rotação/auto-play sem controle de pausa é proibido.

### 2.6 Forced-colors / Alto Contraste (Windows)
- `@media (forced-colors: active)`: **nada pode sumir**. Outline/ghost/soft com borda visível; foco em `Highlight`;
  texto/ícone em cores de sistema (`ButtonText`/`LinkText`/`GrayText`).

### 2.7 Semântica, nome, role, valor — 4.1.2
- **HTML nativo primeiro**; ARIA só quando o nativo não basta (Radix para complexos no app).
- **Nome acessível presente em TODOS os estados.** `visibility:hidden`/`display:none` no conteúdo **apagam o nome** →
  ao ocultar conteúdo (ex.: loading) usar **`opacity:0`** ou `aria-label`.
- `<button>` sempre com **`type="button"`** (exceto submit real). Botão **só-ícone** DEVE ter **`aria-label`**.
- Ícone **decorativo**: `aria-hidden="true" focusable="false"`. Ícone **informativo**: `aria-label`.

### 2.8 Estados interativos
- **Disabled** = **`aria-disabled="true"` + focável** (NÃO o atributo `disabled` nativo, que torna o controle
  não-focável e invisível ao leitor) + **guard de ativação** (bloqueia clique/Enter/Espaço). Vem de `dist/components/button.js`.
- **Loading** = **`aria-busy="true"` + `aria-disabled="true"`** + **nome acessível preservado** + spinner decorativo (`aria-hidden`).
- **Toggle/seleção/expansão** = `aria-pressed` / `aria-selected` / `aria-expanded` corretos.
- **Status (4.1.3)** = `role="status"`/`role="alert"` + `aria-live` (sem mover o foco).

### 2.9 Formulários — 1.3.5, 3.3.1, 3.3.2, 3.3.3, 4.1.2
- Todo input com **`<label>` visível e associado** (`htmlFor`/`for`) — **placeholder NÃO é label**.
- Obrigatório: `aria-required="true"` + indicador visual (`*`).
- Erro: `aria-invalid` + `aria-describedby` → mensagem com **`role="alert"`**, **acionável** ("Informe um e-mail válido",
  não "Inválido"), com **texto + ícone** (nunca só cor/borda). Usar `autocomplete`.

### 2.10 Estrutura e idioma — 2.4.6, 3.1.1
- `lang="pt-BR"`. **1× `<h1>` por tela**, hierarquia sem pular níveis. Landmarks `main`/`nav`/`header`/`footer`.
  **Skip link** ("Pular para o conteúdo") recomendado.

### 2.11 Responsividade e zoom — 1.4.4, 1.4.10 · decisão crp
- Funcional de **320px** ao desktop, **sem scroll horizontal**. **Zoom 200%** sem perda de função (reflow).
- **NUNCA** bloquear mobile ou exibir "use no desktop". Telas densas adaptam o layout.

### 2.12 Conteúdo dinâmico
- Toasts/status: `role="status"` + `aria-live="polite"`; erros críticos `assertive`. Loading com `aria-busy`.
  Conteúdo novo **não move o foco** inesperadamente.

---

## 3. A11y da FOUNDATION — o que o crp_ds já entrega pronto

| Artefato shippado | Cobre |
|---|---|
| Tokens de contraste validados (`*-text`, `--ring`, `--button-height-*`, `--opacity-disabled`) | 1.4.3, 1.4.11, 2.5.8 |
| `dist/base.css` (`@layer base`) | foco global `--ring` (2.4.7/1.4.11), `prefers-reduced-motion` (2.3.3), `forced-colors` |
| `dist/components/button.css` (`@layer components`) | botão acessível: intents/estilos/tamanhos/estados/foco/loading/forced-colors |
| `dist/components/button.js` | guard de ativação para `[aria-disabled]` (disabled/loading inertes mas focáveis) |

**Contrato de markup** que o consumidor DEVE seguir ao usar os componentes: `type="button"`; só-ícone com `aria-label`;
ícones decorativos `aria-hidden focusable="false"`; disabled = `aria-disabled` + guard; loading = `aria-busy`+`aria-disabled`
com nome preservado; foco usa `--ring`. (Detalhes no `README.md` → seção Acessibilidade.)

---

## 4. Gates automáticos — o que o `build/check.mjs` REPROVA (build quebra)

- Contraste **textual AA** dos pares fg/bg críticos (FATAL).
- Contraste **não-textual 1.4.11** da borda de outline e do anel de foco (recomposto com culori, FATAL <3:1).
- **Presença** dos 3 artefatos a11y no `dist/` + suas regras-chave (`:focus-visible`+`--ring`, `prefers-reduced-motion`,
  `forced-colors`, estados do botão, o guard `aria-disabled`).

> **Regra de manutenção:** ao adicionar um componente/token, **ADICIONE também a validação correspondente no `check.mjs`**.
> Implementar sem o gate = regressão silenciosa amanhã.

## 5. O que NÃO dá para automatizar (manual obrigatório antes de "pronto")

Leitor de tela (**NVDA/VoiceOver**), navegação **por teclado real**, **axe-core/Lighthouse** no navegador, **zoom 200%/reflow**,
e o teste em **light + dark** e **320px**. CSS/tokens cobrem o estático; comportamento exige verificação real.

## 6. Anti-padrões — NUNCA (armadilhas já cometidas)

- `visibility:hidden`/`display:none` no conteúdo de um botão **loading** (apaga o nome acessível) → use `opacity:0`.
- Atributo `disabled` **nativo** em ação que fica disponível depois (some do leitor) → use `aria-disabled` + guard.
- `<div>`/`<span>` clicável; `outline:none` sem substituto; cor como único sinal; placeholder como label;
  mensagem de erro "Inválido" sem ação; animação sem `prefers-reduced-motion`; ícone informativo sem `aria-label`
  ou decorativo sem `aria-hidden`; `<h1>` ausente/duplicado; layout que quebra abaixo de 320px.

## 7. Protocolo de revisão — Definition of Done de a11y

Antes de marcar **qualquer** componente/tela como pronto:

1. **Build/check verdes** — `npm run build && npm run check` (gates do §4 passam).
2. **Contraste** — texto AA e não-textual 3:1, em **light E dark** (§2.1).
3. **Teclado** — Tab/Enter/Space/Esc/Setas; foco visível `--ring`; ordem lógica; Esc fecha overlays (§2.2–2.3).
4. **Semântica/ARIA** — nativo; nome em todos os estados; `type`, `aria-label`, `aria-hidden`, estados (§2.7–2.8).
5. **Formulário** (se houver) — label visível, erro `role="alert"` acionável com texto+ícone (§2.9).
6. **Motion/forced-colors** — reduced-motion ok; nada some no Alto Contraste (§2.5–2.6).
7. **Responsivo** — 320px sem scroll horizontal; zoom 200% sem perda; alvo ≥44px (§2.11).
8. **Manual** — passar **axe-core** sem violação + 1 leitura com **leitor de tela** (§5).

Só depois de 1–8 a entrega é "pronta" — **validação real, não "deveria estar ok"**. Se um item não puder ser verificado neste ambiente (ex.: leitor de tela), isso DEVE ser declarado como pendência, não afirmado como feito.

## 8. Referências

- [`docs/referencias-a11y-ux/ACESSIBILIDADE-WCAG.md`](../../docs/referencias-a11y-ux/ACESSIBILIDADE-WCAG.md) · [`A11Y-PROJECT.md`](../../docs/referencias-a11y-ux/A11Y-PROJECT.md) · [`WEB-ACCESSIBILITY-MDN.md`](../../docs/referencias-a11y-ux/WEB-ACCESSIBILITY-MDN.md) · [`USABILIDADE-E-HEURISTICAS.md`](../../docs/referencias-a11y-ux/USABILIDADE-E-HEURISTICAS.md)
- Canônicos: [WCAG 2.2 Quickref](https://www.w3.org/WAI/WCAG22/quickref/?levels=aaa) · [ARIA Authoring Practices (APG)](https://www.w3.org/WAI/ARIA/apg/) · [The A11y Project](https://www.a11yproject.com/checklist/)
