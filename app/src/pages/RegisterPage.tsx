/**
 * Tela de cadastro do candidato (demo, sem backend). Mesmo padrão da login: 100% token-driven
 * (.ty-*, cores e altura do contrato CRP), multi-marca, claro/escuro e WCAG 2.2 AA.
 * O shell (split + painel da marca + logo + título) vem do <AuthLayout> compartilhado.
 * react-hook-form + zod; checklist de requisitos da senha AO VIVO (com anúncio conciso p/ leitor
 * de tela); upload de currículo acessível (clique + arrastar + teclado). "Cadastro" é simulado.
 */
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check, Eye, EyeOff, FileText, Loader2, Upload, UserPlus, X } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { focusRing } from '@/lib/focus'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_MB = 5

// Regras da senha — alimentam o checklist AO VIVO e a validação do zod (fonte única).
const PWD_RULES = [
  { label: 'Mínimo de 8 caracteres', test: (v: string) => v.length >= 8 },
  { label: 'Pelo menos uma letra maiúscula', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'Pelo menos um número', test: (v: string) => /[0-9]/.test(v) },
  { label: 'Pelo menos um caractere especial (ex.: ! @ # $)', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
]

const registerSchema = z
  .object({
    nome: z.string().trim().min(1, 'Informe seu nome completo.'),
    email: z.string().min(1, 'Informe seu e-mail.').refine((v) => EMAIL_RE.test(v), 'Informe um e-mail válido.'),
    password: z.string().refine((v) => PWD_RULES.every((r) => r.test(v)), 'A senha não cumpre todos os requisitos.'),
    confirmPassword: z.string().min(1, 'Confirme sua senha.'),
    aceiteTermos: z.boolean().refine((v) => v === true, {
      message: 'Você precisa aceitar os Termos e a Política de Privacidade.',
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })
type RegisterValues = z.infer<typeof registerSchema>

// Label com marca de obrigatório: o <span> agrupa texto + asterisco num ÚNICO item do flex do
// Label (que tem gap-2), então o "*" cola no texto. Asterisco decorativo + "(obrigatório)" p/ leitor.
function ReqLabel({ children }: { children: ReactNode }) {
  return (
    <span>
      {children}
      <span aria-hidden className="ml-0.5 text-destructive-text">*</span>
      <span className="sr-only"> (obrigatório)</span>
    </span>
  )
}

export function RegisterPage({ onBackToLogin, onRegistered }: { onBackToLogin?: () => void; onRegistered?: () => void }) {
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvError, setCvError] = useState<string | null>(null)

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { nome: '', email: '', password: '', confirmPassword: '', aceiteTermos: false },
    mode: 'onTouched',
  })
  const { isSubmitting } = form.formState

  // Checklist ao vivo: 4 regras da senha + coincidência (atualiza enquanto digita).
  const pwd = form.watch('password') || ''
  const confirm = form.watch('confirmPassword') || ''
  const checks = [
    ...PWD_RULES.map((r) => ({ label: r.label, ok: r.test(pwd) })),
    { label: 'As senhas coincidem', ok: pwd.length > 0 && pwd === confirm },
  ]
  const metCount = checks.filter((c) => c.ok).length
  const allOk = metCount === checks.length

  function pickCv(file?: File) {
    if (!file) return
    if (!/\.(pdf|docx?)$/i.test(file.name)) return setCvError('Formato não suportado — envie um arquivo PDF ou Word (.pdf, .doc ou .docx).')
    if (file.size > MAX_MB * 1024 * 1024) return setCvError(`O arquivo é muito grande — o limite é ${MAX_MB} MB.`)
    setCvError(null)
    setCvFile(file)
  }

  async function onSubmit(values: RegisterValues) {
    if (!cvFile) {
      setCvError('Anexe seu currículo.')
      return
    }
    await new Promise((r) => setTimeout(r, 1200)) // simula a criação da conta
    toast.success('Conta criada com sucesso!', { description: `Bem-vindo(a), ${values.nome.split(' ')[0]}! Faça login para continuar.` })
    onRegistered?.()
  }

  return (
    <AuthLayout
      headline="Sua próxima vaga começa aqui."
      subline="Crie seu perfil e candidate-se às melhores oportunidades em minutos."
      title="Crie sua conta"
      subtitle="Preencha seus dados para se candidatar às vagas."
      maxWidth="md"
      footer={
        <p className="text-sm text-muted-foreground">
          Já tem uma conta?{' '}
          <button type="button" onClick={() => onBackToLogin?.()} className={`font-medium text-link underline-offset-4 hover:underline ${focusRing}`}>
            Entrar
          </button>
        </p>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel><ReqLabel>Nome completo</ReqLabel></FormLabel>
                <FormControl>
                  <Input placeholder="O seu nome" autoComplete="name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel><ReqLabel>E-mail</ReqLabel></FormLabel>
                <FormControl>
                  <Input type="email" inputMode="email" placeholder="voce@empresa.com" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Senha + confirmar (toggle de visibilidade em cada). FormDescription sr-only descreve as
              regras p/ leitor de tela ao focar — o checklist visual abaixo serve quem enxerga. */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel><ReqLabel>Senha</ReqLabel></FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input type={showPwd ? 'text' : 'password'} placeholder="••••••••" autoComplete="new-password" className="pr-9" {...field} />
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
                <FormDescription className="sr-only">
                  A senha deve ter no mínimo 8 caracteres, uma letra maiúscula, um número e um caractere especial.
                </FormDescription>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel><ReqLabel>Confirmar senha</ReqLabel></FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input type={showConfirm ? 'text' : 'password'} placeholder="••••••••" autoComplete="new-password" className="pr-9" {...field} />
                  </FormControl>
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
                    className={`absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center text-muted-foreground transition-colors hover:text-foreground ${focusRing}`}
                  >
                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <FormDescription className="sr-only">Repita exatamente a senha digitada acima.</FormDescription>
              </FormItem>
            )}
          />

          {/* Requisitos da senha — sem caixa: barra de força segmentada (1 segmento por regra,
              enche conforme cumpre) ancora o bloco + checklist ao vivo. Barra e badge mudam de
              PREENCHIMENTO/forma além da cor (AA); contador fica verde ao completar. O contador é
              role="status" e anuncia "X de N requisitos" de forma concisa (não lê a lista a cada tecla). */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="ty-body-sm font-medium">Requisitos da senha</p>
              <span
                role="status"
                aria-live="polite"
                className={cn('ty-body-sm font-medium tabular-nums transition-colors', allOk ? 'text-success-text' : 'text-muted-foreground')}
              >
                <span aria-hidden>{metCount}/{checks.length}</span>
                <span className="sr-only">{metCount} de {checks.length} requisitos cumpridos</span>
              </span>
            </div>

            {/* força: um segmento por requisito */}
            <div className="flex gap-1.5" aria-hidden>
              {checks.map((c, i) => (
                <span key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors', c.ok ? 'bg-success' : 'bg-muted-foreground/15')} />
              ))}
            </div>

            <ul className="space-y-2 pt-1">
              {checks.map((c) => (
                <li key={c.label} className={cn('flex items-center gap-2.5 ty-body-sm transition-colors', c.ok ? 'text-foreground' : 'text-muted-foreground')}>
                  <span
                    aria-hidden
                    className={cn(
                      'grid size-5 shrink-0 place-items-center rounded-full border transition-colors',
                      c.ok ? 'border-success/25 bg-success/15 text-success-text' : 'border-muted-foreground/20 bg-muted-foreground/10',
                    )}
                  >
                    {c.ok && <Check className="size-3 motion-safe:animate-in motion-safe:zoom-in-75" strokeWidth={2.5} />}
                  </span>
                  <span>{c.label}</span>
                  <span className="sr-only">{c.ok ? '(cumprido)' : '(pendente)'}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Currículo — input sobreposto (clique/arrastar/teclado), token-driven */}
          <div className="space-y-2">
            <Label htmlFor="cv"><ReqLabel>Currículo</ReqLabel></Label>
            {!cvFile ? (
              <div className="relative">
                <input
                  id="cv"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  aria-invalid={!!cvError}
                  aria-describedby={cvError ? 'cv-error' : 'cv-hint'}
                  onChange={(e) => {
                    pickCv(e.target.files?.[0])
                    e.target.value = ''
                  }}
                  className="peer absolute inset-0 z-10 size-full cursor-pointer opacity-0"
                />
                {/* erro deixa a dropzone vermelha (borda + leve fundo) além da mensagem */}
                <div
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 rounded-md border border-dashed px-4 py-6 text-center transition-colors peer-hover:bg-accent/40 peer-focus-visible:border-ring peer-focus-visible:bg-accent/40 peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50',
                    cvError ? 'border-destructive bg-destructive/5' : 'border-input',
                  )}
                >
                  <p className={cn('flex items-center gap-2 ty-body-sm font-medium', cvError ? 'text-destructive-text' : 'text-link')}>
                    <Upload className="size-4" aria-hidden /> Enviar currículo (PDF ou Word)
                  </p>
                  <p id="cv-hint" className="ty-body-sm text-muted-foreground">Máximo {MAX_MB} MB · fica salvo neste dispositivo até concluir o cadastro</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-md border border-dashed border-success/50 bg-success/10 px-4 py-5">
                {/* anexo confirmado: MESMA caixa das outras (tracejada/rounded-md), só em verde */}
                <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-md bg-success/15 text-success-text">
                  <FileText className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 ty-body-sm font-medium text-success-text">
                    <Check className="size-4 shrink-0" aria-hidden /> Currículo anexado
                  </p>
                  <p className="truncate ty-body-sm font-medium">
                    {cvFile.name}
                    <span className="font-normal text-muted-foreground"> · {(cvFile.size / 1024).toFixed(0)} KB</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setCvFile(null); setCvError(null) }}
                  aria-label="Remover currículo"
                  className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-destructive/10 hover:text-destructive-text focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}
            {cvError && <p id="cv-error" className="ty-body-sm text-destructive-text" role="alert">{cvError}</p>}
          </div>

          {/* Termos — checkbox obrigatório (zod). Os links são <button> de demo (toast) com
              stopPropagation p/ não alternar o checkbox ao clicar no link. */}
          <FormField
            control={form.control}
            name="aceiteTermos"
            render={({ field, fieldState }) => (
              <FormItem>
                <div className="flex items-start gap-2.5">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      onBlur={field.onBlur}
                      aria-invalid={!!fieldState.error}
                      className="mt-0.5"
                    />
                  </FormControl>
                  <FormLabel className="font-normal leading-snug">
                    Li e aceito os{' '}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toast('Termos de Uso', { description: 'Demonstração — os Termos de Uso abririam aqui.' }) }}
                      className={`text-link underline-offset-4 hover:underline ${focusRing}`}
                    >
                      Termos
                    </button>
                    {' '}e a{' '}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toast('Política de Privacidade', { description: 'Demonstração — a Política de Privacidade abriria aqui.' }) }}
                      className={`text-link underline-offset-4 hover:underline ${focusRing}`}
                    >
                      Política de Privacidade
                    </button>
                    .
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="group w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <><Loader2 className="animate-spin" /> Criando conta…</>
            ) : (
              <><UserPlus /> Criar conta</>
            )}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  )
}
