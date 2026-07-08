/**
 * Editar perfil do CANDIDATO (porta :5172, rota /perfil) — tela cheia acessada pelo menu de conta.
 * Junta num só lugar o que antes eram dois stubs ("Editar perfil" + "Editar currículo"): dados de contato,
 * troca de foto (preview client-side), currículo (upload) e alteração de senha com política de força.
 * Formulário de MOCKUP (sem backend): salvar apenas mostra um toast. Semeado a partir de lerCandidato().
 * 100% token-driven, multi-marca, claro/escuro e WCAG 2.2 AA.
 */
import { useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Camera, Check, CheckCircle2, Circle, FileText, Trash2, Upload, UserRound, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { CARD, HEADER_SURFACE } from '@/lib/surfaces'
import { maskTel } from '@/lib/masks'
import type { Brand, Mode } from '@/lib/useBrandMode'
import { lerCandidato } from '@/lib/candidatoSessao'
import { CandidatoBrandRow } from '@/components/candidato/CandidatoBrandRow'
import { PageContainer, PageHeader, Panel } from '@/components/page'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const MAX_FOTO_MB = 5
const MAX_CV_MB = 10

// Item da checklist de força da senha (verde quando cumprido).
function Requisito({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={cn('flex items-center gap-1.5 ty-caption', ok ? 'text-success-text' : 'text-muted-foreground')}>
      {ok ? <CheckCircle2 className="size-3.5 shrink-0" aria-hidden /> : <Circle className="size-3.5 shrink-0" aria-hidden />}
      <span>{label}</span>
    </li>
  )
}

// Campo do formulário: rótulo + controle + (erro OU dica).
function Campo({ id, label, dica, erro, children }: { id: string; label: string; dica?: string; erro?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {erro ? <p id={`${id}-erro`} role="alert" className="ty-caption text-destructive-text">{erro}</p>
        : dica ? <p id={`${id}-dica`} className="ty-caption text-muted-foreground">{dica}</p> : null}
    </div>
  )
}

export function CandidatoPerfil({ brand, mode, onCycleBrand, onToggleMode, onSair }: {
  brand: Brand; mode: Mode; onCycleBrand: () => void; onToggleMode: () => void; onSair?: () => void
}) {
  const { t } = useTranslation('perfil')
  const { t: tu } = useTranslation('usuarios') // rótulos/placeholders compartilhados com o cadastro de usuário
  const { t: tp } = useTranslation('painel')
  const candidato = lerCandidato()

  const [form, setForm] = useState({ nome: candidato.nome, email: candidato.email, telefone: '' })
  const [senha, setSenha] = useState({ atual: '', nova: '', confirmar: '' })
  const [foto, setFoto] = useState<string | null>(null)
  const [cv, setCv] = useState<File | null>(null)
  const [cvErro, setCvErro] = useState<string | null>(null)
  const fotoRef = useRef<HTMLInputElement>(null)

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const setS = (k: keyof typeof senha, v: string) => setSenha((s) => ({ ...s, [k]: v }))

  const emailValido = /.+@.+\..+/.test(form.email)
  const emailErro = form.email.length > 0 && !emailValido

  // Política de senha: 8+ caracteres com maiúscula, minúscula, número e caractere especial.
  const nova = senha.nova
  const regras = [
    { key: 'tamanho', ok: nova.length >= 8 },
    { key: 'maiuscula', ok: /[A-Z]/.test(nova) },
    { key: 'minuscula', ok: /[a-z]/.test(nova) },
    { key: 'numero', ok: /\d/.test(nova) },
    { key: 'especial', ok: /[^A-Za-z0-9]/.test(nova) },
  ] as const
  const novaForte = regras.every((r) => r.ok)
  const querSenha = !!(senha.atual || senha.nova || senha.confirmar)
  const naoConfere = senha.confirmar.length > 0 && senha.nova !== senha.confirmar
  const senhaOk = !querSenha || (!!senha.atual && novaForte && senha.nova === senha.confirmar)
  const podeSalvar = form.nome.trim().length > 0 && emailValido && senhaOk

  const escolherFoto = (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error(t('foto.erroFormato')); return }
    if (file.size > MAX_FOTO_MB * 1024 * 1024) { toast.error(t('foto.erroTamanho', { max: MAX_FOTO_MB })); return }
    setFoto((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(file) })
  }
  const removerFoto = () => setFoto((prev) => { if (prev) URL.revokeObjectURL(prev); return null })

  const escolherCv = (file?: File) => {
    if (!file) return
    if (!/\.(pdf|docx?)$/i.test(file.name)) { setCvErro(t('candidato.curriculo.formato')); return }
    if (file.size > MAX_CV_MB * 1024 * 1024) { setCvErro(t('candidato.curriculo.tamanho', { max: MAX_CV_MB })); return }
    setCvErro(null); setCv(file)
  }

  const voltar = () => { window.location.href = '/painel' }
  const salvar = () => {
    if (!podeSalvar) return
    setSenha({ atual: '', nova: '', confirmar: '' })
    toast.success(t('salvo'))
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className={cn('sticky top-0 z-30', HEADER_SURFACE)}>
        <div className="mx-auto w-full max-w-6xl px-5 lg:px-8">
          <CandidatoBrandRow brand={brand} mode={mode} onCycleBrand={onCycleBrand} onToggleMode={onToggleMode} onSair={onSair} logoHref="/painel" logoLabel={tp('conta.irMural')} conta />
        </div>
      </header>

      <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
        <PageContainer>
          {/* Coluna estreita e CENTRADA — padrão de tela de configurações/perfil. */}
          <div className="mx-auto max-w-2xl space-y-7">
            <PageHeader icon={UserRound} title={t('titulo')} desc={t('candidato.subtitulo')} />

            <div className="space-y-6">
              {/* Identidade + foto */}
              <section className={cn(CARD, 'flex flex-wrap items-center gap-4 p-6')}>
                <Avatar className="size-16">
                  {foto && <AvatarImage src={foto} alt="" />}
                  <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">{candidato.iniciais}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="ty-body-lg font-semibold text-foreground">{form.nome || candidato.nome}</p>
                  <p className="truncate ty-body-sm text-muted-foreground">{form.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {foto && <Button variant="ghost" onClick={removerFoto} className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive-text"><Trash2 aria-hidden /> {t('foto.remover')}</Button>}
                  <Button variant="outline" onClick={() => fotoRef.current?.click()}><Camera aria-hidden /> {t('trocarFoto')}</Button>
                </div>
                <input ref={fotoRef} type="file" accept="image/*" aria-label={t('trocarFoto')} className="hidden" onChange={(e) => { escolherFoto(e.target.files?.[0]); e.target.value = '' }} />
              </section>

              {/* Dados de contato */}
              <Panel title={t('dados.titulo')} desc={t('dados.desc')}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Campo id="c-nome" label={tu('sheet.nome')}>
                      <Input id="c-nome" value={form.nome} onChange={(e) => set('nome', e.target.value)} placeholder={tu('sheet.nomePlaceholder')} autoComplete="name" />
                    </Campo>
                  </div>
                  <div className="sm:col-span-2">
                    <Campo id="c-email" label={tu('sheet.email')} erro={emailErro ? tu('sheet.emailInvalido') : undefined}>
                      <Input id="c-email" type="email" inputMode="email" value={form.email} onChange={(e) => set('email', e.target.value)} aria-invalid={emailErro} placeholder={tu('sheet.emailPlaceholder')} autoComplete="email" />
                    </Campo>
                  </div>
                  <Campo id="c-tel" label={tu('sheet.telefone')}>
                    <Input id="c-tel" inputMode="tel" value={form.telefone} onChange={(e) => set('telefone', maskTel(e.target.value))} placeholder={tu('sheet.telefonePlaceholder')} autoComplete="tel" />
                  </Campo>
                </div>
              </Panel>

              {/* Currículo (o antigo "Editar currículo", agora junto do perfil) */}
              <Panel title={t('candidato.curriculo.titulo')} desc={t('candidato.curriculo.desc')}>
                {!cv ? (
                  <div className="relative">
                    <input
                      id="c-cv" type="file" accept=".pdf,.doc,.docx" aria-invalid={!!cvErro}
                      aria-describedby={cvErro ? 'c-cv-erro' : 'c-cv-dica'}
                      onChange={(e) => { escolherCv(e.target.files?.[0]); e.target.value = '' }}
                      className="peer absolute inset-0 z-10 size-full cursor-pointer opacity-0"
                    />
                    <div className={cn('flex flex-col items-center justify-center gap-1.5 rounded-md border border-dashed px-4 py-6 text-center transition-colors peer-hover:bg-accent/40 peer-focus-visible:border-ring peer-focus-visible:bg-accent/40 peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50', cvErro ? 'border-destructive bg-destructive/5' : 'border-input')}>
                      <p className={cn('flex items-center gap-2 ty-body-sm font-medium', cvErro ? 'text-destructive-text' : 'text-link')}>
                        <Upload className="size-4" aria-hidden /> {t('candidato.curriculo.enviar')}
                      </p>
                      <p id="c-cv-dica" className="ty-body-sm text-muted-foreground">{t('candidato.curriculo.dica', { max: MAX_CV_MB })}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-md border border-dashed border-success/50 bg-success/10 px-4 py-5">
                    <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-md bg-success/15 text-success-text"><FileText className="size-5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 ty-body-sm font-medium text-success-text"><Check className="size-4 shrink-0" aria-hidden /> {t('candidato.curriculo.anexado')}</p>
                      <p className="truncate ty-body-sm font-medium">{cv.name}<span className="font-normal text-muted-foreground"> · {(cv.size / 1024).toFixed(0)} KB</span></p>
                    </div>
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => { setCv(null); setCvErro(null) }} aria-label={t('candidato.curriculo.remover')} className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive-text"><X className="size-4" /></Button>
                  </div>
                )}
                {cvErro && <p id="c-cv-erro" role="alert" className="mt-2 ty-body-sm text-destructive-text">{cvErro}</p>}
              </Panel>

              {/* Alterar senha (opcional, com política de força) */}
              <Panel title={t('senha.titulo')} desc={t('senha.desc')}>
                <div className="space-y-4">
                  <div className="sm:max-w-[calc(50%-0.5rem)]">
                    <Campo id="c-atual" label={t('senha.atual')}>
                      <Input id="c-atual" type="password" value={senha.atual} onChange={(e) => setS('atual', e.target.value)} autoComplete="current-password" />
                    </Campo>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Campo id="c-nova" label={t('senha.nova')}>
                      {/* describedby só quando o bloco de requisitos existe (ele monta com querSenha) — sem ref órfã. */}
                      <Input id="c-nova" type="password" value={senha.nova} onChange={(e) => setS('nova', e.target.value)} aria-invalid={nova.length > 0 && !novaForte} aria-describedby={querSenha ? 'c-nova-req' : undefined} autoComplete="new-password" />
                    </Campo>
                    <Campo id="c-conf" label={t('senha.confirmar')} erro={naoConfere ? t('senha.erroConfirma') : undefined}>
                      <Input id="c-conf" type="password" value={senha.confirmar} onChange={(e) => setS('confirmar', e.target.value)} aria-invalid={naoConfere} autoComplete="new-password" />
                    </Campo>
                  </div>
                  {querSenha && (
                    <div id="c-nova-req" className="rounded-lg bg-muted/50 p-3">
                      <p className="ty-caption font-medium text-foreground">{t('senha.requisitos.titulo')}</p>
                      <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                        {regras.map((r) => <Requisito key={r.key} ok={r.ok} label={t(`senha.requisitos.${r.key}` as 'senha.requisitos.tamanho')} />)}
                      </ul>
                    </div>
                  )}
                </div>
              </Panel>

              {/* Ações */}
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={voltar}><X aria-hidden /> {t('cancelar')}</Button>
                <Button onClick={salvar} disabled={!podeSalvar}><Check aria-hidden /> {t('salvar')}</Button>
              </div>
            </div>
          </div>
        </PageContainer>
      </div>
    </div>
  )
}
