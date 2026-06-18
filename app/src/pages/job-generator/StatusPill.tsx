import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import type { Status } from './model'

export function StatusPill({ status }: { status: Status }) {
  const { t } = useTranslation('gerador')
  const map = {
    completa: { text: 'text-success-text', dot: 'bg-success' },
    preenchendo: { text: 'text-primary-text', dot: 'bg-primary' },
    pendente: { text: 'text-muted-foreground', dot: 'bg-muted-foreground/40' },
    opcional: { text: 'text-muted-foreground', dot: 'bg-muted-foreground/40' },
  }[status]
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1.5 ty-caption font-semibold tracking-wide uppercase', map.text)}>
      <span className={cn('size-1.5 rounded-full', map.dot, status === 'preenchendo' && 'motion-safe:animate-pulse')} aria-hidden /> {t(`sectionStatus.${status}`)}
    </span>
  )
}
