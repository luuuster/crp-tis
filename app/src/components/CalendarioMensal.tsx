/**
 * Calendário mensal de agendamentos — grade do mês (segunda-feira primeiro) com pílulas de evento por dia.
 * Fonte ÚNICA da visão de calendário da plataforma: usada na tela de Entrevistas e na visão "Calendário" do
 * Funil, pra a grade nunca divergir. Controlado pelo pai (mês/ano vêm por props); clicar num evento chama
 * onAbrir. Dia com mais de 2 eventos abre um modal com todos. 100% token-driven, WCAG 2.2 AA. Demo: mock.
 */
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Clock, MapPin, Search, Video } from 'lucide-react'

import { cn } from '@/lib/utils'
import { CARD } from '@/lib/surfaces'
import { focusRing } from '@/lib/focus'
import { iniciais } from '@/lib/format'
import { fotoDe } from '@/lib/avatar'
import { dataLonga, dataMedia, mesLongo, semanaCurta } from '@/lib/datetime'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { painelDe, RESPONSAVEIS } from '@/pages/entrevistas.logic'
import type { Evento } from '@/pages/Entrevistas'

// Responsáveis (entrevistadores) de um evento — do próprio evento ou derivados do candidato (mock).
const responsaveisDe = (e: Evento) => (e.entrevistadores?.length ? e.entrevistadores : painelDe(e)).map((r) => r.split(' · ')[0])
const RESP_INICIAL = 10 // quantos responsáveis a lista mostra antes de "ver lista completa"

// Dropdown "Responsável" (busca + checkboxes, 10 por vez + lista completa) — filtra o calendário por quem
// conduz a entrevista. Multi-seleção; universo = equipe de RH/gestão (RESPONSAVEIS), em ordem alfabética.
function FiltroResponsavel({ sel, onToggle, onLimpar }: { sel: string[]; onToggle: (n: string) => void; onLimpar: () => void }) {
  const { t } = useTranslation('entrevistas')
  const [busca, setBusca] = useState('')
  const [verTodos, setVerTodos] = useState(false)
  const termo = busca.trim().toLowerCase()
  const achados = RESPONSAVEIS.filter((n) => n.toLowerCase().includes(termo))
  const lista = verTodos ? achados : achados.slice(0, RESP_INICIAL)
  const restantes = achados.length - lista.length
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          {t('responsavel.label')}
          {sel.length > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1 ty-caption font-semibold text-primary-foreground tabular-nums">{sel.length}</span>}
          <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <div className="border-b border-border/50 p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input value={busca} onChange={(e) => { setBusca(e.target.value); setVerTodos(false) }} placeholder={t('responsavel.buscar')} aria-label={t('responsavel.buscar')} className="pl-9" />
          </div>
        </div>
        <ul className="max-h-72 overflow-y-auto p-1.5" role="group" aria-label={t('responsavel.label')}>
          {lista.length === 0 && <li className="px-2 py-6 text-center ty-body-sm text-muted-foreground">{t('responsavel.vazio')}</li>}
          {lista.map((n) => {
            const on = sel.includes(n)
            return (
              <li key={n}>
                <button type="button" role="checkbox" aria-checked={on} onClick={() => onToggle(n)}
                  className={cn('flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left ty-body-sm transition-colors hover:bg-accent/50', focusRing)}>
                  <span className={cn('flex size-4.5 shrink-0 items-center justify-center rounded-[0.25rem]', on ? 'bg-primary text-primary-foreground' : 'ring-1 ring-surface-ring')} aria-hidden>
                    {on && <Check className="size-3" />}
                  </span>
                  <Avatar className="size-6">
                    <AvatarImage src={fotoDe(n)} alt="" />
                    <AvatarFallback className="bg-primary/10 ty-caption font-semibold text-primary-text">{iniciais(n)}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate font-medium text-foreground">{n}</span>
                </button>
              </li>
            )
          })}
        </ul>
        <div className="flex items-center justify-between gap-2 border-t border-border/50 p-1.5">
          {restantes > 0
            ? <Button variant="ghost" size="sm" className="flex-1" onClick={() => setVerTodos(true)}>{t('responsavel.verTodos')}</Button>
            : <span className="px-2 ty-caption text-muted-foreground">{t('responsavel.contagem', { n: achados.length })}</span>}
          {sel.length > 0 && <Button variant="ghost" size="sm" onClick={onLimpar}>{t('responsavel.limpar')}</Button>}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Pílula de evento dentro de uma célula do calendário — clicável (abre o detalhe). Estilo "Linear":
// plano (sem fundo fixo, só no hover), com um ícone colorido do formato à esquerda + horário + nome.
function EventoChip({ ev, onOpen }: { ev: Evento; onOpen: (ev: Evento) => void }) {
  const Icon = ev.tipo === 'Online' ? Video : MapPin
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => onOpen(ev)}
          // nome acessível inclui a DATA (o texto visível só tem hora + nome; sem isso, navegando por
          // eventos o leitor de tela não sabe de que dia é o agendamento).
          aria-label={`${dataLonga(ev.y, ev.m, ev.d)} · ${ev.hora} · ${ev.cand}, ${ev.vaga}`}
          className="flex w-full items-center gap-1.5 truncate rounded-md px-1.5 py-1 text-left ty-caption transition-colors hover:bg-muted focus-visible:focus-ring"
        >
          <Icon className="size-3 shrink-0 text-primary-text" aria-hidden />
          <span className="shrink-0 tabular-nums text-muted-foreground">{ev.hora}</span>
          <span className="truncate font-medium text-foreground">{ev.cand}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent>{`${ev.hora} · ${ev.cand}, ${ev.vaga}`}</TooltipContent>
    </Tooltip>
  )
}

