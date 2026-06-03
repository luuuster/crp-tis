# Web Accessibility (MDN) — Referência crp

> Tópicos selecionados do MDN mais relevantes para o stack crp (React + Radix + Tailwind + mockups HTML).

**Link base:** [MDN Web Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

---

## Tópicos relevantes

### 1. Keyboard-navigable JavaScript widgets

**Guia:** [MDN — Keyboard-navigable JS widgets](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Keyboard-navigable_JavaScript_widgets)

**No crp:**
- Radix UI implementa keyboard navigation nos componentes shadcn (Dialog, Select, DropdownMenu, Tabs, etc.)
- Componentes próprios (`@implementation own`) precisam implementar manualmente: Tab/Shift+Tab entre elementos, Enter/Space para ativar, Esc para fechar, Setas para navegar listas
- Testar **sempre** com teclado antes de marcar componente como pronto

### 2. Accessible web applications and widgets (ARIA)

**Guia:** [MDN — Accessible widgets](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/An_overview_of_accessible_web_applications_and_widgets)

**Regras de ARIA no crp:**
1. **Preferir HTML nativo** — `<button>`, `<a>`, `<label>`, `<input>` antes de `role="button"` em `<div>`
2. **ARIA só quando necessário** — botões icon-only (`aria-label`), estados (`aria-expanded`, `aria-busy`), live regions (`aria-live`)
3. **Nunca** `role="button"` em `<div>` — usar `<button>` com `className` estilizado
4. **Radix cuida** de roles complexos (dialog, combobox, menubar) — não reimplementar

### 3. Color, luminance and contrast

**Guia:** [MDN — Colors and Luminance](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_Colors_and_Luminance)

**No crp:**
- Cores funcionais (danger, warning, success) sempre com ícone + texto além da cor
- Tokens semânticos garantem que cores passam por validação de contraste antes de entrar no DS
- Dark mode é obrigatório — testar contraste em **ambos** os temas

### 4. Mobile accessibility (foco e teclado)

**Guia:** [MDN — Mobile accessibility checklist](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Mobile_accessibility_checklist)

**No crp (responsivo — estes princípios mobile valem de fato):**
- Touch target >= 44px (Apple HIG) — já é decisão cravada
- Focus visível em todos os interativos
- Content hiding: usar `hidden` ou `display:none` de verdade, não `opacity:0` com pointer-events
- Controles standard focáveis por padrão; custom controls com `role` + `tabIndex`

### 5. Seizures and motion

**Guia:** [MDN — Seizures and physical reactions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Seizures_and_physical_reactions)

**No crp:**
- `prefers-reduced-motion` respeitado via `motion-reduce:transition-none` no Tailwind
- Nenhuma animação com flash > 3 vezes por segundo
- Drag-and-drop no kanban: sem rotação/scale em `prefers-reduced-motion`, apenas opacity + cursor

### 6. ARIA reference

**Guia:** [MDN — ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)

**Uso mais frequente no crp:**

| Atributo | Onde no crp |
|----------|-------------|
| `aria-label` | Botões icon-only, ícones informativos |
| `aria-expanded` | Dropdowns, accordions, menus |
| `aria-busy` | Button em estado loading |
| `aria-invalid` + `aria-describedby` | Inputs com erro (`Field`) |
| `aria-live="polite"` | Toasts, mensagens de status |
| `aria-live="assertive"` | Erros críticos |
| `aria-hidden="true"` | Ícones decorativos |
| `role="alert"` | `FieldError` |
| `role="status"` | Toast não-urgente |

---

## Quando usar este documento

- Dúvida sobre **quando** usar ARIA vs HTML nativo
- Implementação de componente com teclado customizado
- Revisão de contraste em dark mode
- Validação de motion/animação
