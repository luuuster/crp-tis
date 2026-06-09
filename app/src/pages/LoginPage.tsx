/**
 * Tela de login (demo, sem backend). 100% token-driven — cor, tipografia (.ty-*), espaçamento e
 * altura vêm do contrato CRP — multi-marca (TIS/Marca B), claro/escuro e WCAG 2.2 AA.
 * Validação com react-hook-form + zod; a "auth" é simulada (senha de demo: 123456).
 * Feedback de erro: por campo (FormMessage) + credencial (Alert) com foco no campo.
 */
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import logoWhite from '@/assets/logo/logo-white.svg'
import logoDark from '@/assets/logo/logo-dark.svg'

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

// Senha de demonstração — qualquer e-mail válido entra com ela; senha diferente cai no erro de credencial.
const DEMO_PASSWORD = '123456'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Informe seu e-mail.')
    .refine((v) => EMAIL_RE.test(v), 'Informe um e-mail válido.'),
  password: z.string().min(6, 'A senha precisa ter ao menos 6 caracteres.'),
})
type LoginValues = z.infer<typeof loginSchema>

const focusRing =
  'rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50'

export function LoginPage({ onLogin }: { onLogin?: () => void }) {
  const [showPwd, setShowPwd] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  })
  const { isSubmitting } = form.formState

  // Some o erro de credencial assim que o usuário edita qualquer campo.
  useEffect(() => {
    const sub = form.watch(() => setFormError(null))
    return () => sub.unsubscribe()
  }, [form])

  async function onSubmit(values: LoginValues) {
    setFormError(null)
    await new Promise((r) => setTimeout(r, 1100)) // simula a chamada de auth
    if (values.password !== DEMO_PASSWORD) {
      setFormError('E-mail ou senha incorretos. Verifique e tente de novo.')
      form.setFocus('password')
      return
    }
    toast.success('Bem-vindo de volta!', { description: 'Login de demonstração.' })
    onLogin?.()
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* ===== esquerda: marca (minimal) ===== */}
      <aside className="relative hidden flex-col justify-center overflow-hidden bg-primary p-12 text-primary-foreground lg:flex xl:p-16">
        {/* um único glow suave, sem texturas */}
        <div aria-hidden className="pointer-events-none absolute -top-32 -right-24 size-[34rem] rounded-full bg-primary-foreground/[0.08] blur-3xl" />

        <div className="relative max-w-md">
          <h2 className="ty-h1 text-balance">
            Gestão de pessoas, sem atrito.
          </h2>
          <p className="ty-body-lg mt-5 text-primary-foreground text-pretty">
            Centralize times, jornadas e indicadores numa plataforma só.
          </p>
        </div>

        <p className="absolute inset-x-12 bottom-12 text-sm text-primary-foreground xl:inset-x-16 xl:bottom-16">© 2026 TIS · Plataforma de RH</p>
      </aside>

      {/* ===== direita: formulário (sem card, sobre a superfície) ===== */}
      <main className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
          <div className="mb-8">
            <img src={logoDark} alt="TIS" className="h-12 w-auto dark:hidden" />
            <img src={logoWhite} alt="TIS" className="hidden h-12 w-auto dark:block" />
          </div>

          <div className="space-y-2">
            <h1 className="ty-h3">Entrar na sua conta</h1>
            <p className="ty-body-sm text-muted-foreground">Bem-vindo de volta! Informe suas credenciais para continuar.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
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
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" inputMode="email" placeholder="voce@empresa.com" autoComplete="email" {...field} />
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
                    <FormLabel>Senha</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPwd ? 'text' : 'password'}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          className="pr-9"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowPwd((s) => !s)}
                        aria-label={showPwd ? 'Ocultar senha' : 'Mostrar senha'}
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
                  <Checkbox id="remember" defaultChecked /> Lembrar de mim
                </label>
                <button
                  type="button"
                  onClick={() => toast('Recuperação de senha', { description: 'Demonstração — o fluxo de redefinição abriria aqui.' })}
                  className={`text-sm font-medium text-link underline-offset-4 hover:underline ${focusRing}`}
                >
                  Esqueceu a senha?
                </button>
              </div>

              <Button type="submit" className="group w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="animate-spin" /> Entrando…</>
                ) : (
                  <>Entrar <ArrowRight className="transition-transform group-hover:translate-x-0.5" /></>
                )}
              </Button>
            </form>
          </Form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Não tem uma conta?{' '}
            <button
              type="button"
              onClick={() => toast('Criar conta', { description: 'Demonstração — o cadastro abriria aqui.' })}
              className={`font-medium text-link underline-offset-4 hover:underline ${focusRing}`}
            >
              Criar conta
            </button>
          </p>
        </div>
      </main>
    </div>
  )
}
