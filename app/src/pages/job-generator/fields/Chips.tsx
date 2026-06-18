import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, GripHorizontal, Plus, Search, Trash2, X } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'

import { cn } from '@/lib/utils'
import { focusRing } from '@/lib/focus'
import { FLOAT } from '@/lib/surfaces'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { useIsMobile } from '@/components/shell/AppShell'
import { MobileSheet } from './MobileSheet'
import { SheetSearch } from './sheet-parts'

export function Chips({ value, onChange, pool, addLabel, emptyHint, searchPlaceholder, ordered, labelOf, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedby, "aria-labelledby": ariaLabelledby }: {
  value: string[]; onChange: (v: string[]) => void; pool: readonly string[]; addLabel?: string; emptyHint?: string; searchPlaceholder?: string; ordered?: boolean
  // labelOf: traduz só a EXIBIÇÃO (o valor canônico pt-BR permanece em value/onChange e no pool/comparações).
  labelOf?: (value: string) => string
  "aria-invalid"?: boolean; "aria-describedby"?: string; "aria-labelledby"?: string
}) {
  const { t } = useTranslation('gerador')
  const lbl = labelOf ?? ((v: string) => v)
  const label = addLabel ?? t('chips.adicionarMais')
  const search = searchPlaceholder ?? t('select.selecione')
  // Desktop: "+ adicionar" abre uma MODAL flutuante (SEM overlay), ARRASTÁVEL pela alça do topo.
  // Mobile: o mesmo conteúdo (busca + CHECKBOXES) vira um BOTTOM SHEET (padrão de mobile).
  // Cada item é um checkbox de verdade (estado lido por leitores de tela; Tab + Espaço) e a marcação
  // aplica na hora — dá p/ adicionar vários sem fechar.
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null) // null = centralizado via CSS
  const drag = useRef<{ ox: number; oy: number; el: HTMLElement } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const toggle = (b: string) => onChange(value.includes(b) ? value.filter((x) => x !== b) : [...value, b])
  // modo ORDENADO: troca o item i com o vizinho (cima/baixo) — a ORDEM do array É a sequência.
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= value.length) return
    const next = value.slice()
    const tmp = next[i]
    next[i] = next[j]
    next[j] = tmp
    onChange(next)
  }
  // A lista SEMPRE inclui o que já está selecionado (mesmo fora do pool) — senão um item pré-marcado
  // não apareceria na busca p/ desmarcar/remarcar. Protege todos os campos de chips contra esse descompasso.
  const options = [...pool, ...value.filter((v) => !pool.includes(v))]
  // Busca casa o valor canônico OU o rótulo traduzido (ex.: buscar "interview" achar "Entrevista…").
  const q = query.trim().toLowerCase()
  const filtered = options.filter((b) => b.toLowerCase().includes(q) || lbl(b).toLowerCase().includes(q))

  // Arrasta a modal pela alça: fixa em left/top a partir da posição atual e segue o ponteiro (com clamp
  // nas bordas). setPointerCapture garante o move mesmo se o cursor sai da alça.
  const onGrab = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget.parentElement as HTMLElement
    const r = el.getBoundingClientRect()
    drag.current = { ox: e.clientX - r.left, oy: e.clientY - r.top, el }
    setPos({ x: r.left, y: r.top })
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onDragMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    const x = Math.min(Math.max(8, e.clientX - d.ox), window.innerWidth - d.el.offsetWidth - 8)
    const y = Math.min(Math.max(8, e.clientY - d.oy), window.innerHeight - d.el.offsetHeight - 8)
    setPos({ x, y })
  }
  const onRelease = (e: ReactPointerEvent<HTMLDivElement>) => {
    drag.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const addTrigger = (
    <button type="button" aria-label={t('chips.adicionar', { label })} className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 ty-body-sm font-medium text-primary-text transition-colors hover:bg-primary/10', focusRing)}><Plus className="size-3.5" aria-hidden /> {t('chips.adicionarMais')}</button>
  )

  return (
    <div role="group" aria-labelledby={ariaLabelledby} data-invalid={ariaInvalid ? '' : undefined} aria-describedby={ariaDescribedby} className={ordered ? 'space-y-2' : 'flex flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-muted/50 p-2 data-[invalid]:border-destructive'}>
      {value.length === 0 && emptyHint && <span className={ordered ? 'block ty-body-sm text-muted-foreground' : 'px-1.5 py-1 ty-body-sm text-muted-foreground'}>{emptyHint}</span>}
      {ordered
        ? value.length > 0 && (
            <ol className="space-y-2">
              {value.map((b, i) => (
                <li key={b} className="flex items-center gap-2.5 rounded-lg border border-border/70 bg-muted/50 px-2.5 py-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 ty-label-sm font-semibold text-primary-text tabular-nums" aria-hidden>{i + 1}</span>
                  <span className="min-w-0 flex-1 ty-body-sm text-foreground"><span className="sr-only">{t('chips.etapaPrefixo', { n: i + 1 })}</span>{lbl(b)}</span>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button type="button" aria-label={t('chips.moverItemCima', { item: lbl(b) })} disabled={i === 0} onClick={() => move(i, -1)} className={cn('flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30', focusRing)}><ChevronUp className="size-4" aria-hidden /></button>
                    <button type="button" aria-label={t('chips.moverItemBaixo', { item: lbl(b) })} disabled={i === value.length - 1} onClick={() => move(i, 1)} className={cn('flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30', focusRing)}><ChevronDown className="size-4" aria-hidden /></button>
                    <button type="button" aria-label={t('chips.remover', { item: lbl(b) })} onClick={() => onChange(value.filter((x) => x !== b))} className={cn('flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground', focusRing)}><X className="size-4" aria-hidden /></button>
                  </div>
                </li>
              ))}
            </ol>
          )
        : value.map((b) => (
            <span key={b} className="inline-flex items-center gap-1.5 rounded-full bg-background py-1 pr-1.5 pl-2.5 ty-body-sm text-foreground shadow-sm ring-1 ring-surface-ring">
              {lbl(b)}
              <button type="button" aria-label={t('chips.remover', { item: lbl(b) })} onClick={() => onChange(value.filter((x) => x !== b))} className={cn('-mr-1 flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground', focusRing)}><X className="size-3.5" aria-hidden /></button>
            </span>
          ))}
      {isMobile ? (
        /* Mobile: bottom sheet (padrão de mobile) com busca + checkboxes. */
        <MobileSheet
          open={open} onOpenChange={(o) => { setOpen(o); if (o) setQuery('') }}
          title={t('chips.adicionar', { label })} description={t('chips.sheetDescricao')}
          trigger={addTrigger}
        >
          <SheetSearch value={query} onChange={setQuery} placeholder={search} />
          <div role="group" aria-label={t('chips.opcoesDe', { label })} className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2">
            {filtered.length === 0
              ? <p className="px-3 py-8 text-center ty-body-sm text-muted-foreground">{t('chips.nadaEncontrado')}</p>
              : filtered.map((b) => (
                  <label key={b} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 ty-body transition-colors hover:bg-accent hover:text-accent-foreground has-[:focus-visible]:bg-accent">
                    <Checkbox checked={value.includes(b)} onCheckedChange={() => toggle(b)} />
                    {lbl(b)}
                  </label>
                ))}
          </div>
          {value.length > 0 && (
            <div className="shrink-0 border-t border-border/60 p-2">
              <ConfirmDialog
                icon={Trash2} tone="destructive" confirmVariant="destructive"
                title={t('chips.limparTitulo')} description={t('chips.limparDescricao', { count: value.length })}
                confirmLabel={t('chips.limparTudo')} onConfirm={() => onChange([])}
                trigger={
                  <button type="button" className={cn('flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-3 ty-body font-medium text-destructive-text transition-colors hover:bg-destructive/10', focusRing)}>
                    <Trash2 className="size-4 shrink-0" aria-hidden /> {t('chips.limparTudoContagem', { count: value.length })}
                  </button>
                }
              />
            </div>
          )}
        </MobileSheet>
      ) : (
      <DialogPrimitive.Root open={open} onOpenChange={(o) => { setOpen(o); if (o) { setPos(null); setQuery('') } }}>
        <DialogPrimitive.Trigger asChild>{addTrigger}</DialogPrimitive.Trigger>
        {/* pos null = centralizado (CSS); ao arrastar, fixa em left/top. Fecha por Esc / X / clique fora. */}
        <DialogPrimitive.Portal>
          <DialogPrimitive.Content
            onOpenAutoFocus={(e) => { e.preventDefault(); inputRef.current?.focus() }}
            style={pos ? { left: pos.x, top: pos.y } : undefined}
            className={cn(
              'fixed z-50 flex max-h-[80vh] w-[calc(100%-2rem)] max-w-sm flex-col overflow-hidden rounded-xl bg-popover p-0 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
              pos ? '' : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
              FLOAT,
            )}
          >
            {/* alça de arraste: título (= nome acessível do diálogo) + fechar */}
            <div onPointerDown={onGrab} onPointerMove={onDragMove} onPointerUp={onRelease} className="flex shrink-0 touch-none cursor-grab items-center gap-1.5 border-b border-border/60 px-3 py-2 select-none active:cursor-grabbing">
              <GripHorizontal className="size-4 shrink-0 text-muted-foreground/70" aria-hidden />
              <DialogPrimitive.Title className="ty-label-sm font-semibold text-foreground">{t('chips.adicionar', { label })}</DialogPrimitive.Title>
              <DialogPrimitive.Close onPointerDown={(e) => e.stopPropagation()} aria-label={t('chips.fechar')} className={cn('ml-auto flex size-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground', focusRing)}>
                <X className="size-4" aria-hidden />
              </DialogPrimitive.Close>
            </div>
            <DialogPrimitive.Description className="sr-only">{t('chips.sheetDescricao')}</DialogPrimitive.Description>
            {/* busca */}
            <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-3">
              <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={search} aria-label={search} className="h-10 w-full bg-transparent ty-body-sm text-foreground outline-none placeholder:text-muted-foreground" />
            </div>
            {/* lista de checkboxes (estado anunciado nativamente; Tab + Espaço). max-h-80 ≈ 8 itens
                visíveis; o resto entra por scroll, deixando a modal compacta. */}
            <div role="group" aria-label={t('chips.opcoesDe', { label })} className="min-h-0 max-h-80 space-y-0.5 overflow-y-auto p-1.5">
              {filtered.length === 0
                ? <p className="px-2.5 py-6 text-center ty-body-sm text-muted-foreground">{t('chips.nadaEncontrado')}</p>
                : filtered.map((b) => (
                    <label key={b} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 ty-body-sm transition-colors hover:bg-accent hover:text-accent-foreground has-[:focus-visible]:bg-accent">
                      <Checkbox checked={value.includes(b)} onCheckedChange={() => toggle(b)} />
                      {lbl(b)}
                    </label>
                  ))}
            </div>
            {value.length > 0 && (
              <div className="shrink-0 border-t border-border/60 p-1.5">
                <ConfirmDialog
                  icon={Trash2} tone="destructive" confirmVariant="destructive"
                  title={t('chips.limparTitulo')} description={t('chips.limparDescricao', { count: value.length })}
                  confirmLabel={t('chips.limparTudo')} onConfirm={() => onChange([])}
                  trigger={
                    <button type="button" className={cn('flex w-full items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 ty-body-sm font-medium text-destructive-text transition-colors hover:bg-destructive/10', focusRing)}>
                      <Trash2 className="size-3.5" aria-hidden /> {t('chips.limparTudoContagem', { count: value.length })}
                    </button>
                  }
                />
              </div>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
      )}
    </div>
  )
}
