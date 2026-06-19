/**
 * AppShell — casca compartilhada das telas internas: Sidebar (menu) + topbar (trilha + tema + conta) +
 * área de conteúdo. FONTE ÚNICA do menu — usada pela Dashboard e pelo Gerador (que monta o mesmo Sidebar/
 * MobileNav com seu próprio topbar do Charlie). 100% token-driven; transições suaves no recolher/expandir.
 */
import { useEffect, useState, type ReactNode } from 'react'
import {
  Blocks, Bot, CalendarDays, ChevronLeft, ClipboardList, LayoutDashboard, LogOut, Menu, Moon, Palette, Sun, UserRound, Users, X,
} from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { focusRing, focusRingOnPrimary } from '@/lib/focus'
import { Button } from '@/components/ui/button'
import { LanguageSelect } from '@/components/LanguageSelect'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger, Tip } from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Logo } from '@/components/auth/Logo'
import logoMark from '@/assets/logo/logo-mark-white.svg'
import logoMarkTrevo from '@/assets/logo/trevo-mark-white.svg'

// `< md`: a Sidebar fixa some e o hambúrguer abre um DRAWER (overlay); `≥ md`: o hambúrguer só
// recolhe/expande a largura do menu fixo. Este hook diz em qual mundo estamos.
export function useIsMobile(query = '(max-width: 767px)') {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [query])
  return isMobile
}

// Os rótulos vêm do i18n (namespace 'nav'): grupo via `grupo.<key>`, item via `item.<key>`.
export const NAV_GROUPS = [
  { key: 'workspace', items: [
    { key: 'dashboard', icon: LayoutDashboard },
    { key: 'gerador', icon: ClipboardList },
    { key: 'entrevistas-ia', icon: Bot },
    { key: 'entrevistas', icon: CalendarDays },
    { key: 'candidatos', icon: UserRound },
  ] },
  { key: 'sistema', items: [
    { key: 'usuarios', icon: Users },
    { key: 'componentes', icon: Blocks },
  ] },
] as const

// Views REAIS (navegáveis); o resto é demonstrativo (toast). 'gerador' pode ter override (onVagas) p/ resetar a lista.
const REAL_VIEWS = new Set(['dashboard', 'gerador', 'entrevistas', 'entrevistas-ia', 'candidatos', 'usuarios', 'componentes'])
function navHandle(key: string, label: string, onNavigate?: (v: string) => void, onVagas?: () => void) {
  if (key === 'gerador' && onVagas) { onVagas(); return }
  if (REAL_VIEWS.has(key)) { onNavigate?.(key); return }
  // Inalcançável hoje (todos os itens são views reais); fallback se um item demonstrativo voltar.
  toast.info(`"${label}"`)
}

