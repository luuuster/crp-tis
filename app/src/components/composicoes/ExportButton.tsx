import { useState } from 'react'
import { Download, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

/**
 * Botão "Exportar" do DS — usado nas listas (Candidatos/Usuários/Vagas), Entrevistas IA e no Dashboard.
 * MOCKUP: a exportação ainda está EM AVALIAÇÃO — no HOVER/foco mostra um aviso (tooltip vermelho) e no
 * CLIQUE abre uma modal explicando que precisa ser discutida com o time. `onExport` (a lógica de CSV real)
 * fica RESERVADO p/ quando a funcionalidade for aprovada — hoje não é chamado.
 */
export function ExportButton({ label, disabled }: { onExport?: () => void; label?: string; disabled?: boolean }) {
  const { t } = useTranslation('common')
  const [aviso, setAviso] = useState(false)
  const text = label ?? t('exportar')
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" onClick={() => setAviso(true)} disabled={disabled} aria-label={text}>
            <Download aria-hidden /> {text}
          </Button>
        </TooltipTrigger>
        <TooltipContent tone="destructive" className="max-w-xs text-center">{t('exportarAviso')}</TooltipContent>
      </Tooltip>

      <AlertDialog open={aviso} onOpenChange={setAviso}>
        <AlertDialogContent className="max-w-md">
          <div className="flex items-start gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive-text">
              <TriangleAlert className="size-5" aria-hidden />
            </span>
            <div className="space-y-1.5">
              <AlertDialogTitle>{t('exportarAvisoTitulo')}</AlertDialogTitle>
              <AlertDialogDescription>{t('exportarAviso')}</AlertDialogDescription>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAviso(false)}>{t('acao.entendi')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
