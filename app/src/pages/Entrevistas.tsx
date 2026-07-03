/**
 * Entrevistas — calendário mensal + próximas entrevistas. Clicar numa entrevista (lista ou chip do
 * calendário) abre o DETALHE do agendamento (ver/reagendar/cancelar). O agendamento inicial é feito por
 * outra funcionalidade — esta tela acompanha e ajusta as entrevistas já marcadas.
 * Reconstruído no DS (AppShell, CARD, .ty-*, tokens) — nada de cor/borda à mão. Demo: dados mockados.
 */
import { useState, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CalendarCheck, CalendarClock, CalendarDays, CalendarOff, CalendarPlus, CalendarX2, Check, Clock,
  FileDown, Link2, MapPin, Pencil, User, Users, Video,
} from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { iniciais } from '@/lib/format'
import { dataLonga, diaSemanaNome } from '@/lib/datetime'
import { disponibilidadeDe } from '@/lib/disponibilidade'
import { AppShell } from '@/components/shell/AppShell'
import { CalendarioMensal } from '@/components/CalendarioMensal'
import { ProximasEntrevistas } from '@/components/ProximasEntrevistas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { PageContainer, PageHeader } from '@/components/page'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ENTREVISTADORES, DURACOES, WORK_SLOTS, ocupado, slotLivre, temHorarioLivre, proximaDataLivre, painelDe, duracaoDe, linkDe } from './entrevistas.logic'
import { baixarRoteiro } from './roteiro'

const ANOS = [2025, 2026, 2027]
// Nomes de mês/semana/data por LOCALE vêm de @/lib/datetime (Intl) — pt-BR sai idêntico ao legado.

type Tipo = 'Online' | 'Presencial'
export type Evento = { y: number; m: number; d: number; hora: string; cand: string; vaga: string; tipo: Tipo; entrevistadores?: string[] }
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

// Mês em que o calendário ABRE: o do evento mais antigo dos dados (não `new Date()`). Assim a tela nunca
// abre vazia mesmo que a data do sistema avance para além do mês semeado na demo (jun/2026).
const EVENTO_ANCORA = [...EVENTOS].sort((a, b) => a.y - b.y || a.m - b.m || a.d - b.d)[0]

