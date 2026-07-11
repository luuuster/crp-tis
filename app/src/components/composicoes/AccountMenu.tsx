/**
 * Menu de conta da plataforma — a "bolinha" (avatar + ponto verde de online) com o dropdown (cabeçalho
 * nome/e-mail + itens + Sair com confirmação). Fonte ÚNICA, compartilhada pelo recrutador (TopBarAccount)
 * e pelo candidato (ContaMenu), pra os dois nunca divergirem no tamanho do avatar, no ponto de status, na
 * largura do menu ou no fluxo de saída. Cada app só passa os DADOS (iniciais/nome/e-mail), os itens do
 * meio e os rótulos (do seu namespace de i18n) — o chrome é o mesmo.
 */
import { useState } from 'react'
import { LogOut } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { focusRing } from '@/lib/focus'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tip } from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/composicoes/confirm-dialog'

// Item do menu (antes do "Sair"). `variant` só pra casos destrutivos — o "Sair" já é fixo no rodapé.
export type AccountMenuItem = { icon: LucideIcon; label: string; onSelect: () => void; variant?: 'destructive' }

export function AccountMenu({ iniciais, nome, email, triggerLabel, items, sairLabel, sair, sairConfirm }: {
  iniciais: string
  nome: string
  email: string
  triggerLabel: string
  items: AccountMenuItem[]
  sairLabel: string
  sair: () => void
  sairConfirm: { titulo: string; descricao: string; voltar: string; sair: string }
}) {
  const [confirmSair, setConfirmSair] = useState(false)
  const avatar = (size: string) => (
    <Avatar className={size}><AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">{iniciais}</AvatarFallback></Avatar>
  )
  return (
    <>
      <DropdownMenu>
        <Tip label={triggerLabel}>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label={triggerLabel} className={cn('relative ml-1 rounded-full', focusRing)}>
              {avatar('size-10')}
              <span className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-card bg-success" aria-hidden />
            </button>
          </DropdownMenuTrigger>
        </Tip>
        <DropdownMenuContent align="end" className="w-60">
          <div className="flex items-center gap-3 p-2">
            {avatar('size-9')}
            <div className="min-w-0">
              <p className="truncate ty-body-sm font-medium text-foreground">{nome}</p>
              <p className="truncate ty-caption text-muted-foreground">{email}</p>
            </div>
          </div>
          <DropdownMenuSeparator />
          {items.map((it) => (
            <DropdownMenuItem key={it.label} variant={it.variant} onSelect={it.onSelect}><it.icon /> {it.label}</DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirmSair(true)}><LogOut /> {sairLabel}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={confirmSair} onOpenChange={setConfirmSair} icon={LogOut} tone="primary" confirmVariant="default"
        title={sairConfirm.titulo} description={sairConfirm.descricao}
        cancelLabel={sairConfirm.voltar} confirmLabel={sairConfirm.sair} onConfirm={sair}
      />
    </>
  )
}
