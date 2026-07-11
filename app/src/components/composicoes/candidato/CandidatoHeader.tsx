/**
 * Header leve das telas do candidato no fluxo público (descrição da vaga, entrevista, agendamento). A linha
 * de topo (marca + cluster de idioma/marca/tema + conta) vem do CandidatoBrandRow — a MESMA da área logada
 * (CandidatoShell), pra o topo ficar consistente em todas as telas do candidato. Quando há sessão, o logo
 * vira link pro mural (/painel). `publico` força a visão "fora do sistema" (esconde a conta e o link).
 */
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { HEADER_SURFACE } from '@/lib/surfaces'
import { estaLogado } from '@/lib/candidatoSessao'
import type { Mode } from '@/lib/useBrandMode'
import { CandidatoBrandRow } from '@/components/composicoes/candidato/CandidatoBrandRow'

export function CandidatoHeader({ brand, mode, onCycleBrand, onToggleMode, onSair, publico = false }: {
  brand?: string
  mode?: Mode
  onCycleBrand?: () => void
  onToggleMode?: () => void
  onSair?: () => void
  publico?: boolean
}) {
  const { t } = useTranslation('painel')
  const logado = !publico && estaLogado()
  return (
    <header className={cn('sticky top-0 z-30 shrink-0', HEADER_SURFACE)}>
      <div className="mx-auto w-full max-w-6xl px-5 lg:px-8">
        <CandidatoBrandRow
          brand={brand} mode={mode} onCycleBrand={onCycleBrand} onToggleMode={onToggleMode} onSair={onSair}
          logoHref={logado ? '/painel' : undefined} logoLabel={t('conta.irMural')} conta={logado}
        />
      </div>
    </header>
  )
}