const fmtData = (ev: Evento) => dataLonga(ev.y, ev.m, ev.d)
// 'yyyy-MM-dd' → 'dd/MM/yyyy' p/ exibição (mesmo formato que o usuário vê no campo de data).
const fmtBR = (iso: string) => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}` }

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
      <footer className="space-y-2 border-t border-border/40 p-4 pb-[calc(1rem_+_env(safe-area-inset-bottom))]">
        <Button className="w-full" onClick={() => (online ? toast.success(t('detalhe.toastEntrando')) : toast.info(t('detalhe.toastLocalCopiado')))}>
          {online ? <><Video aria-hidden /> {t('detalhe.entrarChamada')}</> : <><MapPin aria-hidden /> {t('detalhe.verLocal')}</>}
        </Button>
        {/* Roteiro personalizado (IA) para o entrevistador levar à conversa; reenviado preenchido no fim. */}
        <Button
          variant="outline" className="w-full"
          onClick={() => {
            void baixarRoteiro({ cand: ev.cand, vaga: ev.vaga, data: `${ev.d}/${ev.m + 1}/${ev.y}`, hora: ev.hora, tipo: online ? t('detalhe.online') : t('detalhe.presencial'), entrevistadores: intvs })
            toast.success(t('detalhe.roteiroBaixado', { cand: ev.cand }))
          }}
        >
          <FileDown aria-hidden /> {t('detalhe.baixarRoteiro')}
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
  // Data/hora começam VAZIAS mesmo no reagendamento: a data sai das que o candidato informou (chips abaixo),
  // não do agendamento antigo. entrevistadores/tipo seguem pré-preenchidos do evento.
  const [data, setData] = useState('')
  const [hora, setHora] = useState('')
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
  // Datas + períodos que o candidato informou no auto-agendamento (mock por candidato). Clicar numa data
  // salta o reagendamento para ela — remarcar respeitando o que o candidato disse que pode.
  const dispCand = disponibilidadeDe(cand)

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
        {/* Datas + períodos informados pelo candidato no auto-agendamento — clicar numa data salta o reagendamento para ela. */}
        <div className="space-y-2 rounded-lg bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="size-4 shrink-0 text-primary-text" aria-hidden />
            <span className="ty-label-sm font-medium text-foreground">{t('agendar.dispCandidato')}</span>
          </div>
          <p className="ty-caption text-muted-foreground">{t('agendar.dispCandidatoDica')}</p>
          {/* Mesmo formato dos horários abaixo: botões em grade, maiores e fáceis de tocar. */}
          <div className="grid grid-cols-3 gap-2">
            {dispCand.datas.map((dia) => (
              <button
                key={dia.iso}
                type="button"
                onClick={() => { setData(dia.iso); setHora('') }}
                aria-pressed={data === dia.iso}
                className={cn('rounded-lg px-2 py-2 text-center ty-body-sm font-medium transition-colors focus-visible:focus-ring',
                  data === dia.iso ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary-text ring-1 ring-primary/15 hover:bg-primary/15')}
              >
                {diaSemanaNome(dia.dia)} {String(dia.d).padStart(2, '0')}/{String(dia.m + 1).padStart(2, '0')}
              </button>
            ))}
          </div>
          <p className="ty-caption text-muted-foreground">
            {t('agendar.dispPeriodos')}: {dispCand.periodos.map((p) => t(`agendar.periodo.${p}` as 'agendar.periodo.manha')).join(', ')}
          </p>
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
      <footer className="space-y-2 border-t border-border/40 p-4 pb-[calc(1rem_+_env(safe-area-inset-bottom))]">
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
  // Abre no mês dos dados (evento âncora), não em "hoje" — senão a tela abre vazia quando a data real
  // passa do mês semeado. O destaque do dia atual fica por conta do CalendarioMensal.
  const [mes, setMes] = useState(() => EVENTO_ANCORA.m)
  const [ano, setAno] = useState(() => EVENTO_ANCORA.y)
  const [eventos, setEventos] = useState<Evento[]>(EVENTOS)
  const [agendar, setAgendar] = useState<{ cand: string; vaga: string; inicial?: Evento } | null>(null)
  const [detalhe, setDetalhe] = useState<Evento | null>(null)
  // Painel lateral de "próximas entrevistas" — aberto pelo ícone na barra do calendário (fecha por padrão,
  // deixando o calendário ocupar a página toda).
  const [painelAberto, setPainelAberto] = useState(false)

  const mudarMes = (delta: number) => {
    const base = new Date(ano, mes + delta, 1)
    setMes(base.getMonth()); setAno(base.getFullYear())
  }

  // Qualquer clique no menu volta para o calendário: limpa agendamento/detalhe abertos.
  const handleNav = (v: string) => { setAgendar(null); setDetalhe(null); onNavigate(v) }

  // Confirma um (re)agendamento: substitui qualquer evento do mesmo candidato/vaga e mostra o mês.
  const confirmarAgendamento = (novo: Evento) => {
    setEventos((prev) => [...prev.filter((e) => !(e.cand === novo.cand && e.vaga === novo.vaga)), novo])
    setMes(novo.m); setAno(novo.y)
    setAgendar(null); setDetalhe(null)
    const nIntv = novo.entrevistadores?.length ?? 1
    const via = novo.tipo === 'Online' ? t('toast.viaTeams') : ''
    toast.success(t('toast.agendada', { count: nIntv, cand: novo.cand, data: `${novo.d}/${novo.m + 1}`, hora: novo.hora, via }))
  }

  return (
    <AppShell active="entrevistas" crumb={t('crumb')} onNavigate={handleNav} brand={brand} mode={mode} onCycleBrand={onCycleBrand} onToggleMode={onToggleMode}>
      {/* Calendário full-width (estilo Linear): ocupa a página toda, só com as sangrias padrão. */}
      <PageContainer width="max-w-none">
          <PageHeader
            icon={CalendarDays}
            title={t('header.title')}
            desc={t('header.desc')}
          />

          {/* Calendário + painel opcional de próximas entrevistas na lateral (abre pelo ícone da barra). */}
          <div className={cn('grid gap-5', painelAberto && 'lg:grid-cols-[minmax(0,1fr)_22rem]')}>
            <CalendarioMensal
              eventos={eventos} mes={mes} ano={ano} anos={ANOS}
              onMes={setMes} onAno={setAno} onMudarMes={mudarMes} onAbrir={setDetalhe}
              acoes={
                <Button
                  variant="outline" size="icon"
                  aria-pressed={painelAberto} aria-label={painelAberto ? t('proximas.ocultar') : t('proximas.mostrar')}
                  onClick={() => setPainelAberto((v) => !v)}
                  className={cn('shrink-0', painelAberto && 'border-primary/40 bg-primary/10 text-primary-text hover:bg-primary/15')}
                >
                  <CalendarClock aria-hidden />
                </Button>
              }
            />
            {painelAberto && (
              <ProximasEntrevistas eventos={eventos} mes={mes} ano={ano} onAbrir={setDetalhe} onFechar={() => setPainelAberto(false)} />
            )}
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
