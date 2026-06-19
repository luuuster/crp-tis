import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

/** Botão de exportar (CSV) do DS — rótulo via i18n. Usado nas listas (Candidatos/Usuários/Vagas) e no Dashboard. */
export function ExportButton({ onExport, label, disabled }: { onExport: () => void; label?: string; disabled?: boolean }) {
  const { t } = useTranslation('common')
  const text = label ?? t('exportar')
  return (
    <Button variant="outline" onClick={onExport} disabled={disabled} aria-label={text}>
      <Download aria-hidden /> {text}
    </Button>
  )
}
