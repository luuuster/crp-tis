/**
 * Manifesto de acessibilidade (SSOT) — uma entrada por componente em ui/<component>.tsx.
 *
 * É o "contrato/garantia" de a11y da camada React: documenta, por componente, o padrão ARIA, as
 * teclas, os estados exercitados e COMO cada um é verificado. O gate [a11y-manifest.test.ts] cruza
 * este manifesto com os arquivos de ui/ (auto-descoberta — mesma filosofia do A11Y_ARTIFACTS do
 * build/check.mjs) e com o registry de demos: nenhum componente pode existir sem entrada + demo.
 *
 * Honestidade > maquiagem: provider/layout/static declaram `keyboard: []` + `caveats` explicando a
 * ausência de interação — documentar, não fingir cobertura. Contraste fica no culori (e2e/check.mjs),
 * nunca no axe (que converte OKLCH→sRGB de forma não-confiável).
 */
export type A11yKind = 'provider' | 'layout' | 'static' | 'control' | 'overlay'
export type VerifiedBy = 'axe-closed' | 'axe-open' | 'keyboard' | 'contrast' | 'behavior'
export type OpenVia = 'click' | 'hover' | 'focus' | 'contextmenu'

export interface A11yEntry {
  /** == nome do arquivo ui/<component>.tsx (chave da auto-descoberta). */
  component: string
  kind: A11yKind
  /** Padrão WAI-ARIA (ex.: 'dialog (modal)', 'tablist', 'menu', 'none'). */
  ariaPattern: string
  roles: string[]
  /** Teclas suportadas (pt-BR); [] para provider/layout/static (ver caveats). */
  keyboard: string[]
  /** Estados que o demo exercita. */
  states: string[]
  verifiedBy: VerifiedBy[]
  /** id no registry de demos; '' só para provider/interno sem UI. */
  demoId: string
  /** overlay: nome acessível do gatilho na Showcase (dirige a varredura axe-open). */
  openTrigger?: string
  openVia?: OpenVia
  caveats?: string
}

const E = (e: A11yEntry) => e // identidade tipada (autocomplete por entrada)

