/**
 * Tela PÚBLICA de auto-agendamento da entrevista (visão do CANDIDATO). Chega por um link externo (ex.: no
 * e-mail de convite): sem login, chrome leve (só a marca). O candidato conversa com um assistente que
 * pergunta os DIAS e o PERÍODO em que ele pode, CRUZA com a agenda da equipe (recrutador + demais
 * entrevistadores) e oferece horários concretos. A disponibilidade informada também alimenta o
 * reagendamento do RH (ver disponibilidadeDe em @/lib/disponibilidade e o formulário em Entrevistas).
 *
 * Interação por BOTÕES de resposta rápida (chips) — determinístico e 100% acessível (teclado/leitor de
 * tela), com o transcript num role="log" aria-live. MOCK, sem backend: o cruzamento bate no free/busy
 * DETERMINÍSTICO do app (slotLivre); nada é enviado a lugar nenhum.
 *
 * Nota de produto: NADA aqui é apresentado como "IA" — do lado do candidato é só um "assistente de
 * agendamento" (ver memória: não expor IA ao candidato).
 */
import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarClock, Check, CheckCircle2, RotateCcw, Sunrise, Sunset } from 'lucide-react'

import { cn } from '@/lib/utils'
import { dataMedia, diaSemanaLongo, diaSemanaNome } from '@/lib/datetime'
import { PERIODOS, horariosEmDatas, proximosDiasUteis, type DiaDisponivel, type Periodo, type SlotCruzado } from '@/lib/disponibilidade'
import { CandidatoHeader } from '@/components/candidato/CandidatoHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Ícone por período (nascer/pôr do sol) — reforço visual da manhã × tarde nos cartões.
const PERIODO_ICON: Record<Periodo, ComponentType<{ className?: string }>> = { manha: Sunrise, tarde: Sunset }

// Entrevistadores da vaga (mock): o recrutador + uma pessoa da gestão — é a "agenda de outras pessoas" com
// a qual a disponibilidade do candidato é cruzada. No produto, viria do painel definido para a vaga.
const PESSOAS = ['Marina Albuquerque · RH', 'Carlos Mendes · Gestor']

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Etapas da conversa. 'identificacao' vem ANTES de tudo: o candidato diz nome + e-mail e o assistente
// "localiza" a candidatura dele na vaga (mock) — só então libera a escolha das datas.
type Etapa = 'identificacao' | 'dias' | 'periodos' | 'horarios' | 'confirmado'

// Bolha de mensagem do chat: bot à esquerda (com avatar), candidato à direita (tom da marca).
function Bubble({ de, children }: { de: 'bot' | 'user'; children: ReactNode }) {
  const bot = de === 'bot'
  return (
    <div className={cn('flex items-end gap-2 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-300', bot ? 'justify-start' : 'justify-end')}>
      {bot && (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground" aria-hidden>
          <CalendarClock className="size-4" />
        </span>
      )}
      <div className={cn('max-w-[80%] rounded-2xl px-3.5 py-2.5 ty-body-sm leading-relaxed', bot ? 'rounded-bl-sm bg-muted/60 text-foreground' : 'rounded-br-sm bg-primary text-primary-foreground')}>
        {children}
      </div>
    </div>
  )
}

