/**
 * Shell da área LOGADA do candidato (porta :5172) — topbar (logo + idioma/marca/tema + conta) com uma barra
 * de ABAS sublinhadas (Vagas · Minhas candidaturas). Compartilhado entre o mural (/painel) e as candidaturas
 * (/candidaturas), pra a navegação entre as duas seções ficar consistente. As abas são links reais (<a>):
 * navegação por pathname (cada rota recarrega o app nesta porta), com aria-current na ativa.
 *
 * 100% token-driven, multi-marca, claro/escuro e WCAG 2.2 AA.
 */
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, ClipboardList, LayoutGrid } from 'lucide-react'

import { cn } from '@/lib/utils'
import { focusRing } from '@/lib/focus'
import type { Brand, Mode } from '@/lib/useBrandMode'
import { Logo } from '@/components/auth/Logo'
import { ThemeToggles } from '@/components/ThemeToggles'
import { ContaMenu } from '@/components/candidato/ContaMenu'
import { Separator } from '@/components/ui/separator'

export type AbaCandidato = 'vagas' | 'candidaturas' | 'finalizadas'

const ABAS: { key: AbaCandidato; href: string; icon: LucideIcon }[] = [
  { key: 'vagas', href: '/painel', icon: LayoutGrid },
  { key: 'candidaturas', href: '/candidaturas', icon: ClipboardList },
  { key: 'finalizadas', href: '/candidaturas_finalizadas', icon: CheckCircle2 },
]

export function CandidatoShell({ brand, mode, onCycleBrand, onToggleMode, onSair, active, children }: {
  brand: Brand
  mode: Mode
  onCycleBrand: () => void
  onToggleMode: () => void
  onSair?: () => void
  active: AbaCandidato
  children: ReactNode
}) {
  const { t } = useTranslation('painel')
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-card/80 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-6xl px-6">
          {/* Linha 1: logo + controles de conta/tema */}
          <div className="flex h-16 items-center gap-4">
            <Logo brand={brand} className="h-8" />
            <div className="ml-auto flex items-center gap-1.5">
              <ThemeToggles brand={brand} mode={mode} onCycleBrand={onCycleBrand} onToggleMode={onToggleMode} />
              <Separator orientation="vertical" className="mx-1 h-5" />
              <ContaMenu onSair={onSair} />
            </div>
          </div>
          {/* Linha 2: abas sublinhadas (alinhadas à borda inferior do header). No mobile a faixa rola na
              horizontal (overflow-x-auto + itens shrink-0/nowrap) em vez de quebrar em 2 linhas. */}
          <nav aria-label={t('nav.label')} className="-mb-px flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {ABAS.map((aba) => {
              const ativo = aba.key === active
              return (
                <a
                  key={aba.key}
                  href={aba.href}
                  aria-current={ativo ? 'page' : undefined}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-2 border-b-2 px-3 pb-3 ty-body-sm font-medium whitespace-nowrap transition-colors',
                    ativo ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
                    focusRing,
                  )}
                >
                  <aba.icon className="size-4" aria-hidden /> {t(`nav.${aba.key}`)}
                </a>
              )
            })}
          </nav>
        </div>
      </header>
      {children}
    </div>
  )
}
