/**
 * Dashboard — painel de RECRUTAMENTO (visão geral da operação de vagas). Visual limpo e arejado:
 * saudação, KPIs em cartões suaves, donut + card de destaque, e atividade recente em lista leve.
 * 100% token-driven (zero cor à mão); donut via conic-gradient com tokens; 1 gráfico real (recharts).
 * Demo: dados mockados. `onNavigate` liga os CTAs/menu às demais telas (shell compartilhado).
 */
import type { ComponentType } from 'react'
import { ArrowRight, Briefcase, Clock, Plus, Sparkles, TrendingDown, TrendingUp, UserCheck, Users } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'

import { cn } from '@/lib/utils'
import { CARD } from '@/lib/surfaces'
import { exportCsv } from '@/lib/exportCsv'
import { formatNumber } from '@/lib/datetime'
import { type StatusVaga as Status } from '@/lib/types'
import { AppShell } from '@/components/shell/AppShell'
import { ExportButton } from '@/components/ExportButton'
import { PageContainer, PageHeader, Panel, StatCard, StatusBadge, type BadgeTone } from '@/components/page'
import { Button } from '@/components/ui/button'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

// Nome de exibição (dado mockado — não traduzido); usado na saudação e no card de destaque.
const NOME = 'Frank'

type KpiKey = 'vagasAbertas' | 'candidatosFunil' | 'contratacoesMes' | 'tempoMedioFechamento'
type Dir = 'up' | 'down'
// `unidade` (opcional): chave de UNIDADE traduzível anexada ao número (valor/delta) — o número fica canônico
// e só a palavra "dias" muda por idioma (dias/days/días). Sem unidade, valor/delta são exibidos como estão.
const KPIS: { key: KpiKey; valor: string; delta: string; dir: Dir; good: boolean; icon: ComponentType<{ className?: string }>; unidade?: 'dias' }[] = [
  { key: 'vagasAbertas', valor: '18', delta: '+5', dir: 'up', good: true, icon: Briefcase },
  { key: 'candidatosFunil', valor: '1.284', delta: '+12%', dir: 'up', good: true, icon: Users },
  { key: 'contratacoesMes', valor: '31', delta: '+6', dir: 'up', good: true, icon: UserCheck },
  { key: 'tempoMedioFechamento', valor: '27', delta: '−4', dir: 'down', good: true, icon: Clock, unidade: 'dias' },
]

// `mes` é o VALOR canônico (pt-BR) usado como chave do gráfico e do lookup de tradução do eixo.
const CONTRATACOES = [
  { mes: 'Jan', total: 12 },
  { mes: 'Fev', total: 19 },
  { mes: 'Mar', total: 15 },
  { mes: 'Abr', total: 27 },
  { mes: 'Mai', total: 22 },
  { mes: 'Jun', total: 31 },
]

// Funil do processo seletivo — barras decrescentes (largura relativa ao topo) + conversão vs. etapa anterior.
const FUNIL = [
  { etapa: 'Inscritos', valor: 1284 },
  { etapa: 'Triagem', valor: 642 },
  { etapa: 'Entrevista', valor: 268 },
  { etapa: 'Oferta', valor: 96 },
  { etapa: 'Contratados', valor: 31 },
]
const FUNIL_MAX = FUNIL[0].valor

// Vagas por status — donut (conic-gradient com tokens). Cores DESSATURADAS: cada hue de status é
// misturado com a superfície do card (color-mix toward --card) → tom suave/clean nos dois temas,
// mantendo o significado (verde=Aberta, vermelho=Fechada). Mesma cor alimenta o donut e o ponto.
const soft = (token: string) => `color-mix(in oklab, ${token} 55%, var(--card))`
const STATUS_DONUT = [
  { label: 'Aberta', value: 18, cor: soft('var(--success)') },
  { label: 'Em pausa', value: 5, cor: soft('var(--warning)') },
  { label: 'Rascunho', value: 6, cor: soft('var(--secondary)') },
  { label: 'Fechada', value: 9, cor: soft('var(--destructive)') },
]
const STATUS_TOTAL = STATUS_DONUT.reduce((s, x) => s + x.value, 0)
const DONUT_STOPS = (() => {
  let acc = 0
  return STATUS_DONUT.map((s) => {
    const a = (acc / STATUS_TOTAL) * 100
    acc += s.value
    const b = (acc / STATUS_TOTAL) * 100
    return `${s.cor} ${a}% ${b}%`
  }).join(', ')
})()

