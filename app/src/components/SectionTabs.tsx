/**
 * Abas de SEÇÃO da plataforma — faixa sublinhada (border-b-2) com ícone + rótulo, alinhada à borda inferior
 * do header. Fonte ÚNICA do padrão de navegação por abas, compartilhada pela área logada do candidato
 * (CandidatoShell) e pela documentação (:5174 / DocShell), pra o estilo nunca divergir entre as telas.
 * No mobile a faixa rola na horizontal em vez de quebrar em duas linhas.
 */
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { focusRing } from '@/lib/focus'

export type SectionTab = { href: string; label: string; icon: LucideIcon; active?: boolean }

export function SectionTabs({ label, tabs }: { label: string; tabs: SectionTab[] }) {
  return (
    <nav aria-label={label} className="-mb-px flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((tab) => (
        <a
          key={tab.href}
          href={tab.href}
          aria-current={tab.active ? 'page' : undefined}
          className={cn(
            'inline-flex shrink-0 items-center gap-2 border-b-2 px-3 pb-3 ty-body-sm font-medium whitespace-nowrap transition-colors',
            tab.active ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            focusRing,
          )}
        >
          <tab.icon className="size-4" aria-hidden /> {tab.label}
        </a>
      ))}
    </nav>
  )
}
