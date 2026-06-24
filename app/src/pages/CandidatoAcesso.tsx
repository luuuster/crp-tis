/**
 * Acesso do CANDIDATO (porta :5172) — espelha o login do recrutador (mesmo AuthLayout), com o fluxo de
 * PRIMEIRO ACESSO: ao se inscrever, o candidato recebe por e-mail uma senha PROVISÓRIA; entra com ela e,
 * por ser o 1º acesso, é obrigado a trocar por uma senha própria; daí cai na sua área.
 *
 * Também cobre o ESQUECI A SENHA, com ROTAS PRÓPRIAS (deep-link + botão voltar do navegador):
 *   /acesso  →  /acesso/recuperar  →  /acesso/recuperar/enviado  →  /redefinir_senha  →  /redefinir_senha/sucesso
 * Cada passo move o foco para o título (a11y: anuncia a mudança de tela em leitor de tela). Sem backend
 * (mock): o "e-mail" é simulado e o link de redefinição é um botão. A senha provisória é fixa.
 *
 * 100% token-driven, multi-marca, claro/escuro e WCAG 2.2 AA. react-hook-form + zod; as regras de senha vêm
 * de @/lib/password (MESMA fonte do Cadastro do recrutador).
 */
import { useEffect, useRef, useState } from 'react'
import type { TFunction } from 'i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Eye, EyeOff, KeyRound, Mail, MailCheck, RotateCw } from 'lucide-react'

import { cn } from '@/lib/utils'
import { focusRing } from '@/lib/focus'
import { PWD_RULES, senhaForte } from '@/lib/password'
import { autenticarCandidato, guardarEmailCandidato } from '@/lib/candidatoSessao'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Demo: a "senha provisória que veio no e-mail". Sem backend — qualquer e-mail + esta senha entra no 1º acesso.
const SENHA_PROVISORIA = 'Provisoria123'

// Rotas do fluxo (linkáveis). Mantidas em sync com ROTAS_CANDIDATO em vite.candidato.config.ts.
const RT_LOGIN = '/acesso'
const RT_RECUPERAR = '/acesso/recuperar'
const RT_ENVIADO = '/acesso/recuperar/enviado'
const RT_REDEFINIR = '/redefinir_senha'
const RT_SUCESSO = '/redefinir_senha/sucesso'

// login = senha provisória · trocarSenha = 1º acesso (transitório, sem URL) · recuperar/enviado/redefinir/
// redefinido = fluxo "esqueci a senha" (cada um com rota própria).
type Etapa = 'login' | 'trocarSenha' | 'recuperar' | 'enviado' | 'redefinir' | 'redefinido'

// Deriva a etapa a partir da URL (deep-link e botão voltar). Mais específico primeiro.
function etapaDaUrl(): Etapa {
  const p = window.location.pathname.toLowerCase()
  if (p.startsWith(RT_SUCESSO)) return 'redefinido'
  if (p.startsWith(RT_REDEFINIR)) return 'redefinir'
  if (p.startsWith(RT_ENVIADO)) return 'enviado'
  if (p.startsWith(RT_RECUPERAR)) return 'recuperar'
  return 'login'
}

function makeLoginSchema(t: TFunction<'acesso'>) {
  return z.object({
    email: z.string().min(1, t('validacao.emailObrigatorio')).refine((v) => EMAIL_RE.test(v), t('validacao.emailInvalido')),
    senha: z.string().min(1, t('validacao.senhaObrigatoria')),
  })
}
type LoginValues = z.infer<ReturnType<typeof makeLoginSchema>>

function makeRecuperarSchema(t: TFunction<'acesso'>) {
  return z.object({
    email: z.string().min(1, t('validacao.emailObrigatorio')).refine((v) => EMAIL_RE.test(v), t('validacao.emailInvalido')),
  })
}
type RecuperarValues = z.infer<ReturnType<typeof makeRecuperarSchema>>

function makeSenhaSchema(t: TFunction<'acesso'>) {
  return z
    .object({
      nova: z.string().refine(senhaForte, t('validacao.senhaRequisitos')),
      confirmar: z.string().min(1, t('validacao.confirmeSenha')),
    })
    .refine((d) => d.nova === d.confirmar, { message: t('validacao.naoCoincidem'), path: ['confirmar'] })
}
type SenhaValues = z.infer<ReturnType<typeof makeSenhaSchema>>

