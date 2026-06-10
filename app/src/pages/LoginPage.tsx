/**
 * Tela de login (demo, sem backend). 100% token-driven — cor, tipografia (.ty-*), espaçamento e
 * altura vêm do contrato CRP — multi-marca (TIS/Marca B), claro/escuro e WCAG 2.2 AA.
 * O shell (split + painel da marca + logo + título) vem do <AuthLayout> compartilhado.
 * Validação com react-hook-form + zod; a "auth" é simulada (senha de demo: 123456).
 */
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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

export function LoginPage({ onLogin, onCreateAccount }: { onLogin?: () => void; onCreateAccount?: () => void }) {
  const [showPwd, setShowPwd] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  })
  const { isSubmitting } = form.formState

  // Guarda de montagem: a "auth" simulada resolve após ~1.1s; se o componente desmontar nesse
  // meio-tempo (ex.: o pai troca de view), não tocamos em estado/foco de um componente morto.
  const mountedRef = useRef(true)
  useEffect(() => () => { mountedRef.current = false }, [])

  // Some o erro de credencial assim que o usuário edita qualquer campo.
  useEffect(() => {
    const sub = form.watch(() => setFormError(null))
    return () => sub.unsubscribe()
  }, [form])

  async function onSubmit(values: LoginValues) {
    setFormError(null)
    await new Promise((r) => setTimeout(r, 1100)) // simula a chamada de auth
    if (!mountedRef.current) return // desmontou durante o "await" → não toca em estado/foco
    if (values.password !== DEMO_PASSWORD) {
      setFormError('E-mail ou senha incorretos. Verifique e tente de novo.')
      form.setFocus('password')
      return
    }
    toast.success('Bem-vindo de volta!', { description: 'Login de demonstração.' })
    onLogin?.()
  }

  return (
    <AuthLayout
      headline="Gestão de pessoas, sem atrito."
      subline="Centralize times, jornadas e indicadores numa plataforma só."
      title="Entrar na sua conta"
      subtitle="Bem-vindo de volta! Informe suas credenciais para continuar."
      maxWidth="sm"
      footer={
        <p className="text-sm text-muted-foreground">
          Não tem uma conta?{' '}
          <button
            type="button"
            onClick={() => onCreateAccount?.()}
            className={`font-medium text-link underline-offset-4 hover:underline ${focusRing}`}
          >
            Criar conta
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

          {/* isLoading (não disabled): mantém o botão focável e anuncia aria-busy/aria-disabled —
              `disabled` tira da ordem de tab e fica mudo p/ leitor de tela durante o submit. */}
          <Button type="submit" className="group w-full" isLoading={isSubmitting}>
            {isSubmitting ? (
              'Entrando…'
            ) : (
              <>Entrar <ArrowRight className="transition-transform group-hover:translate-x-0.5" /></>
            )}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  )
}
