/**
 * Caixa visual do captcha MOCK (código + botão de gerar outro). Presentational: o <input> de resposta
 * fica em cada formulário. role="img" + aria-label expõem o código ao leitor de tela. Reusada na
 * inscrição pública e na 2ª etapa do processo, pra a a11y/visual não divergirem.
 */
import { useTranslation } from 'react-i18next'
import { RefreshCw } from 'lucide-react'

import { cn } from '@/lib/utils'
import { CAPTCHA_TILT } from '@/lib/captcha'
import { Button } from '@/components/ui/button'

export function CaptchaBox({ codigo, onNovo }: { codigo: string; onNovo: () => void }) {
  const { t } = useTranslation('inscricao')
  return (
    <div className="flex items-center gap-3">
      <div
        role="img"
        aria-label={t('captcha.codigoAria', { codigo: codigo.split('').join(' ') })}
        className="flex select-none items-center gap-1.5 rounded-md border border-border bg-muted/50 px-5 py-2.5 [background-image:repeating-linear-gradient(45deg,transparent,transparent_7px,var(--color-border)_7px,var(--color-border)_8px)]"
      >
        {codigo.split('').map((ch, i) => (
          <span key={i} className={cn('font-mono text-2xl font-bold tracking-tight text-foreground', CAPTCHA_TILT[i % CAPTCHA_TILT.length])}>{ch}</span>
        ))}
      </div>
      <Button type="button" variant="ghost" size="icon" aria-label={t('captcha.atualizar')} onClick={onNovo}>
        <RefreshCw />
      </Button>
    </div>
  )
}
