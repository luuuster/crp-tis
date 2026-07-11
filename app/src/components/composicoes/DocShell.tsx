/**
 * Casca compartilhada das telas de documentação na porta :5174 — Arquitetura de Informação (/), User Flow
 * (/userflow) e Componentes (/componentes). Topbar com marca + navegação entre elas + dock de tema/marca/
 * idioma. Centraliza o useBrandMode e o layout. Navegação por rota real (recarrega).
 *
 * `noMain`: a tela já traz o próprio <main> (ex.: o Showcase) — evita aninhar dois landmarks main (a11y).
 */
import type { ReactNode } from 'react'
import { Component, Network, Route } from 'lucide-react'

import { cn } from '@/lib/utils'
import { HEADER_SURFACE } from '@/lib/surfaces'
import { focusRing } from '@/lib/focus'
import { useBrandMode } from '@/lib/useBrandMode'
import { Logo } from '@/components/composicoes/auth/Logo'
import { ThemeToggles } from '@/components/composicoes/ThemeToggles'
import { SectionTabs } from '@/components/composicoes/SectionTabs'

type DocTab = 'ia' | 'flow' | 'comp'

const TABS = [
  { href: '/', key: 'ia', label: 'Arquitetura', icon: Network },
  { href: '/userflow', key: 'flow', label: 'User Flow', icon: Route },
  { href: '/componentes', key: 'comp', label: 'Componentes', icon: Component },
] as const

export function DocShell({ active, children, noMain = false }: { active: DocTab; children: ReactNode; noMain?: boolean }) {
  const { brand, mode, cycleBrand, toggleMode } = useBrandMode()
  return (
    <div className="min-h-dvh bg-background">
      <header className={cn('sticky top-0 z-30', HEADER_SURFACE)}>
        <div className="mx-auto w-full max-w-6xl px-5 lg:px-8">
          {/* Linha 1: marca + dock de tema/marca/idioma (mesma linha de topo do produto). */}
          <div className="flex h-16 items-center gap-4">
            <a href="/" aria-label="TalentAI" className={cn('rounded-sm', focusRing)}><Logo brand={brand} className="h-8" /></a>
            <div className="ml-auto">
              <ThemeToggles brand={brand} mode={mode} onCycleBrand={cycleBrand} onToggleMode={toggleMode} />
            </div>
          </div>
          {/* Linha 2: abas sublinhadas (mesmo padrão da área logada do candidato). */}
          <SectionTabs label="Documentação" tabs={TABS.map((tab) => ({ href: tab.href, label: tab.label, icon: tab.icon, active: active === tab.key }))} />
        </div>
      </header>
      {noMain ? children : (
        <main className="mx-auto w-full max-w-6xl px-5 pt-10 pb-16 lg:px-8 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
          {children}
        </main>
      )}
    </div>
  )
}
