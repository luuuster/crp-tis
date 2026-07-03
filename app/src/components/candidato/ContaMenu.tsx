/**
 * "Bolinha" do candidato (avatar + ponto verde de online) com menu de conta — mesmo CHROME do recrutador
 * (via AccountMenu, fonte única). Reflete quem entrou (e-mail guardado no /acesso). Compartilhado entre o
 * mural (/painel) e as telas do fluxo público logado (descrição da vaga, 2ª etapa). Editar perfil/currículo
 * são STUBS de mockup.
 *
 * onSair é opcional: sem ele, sai sozinho (limpa a sessão e volta pro /acesso) — útil nas abas abertas
 * direto na vaga, que não recebem o handler do app.
 */
import { useTranslation } from 'react-i18next'
import { FileText, UserRound } from 'lucide-react'
import { toast } from 'sonner'

import { lerCandidato, sairCandidato } from '@/lib/candidatoSessao'
import { AccountMenu } from '@/components/AccountMenu'

export function ContaMenu({ onSair }: { onSair?: () => void }) {
  const { t } = useTranslation('painel')
  const candidato = lerCandidato()
  const sair = onSair ?? (() => { sairCandidato(); window.location.href = '/acesso' })
  return (
    <AccountMenu
      iniciais={candidato.iniciais} nome={candidato.nome} email={candidato.email}
      triggerLabel={t('conta.label')}
      items={[
        { icon: UserRound, label: t('conta.editarPerfil'), onSelect: () => toast.info(t('conta.perfilEmBreve')) },
        { icon: FileText, label: t('conta.editarCurriculo'), onSelect: () => toast.info(t('conta.curriculoEmBreve')) },
      ]}
      sairLabel={t('conta.sair')} sair={sair}
      sairConfirm={{ titulo: t('conta.sairConfirm.titulo'), descricao: t('conta.sairConfirm.descricao'), voltar: t('conta.sairConfirm.voltar'), sair: t('conta.sairConfirm.sair') }}
    />
  )
}
