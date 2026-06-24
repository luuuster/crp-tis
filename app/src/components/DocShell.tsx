/**
 * Casca compartilhada das telas de documentação na porta :5174 — Arquitetura de Informação (/), User Flow
 * (/userflow) e Componentes (/componentes). Topbar com marca + navegação entre elas + dock de tema/marca/
 * idioma. Centraliza o useBrandMode e o layout. Navegação por rota real (recarrega).
 *
 * `noMain`: a tela já traz o próprio <main> (ex.: o Showcase) — evita aninhar dois landmarks main (a11y).
 */
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { focusRing } from '@/lib/focus'
import { useBrandMode } from '@/lib/useBrandMode'
import { Logo } from '@/components/auth/Logo'
import { ThemeToggles } from '@/components/ThemeToggles'

type DocTab = 'ia' | 'flow' | 'comp'

export function DocShell({ active, children, noMain = false }: { active: DocTab; children: ReactNode; noMain?: boolean }) {
  const { brand, mode, cycleBrand, toggleMode } = useBrandMode()
  const link = (href: string, key: DocTab, label: string) => (
    <a
      href={href}
      aria-current={active === key ? 'page' : undefined}
      className={cn(
        'rounded-md px-2.5 py-1 ty-body-sm font-medium transition-colors',
        active === key ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
        focusRing,
      )}
    >
      {label}
    </a>
  )
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-6">
          <a href="/" aria-label="TalentAI" className={cn('rounded-sm', focusRing)}><Logo brand={brand} className="h-8" /></a>
          <nav aria-label="Documentação" className="ml-1 flex items-center gap-1">
            {link('/', 'ia', 'Arquitetura')}
            {link('/userflow', 'flow', 'User Flow')}
            {link('/componentes', 'comp', 'Componentes')}
          </nav>
          <div className="ml-auto">
            <ThemeToggles brand={brand} mode={mode} onCycleBrand={cycleBrand} onToggleMode={toggleMode} />
          </div>
        </div>
      </header>
      {noMain ? children : (
        <main className="mx-auto w-full max-w-6xl px-6 pt-10 pb-16 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
          {children}
        </main>
      )}
    </div>
  )
}
