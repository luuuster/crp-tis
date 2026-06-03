# Acessibilidade WCAG — Referência crp

> Critérios WCAG 2.1 nível AA relevantes ao crp e como se aplicam.

**Link canônico:** [WCAG 2.1 Understanding](https://www.w3.org/WAI/WCAG21/Understanding/)

---

## Os 4 princípios (POUR)

### 1. Perceivable (Perceptível)
O usuário consegue perceber o conteúdo com pelo menos um sentido.

**No crp:**
- Contraste mínimo 4.5:1 (texto normal) e 3:1 (texto grande / UI)
- Cor **nunca** como único indicador — sempre cor + ícone + texto
- `alt` em imagens informativas; `alt=""` em decorativas
- Dark mode obrigatório (2 temas com tokens semânticos)

### 2. Operable (Operável)
O usuário consegue interagir com todos os controles.

**No crp:**
- Navegação 100% por teclado (Tab, Enter, Space, Esc, Setas)
- Touch target >= 44px em ações principais (decisão cravada)
- `prefers-reduced-motion` respeitado em animações decorativas
- Foco visível com `focus-visible:ring-2 focus-visible:crp-ring-focus`
- Focus trap em modais, drawers, popovers (Radix)

### 3. Understandable (Compreensível)
Conteúdo e operação são compreensíveis.

**No crp:**
- `lang="pt-BR"` no HTML
- Labels sempre visíveis (não só placeholder)
- Mensagens de erro acionáveis e em pt-BR
- Consistência visual via tokens semânticos
- Comportamento previsível (sem mudança de contexto inesperada)

### 4. Robust (Robusto)
Conteúdo funciona em navegadores e tecnologias assistivas atuais e futuras.

**No crp:**
- HTML semântico (`button`, `a`, `label`, `main`, `nav`)
- ARIA correto quando HTML nativo não basta
- Radix UI garante roles e estados para componentes complexos

---

## Critérios AA relevantes ao crp

### Texto e contraste (1.4)

| Critério | Requisito | Aplicação crp |
|----------|-----------|---------------|
| 1.4.3 Contrast (Minimum) | 4.5:1 normal, 3:1 grande | Tokens de cor validados; usar ferramentas (DevTools, Stark) |
| 1.4.5 Images of Text | Não usar imagem de texto | Tipografia via Inter/Source Sans 3, nunca imagem |
| 1.4.11 Non-text Contrast | 3:1 para UI/ícones | Ícones Lucide + borders com contraste suficiente |
| 1.4.13 Content on Hover/Focus | Dismissible, hoverable, persistent | Tooltips e popovers Radix já implementam |

### Teclado (2.1)

| Critério | Requisito | Aplicação crp |
|----------|-----------|---------------|
| 2.1.1 Keyboard | Todo conteúdo operável via teclado | Radix + testes manuais obrigatórios |
| 2.1.2 No Keyboard Trap | Foco nunca fica preso sem saída | `Esc` fecha modais/drawers; Radix `FocusScope` |

### Navegação (2.4)

| Critério | Requisito | Aplicação crp |
|----------|-----------|---------------|
| 2.4.3 Focus Order | Ordem lógica de foco | DOM order = visual order; `tabIndex` com cuidado |
| 2.4.6 Headings and Labels | Headings descrevem tópico/propósito | 1x `h1` por tela; hierarquia sem pular níveis |
| 2.4.7 Focus Visible | Indicador visual de foco | `focus-visible:crp-ring-focus` (+ `ring-2`) obrigatório |

### Formulários (3.3)

| Critério | Requisito | Aplicação crp |
|----------|-----------|---------------|
| 3.3.1 Error Identification | Erros identificados e descritos em texto | `FieldError` com `role="alert"` + texto acionável |
| 3.3.2 Labels or Instructions | Labels ou instruções para input | `label htmlFor` obrigatório; `FieldHint` para instruções |
| 3.3.3 Error Suggestion | Sugestão de correção quando possível | "Informe um e-mail válido" (não "Inválido") |

### Compatibilidade (4.1)

| Critério | Requisito | Aplicação crp |
|----------|-----------|---------------|
| 4.1.2 Name, Role, Value | Componentes têm nome, role e valor acessíveis | Radix para complexos; `aria-label` em icon-only buttons |
| 4.1.3 Status Messages | Mensagens de status sem mover foco | `role="status"` + `aria-live="polite"` em toasts |

---

## Ferramentas recomendadas

- **DevTools Chrome** — Inspector de contraste (color picker)
- **Stark** (plugin Figma) — contraste e simulação de deficiência visual
- **axe DevTools** (extensão) — auditoria WCAG automática
- **@storybook/addon-a11y** — axe-core em cada story (planejado)
- **Lighthouse** — auditoria geral de acessibilidade

---

## Quando usar este documento

- Implementação de novo componente (`@crp/ui`)
- Revisão de contraste e cores
- Configuração de formulários e mensagens de erro
- Validação de navegação por teclado
