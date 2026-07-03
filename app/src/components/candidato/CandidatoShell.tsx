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
import { HEADER_SURFACE } from '@/lib/surfaces'
import type { Brand, Mode } from '@/lib/useBrandMode'
import { CandidatoBrandRow } from '@/components/candidato/CandidatoBrandRow'
import { SectionTabs } from '@/components/SectionTabs'

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
      <header className={cn('sticky top-0 z-30', HEADER_SURFACE)}>
        <div className="mx-auto w-full max-w-6xl px-5 lg:px-8">
          {/* Linha 1: logo + controles de conta/tema — mesma linha de topo do header público. */}
          <CandidatoBrandRow brand={brand} mode={mode} onCycleBrand={onCycleBrand} onToggleMode={onToggleMode} onSair={onSair} conta />
          {/* Linha 2: abas sublinhadas (padrão compartilhado com a documentação). */}
          <SectionTabs label={t('nav.label')} tabs={ABAS.map((aba) => ({ href: aba.href, label: t(`nav.${aba.key}`), icon: aba.icon, active: aba.key === active }))} />
        </div>
      </header>
      {children}
    </div>
  )
}
