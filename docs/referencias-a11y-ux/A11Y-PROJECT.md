# A11y Project — Checklist adaptado ao crp

> Checklist prático do A11y Project filtrado e mapeado aos componentes e padrões do crp.

**Link canônico:** [The A11y Project — Checklist](https://www.a11yproject.com/checklist/)  
**Site:** [a11yproject.com](https://www.a11yproject.com/)

---

## Conteúdo

### Headings

- [ ] Hierarquia lógica (h1 > h2 > h3), sem pular níveis
- [ ] Exatamente 1x `<h1>` por tela
- [ ] Headings descrevem o conteúdo da seção

**Componente crp:** tipografia via tokens `font.title.*`; heading hierarchy verificada no checklist de revisão.

### Landmarks e estrutura

- [ ] `<main>` envolve o conteúdo principal
- [ ] `<nav>` para navegação
- [ ] `<header>`, `<footer>`, `<aside>` quando aplicável
- [ ] Skip link no topo ("Pular pro conteúdo") — opcional mas recomendado

**No crp:** layouts do app TalentAI (futuro `apps/recrutamento`) devem usar landmarks; skip link via `sr-only focus:not-sr-only`.

### Links e botões

- [ ] `<a>` para navegação, `<button>` para ações
- [ ] **Nunca** `<div onClick>` ou `<span onClick>` para interação
- [ ] Links com texto descritivo (não "clique aqui")
- [ ] Botões icon-only com `aria-label`

**Componente crp:** `Button` (variant `link` para aparência de link que executa ação); `Link` com underline padrão (WCAG).

### Imagens e ícones

- [ ] Imagens informativas com `alt` descritivo
- [ ] Imagens decorativas com `alt=""` e `role="presentation"`
- [ ] Ícones decorativos com `aria-hidden="true"`
- [ ] Ícones informativos com `aria-label`

**No crp:** ícones Lucide hoje em `@crp/ui` (`lucide-react`); pacote `@crp/icons` é planejado. Ver `06-accessibility.mdc`.

### Formulários

- [ ] Todo `<input>` com `<label htmlFor>` associado
- [ ] Label **visível** (não apenas placeholder)
- [ ] Campos obrigatórios com `aria-required="true"` + indicador visual `*`
- [ ] Erros com `aria-invalid` + `aria-describedby` apontando para `FieldError`
- [ ] `FieldError` com `role="alert"` e texto acionável
- [ ] Mensagem acionável ("Informe um e-mail válido", não "Inválido")
- [ ] Erro com texto + ícone (nunca só cor)

**Componentes crp:** `Field`, `FieldError`, `FieldHint`, `PasswordInput`, `CheckboxField`.

### Cor e contraste

- [ ] Contraste 4.5:1 para texto normal
- [ ] Contraste 3:1 para texto grande (>= 18px ou >= 14px bold)
- [ ] Contraste 3:1 para UI e ícones
- [ ] Cor **nunca** como único indicador de status/erro
- [ ] Testado em dark mode **e** light mode

**No crp:** tokens semânticos com contraste validado; danger/warning/success sempre com ícone + texto.

### Foco

- [ ] Todos os interativos focáveis via Tab
- [ ] Indicador de foco visível (`focus-visible:crp-ring-focus` + `ring-2`)
- [ ] Ordem de foco lógica (DOM order = visual order)
- [ ] Focus trap em modais, drawers, popovers
- [ ] `Esc` fecha overlays

**No crp:** Radix `FocusScope` para componentes shadcn; componentes `own` devem implementar manualmente.

### Teclado

- [ ] Tudo funciona sem mouse
- [ ] Tab/Shift+Tab navega entre elementos
- [ ] Enter/Space ativa botões e links
- [ ] Setas navegam em listas, menus, tabs
- [ ] Esc fecha modais e dropdowns

**No crp:** Radix implementa; componentes `own` precisam de teste manual.

### Motion e animação

- [ ] `prefers-reduced-motion` respeitado
- [ ] `motion-reduce:transition-none` em animações decorativas
- [ ] Nenhuma animação > 3 flashes/segundo
- [ ] Drag-and-drop sem rotação/scale em reduced motion

**No crp:** Tailwind `motion-reduce:` prefix; kanban com fallback.

### Conteúdo dinâmico

- [ ] Toasts e mensagens de status com `role="status"` + `aria-live="polite"`
- [ ] Erros críticos com `aria-live="assertive"`
- [ ] Loading states com `aria-busy="true"`
- [ ] Novo conteúdo não move foco inesperadamente

**Componentes crp:** Toast (planejado), Button `loading` com `aria-busy`.

### Responsividade (mobile-first, todas as telas)

- [ ] Layout funcional de 320px até desktop, sem scroll horizontal
- [ ] Nenhuma tela bloqueia mobile nem mostra aviso "use no desktop"
- [ ] Touch targets ≥ 44px no mobile
- [ ] Texto redimensionável (zoom 200%) + reflow sem perda de função

**No crp:** decisão cravada — totalmente responsivo. Telas densas (Table, Kanban) adaptam o layout no mobile.

---

## Quando usar este documento

- Review de componente novo antes de marcar "pronto"
- Audit manual de uma tela ou mockup
- Onboarding de dev novo no time (checklist de orientação)
