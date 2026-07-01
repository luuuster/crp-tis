/**
 * Peças COMPARTILHADAS das topbars internas (Shell e Gerador) — fonte única p/ o botão de menu, o
 * cluster de ações (idioma + marca + tema) e o menu de conta. Evita que as duas topbars divirjam
 * (era o caso: o Gerador estava sem o seletor de idioma e com o botão de recolher no estilo antigo).
 * Cada topbar mantém só o que é seu (trilha; e, no Gerador, o botão "Falar com Charlie").
 */
import { useState } from 'react'
import { ChevronLeft, LogOut, Menu, Moon, Palette, Sun, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { focusRing } from '@/lib/focus'
import { Button } from '@/components/ui/button'
import { LanguageSelect } from '@/components/LanguageSelect'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tip } from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/confirm-dialog'

// Usuário-demo único da casca (mockup) — fonte única p/ as duas topbars e a tela de Editar perfil.
// Alinhado ao "você" (Frank Lima) da lista de Usuários. Administrador → pode editar e-mail/cargo.
export const DEMO_USER = { nome: 'Frank Lima', email: 'frank.lima@talentai.com', iniciais: 'FL', telefone: '(11) 98765-4321', cpf: '123.456.789-00', tipoPessoa: 'Pessoa Física', nascimento: '12/03/1990', funcao: 'Administrador' } as const

// Botão recolher/expandir (Menu no mobile, ChevronLeft no desktop). Estilo ÚNICO p/ as duas topbars;
// o rótulo vem pronto do chamador (cada topbar usa seu próprio namespace de tradução).
export function TopBarMenuButton({ label, menuExpanded, isMobile, onToggle }: {
  label: string; menuExpanded: boolean; isMobile?: boolean; onToggle: () => void
}) {
  return (
    <Tip label={label}>
      <Button variant="ghost" size="icon" aria-label={label} aria-expanded={menuExpanded} onClick={onToggle} className="bg-muted text-foreground ring-1 ring-surface-ring hover:bg-muted/70">
        {isMobile ? <Menu /> : <ChevronLeft className={cn('transition-transform', !menuExpanded && 'rotate-180')} />}
      </Button>
    </Tip>
  )
}

// Cluster de ações à direita: idioma + marca + tema + separador. Idêntico nas duas topbars.
export function TopBarActions({ brand, mode, onCycleBrand, onToggleMode }: {
  brand?: string; mode?: string; onCycleBrand?: () => void; onToggleMode?: () => void
}) {
  const { t: tc } = useTranslation('common')
  return (
    <>
      <LanguageSelect size="icon" />
      {onCycleBrand && <Tip label={tc('marca', { marca: brand })}><Button variant="ghost" size="icon" aria-label={tc('marca', { marca: brand })} onClick={onCycleBrand}><Palette /></Button></Tip>}
      {onToggleMode && <Tip label={mode === 'dark' ? tc('tema.claro') : tc('tema.escuro')}><Button variant="ghost" size="icon" aria-label={mode === 'dark' ? tc('tema.claro') : tc('tema.escuro')} onClick={onToggleMode}>{mode === 'dark' ? <Sun /> : <Moon />}</Button></Tip>}
      <Separator orientation="vertical" className="mx-1 h-5" />
    </>
  )
}

// Avatar + menu de conta (com confirmação de saída). Rótulos no namespace 'nav' (canônico da casca).
// onEditarPerfil (opcional) abre a tela de perfil; sem ele, cai num toast de demo.
export function TopBarAccount({ onLogout, onEditarPerfil }: { onLogout: () => void; onEditarPerfil?: () => void }) {
  const { t } = useTranslation('nav')
  const [confirmSair, setConfirmSair] = useState(false)
  return (
    <>
      <DropdownMenu>
        <Tip label={t('conta.label')}>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label={t('conta.label')} className={cn('relative ml-1 rounded-full', focusRing)}>
              <Avatar className="size-10"><AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">{DEMO_USER.iniciais}</AvatarFallback></Avatar>
              <span className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-card bg-success" aria-hidden />
            </button>
          </DropdownMenuTrigger>
        </Tip>
        <DropdownMenuContent align="end" className="w-56">
          <div className="flex items-center gap-3 p-2">
            <Avatar className="size-9"><AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">{DEMO_USER.iniciais}</AvatarFallback></Avatar>
            <div className="min-w-0">
              <p className="truncate ty-body-sm font-medium text-foreground">{DEMO_USER.nome}</p>
              <p className="truncate ty-caption text-muted-foreground">{DEMO_USER.email}</p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => (onEditarPerfil ? onEditarPerfil() : toast.info(t('conta.contaDemo')))}><UserRound /> {t('conta.minha')}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirmSair(true)}><LogOut /> {t('conta.sair')}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={confirmSair} onOpenChange={setConfirmSair} icon={LogOut} tone="primary" confirmVariant="default"
        title={t('sairConfirm.titulo')} description={t('sairConfirm.descricao')}
        cancelLabel={t('sairConfirm.voltar')} confirmLabel={t('sairConfirm.sair')} onConfirm={onLogout}
      />
    </>
  )
}
