import { Moon, Palette, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tip } from '@/components/ui/tooltip'
import { LanguageSelect } from '@/components/LanguageSelect'
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
  const brandLabel = `Trocar para ${brand === 'crp' ? 'Trevo' : 'TIS'}`
  const modeLabel = mode === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'
  return (
    <>
      <LanguageSelect />
      <Tip label={brandLabel}>
        <Button variant="ghost" size="icon-sm" aria-label={brandLabel} onClick={onCycleBrand}>
          <Palette />
        </Button>
      </Tip>
      <Tip label={modeLabel}>
        <Button variant="ghost" size="icon-sm" aria-label={modeLabel} onClick={onToggleMode}>
          {mode === 'dark' ? <Sun /> : <Moon />}
        </Button>
      </Tip>
    </>
  )
}
