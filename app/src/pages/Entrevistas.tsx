/**
 * Entrevistas — calendário mensal + próximas entrevistas + candidatos aguardando agendamento.
 * Clicar em "Agendar" abre a TELA DE AGENDAMENTO (formulário); clicar numa entrevista (lista ou chip do
 * calendário) abre o DETALHE do agendamento. Agendar/cancelar/reagendar mexem no estado (fila ↔ próximas).
 * Reconstruído no DS (AppShell, CARD, .ty-*, tokens) — nada de cor/borda à mão. Demo: dados mockados.
 */
import { useState, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CalendarCheck, CalendarDays, CalendarOff, CalendarPlus, CalendarX2, Check, ChevronLeft, ChevronRight, Clock, Inbox,
  Link2, MapPin, Pencil, Search, User, Users, Video,
} from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { CARD } from '@/lib/surfaces'
import { iniciais } from '@/lib/format'
import { usePagination } from '@/lib/usePagination'
import { dataLonga, dataMedia, mesAbrev, mesLongo, semanaCurta } from '@/lib/datetime'
import { AppShell } from '@/components/shell/AppShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DatePicker } from '@/components/ui/date-picker'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PageContainer, PageHeader, Panel, Paginacao } from '@/components/page'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ENTREVISTADORES, DURACOES, WORK_SLOTS, ocupado, slotLivre, temHorarioLivre, proximaDataLivre, painelDe, duracaoDe, linkDe } from './entrevistas.logic'

const ANOS = [2025, 2026, 2027]
// Nomes de mês/semana/data por LOCALE vêm de @/lib/datetime (Intl) — pt-BR sai idêntico ao legado.

type Tipo = 'Online' | 'Presencial'
export type Evento = { y: number; m: number; d: number; hora: string; cand: string; vaga: string; tipo: Tipo; entrevistadores?: string[] }
type Fila = { cand: string; vaga: string; desde: string }
// m = índice 0-11 (5 = junho). Eventos do mês corrente da demo (junho/2026).
const EVENTOS: Evento[] = [
  { y: 2026, m: 5, d: 16, hora: '09:00', cand: 'João Pereira', vaga: 'Desenvolvedor Backend', tipo: 'Online' },
  { y: 2026, m: 5, d: 16, hora: '14:00', cand: 'Marina Alves', vaga: 'UX Designer III', tipo: 'Presencial' },
  { y: 2026, m: 5, d: 18, hora: '08:30', cand: 'Marcos Vieira', vaga: 'Desenvolvedor Backend', tipo: 'Online' },
  { y: 2026, m: 5, d: 18, hora: '10:30', cand: 'Caio Rocha', vaga: 'Product Manager', tipo: 'Online' },
  { y: 2026, m: 5, d: 18, hora: '11:30', cand: 'Carla Nunes', vaga: 'UX Designer III', tipo: 'Presencial' },
  { y: 2026, m: 5, d: 18, hora: '13:30', cand: 'Otávio Pinto', vaga: 'Analista de QA', tipo: 'Online' },
  { y: 2026, m: 5, d: 18, hora: '16:00', cand: 'Helena Castro', vaga: 'Tech Lead Frontend', tipo: 'Online' },
  { y: 2026, m: 5, d: 18, hora: '17:00', cand: 'Renata Lopes', vaga: 'Cientista de Dados', tipo: 'Online' },
  { y: 2026, m: 5, d: 23, hora: '15:00', cand: 'Ana Souza', vaga: 'Analista de QA', tipo: 'Online' },
  { y: 2026, m: 5, d: 25, hora: '11:00', cand: 'Bruno Lima', vaga: 'Engenheiro de Dados', tipo: 'Presencial' },
  { y: 2026, m: 5, d: 26, hora: '16:30', cand: 'Paula Dias', vaga: 'Desenvolvedor Full Stack', tipo: 'Online' },
  { y: 2026, m: 5, d: 12, hora: '08:30', cand: 'Rafael Tavares', vaga: 'DevOps Engineer', tipo: 'Online' },
  { y: 2026, m: 5, d: 15, hora: '10:00', cand: 'Letícia Gomes', vaga: 'Cientista de Dados', tipo: 'Online' },
  { y: 2026, m: 5, d: 17, hora: '11:30', cand: 'Pedro Antunes', vaga: 'Scrum Master', tipo: 'Presencial' },
  { y: 2026, m: 5, d: 19, hora: '09:30', cand: 'Sofia Martins', vaga: 'Desenvolvedor Mobile', tipo: 'Online' },
  { y: 2026, m: 5, d: 22, hora: '14:30', cand: 'Gabriel Costa', vaga: 'Analista de Marketing', tipo: 'Presencial' },
  { y: 2026, m: 5, d: 24, hora: '10:00', cand: 'Juliana Reis', vaga: 'Product Manager', tipo: 'Online' },
  { y: 2026, m: 5, d: 29, hora: '15:30', cand: 'Thiago Barros', vaga: 'Arquiteto de Software', tipo: 'Online' },
]

