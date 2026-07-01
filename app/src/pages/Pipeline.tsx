/**
 * Funil de contratação (board) — TODO o fluxo de seleção numa tela só (Kanban). Colunas = etapas; cards =
 * candidatos. Clicar no card abre o PROCESSO completo do candidato (o MESMO stepper "Etapas do processo" da
 * tela de Candidatos): conforme o candidato avança no funil, as etapas anteriores ficam liberadas para o
 * recrutador acompanhar o que já foi feito (passo 1 = a análise da IA). A decisão (aprovar/reprovar) fica no
 * rodapé do detalhe. Nas etapas de entrevista (RH/gestor) o card também mostra o tempo na etapa.
 * Filtros no topo (busca/vaga/etapa); ordenação por coluna (popover). Altura fixa: board rola na horizontal.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowUpDown, CalendarClock, CalendarPlus, Check, ChevronDown, Clock, FileText, Hourglass, Search, Sparkles, Workflow, X } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { iniciais } from '@/lib/format'
import { hashNum } from '@/lib/hash'
import { tintFor } from '@/lib/avatar'
import { AppShell } from '@/components/shell/AppShell'
import { ErrorState, PageHeader, badgeTone } from '@/components/page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useMockData } from '@/lib/useMockData'
import { CARDS_INICIAL, FASE, FASES, aprovar, reprovar, type Card, type FaseId } from './pipeline/data'
import { buildDetalhe } from './EntrevistasIA'
import { AgendarEntrevista, type Evento } from './Entrevistas'
import { EntrevistaFinalizada } from './pipeline/EntrevistaFinalizada'
import { ProcessoDetalhe } from './candidatos/ProcessoDetalhe'
import { mkProcesso } from './candidatos/builders'
import { NIVEIS, type Candidato as CandidatoBanco, type Processo, type StatusProc } from './candidatos/types'

// Faixa de nota 0–100 → tom semântico (verde/âmbar/vermelho). Score na etapa de IA = compatibilidade.
const scoreTint = (s: number) => (s >= 80 ? 'bg-success/10 text-success-text' : s >= 65 ? 'bg-warning/10 text-warning-text' : 'bg-destructive/10 text-destructive-text')

// "Análise feita há N dias" (etapa IA) e "há N dias nesta etapa" (demais): N determinístico por card.
const diasDe = (c: Card) => (Number(c.id.replace(/\D/g, '')) % 14) + 1
const diasNaEtapa = (c: Card) => (Number(c.id.replace(/\D/g, '')) % 9) + 1
const dataDe = (c: Card) => {
  const d = new Date()
  d.setDate(d.getDate() - diasDe(c))
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}
// "dd/mm/aaaa hh:mm" do card → Evento (pré-preenche o formulário de reagendamento). m é 0-indexado.
const eventoDoCard = (c: Card): Evento | undefined => {
  if (!c.agendamento) return undefined
  const [data, hora] = c.agendamento.split(' ')
  const [d, m, y] = data.split('/').map(Number)
  return { y, m: m - 1, d, hora, cand: c.nome, vaga: c.vaga, tipo: 'Online' }
}
const emailDe = (nome: string) =>
  // NFD separa o acento da letra-base; [^a-z\s] tira o acento (e qualquer pontuação) → "José Antônio" = jose.antonio
  `${nome.toLowerCase().normalize('NFD').replace(/[^a-z\s]/g, '').trim().split(/\s+/).join('.')}@email.com`

// ---------- Card do funil → processo seletivo (stepper "Etapas do processo") ----------
// A etapa do funil vira a faseAtual do processo (5 fases: Triagem IA, RH, Teste, Gestor, Proposta). O
// mkProcesso já marca fase<atual=aprovado, =atual=em andamento, >atual=pendente → é o "libera o passo
// anterior conforme avança". senioridade/email/data são sintetizados (mock), estáveis pelo nome.
const nivelDaVaga = (vaga: string) => NIVEIS[hashNum(vaga) % NIVEIS.length] // nível é da VAGA: mesma vaga = mesmo nível p/ todos os candidatos dela
const senioridadeDe = (c: Card) => nivelDaVaga(c.vaga)
const PROC_STATUS: Record<FaseId, StatusProc> = {
  ia: 'Em andamento', rh: 'Em andamento', teste: 'Em andamento', gestor: 'Em andamento', proposta: 'Em andamento',
  contratado: 'Contratado', reprovado: 'Reprovado',
}
const procFaseAtual = (c: Card, h: number): number => {
  switch (c.fase) {
    case 'rh': return 2
    case 'teste': return 3
    case 'gestor': return 4
    case 'proposta': case 'contratado': return 5
    case 'reprovado': return 2 + (h % 3) // caiu numa fase intermediária (não rastreamos qual no funil)
    default: return 1 // ia
  }
}
const candidatoProc = (c: Card): CandidatoBanco => ({
  id: c.id, nome: c.nome, email: emailDe(c.nome), vaga: c.vaga, senioridade: senioridadeDe(c), etapa: 'Em entrevista', score: c.score, atualizado: dataDe(c),
})
const processoDe = (c: Card): Processo => {
  const h = hashNum(c.nome)
  const sen = senioridadeDe(c)
  const ctx = { vaga: c.vaga, senioridade: sen, nome: c.nome }
  const p = mkProcesso(`${c.id}-funil`, `${c.vaga} · ${sen}`, PROC_STATUS[c.fase], procFaseAtual(c, h), dataDe(c), h, ctx)
  // Na etapa de IA a análise já existe (score) → injeta a avaliação COMPLETA da IA no passo 1 (que, "em
  // andamento", não traria por padrão), pra o recrutador ver o que a IA achou já na 1ª etapa.
  if (c.fase === 'ia' && p.fases[0]) {
    p.fases[0] = { ...p.fases[0], detalhe: { ...p.fases[0].detalhe, triagemIA: buildDetalhe({ nome: c.nome, vaga: c.vaga, data: dataDe(c), score: c.score }) } }
  }
  return p
}

// Ordenação dentro de uma coluna: pode COMBINAR critérios (multi-seleção). Duas dimensões — compatibilidade
// (maior×menor) e recência da análise da IA (recente×antiga) — e só um por dimensão fica ativo. Quando há os
// dois, a precedência é FIXA: recência primeiro, compatibilidade como desempate.
const OPCOES_ORDEM = ['compatDesc', 'compatAsc', 'recente', 'antiga'] as const
type OrdemCol = (typeof OPCOES_ORDEM)[number]
const dimOrdem = (o: OrdemCol) => (o === 'compatDesc' || o === 'compatAsc' ? 'compat' : 'recencia')
const cmpOrdem = (o: OrdemCol, a: Card, b: Card) =>
  o === 'compatDesc' ? b.score - a.score
    : o === 'compatAsc' ? a.score - b.score
      : o === 'recente' ? diasDe(a) - diasDe(b)
        : diasDe(b) - diasDe(a) // antiga
const ordenarCards = (cards: Card[], ordens: OrdemCol[]) => {
  const seq = [ordens.find((o) => dimOrdem(o) === 'recencia'), ordens.find((o) => dimOrdem(o) === 'compat')].filter(Boolean) as OrdemCol[]
  return [...cards].sort((a, b) => {
    for (const o of seq) {
      const r = cmpOrdem(o, a, b)
      if (r !== 0) return r
    }
    return 0
  })
}

// Card = informação do candidato. O card INTEIRO é clicável (abre o processo); o nome é um <button> real p/
// teclado, e os botões internos (agendar) param a propagação. IA: compatibilidade + recência da análise;
// demais: tempo na etapa (+ agendar nas etapas de entrevista).
function CardItem({ c, onAbrir, onReagendar }: { c: Card; onAbrir?: (c: Card) => void; onReagendar?: (c: Card) => void }) {
  const { t } = useTranslation('pipeline')
  const interview = FASE[c.fase].gate === 'agendar' // RH / gestor: etapas de entrevista (agendamento inicial é por fora; aqui o RH reagenda)
  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- card clicável p/ mouse; o teclado vai pelo <button> do nome
    <li onClick={() => onAbrir?.(c)} className="group/card cursor-pointer rounded-xl bg-card p-3 shadow-sm ring-1 ring-surface-ring transition-shadow hover:shadow-md hover:ring-primary/30">
      <div className="flex items-start gap-2.5">
        <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full ty-caption font-semibold', tintFor(c.nome))} aria-hidden>{iniciais(c.nome)}</span>
        <div className="min-w-0 flex-1">
          <button type="button" onClick={(e) => { e.stopPropagation(); onAbrir?.(c) }} aria-label={t('acao.verProcesso', { nome: c.nome })} className="block max-w-full truncate rounded-sm text-left ty-body-sm font-semibold text-foreground transition-colors group-hover/card:text-primary-text focus-visible:focus-ring">{c.nome}</button>
          <p className="truncate ty-caption text-muted-foreground">{c.vaga} · {nivelDaVaga(c.vaga)}</p>
        </div>
      </div>
      {/* Compatibilidade — cada etapa é uma análise da IA, então a pílula é consistente em TODAS as colunas. */}
      <p className="mt-2 ty-caption">
        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium', scoreTint(c.score))}>
          <Sparkles className="size-3 shrink-0" aria-hidden /> {c.score}% {t('compatLabel')}
        </span>
      </p>
      {/* O que a IA analisou nesta etapa (currículo → entrevista → teste → …) + recência. */}
      <p className="mt-1 flex items-center gap-1.5 ty-caption font-semibold text-foreground">
        <Clock className="size-3 shrink-0" aria-hidden /> {t('analiseEtapa', { assunto: t(`analise.${c.fase}` as 'analise.ia'), count: diasDe(c) })}
      </p>
      {interview && (
        <div className="mt-2 space-y-1.5">
          <p className="flex items-center gap-1.5 ty-caption text-muted-foreground"><Hourglass className="size-3.5 shrink-0" aria-hidden /> {t('tempoEtapa', { count: diasNaEtapa(c) })}</p>
          {c.agendamento && (
            <>
              <p className="flex items-center gap-1.5 ty-caption font-medium text-foreground"><CalendarClock className="size-3.5 shrink-0 text-primary-text" aria-hidden /> {t('agendadaPara', { quando: c.agendamento })}</p>
              {onReagendar && (
                /* Aviso de implementação (mockup): reagendar ainda precisa ser validado — tooltip vermelho no hover/foco. */
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onReagendar(c) }} className="h-8 w-full gap-1.5 ty-caption"><CalendarPlus className="size-3.5 shrink-0" aria-hidden /> {t('reagendar')}</Button>
                  </TooltipTrigger>
                  <TooltipContent tone="destructive" className="max-w-xs text-center">{t('reagendarAviso')}</TooltipContent>
                </Tooltip>
              )}
            </>
          )}
        </div>
      )}
    </li>
  )
}

