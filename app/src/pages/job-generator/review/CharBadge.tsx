import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

// Selo de contagem de caracteres (verde = ideal p/ engajamento; âmbar = acima do limite).
export function CharBadge({ len, limit = 2000 }: { len: number; limit?: number }) {
  const { t, i18n } = useTranslation('gerador')
  const ok = len <= limit
  return (
    <div className={cn('flex flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-lg px-3 py-2 ty-body-sm', ok ? 'bg-success/10 text-success-text' : 'bg-warning/10 text-warning-text')}>
      <span className={cn('size-1.5 shrink-0 rounded-full', ok ? 'bg-success' : 'bg-warning')} aria-hidden />
      <span className="tabular-nums">{t('charBadge.caracteres', { num: len.toLocaleString(i18n.language) })}</span>
      <span className="text-muted-foreground">{ok ? t('charBadge.ideal', { limit: limit.toLocaleString(i18n.language) }) : t('charBadge.acima', { limit: limit.toLocaleString(i18n.language) })}</span>
    </div>
  )
}
