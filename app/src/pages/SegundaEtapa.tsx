/**
 * Segunda etapa do processo seletivo (visão do CANDIDATO). Depois de enviar a inscrição, o candidato
 * responde a um questionário com perguntas abertas ligadas à vaga e confirma o anti-robô para habilitar
 * o envio. Mesmo chrome leve da inscrição (logo + coluna central), sem a sidebar do app interno.
 *
 * 100% token-driven, multi-marca, claro/escuro e WCAG 2.2 AA. react-hook-form + zod; captcha reusado da
 * inscrição (CaptchaBox + lib/captcha). MOCK: sem backend — as perguntas são exemplos fixos ligados à
 * stack da vaga e o envio é simulado. No produto, viriam do processo seletivo configurado pelo recrutador.
 */
import { useEffect, useId, useRef, useState } from 'react'
import type { TFunction } from 'i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Trans, useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, Brain, CheckCircle2, Send, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { CARD, toneBadge } from '@/lib/surfaces'
import { focusRing } from '@/lib/focus'
import { genCaptcha } from '@/lib/captcha'
import { CandidatoHeader } from '@/components/candidato/CandidatoHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CaptchaBox } from '@/components/CaptchaBox'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

// Perguntas MOCK da 2ª etapa — prosa pt-BR ligada à stack da vaga (como o resto do documento da vaga,
// fora do i18n). No produto viriam do processo seletivo configurado pelo recrutador.
const PERGUNTAS = [
  { name: 'resp1' as const, texto: 'Descreva um projeto recente em que você construiu uma API REST com Node.js e TypeScript. Como você estruturou a validação de dados e a documentação, e quais desafios encontrou ao garantir a escalabilidade?' },
  { name: 'resp2' as const, texto: 'Conte como você configurou pipelines de CI/CD para build e deploy de containers Docker em produção. Quais boas práticas você adotou para reduzir o tamanho da imagem e acelerar o tempo de deploy?' },
] as const

function makeSchema(t: TFunction<'inscricao'>) {
  return z.object({
    resp1: z.string().trim().min(1, t('segunda.validacao.obrigatoria')),
    resp2: z.string().trim().min(1, t('segunda.validacao.obrigatoria')),
    captcha: z.string().trim().min(1, t('validacao.captchaObrigatorio')),
  })
}
type Values = z.infer<ReturnType<typeof makeSchema>>

