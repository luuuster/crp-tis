/**
 * Mapas de classe Tailwind (tokens DS) do Banco de talentos — auditáveis num lugar só
 * (no-hard-borders / tokens / texto colorido = variante -text). Sem JSX além do ComponentType
 * dos ícones (FASE_VISUAL). EtapaBadge mora aqui por depender de ETAPA_TOM + StatusBadge.
 */
import type { ComponentType } from 'react'
import { CheckCircle2, Circle, Clock, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { badgeTone, type BadgeTone } from '@/components/page'
import { Badge } from '@/components/ui/badge'
import type { Etapa, ResultadoFase, StatusProc } from './types'

// Pílula de etapa: mapa valor→TOM (token-driven, AA). O VALOR canônico pt-BR é mantido nos mapas/comparações;
// só a EXIBIÇÃO é traduzida (lookup `etapa.${value}`). 'Em entrevista' usa o tom `warning` (âmbar).
// Tons da ETAPA: semântico p/ desfecho (success/destructive/warning), neutro p/ "parado" (Banco) e a
// paleta de DADOS (blue/violet) p/ as etapas intermediárias — antes Triagem/Entrevistado vestiam a MARCA
// (secondary/primary), o que repintava o funil no rebrand e colidia com o verde de "Contratado".
export const ETAPA_TOM: Record<Etapa, BadgeTone> = {
  'Triagem': 'blue',
  'Em entrevista': 'warning',
  'Entrevistado': 'violet',
  'Contratado': 'success',
  'Banco de talentos': 'muted',
  'Reprovado': 'destructive',
}
export function EtapaBadge({ value, className }: { value: Etapa; className?: string }) {
  const { t } = useTranslation('candidatos')
  return (
    <Badge variant="ghost" className={cn('ty-caption font-medium', badgeTone[ETAPA_TOM[value]], className)}>
      {t(`etapa.${value}`)}
    </Badge>
  )
}

export const scoreTint = (s: number) => (s >= 80 ? 'bg-success/10 text-success-text' : s >= 65 ? 'bg-warning/10 text-warning-text' : 'bg-destructive/10 text-destructive-text')
// Cor do preenchimento da barra de nota de um critério (0–100).
export const notaBar = (n: number) => (n >= 70 ? 'bg-success' : n >= 50 ? 'bg-warning' : 'bg-destructive')

// Status do processo: mapa valor→TOM. O VALOR canônico pt-BR é mantido (comparações/mapas de cor);
// só a exibição é traduzida (`statusProc.${value}`). `size` casa os dois call-sites (caption/body-sm).
export const PROC_STATUS_TOM: Record<StatusProc, BadgeTone> = {
  'Em andamento': 'warning',
  'Contratado': 'success',
  'Reprovado': 'destructive',
}
export function ProcStatusBadge({ value, size = 'caption', className }: { value: StatusProc; size?: 'caption' | 'body-sm'; className?: string }) {
  const { t } = useTranslation('candidatos')
  return (
    <Badge variant="ghost" className={cn(size === 'body-sm' ? 'ty-body-sm' : 'ty-caption', 'font-medium', badgeTone[PROC_STATUS_TOM[value]], className)}>
      {t(`statusProc.${value}`)}
    </Badge>
  )
}
// Rótulo da senioridade traduzido (valor canônico pt-BR preservado nos filtros/selects/comparações).
export function useSenioridadeLabel() {
  const { t } = useTranslation('candidatos')
  return (value: string) => t(`senioridade.${value}` as 'senioridade.Júnior')
}
// Rótulo do resultado de uma fase traduzido (chave = a união literal de ResultadoFase).
export function useResultadoFaseLabel() {
  const { t } = useTranslation('candidatos')
  return (value: ResultadoFase) => t(`resultadoFase.${value}`)
}
// Barra do processo casada com o tom do badge (PROC_STATUS_TOM): 'Em andamento' = warning (âmbar), não
// mais a marca (bg-primary) — a barra não pode "vestir" a marca para indicar progresso.
export const PROC_BAR: Record<StatusProc, string> = {
  'Em andamento': 'bg-warning', 'Contratado': 'bg-success', 'Reprovado': 'bg-destructive',
}
export const FASE_VISUAL: Record<ResultadoFase, { bg: string; icon: ComponentType<{ className?: string }>; label: string }> = {
  'aprovado': { bg: 'bg-success/10 text-success-text', icon: CheckCircle2, label: 'Aprovado' },
  'reprovado': { bg: 'bg-destructive/10 text-destructive-text', icon: XCircle, label: 'Reprovado' },
  'em andamento': { bg: 'bg-warning/10 text-warning-text', icon: Clock, label: 'Em andamento' },
  'pendente': { bg: 'bg-muted text-muted-foreground', icon: Circle, label: 'Pendente' },
}
export const FASE_LABEL_COLOR: Record<ResultadoFase, string> = {
  'aprovado': 'text-success-text', 'reprovado': 'text-destructive-text', 'em andamento': 'text-warning-text', 'pendente': 'text-muted-foreground',
}
