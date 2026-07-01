/**
 * Página PÚBLICA de inscrição na vaga (visão do CANDIDATO — não do recrutador). É a tela que o
 * candidato abre ao clicar no link da vaga divulgada (ex.: LinkedIn): vê a vaga e envia nome, contato
 * e currículo (PDF). Chrome próprio e leve (logo + coluna central), SEM a sidebar do app interno.
 *
 * 100% token-driven (cor/tipografia/altura do contrato CRP), multi-marca, claro/escuro e WCAG 2.2 AA.
 * react-hook-form + zod; upload de currículo acessível (clique/arrastar/teclado), igual ao cadastro.
 *
 * MOCK: sem backend. O upload só guarda o nome do arquivo; o "anti-robô" é uma simulação visual de
 * captcha — o código é TEXTO real (legível por leitor de tela via aria-label), então é acessível, mas
 * NÃO é uma proteção real. No produto, entraria um captcha de verdade (com alternativa acessível).
 */
import { useEffect, useRef, useState } from 'react'
import type { TFunction } from 'i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, Building2, Check, CheckCircle2, ChevronLeft, FileText, KeyRound, Send, ShieldCheck, Upload, X } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { CARD } from '@/lib/surfaces'
import { focusRing } from '@/lib/focus'
import { genCaptcha } from '@/lib/captcha'
import { CandidatoHeader } from '@/components/candidato/CandidatoHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CaptchaBox } from '@/components/CaptchaBox'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { VagaDocumento, type Briefing, type Perfil } from '@/lib/vaga'
import { estaLogado, lerCandidato } from '@/lib/candidatoSessao'
import { ConfirmarCandidaturaDialog } from '@/pages/ConfirmarCandidatura'
import { SegundaEtapa } from '@/pages/SegundaEtapa'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_MB = 10

// Vaga que o candidato está vendo — briefing + perfil completos (a MESMA estrutura do recrutador, em
// @/lib/vaga), pra a aba "Descrição" reusar o documento real (VagaDocumento). No mockup é um exemplo;
// no produto viria do link público da vaga criada no Gerador.
export type VagaInscricao = { briefing: Briefing; perfil: Perfil }
const VAGA_EXEMPLO: VagaInscricao = {
  briefing: {
    cargo: 'Desenvolvedor Backend', nivel: 'Pleno', modelo: 'Remoto', cliente: 'TIS Talent AI Platform', gestor: 'Carlos Mendes',
    desafio: 'Evoluir os serviços de backend que sustentam o motor de recomendação de candidatos, com foco em performance, observabilidade e qualidade.',
    objetivo: 'Entregar APIs estáveis e bem testadas, reduzir a latência das integrações e ampliar a cobertura de testes automatizados do time.',
    local: 'São Paulo — SP (remoto)', horario: '09h às 18h', carga: '40h semanais', motivo: 'Aumento do quadro', quantidade: 1, prazo: 30,
    budget: 'R$ 8.000 a R$ 12.000', modalidade: 'CLT',
    beneficios: ['Vale-refeição', 'Plano de saúde', 'Plano odontológico', 'Auxílio home-office', 'Day-off no aniversário', 'Bônus anual'],
    processoSeletivo: ['Inscrição e triagem por IA', 'Entrevista com RH', 'Teste técnico', 'Entrevista com o gestor', 'Proposta'],
  },
  perfil: {
    formacao: 'Ensino superior em Computação ou áreas correlatas (ou experiência equivalente)',
    experiencia: '2 a 4 anos com desenvolvimento backend',
    exigencias: ['Boas práticas de código e testes', 'Versionamento com Git', 'Vivência em time ágil'],
    stackObrigatoria: ['Node.js', 'TypeScript', 'PostgreSQL', 'API REST', 'Docker'],
    conhecimentosDesejaveis: ['Kafka', 'AWS', 'Microsserviços', 'CI/CD'],
    responsabilidades: 'Desenvolver e manter APIs e serviços do backend. Escrever testes automatizados. Revisar o código dos colegas. Participar das decisões técnicas do time. Acompanhar a performance e a observabilidade dos serviços.',
    habilidades: ['Comunicação clara', 'Autonomia', 'Colaboração', 'Pensamento analítico'],
    justificativa: 'O crescimento da demanda do produto exige reforço no time de plataforma.',
  },
}

