/**
 * Header leve das telas do candidato no fluxo público (descrição da vaga, 2ª etapa). Só a marca — quando há
 * sessão, o logo vira link pro mural (/painel) e aparece a conta (avatar + ponto verde + sair) à direita.
 * Sem sessão (link público direto, ex.: LinkedIn), fica só o logo estático, sem conta.
 *
 * `publico` força a visão "fora do sistema": mesmo com sessão, esconde a conta e o link pro mural — é o que
 * um visitante sem cadastro (vindo do LinkedIn) veria.
 */
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { focusRing } from '@/lib/focus'
import { estaLogado } from '@/lib/candidatoSessao'
import { Logo } from '@/components/auth/Logo'
import { ContaMenu } from '@/components/candidato/ContaMenu'

export function CandidatoHeader({ brand, onSair, publico = false }: { brand?: string; onSair?: () => void; publico?: boolean }) {
  const { t } = useTranslation('painel')
  const logado = !publico && estaLogado()
  return (
    <header className="shrink-0 border-b border-border/60">
      <div className="mx-auto flex h-16 w-full max-w-4xl items-center px-6">
        {logado ? (
          <a href="/painel" aria-label={t('conta.irMural')} className={cn('rounded-sm', focusRing)}>
            <Logo brand={brand} className="h-8" />
          </a>
        ) : (
          <Logo brand={brand} className="h-8" />
        )}
        {logado && (
          <div className="ml-auto">
            <ContaMenu onSair={onSair} />
          </div>
        )}
      </div>
    </header>
  )
}
