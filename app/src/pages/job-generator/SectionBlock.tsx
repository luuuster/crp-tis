import { type ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { toneBadge } from '@/lib/surfaces'
import { StatusPill } from './StatusPill'
import type { SectionMeta, Status } from './model'

export function SectionBlock({ meta, status, children }: { meta: SectionMeta; status: Status; children: ReactNode }) {
  const Icon = meta.icon
  return (
    <section className="px-6 py-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', toneBadge.primary)}><Icon className="size-4.5" aria-hidden /></span>
          <div className="min-w-0">
            {/* ty-body-lg é unlayered e anula o utilitário font-bold → forço o peso pelo token (inline vence). */}
            <h2 className="ty-body-lg text-foreground" style={{ fontWeight: 'var(--font-weight-bold)' }}>{meta.title}</h2>
            <p className="ty-label-sm text-muted-foreground">{meta.desc}</p>
          </div>
        </div>
        <StatusPill status={status} />
      </header>
      <div className="mt-5">{children}</div>
    </section>
  )
}