// Linha rica de agendamento (avatar + nome + vaga + horário/formato), usada DENTRO da modal do dia.
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
        <button type="button" className="flex w-full items-center rounded-md px-1.5 py-1 text-left ty-caption font-semibold text-primary-text transition-colors hover:bg-muted focus-visible:focus-ring">
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

export function CalendarioMensal({ eventos, mes, ano, anos, onMes, onAno, onMudarMes, onAbrir, acoes }: {
  eventos: Evento[]
  mes: number
  ano: number
  anos: number[]
  onMes: (m: number) => void
  onAno: (a: number) => void
  onMudarMes: (delta: number) => void
  onAbrir: (ev: Evento) => void
  acoes?: ReactNode // botões extras à direita da barra (ex.: alternar o painel de próximas entrevistas)
}) {
  const { t } = useTranslation('entrevistas')
  const hoje = new Date()
  // Índice da semana (0-based) que contém hoje, dentro do MÊS de hoje — usado por "Hoje" e ao trocar p/ semana.
  const semanaIdxHoje = Math.floor(((new Date(hoje.getFullYear(), hoje.getMonth(), 1).getDay() + 6) % 7 + hoje.getDate() - 1) / 7)
  // Filtro por RESPONSÁVEL (dropdown multi-seleção) — mostra só os eventos conduzidos por quem está marcado.
  const [respSel, setRespSel] = useState<string[]>([])
  const toggleResp = (n: string) => setRespSel((p) => (p.includes(n) ? p.filter((x) => x !== n) : [...p, n]))
  const visiveis = respSel.length ? eventos.filter((e) => responsaveisDe(e).some((n) => respSel.includes(n))) : eventos
  // Visão Mês × Semana e a semana ativa (modo semana).
  const [modo, setModo] = useState<'mes' | 'semana'>('mes')
  const [semanaIdx, setSemanaIdx] = useState(0)

  // Monta as células (segunda-feira primeiro). Visão de SEMANA ÚTIL: montamos as semanas de 7 e descartamos
  // sábado/domingo (colunas 5 e 6), deixando só seg–sex — os agendamentos da demo são todos em dia útil.
  // As pontas mostram os números do mês vizinho em cinza (`dentro:false`), como no calendário de referência.
  type Cel = { d: number; dentro: boolean }
  const startOffset = (new Date(ano, mes, 1).getDay() + 6) % 7
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()
  const diasMesAnt = new Date(ano, mes, 0).getDate()
  const celulasFull: Cel[] = []
  for (let i = 0; i < startOffset; i++) celulasFull.push({ d: diasMesAnt - startOffset + 1 + i, dentro: false })
  for (let d = 1; d <= diasNoMes; d++) celulasFull.push({ d, dentro: true })
  for (let d = 1; celulasFull.length % 7 !== 0; d++) celulasFull.push({ d, dentro: false })
  const celulas = celulasFull.filter((_, i) => i % 7 < 5)
  // Semanas (5 dias úteis cada); no modo "semana" mostramos só a semana ativa (clampada ao mês).
  const semanas: Cel[][] = []
  for (let i = 0; i < celulas.length; i += 5) semanas.push(celulas.slice(i, i + 5))
  const idxSemana = Math.min(semanaIdx, semanas.length - 1)
  const celulasVis = modo === 'semana' ? (semanas[idxSemana] ?? []) : celulas
  const ehMesDeHoje = ano === hoje.getFullYear() && mes === hoje.getMonth()

  const eventosDoDia = (d: number) => visiveis.filter((e) => e.y === ano && e.m === mes && e.d === d).sort((a, b) => a.hora.localeCompare(b.hora))
  const irHoje = () => { onMes(hoje.getMonth()); onAno(hoje.getFullYear()); setSemanaIdx(semanaIdxHoje) }
  // Setas: modo mês navega por MÊS; modo semana navega por SEMANA (virando de mês nas pontas).
  const irAnterior = () => { if (modo === 'mes') return onMudarMes(-1); if (idxSemana > 0) return setSemanaIdx(idxSemana - 1); onMudarMes(-1); setSemanaIdx(99) }
  const irProximo = () => { if (modo === 'mes') return onMudarMes(1); if (idxSemana < semanas.length - 1) return setSemanaIdx(idxSemana + 1); onMudarMes(1); setSemanaIdx(0) }

  return (
    <section aria-label={t('calendario.label', { mes: mesLongo(mes), ano })} className={cn(CARD, 'overflow-hidden')}>
      {/* controles: filtro por responsável (esquerda) + data/visão e ações (direita) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 p-3 sm:p-4">
        <FiltroResponsavel sel={respSel} onToggle={toggleResp} onLimpar={() => setRespSel([])} />
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={irHoje}>{t('calendario.hoje')}</Button>
          <Select value={modo} onValueChange={(v) => { const m = v as 'mes' | 'semana'; setModo(m); if (m === 'semana') setSemanaIdx(ehMesDeHoje ? semanaIdxHoje : 0) }}>
            <SelectTrigger aria-label={t('calendario.visao')} className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mes">{t('calendario.mes')}</SelectItem>
              <SelectItem value="semana">{t('calendario.semana')}</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" aria-label={modo === 'mes' ? t('calendario.mesAnterior') : t('calendario.semanaAnterior')} onClick={irAnterior}><ChevronLeft aria-hidden /></Button>
            <Select value={String(mes)} onValueChange={(v) => onMes(Number(v))}>
              <SelectTrigger aria-label={t('calendario.mes')} className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>{Array.from({ length: 12 }, (_, i) => <SelectItem key={i} value={String(i)}>{mesLongo(i)}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={String(ano)} onValueChange={(v) => onAno(Number(v))}>
              <SelectTrigger aria-label={t('calendario.ano')} className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>{anos.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" size="icon" aria-label={modo === 'mes' ? t('calendario.proximoMes') : t('calendario.semanaProxima')} onClick={irProximo}><ChevronRight aria-hidden /></Button>
          </div>
          {acoes}
        </div>
      </div>

      {/* cabeçalho dos dias da semana (seg–sex) */}
      <div className="grid grid-cols-5 border-b border-border/50">
        {semanaCurta().slice(0, 5).map((d) => (
          <div key={d} className="px-2 py-2 ty-caption font-semibold tracking-wide text-muted-foreground uppercase">{d}</div>
        ))}
      </div>

      {/* grade de dias (mês inteiro ou só a semana ativa) */}
      <div className="grid grid-cols-5">
        {celulasVis.map((cel, i) => {
          const isHoje = cel.dentro && ano === hoje.getFullYear() && mes === hoje.getMonth() && cel.d === hoje.getDate()
          const evs = cel.dentro ? eventosDoDia(cel.d) : []
          return (
            <div
              key={i}
              className={cn(
                'space-y-1 border-b border-r border-border/40 bg-card p-2 last:border-r-0',
                modo === 'semana' ? 'min-h-56 sm:min-h-80' : 'min-h-28 sm:min-h-32',
              )}
            >
              <div className="flex">
                <span className={cn(
                  'inline-flex min-w-6 items-center justify-center rounded-md px-1.5 py-0.5 ty-caption font-semibold tabular-nums',
                  isHoje ? 'bg-primary text-primary-foreground' : cel.dentro ? 'text-foreground' : 'text-muted-foreground/60',
                )}>{cel.d}</span>
              </div>
              {cel.dentro && (
                <div className="space-y-0.5">
                  {evs.slice(0, 2).map((ev, k) => <EventoChip key={k} ev={ev} onOpen={onAbrir} />)}
                  {evs.length > 2 && <MaisDoDia titulo={dataMedia(ano, mes, cel.d)} evs={evs} onOpen={onAbrir} />}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
