/**
 * Abas de VISÃO (barra sublinhada) — alterna entre modos de uma mesma tela (ex.: Funil × Calendário).
 * Visual de tab bar: fio inferior contínuo + a aba ativa com underline na cor da marca. Diferente do
 * SectionTabs (que navega por <a href>), aqui é troca de ESTADO — grupo de botões `aria-pressed` (sem o
 * contrato tab/tabpanel do ARIA), então serve pra qualquer view switcher. 100% token-driven, WCAG 2.2 AA.
 */
import type { ComponentType } from 'react'

import { cn } from '@/lib/utils'
import { focusRing } from '@/lib/focus'

export type ViewTab<T extends string> = { value: T; label: string; icon?: ComponentType<{ className?: string }> }

export function ViewTabs<T extends string>({ value, onChange, options, ariaLabel, className }: {
  value: T
  onChange: (v: T) => void
  options: ViewTab<T>[]
  ariaLabel: string
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn('flex items-center gap-1 border-b border-border/60', className)}
    >
      {options.map((opt) => {
        const ativo = opt.value === value
        const Icon = opt.icon
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={ativo}
            onClick={() => onChange(opt.value)}
            className={cn(
              '-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-3 pb-2.5 pt-1 ty-body-sm whitespace-nowrap transition-colors',
              ativo ? 'border-primary font-semibold text-foreground' : 'border-transparent font-medium text-muted-foreground hover:text-foreground',
              focusRing,
            )}
          >
            {Icon && <Icon className="size-4 shrink-0" aria-hidden />}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