const AGUARDANDO: Fila[] = [
  { cand: 'Rafael Tavares', vaga: 'DevOps Engineer', desde: 'há 2 dias' },
  { cand: 'Letícia Gomes', vaga: 'Cientista de Dados', desde: 'há 3 dias' },
  { cand: 'Pedro Antunes', vaga: 'Scrum Master', desde: 'há 5 dias' },
]
const PER_PAGE = 10

const fmtData = (ev: Evento) => dataLonga(ev.y, ev.m, ev.d)
const paraInput = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
// 'yyyy-MM-dd' → 'dd/MM/yyyy' p/ exibição (mesmo formato que o usuário vê no campo de data).
const fmtBR = (iso: string) => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}` }

// Cartão de seção (mesma superfície/cabeçalho do resto do app).
// Pílula de evento dentro de uma célula do calendário — clicável (abre o detalhe).
function EventoChip({ ev, onOpen }: { ev: Evento; onOpen: (ev: Evento) => void }) {
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => onOpen(ev)}
          className="flex w-full items-center gap-1 truncate rounded-md bg-primary/10 px-1.5 py-1 text-left ty-caption font-medium text-primary-text transition-colors hover:bg-primary/15 focus-visible:focus-ring"
        >
          <span className="tabular-nums">{ev.hora}</span>
          <span className="truncate text-foreground">{ev.cand}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent>{`${ev.hora} · ${ev.cand}, ${ev.vaga}`}</TooltipContent>
    </Tooltip>
  )
}

// Linha rica de agendamento (avatar + nome + vaga + horário/formato) — mesmo padrão das "Próximas
// entrevistas", usada DENTRO da modal do dia (onde há espaço p/ a versão completa, não o chip da célula).
function EventoLinhaDia({ ev, onOpen }: { ev: Evento; onOpen: (ev: Evento) => void }) {
  const { t } = useTranslation('entrevistas')
  return (
    <button
      type="button"
      onClick={() => onOpen(ev)}
      className="flex w-full items-center gap-3 rounded-xl bg-muted/30 p-3 text-left transition-colors hover:bg-muted/50 focus-visible:focus-ring"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 ty-body-sm font-semibold text-primary-text" aria-hidden>{iniciais(ev.cand)}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate ty-body-sm font-medium text-foreground">{ev.cand}</p>
        <p className="truncate ty-caption text-muted-foreground">{ev.vaga}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="flex items-center gap-1 ty-body-sm font-medium tabular-nums text-foreground"><Clock className="size-3.5 text-muted-foreground" aria-hidden /> {ev.hora}</span>
        <span className="flex items-center gap-1 ty-caption text-muted-foreground">
          {ev.tipo === 'Online' ? <Video className="size-3" aria-hidden /> : <MapPin className="size-3" aria-hidden />} {t(`formato.${ev.tipo}`)}
        </span>
      </div>
    </button>
  )
}

// Dia com mais de 2 eventos: "+N mais" abre um MODAL com TODOS os agendamentos do dia (ordenados por
// horário, cada um clicável → abre o detalhe). Fecha o modal e abre o detalhe no próximo tick p/ não
// empilhar 2 modais (evita o race de pointer-events do Radix).
function MaisDoDia({ titulo, evs, onOpen }: { titulo: string; evs: Evento[]; onOpen: (ev: Evento) => void }) {
  const { t } = useTranslation('entrevistas')
  const [open, setOpen] = useState(false)
  const ordenados = [...evs].sort((a, b) => a.hora.localeCompare(b.hora))
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className="flex w-full items-center justify-center rounded-md bg-primary/15 px-1.5 py-1 ty-caption font-semibold text-primary-text ring-1 ring-primary/25 transition-colors hover:bg-primary/25 focus-visible:focus-ring">
          {t('dia.mais', { n: evs.length - 2 })}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 text-left">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary-text" aria-hidden><CalendarDays className="size-5" /></span>
            <div className="min-w-0">
              <DialogTitle className="truncate">{titulo}</DialogTitle>
              <DialogDescription>{t('dia.agendadas', { count: evs.length })}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <ul className="-mx-1 max-h-[60vh] space-y-2 overflow-y-auto px-1 py-0.5">
          {ordenados.map((ev, k) => (
            <li key={k}>
              <EventoLinhaDia ev={ev} onOpen={(e) => { setOpen(false); setTimeout(() => onOpen(e), 0) }} />
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}

// Item de informação (ícone + rótulo + valor) usado no detalhe do agendamento.
function InfoItem({ icon: Icon, label, valor }: { icon: ComponentType<{ className?: string }>; label: string; valor: string }) {
  return (
    <div className="flex gap-3 rounded-lg bg-muted/30 p-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <p className="ty-caption text-muted-foreground">{label}</p>
        <p className="mt-0.5 break-words ty-body-sm font-medium text-foreground">{valor}</p>
      </div>
    </div>
  )
}

/* ───────────────────────── detalhe do agendamento (painel lateral) ───────────────────────── */

export function AgendamentoDetalhe({ ev, onReagendar, onCancelar }: {
  ev: Evento; onReagendar: () => void; onCancelar: () => void
}) {
  const { t } = useTranslation('entrevistas')
  const { t: tc } = useTranslation('common')
  const online = ev.tipo === 'Online'
  const intvs = ev.entrevistadores?.length ? ev.entrevistadores : painelDe(ev)
  return (
    <>
      {/* cabeçalho */}
      <header className="flex items-start gap-3 border-b border-border/50 p-5 pr-12">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 font-heading text-base font-bold text-primary-text" aria-hidden>{iniciais(ev.cand)}</span>
        <div className="min-w-0">
          <p className="ty-overline text-muted-foreground">{t('detalhe.overline')}</p>
          <h2 className="truncate font-heading text-xl font-bold tracking-tight text-foreground">{ev.cand}</h2>
          <p className="truncate ty-body-sm text-muted-foreground">{ev.vaga}</p>
          <span className="mt-2 inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 ty-caption font-medium text-primary-text">{t('detalhe.statusAgendada')}</span>
        </div>
      </header>

      {/* detalhes (rolável) */}
      <div className="flex-1 overflow-y-auto p-5">
        <p className="ty-caption font-semibold tracking-wide text-foreground uppercase">{t('detalhe.secaoDetalhes')}</p>
        <div className="mt-3 space-y-2.5">
          <InfoItem icon={CalendarDays} label={t('detalhe.data')} valor={fmtData(ev)} />
          <InfoItem icon={Clock} label={t('detalhe.horario')} valor={`${ev.hora} · ${duracaoDe(ev)}`} />
          <InfoItem icon={online ? Video : MapPin} label={t('detalhe.formato')} valor={online ? t('detalhe.online') : t('detalhe.presencial')} />
          {/* Entrevistadores: cada um em sua própria linha (nome + papel), legível com vários no painel. */}
          <div className="flex gap-3 rounded-lg bg-muted/30 p-3">
            {intvs.length > 1
              ? <Users className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              : <User className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />}
            <div className="min-w-0">
              <p className="ty-caption text-muted-foreground">{intvs.length > 1 ? t('detalhe.entrevistadores', { n: intvs.length }) : t('detalhe.entrevistador')}</p>
              <ul className="mt-1 space-y-1">
                {intvs.map((p) => {
                  const [nome, papel] = p.split(' · ')
                  return (
                    <li key={p} className="break-words ty-body-sm text-foreground">
                      <span className="font-medium">{nome}</span>
                      {papel && <span className="text-muted-foreground"> · {papel}</span>}
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
          <InfoItem icon={online ? Link2 : MapPin} label={online ? t('detalhe.linkReuniao') : t('detalhe.local')} valor={online ? linkDe(ev) : t('detalhe.localValor')} />
          <InfoItem icon={CalendarCheck} label={t('detalhe.etapa')} valor={t('detalhe.etapaValor')} />
        </div>
      </div>

      {/* rodapé */}
      <footer className="space-y-2 border-t border-border/40 p-4">
        <Button className="w-full" onClick={() => (online ? toast.success(t('detalhe.toastEntrando')) : toast.info(t('detalhe.toastLocalCopiado')))}>
          {online ? <><Video aria-hidden /> {t('detalhe.entrarChamada')}</> : <><MapPin aria-hidden /> {t('detalhe.verLocal')}</>}
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={onReagendar}><Pencil aria-hidden /> {t('detalhe.reagendar')}</Button>
          <ConfirmDialog
            trigger={<Button variant="destructive-outline"><CalendarX2 aria-hidden /> {t('detalhe.cancelar')}</Button>}
            icon={CalendarX2}
            tone="destructive"
            confirmVariant="destructive"
            title={t('detalhe.cancelarTitulo')}
            description={t('detalhe.cancelarDescricao', { cand: ev.cand })}
            cancelLabel={tc('acao.voltar')}
            confirmLabel={t('detalhe.cancelarConfirmar')}
            onConfirm={onCancelar}
          />
        </div>
      </footer>
    </>
  )
}

/* ───────────────────────── agendamento — formulário (painel lateral) ───────────────────────── */

export function AgendarEntrevista({ cand, vaga, inicial, onCancelar, onConfirmar }: {
  cand: string; vaga: string; inicial?: Evento; onCancelar: () => void; onConfirmar: (ev: Evento) => void
}) {
  const { t } = useTranslation('entrevistas')
  const { t: tc } = useTranslation('common')
  const reagendando = !!inicial
  const [data, setData] = useState(inicial ? paraInput(inicial.y, inicial.m, inicial.d) : '')
  const [hora, setHora] = useState(inicial?.hora ?? '')
  const [duracao, setDuracao] = useState('45 min')
  const [tipo, setTipo] = useState<Tipo>(inicial?.tipo ?? 'Online')
  // 1 a 4 entrevistadores internos. A disponibilidade mostrada é a INTERSEÇÃO (só quando TODOS estão livres).
  const [entrevistadores, setEntrevistadores] = useState<string[]>(inicial?.entrevistadores?.length ? inicial.entrevistadores : inicial ? painelDe(inicial) : [ENTREVISTADORES[0]])
  const [contato, setContato] = useState('')
  const [obs, setObs] = useState('')
  const online = tipo === 'Online'

  const toggleIntv = (e: string) =>
    setEntrevistadores((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : prev.length < 4 ? [...prev, e] : prev))
  // Quem está ocupado num horário (entre os selecionados) e se o slot está livre para TODOS.
  const ocupadosNo = (slot: string) => entrevistadores.filter((e) => ocupado(e, data, slot))
  const livrePara = (slot: string) => slotLivre(entrevistadores, data, slot)
  const semHorario = data !== '' && entrevistadores.length > 0 && !temHorarioLivre(entrevistadores, data) // nenhum slot em comum no dia
  const proximaLivre = semHorario ? proximaDataLivre(entrevistadores, data) : '' // sugestão: próxima data com disponibilidade
  const horaOk = hora !== '' && livrePara(hora) // o slot escolhido continua livre p/ a seleção atual?
  const valido = data !== '' && entrevistadores.length > 0 && horaOk

  const confirmar = () => {
    if (!valido) return
    const [yy, mm, dd] = data.split('-').map(Number)
    onConfirmar({ y: yy, m: mm - 1, d: dd, hora, cand, vaga, tipo, entrevistadores })
  }

  return (
    <>
      {/* cabeçalho */}
      <header className="flex items-center gap-3 border-b border-border/50 p-5 pr-12">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary-text" aria-hidden><CalendarPlus className="size-6" /></span>
        <div className="min-w-0">
          <p className="ty-overline text-muted-foreground">{reagendando ? t('agendar.overlineReagendar') : t('agendar.overlineAgendar')}</p>
          <h2 className="truncate font-heading text-xl font-bold tracking-tight text-foreground">{cand}</h2>
          <p className="truncate ty-body-sm text-muted-foreground">{vaga}</p>
        </div>
      </header>

      {/* formulário (rolável) */}
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <div className="space-y-1.5">
          <Label htmlFor="ag-data">{t('agendar.data')}</Label>
          <DatePicker id="ag-data" value={data} onChange={setData} />
        </div>

        {/* entrevistadores (internos), 1 a 4. A disponibilidade abaixo cruza as agendas de todos. */}
        <fieldset className="space-y-2">
          <legend className="flex items-center gap-2 ty-label-sm font-medium text-foreground">
            {t('agendar.entrevistadores')} <span className="ty-caption font-normal text-muted-foreground">{t('agendar.contador', { n: entrevistadores.length })}</span>
          </legend>
          <div className="space-y-1.5">
            {ENTREVISTADORES.map((e) => {
              const on = entrevistadores.includes(e)
              const cheio = !on && entrevistadores.length >= 4
              return (
                <button
                  key={e} type="button" role="checkbox" aria-checked={on} disabled={cheio}
                  onClick={() => toggleIntv(e)}
                  className={cn('flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left ty-body-sm transition-colors focus-visible:focus-ring disabled:opacity-50',
                    on ? 'bg-primary/[0.06] text-foreground ring-1 ring-primary/40' : 'bg-card text-foreground ring-1 ring-surface-ring hover:bg-accent/40')}
                >
                  <span className={cn('flex size-5 shrink-0 items-center justify-center rounded-md', on ? 'bg-primary text-primary-foreground' : 'ring-1 ring-surface-ring')} aria-hidden>
                    {on && <Check className="size-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{e}</span>
                </button>
              )
            })}
          </div>
        </fieldset>

        {/* disponibilidade combinada (free/busy do Teams) → escolhe o horário */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Video className="size-4 shrink-0 text-primary-text" aria-hidden />
            <span id="ag-disp-label" className="ty-label-sm font-medium text-foreground">{t('agendar.disponibilidade')}</span>
          </div>
          {data === '' || entrevistadores.length === 0 ? (
            <p className="rounded-lg bg-muted/30 p-3 ty-body-sm text-muted-foreground">
              {data === '' ? t('agendar.escolhaData') : t('agendar.selecioneEntrevistador')}
            </p>
          ) : semHorario ? (
            // Nenhum slot em comum no dia: troca a grade (toda riscada, confusa) por um aviso claro e
            // ACIONÁVEL — ajuda quem está agendando a saber o que fazer. role="status" anuncia ao trocar a data.
            <div role="status" className="flex items-start gap-3 rounded-lg bg-warning/10 p-3.5 text-warning-text">
              <CalendarOff className="mt-0.5 size-5 shrink-0" aria-hidden />
              <div className="space-y-2">
                <div className="space-y-0.5">
                  <p className="ty-body-sm font-semibold">{t('agendar.semHorarioTitulo')}</p>
                  <p className="ty-body-sm">
                    {entrevistadores.length === 1
                      ? t('agendar.semHorarioUm')
                      : t('agendar.semHorarioVarios', { n: entrevistadores.length })}
                  </p>
                </div>
                {proximaLivre ? (
                  <button
                    type="button"
                    onClick={() => { setData(proximaLivre); setHora('') }}
                    className="inline-flex items-center gap-1.5 rounded-md ty-body-sm font-semibold underline-offset-2 hover:underline focus-visible:focus-ring"
                  >
                    <CalendarCheck className="size-4 shrink-0" aria-hidden />
                    {t('agendar.proximaDataLivre', { data: fmtBR(proximaLivre) })}
                  </button>
                ) : (
                  <p className="ty-body-sm">{entrevistadores.length > 1 ? t('agendar.tenteOutraDataReduza') : t('agendar.tenteOutraData')}</p>
                )}
              </div>
            </div>
          ) : (
            <>
              <p className="ty-caption text-muted-foreground">
                {entrevistadores.length === 1 ? t('agendar.horariosUm') : t('agendar.horariosVarios', { n: entrevistadores.length })}
              </p>
              <div className="grid grid-cols-3 gap-1.5" role="group" aria-labelledby="ag-disp-label">
                {WORK_SLOTS.map((slot) => {
                  const livre = livrePara(slot)
                  const sel = hora === slot && livre
                  const conflito = ocupadosNo(slot)
                  return (
                    <button
                      key={slot} type="button" disabled={!livre} aria-pressed={sel}
                      onClick={() => setHora(slot)}
                      title={livre ? undefined : t('agendar.slotOcupadoTitle', { nomes: conflito.map((c) => c.split(' · ')[0]).join(', ') })}
                      aria-label={livre ? t('agendar.slotLivreAria', { slot }) : t('agendar.slotOcupadoAria', { slot })}
                      className={cn('rounded-lg px-2 py-1.5 text-center ty-body-sm font-medium tabular-nums transition-colors focus-visible:focus-ring',
                        sel ? 'bg-primary text-primary-foreground'
                          : livre ? 'bg-success/10 text-success-text hover:bg-success/15'
                            : 'cursor-not-allowed bg-muted text-muted-foreground line-through')}
                    >
                      {slot}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ag-dur">{t('agendar.duracao')}</Label>
            <Select value={duracao} onValueChange={setDuracao}>
              <SelectTrigger id="ag-dur" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{DURACOES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ag-fmt">{t('agendar.formato')}</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as Tipo)}>
              <SelectTrigger id="ag-fmt" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Online">{t('agendar.formatoOnline')}</SelectItem>
                <SelectItem value="Presencial">{t('agendar.formatoPresencial')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ag-contato">{online ? t('agendar.linkReuniao') : t('agendar.local')}</Label>
          <Input id="ag-contato" value={contato} onChange={(e) => setContato(e.target.value)} placeholder={online ? t('agendar.linkPlaceholder') : t('agendar.localPlaceholder')} disabled={online} />
          {online && <p className="flex items-center gap-1.5 ty-caption text-muted-foreground"><Video className="size-3.5 shrink-0 text-primary-text" aria-hidden /> {t('agendar.teamsNota')}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ag-obs">{t('agendar.observacoes')}</Label>
          <Textarea id="ag-obs" rows={3} value={obs} onChange={(e) => setObs(e.target.value)} placeholder={t('agendar.observacoesPlaceholder')} />
        </div>
      </div>

      {/* rodapé */}
      <footer className="space-y-2 border-t border-border/40 p-4">
        {reagendando ? (
          <ConfirmDialog
            trigger={<Button className="w-full" disabled={!valido}><CalendarCheck aria-hidden /> {t('agendar.confirmarReagendamento')}</Button>}
            icon={CalendarCheck}
            tone="primary"
            confirmVariant="default"
            title={t('agendar.reagendarTitulo')}
            description={t('agendar.reagendarDescricao', { cand })}
            cancelLabel={tc('acao.voltar')}
            confirmLabel={t('agendar.reagendarConfirmar')}
            onConfirm={confirmar}
          />
        ) : (
          <Button className="w-full" onClick={confirmar} disabled={!valido}><CalendarCheck aria-hidden /> {t('agendar.confirmarAgendamento')}</Button>
        )}
        <Button variant="ghost" className="w-full" onClick={onCancelar}>{tc('acao.cancelar')}</Button>
      </footer>
    </>
  )
}

/* ───────────────────────── tela principal (calendário + listas) ───────────────────────── */

export function Entrevistas({ onNavigate, brand, mode, onCycleBrand, onToggleMode }: {
  onNavigate: (v: string) => void; brand?: string; mode?: string; onCycleBrand?: () => void; onToggleMode?: () => void
}) {
  const { t } = useTranslation('entrevistas')
  const hoje = new Date()
  const [mes, setMes] = useState(() => new Date().getMonth())
  const [ano, setAno] = useState(() => new Date().getFullYear())
  const [qProx, setQProx] = useState('')
  const [qAgu, setQAgu] = useState('')
  const [eventos, setEventos] = useState<Evento[]>(EVENTOS)
  const [fila, setFila] = useState<Fila[]>(AGUARDANDO)
  const [agendar, setAgendar] = useState<{ cand: string; vaga: string; inicial?: Evento } | null>(null)
  const [detalhe, setDetalhe] = useState<Evento | null>(null)

  // Monta as células do mês (segunda-feira primeiro) com preenchimento nas pontas.
  const startOffset = (new Date(ano, mes, 1).getDay() + 6) % 7
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()
  const celulas: (number | null)[] = [...Array(startOffset).fill(null), ...Array.from({ length: diasNoMes }, (_, i) => i + 1)]
  while (celulas.length % 7 !== 0) celulas.push(null)

  const eventosDoDia = (d: number) => eventos.filter((e) => e.y === ano && e.m === mes && e.d === d).sort((a, b) => a.hora.localeCompare(b.hora))
  // Filtro por nome do candidato afeta os dois painéis. Próximas entrevistas pagina de 10 em 10.
  const proximas = eventos.filter((e) => e.y === ano && e.m === mes && e.cand.toLowerCase().includes(qProx.trim().toLowerCase())).sort((a, b) => a.d - b.d || a.hora.localeCompare(b.hora))
  const aguardando = fila.filter((c) => c.cand.toLowerCase().includes(qAgu.trim().toLowerCase()))
  const { page, setPage, pageItems, total, inicio, totalItems } = usePagination(proximas, PER_PAGE)

  const mudarMes = (delta: number) => {
    const base = new Date(ano, mes + delta, 1)
    setMes(base.getMonth()); setAno(base.getFullYear()); setPage(1)
  }

  // Qualquer clique no menu volta para o calendário: limpa agendamento/detalhe abertos.
  const handleNav = (v: string) => { setAgendar(null); setDetalhe(null); onNavigate(v) }

  // Confirma um agendamento: substitui qualquer evento do mesmo candidato/vaga, tira-o da fila e mostra o mês.
  const confirmarAgendamento = (novo: Evento) => {
    setEventos((prev) => [...prev.filter((e) => !(e.cand === novo.cand && e.vaga === novo.vaga)), novo])
    setFila((prev) => prev.filter((c) => c.cand !== novo.cand))
    setMes(novo.m); setAno(novo.y); setPage(1)
    setAgendar(null); setDetalhe(null)
    const nIntv = novo.entrevistadores?.length ?? 1
    const via = novo.tipo === 'Online' ? t('toast.viaTeams') : ''
    toast.success(t('toast.agendada', { count: nIntv, cand: novo.cand, data: `${novo.d}/${novo.m + 1}`, hora: novo.hora, via }))
  }

  return (
    <AppShell active="entrevistas" crumb={t('crumb')} onNavigate={handleNav} brand={brand} mode={mode} onCycleBrand={onCycleBrand} onToggleMode={onToggleMode}>
      <PageContainer>
          <PageHeader
            icon={CalendarDays}
            title={t('header.title')}
            desc={t('header.desc')}
          />

          {/* calendário */}
          <section aria-label={t('calendario.label', { mes: mesLongo(mes), ano })} className={cn(CARD, 'overflow-hidden')}>
            {/* controles: navegação + mês/ano */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 p-4 sm:p-5">
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="icon-sm" aria-label={t('calendario.mesAnterior')} onClick={() => mudarMes(-1)}><ChevronLeft aria-hidden /></Button>
                <h2 className="min-w-[10rem] text-center font-heading text-lg font-bold tracking-tight text-foreground tabular-nums">{mesLongo(mes)} {ano}</h2>
                <Button variant="outline" size="icon-sm" aria-label={t('calendario.proximoMes')} onClick={() => mudarMes(1)}><ChevronRight aria-hidden /></Button>
              </div>
              <div className="flex items-center gap-2">
                <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
                  <SelectTrigger size="sm" aria-label={t('calendario.mes')} className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>{Array.from({ length: 12 }, (_, i) => <SelectItem key={i} value={String(i)}>{mesLongo(i)}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
                  <SelectTrigger size="sm" aria-label={t('calendario.ano')} className="w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>{ANOS.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* cabeçalho dos dias da semana */}
            <div className="grid grid-cols-7 border-b border-border/50 bg-muted/30">
              {semanaCurta().map((d) => (
                <div key={d} className="px-2 py-2 text-center ty-caption font-semibold tracking-wide text-muted-foreground uppercase">{d}</div>
              ))}
            </div>

            {/* grade de dias */}
            <div className="grid grid-cols-7">
              {celulas.map((d, i) => {
                const isHoje = d !== null && ano === hoje.getFullYear() && mes === hoje.getMonth() && d === hoje.getDate()
                const evs = d !== null ? eventosDoDia(d) : []
                return (
                  <div
                    key={i}
                    className={cn(
                      'min-h-24 space-y-1 border-b border-r border-border/40 p-1.5 last:border-r-0 sm:min-h-28',
                      d === null ? 'bg-muted/20' : isHoje ? 'bg-primary/5' : 'bg-card',
                    )}
                  >
                    {d !== null && (
                      <>
                        <div className="flex justify-end">
                          <span className={cn('flex size-6 items-center justify-center rounded-full ty-caption tabular-nums', isHoje ? 'bg-primary font-semibold text-primary-foreground' : 'text-muted-foreground')}>{d}</span>
                        </div>
                        <div className="space-y-1">
                          {evs.slice(0, 2).map((ev, k) => <EventoChip key={k} ev={ev} onOpen={setDetalhe} />)}
                          {evs.length > 2 && <MaisDoDia titulo={dataMedia(ano, mes, d)} evs={evs} onOpen={setDetalhe} />}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* próximas entrevistas + candidatos aguardando, busca própria em cada painel + paginação (10/página) */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel icon={CalendarDays} title={t('proximas.title')} desc={t('proximas.desc', { n: proximas.length, mes: mesLongo(mes) })}>
              <div className="relative mb-4">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input value={qProx} onChange={(e) => { setQProx(e.target.value); setPage(1) }} placeholder={t('proximas.buscar')} aria-label={t('proximas.buscarAria')} className="pl-9" />
              </div>
              {proximas.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-muted/30 py-12 text-center">
                  <CalendarX2 className="size-7 text-muted-foreground/60" aria-hidden />
                  <p className="ty-body-sm text-muted-foreground">{qProx.trim() ? t('proximas.vaziaBusca') : t('proximas.vazia')}</p>
                </div>
              ) : (
                <>
                  <ul className="space-y-2.5">
                    {pageItems.map((ev, i) => (
                      <li key={i}>
                        {/* Linha clicável → abre o detalhe do agendamento. */}
                        <button type="button" onClick={() => setDetalhe(ev)} className="flex w-full items-center gap-3 rounded-xl bg-muted/30 p-3 text-left transition-colors hover:bg-muted/50 focus-visible:focus-ring">
                          <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-card text-center shadow-sm ring-1 ring-surface-ring" aria-hidden>
                            <span className="font-heading text-base font-bold leading-none tabular-nums text-foreground">{String(ev.d).padStart(2, '0')}</span>
                            <span className="ty-caption text-muted-foreground uppercase">{mesAbrev(ev.m)}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate ty-body-sm font-medium text-foreground">{ev.cand}</p>
                            <p className="truncate ty-caption text-muted-foreground">{ev.vaga}</p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className="flex items-center gap-1 ty-body-sm font-medium tabular-nums text-foreground"><Clock className="size-3.5 text-muted-foreground" aria-hidden /> {ev.hora}</span>
                            <span className="flex items-center gap-1 ty-caption text-muted-foreground">
                              {ev.tipo === 'Online' ? <Video className="size-3" aria-hidden /> : <MapPin className="size-3" aria-hidden />} {t(`formato.${ev.tipo}`)}
                            </span>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                  {total > 1 && (
                    <Paginacao compact page={page} total={total} inicio={inicio} shown={pageItems.length} totalItems={totalItems} onPage={setPage} />
                  )}
                </>
              )}
            </Panel>

            <Panel icon={Inbox} title={t('fila.title')} desc={t('fila.desc', { n: aguardando.length })}>
              <div className="relative mb-4">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input value={qAgu} onChange={(e) => setQAgu(e.target.value)} placeholder={t('fila.buscar')} aria-label={t('fila.buscarAria')} className="pl-9" />
              </div>
              {aguardando.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-muted/30 py-12 text-center">
                  <Inbox className="size-7 text-muted-foreground/60" aria-hidden />
                  <p className="ty-body-sm text-muted-foreground">{qAgu.trim() ? t('fila.vaziaBusca') : t('fila.vazia')}</p>
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {aguardando.map((c) => (
                    <li key={c.cand} className="flex items-center gap-3 rounded-xl bg-muted/30 p-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary/15 ty-body-sm font-semibold text-secondary-text" aria-hidden>{iniciais(c.cand)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate ty-body-sm font-medium text-foreground">{c.cand}</p>
                        <p className="truncate ty-caption text-muted-foreground">{t('fila.aguardando', { vaga: c.vaga, desde: c.desde })}</p>
                      </div>
                      <Button size="sm" variant="outline" className="shrink-0" onClick={() => setAgendar({ cand: c.cand, vaga: c.vaga })}><CalendarPlus aria-hidden /> {t('fila.agendar')}</Button>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </PageContainer>

        {/* painel lateral, agendar ou ver o detalhe do agendamento (modal lateral) */}
        <Sheet open={!!agendar || !!detalhe} onOpenChange={(aberto) => { if (!aberto) { setAgendar(null); setDetalhe(null) } }}>
          <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
            {agendar ? (
              <>
                <SheetTitle className="sr-only">{agendar.inicial ? t('sheet.tituloReagendar', { cand: agendar.cand }) : t('sheet.tituloAgendar', { cand: agendar.cand })}</SheetTitle>
                <SheetDescription className="sr-only">{t('sheet.descAgendar')}</SheetDescription>
                <AgendarEntrevista
                  cand={agendar.cand}
                  vaga={agendar.vaga}
                  inicial={agendar.inicial}
                  onCancelar={() => setAgendar(null)}
                  onConfirmar={confirmarAgendamento}
                />
              </>
            ) : detalhe ? (
              <>
                <SheetTitle className="sr-only">{t('sheet.tituloDetalhe', { cand: detalhe.cand })}</SheetTitle>
                <SheetDescription className="sr-only">{t('sheet.descDetalhe')}</SheetDescription>
                <AgendamentoDetalhe
                  ev={detalhe}
                  onReagendar={() => { setAgendar({ cand: detalhe.cand, vaga: detalhe.vaga, inicial: detalhe }); setDetalhe(null) }}
                  onCancelar={() => {
                    setEventos((prev) => prev.filter((e) => e !== detalhe))
                    setFila((prev) => [{ cand: detalhe.cand, vaga: detalhe.vaga, desde: 'há instantes' }, ...prev])
                    setDetalhe(null)
                    toast.info(t('toast.cancelada', { cand: detalhe.cand }))
                  }}
                />
              </>
            ) : null}
          </SheetContent>
        </Sheet>
    </AppShell>
  )
}
