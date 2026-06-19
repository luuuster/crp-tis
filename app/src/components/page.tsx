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
import { ChevronLeft, ChevronRight, RotateCcw, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { CARD, toneBadge, type Tone } from '@/lib/surfaces'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { TableCell, TableRow } from '@/components/ui/table'

type IconType = ComponentType<{ className?: string }>

// Casca da página de lista. `width` cobre exceções (ex.: wizard mais estreito).
export function PageContainer({ width = 'max-w-6xl', className, children }: { width?: string; className?: string; children: ReactNode }) {
  return <div className={cn('mx-auto space-y-7 px-5 py-8 lg:px-8', width, className)}>{children}</div>
}

// Cabeçalho de lista. `title` é ReactNode → cobre "ícone + título" e o greeting (sem ícone) do Dashboard.
export function PageHeader({ icon: Icon, title, desc, actions }: { icon?: IconType; title: ReactNode; desc?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
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
// `loading` troca o valor por um skeleton (mesma altura) — KPIs e tabela carregam juntos, sem flash de "0".
export function StatCard({ icon: Icon, label, value, delta, loading, className }: {
  icon: IconType; label: ReactNode; value: ReactNode; delta?: ReactNode; loading?: boolean; className?: string
}) {
  return (
    <div className={cn(CARD, 'p-5', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="ty-overline text-muted-foreground">{label}</p>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary-text" aria-hidden><Icon className="size-4.5" /></span>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-9 w-20" />
      ) : (
        <p className="mt-3 font-heading text-3xl font-bold tabular-nums tracking-tight text-foreground">{value}</p>
      )}
      {!loading && delta}
    </div>
  )
}

// Linhas de SKELETON para o corpo de tabela durante a carga (vai dentro do <TableBody>). `cols` = nº de
// colunas; larguras variadas p/ parecer conteúdo real, não barras iguais. Decorativo (sem texto/role).
const SKEL_W = ['w-28', 'w-16', 'w-24', 'w-20', 'w-14', 'w-24', 'w-16', 'w-20']
export function TableSkeleton({ rows = 6, cols }: { rows?: number; cols: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <TableRow key={r} className="hover:bg-transparent">
          {Array.from({ length: cols }).map((_, c) => (
            <TableCell key={c} className="py-3.5"><Skeleton className={cn('h-4', SKEL_W[c % SKEL_W.length])} /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
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
        <footer className="sticky bottom-0 z-10 border-t border-border/40 bg-card/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm">
          <div className={cn('mx-auto flex flex-wrap items-center justify-between gap-3 px-5 py-3 lg:px-8', w)}>{footer}</div>
        </footer>
      )}
    </div>
  )
}

/* ─────────────────────────────── StatusBadge ─────────────────────────────── */

// Vocabulário de tons do badge: os semânticos de `toneBadge` (primary/secondary/destructive/success/
// warning) + 'muted' (neutro) + paleta de DADOS (blue/violet/teal). Cada um é AA nos 4 temas.
// IMPORTANTE: primary/secondary são a MARCA — só p/ identidade/ação. Categoria/status/papel que precisa
// de hue distinto usa a paleta de dados (tokens chart-*, fixos, NÃO seguem a marca) ou 'muted'; assim o
// rebrand não repinta dado. Par soft/soft-foreground dos chart = AA em light e dark.
export const badgeTone = {
  ...toneBadge,
  muted: 'bg-muted text-muted-foreground',
  blue: 'bg-[var(--chart-1-soft)] text-[var(--chart-1-soft-foreground)]',
  violet: 'bg-[var(--chart-2-soft)] text-[var(--chart-2-soft-foreground)]',
  teal: 'bg-[var(--chart-6-soft)] text-[var(--chart-6-soft-foreground)]',
} as const
export type BadgeTone = Tone | 'muted' | 'blue' | 'violet' | 'teal'

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
  const { t } = useTranslation('common')
  const size = compact ? 'icon-sm' : 'sm'
  return (
    <div className={cn('mt-4 flex items-center justify-between gap-3 border-t border-border/50 pt-4', className)}>
      <p className="ty-caption text-muted-foreground">
        {t('paginacao.mostrando')} <span className="font-medium tabular-nums text-foreground">{inicio + 1}–{inicio + shown}</span> {t('paginacao.de')} <span className="font-medium tabular-nums text-foreground">{totalItems}</span>
      </p>
      <div className="flex items-center gap-3">
        {/* Contador FORA do par (não-compact): senão o "Anterior" desabilitado (opacity-50) fica órfão
            entre os dois botões. Agrupados, prev/next leem como UM controle mesmo com um deles desabilitado. */}
        {!compact && <span className="ty-caption tabular-nums text-muted-foreground" aria-live="polite">{t('paginacao.pagina')} {page} {t('paginacao.de')} {total}</span>}
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size={size} aria-label={t('paginacao.paginaAnterior')} onClick={() => onPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            <ChevronLeft aria-hidden />{!compact && <span>{t('paginacao.anterior')}</span>}
          </Button>
          {compact && <span className="px-0.5 ty-caption tabular-nums text-muted-foreground" aria-live="polite">{page} {t('paginacao.de')} {total}</span>}
          <Button variant="outline" size={size} aria-label={t('paginacao.proximaPagina')} onClick={() => onPage((p) => Math.min(total, p + 1))} disabled={page >= total}>
            {!compact && <span>{t('paginacao.proxima')}</span>}<ChevronRight aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Estado VAZIO (lista/filtro sem resultados): ícone + título + descrição + ação opcional (ex.: "Limpar
// filtros"). Vai DENTRO do <td colSpan> da tabela quando o filtro zera a lista; o ícone é decorativo.
export function EmptyState({ icon: Icon, title, description, action, className }: {
  icon: IconType; title: ReactNode; description?: ReactNode; action?: ReactNode; className?: string
}) {
  return (
    <Empty className={cn('py-12', className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon"><Icon aria-hidden /></EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  )
}

// Estado de ERRO ao carregar (espelha o empty-state do app: ícone + texto + ação). `role="alert"` anuncia;
// `onRetry` mostra o botão "Tentar novamente" (casa com useAsync.retry). Rótulos via i18n (default chrome).
export function ErrorState({ title, description, onRetry, className }: { title?: string; description?: string; onRetry?: () => void; className?: string }) {
  const { t } = useTranslation('common')
  return (
    <div role="alert" className={cn('flex flex-col items-center justify-center gap-3 rounded-xl bg-muted/30 py-12 text-center', className)}>
      <TriangleAlert className="size-7 text-warning-text" aria-hidden />
      <div className="space-y-1">
        <p className="ty-body-sm font-medium text-foreground">{title ?? t('erro.tituloCarregar')}</p>
        <p className="ty-caption text-muted-foreground">{description ?? t('erro.descricaoCarregar')}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCcw aria-hidden /> {t('tentarNovamente')}
        </Button>
      )}
    </div>
  )
}