// Emoji por benefício (decorativo) — deixa a lista mais "humana" na vaga pública. Casa por palavra-chave.
const EMOJI_BENEFICIO = (b: string): string => {
  const n = b.toLowerCase()
  if (n.includes('refei')) return '🍽️'
  if (n.includes('transporte')) return '🚌'
  if (n.includes('médic') || n.includes('saúde') || n.includes('saude')) return '🩺'
  if (n.includes('odonto')) return '🦷'
  if (n.includes('vida')) return '🛡️'
  if (n.includes('home') || n.includes('office')) return '🏠'
  if (n.includes('aniversár') || n.includes('day')) return '🎂'
  if (n.includes('bônus') || n.includes('bonus')) return '💰'
  if (n.includes('gym') || n.includes('pass')) return '🏋️'
  if (n.includes('creche')) return '🧸'
  if (n.includes('stock')) return '📈'
  if (n.includes('flex')) return '🕒'
  return '✨'
}

// "Sobre a empresa" — prosa mockada (pt-BR, como o resto do documento da vaga; fora do i18n). Aparece
// depois dos benefícios, no padrão de anúncio de vaga público.
const SOBRE_TIS = {
  titulo: 'Sobre a TIS',
  headline: 'Na TIS, contratar deixou de ser sorte e virou ciência.',
  paragrafos: [
    'Somos uma plataforma brasileira de Talent AI: usamos inteligência artificial para conectar pessoas e empresas com mais precisão, menos viés e muito mais agilidade em cada etapa do processo seletivo.',
    'Aqui, tecnologia e gente caminham juntas. Acreditamos em times diversos, decisões baseadas em dados e em experiências justas — tanto para quem contrata quanto para quem se candidata.',
    'Se você busca um ambiente dinâmico, com autonomia, desafios reais e espaço para crescer, encontrou o lugar certo.',
  ],
  fecho: 'TIS Talent AI. A contratação que evolui com você.',
}

// Cada aba tem a SUA rota (URL própria) — sincronizada via History API, sem router/dep extra. Slugs ASCII
// (sem acento, pra URL limpa). `pathToTab` é tolerante: qualquer caminho com "inscricao" = aba de inscrição.
const TAB_PATH: Record<string, string> = { descricao: '/descricao_da_vaga', inscricao: '/inscricao_da_vaga' }
const pathToTab = (p: string) => (p.toLowerCase().includes('inscricao') ? 'inscricao' : 'descricao')

// Rotas do LINK PÚBLICO em breadcrumb: base → formulário → enviado. (O dev server reescreve as versões em
// minúsculas para o candidato.html — ver vite.candidato.config.ts.)
const PUB_BASE = '/linkpublico'
const PUB_INSCRICAO = '/linkpublico/Inscricao_na_vaga'
const PUB_ENVIADA = '/linkpublico/Inscricao_na_vaga/Inscricao_enviada'

function makeSchema(t: TFunction<'inscricao'>) {
  return z.object({
    nome: z.string().trim().min(1, t('validacao.nomeObrigatorio')),
    cpf: z.string().trim().optional(),
    email: z.string().min(1, t('validacao.emailObrigatorio')).refine((v) => EMAIL_RE.test(v), t('validacao.emailInvalido')),
    telefone: z.string().trim().min(1, t('validacao.telefoneObrigatorio')).refine((v) => v.replace(/\D/g, '').length >= 8, t('validacao.telefoneInvalido')),
    captcha: z.string().trim().min(1, t('validacao.captchaObrigatorio')),
  })
}
type Values = z.infer<ReturnType<typeof makeSchema>>

