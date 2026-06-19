import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import * as SelectPrimitive from '@radix-ui/react-select'

import { cn } from '@/lib/utils'
import { FIELD, FLOAT } from '@/lib/surfaces'
import { useIsMobile } from '@/components/shell/AppShell'
import { MobileSheet } from './MobileSheet'
import { SheetOptions } from './sheet-parts'

/** Select limpo (Radix): parece um select normal, sem checkmark; campo preenchido e dropdown
 * definido por sombra (sem a borda preta marcada do popup nativo do SO). */
export function FormSelect({ id, value, onChange, options, placeholder, labelOf, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedby, "aria-required": ariaRequired }: {
  id: string; value: string; onChange: (v: string) => void; options: readonly string[]; placeholder?: string
  // labelOf: traduz só a EXIBIÇÃO (valor canônico pt-BR permanece em value/onChange). Sem ela, mostra o valor cru.
  labelOf?: (value: string) => string
  "aria-invalid"?: boolean; "aria-describedby"?: string; "aria-required"?: boolean
}) {
  const { t } = useTranslation('gerador')
  const lbl = labelOf ?? ((v: string) => v)
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)

  // Mobile: bottom sheet com a lista (padrão de mobile) no lugar do dropdown ancorado.
  if (isMobile) {
    return (
      <MobileSheet
        open={open} onOpenChange={setOpen} title={placeholder || t('select.selecione')}
        trigger={
          <button
            id={id} type="button" role="combobox" aria-expanded={open} aria-controls={open ? `${id}-list` : undefined}
            aria-invalid={ariaInvalid} aria-describedby={ariaDescribedby} aria-required={ariaRequired}
            className={cn('flex min-h-[var(--button-height-lg)] w-full items-center justify-between gap-2 border px-3 outline-none', FIELD, 'focus-visible:focus-ring dark:bg-input/30 dark:hover:bg-input/50', !value && 'text-muted-foreground')}
          >
            <span className="line-clamp-1 text-left">{value ? lbl(value) : placeholder}</span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground opacity-60" aria-hidden />
          </button>
        }
      >
        <SheetOptions id={`${id}-list`} options={options} value={value} labelOf={labelOf} onPick={(o) => { onChange(o); setOpen(false) }} />
      </MobileSheet>
    )
  }

  return (
    <SelectPrimitive.Root value={value} onValueChange={onChange}>
      <SelectPrimitive.Trigger
        id={id}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedby}
        aria-required={ariaRequired}
        className={cn(
          'flex min-h-[var(--button-height-lg)] w-full items-center justify-between gap-2 border px-3 outline-none', FIELD,
          'focus-visible:focus-ring',
          'data-[placeholder]:text-muted-foreground dark:bg-input/30 dark:hover:bg-input/50 [&>span]:line-clamp-1 [&>span]:text-left',
        )}
      >
        {/* children explícito: o Radix Value cacheia o texto do item ao selecionar e NÃO reage à troca de
            idioma — então renderizamos o rótulo traduzido nós mesmos (placeholder quando vazio). */}
        <SelectPrimitive.Value placeholder={placeholder}>{value ? lbl(value) : undefined}</SelectPrimitive.Value>
        <SelectPrimitive.Icon asChild><ChevronDown className="size-4 shrink-0 text-muted-foreground opacity-60" /></SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper" sideOffset={6}
          className={cn('relative z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl bg-popover text-popover-foreground motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:fade-in-0 motion-safe:data-[state=open]:zoom-in-95', FLOAT)}
        >
          <SelectPrimitive.Viewport className="max-h-72 overflow-y-auto p-1.5">
            {options.map((o) => (
              <SelectPrimitive.Item
                key={o} value={o}
                className="flex cursor-pointer items-center rounded-lg px-2.5 py-2 text-sm outline-none transition-colors select-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[state=checked]:font-semibold data-[state=checked]:text-primary-text"
              >
                <SelectPrimitive.ItemText>{lbl(o)}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}
