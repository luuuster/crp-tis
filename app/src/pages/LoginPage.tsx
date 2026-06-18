/**
 * Tela de login (demo, sem backend). 100% token-driven — cor, tipografia (.ty-*), espaçamento e
 * altura vêm do contrato CRP — multi-marca (TIS/Marca B), claro/escuro e WCAG 2.2 AA.
 * O shell (split + painel da marca + logo + título) vem do <AuthLayout> compartilhado.
 * Validação com react-hook-form + zod; a "auth" é simulada (demo: recrutador@talentai.com / talentai123).
 */
import { useEffect, useRef, useState } from 'react'
import type { TFunction } from 'i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

import { focusRing } from '@/lib/focus'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertTitle } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

// Credenciais de demonstração — só este par entra; qualquer outro cai no erro de credencial.
const DEMO_EMAIL = 'recrutador@talentai.com'
const DEMO_PASSWORD = 'talentai123'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Schema parametrizado por `t` — as mensagens do zod saem do namespace 'auth' (chrome de UI).
function makeLoginSchema(t: TFunction<'auth'>) {
  return z.object({
    email: z
      .string()
      .min(1, t('validacao.emailObrigatorio'))
      .refine((v) => EMAIL_RE.test(v), t('validacao.emailInvalido')),
    password: z.string().min(6, t('validacao.senhaMin')),
  })
}
type LoginValues = z.infer<ReturnType<typeof makeLoginSchema>>

export function LoginPage({ onLogin, onCreateAccount }: { onLogin?: () => void; onCreateAccount?: () => void }) {
  const { t } = useTranslation('auth')
  const [showPwd, setShowPwd] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<LoginValues>({
    resolver: zodResolver(makeLoginSchema(t)),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  })
  const { isSubmitting } = form.formState

  // Guarda de montagem: a "auth" simulada resolve após ~1.1s; se o componente desmontar nesse
  // meio-tempo (ex.: o pai troca de view), não tocamos em estado/foco de um componente morto.
  // Seta true no mount (NÃO só no init do ref): sob StrictMode em dev o React faz mount→cleanup→mount,
  // e o cleanup zeraria mountedRef p/ false permanentemente — aí o onSubmit abortaria sempre.
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // Some o erro de credencial assim que o usuário edita qualquer campo.
  useEffect(() => {
    const sub = form.watch(() => setFormError(null))
    return () => sub.unsubscribe()
  }, [form])

  async function onSubmit(values: LoginValues) {
    setFormError(null)
    await new Promise((r) => setTimeout(r, 1100)) // simula a chamada de auth
    if (!mountedRef.current) return // desmontou durante o "await" → não toca em estado/foco
    if (values.email.trim().toLowerCase() !== DEMO_EMAIL || values.password !== DEMO_PASSWORD) {
      setFormError(t('login.credenciaisInvalidas'))
      form.setFocus('password')
      return
    }
    toast.success(t('login.sucessoTitulo'), { description: t('login.sucessoDescricao') })
    onLogin?.()
  }

  return (
    <AuthLayout
      headline={t('login.headline')}
      subline={t('login.subline')}
      title={t('login.title')}
      subtitle={t('login.subtitle')}
      maxWidth="sm"
      footer={
        <p className="text-sm text-muted-foreground">
          {t('login.semConta')}{' '}
          <button
            type="button"
            onClick={() => onCreateAccount?.()}
            className={`font-medium text-link underline-offset-4 hover:underline ${focusRing}`}
          >
            {t('login.criarConta')}
          </button>
        </p>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {formError && (
            <Alert variant="destructive" className="items-center">
              <AlertCircle />
              <AlertTitle>{formError}</AlertTitle>
            </Alert>
          )}

          <FormField
            control={form.control}
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
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('login.label.senha')}</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      type={showPwd ? 'text' : 'password'}
                      placeholder={t('login.placeholder.senha')}
                      autoComplete="current-password"
                      className="pr-9"
                      {...field}
                    />
                  </FormControl>
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    aria-label={showPwd ? t('login.ocultarSenha') : t('login.mostrarSenha')}
                    className={`absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center text-muted-foreground transition-colors hover:text-foreground ${focusRing}`}
                  >
                    {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between gap-3">
            <label htmlFor="remember" className="flex items-center gap-2 text-sm">
              <Checkbox id="remember" defaultChecked /> {t('login.lembrar')}
            </label>
            <button
              type="button"
              onClick={() => toast(t('login.recuperacaoTitulo'), { description: t('login.recuperacaoDescricao') })}
              className={`text-sm font-medium text-link underline-offset-4 hover:underline ${focusRing}`}
            >
              {t('login.esqueceuSenha')}
            </button>
          </div>

          {/* isLoading (não disabled): mantém o botão focável e anuncia aria-busy/aria-disabled —
              `disabled` tira da ordem de tab e fica mudo p/ leitor de tela durante o submit. */}
          <Button type="submit" className="group w-full" isLoading={isSubmitting}>
            {isSubmitting ? (
              t('login.entrando')
            ) : (
              <>{t('login.entrar')} <ArrowRight className="transition-transform group-hover:translate-x-0.5" /></>
            )}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  )
}