export function CandidatoAcesso({ brand }: { brand?: string }) {
  const { t } = useTranslation('acesso')
  const [etapa, setEtapa] = useState<Etapa>(etapaDaUrl)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [showProvisoria, setShowProvisoria] = useState(false)
  // E-mail informado na recuperação (mostrado na confirmação e usado para a sessão após redefinir).
  const [emailRecuperacao, setEmailRecuperacao] = useState('')
  const [reenviando, setReenviando] = useState(false)
  const [reenviado, setReenviado] = useState(false)

  const loginForm = useForm<LoginValues>({ resolver: zodResolver(makeLoginSchema(t)), defaultValues: { email: '', senha: '' }, mode: 'onTouched' })
  const recuperarForm = useForm<RecuperarValues>({ resolver: zodResolver(makeRecuperarSchema(t)), defaultValues: { email: '' }, mode: 'onTouched' })

  // Guarda de montagem: as ações simuladas resolvem com delay; não tocar estado de um componente morto.
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // Botão voltar/avançar do navegador: re-sincroniza a etapa com a URL (rotas próprias do fluxo).
  useEffect(() => {
    const onPop = () => { setReenviado(false); setEtapa(etapaDaUrl()) }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Some o erro de credencial assim que o usuário edita qualquer campo do login. (Mesmo padrão do LoginPage:
  // a subscrição `form.watch(cb)` não é memoizável → o React Compiler PULA este componente — o que também
  // evita que ele tropece nos internals do RHF, p.ex. handleSubmit/spread = ref em render. Skip é perf-hint.)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/incompatible-library
    const sub = loginForm.watch(() => setLoginError(null))
    return () => sub.unsubscribe()
  }, [loginForm])

  // Navega para uma etapa do fluxo atualizando a URL (pushState = histórico → botão voltar funciona).
  function irPara(proxima: Etapa, url: string) {
    window.history.pushState({}, '', url)
    setLoginError(null)
    setReenviado(false)
    setEtapa(proxima)
  }

  const voltarAoLogin = () => irPara('login', RT_LOGIN)

  async function onLogin(values: LoginValues) {
    setLoginError(null)
    await new Promise((r) => setTimeout(r, 1000)) // simula a autenticação
    if (!mountedRef.current) return
    // Conta cadastrada (e-mail + senha) → entra DIRETO no painel, sem troca de senha.
    if (autenticarCandidato(values.email, values.senha)) {
      guardarEmailCandidato(values.email.trim())
      window.location.href = '/painel'
      return
    }
    // Caso contrário: fluxo de 1º acesso com a senha provisória (qualquer e-mail).
    if (values.senha !== SENHA_PROVISORIA) {
      setLoginError(t('validacao.senhaIncorreta'))
      loginForm.setFocus('senha')
      return
    }
    guardarEmailCandidato(values.email.trim()) // identidade p/ o avatar do mural (mock, sem backend)
    setEtapa('trocarSenha') // 1º acesso → troca obrigatória (etapa transitória, sem rota própria)
  }

  async function onRecuperar(values: RecuperarValues) {
    await new Promise((r) => setTimeout(r, 900)) // simula o envio do e-mail
    if (!mountedRef.current) return
    setEmailRecuperacao(values.email.trim())
    irPara('enviado', RT_ENVIADO)
  }

  async function onReenviar() {
    setReenviado(false)
    setReenviando(true)
    await new Promise((r) => setTimeout(r, 800)) // simula reenviar
    if (!mountedRef.current) return
    setReenviando(false)
    setReenviado(true)
  }

  // Footer "voltar ao login" reutilizado nas telas do fluxo de recuperação.
  const voltarFooter = (
    <button type="button" onClick={voltarAoLogin} className={cn('inline-flex items-center gap-1.5 text-sm font-medium text-link underline-offset-4 hover:underline', focusRing)}>
      <ArrowLeft className="size-4" aria-hidden /> {t('recuperar.voltar')}
    </button>
  )

  // ---- 1º ACESSO / REDEFINIR (formulário de nova senha, compartilhado) ----
  if (etapa === 'trocarSenha') {
    return (
      <NovaSenhaEtapa
        brand={brand}
        title={t('troca.title')}
        subtitle={t('troca.subtitle')}
        submitLabel={t('troca.definir')}
        submittingLabel={t('troca.definindo')}
        // 1º acesso: e-mail já guardado no onLogin → entra no painel.
        onConcluir={() => { window.location.href = '/painel' }}
      />
    )
  }
  if (etapa === 'redefinir') {
    return (
      <NovaSenhaEtapa
        brand={brand}
        title={t('redefinir.title')}
        subtitle={t('redefinir.subtitle')}
        submitLabel={t('redefinir.definir')}
        submittingLabel={t('redefinir.definindo')}
        footer={voltarFooter}
        // Sucesso explícito antes de entrar (rota própria + foco no título).
        onConcluir={() => irPara('redefinido', RT_SUCESSO)}
      />
    )
  }

  // ---- RECUPERAR (pede o e-mail da conta) ----
  if (etapa === 'recuperar') {
    return (
      <AuthLayout headline={t('marca.headline')} subline={t('marca.subline')} title={t('recuperar.title')} subtitle={t('recuperar.subtitle')} maxWidth="sm" brand={brand} footer={voltarFooter} focusKey={etapa}>
        <Form {...recuperarForm}>
          <form key="recuperar-form" onSubmit={recuperarForm.handleSubmit(onRecuperar)} className="space-y-5" noValidate>
            <FormField
              control={recuperarForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('recuperar.label.email')}</FormLabel>
                  <FormControl>
                    <Input type="email" inputMode="email" placeholder={t('login.placeholder.email')} autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="group w-full" isLoading={recuperarForm.formState.isSubmitting}>
              {recuperarForm.formState.isSubmitting ? t('recuperar.enviando') : <>{t('recuperar.enviar')} <ArrowRight className="transition-transform group-hover:translate-x-0.5" /></>}
            </Button>
          </form>
        </Form>
      </AuthLayout>
    )
  }

  // ---- ENVIADO (confirmação "verifique seu e-mail") ----
  if (etapa === 'enviado') {
    return (
      <AuthLayout headline={t('marca.headline')} subline={t('marca.subline')} title={t('enviado.title')} subtitle={emailRecuperacao ? t('enviado.subtitle', { email: emailRecuperacao }) : t('enviado.subtitleGenerico')} maxWidth="sm" brand={brand} footer={voltarFooter} focusKey={etapa}>
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-xl border border-success/25 bg-success/10 p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-success/15 text-success-text">
              <MailCheck className="size-5" aria-hidden />
            </span>
            <p className="ty-body-sm text-foreground">{t('enviado.dica')}</p>
          </div>

          {/* Reenviar — confirma inline (role=status) que o e-mail saiu de novo. */}
          <div className="space-y-2">
            <Button type="button" variant="outline" className="w-full" isLoading={reenviando} onClick={onReenviar}>
              {!reenviando && <RotateCw aria-hidden />} {t('enviado.reenviar')}
            </Button>
            {reenviado && (
              <p role="status" className="flex items-center justify-center gap-1.5 ty-body-sm text-success-text">
                <Check className="size-4" aria-hidden /> {t('enviado.reenviado')}
              </p>
            )}
          </div>

          {/* Demo: sem e-mail real — simula o clique no link e leva à redefinição. */}
          <Alert className="items-center">
            <Mail />
            <AlertDescription className="space-y-3">
              <span className="block">{t('enviado.demo')}</span>
              <Button type="button" size="sm" className="w-full" onClick={() => irPara('redefinir', RT_REDEFINIR)}>
                {t('enviado.redefinirDemo')} <ArrowRight />
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </AuthLayout>
    )
  }

  // ---- REDEFINIDO (sucesso — feedback explícito antes de entrar) ----
  if (etapa === 'redefinido') {
    return (
      <AuthLayout headline={t('marca.headline')} subline={t('marca.subline')} title={t('redefinido.title')} subtitle={t('redefinido.subtitle')} maxWidth="sm" brand={brand} focusKey={etapa}>
        <div className="space-y-6">
          <div className="flex items-center gap-3 rounded-xl border border-success/25 bg-success/10 p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-success/15 text-success-text">
              <CheckCircle2 className="size-5" aria-hidden />
            </span>
            <p className="ty-body-sm text-foreground">{t('redefinido.dica')}</p>
          </div>
          <Button
            type="button"
            className="group w-full"
            onClick={() => {
              if (emailRecuperacao) guardarEmailCandidato(emailRecuperacao) // identidade p/ o painel (mock)
              window.location.href = '/painel'
            }}
          >
            {t('redefinido.entrar')} <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </AuthLayout>
    )
  }

  // ---- LOGIN (senha provisória) ----
  const footerLogin = (
    <p className="text-sm text-muted-foreground">
      {t('rodape.semConta')}{' '}
      <button type="button" onClick={() => { window.location.href = '/cadastro' }} className={cn('font-medium text-link underline-offset-4 hover:underline', focusRing)}>
        {t('rodape.criarConta')}
      </button>
    </p>
  )

  return (
    <AuthLayout headline={t('marca.headline')} subline={t('marca.subline')} title={t('login.title')} subtitle={t('login.subtitle')} maxWidth="sm" brand={brand} footer={footerLogin} focusKey={etapa}>
      <Form {...loginForm}>
        {/* key distinta das demais etapas: evita o reuso de Controllers entre telas. */}
        <form key="login-form" onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-5" noValidate>
          {loginError && (
            <Alert variant="destructive" className="items-center">
              <KeyRound />
              <AlertTitle>{loginError}</AlertTitle>
            </Alert>
          )}

          <FormField
            control={loginForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('login.label.email')}</FormLabel>
                <FormControl>
                  <Input type="email" inputMode="email" placeholder={t('login.placeholder.email')} autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={loginForm.control}
            name="senha"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between gap-2">
                  <FormLabel>{t('login.label.senha')}</FormLabel>
                  {/* Esqueci a senha → leva à recuperação (rota própria), pré-preenchendo o e-mail digitado. */}
                  <button
                    type="button"
                    onClick={() => { recuperarForm.reset({ email: loginForm.getValues('email') }); irPara('recuperar', RT_RECUPERAR) }}
                    className={cn('text-sm font-medium text-link underline-offset-4 hover:underline', focusRing)}
                  >
                    {t('login.esqueci')}
                  </button>
                </div>
                <div className="relative">
                  <FormControl>
                    <Input type={showProvisoria ? 'text' : 'password'} placeholder={t('login.placeholder.senha')} autoComplete="current-password" className="pr-9" {...field} />
                  </FormControl>
                  <button type="button" onClick={() => setShowProvisoria((s) => !s)} aria-label={showProvisoria ? t('login.ocultarSenha') : t('login.mostrarSenha')} className={cn('absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center text-muted-foreground transition-colors hover:text-foreground', focusRing)}>
                    {showProvisoria ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <FormDescription className="flex items-center gap-1.5"><KeyRound className="size-3.5 shrink-0" aria-hidden /> {t('login.dica')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="group w-full" isLoading={loginForm.formState.isSubmitting}>
            {loginForm.formState.isSubmitting ? t('login.entrando') : <>{t('login.entrar')} <ArrowRight className="transition-transform group-hover:translate-x-0.5" /></>}
          </Button>

          {/* Dica de demo: a senha provisória fixa (substituiria o e-mail real). */}
          <Alert className="items-center">
            <KeyRound />
            <AlertDescription>{t('login.demo', { senha: SENHA_PROVISORIA })}</AlertDescription>
          </Alert>
        </form>
      </Form>
    </AuthLayout>
  )
}

/**
 * Formulário de NOVA SENHA — compartilhado entre o 1º acesso (trocar) e a redefinição (esqueci a senha).
 * Cada uso é um componente próprio (montagem limpa), o que dispensa o antigo `key` hack de reuso de
 * Controllers entre etapas. Mantém o checklist ao vivo das regras (mesma fonte do RegisterPage).
 */
function NovaSenhaEtapa({
  brand,
  title,
  subtitle,
  submitLabel,
  submittingLabel,
  onConcluir,
  footer,
}: {
  brand?: string
  title: string
  subtitle: string
  submitLabel: string
  submittingLabel: string
  onConcluir: () => void
  footer?: React.ReactNode
}) {
  const { t } = useTranslation('acesso')
  const [showNova, setShowNova] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)
  const form = useForm<SenhaValues>({ resolver: zodResolver(makeSenhaSchema(t)), defaultValues: { nova: '', confirmar: '' }, mode: 'onTouched' })

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // Checklist AO VIVO das regras de senha. Mesmo padrão do RegisterPage (form.watch no render).
  // eslint-disable-next-line react-hooks/incompatible-library
  const nova = form.watch('nova') || ''
  const confirmar = form.watch('confirmar') || ''
  const checks = [
    ...PWD_RULES.map((r) => ({ label: t(`regras.${r.key}` as 'regras.minChars'), ok: r.test(nova) })),
    { label: t('regras.coincidem'), ok: nova.length > 0 && nova === confirmar },
  ]
  const metCount = checks.filter((c) => c.ok).length
  const allOk = metCount === checks.length

  async function onSubmit() {
    await new Promise((r) => setTimeout(r, 1100)) // simula salvar a nova senha
    if (!mountedRef.current) return
    onConcluir()
  }

  return (
    <AuthLayout headline={t('marca.headline')} subline={t('marca.subline')} title={title} subtitle={subtitle} maxWidth="md" brand={brand} footer={footer} focusKey={title}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="nova"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('troca.label.nova')}</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input type={showNova ? 'text' : 'password'} placeholder={t('troca.placeholder')} autoComplete="new-password" className="pr-9" {...field} />
                  </FormControl>
                  <button type="button" onClick={() => setShowNova((s) => !s)} aria-label={showNova ? t('login.ocultarSenha') : t('login.mostrarSenha')} className={cn('absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center text-muted-foreground transition-colors hover:text-foreground', focusRing)}>
                    {showNova ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('troca.label.confirmar')}</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input type={showConfirmar ? 'text' : 'password'} placeholder={t('troca.placeholder')} autoComplete="new-password" className="pr-9" {...field} />
                  </FormControl>
                  <button type="button" onClick={() => setShowConfirmar((s) => !s)} aria-label={showConfirmar ? t('login.ocultarSenha') : t('login.mostrarSenha')} className={cn('absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center text-muted-foreground transition-colors hover:text-foreground', focusRing)}>
                    {showConfirmar ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Requisitos da senha — barra segmentada (1 por regra) + checklist ao vivo. */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="ty-body-sm font-medium">{t('troca.requisitos')}</p>
              <span role="status" aria-live="polite" className={cn('ty-body-sm font-medium tabular-nums transition-colors', allOk ? 'text-success-text' : 'text-muted-foreground')}>
                <span aria-hidden>{metCount}/{checks.length}</span>
                <span className="sr-only">{t('troca.contador', { met: metCount, total: checks.length })}</span>
              </span>
            </div>
            <div className="flex gap-1.5" aria-hidden>
              {checks.map((c, i) => <span key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors', c.ok ? 'bg-success' : 'bg-muted-foreground/15')} />)}
            </div>
            <ul className="space-y-2 pt-1">
              {checks.map((c) => (
                <li key={c.label} className={cn('flex items-center gap-2.5 ty-body-sm transition-colors', c.ok ? 'text-foreground' : 'text-muted-foreground')}>
                  <span aria-hidden className={cn('grid size-5 shrink-0 place-items-center rounded-full border transition-colors', c.ok ? 'border-success/25 bg-success/15 text-success-text' : 'border-muted-foreground/20 bg-muted-foreground/10')}>
                    {c.ok && <Check className="size-3 motion-safe:animate-in motion-safe:zoom-in-75" strokeWidth={2.5} />}
                  </span>
                  <span>{c.label}</span>
                  <span className="sr-only">{c.ok ? t('troca.cumprido') : t('troca.pendente')}</span>
                </li>
              ))}
            </ul>
          </div>

          <Button type="submit" className="w-full" isLoading={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? submittingLabel : <>{submitLabel} <ArrowRight /></>}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  )
}
