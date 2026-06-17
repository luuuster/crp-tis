import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ArrowRight, Bot, Mic, Paperclip, Trash2, UserRound, X } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'

import { cn } from '@/lib/utils'
import { focusRing } from '@/lib/focus'
import { toneBadge } from '@/lib/surfaces'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useIsMobile } from '@/components/shell/AppShell'
import { formatAgo, type Msg } from './model'
import { suggestionsFor, type Suggestion } from './charlie-suggestions'

export function CharlieRail({ open, onClose, step, msgs, onSuggestion, onSend, onClear }: {
  open: boolean; onClose: () => void; step: number; msgs: Msg[]
  onSuggestion: (s: Suggestion) => void; onSend: (text: string) => void; onClear: () => void
}) {
  const [draft, setDraft] = useState('')
  // `< lg`: o Charlie é um MODAL de tela cheia (Radix Dialog trata foco/Esc). `lg+`: painel lateral
  // NÃO-modal (dá p/ editar o form com ele aberto ao lado), então o Esc é manual aqui.
  const overlay = useIsMobile('(max-width: 1023px)')
  useEffect(() => {
    if (!open || overlay) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, overlay])

  // Desktop fechado: nada a renderizar (sem Radix). No mobile mantemos o Dialog.Root MONTADO mesmo
  // fechado — é assim que o Radix anima a saída e RESTAURA o foco ao gatilho (não pode desmontar antes).
  if (!overlay && !open) return null
  const suggestions = suggestionsFor(step)
  const submit = () => { const t = draft.trim(); if (!t) return; onSend(t); setDraft('') }

  const content = (
    <>
      <header className="flex items-center gap-3 border-b border-border/40 px-4 py-3">
        <span className="relative inline-flex">
          <Avatar className="size-9"><AvatarFallback className="bg-secondary font-semibold text-secondary-foreground">C</AvatarFallback></Avatar>
          <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-card bg-success" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="ty-body font-semibold text-foreground">Charlie</p>
          <p className="flex items-center gap-1.5 ty-caption font-medium text-muted-foreground"><span className="size-1.5 rounded-full bg-success" aria-hidden /> COPILOTO · <span className="text-success-text">ATIVO</span></p>
        </div>
        <Button variant="ghost" size="icon" aria-label="Fechar Charlie" onClick={onClose}><X /></Button>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <section className="space-y-2" aria-label="Sugestões">
          <h3 className="ty-overline text-muted-foreground">Sugestões para esta etapa</h3>
          <div className="space-y-2">
            {suggestions.map(({ icon: Icon, label, run }, i) => (
              <button key={i} type="button" onClick={() => onSuggestion({ icon: Icon, label, run })}
                className={cn('flex w-full items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5 text-left ty-body-sm transition-colors hover:bg-accent hover:text-accent-foreground', focusRing)}>
                <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-md', toneBadge.secondary)}><Icon className="size-4" /></span>
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3" aria-label="Conversa" aria-live="polite">
          <h3 className="ty-overline text-muted-foreground">Conversa</h3>
          {msgs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center text-muted-foreground"><Bot className="size-6" aria-hidden /><p className="max-w-48 ty-body-sm">Use uma sugestão acima ou escreva uma mensagem.</p></div>
          ) : (
            msgs.map((m) => (
              <div key={m.id} className={cn('flex items-start gap-2', m.role === 'user' && 'flex-row-reverse')}>
                {m.role === 'assistant'
                  ? <Avatar className="size-7"><AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">C</AvatarFallback></Avatar>
                  : <Avatar className="size-7"><AvatarFallback className="bg-muted text-muted-foreground"><UserRound className="size-3.5" /></AvatarFallback></Avatar>}
                <div className={cn('min-w-0', m.role === 'user' && 'flex flex-col items-end')}>
                  <div className={cn('w-fit max-w-64 rounded-2xl px-3 py-2 ty-body-sm', m.role === 'user' ? 'rounded-tr-sm bg-primary text-primary-foreground' : 'rounded-tl-sm bg-muted text-foreground')}>{m.text}</div>
                  <span className="mt-1 ty-caption text-muted-foreground">{formatAgo(m.at)}</span>
                </div>
              </div>
            ))
          )}
        </section>
      </div>

      <div className="border-t border-border/40 p-3">
        <div className="rounded-xl bg-muted/50 p-2 transition-colors focus-within:bg-background focus-within:ring-[3px] focus-within:ring-ring/50">
          <Label htmlFor="charlie-input" className="sr-only">Mensagem para o Charlie</Label>
          <Textarea id="charlie-input" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }} placeholder="Descreva a vaga ou pergunte…" className="min-h-10 resize-none border-0 bg-transparent p-1 shadow-none focus-visible:ring-0" />
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" aria-label="Anexar arquivo" onClick={() => toast.info('Anexar (demo).')}><Paperclip /></Button>
              <Button variant="ghost" size="icon" aria-label="Ditar por voz" onClick={() => toast.info('Voz (demo).')}><Mic /></Button>
            </div>
            <div className="flex items-center gap-2">
              {msgs.length > 0 && (
                <ConfirmDialog
                  icon={Trash2} tone="secondary" confirmVariant="secondary"
                  title="Limpar a conversa?"
                  description="Todo o histórico desta conversa com o Charlie será apagado."
                  confirmLabel="Limpar" onConfirm={onClear}
                  trigger={<Button variant="ghost">Limpar</Button>}
                />
              )}
              <Button onClick={submit} disabled={!draft.trim()}>Enviar <ArrowRight /></Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  // `< lg`: MODAL de tela cheia → Radix Dialog (foco PRESO + restaurado ao gatilho, scroll-lock,
  // aria-modal, fundo inerte, Esc). É o que fecha o gap de acessibilidade do overlay.
  if (overlay) {
    return (
      <DialogPrimitive.Root open={open} onOpenChange={(o) => { if (!o) onClose() }}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Content
            onCloseAutoFocus={(e) => { e.preventDefault(); document.querySelector<HTMLElement>('[aria-label="Falar com Charlie"]')?.focus() }}
            className="fixed inset-0 z-50 flex h-dvh w-full flex-col bg-card outline-none motion-safe:duration-200 motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:slide-in-from-right motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:slide-out-to-right"
          >
            <DialogPrimitive.Title className="sr-only">Charlie — copiloto</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">Sugestões e conversa para ajudar a montar a vaga.</DialogPrimitive.Description>
            {content}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    )
  }

  // `lg+`: painel lateral NÃO-modal (de propósito — dá p/ editar o form com o Charlie aberto ao lado).
  return (
    <aside aria-label="Copiloto Charlie" className="relative z-50 flex h-dvh w-[300px] shrink-0 flex-col border-l border-border/40 bg-card shadow-panel-r motion-safe:duration-200 motion-safe:animate-in motion-safe:slide-in-from-right">
      {content}
    </aside>
  )
}
