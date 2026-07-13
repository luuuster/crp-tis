/**
 * Peças COMPARTILHADAS das topbars internas (Shell e Gerador) — fonte única p/ o botão de menu, o
 * cluster de ações (idioma + marca + tema) e o menu de conta. Evita que as duas topbars divirjam
 * (era o caso: o Gerador estava sem o seletor de idioma e com o botão de recolher no estilo antigo).
 * Cada topbar mantém só o que é seu (trilha; e, no Gerador, o botão "Falar com Charlie").
 */
import { ChevronLeft, Menu, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import type { Brand, Mode } from '@/lib/useBrandMode'
import { Button } from '@/components/ui/button'
import { LanguageSelect } from '@/components/composicoes/LanguageSelect'
import { ThemeToggles } from '@/components/composicoes/ThemeToggles'
import { AccountMenu } from '@/components/composicoes/AccountMenu'
import { Tip } from '@/components/ui/tooltip'

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

// Cluster de ações à direita: idioma + marca + tema. É EXATAMENTE o mesmo componente do candidato/docks
// (ThemeToggles) — fonte única, pra as topbars nunca divergirem em tamanho, ordem ou rótulo. Sem os
// controles de marca/tema (telas que só têm idioma), cai no seletor de idioma sozinho.
export function TopBarActions({ brand, mode, onCycleBrand, onToggleMode }: {
  brand?: string; mode?: string; onCycleBrand?: () => void; onToggleMode?: () => void
}) {
  if (!mode || !onCycleBrand || !onToggleMode) return <LanguageSelect size="icon" />
  return <ThemeToggles brand={(brand ?? 'crp') as Brand} mode={mode as Mode} onCycleBrand={onCycleBrand} onToggleMode={onToggleMode} />
}

// Avatar + menu de conta (com confirmação de saída). Rótulos no namespace 'nav' (canônico da casca).
// Chrome vem do AccountMenu (fonte única, igual ao candidato); aqui só os DADOS do usuário-demo e o item
// "Minha conta". onEditarPerfil (opcional) abre a tela de perfil; sem ele, cai num toast de demo.
export function TopBarAccount({ onLogout, onEditarPerfil }: { onLogout: () => void; onEditarPerfil?: () => void }) {
  const { t } = useTranslation('nav')
  return (
    <AccountMenu
      iniciais={DEMO_USER.iniciais} nome={DEMO_USER.nome} email={DEMO_USER.email}
      triggerLabel={t('conta.label')}
      items={[{ icon: UserRound, label: t('conta.minha'), onSelect: () => (onEditarPerfil ? onEditarPerfil() : toast.info(t('conta.contaDemo'), { description: t('conta.contaDemoDescricao') })) }]}
      sairLabel={t('conta.sair')} sair={onLogout}
      sairConfirm={{ titulo: t('sairConfirm.titulo'), descricao: t('sairConfirm.descricao'), voltar: t('sairConfirm.voltar'), sair: t('sairConfirm.sair') }}
    />
  )
}
