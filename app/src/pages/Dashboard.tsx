/**
 * Dashboard — painel de RECRUTAMENTO (visão geral da operação de vagas). Visual limpo e arejado:
 * saudação, KPIs em cartões suaves, donut + card de destaque, e atividade recente em lista leve.
 * 100% token-driven (zero cor à mão); donut via conic-gradient com tokens; 1 gráfico real (recharts).
 * Demo: dados mockados. `onNavigate` liga os CTAs/menu às demais telas (shell compartilhado).
 */
import type { ComponentType } from 'react'
import { ArrowRight, Briefcase, Clock, Download, Plus, Sparkles, TrendingDown, TrendingUp, UserCheck, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'

import { cn } from '@/lib/utils'
import { CARD } from '@/lib/surfaces'
import { type StatusVaga as Status } from '@/lib/types'
import { AppShell } from '@/components/shell/AppShell'
import { PageContainer, PageHeader, Panel, StatCard, StatusBadge, type BadgeTone } from '@/components/page'
import { Button } from '@/components/ui/button'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

type Dir = 'up' | 'down'
const KPIS: { label: string; valor: string; delta: string; dir: Dir; good: boolean; icon: ComponentType<{ className?: string }> }[] = [
  { label: 'Vagas abertas', valor: '18', delta: '+5', dir: 'up', good: true, icon: Briefcase },
  { label: 'Candidatos no funil', valor: '1.284', delta: '+12%', dir: 'up', good: true, icon: Users },
  { label: 'Contratações no mês', valor: '31', delta: '+6', dir: 'up', good: true, icon: UserCheck },
  { label: 'Tempo médio de fechamento', valor: '27 dias', delta: '−4 dias', dir: 'down', good: true, icon: Clock },
]

const CONTRATACOES = [
  { mes: 'Jan', total: 12 },
  { mes: 'Fev', total: 19 },
  { mes: 'Mar', total: 15 },
  { mes: 'Abr', total: 27 },
  { mes: 'Mai', total: 22 },
  { mes: 'Jun', total: 31 },
]
const chartConfig = { total: { label: 'Contratações', color: 'var(--chart-1)' } } satisfies ChartConfig

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
  return (
    <AppShell active="dashboard" crumb="Dashboard" onNavigate={onNavigate} brand={brand} mode={mode} onCycleBrand={onCycleBrand} onToggleMode={onToggleMode}>
      <PageContainer>
        {/* saudação */}
        <PageHeader
          title={<>Olá, Frank! <span aria-hidden>👋</span></>}
          desc="Aqui está sua operação de recrutamento — junho de 2026"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onNavigate?.('gerador')}><Download aria-hidden /> Exportar</Button>
              <Button onClick={() => onNavigate?.('gerador')}><Plus aria-hidden /> Abrir vaga</Button>
            </div>
          }
        />

        {/* KPIs */}
        <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map(({ label, valor, delta, dir, good, icon: Icon }) => (
            <StatCard
              key={label}
              icon={Icon}
              label={label}
              value={valor}
              delta={
                <p className={cn('mt-1.5 flex items-center gap-1 ty-body-sm', good ? 'text-success-text' : 'text-destructive-text')}>
                  {dir === 'up' ? <TrendingUp className="size-3.5 shrink-0" aria-hidden /> : <TrendingDown className="size-3.5 shrink-0" aria-hidden />}
                  <span className="font-medium tabular-nums">{delta}</span>
                  <span className="text-muted-foreground">vs. mês anterior</span>
                </p>
              }
            />
          ))}
        </section>

        {/* vagas por status (donut) + destaque da semana */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Vagas por status" desc={`${STATUS_TOTAL} vagas no total`}>
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              {/* donut decorativo (a legenda ao lado carrega os números p/ leitor de tela) */}
              <div className="relative size-36 shrink-0" aria-hidden>
                <div className="size-full rounded-full" style={{ background: `conic-gradient(${DONUT_STOPS})` }} />
                <div className="absolute inset-[18px] flex flex-col items-center justify-center rounded-full bg-card">
                  <span className="font-heading text-2xl font-bold tabular-nums text-foreground">{STATUS_TOTAL}</span>
                  <span className="ty-caption text-muted-foreground">vagas</span>
                </div>
              </div>
              <ul className="w-full space-y-2.5">
                {STATUS_DONUT.map((s) => (
                  <li key={s.label} className="flex items-center gap-2.5 ty-body-sm">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.cor }} aria-hidden />
                    <span className="text-foreground">{s.label}</span>
                    <span className="ml-auto tabular-nums text-muted-foreground">{s.value} · {Math.round((s.value / STATUS_TOTAL) * 100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>

          {/* card de destaque — amigável, com CTA */}
          <section className={cn(CARD, 'flex flex-col items-center justify-center bg-primary/[0.04] p-6 text-center sm:p-8')}>
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary-text" aria-hidden><Sparkles className="size-7" /></span>
            <h2 className="mt-4 ty-body-lg text-foreground" style={{ fontWeight: 'var(--font-weight-bold)' }}>Boa semana, Frank! <span aria-hidden>🎉</span></h2>
            <p className="mt-2 max-w-sm ty-body-sm leading-relaxed text-muted-foreground">
              As contratações subiram <span className="font-medium text-success-text">12%</span> no mês e o tempo de fechamento caiu 4 dias. Veja quem está avançando no funil.
            </p>
            <div className="mt-5">
              <Button onClick={() => onNavigate?.('candidatos')}>Ver banco de talentos <ArrowRight aria-hidden /></Button>
            </div>
          </section>
        </div>

        {/* contratações por mês + funil do processo */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="Contratações por mês" desc="Últimos 6 meses" className="lg:col-span-2">
            <ChartContainer config={chartConfig} className="h-[240px] w-full">
              <BarChart accessibilityLayer data={CONTRATACOES}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="total" fill="var(--color-total)" radius={6} />
              </BarChart>
            </ChartContainer>
          </Panel>

          <Panel title="Funil do processo seletivo" desc="Da inscrição à contratação">
            <ol className="space-y-4">
              {FUNIL.map((f, i) => {
                const pct = (f.valor / FUNIL_MAX) * 100
                const conv = i === 0 ? null : Math.round((f.valor / FUNIL[i - 1].valor) * 100)
                return (
                  <li key={f.etapa} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2 ty-body-sm">
                      <span className="font-medium text-foreground">{f.etapa}</span>
                      <span className="flex items-baseline gap-2 tabular-nums">
                        <span className="text-foreground">{f.valor.toLocaleString('pt-BR')}</span>
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
          title="Vagas recentes"
          desc="Últimas aberturas e seu status"
          action={<Button variant="ghost" size="sm" className="text-primary-text hover:bg-primary/10 hover:text-primary-text" onClick={() => onNavigate?.('gerador')}>Ver todas <ArrowRight aria-hidden /></Button>}
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
                    <p className="ty-caption text-muted-foreground">inscritos</p>
                  </div>
                  <StatusBadge value={v.status} tones={STATUS_TONE} className="shrink-0" />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </PageContainer>
    </AppShell>
  )
}