export function Sidebar({ active, expanded, onNavigate, onVagas, brand }: { active: string; expanded: boolean; onNavigate?: (v: string) => void; onVagas?: () => void; brand?: string }) {
  const { t } = useTranslation('nav')
  // Transição SUAVE recolher↔expandir: a largura anima com easing; o conteúdo faz fade (não é render
  // condicional, o que dava "estalo"). `overflow-hidden` corta o excedente; o ícone fica FIXO.
  return (
    <aside className={cn('relative z-20 hidden h-dvh shrink-0 flex-col overflow-hidden bg-primary text-primary-foreground shadow-panel-l transition-[width] duration-300 ease-in-out md:flex', expanded ? 'w-[300px]' : 'w-16')}>
      <div className="relative flex h-16 shrink-0 items-center px-4">
        <img src={brand === 'marca-b' ? logoMarkTrevo : logoMark} alt="" className={cn('absolute left-4 size-7 transition-opacity duration-300', expanded ? 'opacity-0' : 'opacity-100')} />
        <Logo variant="onBrand" brand={brand} className={cn('h-7 w-auto transition-opacity duration-300', expanded ? 'opacity-100' : 'opacity-0')} />
      </div>

      <nav className="flex-1 space-y-5 overflow-x-hidden overflow-y-auto px-2.5 py-3" aria-label={t('principal')}>
        {NAV_GROUPS.map((group) => (
          <div key={group.key} className="space-y-1">
            <p className={cn('overflow-hidden px-2 ty-caption font-semibold tracking-widest text-primary-foreground uppercase transition-all duration-300', expanded ? 'h-5 pb-1 opacity-100' : 'h-0 pb-0 opacity-0')}>{t(`grupo.${group.key}`)}</p>
            {group.items.map(({ key, icon: Icon }) => {
              const label = t(`item.${key}`)
              const isActive = key === active
              return (
                <Tooltip key={key} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      type="button" aria-current={isActive ? 'page' : undefined} aria-label={label}
                      onClick={() => navHandle(key, label, onNavigate, onVagas)}
                      className={cn('group flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2.5 text-left ty-body-sm transition-all', focusRingOnPrimary,
                        // Item ATIVO = pílula INVERTIDA (fundo claro, texto azul). text-primary sobre
                        // bg-primary-foreground é AA por SIMETRIA do par primary/primary-foreground do DS.
                        // Hover do ativo = ELEVA (shadow) — feedback de clicável sem mexer no par de cor (AA intacto).
                        // eslint-disable-next-line crp/design-tokens
                        isActive ? 'bg-primary-foreground text-primary font-semibold shadow-sm hover:shadow-md' : 'text-primary-foreground hover:bg-primary-foreground/10')}
                    >
                      <Icon className={cn('size-4.5 shrink-0 transition-colors', !isActive && 'text-primary-foreground/80')} aria-hidden />
                      <span className={cn('truncate transition-opacity duration-200', !expanded && 'opacity-0')}>{label}</span>
                    </button>
                  </TooltipTrigger>
                  {!expanded && <TooltipContent side="right" sideOffset={8}>{label}</TooltipContent>}
                </Tooltip>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}

export function MobileNav({ active, open, onOpenChange, onNavigate, onVagas, brand }: { active: string; open: boolean; onOpenChange: (v: boolean) => void; onNavigate?: (v: string) => void; onVagas?: () => void; brand?: string }) {
  const { t } = useTranslation('nav')
  const go = (key: string, label: string) => { onOpenChange(false); navHandle(key, label, onNavigate, onVagas) }
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content className="fixed inset-0 z-50 flex w-full flex-col bg-primary text-primary-foreground outline-none motion-safe:duration-200 motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:fade-in-0 motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:fade-out-0 md:hidden">
          <div className="flex h-16 shrink-0 items-center justify-between px-5">
            <Logo variant="onBrand" brand={brand} className="h-7 w-auto" />
            <DialogPrimitive.Close aria-label={t('menu.fechar')} className={cn('flex size-9 items-center justify-center rounded-lg text-primary-foreground transition-colors hover:bg-primary-foreground/10', focusRingOnPrimary)}>
              <X className="size-5" aria-hidden />
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Title className="sr-only">{t('principal')}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">{t('menu.descricao')}</DialogPrimitive.Description>
          <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-4" aria-label={t('principal')}>
            {NAV_GROUPS.map((group) => (
              <div key={group.key} className="space-y-1.5">
                <p className="px-3 pb-1 ty-caption font-semibold tracking-widest text-primary-foreground uppercase">{t(`grupo.${group.key}`)}</p>
                {group.items.map(({ key, icon: Icon }) => {
                  const label = t(`item.${key}`)
                  const isActive = key === active
                  return (
                    <button
                      key={key} type="button" aria-current={isActive ? 'page' : undefined} onClick={() => go(key, label)}
                      className={cn('group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left ty-body transition-all', focusRingOnPrimary,
                        // eslint-disable-next-line crp/design-tokens -- pílula invertida (par primary/primary-foreground é AA por simetria). Hover do ativo = eleva (shadow).
                        isActive ? 'bg-primary-foreground text-primary font-semibold shadow-sm hover:shadow-md' : 'text-primary-foreground hover:bg-primary-foreground/10')}
                    >
                      <Icon className={cn('size-5 shrink-0', !isActive && 'text-primary-foreground/80')} aria-hidden />
                      <span className="truncate">{label}</span>
                    </button>
                  )
                })}
              </div>
            ))}
          </nav>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

// Topbar "simples" do shell (sem o Charlie do Gerador): toggle do menu + trilha + tema/marca + conta.
function ShellTopBar({ onToggleMenu, menuExpanded, isMobile, onLogout, brand, mode, onCycleBrand, onToggleMode, crumb, headerAction }: {
  onToggleMenu: () => void; menuExpanded: boolean; isMobile?: boolean; onLogout: () => void
  brand?: string; mode?: string; onCycleBrand?: () => void; onToggleMode?: () => void; crumb: string; headerAction?: ReactNode
}) {
  const { t } = useTranslation('nav')
  const { t: tc } = useTranslation('common')
  const menuLabel = isMobile ? (menuExpanded ? t('menu.fechar') : t('menu.abrir')) : menuExpanded ? t('menu.recolher') : t('menu.expandir')
  const [confirmSair, setConfirmSair] = useState(false)
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border/40 bg-card/70 px-4 backdrop-blur-sm lg:px-6">
      <Tip label={menuLabel}>
        <Button variant="ghost" size="icon" aria-label={menuLabel} aria-expanded={menuExpanded} onClick={onToggleMenu} className="text-muted-foreground hover:text-foreground">
          {isMobile ? <Menu /> : <ChevronLeft className={cn('transition-transform', !menuExpanded && 'rotate-180')} />}
        </Button>
      </Tip>
      <nav aria-label={t('trilha')} className="hidden items-center gap-1.5 ty-caption font-medium tracking-wide text-muted-foreground uppercase sm:flex">
        <span>{t('trilha')}</span><span aria-hidden>/</span><span className="text-foreground" aria-current="page">{crumb}</span>
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        <LanguageSelect size="icon" />
        {onCycleBrand && <Tip label={tc('marca', { marca: brand })}><Button variant="ghost" size="icon" aria-label={tc('marca', { marca: brand })} onClick={onCycleBrand}><Palette /></Button></Tip>}
        {onToggleMode && <Tip label={mode === 'dark' ? tc('tema.claro') : tc('tema.escuro')}><Button variant="ghost" size="icon" aria-label={mode === 'dark' ? tc('tema.claro') : tc('tema.escuro')} onClick={onToggleMode}>{mode === 'dark' ? <Sun /> : <Moon />}</Button></Tip>}
        <Separator orientation="vertical" className="mx-1 h-5" />
        {headerAction}
        <DropdownMenu>
          <Tip label={t('conta.label')}>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label={t('conta.label')} className={cn('relative ml-1 rounded-full', focusRing)}>
                <Avatar className="size-10"><AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">FL</AvatarFallback></Avatar>
                <span className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-card bg-success" aria-hidden />
              </button>
            </DropdownMenuTrigger>
          </Tip>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center gap-3 p-2">
              <Avatar className="size-9"><AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">FL</AvatarFallback></Avatar>
              <div className="min-w-0">
                <p className="truncate ty-body-sm font-medium text-foreground">Frank Lima</p>
                <p className="truncate ty-caption text-muted-foreground">recrutador@talentai.com</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => toast.info(t('conta.contaDemo'))}><UserRound /> {t('conta.minha')}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setConfirmSair(true)} className="text-destructive-text focus:bg-destructive/10 focus:text-destructive-text"><LogOut /> {t('conta.sair')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ConfirmDialog
        open={confirmSair} onOpenChange={setConfirmSair} icon={LogOut} tone="primary" confirmVariant="default"
        title={t('sairConfirm.titulo')} description={t('sairConfirm.descricao')}
        cancelLabel={t('sairConfirm.voltar')} confirmLabel={t('sairConfirm.sair')} onConfirm={onLogout}
      />
    </header>
  )
}

export function AppShell({ active, crumb, onNavigate, brand, mode, onCycleBrand, onToggleMode, headerAction, children }: {
  active: string; crumb: string; onNavigate: (v: string) => void
  brand?: string; mode?: string; onCycleBrand?: () => void; onToggleMode?: () => void; headerAction?: ReactNode; children: ReactNode
}) {
  const [expanded, setExpanded] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isMobile = useIsMobile()
  const navOpen = isMobile && mobileOpen
  const toggleMenu = () => (isMobile ? setMobileOpen((o) => !o) : setExpanded((e) => !e))
  return (
    <div className="ty-scale-16 flex h-dvh overflow-hidden bg-muted/40 text-foreground">
      <Sidebar active={active} expanded={expanded} onNavigate={onNavigate} brand={brand} />
      <MobileNav active={active} open={navOpen} onOpenChange={setMobileOpen} onNavigate={onNavigate} brand={brand} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <ShellTopBar onToggleMenu={toggleMenu} menuExpanded={isMobile ? mobileOpen : expanded} isMobile={isMobile} onLogout={() => onNavigate('login')} brand={brand} mode={mode} onCycleBrand={onCycleBrand} onToggleMode={onToggleMode} crumb={crumb} headerAction={headerAction} />
        <main className="relative min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
