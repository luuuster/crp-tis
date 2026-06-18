import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, HelpCircle } from 'lucide-react'

import { cn } from '@/lib/utils'
import { focusRing } from '@/lib/focus'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function Field({ id, label, required, hint, className, invalid, children }: {
  id: string; label: string; required?: boolean; hint?: string; className?: string; invalid?: boolean; children: ReactNode
}) {
  const { t } = useTranslation('gerador')
  // A11y do controle (injetado direto p/ leitores de tela): aria-labelledby liga o NOME (cobre grupos
  // como o Chips, que não têm <label for>); aria-required marca obrigatório (o "*" vira decorativo); e
  // aria-invalid + aria-describedby sinalizam o erro da validação soft (some sozinho ao preencher).
  const errId = `${id}-error`
  const labelId = `${id}-label`
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<{ 'aria-labelledby'?: string; 'aria-required'?: boolean; 'aria-invalid'?: boolean; 'aria-describedby'?: string }>, {
        'aria-labelledby': labelId,
        ...(required ? { 'aria-required': true } : {}),
        ...(invalid ? { 'aria-invalid': true, 'aria-describedby': errId } : {}),
      })
    : children
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex min-h-5 items-center justify-between gap-2">
        <Label htmlFor={id} id={labelId} className={cn('ty-label-sm', invalid ? 'text-destructive-text' : 'text-muted-foreground')}>{label}{required && <span className="text-destructive-text" aria-hidden>{t('field.obrigatorioMarca')}</span>}</Label>
        {hint && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" aria-label={t('field.ajuda', { label })} className={cn('-my-1 flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:text-foreground', focusRing)}><HelpCircle className="size-3.5" aria-hidden /></button>
            </TooltipTrigger>
            <TooltipContent className="max-w-56 text-center">{hint}</TooltipContent>
          </Tooltip>
        )}
      </div>
      {control}
      {invalid && (
        <p id={errId} className="flex items-center gap-1 ty-caption font-medium text-destructive-text">
          <AlertTriangle className="size-3.5 shrink-0" aria-hidden /> {t('field.campoObrigatorio')}
        </p>
      )}
    </div>
  )
}