export const A11Y_MANIFEST: Record<string, A11yEntry> = {
  accordion: E({
    component: 'accordion', kind: 'control', ariaPattern: 'accordion (region + button)',
    roles: ['button', 'region'], keyboard: ['Enter/Espaço alterna', 'Tab navega'],
    states: ['fechado', 'aberto'], verifiedBy: ['axe-closed', 'keyboard', 'contrast'], demoId: 'accordion',
  }),
  alert: E({
    component: 'alert', kind: 'static', ariaPattern: 'alert (role=alert)', roles: ['alert'], keyboard: [],
    states: ['default', 'destructive'], verifiedBy: ['axe-closed', 'contrast'], demoId: 'alert',
  }),
  'alert-dialog': E({
    component: 'alert-dialog', kind: 'overlay', ariaPattern: 'alertdialog (modal)', roles: ['alertdialog'],
    keyboard: ['Esc fecha', 'Tab cicla (foco preso)'], states: ['aberto'],
    verifiedBy: ['axe-closed', 'axe-open', 'keyboard', 'contrast'], demoId: 'alert-dialog',
    openTrigger: 'Excluir conta', openVia: 'click',
  }),
  'aspect-ratio': E({
    component: 'aspect-ratio', kind: 'layout', ariaPattern: 'none (caixa de proporção)', roles: [], keyboard: [],
    states: ['16/9'], verifiedBy: ['axe-closed'], demoId: 'aspect-ratio',
    caveats: 'Utilitário de layout (mantém proporção); sem semântica/interação própria.',
  }),
  avatar: E({
    component: 'avatar', kind: 'static', ariaPattern: 'img + fallback', roles: ['img'], keyboard: [],
    states: ['imagem', 'fallback', 'grupo'], verifiedBy: ['axe-closed', 'contrast'], demoId: 'avatar',
  }),
  badge: E({
    component: 'badge', kind: 'static', ariaPattern: 'none (rótulo)', roles: [], keyboard: [],
    states: ['default', 'secondary', 'destructive', 'outline'], verifiedBy: ['axe-closed', 'contrast'], demoId: 'badge',
  }),
  breadcrumb: E({
    component: 'breadcrumb', kind: 'static', ariaPattern: 'nav (aria-label) + página atual', roles: ['navigation'],
    keyboard: ['Tab entre links'], states: ['default'], verifiedBy: ['axe-closed', 'contrast'], demoId: 'breadcrumb',
  }),
  button: E({
    component: 'button', kind: 'control', ariaPattern: 'button', roles: ['button'],
    keyboard: ['Enter/Espaço ativa'], states: ['default', 'disabled', 'loading'],
    verifiedBy: ['axe-closed', 'keyboard', 'behavior', 'contrast'], demoId: 'button',
    caveats: 'Único com contrato CSS/JS vanilla shipado (dist/components/button.{css,js}) + button.test.tsx.',
  }),
  'button-group': E({
    component: 'button-group', kind: 'layout', ariaPattern: 'group', roles: ['group'], keyboard: ['Tab entre botões'],
    states: ['horizontal'], verifiedBy: ['axe-closed', 'contrast'], demoId: 'button-group',
  }),
  calendar: E({
    component: 'calendar', kind: 'control', ariaPattern: 'grid (react-day-picker)', roles: ['grid'],
    keyboard: ['Setas navegam dias', 'Enter seleciona'], states: ['default', 'selecionado'],
    verifiedBy: ['axe-closed', 'keyboard', 'contrast'], demoId: 'calendar',
  }),
  card: E({
    component: 'card', kind: 'layout', ariaPattern: 'none (superfície)', roles: [], keyboard: [],
    states: ['default'], verifiedBy: ['axe-closed', 'contrast'], demoId: 'card',
    caveats: 'Contêiner de superfície; semântica vem do conteúdo (heading/etc.).',
  }),
  carousel: E({
    component: 'carousel', kind: 'control', ariaPattern: 'region + slides (aria-roledescription)',
    roles: ['region'], keyboard: ['Setas ←/→ navegam (botões focáveis)'], states: ['default'],
    verifiedBy: ['axe-closed', 'keyboard', 'contrast'], demoId: 'carousel',
  }),
  chart: E({
    component: 'chart', kind: 'static', ariaPattern: 'imagem de dados (recharts)', roles: ['img'], keyboard: [],
    states: ['barras'], verifiedBy: ['axe-closed', 'contrast'], demoId: 'chart',
    caveats: 'Gráfico é decorativo p/ leitor de tela; os números acompanham em legenda/tabela.',
  }),
  checkbox: E({
    component: 'checkbox', kind: 'control', ariaPattern: 'checkbox', roles: ['checkbox'],
    keyboard: ['Espaço alterna'], states: ['desmarcado', 'marcado', 'disabled'],
    verifiedBy: ['axe-closed', 'keyboard', 'contrast'], demoId: 'checkbox',
  }),
  collapsible: E({
    component: 'collapsible', kind: 'control', ariaPattern: 'disclosure (button aria-expanded)', roles: ['button'],
    keyboard: ['Enter/Espaço alterna'], states: ['fechado', 'aberto'],
    verifiedBy: ['axe-closed', 'keyboard', 'contrast'], demoId: 'collapsible',
  }),
  combobox: E({
    component: 'combobox', kind: 'control', ariaPattern: 'combobox + listbox (base-ui)', roles: ['combobox', 'listbox'],
    keyboard: ['Digita filtra', 'Setas navegam', 'Enter seleciona', 'Esc fecha'], states: ['default'],
    verifiedBy: ['axe-closed', 'contrast'], demoId: 'combobox',
    caveats: 'Overlay base-ui (não-Radix); aberto/teclado coberto manualmente — fora da varredura axe-open genérica.',
  }),
  command: E({
    component: 'command', kind: 'overlay', ariaPattern: 'combobox + listbox (cmdk) em popover', roles: ['listbox'],
    keyboard: ['Digita filtra', 'Setas navegam', 'Enter executa', 'Esc fecha'], states: ['aberto'],
    verifiedBy: ['axe-closed', 'axe-open', 'keyboard', 'contrast'], demoId: 'command',
    openTrigger: 'Abrir paleta de comandos', openVia: 'click',
    caveats: 'O cmdk insere um <div cmdk-list-sizer> genérico ENTRE a listbox e os options, o que '
      + 'quebrava a posse listbox→option (axe: aria-required-children com a lista aberta) — afetava '
      + 'também o SearchSelect de produção. CORRIGIDO em command.tsx (CommandList): marcamos o sizer com '
      + 'role="presentation" no mount, tornando-o transparente na árvore de acessibilidade. Por isso a '
      + 'varredura axe-ABERTO está ATIVA (verifiedBy inclui "axe-open") e trava a regressão nos 4 temas.',
  }),
  'context-menu': E({
    component: 'context-menu', kind: 'overlay', ariaPattern: 'menu (botão direito)', roles: ['menu'],
    keyboard: ['Setas navegam', 'Enter ativa', 'Esc fecha'], states: ['aberto'],
    verifiedBy: ['axe-closed', 'axe-open', 'keyboard', 'contrast'], demoId: 'context-menu',
    openTrigger: 'Área de clique direito', openVia: 'contextmenu',
  }),
  'date-picker': E({
    component: 'date-picker', kind: 'overlay', ariaPattern: 'campo + calendário (popover)', roles: ['grid'],
    keyboard: ['Digita a data', 'Setas no calendário'], states: ['vazio', 'preenchido'],
    verifiedBy: ['axe-closed', 'axe-open', 'contrast'], demoId: 'date-picker',
    openTrigger: 'Abrir calendário', openVia: 'click',
  }),
  dialog: E({
    component: 'dialog', kind: 'overlay', ariaPattern: 'dialog (modal)', roles: ['dialog'],
    keyboard: ['Esc fecha', 'Tab cicla (foco preso)'], states: ['aberto'],
    verifiedBy: ['axe-closed', 'axe-open', 'keyboard', 'contrast'], demoId: 'dialog',
    openTrigger: 'Editar perfil', openVia: 'click',
  }),
  direction: E({
    component: 'direction', kind: 'provider', ariaPattern: 'none (provider LTR/RTL)', roles: [], keyboard: [],
    states: [], verifiedBy: ['behavior'], demoId: '',
    caveats: 'Provider de direção (LTR/RTL); sem superfície de UI — coberto pelo uso app-wide.',
  }),
  drawer: E({
    component: 'drawer', kind: 'overlay', ariaPattern: 'dialog (vaul, bottom sheet)', roles: ['dialog'],
    keyboard: ['Esc fecha', 'Tab cicla'], states: ['aberto'],
    verifiedBy: ['axe-closed', 'axe-open', 'keyboard', 'contrast'], demoId: 'drawer',
    openTrigger: 'Abrir gaveta', openVia: 'click',
  }),
  'dropdown-menu': E({
    component: 'dropdown-menu', kind: 'overlay', ariaPattern: 'menu (button aria-haspopup)', roles: ['menu'],
    keyboard: ['Setas navegam', 'Enter ativa', 'Esc fecha'], states: ['aberto'],
    verifiedBy: ['axe-closed', 'axe-open', 'keyboard', 'contrast'], demoId: 'dropdown-menu',
    openTrigger: 'Abrir menu de conta', openVia: 'click',
  }),
  empty: E({
    component: 'empty', kind: 'static', ariaPattern: 'estado vazio', roles: [], keyboard: [],
    states: ['default'], verifiedBy: ['axe-closed', 'contrast'], demoId: 'empty',
  }),
  field: E({
    component: 'field', kind: 'layout', ariaPattern: 'group + label/description/error', roles: ['group'], keyboard: [],
    states: ['default', 'invalid'], verifiedBy: ['axe-closed', 'contrast'], demoId: 'field',
  }),
  form: E({
    component: 'form', kind: 'layout', ariaPattern: 'campos com label/descrição/erro (react-hook-form)', roles: ['group'],
    keyboard: ['Tab navega', 'Enter envia'], states: ['default', 'erro'], verifiedBy: ['axe-closed', 'contrast'], demoId: 'form',
    caveats: 'Wrapper de react-hook-form; aria-invalid/aria-describedby ligados ao estado de validação.',
  }),
  'hover-card': E({
    component: 'hover-card', kind: 'overlay', ariaPattern: 'cartão em hover/foco', roles: ['dialog'],
    keyboard: ['Foco no gatilho abre'], states: ['aberto'],
    verifiedBy: ['axe-closed', 'axe-open', 'contrast'], demoId: 'hover-card',
    openTrigger: '@crp_ds', openVia: 'hover',
  }),
  input: E({
    component: 'input', kind: 'control', ariaPattern: 'textbox', roles: ['textbox'], keyboard: ['Digitação'],
    states: ['default', 'disabled', 'invalid'], verifiedBy: ['axe-closed', 'contrast'], demoId: 'input',
  }),
  'input-group': E({
    component: 'input-group', kind: 'layout', ariaPattern: 'group (campo + addons)', roles: ['group'],
    keyboard: ['Digitação'], states: ['prefixo', 'sufixo'], verifiedBy: ['axe-closed', 'contrast'], demoId: 'input-group',
  }),
  'input-otp': E({
    component: 'input-otp', kind: 'control', ariaPattern: 'campo de código (dígitos)', roles: ['textbox'],
    keyboard: ['Dígitos avançam', 'Backspace volta'], states: ['vazio', 'preenchido'],
    verifiedBy: ['axe-closed', 'contrast'], demoId: 'input-otp',
  }),
  item: E({
    component: 'item', kind: 'layout', ariaPattern: 'lista de itens (mídia + conteúdo + ações)', roles: ['list', 'listitem'],
    keyboard: ['Tab entre ações'], states: ['default', 'outline', 'muted'], verifiedBy: ['axe-closed', 'contrast'], demoId: 'item',
  }),
  kbd: E({
    component: 'kbd', kind: 'static', ariaPattern: 'tecla (<kbd>)', roles: [], keyboard: [],
    states: ['single', 'grupo'], verifiedBy: ['axe-closed', 'contrast'], demoId: 'kbd',
  }),
  label: E({
    component: 'label', kind: 'static', ariaPattern: 'rótulo (htmlFor)', roles: [], keyboard: [],
    states: ['default'], verifiedBy: ['axe-closed', 'contrast'], demoId: 'label',
    caveats: 'Associa um controle via htmlFor; clicar foca/ativa o controle.',
  }),
  menubar: E({
    component: 'menubar', kind: 'overlay', ariaPattern: 'menubar + menu', roles: ['menubar', 'menu'],
    keyboard: ['Setas navegam', 'Enter abre/ativa', 'Esc fecha'], states: ['aberto'],
    verifiedBy: ['axe-closed', 'axe-open', 'keyboard', 'contrast'], demoId: 'menubar',
    openTrigger: 'Arquivo', openVia: 'click',
  }),
  'native-select': E({
    component: 'native-select', kind: 'control', ariaPattern: 'select nativo', roles: ['combobox'], keyboard: ['Setas trocam'],
    states: ['default', 'disabled'], verifiedBy: ['axe-closed', 'contrast'], demoId: 'native-select',
  }),
  'navigation-menu': E({
    component: 'navigation-menu', kind: 'overlay', ariaPattern: 'navegação com submenus', roles: ['navigation', 'menu'],
    keyboard: ['Setas navegam', 'Enter abre', 'Esc fecha'], states: ['aberto'],
    verifiedBy: ['axe-closed', 'axe-open', 'keyboard', 'contrast'], demoId: 'navigation-menu',
    openTrigger: 'Produtos', openVia: 'click',
  }),
  pagination: E({
    component: 'pagination', kind: 'static', ariaPattern: 'nav (aria-label) + página atual', roles: ['navigation'],
    keyboard: ['Tab entre páginas'], states: ['default'], verifiedBy: ['axe-closed', 'contrast'], demoId: 'pagination',
  }),
  popover: E({
    component: 'popover', kind: 'overlay', ariaPattern: 'dialog não-modal (popover)', roles: ['dialog'],
    keyboard: ['Esc fecha', 'Tab dentro'], states: ['aberto'],
    verifiedBy: ['axe-closed', 'axe-open', 'contrast'], demoId: 'popover',
    openTrigger: 'Abrir popover', openVia: 'click',
  }),
  progress: E({
    component: 'progress', kind: 'static', ariaPattern: 'progressbar', roles: ['progressbar'], keyboard: [],
    states: ['parcial'], verifiedBy: ['axe-closed', 'contrast'], demoId: 'progress',
  }),
  'radio-group': E({
    component: 'radio-group', kind: 'control', ariaPattern: 'radiogroup + radio', roles: ['radiogroup', 'radio'],
    keyboard: ['Setas trocam', 'Espaço seleciona'], states: ['selecionado'],
    verifiedBy: ['axe-closed', 'keyboard', 'contrast'], demoId: 'radio-group',
  }),
  resizable: E({
    component: 'resizable', kind: 'layout', ariaPattern: 'painéis + separador redimensionável', roles: ['group', 'separator'],
    keyboard: ['Setas redimensionam (handle focável)'], states: ['default'], verifiedBy: ['axe-closed', 'contrast'], demoId: 'resizable',
  }),
  'scroll-area': E({
    component: 'scroll-area', kind: 'layout', ariaPattern: 'área rolável', roles: [], keyboard: ['Setas rolam'],
    states: ['default'], verifiedBy: ['axe-closed', 'contrast'], demoId: 'scroll-area',
    caveats: 'Viewport rolável estilizada; conteúdo permanece focável/rolável por teclado.',
  }),
  select: E({
    component: 'select', kind: 'overlay', ariaPattern: 'combobox + listbox (Radix)', roles: ['combobox', 'listbox'],
    keyboard: ['Setas navegam', 'Enter seleciona', 'Esc fecha', 'digita p/ buscar'], states: ['fechado', 'aberto'],
    verifiedBy: ['axe-closed', 'axe-open', 'keyboard', 'contrast'], demoId: 'select',
    openTrigger: 'Cargo (select)', openVia: 'click',
  }),
  separator: E({
    component: 'separator', kind: 'static', ariaPattern: 'separator', roles: ['separator'], keyboard: [],
    states: ['horizontal', 'vertical'], verifiedBy: ['axe-closed'], demoId: 'separator',
    caveats: 'Divisória; decorativa quando puramente visual (aria-hidden) ou role=separator.',
  }),
  sheet: E({
    component: 'sheet', kind: 'overlay', ariaPattern: 'dialog (painel lateral)', roles: ['dialog'],
    keyboard: ['Esc fecha', 'Tab cicla'], states: ['aberto'],
    verifiedBy: ['axe-closed', 'axe-open', 'keyboard', 'contrast'], demoId: 'sheet',
    openTrigger: 'Abrir painel', openVia: 'click',
  }),
  sidebar: E({
    component: 'sidebar', kind: 'layout', ariaPattern: 'navegação lateral (provider + menu)', roles: ['navigation'],
    keyboard: ['Tab entre itens', 'Atalho recolhe'], states: ['expandido'], verifiedBy: ['axe-closed', 'contrast'], demoId: 'sidebar',
    caveats: 'Requer SidebarProvider; o demo monta um provider local em escala reduzida.',
  }),
  skeleton: E({
    component: 'skeleton', kind: 'static', ariaPattern: 'placeholder decorativo', roles: [], keyboard: [],
    states: ['carregando'], verifiedBy: ['axe-closed'], demoId: 'skeleton',
    caveats: 'Placeholder visual de carregamento; decorativo (sem texto/role).',
  }),
  slider: E({
    component: 'slider', kind: 'control', ariaPattern: 'slider', roles: ['slider'], keyboard: ['Setas ajustam', 'Home/End'],
    states: ['default'], verifiedBy: ['axe-closed', 'keyboard', 'contrast'], demoId: 'slider',
  }),
  sonner: E({
    component: 'sonner', kind: 'static', ariaPattern: 'região de notificações (aria-live)', roles: [], keyboard: [],
    states: ['toast'], verifiedBy: ['axe-closed', 'contrast'], demoId: 'sonner',
    caveats: 'Toasts são transitórios (timing-flaky no e2e); o demo monta o Toaster + gatilho. Fora da varredura axe-open.',
  }),
  spinner: E({
    component: 'spinner', kind: 'static', ariaPattern: 'indicador de carregamento', roles: ['status'], keyboard: [],
    states: ['girando'], verifiedBy: ['axe-closed', 'contrast'], demoId: 'spinner',
    caveats: 'Movimento essencial (feedback de carregando); respeita reduced-motion via base.css.',
  }),
  switch: E({
    component: 'switch', kind: 'control', ariaPattern: 'switch', roles: ['switch'], keyboard: ['Espaço alterna'],
    states: ['off', 'on', 'disabled'], verifiedBy: ['axe-closed', 'keyboard', 'contrast'], demoId: 'switch',
  }),
  table: E({
    component: 'table', kind: 'static', ariaPattern: 'table (header/row/cell)', roles: ['table'], keyboard: [],
    states: ['default'], verifiedBy: ['axe-closed', 'contrast'], demoId: 'table',
  }),
  tabs: E({
    component: 'tabs', kind: 'control', ariaPattern: 'tablist + tab + tabpanel', roles: ['tablist', 'tab', 'tabpanel'],
    keyboard: ['Setas navegam abas', 'Enter/Espaço ativa'], states: ['ativa'],
    verifiedBy: ['axe-closed', 'keyboard', 'contrast'], demoId: 'tabs',
  }),
  textarea: E({
    component: 'textarea', kind: 'control', ariaPattern: 'textbox multilinha', roles: ['textbox'], keyboard: ['Digitação'],
    states: ['default', 'disabled', 'invalid'], verifiedBy: ['axe-closed', 'contrast'], demoId: 'textarea',
  }),
  toggle: E({
    component: 'toggle', kind: 'control', ariaPattern: 'button (aria-pressed)', roles: ['button'], keyboard: ['Espaço/Enter alterna'],
    states: ['off', 'on', 'disabled'], verifiedBy: ['axe-closed', 'keyboard', 'contrast'], demoId: 'toggle',
  }),
  'toggle-group': E({
    component: 'toggle-group', kind: 'control', ariaPattern: 'group de toggles', roles: ['group'], keyboard: ['Setas navegam', 'Espaço alterna'],
    states: ['single', 'multiple'], verifiedBy: ['axe-closed', 'keyboard', 'contrast'], demoId: 'toggle-group',
  }),
  tooltip: E({
    component: 'tooltip', kind: 'overlay', ariaPattern: 'tooltip (hover/foco)', roles: ['tooltip'],
    keyboard: ['Foco no gatilho mostra'], states: ['aberto'],
    verifiedBy: ['axe-closed', 'axe-open', 'contrast'], demoId: 'tooltip',
    openTrigger: 'Notificações', openVia: 'focus',
  }),
}
