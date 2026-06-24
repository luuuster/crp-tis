/**
 * "Bolinha" do candidato (avatar + ponto verde de online) com menu de conta — mesmo padrão do recrutador
 * (AppShell). Reflete quem entrou (e-mail guardado no /acesso). Compartilhado entre o mural (/painel) e as
 * telas do fluxo público logado (descrição da vaga, 2ª etapa). Editar perfil/currículo são STUBS de mockup.
 *
 * onSair é opcional: sem ele, sai sozinho (limpa a sessão e volta pro /acesso) — útil nas abas abertas
 * direto na vaga, que não recebem o handler do app.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, LogOut, UserRound } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { focusRing } from '@/lib/focus'
import { lerCandidato, sairCandidato } from '@/lib/candidatoSessao'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tip } from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/confirm-dialog'

export function ContaMenu({ onSair }: { onSair?: () => void }) {
  const { t } = useTranslation('painel')
  const [confirmSair, setConfirmSair] = useState(false)
  const candidato = lerCandidato()
  const sair = onSair ?? (() => { sairCandidato(); window.location.href = '/acesso' })
  const avatar = (size: string) => (
    <Avatar className={size}><AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">{candidato.iniciais}</AvatarFallback></Avatar>
  )
  return (
    <>
      <DropdownMenu>
        <Tip label={t('conta.label')}>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label={t('conta.label')} className={cn('relative ml-1 rounded-full', focusRing)}>
              {avatar('size-10')}
              <span className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-card bg-success" aria-hidden />
            </button>
          </DropdownMenuTrigger>
        </Tip>
        <DropdownMenuContent align="end" className="w-60">
          <div className="flex items-center gap-3 p-2">
            {avatar('size-9')}
            <div className="min-w-0">
              <p className="truncate ty-body-sm font-medium text-foreground">{candidato.nome}</p>
              <p className="truncate ty-caption text-muted-foreground">{candidato.email}</p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => toast.info(t('conta.perfilEmBreve'))}><UserRound /> {t('conta.editarPerfil')}</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => toast.info(t('conta.curriculoEmBreve'))}><FileText /> {t('conta.editarCurriculo')}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirmSair(true)}><LogOut /> {t('conta.sair')}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={confirmSair} onOpenChange={setConfirmSair} icon={LogOut} tone="primary" confirmVariant="default"
        title={t('conta.sairConfirm.titulo')} description={t('conta.sairConfirm.descricao')}
        cancelLabel={t('conta.sairConfirm.voltar')} confirmLabel={t('conta.sairConfirm.sair')} onConfirm={sair}
      />
    </>
  )
}
