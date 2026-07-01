/**
 * Catálogo de widgets do Dashboard (mesmo espírito do registry DEMOS da vitrine). Cada seção da
 * dashboard vira um widget autossuficiente e reaproveitável — o usuário escolhe quais ver e em que
 * tamanho (modo "Personalizar"). 100% token-driven; dados vêm de ./data (mock). Sem backend.
 */
import type { ComponentType } from 'react'
import { ArrowRight, Briefcase, CalendarClock, Sparkles, TrendingDown, TrendingUp } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'

import { cn } from '@/lib/utils'
import { CARD } from '@/lib/surfaces'
import { formatNumber } from '@/lib/datetime'
import type { StatusVaga as Status } from '@/lib/types'
import { Panel, StatCard, StatusBadge, type BadgeTone } from '@/components/page'
import { Button } from '@/components/ui/button'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import {
  CONTRATACOES,
  DONUT_STOPS,
  FUNIL,
  FUNIL_MAX,
  KPIS,
  NOME,
  ORIGEM,
  ORIGEM_STOPS,
  ORIGEM_TOTAL,
  PROXIMAS_ENTREVISTAS,
  STATUS_DONUT,
  STATUS_TONE,
  STATUS_TOTAL,
  TAXA_ACEITACAO,
  TEMPO_ETAPA,
  VAGAS_RECENTES,
  type Kpi,
} from './data'

/* ────────────────────────── tipos do catálogo/layout ────────────────────────── */

export type WidgetSize = 'sm' | 'md' | 'lg' | 'full'
export type WidgetCategoria = 'kpi' | 'grafico' | 'lista' | 'destaque'
export type WidgetProps = { onNavigate: (v: string) => void }
export type WidgetDef = {
  id: string
  tituloKey: string // chave i18n do nome exibido no catálogo
  categoria: WidgetCategoria
  defaultSize: WidgetSize
  Component: ComponentType<WidgetProps>
}
// Um item do layout montado pelo usuário: qual widget e em que tamanho.
export type LayoutItem = { id: string; size: WidgetSize }

/* ────────────────────────── widgets (reaproveitam o Dashboard) ────────────────────────── */

function KpiCard({ kpi }: { kpi: Kpi }) {
  const { t } = useTranslation('dashboard')
  const { key, valor, delta, dir, good, icon: Icon, unidade } = kpi
  const unidadeTxt = unidade ? ` ${t(`unidade.${unidade}` as 'unidade.dias')}` : ''
  return (
    <StatCard
      icon={Icon}
      label={t(`kpi.${key}` as 'kpi.vagasAbertas')}
      value={`${valor}${unidadeTxt}`}
      delta={
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          {/* chip de variação (par fill/-text a 10% → AA nos 4 temas); cor pela QUALIDADE, seta pela DIREÇÃO. */}
          <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 ty-caption font-medium tabular-nums', good ? 'bg-success/10 text-success-text' : 'bg-destructive/10 text-destructive-text')}>
            {dir === 'up' ? <TrendingUp className="size-3 shrink-0" aria-hidden /> : <TrendingDown className="size-3 shrink-0" aria-hidden />}
            {delta}{unidadeTxt}
          </span>
          <span className="ty-caption text-muted-foreground">{t('vsMesAnterior')}</span>
        </div>
      }
    />
  )
}
// Fábrica: cada KPI vira um componente estável (criado uma vez no load do módulo).
const kpiWidget = (kpi: Kpi): ComponentType<WidgetProps> => {
  const C = () => <KpiCard kpi={kpi} />
  C.displayName = `KpiWidget_${kpi.key}`
  return C
}

function DonutWidget() {
  const { t } = useTranslation('dashboard')
  const tStatus = (v: Status) => t(`status.${v}` as 'status.Aberta')
  return (
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
  )
}

function DestaqueWidget({ onNavigate }: WidgetProps) {
  const { t } = useTranslation('dashboard')
  return (
    <section className={cn(CARD, 'flex h-full flex-col items-center justify-center bg-primary/[0.04] p-6 text-center sm:p-8')}>
      <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary-text" aria-hidden><Sparkles className="size-7" /></span>
      <h2 className="mt-4 ty-body-lg text-foreground" style={{ fontWeight: 'var(--font-weight-bold)' }}>{t('destaque.titulo', { nome: NOME })} <span aria-hidden>🎉</span></h2>
      <p className="mt-2 max-w-sm ty-body-sm leading-relaxed text-muted-foreground">
        <Trans t={t} i18nKey="destaque.texto" values={{ pct: t('destaque.pct'), dias: t('destaque.dias') }} components={{ pct: <span className="font-medium text-success-text" /> }} />
      </p>
      <div className="mt-5">
        <Button onClick={() => onNavigate('candidatos')}>{t('destaque.cta')} <ArrowRight aria-hidden /></Button>
      </div>
    </section>
  )
}