// Rótulo com marca de obrigatório (asterisco decorativo + "(obrigatório)" sr-only).
function ReqMark() {
  const { t } = useTranslation('inscricao')
  return (
    <>
      <span aria-hidden className="ml-0.5 text-destructive-text">*</span>
      <span className="sr-only"> {t('form.obrigatorio')}</span>
    </>
  )
}

export function InscricaoVaga({ vaga = VAGA_EXEMPLO, brand, onSair, publico = false }: { vaga?: VagaInscricao; brand?: string; onSair?: () => void; publico?: boolean }) {
  const { t } = useTranslation('inscricao')
  const vagaTitulo = `${vaga.briefing.cargo} · ${vaga.briefing.nivel}`
  // Logado (sessão em localStorage, compartilhada entre abas): candidatura é só CONFIRMAR num modal — sem o
  // formulário público. Deslogado (link público, ex.: LinkedIn) → formulário completo, como antes.
  // `publico` força a visão deslogada (link divulgado fora do sistema): mesmo com sessão, mostra o formulário.
  const logado = !publico && estaLogado()
  const candidato = lerCandidato()
  const [modalOpen, setModalOpen] = useState(false)

  // Aba ativa derivada da URL (cada aba tem sua rota). Normaliza a raiz na 1ª carga e respeita back/forward.
  // No link PÚBLICO (/linkpublico), a URL fica fixa e as abas são só em memória — não viramos o endereço para
  // /descricao_da_vaga (senão o link divulgado "some" da barra e perde o modo público num reload).
  const [aba, setAba] = useState(() => pathToTab(window.location.pathname))
  useEffect(() => {
    if (publico) {
      // Link público: a URL segue a trilha breadcrumb (/linkpublico → /Inscricao_na_vaga → …). Back/forward
      // só atualiza a aba (o estado de "enviado" não volta — mock sem backend).
      const onPop = () => setAba(pathToTab(window.location.pathname))
      window.addEventListener('popstate', onPop)
      return () => window.removeEventListener('popstate', onPop)
    }
    const conhecida = window.location.pathname === TAB_PATH.descricao || window.location.pathname === TAB_PATH.inscricao
    if (!conhecida) window.history.replaceState(null, '', TAB_PATH[aba])
    const onPop = () => setAba(pathToTab(window.location.pathname))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- efeito de montagem (normaliza URL + assina popstate)
  }, [])
  const trocarAba = (v: string) => {
    setAba(v)
    if (publico) {
      const dest = v === 'inscricao' ? PUB_INSCRICAO : PUB_BASE
      if (window.location.pathname !== dest) window.history.pushState(null, '', dest)
      return
    }
    if (window.location.pathname !== TAB_PATH[v]) window.history.pushState(null, '', TAB_PATH[v])
  }

  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvError, setCvError] = useState<string | null>(null)
  const [codigo, setCodigo] = useState(genCaptcha)
  const [enviado, setEnviado] = useState(false)
  // 2ª etapa do processo (questionário) — aberta a partir da tela de sucesso. `nomeEnviado` alimenta a
  // saudação: vem do form (deslogado) ou da sessão (logado).
  const [segundaEtapa, setSegundaEtapa] = useState(false)
  const [nomeEnviado, setNomeEnviado] = useState('')

  const form = useForm<Values>({
    resolver: zodResolver(makeSchema(t)),
    defaultValues: { nome: '', cpf: '', email: '', telefone: '', captcha: '' },
    mode: 'onTouched',
  })
  const { isSubmitting } = form.formState

  // Guarda de montagem: o envio simulado resolve após ~1.2s; se desmontar nesse meio-tempo, não
  // dispara toast/estado de um componente já morto.
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  function pickCv(file?: File) {
    if (!file) return
    if (!/\.pdf$/i.test(file.name)) return setCvError(t('validacao.curriculoFormato'))
    if (file.size > MAX_MB * 1024 * 1024) return setCvError(t('validacao.curriculoTamanho', { max: MAX_MB }))
    setCvError(null)
    setCvFile(file)
  }

  function novoCaptcha() {
    setCodigo(genCaptcha())
    form.setValue('captcha', '')
  }

  async function onSubmit(values: Values) {
    let invalido = false
    if (!cvFile) { setCvError(t('validacao.curriculoObrigatorio')); invalido = true }
    if (values.captcha.trim().toUpperCase() !== codigo) {
      form.setError('captcha', { message: t('validacao.captchaInvalido') })
      novoCaptcha()
      invalido = true
    }
    if (invalido) return
    await new Promise((r) => setTimeout(r, 1200)) // simula o envio
    if (!mountedRef.current) return
    toast.success(t('toast.enviada'))
    setNomeEnviado(values.nome.trim())
    setEnviado(true)
    if (publico) window.history.pushState(null, '', PUB_ENVIADA)
  }

  function outraInscricao() {
    form.reset()
    setCvFile(null)
    setCvError(null)
    novoCaptcha()
    setEnviado(false)
    if (publico) window.history.pushState(null, '', PUB_INSCRICAO)
  }

  // 2ª etapa: tela própria (questionário). Substitui a inscrição inteira enquanto está aberta.
  if (segundaEtapa) {
    return (
      <SegundaEtapa
        brand={brand}
        nome={nomeEnviado || candidato.nome}
        vaga={vagaTitulo}
        onConcluir={() => { window.location.href = '/painel' }}
        onSair={onSair}
        publico={publico}
      />
    )
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Chrome leve do portal do candidato — marca (link pro mural quando logado) + conta. */}
      <CandidatoHeader brand={brand} onSair={onSair} publico={publico} />

      {/* main rola por DENTRO; o rodapé de ação fica preso embaixo (mesmo padrão do shell do recrutador). */}
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl px-6 py-10 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
        {enviado ? (
          // Estado de sucesso — confirma o envio e recapitula o essencial.
          <div className="mx-auto max-w-md rounded-2xl border border-success/25 bg-success/5 p-8 text-center">
            <span aria-hidden className="mx-auto grid size-16 place-items-center rounded-full bg-success/15 text-success-text ring-[6px] ring-success/10 motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:duration-500">
              <CheckCircle2 className="size-9" />
            </span>
            <h1 className="mt-5 font-heading text-2xl font-bold tracking-tight text-foreground">{t('sucesso.titulo')}</h1>
            <p className="mx-auto mt-2 max-w-sm ty-body text-muted-foreground">{t('sucesso.descricao', { vaga: vagaTitulo })}</p>
            {/* Aviso de senha provisória só p/ quem NÃO está logado (acabou de criar conta pela inscrição). */}
            {!logado && (
              <div className="mx-auto mt-5 flex max-w-sm items-start gap-2.5 rounded-xl bg-primary/5 p-3 text-left ring-1 ring-primary/15">
                <KeyRound className="mt-0.5 size-4 shrink-0 text-primary-text" aria-hidden />
                <p className="ty-caption text-muted-foreground">{t('sucesso.emailAviso')}</p>
              </div>
            )}
            {/* Continuar o processo é a ação principal; as demais ficam secundárias. */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              <Button onClick={() => setSegundaEtapa(true)}>{t('sucesso.segundaEtapa')} <ArrowRight aria-hidden /></Button>
              {logado ? (
                <Button variant="outline" onClick={() => { window.location.href = '/painel' }}>{t('sucesso.verVagas')}</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => { window.location.href = '/acesso' }}>{t('sucesso.acessar')}</Button>
                  <Button variant="ghost" onClick={outraInscricao}>{t('sucesso.outra')}</Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Título da vaga só p/ leitor de tela (h1 da página) — o visual fica no documento da vaga (aba). */}
            <h1 className="sr-only">{vagaTitulo}</h1>
            {/* Logado nunca vê o form (só descrição + modal de confirmar). Deslogado: descrição ⇄ inscrição pelo rodapé. */}
            {(logado || aba === 'descricao') ? (
              <div className="space-y-6">
                <VagaDocumento data={vaga.briefing} perfil={vaga.perfil} beneficioEmoji={EMOJI_BENEFICIO} />
                {/* Sobre a empresa — depois dos benefícios (típico de anúncio de vaga público). */}
                <section aria-labelledby="sobre-empresa" className={cn(CARD, 'space-y-4 p-6 sm:p-8')}>
                  <span className="flex items-center gap-1.5 ty-label-sm uppercase text-muted-foreground"><Building2 className="size-3.5" aria-hidden /> {SOBRE_TIS.titulo}</span>
                  <h2 id="sobre-empresa" className="ty-h4 text-foreground">{SOBRE_TIS.headline}</h2>
                  <div className="space-y-3">
                    {SOBRE_TIS.paragrafos.map((p, i) => <p key={i} className="ty-body leading-relaxed text-muted-foreground">{p}</p>)}
                  </div>
                  <p className="ty-body font-semibold text-foreground">{SOBRE_TIS.fecho}</p>
                </section>
              </div>
            ) : (
              <div className="mx-auto max-w-2xl space-y-6">
                <div>
                  <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">{t('header.titulo')}</h2>
                  <p className="mt-1 ty-body-sm text-muted-foreground">{t('header.subtitulo')}</p>
                </div>

            <Form {...form}>
              {/* eslint-disable-next-line react-hooks/refs -- RHF: handleSubmit acessa refs internos em render; padrão da lib (igual Login/Register) */}
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6" noValidate>
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel><span>{t('form.nome')}<ReqMark /></span></FormLabel>
                      <FormControl>
                        <Input placeholder={t('form.nomePlaceholder')} autoComplete="name" maxLength={200} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="gap-1.5">{t('form.cpf')} <span className="ty-caption font-normal text-muted-foreground">· {t('form.opcional')}</span></FormLabel>
                      <FormControl>
                        <Input placeholder={t('form.cpfPlaceholder')} inputMode="numeric" autoComplete="off" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel><span>{t('form.email')}<ReqMark /></span></FormLabel>
                      <FormControl>
                        <Input type="email" inputMode="email" placeholder={t('form.emailPlaceholder')} autoComplete="email" {...field} />
                      </FormControl>
                      <FormDescription>{t('form.emailAjuda')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel><span>{t('form.telefone')}<ReqMark /></span></FormLabel>
                      <FormControl>
                        <Input type="tel" inputMode="tel" placeholder={t('form.telefonePlaceholder')} autoComplete="tel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Currículo (PDF) — input sobreposto (clique/arrastar/teclado), igual ao cadastro. */}
                <div className="space-y-2">
                  <Label htmlFor="cv"><span>{t('form.curriculo')}<ReqMark /></span></Label>
                  {!cvFile ? (
                    <div className="relative">
                      <input
                        id="cv"
                        type="file"
                        accept=".pdf"
                        aria-invalid={!!cvError}
                        aria-describedby={cvError ? 'cv-error' : 'cv-hint'}
                        onChange={(e) => { pickCv(e.target.files?.[0]); e.target.value = '' }}
                        className="peer absolute inset-0 z-10 size-full cursor-pointer opacity-0"
                      />
                      <div
                        className={cn(
                          'flex flex-col items-center justify-center gap-1.5 rounded-md border border-dashed px-4 py-6 text-center transition-colors peer-hover:bg-accent/40 peer-focus-visible:border-ring peer-focus-visible:bg-accent/40 peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50',
                          cvError ? 'border-destructive bg-destructive/5' : 'border-input',
                        )}
                      >
                        <p className={cn('flex items-center gap-2 ty-body-sm font-medium', cvError ? 'text-destructive-text' : 'text-link')}>
                          <Upload className="size-4" aria-hidden /> {t('form.curriculoEnviar')}
                        </p>
                        <p id="cv-hint" className="ty-body-sm text-muted-foreground">{t('form.curriculoDica', { max: MAX_MB })}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-md border border-dashed border-success/50 bg-success/10 px-4 py-4">
                      <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-md bg-success/15 text-success-text">
                        <FileText className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 ty-body-sm font-medium text-success-text">
                          <Check className="size-4 shrink-0" aria-hidden /> {t('form.curriculoAnexado')}
                        </p>
                        <p className="truncate ty-body-sm font-medium">
                          {cvFile.name}
                          <span className="font-normal text-muted-foreground"> · {(cvFile.size / 1024).toFixed(0)} KB</span>
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => { setCvFile(null); setCvError(null) }}
                        aria-label={t('form.curriculoRemover')}
                        className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive-text"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  )}
                  {cvError && <p id="cv-error" className="ty-body-sm text-destructive-text" role="alert">{cvError}</p>}
                </div>

                {/* Verificação anti-robô (mock) — o código é texto real, exposto ao leitor de tela. */}
                <FormField
                  control={form.control}
                  name="captcha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel><span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-4 text-muted-foreground" aria-hidden /> {t('captcha.label')}<ReqMark /></span></FormLabel>
                      <FormDescription>{t('captcha.instrucao')}</FormDescription>
                      <CaptchaBox codigo={codigo} onNovo={novoCaptcha} />
                      <FormControl>
                        <Input placeholder={t('captcha.placeholder')} autoComplete="off" autoCapitalize="characters" spellCheck={false} className="font-mono tracking-widest uppercase placeholder:font-sans placeholder:tracking-normal placeholder:normal-case sm:max-w-xs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" isLoading={isSubmitting}>
                  {isSubmitting ? t('form.enviando') : <><Send aria-hidden /> {t('form.enviar')}</>}
                </Button>
              </form>
            </Form>
              </div>
            )}
          </>
        )}

        {/* Rodapé da demo — saída pro app interno (a página real seria pública, sem isso). */}
        {onSair && (
          <p className="mt-8 text-center ty-caption text-muted-foreground">
            {t('rodape.demo')}{' '}
            <button type="button" onClick={onSair} className={cn('inline-flex items-center gap-1 font-medium text-link underline-offset-4 hover:underline', focusRing)}>
              <ArrowLeft className="size-3.5" aria-hidden /> {t('rodape.voltar')}
            </button>
          </p>
        )}
        </div>
      </main>

      {/* Rodapé de ação PRESO embaixo — mesmo padrão/estilo do rodapé do detalhe de vaga do recrutador
          (h-dvh → main rola por dentro → footer shrink-0). Some no estado de sucesso. */}
      {!enviado && (
        <footer className="shrink-0 border-t border-border/40 bg-card/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-4xl items-center gap-3 px-6 py-3">
            {logado ? (
              // Logado: candidatar = abrir o modal de confirmação (currículo do perfil ou outro).
              <Button onClick={() => setModalOpen(true)} className="ml-auto">{t('rodape.candidatar')} <ArrowRight aria-hidden /></Button>
            ) : aba === 'descricao' ? (
              <Button onClick={() => trocarAba('inscricao')} className="ml-auto">{t('rodape.candidatar')} <ArrowRight aria-hidden /></Button>
            ) : (
              <Button variant="ghost" onClick={() => trocarAba('descricao')}><ChevronLeft aria-hidden /> {t('rodape.voltarDescricao')}</Button>
            )}
          </div>
        </footer>
      )}

      {logado && (
        <ConfirmarCandidaturaDialog
          open={modalOpen} onOpenChange={setModalOpen} vaga={vagaTitulo}
          onEnviada={() => { setModalOpen(false); setNomeEnviado(candidato.nome); setEnviado(true) }}
        />
      )}
    </div>
  )
}
