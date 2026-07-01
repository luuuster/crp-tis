/**
 * Modal de confirmação de candidatura (candidato LOGADO). Em vez do formulário público completo, quem já
 * está na plataforma só confirma: identidade (vem da sessão) + currículo (usa o do perfil OU envia outro)
 * → candidatar-se. MOCK: sem backend; o "currículo do perfil" é um nome fixo e o upload só guarda o nome.
 * 100% token-driven, multi-marca, claro/escuro e WCAG 2.2 AA. Rótulos de currículo reusados do namespace
 * 'inscricao' (mesma fonte do form público).
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, FileText, Send, Upload, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const MAX_MB = 10

export function ConfirmarCandidaturaDialog({ open, onOpenChange, vaga, onEnviada }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  vaga: string
  onEnviada: () => void
}) {
  const { t } = useTranslation('inscricao')
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvError, setCvError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  function pickCv(file?: File) {
    if (!file) return
    if (!/\.pdf$/i.test(file.name)) return setCvError(t('validacao.curriculoFormato'))
    if (file.size > MAX_MB * 1024 * 1024) return setCvError(t('validacao.curriculoTamanho', { max: MAX_MB }))
    setCvError(null)
    setCvFile(file)
  }
  async function confirmar() {
    setEnviando(true)
    await new Promise((r) => setTimeout(r, 1000)) // simula o envio
    setEnviando(false)
    onEnviada()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('logado.titulo')}</DialogTitle>
          <DialogDescription>{t('logado.subtitulo', { vaga })}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Currículo: usa o do perfil OU envia outro */}
          <div className="space-y-2">
            <p className="ty-body-sm font-medium text-foreground">{t('logado.curriculoLabel')}</p>
            {!cvFile ? (
              <div className="space-y-2.5">
                {/* CV do perfil */}
                <div className="flex items-center gap-3 rounded-md border border-dashed border-success/50 bg-success/10 px-4 py-3">
                  <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-md bg-success/15 text-success-text"><FileText className="size-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="ty-caption font-medium text-success-text">{t('logado.doPerfil')}</p>
                    <p className="truncate ty-body-sm font-medium">{t('logado.perfilNome')}</p>
                  </div>
                </div>
                {/* enviar outro (dropzone) */}
                <div className="relative">
                  <input
                    id="conf-cv" type="file" accept=".pdf" aria-label={t('logado.enviarOutro')} aria-invalid={!!cvError} aria-describedby={cvError ? 'conf-cv-error' : 'conf-cv-hint'}
                    onChange={(e) => { pickCv(e.target.files?.[0]); e.target.value = '' }}
                    className="peer absolute inset-0 z-10 size-full cursor-pointer opacity-0"
                  />
                  <div className={cn('flex flex-col items-center justify-center gap-1 rounded-md border border-dashed px-4 py-4 text-center transition-colors peer-hover:bg-accent/40 peer-focus-visible:border-ring peer-focus-visible:bg-accent/40 peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50', cvError ? 'border-destructive bg-destructive/5' : 'border-input')}>
                    <p className={cn('flex items-center gap-2 ty-body-sm font-medium', cvError ? 'text-destructive-text' : 'text-link')}><Upload className="size-4" aria-hidden /> {t('logado.enviarOutro')}</p>
                    <p id="conf-cv-hint" className="ty-caption text-muted-foreground">{t('form.curriculoDica', { max: MAX_MB })}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-md border border-dashed border-success/50 bg-success/10 px-4 py-3">
                <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-md bg-success/15 text-success-text"><FileText className="size-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 ty-caption font-medium text-success-text"><Check className="size-3.5 shrink-0" aria-hidden /> {t('logado.novoCurriculo')}</p>
                  <p className="truncate ty-body-sm font-medium">{cvFile.name}<span className="font-normal text-muted-foreground"> · {(cvFile.size / 1024).toFixed(0)} KB</span></p>
                </div>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => setCvFile(null)} aria-label={t('logado.usarPerfil')} className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive-text"><X className="size-4" /></Button>
              </div>
            )}
            {cvError && <p id="conf-cv-error" className="ty-body-sm text-destructive-text" role="alert">{cvError}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('logado.cancelar')}</Button>
          <Button onClick={confirmar} isLoading={enviando}>{enviando ? t('logado.enviando') : <><Send aria-hidden /> {t('logado.candidatar')}</>}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
