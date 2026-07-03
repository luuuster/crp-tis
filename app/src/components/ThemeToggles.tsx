import { Moon, Palette, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Tip } from '@/components/ui/tooltip'
import { LanguageSelect } from '@/components/LanguageSelect'
import { brandNome } from '@/lib/useBrandMode'
import type { Brand, Mode } from '@/lib/useBrandMode'

// Dock flutuante (idioma + marca + tema) — sempre no canto superior direito. Compartilhado pelos dois
// apps da plataforma (recrutador e candidato).
export const DOCK =
  'fixed top-4 right-4 z-50 flex items-center gap-1.5 rounded-full border border-border/50 bg-card/70 p-1 shadow-xs backdrop-blur-md'

export function ThemeToggles({ brand, mode, onCycleBrand, onToggleMode }: {
  brand: Brand
  mode: Mode
  onCycleBrand: () => void
  onToggleMode: () => void
}) {
  // Rótulos i18n (namespace 'common') — MESMA fonte da topbar do recrutador, pra os tooltips baterem nos
  // três idiomas e a marca aparecer pelo nome amigável (não pelo código interno).
  const { t } = useTranslation('common')
  const brandLabel = t('marca', { marca: brandNome(brand) })
  const modeLabel = t(mode === 'dark' ? 'tema.claro' : 'tema.escuro')
  return (
    <>
      <LanguageSelect size="icon" />
      <Tip label={brandLabel}>
        <Button variant="ghost" size="icon" aria-label={brandLabel} onClick={onCycleBrand}>
          <Palette />
        </Button>
      </Tip>
      <Tip label={modeLabel}>
        <Button variant="ghost" size="icon" aria-label={modeLabel} onClick={onToggleMode}>
          {mode === 'dark' ? <Sun /> : <Moon />}
        </Button>
      </Tip>
    </>
  )
}
