/**
 * Tela de cadastro do candidato (demo, sem backend). Mesmo padrão da login: 100% token-driven
 * (.ty-*, cores e altura do contrato CRP), multi-marca, claro/escuro e WCAG 2.2 AA.
 * O shell (split + painel da marca + logo + título) vem do <AuthLayout> compartilhado.
 * react-hook-form + zod; checklist de requisitos da senha AO VIVO (com anúncio conciso p/ leitor
 * de tela); upload de currículo acessível (clique + arrastar + teclado). "Cadastro" é simulado.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { TFunction } from 'i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Check, Eye, EyeOff, FileText, Upload, UserPlus, X } from 'lucide-react'
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
// `key` aponta p/ o rótulo no namespace 'auth' (regras.*); o rótulo é resolvido via t() na UI.
const PWD_RULES = [
  { key: 'minChars', test: (v: string) => v.length >= 8 },
  { key: 'maiuscula', test: (v: string) => /[A-Z]/.test(v) },
  { key: 'numero', test: (v: string) => /[0-9]/.test(v) },
  { key: 'especial', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
] as const

// Schema parametrizado por `t` — mensagens do zod saem do namespace 'auth' (chrome de UI).
function makeRegisterSchema(t: TFunction<'auth'>) {
  return z
    .object({
      nome: z.string().trim().min(1, t('validacao.nomeObrigatorio')),
      email: z.string().min(1, t('validacao.emailObrigatorio')).refine((v) => EMAIL_RE.test(v), t('validacao.emailInvalido')),
      password: z.string().refine((v) => PWD_RULES.every((r) => r.test(v)), t('validacao.senhaRequisitos')),
      confirmPassword: z.string().min(1, t('validacao.confirmeSenha')),
      aceiteTermos: z.boolean().refine((v) => v === true, {
        message: t('validacao.aceiteTermos'),
      }),
    })
    .refine((d) => d.password === d.confirmPassword, {
      message: t('validacao.senhasNaoCoincidem'),
      path: ['confirmPassword'],
    })
}
type RegisterValues = z.infer<ReturnType<typeof makeRegisterSchema>>

// Label com marca de obrigatório: o <span> agrupa texto + asterisco num ÚNICO item do flex do
// Label (que tem gap-2), então o "*" cola no texto. Asterisco decorativo + "(obrigatório)" p/ leitor.
function ReqLabel({ children }: { children: ReactNode }) {
  const { t } = useTranslation('auth')
  return (
    <span>
      {children}
      <span aria-hidden className="ml-0.5 text-destructive-text">*</span>
      <span className="sr-only">{t('registro.obrigatorio')}</span>
    </span>
  )
}

export function RegisterPage({ onBackToLogin, onRegistered, brand }: { onBackToLogin?: () => void; onRegistered?: () => void; brand?: string }) {
  const { t } = useTranslation('auth')
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvError, setCvError] = useState<string | null>(null)

  const form = useForm<RegisterValues>({
    resolver: zodResolver(makeRegisterSchema(t)),
    defaultValues: { nome: '', email: '', password: '', confirmPassword: '', aceiteTermos: false },
    mode: 'onTouched',
  })
  const { isSubmitting } = form.formState

  // Guarda de montagem: o "cadastro" simulado resolve após ~1.2s; se desmontar nesse meio-tempo
  // (o pai volta pro login), não disparamos toast/callback de um componente já desmontado.
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // Checklist ao vivo: 4 regras da senha + coincidência (atualiza enquanto digita).
  // KNOWN: RHF × React Compiler — `form.watch` não é memoizável e o compilador PULA este componente
  // ("Compilation Skipped"). Trocar por useWatch força a compilação e aí ele tropeça em outros internals
  // do RHF (form.handleSubmit/spread = ref em render). Mantemos a API estável; o skip é perf-hint, não bug.
  // eslint-disable-next-line react-hooks/incompatible-library
  const pwd = form.watch('password') || ''
  const confirm = form.watch('confirmPassword') || ''
  const checks = [
    ...PWD_RULES.map((r) => ({ label: t(`registro.regras.${r.key}`), ok: r.test(pwd) })),
    { label: t('registro.regras.coincidem'), ok: pwd.length > 0 && pwd === confirm },
  ]
  const metCount = checks.filter((c) => c.ok).length
  const allOk = metCount === checks.length

  function pickCv(file?: File) {
    if (!file) return
    if (!/\.(pdf|docx?)$/i.test(file.name)) return setCvError(t('registro.curriculo.formatoInvalido'))
    if (file.size > MAX_MB * 1024 * 1024) return setCvError(t('registro.curriculo.muitoGrande', { max: MAX_MB }))
    setCvError(null)
    setCvFile(file)
  }

  async function onSubmit(values: RegisterValues) {
    if (!cvFile) {
      setCvError(t('registro.curriculo.anexe'))
      return
    }
    await new Promise((r) => setTimeout(r, 1200)) // simula a criação da conta
    if (!mountedRef.current) return // desmontou durante o "await" → não dispara toast/callback
    toast.success(t('registro.sucessoTitulo'), { description: t('registro.sucessoDescricao', { nome: values.nome.split(' ')[0] }) })
    onRegistered?.()
  }

  return (
    <AuthLayout
      headline={t('registro.headline')}
      subline={t('registro.subline')}
      title={t('registro.title')}
      subtitle={t('registro.subtitle')}
      maxWidth="md"
      brand={brand}
      footer={
        <p className="text-sm text-muted-foreground">
          {t('registro.temConta')}{' '}
          <button type="button" onClick={() => onBackToLogin?.()} className={`font-medium text-link underline-offset-4 hover:underline ${focusRing}`}>
            {t('registro.entrar')}
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
                <FormLabel><ReqLabel>{t('registro.label.nome')}</ReqLabel></FormLabel>
                <FormControl>
                  <Input placeholder={t('registro.placeholder.nome')} autoComplete="name" {...field} />
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
                <FormLabel><ReqLabel>{t('registro.label.email')}</ReqLabel></FormLabel>
                <FormControl>
                  <Input type="email" inputMode="email" placeholder={t('registro.placeholder.email')} autoComplete="email" {...field} />
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
                <FormLabel><ReqLabel>{t('registro.label.senha')}</ReqLabel></FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input type={showPwd ? 'text' : 'password'} placeholder={t('registro.placeholder.senha')} autoComplete="new-password" className="pr-9" {...field} />
                  </FormControl>
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    aria-label={showPwd ? t('registro.ocultarSenha') : t('registro.mostrarSenha')}
                    className={`absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center text-muted-foreground transition-colors hover:text-foreground ${focusRing}`}
                  >
                    {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <FormDescription className="sr-only">
                  {t('registro.descricaoSenha')}
                </FormDescription>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel><ReqLabel>{t('registro.label.confirmarSenha')}</ReqLabel></FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input type={showConfirm ? 'text' : 'password'} placeholder={t('registro.placeholder.confirmarSenha')} autoComplete="new-password" className="pr-9" {...field} />
                  </FormControl>
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    aria-label={showConfirm ? t('registro.ocultarSenha') : t('registro.mostrarSenha')}
                    className={`absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center text-muted-foreground transition-colors hover:text-foreground ${focusRing}`}
                  >
                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <FormDescription className="sr-only">{t('registro.descricaoConfirmar')}</FormDescription>
              </FormItem>
            )}
          />

          {/* Requisitos da senha — sem caixa: barra de força segmentada (1 segmento por regra,
              enche conforme cumpre) ancora o bloco + checklist ao vivo. Barra e badge mudam de
              PREENCHIMENTO/forma além da cor (AA); contador fica verde ao completar. O contador é
              role="status" e anuncia "X de N requisitos" de forma concisa (não lê a lista a cada tecla). */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="ty-body-sm font-medium">{t('registro.requisitos.titulo')}</p>
              <span
                role="status"
                aria-live="polite"
                className={cn('ty-body-sm font-medium tabular-nums transition-colors', allOk ? 'text-success-text' : 'text-muted-foreground')}
              >
                <span aria-hidden>{metCount}/{checks.length}</span>
                <span className="sr-only">{t('registro.requisitos.contador', { met: metCount, total: checks.length })}</span>
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
                  <span className="sr-only">{c.ok ? t('registro.requisitos.cumprido') : t('registro.requisitos.pendente')}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Currículo — input sobreposto (clique/arrastar/teclado), token-driven */}
          <div className="space-y-2">
            <Label htmlFor="cv"><ReqLabel>{t('registro.label.curriculo')}</ReqLabel></Label>
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
                    <Upload className="size-4" aria-hidden /> {t('registro.curriculo.enviar')}
                  </p>
                  <p id="cv-hint" className="ty-body-sm text-muted-foreground">{t('registro.curriculo.dica', { max: MAX_MB })}</p>
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
                    <Check className="size-4 shrink-0" aria-hidden /> {t('registro.curriculo.anexado')}
                  </p>
                  <p className="truncate ty-body-sm font-medium">
                    {cvFile.name}
                    <span className="font-normal text-muted-foreground"> · {(cvFile.size / 1024).toFixed(0)} KB</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setCvFile(null); setCvError(null) }}
                  aria-label={t('registro.curriculo.remover')}
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
                    {t('registro.termos.li')}{' '}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toast(t('registro.termos.termosTitulo'), { description: t('registro.termos.termosDescricao') }) }}
                      className={`text-link underline-offset-4 hover:underline ${focusRing}`}
                    >
                      {t('registro.termos.termos')}
                    </button>
                    {' '}{t('registro.termos.e')}{' '}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toast(t('registro.termos.politicaTitulo'), { description: t('registro.termos.politicaDescricao') }) }}
                      className={`text-link underline-offset-4 hover:underline ${focusRing}`}
                    >
                      {t('registro.termos.politica')}
                    </button>
                    .
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* isLoading (não disabled): mantém o botão focável e anuncia aria-busy/aria-disabled —
              `disabled` tira da ordem de tab e fica mudo p/ leitor de tela durante o submit. */}
          <Button type="submit" className="group w-full" isLoading={isSubmitting}>
            {isSubmitting ? (
              t('registro.criando')
            ) : (
              <><UserPlus /> {t('registro.criarConta')}</>
            )}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  )
}
