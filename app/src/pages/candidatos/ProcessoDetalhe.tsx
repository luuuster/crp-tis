/**
 * Detalhe de UM processo seletivo — tela dedicada: cabeçalho + progresso + linha do tempo das fases
 * (com observação por fase) + o "porquê" completo da reprovação. É a análise aprofundada de um processo.
 */
import { useState } from 'react'
import { CheckCircle2, ChevronLeft, MessageSquareText, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { CARD } from '@/lib/surfaces'
import { DetailScreen } from '@/components/page'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AvaliacaoIAConteudo } from '../EntrevistasIA'
import type { Candidato, Processo } from './types'
import { notaBar, FASE_VISUAL, FASE_LABEL_COLOR, PROC_BAR, ProcStatusBadge, useResultadoFaseLabel } from './styles'

export function ProcessoDetalhe({ c, p, onVoltar }: { c: Candidato; p: Processo; onVoltar: () => void }) {
  const { t } = useTranslation('candidatos')
  const faseLabel = useResultadoFaseLabel()
  const pct = Math.round((p.faseAtual / p.totalFases) * 100)
  // Etapa aberta no stepper. Começa na fase atual do funil (a mais relevante).
  const [sel, setSel] = useState(Math.min(Math.max(p.faseAtual - 1, 0), p.totalFases - 1))
  const fSel = p.fases[sel]
  const vSel = FASE_VISUAL[fSel.resultado]
  const dSel = fSel.detalhe
  const pv = p.perfilVaga
  return (
    <DetailScreen
      width="6xl"
      crumb={<>{t('proc.crumbBanco')} · <span className="font-medium text-foreground">{c.nome}</span></>}
      footer={<Button variant="ghost" onClick={onVoltar}><ChevronLeft aria-hidden /> {t('proc.voltar')}</Button>}
    >
        {/* cabeçalho do processo */}
        <header className={cn(CARD, 'p-6')}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="ty-overline text-muted-foreground">{t('proc.overline')}</p>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{p.titulo}</h1>
              <p className="ty-body-sm text-muted-foreground">{t('proc.aplicou', { data: p.data })}</p>
            </div>
            <ProcStatusBadge value={p.status} size="body-sm" className="shrink-0" />
          </div>
          <div className="mt-5">
            <div className="flex items-center justify-between gap-2">
              <p className="ty-body-sm font-medium text-foreground">{t('proc.progresso')}</p>
              <span className="ty-body-sm font-semibold tabular-nums text-foreground">{t('proc.faseDe', { atual: p.faseAtual, total: p.totalFases })}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
              <div className={cn('h-full rounded-full transition-all', PROC_BAR[p.status])} style={{ width: `${pct}%` }} />
            </div>
          </div>
        </header>

        {/* duas colunas: conteúdo principal (etapas) à esquerda + resumo da vaga fixo à direita —
            aproveita a largura que antes ficava como margem vazia. */}
        <div className="grid gap-6 lg:grid-cols-3">
          <aside className="lg:order-2">
            <div className="space-y-6 lg:sticky lg:top-6">
        {/* o que a vaga pedia × o que o candidato alcançou */}
        <section className={cn(CARD, 'p-6')}>
          <h2 className="ty-body-lg text-foreground" style={{ fontWeight: 'var(--font-weight-bold)' }}>{t('proc.vagaCandidato.titulo')}</h2>
          <p className="mt-0.5 ty-caption text-muted-foreground">{t('proc.vagaCandidato.desc')}</p>

          <div className="mt-5 rounded-xl bg-muted/30 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="ty-body-sm font-medium text-foreground">{t('proc.aderencia')}</p>
              <span className="ty-body-sm font-semibold tabular-nums text-foreground">{pv.aderencia}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
              <div className={cn('h-full rounded-full motion-safe:transition-all motion-safe:duration-500', notaBar(pv.aderencia))} style={{ width: `${pv.aderencia}%` }} />
            </div>
            <p className="mt-3 ty-body-sm text-muted-foreground">{pv.conquista}</p>
          </div>

          <div className="mt-4 grid gap-3">
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="ty-caption text-muted-foreground">{t('proc.vagaPedia')}</p>
              <p className="mt-1 ty-body-sm leading-relaxed text-foreground">{pv.resumo}</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="ty-caption text-muted-foreground">{t('proc.expExigida')}</p>
              <p className="mt-1 ty-body-sm font-semibold text-foreground">{pv.experiencia}</p>
            </div>
          </div>

          <p className="mt-5 ty-caption font-semibold tracking-wide text-foreground uppercase">{t('proc.requisitos')}</p>
          <ul className="mt-2 space-y-2">
            {pv.requisitos.map((req) => (
              <li key={req.nome} className={cn('flex items-center gap-2.5 rounded-lg p-3 ty-body-sm text-foreground', req.atendido ? 'bg-success/5' : 'bg-destructive/5')}>
                {req.atendido ? <CheckCircle2 className="size-4 shrink-0 text-success-text" aria-hidden /> : <XCircle className="size-4 shrink-0 text-destructive-text" aria-hidden />}
                <span className="sr-only">{req.atendido ? t('proc.atendido') : t('proc.naoAtendido')}</span>
                <span className="min-w-0 flex-1 truncate font-medium">{req.nome}</span>
                <Badge variant="ghost" className={cn('shrink-0 ty-caption font-medium', req.obrigatorio ? 'bg-primary/10 text-primary-text' : 'bg-muted text-muted-foreground')}>{req.obrigatorio ? t('proc.obrigatorio') : t('proc.desejavel')}</Badge>
              </li>
            ))}
          </ul>
        </section>
            </div>
          </aside>

          {/* coluna principal — etapas do processo + análise da reprovação */}
          <div className="space-y-6 lg:order-1 lg:col-span-2">
        {/* etapas — stepper clicável (passo a passo) + detalhe da etapa selecionada */}
        <section className={cn(CARD, 'p-6')}>
          <h2 className="ty-body-lg text-foreground" style={{ fontWeight: 'var(--font-weight-bold)' }}>{t('proc.etapas.titulo')}</h2>
          <p className="mt-0.5 ty-caption text-muted-foreground">{t('proc.etapas.desc')}</p>

          {/* trilho de etapas — cada passo é um cartão clicável com seu estado */}
          <ol className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-label={t('proc.etapas.aria', { atual: p.faseAtual, total: p.totalFases })}>
            {p.fases.map((f, i) => {
              const v = FASE_VISUAL[f.resultado]
              const ativo = i === sel
              const pend = f.resultado === 'pendente'
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => setSel(i)}
                    aria-current={ativo ? 'step' : undefined}
                    className={cn(
                      'flex h-full w-full flex-col gap-2 rounded-xl p-3 text-left transition focus-visible:focus-ring',
                      ativo ? 'bg-primary/[0.05] shadow-sm ring-2 ring-primary/50' : 'bg-muted/30 ring-1 ring-surface-ring hover:bg-accent/40',
                    )}
                  >
                    <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full', pend ? 'bg-muted text-muted-foreground ty-caption font-semibold tabular-nums' : v.bg)} aria-hidden>
                      {pend ? i + 1 : <v.icon className="size-4" />}
                    </span>
                    <span className="space-y-0.5">
                      <span className="sr-only">{t('proc.etapaN', { n: i + 1 })}</span>
                      <span className="block ty-caption font-semibold text-foreground">{f.nome}</span>
                      <span className={cn('block ty-caption font-medium', FASE_LABEL_COLOR[f.resultado])}>{faseLabel(f.resultado)}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>

          {/* detalhe da etapa selecionada — "como foi" */}
          <div key={sel} className="mt-6 border-t border-border/50 pt-6 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200">
            <div className="flex flex-wrap items-center gap-3">
              <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full', vSel.bg)} aria-hidden><vSel.icon className="size-4.5" /></span>
              <div className="min-w-0">
                <p className="ty-overline text-muted-foreground">{t('proc.etapaDe', { atual: sel + 1, total: p.totalFases })}</p>
                <h3 className="ty-body-lg text-foreground" style={{ fontWeight: 'var(--font-weight-bold)' }}>{fSel.nome}</h3>
              </div>
              <span className={cn('ml-auto rounded-full px-2.5 py-0.5 ty-caption font-medium', vSel.bg)}>{faseLabel(fSel.resultado)}</span>
            </div>

            <p className="mt-3 ty-body-sm leading-relaxed text-muted-foreground">{dSel.resumo}</p>

            {dSel.campos.length > 0 && (
              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                {dSel.campos.map((cmp) => (
                  <div key={cmp.label} className="rounded-lg bg-muted/30 p-3">
                    <dt className="ty-caption text-muted-foreground">{cmp.label}</dt>
                    <dd className="mt-0.5 ty-body-sm font-semibold text-foreground">{cmp.valor}</dd>
                  </div>
                ))}
              </dl>
            )}

            {/* triagem de currículo por IA — avaliação COMPLETA da IA (mesma da tela Entrevistas IA) */}
            {dSel.triagemIA && (
              <div className="mt-5">
                <AvaliacaoIAConteudo
                  d={dSel.triagemIA}
                  email={c.email}
                  vaga={c.vaga}
                  statusLabel={fSel.resultado === 'reprovado' ? 'Reprovado' : 'Aprovado bot'}
                />
              </div>
            )}

            {/* conversa (entrevista com RH / com o gestor) — o que foi falado */}
            {dSel.conversa && (
              <div className="mt-5">
                <p className="flex items-center gap-2 ty-caption font-semibold tracking-wide text-foreground uppercase"><MessageSquareText className="size-3.5 text-muted-foreground" aria-hidden /> {sel === 1 ? t('proc.conversa.rh') : t('proc.conversa.gestor')}</p>
                <ul className="mt-2 space-y-2.5">
                  {dSel.conversa.map((qa, i) => (
                    <li key={i} className="rounded-lg bg-muted/30 p-3">
                      <p className="ty-body-sm font-semibold text-foreground">{qa.pergunta}</p>
                      <p className="mt-1 ty-body-sm leading-relaxed text-muted-foreground">{qa.resposta}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* desafio (teste técnico) */}
            {dSel.desafio && (
              <div className="mt-5">
                <p className="ty-caption font-semibold tracking-wide text-foreground uppercase">{t('proc.desafio')}</p>
                <div className="mt-2 space-y-2">
                  {([['enunciado', dSel.desafio.descricao], ['entrega', dSel.desafio.entrega], ['observacao', dSel.desafio.observacao]] as const).map(([campo, valor]) => (
                    <div key={campo} className="rounded-lg bg-muted/30 p-3">
                      <p className="ty-caption text-muted-foreground">{t(`proc.desafioCampo.${campo}`)}</p>
                      <p className="mt-0.5 ty-body-sm text-foreground">{valor}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* oferta (proposta) */}
            {dSel.oferta && (
              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                {dSel.oferta.map((o) => (
                  <div key={o.label} className="rounded-lg bg-muted/30 p-3">
                    <dt className="ty-caption text-muted-foreground">{o.label}</dt>
                    <dd className="mt-0.5 ty-body-sm font-semibold text-foreground">{o.valor}</dd>
                  </div>
                ))}
              </dl>
            )}

            {dSel.criterios.length > 0 && (
              <>
                <p className="mt-5 ty-caption font-semibold tracking-wide text-foreground uppercase">{t('proc.criterios')}</p>
                <ul className="mt-3 space-y-3">
                  {dSel.criterios.map((cr) => (
                    <li key={cr.nome}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="ty-body-sm text-foreground">{cr.nome}</span>
                        <span className="ty-caption font-semibold tabular-nums text-muted-foreground">{cr.nota}/100</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                        <div className={cn('h-full rounded-full motion-safe:transition-all motion-safe:duration-500', notaBar(cr.nota))} style={{ width: `${cr.nota}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {dSel.destaques.length > 0 && (
              <>
                <p className="mt-5 ty-caption font-semibold tracking-wide text-foreground uppercase">{t('proc.destaques')}</p>
                <ul className="mt-2 space-y-2">
                  {dSel.destaques.map((m, i) => (
                    <li key={i} className="flex gap-2.5 rounded-lg bg-success/5 p-3 ty-body-sm text-foreground"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success-text" aria-hidden /> <span>{m}</span></li>
                  ))}
                </ul>
              </>
            )}

            {dSel.atencao.length > 0 && (
              <>
                <p className="mt-5 ty-caption font-semibold tracking-wide text-foreground uppercase">{t('proc.atencao')}</p>
                <ul className="mt-2 space-y-2">
                  {dSel.atencao.map((m, i) => (
                    <li key={i} className="flex gap-2.5 rounded-lg bg-destructive/5 p-3 ty-body-sm text-foreground"><XCircle className="mt-0.5 size-4 shrink-0 text-destructive-text" aria-hidden /> <span>{m}</span></li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>

        {/* por que foi reprovado — só ao abrir a etapa onde o candidato caiu (não nas etapas anteriores) */}
        {p.reprovacao && fSel.resultado === 'reprovado' && (
          <section className={cn(CARD, 'p-6')}>
            <h2 className="flex items-center gap-2 ty-body-lg text-destructive-text" style={{ fontWeight: 'var(--font-weight-bold)' }}><XCircle className="size-5 shrink-0" aria-hidden /> {t('proc.reprovacao.titulo')}</h2>
            <p className="mt-2 ty-body-sm leading-relaxed text-muted-foreground">{p.reprovacao.resumo}</p>

            <p className="mt-5 ty-caption font-semibold tracking-wide text-foreground uppercase">{t('proc.reprovacao.motivos')}</p>
            <ul className="mt-2 space-y-2">
              {p.reprovacao.motivos.map((m, i) => (
                <li key={i} className="flex gap-2.5 rounded-lg bg-destructive/5 p-3 ty-body-sm text-foreground"><XCircle className="mt-0.5 size-4 shrink-0 text-destructive-text" aria-hidden /> <span>{m}</span></li>
              ))}
            </ul>

            {p.reprovacao.positivos.length > 0 && (
              <>
                <p className="mt-5 ty-caption font-semibold tracking-wide text-foreground uppercase">{t('proc.reprovacao.positivos')}</p>
                <ul className="mt-2 space-y-2">
                  {p.reprovacao.positivos.map((m, i) => (
                    <li key={i} className="flex gap-2.5 rounded-lg bg-success/5 p-3 ty-body-sm text-foreground"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success-text" aria-hidden /> <span>{m}</span></li>
                  ))}
                </ul>
              </>
            )}

            <div className="mt-5 grid gap-4 border-t border-border/50 pt-4 sm:grid-cols-2">
              <div>
                <p className="ty-caption text-muted-foreground">{t('proc.reprovacao.recomendacao')}</p>
                <p className="ty-body-sm font-medium text-foreground">{p.reprovacao.recomendacao}</p>
              </div>
              <div>
                <p className="ty-caption text-muted-foreground">{t('proc.reprovacao.avaliadoPor')}</p>
                <p className="ty-body-sm font-medium text-foreground">{p.reprovacao.avaliador}</p>
              </div>
            </div>
          </section>
        )}
          </div>
        </div>
    </DetailScreen>
  )
}
