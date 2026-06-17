import { type ComponentType, type ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { toneBadge, type Tone } from '@/lib/surfaces'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

/**
 * Modal de confirmação reutilizável (AlertDialog) — OBRIGATÓRIO antes de QUALQUER ação destrutiva ou
 * irreversível (cancelar, excluir, desativar, reprovar, publicar…). Ícone tonal + título + descrição
 * do impacto + 2 ações. Acessível por padrão (foco preso, Esc fecha, foco volta ao gatilho — vem do Radix).
 * Use `trigger` p/ abrir por um botão (asChild) OU `open`/`onOpenChange` p/ controle externo.
 */
export function ConfirmDialog({
  open, onOpenChange, trigger, icon: Icon, tone = 'destructive',
  title, description, cancelLabel = 'Voltar', confirmLabel, confirmVariant = 'destructive', onConfirm,
}: {
  open?: boolean; onOpenChange?: (v: boolean) => void; trigger?: ReactNode
  icon: ComponentType<{ className?: string }>; tone?: Tone
  title: string; description: ReactNode; cancelLabel?: string; confirmLabel: string
  confirmVariant?: 'default' | 'destructive' | 'secondary' | 'warning'; onConfirm: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent className="max-w-md">
        <div className="flex items-start gap-4">
          <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', toneBadge[tone])}>
            <Icon className="size-5" />
          </span>
          <div className="space-y-1.5">
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          {/* Deferimos a ação 1 macrotask: quando o ConfirmDialog está ANINHADO em outro modal (Sheet,
              Dialog) e a ação fecha esse modal pai, fechar os dois no mesmo tick pode deixar o
              `pointer-events:none` preso no <body> (race de cleanup do Radix). O setTimeout deixa o
              AlertDialog fechar primeiro e a ação rodar depois — sem colisão. Inócuo nos casos não-aninhados. */}
          <AlertDialogAction variant={confirmVariant} onClick={() => setTimeout(onConfirm, 0)}>{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
