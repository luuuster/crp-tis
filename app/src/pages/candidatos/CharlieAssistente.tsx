/**
 * Charlie — copiloto de match: o recrutador diz a vaga (e, opcional, o contexto) e o painel ranqueia
 * o banco por aderência. MatchCard é o cartão de candidato sugerido, privado deste arquivo.
 */
import { useState } from 'react'
import { ChevronRight, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { CARD } from '@/lib/surfaces'
import { iniciais } from '@/lib/format'
import { tintFor } from '@/lib/avatar'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { charlieRank, type Candidato, type Match } from '../candidatos.logic'
import { SEN_OPCOES } from './types'
import { EtapaBadge, notaBar, useSenioridadeLabel } from './styles'

// Cartão de um candidato sugerido pelo Charlie (dentro do painel lateral).
function MatchCard({ m, onVerPerfil }: { m: Match; onVerPerfil: () => void }) {
  const { t } = useTranslation('candidatos')
  const senLabel = useSenioridadeLabel()
  const { c } = m
  return (
    <div className={cn(CARD, 'p-4')}>
      <div className="flex items-start gap-3">
        <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full ty-body-sm font-semibold', tintFor(c.nome))} aria-hidden>{iniciais(c.nome)}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate ty-body-sm font-semibold text-foreground">{c.nome}</p>
            <span className="shrink-0 ty-body-sm font-bold tabular-nums text-primary-text">{m.pct}%</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <EtapaBadge value={c.etapa} />
            <span className="truncate ty-caption text-muted-foreground">{c.vaga} · {senLabel(c.senioridade)}</span>
          </div>
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className={cn('h-full rounded-full motion-safe:transition-all motion-safe:duration-500', notaBar(m.pct))} style={{ width: `${m.pct}%` }} />
      </div>
      <p className="mt-2.5 ty-caption leading-relaxed text-muted-foreground">{m.motivo}</p>
      {m.skills.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {m.skills.slice(0, 4).map((s) => (
            <span key={s} className="rounded-md bg-primary/10 px-2 py-0.5 ty-caption font-medium text-primary-text">{s}</span>
          ))}
          {m.skills.length > 4 && <span className="rounded-md bg-muted px-2 py-0.5 ty-caption font-medium text-muted-foreground">+{m.skills.length - 4}</span>}
        </div>
      )}
      <Button variant="outline" size="sm" className="mt-3 w-full" onClick={onVerPerfil}>{t('charlie.verPerfil')} <ChevronRight aria-hidden /></Button>
    </div>
  )
}

// Painel lateral do Charlie: recrutador diz a vaga (e, opcional, o contexto) → top aderências do banco.
export function CharlieAssistente({ cands, vagas, onVerPerfil }: { cands: Candidato[]; vagas: string[]; onVerPerfil: (c: Candidato) => void }) {
  const { t } = useTranslation('candidatos')
  const senLabel = useSenioridadeLabel()
  const [vaga, setVaga] = useState(vagas[0] ?? '')
  const [sen, setSen] = useState('Qualquer')
  const [ctx, setCtx] = useState('')
  const matches = charlieRank(vaga, sen, ctx, cands).slice(0, 6)
  const topPct = matches[0]?.pct ?? 0
  const fala =
    topPct >= 75 ? t('charlie.fala.alta', { vaga, nome: matches[0].c.nome, pct: topPct })
      : topPct >= 50 ? t('charlie.fala.media', { vaga })
        : t('charlie.fala.baixa', { vaga })

  return (
    <>
      {/* cabeçalho — persona do Charlie (mesmo padrão do Gerador de Vagas) */}
      <header className="flex items-center gap-3 border-b border-border/50 p-5 pr-12">
        <span className="relative inline-flex shrink-0" aria-hidden>
          <span className="flex size-11 items-center justify-center rounded-full bg-secondary font-heading text-base font-bold text-secondary-foreground">C</span>
          <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-background bg-success" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="ty-body font-semibold text-foreground">Charlie</p>
          <p className="flex items-center gap-1.5 ty-caption font-medium text-muted-foreground"><span className="size-1.5 rounded-full bg-success" aria-hidden /> {t('charlie.copiloto')} · <span className="text-success-text">{t('charlie.ativo')}</span></p>
        </div>
      </header>

      {/* corpo rolável */}
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <p className="ty-body-sm text-muted-foreground">{t('charlie.intro')}</p>
        {/* o que o recrutador quer */}
        <div className="space-y-4 rounded-xl bg-muted/30 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="charlie-vaga">{t('charlie.vagaLabel')}</Label>
            <Select value={vaga} onValueChange={setVaga}>
              <SelectTrigger id="charlie-vaga" className="w-full bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>{vagas.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="charlie-sen">{t('charlie.senLabel')}</Label>
            <Select value={sen} onValueChange={setSen}>
              <SelectTrigger id="charlie-sen" className="w-full bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>{SEN_OPCOES.map((s) => <SelectItem key={s} value={s}>{senLabel(s)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="charlie-ctx">{t('charlie.ctxLabel')} <span className="font-normal text-muted-foreground">{t('charlie.opcional')}</span></Label>
            <Textarea id="charlie-ctx" rows={2} value={ctx} onChange={(e) => setCtx(e.target.value)} placeholder={t('charlie.ctxPlaceholder')} className="bg-card" />
          </div>
        </div>

        {/* resultado do Charlie */}
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="ty-caption font-semibold tracking-wide text-foreground uppercase">{t('charlie.melhores')}</p>
            <span className="ty-caption text-muted-foreground tabular-nums">{t('charlie.contador', { mostrados: matches.length, total: cands.length })}</span>
          </div>
          {/* fala do Charlie — muda conforme a melhor aderência */}
          <p className="mt-2 flex gap-2 rounded-lg bg-secondary/10 p-3 ty-caption leading-relaxed text-foreground">
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-secondary-text" aria-hidden />
            <span>{fala}</span>
          </p>

          {/* a lista refaz a animação ao trocar de vaga/senioridade (escolha discreta), não a cada tecla */}
          <div key={`${vaga}|${sen}`} className="mt-3 space-y-3 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300">
            {matches.map((m) => <MatchCard key={m.c.id} m={m} onVerPerfil={() => onVerPerfil(m.c)} />)}
          </div>
        </div>
      </div>

      {/* rodapé */}
      <footer className="border-t border-border/40 p-4">
        <p className="ty-caption text-muted-foreground">{t('charlie.rodape')}</p>
      </footer>
    </>
  )
}