function ContratacoesWidget() {
  const { t } = useTranslation('dashboard')
  const tMes = (v: string) => t(`mes.${v}` as 'mes.Jan')
  const chartConfig = { total: { label: t('contratacoesPorMes.legenda'), color: 'var(--chart-1)' } } satisfies ChartConfig
  return (
    <Panel title={t('contratacoesPorMes.titulo')} desc={t('contratacoesPorMes.desc')}>
      <ChartContainer config={chartConfig} className="h-[240px] w-full">
        <BarChart accessibilityLayer data={CONTRATACOES}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v: string) => tMes(v)} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Bar dataKey="total" fill="var(--color-total)" radius={6} />
        </BarChart>
      </ChartContainer>
    </Panel>
  )
}

function FunilWidget() {
  const { t } = useTranslation('dashboard')
  const tEtapa = (v: string) => t(`etapa.${v}` as 'etapa.Inscritos')
  return (
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
                <div className="h-full rounded-full bg-chart-1 motion-safe:transition-all motion-safe:duration-500" style={{ width: `${pct}%` }} />
              </div>
            </li>
          )
        })}
      </ol>
    </Panel>
  )
}

function VagasRecentesWidget({ onNavigate }: WidgetProps) {
  const { t } = useTranslation('dashboard')
  const tStatus = (v: Status) => t(`status.${v}` as 'status.Aberta')
  const tones = Object.fromEntries((Object.keys(STATUS_TONE) as Status[]).map((k) => [tStatus(k), STATUS_TONE[k]])) as Record<string, BadgeTone>
  return (
    <Panel
      title={t('vagasRecentes.titulo')}
      desc={t('vagasRecentes.desc')}
      action={<Button variant="primary-soft" size="sm" onClick={() => onNavigate('gerador')}>{t('vagasRecentes.verTodas')} <ArrowRight aria-hidden /></Button>}
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
              <StatusBadge value={tStatus(v.status)} tones={tones} className="shrink-0" />
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

/* ───── widgets EXTRAS (no catálogo, fora do layout padrão) ───── */

function OrigemWidget() {
  const { t } = useTranslation('dashboard')
  const tOrigem = (k: string) => t(`origem.${k}` as 'origem.linkedin')
  return (
    <Panel title={t('origemCandidatos.titulo')} desc={t('origemCandidatos.desc')}>
      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <div className="relative size-36 shrink-0" aria-hidden>
          <div className="size-full rounded-full" style={{ background: `conic-gradient(${ORIGEM_STOPS})` }} />
          <div className="absolute inset-[18px] flex flex-col items-center justify-center rounded-full bg-card">
            <span className="font-heading text-2xl font-bold tabular-nums text-foreground">{ORIGEM_TOTAL.toLocaleString('pt-BR')}</span>
            <span className="ty-caption text-muted-foreground">{t('origemCandidatos.centro')}</span>
          </div>
        </div>
        <ul className="w-full space-y-2.5">
          {ORIGEM.map((s) => (
            <li key={s.key} className="flex items-center gap-2.5 ty-body-sm">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.cor }} aria-hidden />
              <span className="text-foreground">{tOrigem(s.key)}</span>
              <span className="ml-auto tabular-nums text-muted-foreground">{s.value} · {Math.round((s.value / ORIGEM_TOTAL) * 100)}%</span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  )
}

function TempoEtapaWidget() {
  const { t } = useTranslation('dashboard')
  const tEtapa = (v: string) => t(`etapa.${v}` as 'etapa.Inscritos')
  const chartConfig = { dias: { label: t('tempoPorEtapa.legenda'), color: 'var(--chart-1)' } } satisfies ChartConfig
  return (
    <Panel title={t('tempoPorEtapa.titulo')} desc={t('tempoPorEtapa.desc')}>
      <ChartContainer config={chartConfig} className="h-[240px] w-full">
        <BarChart accessibilityLayer data={TEMPO_ETAPA}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="etapa" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v: string) => tEtapa(v)} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Bar dataKey="dias" fill="var(--color-dias)" radius={6} />
        </BarChart>
      </ChartContainer>
    </Panel>
  )
}

function ProximasEntrevistasWidget({ onNavigate }: WidgetProps) {
  const { t } = useTranslation('dashboard')
  return (
    <Panel
      title={t('proximasEntrevistas.titulo')}
      desc={t('proximasEntrevistas.desc')}
      action={<Button variant="primary-soft" size="sm" onClick={() => onNavigate('entrevistas')}>{t('proximasEntrevistas.verTodas')} <ArrowRight aria-hidden /></Button>}
    >
      <ul>
        {PROXIMAS_ENTREVISTAS.map((e) => (
          <li key={e.candidato} className="flex items-center gap-4 border-b border-border/40 py-3.5 last:border-0 last:pb-0">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary-text" aria-hidden><CalendarClock className="size-4.5" /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate ty-body-sm font-semibold text-foreground">{e.candidato}</p>
              <p className="truncate ty-caption text-muted-foreground">{e.vaga}</p>
            </div>
            <div className="text-right">
              <p className="ty-body-sm font-semibold text-foreground">{t(`proximasEntrevistas.dia.${e.diaKey}` as 'proximasEntrevistas.dia.hoje')}</p>
              <p className="ty-caption tabular-nums text-muted-foreground">{e.hora}</p>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

/* ────────────────────────── registry + layout padrão ────────────────────────── */

export const WIDGET_LIST: WidgetDef[] = [
  // ── widgets do layout padrão de fábrica ──
  ...KPIS.map((k): WidgetDef => ({ id: `kpi-${k.key}`, tituloKey: `kpi.${k.key}`, categoria: 'kpi', defaultSize: 'sm', Component: kpiWidget(k) })),
  { id: 'vagas-status', tituloKey: 'vagasPorStatus.titulo', categoria: 'grafico', defaultSize: 'md', Component: DonutWidget },
  { id: 'destaque', tituloKey: 'destaque.widgetTitulo', categoria: 'destaque', defaultSize: 'md', Component: DestaqueWidget },
  { id: 'contratacoes-mes', tituloKey: 'contratacoesPorMes.titulo', categoria: 'grafico', defaultSize: 'lg', Component: ContratacoesWidget },
  { id: 'funil', tituloKey: 'funil.titulo', categoria: 'grafico', defaultSize: 'sm', Component: FunilWidget },
  { id: 'vagas-recentes', tituloKey: 'vagasRecentes.titulo', categoria: 'lista', defaultSize: 'full', Component: VagasRecentesWidget },
  // ── widgets EXTRAS (planejados): no catálogo, fora do layout padrão ──
  { id: 'origem-candidatos', tituloKey: 'origemCandidatos.titulo', categoria: 'grafico', defaultSize: 'md', Component: OrigemWidget },
  { id: 'tempo-por-etapa', tituloKey: 'tempoPorEtapa.titulo', categoria: 'grafico', defaultSize: 'lg', Component: TempoEtapaWidget },
  { id: 'proximas-entrevistas', tituloKey: 'proximasEntrevistas.titulo', categoria: 'lista', defaultSize: 'md', Component: ProximasEntrevistasWidget },
  { id: 'taxa-aceitacao', tituloKey: 'kpi.taxaAceitacao', categoria: 'kpi', defaultSize: 'sm', Component: kpiWidget(TAXA_ACEITACAO) },
]

export const WIDGETS: Record<string, WidgetDef> = Object.fromEntries(WIDGET_LIST.map((w) => [w.id, w]))

// Layout PADRÃO de fábrica — uma curadoria EXPLÍCITA, menor que o catálogo. Os widgets extras existem em
// WIDGET_LIST mas NÃO aqui, então aparecem no "Adicionar widget" (o catálogo nunca nasce vazio).
const DEFAULT_IDS = ['kpi-vagasAbertas', 'kpi-candidatosFunil', 'kpi-contratacoesMes', 'kpi-tempoMedioFechamento', 'vagas-status', 'destaque', 'contratacoes-mes', 'funil', 'vagas-recentes']
export const DEFAULT_LAYOUT: LayoutItem[] = DEFAULT_IDS.map((id) => ({ id, size: WIDGETS[id].defaultSize }))
