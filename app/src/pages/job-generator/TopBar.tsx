import { useTranslation } from 'react-i18next'
import { Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils'
import { focusRing } from '@/lib/focus'
import { TopBarMenuButton, TopBarActions, TopBarAccount } from '@/components/shell/topbar-parts'

export function TopBar({ onToggleMenu, menuExpanded, isMobile, onCharlie, charlieOpen, onLogout, onEditarPerfil, brand, mode, onCycleBrand, onToggleMode, screen = 'lista', crumbLabel, onBackToList }: {
  onToggleMenu: () => void; menuExpanded: boolean; isMobile?: boolean; onCharlie: () => void; charlieOpen: boolean; onLogout: () => void; onEditarPerfil?: () => void
  brand?: string; mode?: string; onCycleBrand?: () => void; onToggleMode?: () => void
  screen?: 'lista' | 'detalhe' | 'wizard'; crumbLabel?: string; onBackToList?: () => void
}) {
  const { t } = useTranslation('gerador')
  // No índice (lista) "Vagas" é a página atual; em detalhe/wizard vira link de volta + o rótulo da página.
  const naLista = screen === 'lista'
  // `menuExpanded` = no mobile reflete o drawer aberto; no desktop, o menu fixo expandido.
  const menuLabel = isMobile ? (menuExpanded ? t('topbar.menu.fechar') : t('topbar.menu.abrir')) : menuExpanded ? t('topbar.menu.recolher') : t('topbar.menu.expandir')
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border/40 bg-card/70 px-4 backdrop-blur-sm lg:px-6">
      <TopBarMenuButton label={menuLabel} menuExpanded={menuExpanded} isMobile={isMobile} onToggle={onToggleMenu} />
      <nav aria-label={t('topbar.trilha')} className="hidden items-center gap-1.5 ty-caption font-medium tracking-wide text-muted-foreground uppercase sm:flex">
        <span>{t('topbar.workspace')}</span><span aria-hidden>/</span>
        {naLista ? (
          <span className="text-foreground" aria-current="page">{t('topbar.vagas')}</span>
        ) : (
          <>
            <button type="button" onClick={onBackToList} className={cn('rounded-sm uppercase transition-colors hover:text-foreground', focusRing)}>{t('topbar.vagas')}</button>
            <span aria-hidden>/</span><span className="max-w-[16rem] truncate text-foreground" aria-current="page">{crumbLabel}</span>
          </>
        )}
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        <TopBarActions brand={brand} mode={mode} onCycleBrand={onCycleBrand} onToggleMode={onToggleMode} />
        {screen === 'wizard' && (
          <button type="button" data-charlie-trigger onClick={onCharlie} aria-pressed={charlieOpen} aria-label={t('topbar.falarCharlie')}
            className={cn('inline-flex min-h-10 items-center gap-2 rounded-lg bg-secondary px-3 py-2 ty-label font-medium text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/90', focusRing)}>
            <Sparkles className="size-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">{t('topbar.falarCharlie')}</span>
          </button>
        )}
        <TopBarAccount onLogout={onLogout} onEditarPerfil={onEditarPerfil} />
      </div>
    </header>
  )
}
