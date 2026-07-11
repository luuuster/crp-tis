/**
 * Entrevista conversacional (visão do CANDIDATO) — a 2ª etapa do processo, logo após a candidatura.
 * O candidato conversa com um "entrevistador" (que se apresenta como parte do TIME DE RECRUTAMENTO): ele
 * faz algumas perguntas, o candidato responde por texto, e ao final as respostas + o currículo são
 * avaliados, resultando num veredito (avançou / não avançou nesta etapa).
 *
 * MOCK, sem backend: as perguntas são prosa fixa ligada à vaga (como o resto do documento da vaga); o
 * veredito é uma HEURÍSTICA determinística sobre as respostas (respostas substantivas → avança). Cronômetro
 * de 30 min: ao zerar, encerra e avalia o que houver. 100% token-driven, multi-marca, claro/escuro, WCAG AA.
 *
 * Nota de produto: NADA é apresentado como "IA" ao candidato — é um "entrevistador" do time de recrutamento
 * (ver memória: não expor IA ao candidato). No funil interno, isto alimenta a etapa "Análise de currículo".
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Clock, Info, MessagesSquare, Send } from 'lucide-react'

import { cn } from '@/lib/utils'
import { CARD } from '@/lib/surfaces'
import type { Mode } from '@/lib/useBrandMode'
import { CandidatoHeader } from '@/components/composicoes/candidato/CandidatoHeader'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'

const DURACAO_SEG = 30 * 60 // 30 minutos
const RESP_MIN = 40 // nº de caracteres para uma resposta contar como "substantiva" (heurística do veredito)

type Fase = 'aquecimento' | 'experiencia' | 'tecnica' | 'encerramento'

// Perguntas MOCK ligadas à vaga (prosa pt-BR, fora do i18n — como as perguntas da 2ª etapa antiga e o
// documento da vaga). No produto viriam do roteiro de entrevista configurado pelo recrutador.
const PERGUNTAS: { fase: Fase; texto: string }[] = [
  { fase: 'aquecimento', texto: 'Para começar, o que mais te motivou a buscar uma oportunidade como desenvolvedor(a) backend na nossa empresa?' },
  { fase: 'experiencia', texto: 'Conte sobre um projeto recente em que você atuou no backend: qual era o desafio e qual foi a sua contribuição direta para resolvê-lo?' },
  { fase: 'tecnica', texto: 'Como você garante qualidade e escalabilidade nas APIs que constrói? Fale sobre testes, versionamento e boas práticas que costuma adotar no dia a dia.' },
  { fase: 'encerramento', texto: 'Por fim, o que você procura no dia a dia de um time e o que espera de um próximo passo na sua carreira?' },
]

type Estado = 'entrevista' | 'analisando' | 'veredito'

// Bolha de mensagem: entrevistador à esquerda (avatar), candidato à direita (tom da marca).
function Bubble({ de, children }: { de: 'bot' | 'user'; children: ReactNode }) {
  const bot = de === 'bot'
  return (
    <div className={cn('flex items-end gap-2 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-300', bot ? 'justify-start' : 'justify-end')}>
      {bot && (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground" aria-hidden>
          <MessagesSquare className="size-4" />
        </span>
      )}
      <div className={cn('max-w-[80%] space-y-1 rounded-2xl px-3.5 py-2.5 ty-body-sm leading-relaxed', bot ? 'rounded-bl-sm bg-muted/60 text-foreground' : 'rounded-br-sm bg-primary text-primary-foreground whitespace-pre-wrap')}>
        {children}
      </div>
    </div>
  )
}

export function EntrevistaConversacional({ brand, mode, onCycleBrand, onToggleMode, nome, vaga, onConcluir, onSair, publico = false }: {
  brand?: string
  mode?: Mode
  onCycleBrand?: () => void
  onToggleMode?: () => void
  nome: string
  vaga: string
  onConcluir: () => void
  onSair?: () => void
  publico?: boolean
}) {
  const { t } = useTranslation('inscricao')
  const [estado, setEstado] = useState<Estado>('entrevista')
  const [idx, setIdx] = useState(0) // pergunta atual
  const [respostas, setRespostas] = useState<string[]>([])
  const [resposta, setResposta] = useState('')
  const [aprovado, setAprovado] = useState(false)
  const [segundos, setSegundos] = useState(DURACAO_SEG)
  const logRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(true)
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])
  // Refs com os valores atuais para o callback do cronômetro ler sem recriar o intervalo a cada render.
  const respostasRef = useRef<string[]>([])
  const segundosRef = useRef(DURACAO_SEG)
  useEffect(() => { respostasRef.current = respostas }, [respostas])
  useEffect(() => { segundosRef.current = segundos }, [segundos])

  // Rola o transcript para a última mensagem ao avançar (respeita prefers-reduced-motion).
  useEffect(() => {
    const el = logRef.current
    if (el && typeof el.scrollTo === 'function') el.scrollTo({ top: el.scrollHeight, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [idx, estado])

  // Avalia as respostas (heurística: quantas são substantivas) + currículo → veredito, após um instante.
  const finalizar = (todas: string[]) => {
    setEstado('analisando')
    window.setTimeout(() => {
      if (!mountedRef.current) return
      const bons = todas.filter((r) => r.trim().length >= RESP_MIN).length
      setAprovado(bons >= Math.ceil(PERGUNTAS.length / 2))
      setEstado('veredito')
    }, 1600)
  }

  // Cronômetro: conta enquanto a entrevista está em andamento; ao zerar, encerra com o que houver. A
  // expiração é tratada DENTRO do callback do intervalo (não num efeito), lendo os valores atuais por ref.
  useEffect(() => {
    if (estado !== 'entrevista') return
    const id = window.setInterval(() => {
      if (segundosRef.current <= 1) { window.clearInterval(id); setSegundos(0); finalizar(respostasRef.current) }
      else setSegundos((s) => s - 1)
    }, 1000)
    return () => window.clearInterval(id)
  }, [estado])

  const enviar = () => {
    const r = resposta.trim()
    if (!r || estado !== 'entrevista') return
    const todas = [...respostas, r]
    setRespostas(todas)
    setResposta('')
    if (idx + 1 >= PERGUNTAS.length) finalizar(todas)
    else setIdx(idx + 1)
  }

  const mmss = `${String(Math.floor(segundos / 60)).padStart(2, '0')}:${String(segundos % 60).padStart(2, '0')}`
  const faseAtual = PERGUNTAS[Math.min(idx, PERGUNTAS.length - 1)].fase
  const progresso = estado === 'veredito' ? 100 : Math.round((idx / PERGUNTAS.length) * 100)
  const saudacao = [
    `Olá ${nome}, muito obrigado por estar aqui conosco hoje!`,
    'Sou parte do time de recrutamento e vou conversar um pouco sobre a sua trajetória.',
    'Nosso bate-papo é descontraído, sem pressões — quero entender melhor as suas experiências e expectativas.',
  ]

  const perguntaN = Math.min(idx + 1, PERGUNTAS.length)
  const faseLabel = t(`entrevista.fase.${faseAtual}` as 'entrevista.fase.aquecimento')

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <CandidatoHeader brand={brand} mode={mode} onCycleBrand={onCycleBrand} onToggleMode={onToggleMode} onSair={onSair} publico={publico} />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-8 lg:px-8">
        {/* Card único de chat: entrevistador + cronômetro no topo, meta enxuta, conversa e composer. */}
        <div className={cn('flex flex-1 flex-col overflow-hidden', CARD)}>
          {/* Persona do entrevistador (sem menção a IA) + cronômetro como pill discreto */}
          <header className="flex items-center gap-3 border-b border-border/50 p-4">
            <span className="relative inline-flex shrink-0" aria-hidden>
              <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground"><MessagesSquare className="size-5" /></span>
              <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-card bg-success" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="ty-body-sm font-semibold text-foreground">{t('entrevista.titulo')}</p>
              <p className="flex items-center gap-1.5 ty-caption text-muted-foreground"><span className="size-1.5 rounded-full bg-success" aria-hidden /> {t('entrevista.persona')}</p>
            </div>
            {estado === 'entrevista' && (
              <span
                role="timer" aria-label={t('entrevista.tempoRestante', { tempo: mmss })}
                className={cn('flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 ty-caption font-semibold tabular-nums', segundos <= 300 ? 'bg-warning/10 text-warning-text' : 'bg-muted text-muted-foreground')}
              >
                <Clock className="size-3.5 shrink-0" aria-hidden /> {mmss}
              </span>
            )}
          </header>

          {/* Meta enxuta: candidato · vaga */}
          <div className="flex flex-wrap gap-x-5 gap-y-1 border-b border-border/50 px-4 py-2.5 ty-caption">
            <span className="text-muted-foreground">{t('entrevista.candidatoLabel')}: <span className="font-medium text-foreground">{nome}</span></span>
            <span className="text-muted-foreground">{t('entrevista.vagaLabel')}: <span className="font-medium text-foreground">{vaga}</span></span>
          </div>

          {/* Conversa */}
          <div ref={logRef} role="log" aria-live="polite" aria-label={t('entrevista.logAria')} className="min-h-[16rem] flex-1 space-y-3 overflow-y-auto p-4">
            <Bubble de="bot">{saudacao.map((l, i) => <span key={i} className="block">{l}</span>)}</Bubble>

            {respostas.map((r, i) => (
              <div key={i} className="space-y-3">
                <Bubble de="bot">{PERGUNTAS[i].texto}</Bubble>
                <Bubble de="user">{r}</Bubble>
              </div>
            ))}

            {estado === 'entrevista' && idx < PERGUNTAS.length && <Bubble de="bot">{PERGUNTAS[idx].texto}</Bubble>}

            {estado === 'analisando' && (
              <Bubble de="bot"><span className="flex items-center gap-2"><Spinner className="size-4" /> {t('entrevista.analisando')}</span></Bubble>
            )}
          </div>

          {/* Composer / veredito */}
          <div className="border-t border-border/50 p-4 pb-[calc(1rem_+_env(safe-area-inset-bottom))]">
            {estado === 'entrevista' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="ent-resposta" className="ty-body-sm">{t('entrevista.respostaLabel')}</Label>
                  <span className="ty-caption tabular-nums text-muted-foreground">{t('entrevista.perguntaContador', { n: perguntaN, total: PERGUNTAS.length })} · {faseLabel}</span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={progresso} aria-valuemin={0} aria-valuemax={100} aria-label={t('entrevista.perguntaContador', { n: perguntaN, total: PERGUNTAS.length })}>
                  <div className="h-full rounded-full bg-primary motion-safe:transition-all motion-safe:duration-500" style={{ width: `${progresso}%` }} />
                </div>
                <Textarea
                  id="ent-resposta" rows={3} value={resposta} onChange={(e) => setResposta(e.target.value)}
                  placeholder={t('entrevista.respostaPlaceholder')}
                  onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); enviar() } }}
                />
                <div className="flex justify-end">
                  <Button onClick={enviar} disabled={resposta.trim() === ''}><Send aria-hidden /> {t('entrevista.enviar')}</Button>
                </div>
              </div>
            )}

            {estado === 'analisando' && (
              <p className="flex items-center justify-center gap-2 py-2 ty-body-sm text-muted-foreground"><Spinner className="size-4" /> {t('entrevista.analisando')}</p>
            )}

            {estado === 'veredito' && (
              <div className="space-y-4 py-2 text-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-500">
                <span aria-hidden className={cn('mx-auto grid size-14 place-items-center rounded-full ring-[6px]', aprovado ? 'bg-success/15 text-success-text ring-success/10' : 'bg-destructive/15 text-destructive-text ring-destructive/10')}>
                  {aprovado ? <CheckCircle2 className="size-7" /> : <Info className="size-7" />}
                </span>
                <div className="space-y-1.5">
                  <p className="font-heading text-lg font-bold tracking-tight text-foreground">{aprovado ? t('entrevista.veredito.aprovadoTitulo') : t('entrevista.veredito.reprovadoTitulo')}</p>
                  <p className="mx-auto max-w-md ty-body-sm leading-relaxed text-muted-foreground">{aprovado ? t('entrevista.veredito.aprovadoTexto') : t('entrevista.veredito.reprovadoTexto')}</p>
                </div>
                <Button className="w-full sm:w-auto sm:min-w-56" onClick={onConcluir}>{t('entrevista.veredito.irPainel')}</Button>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé da demo — saída pro app interno (a página real seria pública, sem isso). */}
        {onSair && (
          <p className="mt-6 text-center ty-caption text-muted-foreground">
            {t('rodape.demo')}{' '}
            <button type="button" onClick={onSair} className="font-medium text-link underline-offset-4 hover:underline focus-visible:focus-ring">{t('rodape.voltar')}</button>
          </p>
        )}
      </main>
    </div>
  )
}
