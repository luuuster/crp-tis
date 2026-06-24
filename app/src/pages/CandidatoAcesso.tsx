/**
 * Acesso do CANDIDATO (porta :5172, rota /acesso) — espelha o login do recrutador (mesmo AuthLayout), com o
 * fluxo de PRIMEIRO ACESSO: ao se inscrever, o candidato recebe por e-mail uma senha PROVISÓRIA; entra com
 * ela e, por ser o 1º acesso, é obrigado a trocar por uma senha própria; daí cai na sua área.
 *
 * 100% token-driven, multi-marca, claro/escuro e WCAG 2.2 AA. react-hook-form + zod; as regras de senha vêm
 * de @/lib/password (MESMA fonte do Cadastro do recrutador). MOCK: sem backend — a "senha provisória" é fixa.
 */
import { useEffect, useRef, useState } from 'react'
import type { TFunction } from 'i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Check, Eye, EyeOff, KeyRound } from 'lucide-react'

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

type Etapa = 'login' | 'trocarSenha'

function makeLoginSchema(t: TFunction<'acesso'>) {
  return z.object({
    email: z.string().min(1, t('validacao.emailObrigatorio')).refine((v) => EMAIL_RE.test(v), t('validacao.emailInvalido')),
    senha: z.string().min(1, t('validacao.senhaObrigatoria')),
  })
}
type LoginValues = z.infer<ReturnType<typeof makeLoginSchema>>

function makeTrocaSchema(t: TFunction<'acesso'>) {
  return z
    .object({
      nova: z.string().refine(senhaForte, t('validacao.senhaRequisitos')),
      confirmar: z.string().min(1, t('validacao.confirmeSenha')),
    })
    .refine((d) => d.nova === d.confirmar, { message: t('validacao.naoCoincidem'), path: ['confirmar'] })
}
type TrocaValues = z.infer<ReturnType<typeof makeTrocaSchema>>

export function CandidatoAcesso({ brand }: { brand?: string }) {
  const { t } = useTranslation('acesso')
  const [etapa, setEtapa] = useState<Etapa>('login')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [showProvisoria, setShowProvisoria] = useState(false)
  const [showNova, setShowNova] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)

  const loginForm = useForm<LoginValues>({ resolver: zodResolver(makeLoginSchema(t)), defaultValues: { email: '', senha: '' }, mode: 'onTouched' })
  const trocaForm = useForm<TrocaValues>({ resolver: zodResolver(makeTrocaSchema(t)), defaultValues: { nova: '', confirmar: '' }, mode: 'onTouched' })

  // Guarda de montagem: as ações simuladas resolvem com delay; não tocar estado de um componente morto.
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // Checklist AO VIVO das regras de senha (na troca). Mesmo padrão do RegisterPage (form.watch no render
  // + disable do lint RHF×react-hooks). O congelamento do 2º campo NÃO vinha daqui — vinha do reuso dos
  // Controllers entre etapas; resolvido com `key` distinta nos forms. Ver CandidatoAcesso.interaction.test.tsx.
  // eslint-disable-next-line react-hooks/incompatible-library
  const nova = trocaForm.watch('nova') || ''
  const confirmar = trocaForm.watch('confirmar') || ''
  const checks = [
    ...PWD_RULES.map((r) => ({ label: t(`regras.${r.key}` as 'regras.minChars'), ok: r.test(nova) })),
    { label: t('regras.coincidem'), ok: nova.length > 0 && nova === confirmar },
  ]
  const metCount = checks.filter((c) => c.ok).length
  const allOk = metCount === checks.length

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
    setEtapa('trocarSenha') // 1º acesso → troca obrigatória
  }

  async function onTrocar(_values: TrocaValues) {
    await new Promise((r) => setTimeout(r, 1100)) // simula salvar a nova senha
    if (!mountedRef.current) return
    // Senha definida → entra na plataforma: o mural de vagas (navegação real nesta porta).
    window.location.href = '/painel'
  }

  // Rodapé só do LOGIN: cadastro é do candidato (ele se cadastra na plataforma) → leva a /cadastro
  // (navegação real nesta porta). A etapa de troca não tem rodapé.
  const footerLogin = (
    <p className="text-sm text-muted-foreground">
      {t('rodape.semConta')}{' '}
      <button type="button" onClick={() => { window.location.href = '/cadastro' }} className={cn('font-medium text-link underline-offset-4 hover:underline', focusRing)}>
        {t('rodape.criarConta')}
      </button>
    </p>
  )

  // ---- TROCAR SENHA (1º acesso) ----
  if (etapa === 'trocarSenha') {
    return (
      <AuthLayout headline={t('marca.headline')} subline={t('marca.subline')} title={t('troca.title')} subtitle={t('troca.subtitle')} maxWidth="md" brand={brand}>
        {/* key="troca-form": as etapas login/troca têm Controllers na MESMA posição da árvore (sob o mesmo
            AuthLayout/Form). Sem key distinta, ao trocar de etapa o React REAPROVEITA as instâncias dos
            Controllers (control muda de loginForm→trocaForm) e o 2º campo CONGELA. A key força remontagem
            limpa. Comprovado por CandidatoAcesso.interaction.test.tsx. */}
        <Form {...trocaForm}>
          <form key="troca-form" onSubmit={trocaForm.handleSubmit(onTrocar)} className="space-y-5" noValidate>
            <FormField
              control={trocaForm.control}
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
              control={trocaForm.control}
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

            {/* Requisitos da senha — barra segmentada (1 por regra) + checklist ao vivo. O contador anuncia
                "X de N" de forma concisa (role=status), em vez de reler a lista a cada tecla. */}
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

            <Button type="submit" className="w-full" isLoading={trocaForm.formState.isSubmitting}>
              {trocaForm.formState.isSubmitting ? t('troca.definindo') : <>{t('troca.definir')} <ArrowRight /></>}
            </Button>
          </form>
        </Form>
      </AuthLayout>
    )
  }

  // ---- LOGIN (senha provisória) ----
  return (
    <AuthLayout headline={t('marca.headline')} subline={t('marca.subline')} title={t('login.title')} subtitle={t('login.subtitle')} maxWidth="sm" brand={brand} footer={footerLogin}>
      <Form {...loginForm}>
        {/* key distinta da troca: evita o reuso de Controllers entre etapas (ver comentário na troca). */}
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
                <FormLabel>{t('login.label.senha')}</FormLabel>
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
