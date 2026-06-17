/**
 * Primitivos de layout do app — UM padrão por tipo de tela. Consolidam os helpers que estavam
 * duplicados/divergentes entre as páginas (Panel/SecaoCard, Kpi/Stat, containers e rodapés de detalhe).
 * 100% token-driven: superfície via CARD (surfaces.ts), texto colorido em -text, nada de cor à mão.
 *
 * - PageContainer  → casca de página de LISTA (max-w-6xl, ritmo e padding padrão).
 * - PageHeader     → cabeçalho de lista (ícone opcional + título + descrição + ações).
 * - Panel          → cartão de SEÇÃO (CARD p-6, cabeçalho ícone-à-esquerda opcional).
 * - StatCard       → cartão de KPI/indicador (CARD p-5, chip de ícone + valor + delta opcional).
 * - DetailScreen   → casca de tela de DETALHE (largura 5xl/6xl + rodapé fixo casado).
 */
import type { ComponentType, ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { CARD, toneBadge, type Tone } from '@/lib/surfaces'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type IconType = ComponentType<{ className?: string }>

// Casca da página de lista. `width` cobre exceções (ex.: wizard mais estreito).
export function PageContainer({ width = 'max-w-6xl', className, children }: { width?: string; className?: string; children: ReactNode }) {
  return <div className={cn('mx-auto space-y-7 px-5 py-8 lg:px-8', width, className)}>{children}</div>
}

// Cabeçalho de lista. `title` é ReactNode → cobre "ícone + título" e o greeting (sem ícone) do Dashboard.
export function PageHeader({ icon: Icon, title, desc, actions }: { icon?: IconType; title: ReactNode; desc?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-1.5">
        <h1 className="flex items-center gap-2.5 font-heading text-3xl font-bold tracking-tight text-foreground">
          {Icon && <Icon className="size-7 shrink-0 text-primary-text" aria-hidden />}
          {title}
        </h1>
        {desc && <p className="max-w-2xl ty-body text-muted-foreground">{desc}</p>}
      </div>
      {actions}
    </header>
  )
}

// Cartão de seção. `bodyClassName` permite `space-y-*` (seções com sub-blocos) ou layout próprio do corpo.
export function Panel({ icon: Icon, title, desc, action, className, bodyClassName, children }: {
  icon?: IconType; title: ReactNode; desc?: ReactNode; action?: ReactNode; className?: string; bodyClassName?: string; children: ReactNode
}) {
  return (
    <section className={cn(CARD, 'flex flex-col p-6', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {Icon && <Icon className="mt-0.5 size-5 shrink-0 text-primary-text" aria-hidden />}
          <div className="space-y-0.5">
            <h2 className="ty-body-lg text-foreground" style={{ fontWeight: 'var(--font-weight-bold)' }}>{title}</h2>
            {desc && <p className="ty-caption text-muted-foreground">{desc}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className={cn('mt-5 flex-1', bodyClassName)}>{children}</div>
    </section>
  )
}

// Cartão de KPI/indicador. Chip de ícone (token primário) + valor; `delta` é a linha de variação opcional.
export function StatCard({ icon: Icon, label, value, delta, className }: {
  icon: IconType; label: ReactNode; value: ReactNode; delta?: ReactNode; className?: string
}) {
  return (
    <div className={cn(CARD, 'p-5', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="ty-overline text-muted-foreground">{label}</p>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary-text" aria-hidden><Icon className="size-4.5" /></span>
      </div>
      <p className="mt-3 font-heading text-3xl font-bold tabular-nums tracking-tight text-foreground">{value}</p>
      {delta}
    </div>
  )
}

// Casca de tela de detalhe: container + rodapé fixo SEMPRE com a mesma largura (5xl = 1 coluna, 6xl = 2 colunas).
const DETAIL_WIDTH = { '5xl': 'max-w-5xl', '6xl': 'max-w-6xl' } as const
export function DetailScreen({ crumb, width = '5xl', footer, children }: {
  crumb?: ReactNode; width?: keyof typeof DETAIL_WIDTH; footer?: ReactNode; children: ReactNode
}) {
  const w = DETAIL_WIDTH[width]
  return (
    <div className="flex min-h-full flex-col">
      <div className={cn('mx-auto w-full flex-1 space-y-6 px-5 py-6 lg:px-8', w)}>
        {crumb && <p className="ty-caption text-muted-foreground">{crumb}</p>}
        {children}
      </div>
      {footer && (
        <footer className="sticky bottom-0 z-10 border-t border-border/40 bg-card/80 backdrop-blur-sm">
          <div className={cn('mx-auto flex flex-wrap items-center justify-between gap-3 px-5 py-3 lg:px-8', w)}>{footer}</div>
        </footer>
      )}
    </div>
  )
}

/* ─────────────────────────────── StatusBadge ─────────────────────────────── */

// Vocabulário de tons do badge: os 4 de `toneBadge` (primary/secondary/destructive/success) + 'muted'
// (neutro). Cada um já é AA nos 4 temas (fundo a 10% + texto -text); 'muted' usa o par muted-foreground.
export const badgeTone = { ...toneBadge, muted: 'bg-muted text-muted-foreground' } as const
export type BadgeTone = Tone | 'muted'

/**
 * Pílula de status/etapa token-driven. Antes cada página redeclarava um `Record<Status, 'bg-X/10 text-X-text'>`
 * com a string de classe; agora a página passa só o mapa valor→TOM e a renderização (variant ghost + cn)
 * mora aqui. `dot` adiciona o ponto colorido (bg-current) usado nos status de Usuários.
 */
export function StatusBadge<V extends string>({ value, tones, dot, size = 'caption', className }: {
  value: V; tones: Record<V, BadgeTone>; dot?: boolean; size?: 'caption' | 'body-sm'; className?: string
}) {
  return (
    <Badge variant="ghost" className={cn(size === 'body-sm' ? 'ty-body-sm' : 'ty-caption', 'font-medium', dot && 'gap-1.5', badgeTone[tones[value]], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {value}
    </Badge>
  )
}

/* ─────────────────────────────── Paginacao ─────────────────────────────── */

/**
 * Controles de paginação (prev/next + "Mostrando X–Y de N" + leitura viva da página). Substitui a barra
 * que estava copiada em 5 telas. Casa com o hook `usePagination` (lib/usePagination). `compact` usa botões
 * só-ícone (variante do calendário de entrevistas); o padrão usa botões com rótulo "Anterior/Próxima".
 * O call-site decide SE renderiza (mantém os guards existentes, ex.: só quando total > 1).
 */
export function Paginacao({ page, total, inicio, shown, totalItems, onPage, compact = false, className }: {
  page: number; total: number; inicio: number; shown: number; totalItems: number
  onPage: (p: number | ((prev: number) => number)) => void
  compact?: boolean; className?: string
}) {
  const size = compact ? 'icon-sm' : 'sm'
  return (
    <div className={cn('mt-4 flex items-center justify-between gap-3 border-t border-border/50 pt-4', className)}>
      <p className="ty-caption text-muted-foreground">
        Mostrando <span className="font-medium tabular-nums text-foreground">{inicio + 1}–{inicio + shown}</span> de <span className="font-medium tabular-nums text-foreground">{totalItems}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size={size} aria-label="Página anterior" onClick={() => onPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
          <ChevronLeft aria-hidden />{!compact && <span>Anterior</span>}
        </Button>
        <span className="ty-caption tabular-nums text-muted-foreground" aria-live="polite">{page} de {total}</span>
        <Button variant="outline" size={size} aria-label="Próxima página" onClick={() => onPage((p) => Math.min(total, p + 1))} disabled={page >= total}>
          {!compact && <span>Próxima</span>}<ChevronRight aria-hidden />
        </Button>
      </div>
    </div>
  )
}
