/**
 * Perfil do candidato — herói azul + KPIs do histórico + lista de processos seletivos. Clicar num
 * processo abre o ProcessoDetalhe (via onAbrirProcesso). ProcessoResumo é privado deste arquivo.
 */
import { ChevronLeft, ChevronRight, Clock, FileText, ListChecks, Target, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { CARD } from '@/lib/surfaces'
import { iniciais } from '@/lib/format'
import { DetailScreen, StatCard } from '@/components/page'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Candidato, Processo } from './types'
import { buildProcessos } from './builders'
import { ProcStatusBadge, PROC_BAR, useSenioridadeLabel } from './styles'

// Resumo clicável de um processo (no perfil) — abre o detalhe completo ao clicar.
function ProcessoResumo({ p, onClick }: { p: Processo; onClick: () => void }) {
  const { t } = useTranslation('candidatos')
  const pct = Math.round((p.faseAtual / p.totalFases) * 100)
  return (
    <button type="button" onClick={onClick} className={cn(CARD, 'group flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-muted/30 focus-visible:focus-ring')}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate ty-body-lg text-foreground" style={{ fontWeight: 'var(--font-weight-bold)' }}>{p.titulo}</h3>
          <ProcStatusBadge value={p.status} />
        </div>
        <p className="mt-0.5 ty-caption text-muted-foreground">{t('perfil.chegouA')} <span className="font-medium text-foreground">{t('perfil.faseDeAplicou', { atual: p.faseAtual, total: p.totalFases })}</span> · {t('perfil.aplicou', { data: p.data })}</p>
        <div className="mt-2 h-1.5 max-w-xs overflow-hidden rounded-full bg-muted" aria-hidden>
          <div className={cn('h-full rounded-full transition-all', PROC_BAR[p.status])} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className="flex shrink-0 items-center gap-1 ty-caption font-medium text-primary-text">{t('perfil.verAnalise')} <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></span>
    </button>
  )
}

export function CandidatoPerfil({ c, onVoltar, onAbrirProcesso }: { c: Candidato; onVoltar: () => void; onAbrirProcesso: (p: Processo) => void }) {
  const { t } = useTranslation('candidatos')
  const senLabel = useSenioridadeLabel()
  const processos = buildProcessos(c)
  const emAndamento = processos.filter((p) => p.status === 'Em andamento').length
  const contratacoes = processos.filter((p) => p.status === 'Contratado').length
  const melhorFase = Math.max(...processos.map((p) => p.faseAtual))
  return (
    <DetailScreen
      width="5xl"
      footer={
        <>
          <Button variant="ghost" onClick={onVoltar}><ChevronLeft aria-hidden /> {t('perfil.voltar')}</Button>
          <Button onClick={() => toast.info(t('perfil.toastCurriculo', { nome: c.nome }))}><FileText aria-hidden /> {t('perfil.verCurriculo')}</Button>
        </>
      }
    >
        {/* hero */}
        <header className="overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-sm ring-1 ring-surface-ring">
          <div className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div className="flex items-center gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary-foreground/15 font-heading text-xl font-bold" aria-hidden>{iniciais(c.nome)}</span>
              <div className="min-w-0">
                <p className="ty-overline text-primary-foreground">{t('perfil.overline')}</p>
                <h1 className="truncate font-heading text-2xl font-bold tracking-tight sm:text-3xl">{c.nome}</h1>
                <p className="mt-0.5 truncate ty-body-sm text-primary-foreground">{c.email} · {c.vaga} · {senLabel(c.senioridade)}</p>
              </div>
            </div>
            {/* sobre o herói azul, o badge usa o par primary/primary-foreground (AA) — variantes -text
                são para fundo claro e ficariam ilegíveis aqui (ex.: "Contratado" em verde no azul). */}
            {/* pílula VAZADA: texto branco sobre o bg-primary puro (par primary/primary-foreground = AA
                pelo DS nos 4 temas) + anel branco pra forma. Sem tinta de fundo, que clareava o herói
                no dark e derrubava o contraste. */}
            <Badge variant="ghost" className="shrink-0 ty-caption font-medium text-primary-foreground ring-1 ring-inset ring-primary-foreground/40">{t(`etapa.${c.etapa}`)}</Badge>
          </div>
        </header>

        {/* resumo do histórico */}
        <section aria-label={t('perfil.ariaResumo')} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={ListChecks} label={t('perfil.kpi.processos')} value={processos.length} />
          <StatCard icon={Clock} label={t('perfil.kpi.emAndamento')} value={emAndamento} />
          <StatCard icon={UserCheck} label={t('perfil.kpi.contratacoes')} value={contratacoes} />
          <StatCard icon={Target} label={t('perfil.kpi.melhorFase')} value={t('perfil.fase', { n: melhorFase })} />
        </section>

        {/* processos seletivos */}
        <section aria-labelledby="processos" className="space-y-4">
          <div className="flex items-center gap-2.5">
            <ListChecks className="size-5 shrink-0 text-primary-text" aria-hidden />
            <div className="space-y-0.5">
              <h2 id="processos" className="ty-body-lg text-foreground" style={{ fontWeight: 'var(--font-weight-bold)' }}>{t('perfil.processosTitulo')}</h2>
              <p className="ty-caption text-muted-foreground">{t('perfil.processosDesc', { count: processos.length })}</p>
            </div>
          </div>
          <div className="space-y-3">
            {processos.map((p) => <ProcessoResumo key={p.id} p={p} onClick={() => onAbrirProcesso(p)} />)}
          </div>
        </section>
    </DetailScreen>
  )
}
