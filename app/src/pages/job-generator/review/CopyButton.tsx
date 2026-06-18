import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Check, Copy } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// Botão de copiar reutilizável (estado "copiado" + toast) — usado no topo do post e no bloco recolhível.
export function CopyButton({ text, label, className }: { text: string; label?: string; className?: string }) {
  const { t } = useTranslation('gerador')
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); toast.success(t('copy.postCopiado')); window.setTimeout(() => setCopied(false), 2000) }
    catch { toast.error(t('copy.erroCopiar')) }
  }
  return (
    <Button size="sm" variant="outline" onClick={copy} className={cn('shrink-0', className)}>
      {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />} {copied ? t('copy.copiado') : (label ?? t('copy.copiarTexto'))}
    </Button>
  )
}