// Chip de DATA concreta (dia da semana + dd/mm) — multi-seleção via aria-pressed; ocupa a célula da grade.
function DiaChip({ on, onClick, nome, data, aria }: { on: boolean; onClick: () => void; nome: string; data: string; aria: string }) {
  return (
    <button
      type="button" aria-pressed={on} aria-label={aria} onClick={onClick}
      className={cn('relative flex w-full flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2.5 transition-colors focus-visible:focus-ring',
        on ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground ring-1 ring-surface-ring hover:bg-accent/40')}
    >
      {on && <Check className="absolute top-1.5 right-1.5 size-3.5" aria-hidden />}
      <span className="ty-body-sm font-semibold">{nome}</span>
      <span className={cn('ty-caption tabular-nums', on ? 'text-primary-foreground/80' : 'text-muted-foreground')}>{data}</span>
    </button>
  )
}

// Cartão de período — ícone (nascer/pôr do sol) + nome + faixa de horário. Nome acessível = nome + faixa.
function PeriodoCard({ on, onClick, icon: Icon, nome, faixa }: { on: boolean; onClick: () => void; icon: ComponentType<{ className?: string }>; nome: string; faixa: string }) {
  return (
    <button
      type="button" aria-pressed={on} onClick={onClick}
      className={cn('flex items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition-colors focus-visible:focus-ring',
        on ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground ring-1 ring-surface-ring hover:bg-accent/40')}
    >
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', on ? 'bg-primary-foreground/15' : 'bg-primary/10 text-primary-text')} aria-hidden>
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block ty-body-sm font-semibold">{nome}</span>
        <span className={cn('block ty-caption', on ? 'text-primary-foreground/80' : 'text-muted-foreground')}>{faixa}</span>
      </span>
      {on && <Check className="size-4 shrink-0" aria-hidden />}
    </button>
  )
}

export function AgendarEntrevistaCandidato({ brand, vaga = 'Desenvolvedor Backend' }: { brand?: string; vaga?: string }) {
  const { t } = useTranslation('agendamento')
  const [etapa, setEtapa] = useState<Etapa>('identificacao')
  const [nome, setNome] = useState('') // identificação confirmada
  const [email, setEmail] = useState('')
  const [nomeInput, setNomeInput] = useState('') // campos do formulário de identificação
  const [emailInput, setEmailInput] = useState('')
  const [dias, setDias] = useState<DiaDisponivel[]>([]) // datas confirmadas
  const [periodos, setPeriodos] = useState<Periodo[]>([]) // confirmados
  const [pendDias, setPendDias] = useState<string[]>([]) // ISOs marcados (ainda não confirmados)
  const [pendPeriodos, setPendPeriodos] = useState<Periodo[]>([])
  const [slots, setSlots] = useState<SlotCruzado[]>([])
  const [escolhido, setEscolhido] = useState<SlotCruzado | null>(null)
  const logRef = useRef<HTMLDivElement>(null)

  // Datas concretas oferecidas: os próximos 10 dias úteis (estável durante a sessão da tela).
  const diasDisponiveis = useMemo(() => proximosDiasUteis(new Date(), 10), [])

  // Rótulo legível dos entrevistadores para a fala do bot: "Marina Albuquerque (RH) e Carlos Mendes (Gestor)".
  const pessoasLabel = useMemo(
    () => PESSOAS.map((p) => { const [nome, papel] = p.split(' · '); return `${nome} (${papel})` }).join(t('conector')),
    [t],
  )

  // Rola o transcript para a última mensagem sempre que a conversa avança (respeita prefers-reduced-motion).
  useEffect(() => {
    const el = logRef.current
    if (el && typeof el.scrollTo === 'function') el.scrollTo({ top: el.scrollHeight, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [etapa])

  const toggle = <T,>(set: (fn: (cur: T[]) => T[]) => void, v: T) =>
    set((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]))

  const idOk = nomeInput.trim() !== '' && EMAIL_RE.test(emailInput.trim())
  const identificar = () => {
    if (!idOk) return
    setNome(nomeInput.trim())
    setEmail(emailInput.trim())
    setEtapa('dias')
  }

  const confirmarDias = () => {
    setDias(diasDisponiveis.filter((d) => pendDias.includes(d.iso))) // mantém a ordem cronológica da lista
    setEtapa('periodos')
  }
  const confirmarPeriodos = () => {
    const escolha = PERIODOS.filter((p) => pendPeriodos.includes(p)) // mantém a ordem canônica (manhã, tarde)
    setPeriodos(escolha)
    setSlots(horariosEmDatas(dias, escolha, PESSOAS))
    setEtapa('horarios')
  }
  const escolherSlot = (s: SlotCruzado) => { setEscolhido(s); setEtapa('confirmado') }
  const recomecar = () => {
    setEtapa('dias'); setDias([]); setPeriodos([]); setPendDias([]); setPendPeriodos([]); setSlots([]); setEscolhido(null)
  }

  const fmtDiaData = (s: SlotCruzado) => `${diaSemanaNome(s.dia)}, ${String(s.d).padStart(2, '0')}/${String(s.m + 1).padStart(2, '0')}`
  const quandoLongo = (s: SlotCruzado) => t('sucesso.quando', { dia: diaSemanaLongo(s.dia), data: `${String(s.d).padStart(2, '0')}/${String(s.m + 1).padStart(2, '0')}/${s.y}`, hora: s.hora })

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <CandidatoHeader brand={brand} />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:px-6">
        <div className="mb-5">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">{t('titulo')}</h1>
          <p className="mt-1 ty-body-sm text-muted-foreground">{t('subtitulo')}</p>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-surface-ring">
          {/* Persona do assistente (sem menção a IA) */}
          <header className="flex items-center gap-3 border-b border-border/50 p-4">
            <span className="relative inline-flex shrink-0" aria-hidden>
              <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground"><CalendarClock className="size-5" /></span>
              <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-card bg-success" />
            </span>
            <div className="min-w-0">
              <p className="ty-body-sm font-semibold text-foreground">{t('assistente.nome')}</p>
              <p className="flex items-center gap-1.5 ty-caption text-muted-foreground">
                <span className="size-1.5 rounded-full bg-success" aria-hidden /> <span className="text-success-text">{t('assistente.online')}</span> · {t('assistente.papel')}
              </p>
            </div>
          </header>

          {/* Transcript — role=log + aria-live: cada nova fala do bot é anunciada ao leitor de tela */}
          <div ref={logRef} role="log" aria-live="polite" aria-label={t('logAria')} className="max-h-[52vh] min-h-[16rem] flex-1 space-y-3 overflow-y-auto p-4">
            <Bubble de="bot">{t('bot.saudacaoInicial')}</Bubble>

            {etapa !== 'identificacao' && (
              <>
                <Bubble de="user">{nome} · {email}</Bubble>
                <Bubble de="bot">{t('bot.encontrado', { nome, vaga })}</Bubble>
                <Bubble de="bot">{t('bot.perguntaDias')}</Bubble>
              </>
            )}

            {etapa !== 'identificacao' && etapa !== 'dias' && (
              <>
                <Bubble de="user">{dias.map((d) => `${diaSemanaNome(d.dia)} ${String(d.d).padStart(2, '0')}/${String(d.m + 1).padStart(2, '0')}`).join(', ')}</Bubble>
                <Bubble de="bot">{t('bot.perguntaPeriodos')}</Bubble>
              </>
            )}

            {(etapa === 'horarios' || etapa === 'confirmado') && (
              <>
                <Bubble de="user">{periodos.map((p) => t(`periodo.${p}`)).join(', ')}</Bubble>
                <Bubble de="bot">{t('bot.cruzando', { pessoas: pessoasLabel })}</Bubble>
                <Bubble de="bot">{slots.length === 0 ? t('bot.semHorarios') : t('bot.ofereceHorarios')}</Bubble>
              </>
            )}

            {etapa === 'confirmado' && escolhido && (
              <>
                <Bubble de="user">{fmtDiaData(escolhido)} · {escolhido.hora}</Bubble>
                <Bubble de="bot">{t('bot.confirmado', { vaga, quando: quandoLongo(escolhido) })}</Bubble>
              </>
            )}
          </div>

          {/* Composer — as respostas rápidas do candidato, conforme a etapa */}
          <div className="border-t border-border/50 p-4 pb-[calc(1rem_+_env(safe-area-inset-bottom))]">
            {etapa === 'identificacao' && (
              <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); identificar() }}>
                <div className="space-y-1.5">
                  <Label htmlFor="ag-nome">{t('identificacao.nome')}</Label>
                  <Input id="ag-nome" value={nomeInput} onChange={(e) => setNomeInput(e.target.value)} placeholder={t('identificacao.nomePlaceholder')} autoComplete="name" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ag-email">{t('identificacao.email')}</Label>
                  <Input id="ag-email" type="email" inputMode="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder={t('identificacao.emailPlaceholder')} autoComplete="email" />
                </div>
                <Button type="submit" className="w-full" disabled={!idOk}>{t('identificacao.continuar')}</Button>
              </form>
            )}

            {etapa === 'dias' && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5" role="group" aria-label={t('composer.diasAria')}>
                  {diasDisponiveis.map((d) => (
                    <DiaChip
                      key={d.iso} on={pendDias.includes(d.iso)} onClick={() => toggle(setPendDias, d.iso)}
                      nome={diaSemanaNome(d.dia)} data={`${String(d.d).padStart(2, '0')}/${String(d.m + 1).padStart(2, '0')}`}
                      aria={`${diaSemanaLongo(d.dia)}, ${dataMedia(d.y, d.m, d.d)}`}
                    />
                  ))}
                </div>
                <Button className="w-full" disabled={pendDias.length === 0} onClick={confirmarDias}>{t('composer.confirmarDias')}</Button>
              </div>
            )}

            {etapa === 'periodos' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="group" aria-label={t('composer.periodosAria')}>
                  {PERIODOS.map((p) => (
                    <PeriodoCard key={p} on={pendPeriodos.includes(p)} onClick={() => toggle(setPendPeriodos, p)} icon={PERIODO_ICON[p]} nome={t(`periodo.${p}`)} faixa={t(`periodoFaixa.${p}` as 'periodoFaixa.manha')} />
                  ))}
                </div>
                <Button className="w-full" disabled={pendPeriodos.length === 0} onClick={confirmarPeriodos}>{t('composer.confirmarPeriodos')}</Button>
              </div>
            )}

            {etapa === 'horarios' && (
              <div className="space-y-3">
                {slots.length > 0 && (
                  <div className="flex flex-wrap gap-2" role="group" aria-label={t('composer.horariosAria')}>
                    {slots.map((s) => (
                      <button
                        key={s.iso + s.hora} type="button"
                        onClick={() => escolherSlot(s)}
                        aria-label={t('composer.slotAria', { quando: `${diaSemanaLongo(s.dia)} ${s.hora}` })}
                        className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3.5 py-2 ty-body-sm font-medium text-success-text transition-colors hover:bg-success/15 focus-visible:focus-ring"
                      >
                        <CalendarClock className="size-3.5 shrink-0" aria-hidden />
                        <span className="tabular-nums">{fmtDiaData(s)} · {s.hora}</span>
                      </button>
                    ))}
                  </div>
                )}
                <Button variant="outline" className="w-full" onClick={recomecar}><RotateCcw aria-hidden /> {t('composer.recomecar')}</Button>
              </div>
            )}

            {etapa === 'confirmado' && escolhido && (
              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-xl bg-success/10 p-3.5 text-success-text">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden />
                  <div className="min-w-0 space-y-1">
                    <p className="ty-body-sm font-semibold">{t('sucesso.titulo')}</p>
                    <p className="ty-body-sm text-foreground">{quandoLongo(escolhido)}</p>
                    <p className="ty-caption text-muted-foreground">{t('sucesso.nota')}</p>
                  </div>
                </div>
                <Button variant="ghost" className="w-full" onClick={recomecar}><RotateCcw aria-hidden /> {t('sucesso.recomecar')}</Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