const STATUS_TONE: Record<Status, BadgeTone> = {
  'Aberta': 'success',
  'Rascunho': 'secondary',
  'Em pausa': 'warning',
  'Fechada': 'destructive',
}
const VAGAS_RECENTES: { vaga: string; sr: string; inscritos: number; status: Status }[] = [
  { vaga: 'Desenvolvedor Backend', sr: 'Pleno', inscritos: 63, status: 'Aberta' },
  { vaga: 'Tech Lead Frontend', sr: 'Sênior', inscritos: 61, status: 'Aberta' },
  { vaga: 'Product Manager', sr: 'Sênior', inscritos: 56, status: 'Em pausa' },
  { vaga: 'UX Designer III', sr: 'Pleno/Sênior', inscritos: 34, status: 'Rascunho' },
  { vaga: 'Engenheiro de Dados', sr: 'Pleno', inscritos: 47, status: 'Fechada' },
]

export function Dashboard({ onNavigate, brand, mode, onCycleBrand, onToggleMode }: {
  onNavigate: (v: string) => void; brand?: string; mode?: string; onCycleBrand?: () => void; onToggleMode?: () => void
}) {
  const { t } = useTranslation('dashboard')

  // Tradução da EXIBIÇÃO de status/etapa/mês — o VALOR canônico (pt-BR) permanece no código (chaves do
  // STATUS_TONE, dataKey do gráfico, etc.); só o rótulo mostrado é traduzido via lookup pela chave canônica.
  const tStatus = (v: Status) => t(`status.${v}` as 'status.Aberta')
  const tEtapa = (v: string) => t(`etapa.${v}` as 'etapa.Inscritos')
  const tMes = (v: string) => t(`mes.${v}` as 'mes.Jan')

  // STATUS_TONE mantém chaves canônicas pt-BR; aqui derivamos o mapa rótulo-traduzido→tom p/ o StatusBadge,
  // que usa `value` tanto para o lookup do tom quanto para a exibição.
  const STATUS_TONE_I18N: Record<string, BadgeTone> = Object.fromEntries(
    (Object.keys(STATUS_TONE) as Status[]).map((k) => [tStatus(k), STATUS_TONE[k]]),
  )

  const chartConfig = { total: { label: t('contratacoesPorMes.legenda'), color: 'var(--chart-1)' } } satisfies ChartConfig

  // Exporta de verdade um CSV com os KPIs e os dados dos gráficos do dashboard (seção · métrica · valor).
  const handleExport = () => {
    const rows: { secao: string; metrica: string; valor: string }[] = [
      ...KPIS.map((k) => ({ secao: t('export.kpis'), metrica: t(`kpi.${k.key}`), valor: k.valor })),
      ...STATUS_DONUT.map((s) => ({ secao: t('export.vagasPorStatus'), metrica: tStatus(s.label as Status), valor: String(s.value) })),
      ...CONTRATACOES.map((c) => ({ secao: t('export.contratacoesPorMes'), metrica: tMes(c.mes), valor: String(c.total) })),
      ...FUNIL.map((f) => ({ secao: t('export.funil'), metrica: tEtapa(f.etapa), valor: String(f.valor) })),
    ]
    exportCsv(t('export.arquivo'), rows, [
      { header: t('export.secao'), value: (r) => r.secao },
      { header: t('export.metrica'), value: (r) => r.metrica },
      { header: t('export.valor'), value: (r) => r.valor },
    ])
  }

  return (
    <AppShell active="dashboard" crumb="Dashboard" onNavigate={onNavigate} brand={brand} mode={mode} onCycleBrand={onCycleBrand} onToggleMode={onToggleMode}>
      <PageContainer>
        {/* saudação */}
        <PageHeader
          title={<>{t('saudacao', { nome: NOME })} <span aria-hidden>👋</span></>}
          desc={t('desc')}
          actions={
            <div className="flex items-center gap-2">
              <ExportButton onExport={handleExport} />
              <Button onClick={() => onNavigate?.('gerador')}><Plus aria-hidden /> {t('abrirVaga')}</Button>
            </div>
          }
        />

        {/* KPIs */}
        <section aria-label={t('indicadores')} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map(({ key, valor, delta, dir, good, icon: Icon, unidade }) => {
            const unidadeTxt = unidade ? ` ${t(`unidade.${unidade}` as 'unidade.dias')}` : ''
            return (
              <StatCard
                key={key}
                icon={Icon}
                label={t(`kpi.${key}`)}
                value={`${valor}${unidadeTxt}`}
                delta={
                  <p className={cn('mt-1.5 flex items-center gap-1 ty-body-sm', good ? 'text-success-text' : 'text-destructive-text')}>
                    {dir === 'up' ? <TrendingUp className="size-3.5 shrink-0" aria-hidden /> : <TrendingDown className="size-3.5 shrink-0" aria-hidden />}
                    <span className="font-medium tabular-nums">{delta}{unidadeTxt}</span>
                    <span className="text-muted-foreground">{t('vsMesAnterior')}</span>
                  </p>
                }
              />
            )
          })}
        </section>

        {/* vagas por status (donut) + destaque da semana */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title={t('vagasPorStatus.titulo')} desc={t('vagasPorStatus.desc', { total: STATUS_TOTAL })}>
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              {/* donut decorativo (a legenda ao lado carrega os números p/ leitor de tela) */}
              <div className="relative size-36 shrink-0" aria-hidden>
                <div className="size-full rounded-full" style={{ background: `conic-gradient(${DONUT_STOPS})` }} />
                <div className="absolute inset-[18px] flex flex-col items-center justify-center rounded-full bg-card">
                  <span className="font-heading text-2xl font-bold tabular-nums text-foreground">{STATUS_TOTAL}</span>
                  <span className="ty-caption text-muted-foreground">{t('vagasPorStatus.centro')}</span>
                </div>
              </div>
              <ul className="w-full space-y-2.5">
                {STATUS_DONUT.map((s) => (
                  <li key={s.label} className="flex items-center gap-2.5 ty-body-sm">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.cor }} aria-hidden />
                    <span className="text-foreground">{tStatus(s.label as Status)}</span>
                    <span className="ml-auto tabular-nums text-muted-foreground">{s.value} · {Math.round((s.value / STATUS_TOTAL) * 100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>

          {/* card de destaque — amigável, com CTA */}
          <section className={cn(CARD, 'flex flex-col items-center justify-center bg-primary/[0.04] p-6 text-center sm:p-8')}>
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary-text" aria-hidden><Sparkles className="size-7" /></span>
            <h2 className="mt-4 ty-body-lg text-foreground" style={{ fontWeight: 'var(--font-weight-bold)' }}>{t('destaque.titulo', { nome: NOME })} <span aria-hidden>🎉</span></h2>
            <p className="mt-2 max-w-sm ty-body-sm leading-relaxed text-muted-foreground">
              <Trans
                t={t}
                i18nKey="destaque.texto"
                values={{ pct: t('destaque.pct'), dias: t('destaque.dias') }}
                components={{ pct: <span className="font-medium text-success-text" /> }}
              />
            </p>
            <div className="mt-5">
              <Button onClick={() => onNavigate?.('candidatos')}>{t('destaque.cta')} <ArrowRight aria-hidden /></Button>
            </div>
          </section>
        </div>

        {/* contratações por mês + funil do processo */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title={t('contratacoesPorMes.titulo')} desc={t('contratacoesPorMes.desc')} className="lg:col-span-2">
            <ChartContainer config={chartConfig} className="h-[240px] w-full">
              <BarChart accessibilityLayer data={CONTRATACOES}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v: string) => tMes(v)} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="total" fill="var(--color-total)" radius={6} />
              </BarChart>
            </ChartContainer>
          </Panel>

          <Panel title={t('funil.titulo')} desc={t('funil.desc')}>
            <ol className="space-y-4">
              {FUNIL.map((f, i) => {
                const pct = (f.valor / FUNIL_MAX) * 100
                const conv = i === 0 ? null : Math.round((f.valor / FUNIL[i - 1].valor) * 100)
                return (
                  <li key={f.etapa} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2 ty-body-sm">
                      <span className="font-medium text-foreground">{tEtapa(f.etapa)}</span>
                      <span className="flex items-baseline gap-2 tabular-nums">
                        <span className="text-foreground">{formatNumber(f.valor)}</span>
                        {conv !== null && <span className="ty-caption text-muted-foreground">{conv}%</span>}
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary motion-safe:transition-all motion-safe:duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                )
              })}
            </ol>
          </Panel>
        </div>

        {/* vagas recentes — lista leve */}
        <Panel
          title={t('vagasRecentes.titulo')}
          desc={t('vagasRecentes.desc')}
          action={<Button variant="ghost" size="sm" className="text-primary-text hover:bg-primary/10 hover:text-primary-text" onClick={() => onNavigate?.('gerador')}>{t('vagasRecentes.verTodas')} <ArrowRight aria-hidden /></Button>}
        >
          <ul>
            {VAGAS_RECENTES.map((v) => (
              <li key={v.vaga} className="flex items-center gap-4 border-b border-border/40 py-3.5 last:border-0 last:pb-0">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary-text" aria-hidden><Briefcase className="size-4.5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate ty-body-sm font-semibold text-foreground">{v.vaga}</p>
                  <p className="ty-caption text-muted-foreground">{v.sr}</p>
                </div>
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="text-right">
                    <p className="ty-body-sm font-semibold tabular-nums text-foreground">{v.inscritos}</p>
                    <p className="ty-caption text-muted-foreground">{t('vagasRecentes.inscritos')}</p>
                  </div>
                  <StatusBadge value={tStatus(v.status)} tones={STATUS_TONE_I18N} className="shrink-0" />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </PageContainer>
    </AppShell>
  )
}