// Ordenação POR COLUNA numa modal flutuante (popover). Multi-seleção: checkboxes que dá pra COMBINAR (um por
// dimensão; marcar o oposto troca). Portado (não é cortado pelo overflow) e fica ABERTO durante a seleção.
function ColunaSort({ ordens, onToggle, label }: { ordens: OrdemCol[]; onToggle: (o: OrdemCol) => void; label: string }) {
  const { t } = useTranslation('pipeline')
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={t('ordenar.aria', { fase: label })} className="text-muted-foreground hover:text-foreground">
          <ArrowUpDown className="size-4" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-1">
        <p className="px-2 py-1.5 ty-caption font-semibold tracking-wide text-muted-foreground uppercase">{t('ordenar.titulo')}</p>
        {OPCOES_ORDEM.map((o, i) => {
          const ativo = ordens.includes(o)
          return (
            <div key={o}>
              {i === 2 && <div className="mx-2 my-1 border-t border-border/50" />}
              <button
                type="button" role="checkbox" aria-checked={ativo} onClick={() => onToggle(o)}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left ty-body-sm text-foreground transition-colors hover:bg-muted focus-visible:focus-ring"
              >
                <span className={cn('flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors', ativo ? 'border-primary bg-primary text-primary-foreground' : 'border-input')} aria-hidden>
                  {ativo && <Check className="size-3" />}
                </span>
                <span className="flex-1">{t(`ordenar.${o}` as 'ordenar.compatDesc')}</span>
              </button>
            </div>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}

// Coluna do board: cabeçalho (rótulo + contagem + ordenar) fixo + lista de cards que ROLA na vertical.
function Coluna({ fase, cards, onAbrir, onReagendar }: { fase: (typeof FASES)[number]; cards: Card[]; onAbrir?: (c: Card) => void; onReagendar?: (c: Card) => void }) {
  const { t } = useTranslation('pipeline')
  const [ordens, setOrdens] = useState<OrdemCol[]>(['compatDesc'])
  // Alterna um critério; ao marcar, tira o oposto da MESMA dimensão (só um maior/menor, um recente/antiga).
  const toggleOrdem = (o: OrdemCol) =>
    setOrdens((cur) => (cur.includes(o) ? cur.filter((x) => x !== o) : [...cur.filter((x) => dimOrdem(x) !== dimOrdem(o)), o]))
  const label = t(`fase.${fase.id}` as 'fase.ia')
  const ordenados = ordenarCards(cards, ordens)
  return (
    <section aria-label={t('contagem', { n: cards.length, fase: label })} className="flex w-72 shrink-0 flex-col overflow-hidden rounded-2xl bg-muted/30 ring-1 ring-surface-ring">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border/50 p-3 pr-2">
        <h2 className="truncate ty-body-sm font-semibold text-foreground">{label}</h2>
        <div className="flex shrink-0 items-center gap-1">
          <span className={cn('inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 ty-caption font-semibold tabular-nums', badgeTone[fase.tone])}>{cards.length}</span>
          <ColunaSort ordens={ordens} onToggle={toggleOrdem} label={label} />
        </div>
      </header>
      {cards.length === 0 ? (
        <p className="px-3 py-8 text-center ty-caption text-muted-foreground">{t('vazio')}</p>
      ) : (
        <ul className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-2.5">{ordenados.map((c) => <CardItem key={c.id} c={c} onAbrir={onAbrir} onReagendar={onReagendar} />)}</ul>
      )}
    </section>
  )
}

// Filtro de ETAPA em multi-seleção (popover com checkboxes) — vazio = todas as colunas; com seleção, só as
// marcadas aparecem. Tem um "Limpar etapas" no rodapé do popover quando há algo marcado.
function EtapaFiltro({ etapas, onToggle, onLimpar }: { etapas: FaseId[]; onToggle: (id: FaseId) => void; onLimpar: () => void }) {
  const { t } = useTranslation('pipeline')
  const [open, setOpen] = useState(false)
  const label = etapas.length === 0 ? t('filtro.todasEtapas') : t('filtro.nEtapas', { count: etapas.length })
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" aria-label={t('filtro.etapaAria')} className="h-[var(--button-height-md)] w-auto min-w-[9rem] justify-between gap-2 font-normal">
          <span className="truncate">{label}</span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-1">
        {FASES.map((f) => {
          const ativo = etapas.includes(f.id)
          return (
            <button
              key={f.id} type="button" role="checkbox" aria-checked={ativo} onClick={() => onToggle(f.id)}
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left ty-body-sm text-foreground transition-colors hover:bg-muted focus-visible:focus-ring"
            >
              <span className={cn('flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors', ativo ? 'border-primary bg-primary text-primary-foreground' : 'border-input')} aria-hidden>
                {ativo && <Check className="size-3" />}
              </span>
              <span className="flex-1">{t(`fase.${f.id}` as 'fase.ia')}</span>
            </button>
          )
        })}
        {etapas.length > 0 && (
          <>
            <div className="mx-2 my-1 border-t border-border/50" />
            <button type="button" onClick={onLimpar} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left ty-body-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:focus-ring">
              <X className="size-3.5 shrink-0" aria-hidden /> {t('filtro.limparEtapas')}
            </button>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

// Barra de filtros do board: busca (nome/vaga) + Vaga + Nível (da vaga) + Etapa (multi). Tudo no tamanho de
// controle padrão do DS (--button-height-md = 40px). "Limpar filtros" some quando nada ativo.
function Filtros({ busca, onBusca, vaga, onVaga, vagas, nivel, onNivel, niveis, etapas, onToggleEtapa, onLimparEtapas, ativos, onLimpar }: {
  busca: string; onBusca: (v: string) => void
  vaga: string; onVaga: (v: string) => void; vagas: string[]
  nivel: string; onNivel: (v: string) => void; niveis: string[]
  etapas: FaseId[]; onToggleEtapa: (id: FaseId) => void; onLimparEtapas: () => void
  ativos: boolean; onLimpar: () => void
}) {
  const { t } = useTranslation('pipeline')
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 px-5 pb-4 lg:px-8">
      <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input value={busca} onChange={(e) => onBusca(e.target.value)} placeholder={t('filtro.buscar')} aria-label={t('filtro.buscarAria')} className="h-[var(--button-height-md)] pl-8 ty-body-sm font-normal" />
      </div>
      <Select value={vaga} onValueChange={onVaga}>
        <SelectTrigger aria-label={t('filtro.vagaAria')} className="h-[var(--button-height-md)] w-auto min-w-[9rem] font-normal"><SelectValue>{vaga === 'todas' ? t('filtro.todasVagas') : vaga}</SelectValue></SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">{t('filtro.todasVagas')}</SelectItem>
          {vagas.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={nivel} onValueChange={onNivel}>
        <SelectTrigger aria-label={t('filtro.nivelAria')} className="h-[var(--button-height-md)] w-auto min-w-[9rem] font-normal"><SelectValue>{nivel === 'todos' ? t('filtro.todosNiveis') : nivel}</SelectValue></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">{t('filtro.todosNiveis')}</SelectItem>
          {niveis.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
        </SelectContent>
      </Select>
      <EtapaFiltro etapas={etapas} onToggle={onToggleEtapa} onLimpar={onLimparEtapas} />
      {ativos && <Button variant="ghost" onClick={onLimpar} className="h-[var(--button-height-md)] gap-1.5"><X className="size-4" aria-hidden /> {t('filtro.limpar')}</Button>}
    </div>
  )
}

// Ações de decisão no rodapé do detalhe (processo). Etapas de ENTREVISTA (RH/gestor, gate 'agendar'): um
// botão "Entrevista finalizada" abre a modal de notas/upload + nova análise da IA (a decisão sai de lá).
// Demais etapas ativas: aprovar / reprovar direto. Terminais (contratado/reprovado) não têm ação.
type ToastKind = 'aprovar' | 'reprovado'
function Decisao({ c, onDecidir, onFinalizar }: { c: Card; onDecidir: (mover: (x: Card) => Card, kind: ToastKind) => void; onFinalizar: (c: Card) => void }) {
  const { t } = useTranslation('pipeline')
  const f = FASE[c.fase]
  if (f.gate === 'final') return null // contratado / reprovado — terminais
  if (f.gate === 'agendar') return <Button onClick={() => onFinalizar(c)}><Sparkles aria-hidden /> {t('finalizar.botao')}</Button>
  return (
    <>
      <Button variant="destructive-outline" onClick={() => onDecidir(reprovar, 'reprovado')}><X aria-hidden /> {t('decisao.reprovar')}</Button>
      <Button onClick={() => onDecidir(aprovar, 'aprovar')}><Check aria-hidden /> {t('decisao.aprovar')}</Button>
    </>
  )
}

export function Pipeline({ onNavigate, brand, mode, onCycleBrand, onToggleMode }: {
  onNavigate: (v: string) => void; brand?: string; mode?: string; onCycleBrand?: () => void; onToggleMode?: () => void
}) {
  const { t } = useTranslation('pipeline')
  const { t: te } = useTranslation('entrevistas') // títulos sr-only do Sheet de reagendamento (reusados)
  const { data: cards, setData, loading, error, retry } = useMockData<Card[]>('pipeline', () => CARDS_INICIAL, [])
  const [vendo, setVendo] = useState<Card | null>(null) // candidato aberto no processo (stepper)
  const [reagendando, setReagendando] = useState<Card | null>(null) // candidato no Sheet de reagendar entrevista
  const [finalizando, setFinalizando] = useState<Card | null>(null) // candidato no Sheet "Entrevista finalizada"
  const [busca, setBusca] = useState('')
  const [vaga, setVaga] = useState('todas')
  const [nivel, setNivel] = useState('todos')
  const [etapas, setEtapas] = useState<FaseId[]>([])

  // Decisão tomada no rodapé do processo → move o card no funil e volta para o board.
  const decidir = (mover: (x: Card) => Card, kind: ToastKind) => {
    if (!vendo) return
    const n = mover(vendo)
    setData((cs) => cs.map((x) => (x.id === n.id ? n : x)))
    if (kind === 'aprovar') {
      if (n.fase === 'contratado') toast.success(t('toast.contratado', { nome: vendo.nome }))
      else toast.success(t('toast.avancou', { nome: vendo.nome, fase: t(`fase.${n.fase}` as 'fase.ia') }))
    } else toast(t('toast.reprovado', { nome: vendo.nome }))
    setVendo(null)
  }

  // Reagendar (Sheet, ação do RH) → atualiza a data/hora da entrevista do card. Evento.m é 0-indexado.
  const confirmarReagendamento = (ev: Evento) => {
    if (!reagendando) return
    const quando = `${String(ev.d).padStart(2, '0')}/${String(ev.m + 1).padStart(2, '0')}/${ev.y} ${ev.hora}`
    setData((cs) => cs.map((x) => (x.id === reagendando.id ? { ...x, agendamento: quando } : x)))
    toast.success(t('toast.reagendada', { nome: reagendando.nome, quando }))
    setReagendando(null)
  }

  // Clicar no menu fecha o processo antes de navegar (mesmo padrão da tela de Entrevistas IA).
  const handleNav = (v: string) => { setVendo(null); onNavigate(v) }
  const crumb = vendo ? vendo.nome : t('header.titulo')

  // ---- filtros (puros). A ordenação NÃO mora aqui: é por coluna (ver Coluna/ColunaSort). ----
  const vagas = Array.from(new Set(cards.map((c) => c.vaga))).sort((a, b) => a.localeCompare(b))
  const niveis = NIVEIS.filter((n) => cards.some((c) => nivelDaVaga(c.vaga) === n)) // só os níveis presentes, na ordem da escala
  const q = busca.trim().toLowerCase()
  const passa = (c: Card) =>
    (q === '' || c.nome.toLowerCase().includes(q) || c.vaga.toLowerCase().includes(q)) &&
    (vaga === 'todas' || c.vaga === vaga) && (nivel === 'todos' || nivelDaVaga(c.vaga) === nivel)
  const visiveis = cards.filter(passa)
  const fasesVisiveis = etapas.length === 0 ? FASES : FASES.filter((f) => etapas.includes(f.id))
  const ativos = q !== '' || vaga !== 'todas' || nivel !== 'todos' || etapas.length > 0
  const toggleEtapa = (id: FaseId) => setEtapas((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  const limpar = () => { setBusca(''); setVaga('todas'); setNivel('todos'); setEtapas([]) }

  return (
    <AppShell active="pipeline" crumb={crumb} onNavigate={handleNav} brand={brand} mode={mode} onCycleBrand={onCycleBrand} onToggleMode={onToggleMode}>
      {vendo ? (
        // Processo completo do candidato (stepper "Etapas do processo") — o MESMO da tela de Candidatos.
        // faseAtual = etapa no funil → os passos anteriores ficam liberados. Decisão no rodapé (acoes).
        <ProcessoDetalhe
          c={candidatoProc(vendo)}
          p={processoDe(vendo)}
          onVoltar={() => setVendo(null)}
          acoesInicio={<Button variant="secondary-soft" onClick={() => toast.info(t('toast.curriculo'))}><FileText aria-hidden /> {t('verCurriculo')}</Button>}
          acoes={<Decisao c={vendo} onDecidir={decidir} onFinalizar={(c) => setFinalizando(c)} />}
        />
      ) : (
        // h-full (não min-h-full): a página ocupa EXATAMENTE a tela — nada de rolagem vertical na página.
        <div className="flex h-full flex-col">
          {/* Header canônico (PageHeader) dentro do layout full-height próprio do kanban (h-full, sem
              PageContainer, que adicionaria padding/scroll vertical incompatível com o board). */}
          <div className="shrink-0 px-5 pt-6 pb-4 lg:px-8">
            <PageHeader icon={Workflow} title={t('header.titulo')} desc={t('header.descricao')} />
            {!loading && !error && (
              <p className="mt-1 ty-caption tabular-nums text-muted-foreground">
                {ativos ? t('resultado', { n: visiveis.length, total: cards.length }) : t('total', { n: cards.length })}
              </p>
            )}
          </div>

          {!loading && !error && (
            <Filtros
              busca={busca} onBusca={setBusca}
              vaga={vaga} onVaga={setVaga} vagas={vagas}
              nivel={nivel} onNivel={setNivel} niveis={niveis}
              etapas={etapas} onToggleEtapa={toggleEtapa} onLimparEtapas={() => setEtapas([])}
              ativos={ativos} onLimpar={limpar}
            />
          )}

          {loading ? (
            <div className="grid flex-1 place-items-center py-20" role="status" aria-label={t('carregando')}><Spinner className="size-6" /></div>
          ) : error ? (
            <div className="px-5 lg:px-8"><ErrorState onRetry={retry} /></div>
          ) : (
            // Board = a própria linha de colunas E o container de rolagem HORIZONTAL (ver todas as colunas).
            // min-h-0 mantém a altura presa. tabIndex+role=group: rolável e focável pelo teclado (WCAG 2.1.1).
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- região rolável precisa ser focável
            <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto px-5 pb-8 lg:px-8" tabIndex={0} role="group" aria-label={t('boardAria')}>
              {fasesVisiveis.map((f) => <Coluna key={f.id} fase={f} cards={visiveis.filter((c) => c.fase === f.id)} onAbrir={(c) => setVendo(c)} onReagendar={(c) => setReagendando(c)} />)}
            </div>
          )}
        </div>
      )}

      {/* Sheet de reagendamento (ação do RH) — o MESMO formulário da tela de Entrevistas, pré-preenchido. */}
      <Sheet open={!!reagendando} onOpenChange={(aberto) => { if (!aberto) setReagendando(null) }}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
          {reagendando && (
            <>
              <SheetTitle className="sr-only">{te('sheet.tituloReagendar', { cand: reagendando.nome })}</SheetTitle>
              <SheetDescription className="sr-only">{te('sheet.descAgendar')}</SheetDescription>
              <AgendarEntrevista cand={reagendando.nome} vaga={reagendando.vaga} inicial={eventoDoCard(reagendando)} onCancelar={() => setReagendando(null)} onConfirmar={confirmarReagendamento} />
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Sheet "Entrevista finalizada" — notas/upload da reunião + nova análise da IA → decisão. */}
      <Sheet open={!!finalizando} onOpenChange={(aberto) => { if (!aberto) setFinalizando(null) }}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-xl">
          {finalizando && (
            <>
              <SheetTitle className="sr-only">{t('finalizar.titulo', { nome: finalizando.nome })}</SheetTitle>
              <SheetDescription className="sr-only">{t('finalizar.desc')}</SheetDescription>
              <EntrevistaFinalizada
                card={finalizando}
                onCancelar={() => setFinalizando(null)}
                onAprovar={() => { decidir(aprovar, 'aprovar'); setFinalizando(null) }}
                onReprovar={() => { decidir(reprovar, 'reprovado'); setFinalizando(null) }}
              />
            </>
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  )
}
