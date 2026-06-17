import { useState } from 'react'
import { toast } from 'sonner'
import { Check, Copy } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// Botão de copiar reutilizável (estado "copiado" + toast) — usado no topo do post e no bloco recolhível.
export function CopyButton({ text, label = 'Copiar texto', className }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); toast.success('Texto do post copiado!'); window.setTimeout(() => setCopied(false), 2000) }
    catch { toast.error('Não foi possível copiar — selecione e copie manualmente.') }
  }
  return (
    <Button size="sm" variant="outline" onClick={copy} className={cn('shrink-0', className)}>
      {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />} {copied ? 'Copiado' : label}
    </Button>
  )
}
