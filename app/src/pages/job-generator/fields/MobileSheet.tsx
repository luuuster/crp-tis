import { type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'

import { cn } from '@/lib/utils'
import { focusRing } from '@/lib/focus'
import { FLOAT } from '@/lib/surfaces'

/** Bottom sheet (mobile): desliza de baixo, alça + título + fechar. É o "padrão de mobile" p/ seleção
 * — substitui o dropdown ancorado / a modal flutuante em telas estreitas (< md). O foco abre no
 * "Fechar" (1º focável do DOM), então NÃO dispara o teclado: o usuário toca na busca quando quer filtrar. */
export function MobileSheet({ open, onOpenChange, title, description = 'Selecione uma opção da lista.', trigger, children }: {
  open: boolean; onOpenChange: (v: boolean) => void; title: string; description?: string; trigger: ReactNode; children: ReactNode
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-xs motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:fade-in-0 motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content className={cn('fixed inset-x-0 bottom-0 z-50 flex max-h-[60vh] flex-col overflow-hidden rounded-t-2xl bg-popover pb-[env(safe-area-inset-bottom)] text-popover-foreground outline-none motion-safe:duration-200 motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:slide-in-from-bottom motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:slide-out-to-bottom', FLOAT)}>
          <div className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-border" aria-hidden />
          <div className="flex shrink-0 items-center gap-2 px-4 pt-2 pb-3">
            <DialogPrimitive.Title className="ty-label font-semibold text-foreground">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close aria-label="Fechar" className={cn('-mr-1 ml-auto flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground', focusRing)}><X className="size-4.5" aria-hidden /></DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="sr-only">{description}</DialogPrimitive.Description>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
