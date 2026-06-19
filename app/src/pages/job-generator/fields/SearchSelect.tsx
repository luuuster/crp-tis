import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { FIELD, FLOAT } from '@/lib/surfaces'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { useIsMobile } from '@/components/shell/AppShell'
import { MobileSheet } from './MobileSheet'
import { SheetSearch, SheetOptions } from './sheet-parts'

/** Select COM BUSCA p/ listas longas (Popover + cmdk): trigger igual ao FormSelect (FIELD), com um
 * campo de busca no topo do dropdown que filtra as opções. Selecionado destacado por cor/peso (sem
 * checkmark — mesmo padrão do FormSelect). Use quando há muitas opções (regra de bolso: > 7). */
export function SearchSelect({ id, value, onChange, options, placeholder, searchPlaceholder, labelOf, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedby, "aria-required": ariaRequired }: {
  id: string; value: string; onChange: (v: string) => void; options: readonly string[]; placeholder?: string; searchPlaceholder?: string
  // labelOf: traduz só a EXIBIÇÃO (valor canônico pt-BR permanece em value/onChange e no filtro do cmdk).
  labelOf?: (value: string) => string
  "aria-invalid"?: boolean; "aria-describedby"?: string; "aria-required"?: boolean
}) {
  const { t } = useTranslation('gerador')
  const { t: tc } = useTranslation('common')
  const search = searchPlaceholder ?? tc('buscar')
  const lbl = labelOf ?? ((v: string) => v)
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const triggerBtn = (
    <button
      id={id} type="button" role="combobox" aria-expanded={open} aria-controls={open ? `${id}-list` : undefined}
      aria-invalid={ariaInvalid} aria-describedby={ariaDescribedby} aria-required={ariaRequired}
      className={cn(
        'flex min-h-[var(--button-height-lg)] w-full items-center justify-between gap-2 border px-3 outline-none', FIELD,
        'focus-visible:focus-ring dark:bg-input/30 dark:hover:bg-input/50',
        !value && 'text-muted-foreground',
      )}
    >
      <span className="line-clamp-1 text-left">{value ? lbl(value) : placeholder}</span>
      <ChevronDown className="size-4 shrink-0 text-muted-foreground opacity-60" aria-hidden />
    </button>
  )

  // Mobile: bottom sheet com busca + lista (padrão de mobile) no lugar do popover ancorado.
  if (isMobile) {
    // Busca casa tanto o valor canônico quanto o rótulo traduzido (ex.: buscar "developer" achar "Desenvolvedor").
    const q = query.trim().toLowerCase()
    const filtered = options.filter((o) => o.toLowerCase().includes(q) || lbl(o).toLowerCase().includes(q))
    return (
      <MobileSheet open={open} onOpenChange={(o) => { setOpen(o); if (o) setQuery('') }} title={placeholder || t('select.selecione')} trigger={triggerBtn}>
        <SheetSearch value={query} onChange={setQuery} placeholder={search} />
        <SheetOptions id={`${id}-list`} options={filtered} value={value} labelOf={labelOf} onPick={(o) => { onChange(o); setOpen(false) }} />
      </MobileSheet>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{triggerBtn}</PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className={cn('w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-xl p-0', FLOAT)}>
        <Command>
          <CommandInput placeholder={search} />
          <CommandList id={`${id}-list`} className="p-1.5">
            <CommandEmpty>{t('select.nadaEncontrado')}</CommandEmpty>
            <CommandGroup className="p-0">
              {options.map((o) => (
                <CommandItem
                  key={o} value={o} keywords={labelOf ? [lbl(o)] : undefined}
                  onSelect={() => { onChange(o); setOpen(false) }}
                  className={cn('cursor-pointer rounded-lg px-2.5 py-2', value === o && 'font-semibold text-primary-text')}
                >
                  {lbl(o)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
