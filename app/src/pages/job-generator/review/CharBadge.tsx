import { cn } from '@/lib/utils'

// Selo de contagem de caracteres (verde = ideal p/ engajamento; âmbar = acima do limite).
export function CharBadge({ len, limit = 2000 }: { len: number; limit?: number }) {
  const ok = len <= limit
  return (
    <div className={cn('flex flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-lg px-3 py-2 ty-body-sm', ok ? 'bg-success/10 text-success-text' : 'bg-warning/10 text-warning-text')}>
      <span className={cn('size-1.5 shrink-0 rounded-full', ok ? 'bg-success' : 'bg-warning')} aria-hidden />
      <span className="tabular-nums">{len.toLocaleString('pt-BR')} caracteres</span>
      <span className="text-muted-foreground">— {ok ? `Ideal para engajamento (≤ ${limit.toLocaleString('pt-BR')})` : `Acima do ideal (> ${limit.toLocaleString('pt-BR')})`}</span>
    </div>
  )
}
