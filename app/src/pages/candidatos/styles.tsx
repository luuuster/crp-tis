/**
 * Mapas de classe Tailwind (tokens DS) do Banco de talentos — auditáveis num lugar só
 * (no-hard-borders / tokens / texto colorido = variante -text). Sem JSX além do ComponentType
 * dos ícones (FASE_VISUAL). EtapaBadge mora aqui por depender de ETAPA_TOM + StatusBadge.
 */
import type { ComponentType } from 'react'
import { CheckCircle2, Circle, Clock, XCircle } from 'lucide-react'

import { StatusBadge, type BadgeTone } from '@/components/page'
import type { Etapa, ResultadoFase, StatusProc } from './types'

// Pílula de etapa: mapa valor→TOM (StatusBadge cuida da classe AA por tema).
// Mapa etapa→tom (token-driven, AA). 'Em entrevista' usa o tom `warning` (âmbar), agora no vocabulário.
export const ETAPA_TOM: Record<Etapa, BadgeTone> = {
  'Triagem': 'secondary',
  'Em entrevista': 'warning',
  'Entrevistado': 'primary',
  'Contratado': 'success',
  'Banco de talentos': 'muted',
  'Reprovado': 'destructive',
}
export function EtapaBadge({ value, className }: { value: Etapa; className?: string }) {
  return <StatusBadge value={value} tones={ETAPA_TOM} className={className} />
}

export const scoreTint = (s: number) => (s >= 80 ? 'bg-success/10 text-success-text' : s >= 65 ? 'bg-warning/10 text-warning-text' : 'bg-destructive/10 text-destructive-text')
// Cor do preenchimento da barra de nota de um critério (0–100).
export const notaBar = (n: number) => (n >= 70 ? 'bg-success' : n >= 50 ? 'bg-warning' : 'bg-destructive')

// Status do processo: mapa valor→TOM. Os dois call-sites usam tamanhos diferentes (caption/body-sm),
// resolvidos pela prop `size` do StatusBadge.
export const PROC_STATUS_TOM: Record<StatusProc, BadgeTone> = {
  'Em andamento': 'warning',
  'Contratado': 'success',
  'Reprovado': 'destructive',
}
export const PROC_BAR: Record<StatusProc, string> = {
  'Em andamento': 'bg-primary', 'Contratado': 'bg-success', 'Reprovado': 'bg-destructive',
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
