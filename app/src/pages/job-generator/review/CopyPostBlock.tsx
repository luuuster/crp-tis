import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Copy } from 'lucide-react'

import { cn } from '@/lib/utils'
import { focusRing } from '@/lib/focus'
import { CARD } from '@/lib/surfaces'
import { CharBadge } from './CharBadge'
import { CopyButton } from './CopyButton'

// "Copiar texto do post" — bloco recolhível (altura animada via grid-rows) com o texto mono + copiar.
export function CopyPostBlock({ text }: { text: string }) {
  const { t } = useTranslation('gerador')
  const [open, setOpen] = useState(false)
  const bodyId = useId()
  return (
    <div className={cn(CARD, 'overflow-hidden')}>
      <button
        type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={bodyId}
        className={cn('flex w-full items-center gap-2 px-4 py-3 text-left ty-label-sm font-medium text-foreground transition-colors hover:bg-accent/40', focusRing)}
      >
        <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform duration-200', open && 'rotate-180')} aria-hidden />
        <Copy className="size-4 shrink-0 text-muted-foreground" aria-hidden /> {t('copy.copiarPost')}
      </button>
      <div id={bodyId} className={cn('grid motion-safe:transition-all motion-safe:duration-300', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <div className="overflow-hidden">
          <div className="space-y-3 border-t border-border/50 px-4 py-4">
            <p className="ty-caption text-muted-foreground">{t('copy.publicarManual')}</p>
            <pre className="max-h-96 overflow-auto rounded-lg bg-muted/60 p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap text-foreground">{text}</pre>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CharBadge len={text.length} />
              <CopyButton text={text} label={t('copy.copiar')} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
