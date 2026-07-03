/**
 * Linha de TOPO do candidato: marca à esquerda + o cluster (idioma · marca · tema + bolinha da conta) à
 * direita. Fonte ÚNICA compartilhada pelo header público (CandidatoHeader) e pela área logada
 * (CandidatoShell) — o que muda entre eles (sticky/shrink da casca, a faixa de abas embaixo) fica em cada
 * header; esta linha nunca diverge em logo, espaçamento ou cluster.
 *
 * Os controles de marca/tema vêm por props (o app aplica no <html> via useBrandMode — instância isolada
 * aqui dessincronizaria). Sem eles, mostra só a conta (quando `conta`). `logoHref` faz o logo virar link.
 */
import { cn } from '@/lib/utils'
import { focusRing } from '@/lib/focus'
import type { Brand, Mode } from '@/lib/useBrandMode'
import { Logo } from '@/components/auth/Logo'
import { ThemeToggles } from '@/components/ThemeToggles'
import { ContaMenu } from '@/components/candidato/ContaMenu'

export function CandidatoBrandRow({ brand, mode, onCycleBrand, onToggleMode, onSair, logoHref, logoLabel, conta = false }: {
  brand?: string
  mode?: Mode
  onCycleBrand?: () => void
  onToggleMode?: () => void
  onSair?: () => void
  logoHref?: string
  logoLabel?: string
  conta?: boolean
}) {
  const temToggles = !!(mode && onCycleBrand && onToggleMode)
  const logo = <Logo brand={brand} className="h-8" />
  return (
    <div className="flex h-16 items-center gap-4">
      {logoHref ? (
        <a href={logoHref} aria-label={logoLabel} className={cn('rounded-sm', focusRing)}>{logo}</a>
      ) : (
        logo
      )}
      {/* Grupo único à direita: os 3 toggles e, na sequência, a bolinha da conta (sem separador). */}
      {(temToggles || conta) && (
        <div className="ml-auto flex items-center gap-1.5">
          {mode && onCycleBrand && onToggleMode && (
            <ThemeToggles brand={(brand ?? 'crp') as Brand} mode={mode} onCycleBrand={onCycleBrand} onToggleMode={onToggleMode} />
          )}
          {conta && <ContaMenu onSair={onSair} />}
        </div>
      )}
    </div>
  )
}
