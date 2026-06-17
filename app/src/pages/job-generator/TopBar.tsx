import { useState } from 'react'
import { toast } from 'sonner'
import { ChevronLeft, LogOut, Menu, Moon, Palette, Sparkles, Sun, UserRound } from 'lucide-react'

import { cn } from '@/lib/utils'
import { focusRing } from '@/lib/focus'
import { FLOAT } from '@/lib/surfaces'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export function TopBar({ onToggleMenu, menuExpanded, isMobile, onCharlie, charlieOpen, onLogout, brand, mode, onCycleBrand, onToggleMode, screen = 'lista', crumbLabel, onBackToList }: {
  onToggleMenu: () => void; menuExpanded: boolean; isMobile?: boolean; onCharlie: () => void; charlieOpen: boolean; onLogout: () => void
  brand?: string; mode?: string; onCycleBrand?: () => void; onToggleMode?: () => void
  screen?: 'lista' | 'detalhe' | 'wizard'; crumbLabel?: string; onBackToList?: () => void
}) {
  // No índice (lista) "Vagas" é a página atual; em detalhe/wizard vira link de volta + o rótulo da página.
  const naLista = screen === 'lista'
  // `menuExpanded` = no mobile reflete o drawer aberto; no desktop, o menu fixo expandido.
  const menuLabel = isMobile ? (menuExpanded ? 'Fechar menu' : 'Abrir menu') : menuExpanded ? 'Recolher menu' : 'Expandir menu'
  const [confirmSair, setConfirmSair] = useState(false)
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border/40 bg-card/70 px-4 backdrop-blur-sm lg:px-6">
      <Button variant="ghost" size="icon" aria-label={menuLabel} aria-expanded={menuExpanded} onClick={onToggleMenu} className="text-muted-foreground hover:text-foreground">
        {isMobile ? <Menu /> : <ChevronLeft className={cn('transition-transform', !menuExpanded && 'rotate-180')} />}
      </Button>
      <nav aria-label="Trilha" className="hidden items-center gap-1.5 ty-caption font-medium tracking-wide text-muted-foreground uppercase sm:flex">
        <span>Workspace</span><span aria-hidden>/</span>
        {naLista ? (
          <span className="text-foreground" aria-current="page">Vagas</span>
        ) : (
          <>
            <button type="button" onClick={onBackToList} className={cn('rounded-sm uppercase transition-colors hover:text-foreground', focusRing)}>Vagas</button>
            <span aria-hidden>/</span><span className="max-w-[16rem] truncate text-foreground" aria-current="page">{crumbLabel}</span>
          </>
        )}
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        {onCycleBrand && <Button variant="ghost" size="icon" aria-label={`Trocar marca (atual: ${brand})`} onClick={onCycleBrand}><Palette /></Button>}
        {onToggleMode && <Button variant="ghost" size="icon" aria-label={mode === 'dark' ? 'Tema claro' : 'Tema escuro'} onClick={onToggleMode}>{mode === 'dark' ? <Sun /> : <Moon />}</Button>}
        <Separator orientation="vertical" className="mx-1 h-5" />
        {screen === 'wizard' && (
          <button type="button" onClick={onCharlie} aria-pressed={charlieOpen} aria-label="Falar com Charlie"
            className={cn('inline-flex min-h-10 items-center gap-2 rounded-lg bg-secondary px-3 py-2 ty-label font-medium text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/90', focusRing)}>
            <Sparkles className="size-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">Falar com Charlie</span>
          </button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label="Sua conta" className={cn('relative ml-1 rounded-full', focusRing)}>
              <Avatar className="size-10"><AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">FL</AvatarFallback></Avatar>
              <span className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-card bg-success" aria-hidden />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={cn('w-60', FLOAT)}>
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <Avatar className="size-9"><AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">FL</AvatarFallback></Avatar>
              <div className="min-w-0 leading-tight">
                <p className="truncate ty-body-sm font-medium">Franklin L.</p>
                <p className="truncate ty-caption text-muted-foreground">recrutador@talentai.com</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => toast.info('Conta (demo).')}><UserRound /> Minha conta</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setConfirmSair(true)} className="text-destructive-text focus:bg-destructive/10 focus:text-destructive-text"><LogOut /> Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ConfirmDialog
        open={confirmSair} onOpenChange={setConfirmSair} icon={LogOut} tone="primary" confirmVariant="default"
        title="Sair da conta?" description="Você será desconectado. Alterações não salvas serão perdidas."
        cancelLabel="Voltar" confirmLabel="Sair" onConfirm={onLogout}
      />
    </header>
  )
}
