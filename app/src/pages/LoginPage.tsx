import { useState, type FormEvent } from 'react'
import { ArrowRight, Check, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'

const FEATURES = [
  'Multi-marca e tema claro/escuro nativos',
  'Acesso seguro com SSO e 2FA',
  'Relatórios em tempo real',
]

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path fill="#4285F4" d="M23.06 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h6.2a5.3 5.3 0 0 1-2.3 3.48v2.89h3.72c2.18-2 3.44-4.96 3.44-8.38Z" />
      <path fill="#34A853" d="M12 23.5c3.1 0 5.7-1.03 7.62-2.78l-3.72-2.89c-1.03.69-2.36 1.1-3.9 1.1-3 0-5.54-2.02-6.45-4.74H1.7v2.98A11.5 11.5 0 0 0 12 23.5Z" />
      <path fill="#FBBC05" d="M5.55 14.19a6.9 6.9 0 0 1 0-4.38V6.83H1.7a11.5 11.5 0 0 0 0 10.34l3.85-2.98Z" />
      <path fill="#EA4335" d="M12 4.68c1.69 0 3.21.58 4.4 1.72l3.3-3.3C17.7 1.23 15.1.5 12 .5A11.5 11.5 0 0 0 1.7 6.83l3.85 2.98C6.46 6.7 9 4.68 12 4.68Z" />
    </svg>
  )
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path fill="#F25022" d="M2 2h9.5v9.5H2z" />
      <path fill="#7FBA00" d="M12.5 2H22v9.5h-9.5z" />
      <path fill="#00A4EF" d="M2 12.5h9.5V22H2z" />
      <path fill="#FFB900" d="M12.5 12.5H22V22h-9.5z" />
    </svg>
  )
}

export function LoginPage() {
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    // simula a chamada de autenticação (demonstra estado de loading do Button)
    setTimeout(() => {
      setLoading(false)
      toast.success('Bem-vindo de volta!', { description: 'Login de demonstração.' })
    }, 1400)
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* ===== painel da marca (área grande em --primary) ===== */}
      <aside className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="pointer-events-none absolute -top-40 -right-32 size-[28rem] rounded-full bg-primary-foreground/10 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-28 -left-24 size-72 rounded-full bg-primary-foreground/[0.07] blur-2xl" />

        {/* topo */}
        <div className="relative flex flex-col gap-3">
          <div className="flex items-center gap-2 font-extrabold" style={{ fontFamily: 'var(--font-heading)' }}>
            <span className="grid size-9 place-items-center rounded-md bg-primary-foreground font-bold text-primary">C</span>
            <span className="text-xl tracking-tight">CRP</span>
          </div>
          <span className="text-xs font-semibold tracking-widest text-primary-foreground/80 uppercase">Plataforma de RH</span>
        </div>

        {/* meio: pitch + features */}
        <div className="relative max-w-md">
          <h2 className="text-3xl leading-tight font-bold tracking-tight text-balance" style={{ fontFamily: 'var(--font-heading)' }}>
            Gestão de pessoas, sem atrito.
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/85 text-pretty">
            Centralize times, jornadas e indicadores numa plataforma só — rápida, segura e do seu jeito.
          </p>
          <ul className="mt-8 space-y-4 text-sm">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3">
                <span className="grid size-7 flex-none place-items-center rounded-full bg-primary-foreground/15">
                  <Check className="size-4" />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* base: depoimento */}
        <figure className="relative max-w-md rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 p-6 backdrop-blur-sm">
          <blockquote className="text-lg text-pretty">
            “Migramos 1.200 colaboradores em uma semana. O CRP virou o centro da nossa operação de pessoas.”
          </blockquote>
          <figcaption className="mt-4 flex items-center gap-3">
            <span className="grid size-10 flex-none place-items-center rounded-full bg-primary-foreground font-bold text-primary" style={{ fontFamily: 'var(--font-heading)' }}>
              MA
            </span>
            <span>
              <span className="block font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Marina Alves</span>
              <span className="block text-sm text-primary-foreground/80">Head de RH · Northwind</span>
            </span>
          </figcaption>
        </figure>
      </aside>

      {/* ===== formulário ===== */}
      <main className="flex items-center justify-center bg-muted px-6 py-12">
        <div className="w-full max-w-md">
          <Card className="shadow-xl">
            <CardHeader className="space-y-1">
              <div className="mb-2 flex items-center gap-2 font-extrabold lg:hidden" style={{ fontFamily: 'var(--font-heading)' }}>
                <span className="grid size-8 place-items-center rounded-md bg-primary font-bold text-primary-foreground">C</span> CRP
              </div>
              <CardTitle className="text-2xl" style={{ fontFamily: 'var(--font-heading)' }}>Entrar na sua conta</CardTitle>
              <CardDescription>Bem-vindo de volta! Informe suas credenciais para continuar.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* SSO */}
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" type="button"><GoogleIcon /> Google</Button>
                <Button variant="outline" type="button"><MicrosoftIcon /> Microsoft</Button>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Separator className="flex-1" /> ou entre com e-mail <Separator className="flex-1" />
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="voce@empresa.com" autoComplete="email" required className="pl-9" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    <button type="button" className="text-xs text-primary underline-offset-4 hover:underline">Esqueceu a senha?</button>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="password" type={showPwd ? 'text' : 'password'} placeholder="••••••••" autoComplete="current-password" required className="px-9" />
                    <button
                      type="button"
                      onClick={() => setShowPwd((s) => !s)}
                      aria-label={showPwd ? 'Ocultar senha' : 'Mostrar senha'}
                      className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <label htmlFor="remember" className="flex items-center gap-2 text-sm">
                  <Checkbox id="remember" defaultChecked /> Lembrar de mim
                </label>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <><Loader2 className="animate-spin" /> Entrando…</> : <>Entrar <ArrowRight /></>}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="justify-center">
              <p className="text-sm text-muted-foreground">
                Não tem uma conta?{' '}
                <button type="button" className="text-primary underline-offset-4 hover:underline">Criar conta</button>
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
}