export function SegundaEtapa({ brand, nome, vaga, onConcluir, onSair, publico = false }: {
  brand?: string
  nome: string
  vaga: string
  onConcluir: () => void
  onSair?: () => void
  publico?: boolean
}) {
  const { t } = useTranslation('inscricao')
  const tituloId = useId()
  const [codigo, setCodigo] = useState(genCaptcha)
  const [enviado, setEnviado] = useState(false)

  const form = useForm<Values>({
    resolver: zodResolver(makeSchema(t)),
    defaultValues: { resp1: '', resp2: '', captcha: '' },
    mode: 'onTouched',
  })
  const { isSubmitting } = form.formState

  // Guarda de montagem: o envio simulado resolve após ~1.2s; não toca estado de um componente já morto.
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  function novoCaptcha() {
    setCodigo(genCaptcha())
    form.setValue('captcha', '')
  }

  async function onSubmit(values: Values) {
    if (values.captcha.trim().toUpperCase() !== codigo) {
      form.setError('captcha', { message: t('validacao.captchaInvalido') })
      novoCaptcha()
      return
    }
    await new Promise((r) => setTimeout(r, 1200)) // simula o envio
    if (!mountedRef.current) return
    toast.success(t('segunda.toast'))
    setEnviado(true)
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Chrome leve do portal do candidato — marca (link pro mural quando logado) + conta. */}
      <CandidatoHeader brand={brand} onSair={onSair} publico={publico} />

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl px-6 py-10 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
          {enviado ? (
            // Etapa concluída — confirma o recebimento das respostas.
            <div className="mx-auto max-w-md rounded-2xl border border-success/25 bg-success/5 p-8 text-center">
              <span aria-hidden className="mx-auto grid size-16 place-items-center rounded-full bg-success/15 text-success-text ring-[6px] ring-success/10 motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:duration-500">
                <CheckCircle2 className="size-9" />
              </span>
              <h1 className="mt-5 font-heading text-2xl font-bold tracking-tight text-foreground">{t('segunda.sucessoTitulo')}</h1>
              <p className="mx-auto mt-2 max-w-sm ty-body text-muted-foreground">{t('segunda.sucessoDescricao')}</p>
              <div className="mt-6 flex justify-center">
                <Button onClick={onConcluir}>{t('sucesso.verVagas')} <ArrowRight aria-hidden /></Button>
              </div>
            </div>
          ) : (
            <Form {...form}>
              {/* eslint-disable-next-line react-hooks/refs -- RHF: handleSubmit acessa refs internos em render; padrão da lib */}
              <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
                {/* Mesmo chrome do documento da vaga (VagaDocumento): card único, header com rótulo + título +
                    intro, e seções separadas por fios sutis — sem hero centralizado. */}
                <article aria-labelledby={tituloId} className={cn('space-y-7 p-6 sm:p-8', CARD)}>
                  <header className="space-y-2 border-b border-border/50 pb-5">
                    <span className="flex items-center gap-1.5 ty-label-sm uppercase text-muted-foreground"><Brain className="size-3.5" aria-hidden /> {t('segunda.titulo')}</span>
                    <h1 id={tituloId} className="ty-h4 text-foreground">{vaga}</h1>
                    <p className="ty-body text-muted-foreground">
                      <Trans t={t} i18nKey="segunda.saudacao" values={{ nome }} components={{ b: <strong className="font-semibold text-foreground" /> }} />
                    </p>
                  </header>

                  {/* Perguntas abertas — cada uma é um bloco, separadas por espaço (igual às seções da vaga). */}
                  <div className="space-y-7">
                    {PERGUNTAS.map((p, i) => (
                      <FormField
                        key={p.name}
                        control={form.control}
                        name={p.name}
                        render={({ field }) => (
                          <FormItem className="gap-3">
                            <FormLabel className="items-start gap-3 leading-snug">
                              <span aria-hidden className={cn('grid size-6 shrink-0 place-items-center rounded-full ty-caption font-bold', toneBadge.primary)}>{i + 1}</span>
                              <span className="ty-body font-medium text-foreground">{p.texto}</span>
                            </FormLabel>
                            <FormControl>
                              <Textarea rows={6} className="min-h-40" placeholder={t('segunda.respostaPlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>

                  {/* Anti-robô + enviar — bloco final, separado por fio sutil (igual aos Benefícios da vaga). */}
                  <section className="space-y-4 border-t border-border/50 pt-6">
                    <FormField
                      control={form.control}
                      name="captcha"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel><span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-4 text-muted-foreground" aria-hidden /> {t('captcha.label')}</span></FormLabel>
                          <FormDescription>{t('segunda.captchaAviso')}</FormDescription>
                          <CaptchaBox codigo={codigo} onNovo={novoCaptcha} />
                          <FormControl>
                            <Input placeholder={t('captcha.placeholder')} autoComplete="off" autoCapitalize="characters" spellCheck={false} className="bg-background font-mono tracking-widest uppercase placeholder:font-sans placeholder:tracking-normal placeholder:normal-case sm:max-w-xs" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end">
                      <Button type="submit" size="lg" className="w-full sm:w-auto sm:min-w-56" isLoading={isSubmitting}>
                        {isSubmitting ? t('segunda.enviando') : <><Send aria-hidden /> {t('segunda.enviar')}</>}
                      </Button>
                    </div>
                  </section>
                </article>
              </form>
            </Form>
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
    </div>
  )
}
