import { AlertTriangle, CheckCircle2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { focusRing } from '@/lib/focus'
import { STEPS } from './model'

export function Stepper({ step, onPick, complete }: { step: number; onPick: (n: number) => void; complete?: (n: number) => boolean }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-3" aria-label={`Progresso: etapa ${step} de ${STEPS.length}`}>
      {STEPS.map((s) => {
        const active = s.n === step
        const done = s.n < step
        const filled = complete ? complete(s.n) : false
        // etapa já visitada mas deixada com obrigatórios em branco (validação soft não trava) → aviso.
        const incomplete = done && !filled
        // "concluída" = preenchida e não-atual (vale p/ etapas passadas E futuras já completas — ex.: edição).
        const concluida = !active && filled
        const status = active ? 'Em andamento' : incomplete ? 'Incompleta' : concluida ? 'Concluída' : 'Próxima'
        // Clicável: etapa JÁ PASSADA (voltar/revisar) OU já COMPLETA (na edição, todas → todas clicáveis).
        // Só a futura ainda EM BRANCO fica travada (sem hover/foco/cursor).
        const navigable = !active && (done || filled)
        const card = cn(
          'flex w-full flex-col gap-3 rounded-xl p-4 text-left transition',
          active ? 'bg-primary/[0.05] shadow-sm ring-2 ring-primary/50'
            : incomplete ? 'bg-card shadow-sm ring-1 ring-destructive/40'
            : concluida ? 'bg-card shadow-sm ring-1 ring-foreground/[0.08]'
            : 'bg-muted/30 ring-1 ring-foreground/[0.06]', // futura em branco: recuada/travada, sem sombra
        )
        const inner = (
          <>
            <span className={cn('flex size-8 items-center justify-center rounded-full ty-label-sm font-semibold tabular-nums', incomplete ? 'bg-destructive text-destructive-foreground' : concluida ? 'bg-success text-success-foreground' : active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')} aria-hidden>
              {incomplete ? <AlertTriangle className="size-4" /> : concluida ? <CheckCircle2 className="size-4" /> : s.n}
            </span>
            <span className="space-y-0.5">
              {/* sr-only: o badge com o número é aria-hidden; aqui o leitor de tela recebe "Etapa N" e,
                  na atual, um "Você está aqui" explícito (reforça o aria-current="step" da div). */}
              <span className="sr-only">{active ? `Etapa ${s.n}, você está aqui: ` : `Etapa ${s.n}: `}</span>
              <span className="block ty-body-sm font-semibold text-foreground">{s.title}</span>
              <span className={cn('block ty-caption font-medium', active ? 'text-primary-text' : incomplete ? 'text-destructive-text' : concluida ? 'text-success-text' : 'text-muted-foreground')}>{status}</span>
            </span>
          </>
        )
        return (
          <li key={s.n}>
            {navigable ? (
              // focusRing traz `rounded-sm` e, por vir depois do card no cn(), o twMerge anularia o
              // rounded-xl do card (→ 4px). Reforço rounded-xl por último p/ o card manter os 12px.
              <button type="button" onClick={() => onPick(s.n)} className={cn(card, 'cursor-pointer hover:bg-accent/40', focusRing, 'rounded-xl')}>
                {inner}
              </button>
            ) : (
              <div aria-current={active ? 'step' : undefined} className={card}>
                {inner}
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
