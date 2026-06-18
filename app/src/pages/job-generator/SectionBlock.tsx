import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { toneBadge } from '@/lib/surfaces'
import { StatusPill } from './StatusPill'
import type { SectionMeta, Status } from './model'

export function SectionBlock({ meta, status, children }: { meta: SectionMeta; status: Status; children: ReactNode }) {
  const { t } = useTranslation('gerador')
  const Icon = meta.icon
  // `key` é o id estável da seção; a tradução mora em sections.<key>.{title,desc} (ver gerador.json).
  const tk = (sub: 'title' | 'desc') => t(`sections.${meta.key}.${sub}` as 'sections.identidade.title')
  return (
    <section className="px-6 py-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', toneBadge.primary)}><Icon className="size-4.5" aria-hidden /></span>
          <div className="min-w-0">
            {/* ty-body-lg é unlayered e anula o utilitário font-bold → forço o peso pelo token (inline vence). */}
            <h2 className="ty-body-lg text-foreground" style={{ fontWeight: 'var(--font-weight-bold)' }}>{tk('title')}</h2>
            <p className="ty-label-sm text-muted-foreground">{tk('desc')}</p>
          </div>
        </div>
        <StatusPill status={status} />
      </header>
      <div className="mt-5">{children}</div>
    </section>
  )
}
