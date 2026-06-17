// Superfícies e tinturas REUTILIZÁVEIS — fonte única p/ esta tela e as próximas.
// 100% token-driven: nenhuma cor chumbada (sem rgba/hex/opacidade ad-hoc). Os anéis hairline e as
// sombras de elevação vêm de tokens do DS (--surface-ring, --elevation-panel-*), mapeados como
// utilitários `ring-surface-ring` / `shadow-panel-l|r` no index.css.

/** Campo "clean" (input/trigger): preenchido (bg suave) + hairline p/ delimitar sem pesar; realça no
 *  hover e a borda vira ring no foco. (O anel de FOCO em si vem do componente, via focus-ring.)
 *  Estado de ERRO: `aria-invalid` pinta a borda de destructive (mesmo padrão do Input shadcn) — usado
 *  pela validação soft do formulário (campo obrigatório em branco ao tentar avançar). */
export const FIELD =
  'rounded-lg border-border/70 bg-muted/50 text-base md:text-base shadow-none transition-colors hover:border-border hover:bg-muted/70 focus-visible:border-ring focus-visible:bg-background aria-invalid:border-destructive'

/** Popover/menu flutuante "clean": sem borda, definido por sombra + anel hairline do DS. */
export const FLOAT = 'border-0 shadow-xl ring-1 ring-surface-ring'

/** Superfície de card: fonte ÚNICA da elevação (sombra + anel hairline do DS). Padding/raio extra
 *  entram via cn() em cada uso. */
export const CARD = 'rounded-2xl bg-card shadow-sm ring-1 ring-surface-ring'

/** Tintura de "badge"/ícone por tom: fundo = fill a 10%, TEXTO/ÍCONE = variante `-text` (AA nos 4
 *  temas). NUNCA usar o token de fill como cor de texto (`text-primary` etc. reprova contraste).
 *  Cada call-site mantém seu tamanho/forma (size-*, rounded-*) e aplica esta cor via cn(). */
export const toneBadge = {
  primary: 'bg-primary/10 text-primary-text',
  secondary: 'bg-secondary/10 text-secondary-text',
  destructive: 'bg-destructive/10 text-destructive-text',
  success: 'bg-success/10 text-success-text',
  warning: 'bg-warning/10 text-warning-text',
} as const
export type Tone = keyof typeof toneBadge
