import { Check, Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tip } from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { LOCALES, LOCALE_LABEL, setLocale, type Locale } from '@/i18n'

/**
 * Seletor de idioma (pt-BR / English / Español) — espelha os toggles de marca/tema do shell. Usa o contexto
 * GLOBAL do react-i18next (sem prop-drilling): lê `i18n.language` e troca via `setLocale`. Os rótulos do menu
 * são ENDÔNIMOS (não mudam com o idioma da UI), o que mantém os seletores de teste estáveis.
 */
export function LanguageSelect({ size = 'icon-sm' }: { size?: 'icon-sm' | 'icon' }) {
  const { i18n, t } = useTranslation('common')
  const current = (LOCALES as readonly string[]).includes(i18n.language) ? (i18n.language as Locale) : 'pt-BR'
  return (
    <DropdownMenu>
      <Tip label={t('idioma')}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size={size} aria-label={`${t('idioma')}: ${LOCALE_LABEL[current]}`}>
            <Languages />
          </Button>
        </DropdownMenuTrigger>
      </Tip>
      <DropdownMenuContent align="end" className="min-w-40">
        {LOCALES.map((l) => (
          <DropdownMenuItem key={l} onSelect={() => setLocale(l)} aria-current={l === current ? 'true' : undefined}>
            <Check className={cn('size-4', l === current ? 'opacity-100' : 'opacity-0')} aria-hidden />
            {LOCALE_LABEL[l]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
