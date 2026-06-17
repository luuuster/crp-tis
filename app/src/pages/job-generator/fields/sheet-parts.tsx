import { Check, Search } from 'lucide-react'

import { cn } from '@/lib/utils'
import { focusRing } from '@/lib/focus'

/** Campo de busca do sheet (mesmo visual nos selects e nos chips). */
export function SheetSearch({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-4">
      <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="h-11 w-full bg-transparent ty-body text-foreground outline-none placeholder:text-muted-foreground" />
    </div>
  )
}

/** Lista SINGLE-SELECT do sheet (listbox/option; selecionado destacado por cor/peso + check). */
export function SheetOptions({ id, options, value, onPick }: { id?: string; options: readonly string[]; value: string; onPick: (o: string) => void }) {
  return (
    <div id={id} role="listbox" aria-label="Opções" className="min-h-0 flex-1 overflow-y-auto p-2">
      {options.length === 0
        ? <p className="px-3 py-8 text-center ty-body-sm text-muted-foreground">Nada encontrado.</p>
        : options.map((o) => {
            const sel = value === o
            return (
              <button
                key={o} type="button" role="option" aria-selected={sel} onClick={() => onPick(o)}
                className={cn('flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left ty-body transition-colors hover:bg-accent hover:text-accent-foreground', focusRing, sel ? 'font-semibold text-primary-text' : 'text-foreground')}
              >
                <span className="line-clamp-2">{o}</span>
                {sel && <Check className="size-5 shrink-0 text-primary-text" aria-hidden />}
              </button>
            )
          })}
    </div>
  )
}
