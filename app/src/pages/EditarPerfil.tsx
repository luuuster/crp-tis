/**
 * Editar perfil (recrutador, porta 5173) — tela cheia acessada pelo menu de conta ("Editar perfil").
 * Formulário de MOCKUP (sem backend): mesmos dados do cadastro de usuário (reusa rótulos/máscaras) + troca
 * de foto (preview client-side) + alteração de senha com política de força. Semeado a partir do DEMO_USER.
 * Regra de permissão: só ADMINISTRADOR altera o próprio e-mail e o cargo (o usuário-demo é admin).
 * 100% token-driven, multi-marca, claro/escuro e WCAG 2.2 AA.
 */
import { useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Camera, Check, CheckCircle2, Circle, Lock, ShieldCheck, Trash2, UserRound, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { CARD } from '@/lib/surfaces'
import { maskCPF, maskCNPJ, maskTel, maskData } from '@/lib/masks'
import { AppShell } from '@/components/shell/AppShell'
import { DEMO_USER } from '@/components/shell/topbar-parts'
import { PageContainer, PageHeader, Panel } from '@/components/page'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Só admin edita e-mail/cargo — no mockup o usuário-demo é Administrador (para os demais, os campos ficam
// bloqueados com aviso). MAX_FOTO_MB limita o upload (só preview, sem backend).
const IS_ADMIN = DEMO_USER.funcao === 'Administrador'
const MAX_FOTO_MB = 5

type TipoPessoa = 'Pessoa Física' | 'Pessoa Jurídica'

// Item da checklist de força da senha (verde quando cumprido).
function Requisito({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={cn('flex items-center gap-1.5 ty-caption', ok ? 'text-success-text' : 'text-muted-foreground')}>
      {ok ? <CheckCircle2 className="size-3.5 shrink-0" aria-hidden /> : <Circle className="size-3.5 shrink-0" aria-hidden />}
      <span>{label}</span>
    </li>
  )
}

// Campo do formulário: rótulo (+ cadeado quando bloqueado) + controle + (erro OU dica).
function Campo({ id, label, dica, erro, bloqueado, children }: {
  id: string; label: string; dica?: string; erro?: string; bloqueado?: boolean; children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}{bloqueado && <Lock className="size-3 text-muted-foreground" aria-hidden />}</Label>
      {children}
      {erro ? <p id={`${id}-erro`} role="alert" className="ty-caption text-destructive-text">{erro}</p>
        : dica ? <p id={`${id}-dica`} className="ty-caption text-muted-foreground">{dica}</p> : null}
    </div>
  )
}

export function EditarPerfil({ onNavigate, brand, mode, onCycleBrand, onToggleMode }: {
  onNavigate: (v: string) => void
  brand?: string; mode?: string; onCycleBrand?: () => void; onToggleMode?: () => void
}) {
  const { t } = useTranslation('perfil')
  const { t: tu } = useTranslation('usuarios') // rótulos/placeholders compartilhados com o cadastro de usuário
  const [form, setForm] = useState<{ nome: string; email: string; telefone: string; cpf: string; tipoPessoa: TipoPessoa; nascimento: string }>({
    nome: DEMO_USER.nome, email: DEMO_USER.email, telefone: DEMO_USER.telefone, cpf: DEMO_USER.cpf,
    tipoPessoa: DEMO_USER.tipoPessoa, nascimento: DEMO_USER.nascimento,
  })
  const [senha, setSenha] = useState({ atual: '', nova: '', confirmar: '' })
  const [foto, setFoto] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const set = (k: 'nome' | 'email' | 'telefone' | 'cpf' | 'nascimento', v: string) => setForm((f) => ({ ...f, [k]: v }))
  const setS = (k: keyof typeof senha, v: string) => setSenha((s) => ({ ...s, [k]: v }))

  const isPJ = form.tipoPessoa === 'Pessoa Jurídica'
  const maskDoc = isPJ ? maskCNPJ : maskCPF
  const emailValido = /.+@.+\..+/.test(form.email)
  const emailErro = IS_ADMIN && form.email.length > 0 && !emailValido

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

  const podeSalvar = form.nome.trim().length > 0 && (!IS_ADMIN || emailValido) && senhaOk

  const escolherFoto = (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error(t('foto.erroFormato')); return }
    if (file.size > MAX_FOTO_MB * 1024 * 1024) { toast.error(t('foto.erroTamanho', { max: MAX_FOTO_MB })); return }
    setFoto((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(file) })
  }
  const removerFoto = () => setFoto((prev) => { if (prev) URL.revokeObjectURL(prev); return null })

  const salvar = () => {
    if (!podeSalvar) return
    setSenha({ atual: '', nova: '', confirmar: '' })
    toast.success(t('salvo'))
  }

  return (
    <AppShell active="perfil" crumb={t('trilha')} onNavigate={onNavigate} brand={brand} mode={mode} onCycleBrand={onCycleBrand} onToggleMode={onToggleMode}>
      <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
        <PageContainer>
          {/* Coluna estreita e CENTRADA (header + cards) — padrão de tela de configurações/perfil. */}
          <div className="mx-auto max-w-2xl space-y-7">
            <PageHeader icon={UserRound} title={t('titulo')} desc={t('subtitulo')} />

            <div className="space-y-6">
            {/* Identidade + foto */}
            <section className={cn(CARD, 'flex flex-wrap items-center gap-4 p-6')}>
              <Avatar className="size-16">
                {foto && <AvatarImage src={foto} alt="" />}
                <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">{DEMO_USER.iniciais}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="ty-body-lg font-semibold text-foreground">{form.nome || DEMO_USER.nome}</p>
                <p className="truncate ty-body-sm text-muted-foreground">{form.email}</p>
                <Badge variant="secondary" className="mt-1.5 gap-1 font-medium"><ShieldCheck className="size-3.5" aria-hidden /> {t('funcaoValor')}</Badge>
              </div>
              <div className="flex items-center gap-2">
                {foto && <Button variant="ghost" onClick={removerFoto} className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive-text"><Trash2 aria-hidden /> {t('foto.remover')}</Button>}
                <Button variant="outline" onClick={() => fileRef.current?.click()}><Camera aria-hidden /> {t('trocarFoto')}</Button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" aria-label={t('trocarFoto')} className="hidden" onChange={(e) => { escolherFoto(e.target.files?.[0]); e.target.value = '' }} />
            </section>

            {/* Dados pessoais (mesmos campos do cadastro de usuário) */}
            <Panel title={t('dados.titulo')} desc={t('dados.desc')}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Campo id="p-nome" label={tu('sheet.nome')}>
                    <Input id="p-nome" value={form.nome} onChange={(e) => set('nome', e.target.value)} placeholder={tu('sheet.nomePlaceholder')} autoComplete="name" />
                  </Campo>
                </div>
                <div className="sm:col-span-2">
                  <Campo id="p-email" label={tu('sheet.email')} bloqueado={!IS_ADMIN}
                    dica={!IS_ADMIN ? t('dados.emailBloqueado') : undefined}
                    erro={emailErro ? tu('sheet.emailInvalido') : undefined}>
                    <Input id="p-email" type="email" inputMode="email" value={form.email} disabled={!IS_ADMIN}
                      onChange={(e) => set('email', e.target.value)} aria-invalid={emailErro} placeholder={tu('sheet.emailPlaceholder')} autoComplete="email" />
                  </Campo>
                </div>
                <Campo id="p-tel" label={tu('sheet.telefone')}>
                  <Input id="p-tel" inputMode="tel" value={form.telefone} onChange={(e) => set('telefone', maskTel(e.target.value))} placeholder={tu('sheet.telefonePlaceholder')} autoComplete="tel" />
                </Campo>
                <Campo id="p-doc" label={isPJ ? tu('sheet.doc.cnpj') : tu('sheet.doc.cpf')}>
                  <Input id="p-doc" inputMode="numeric" value={form.cpf} onChange={(e) => set('cpf', maskDoc(e.target.value))} placeholder={isPJ ? tu('sheet.doc.cnpjPlaceholder') : tu('sheet.doc.cpfPlaceholder')} autoComplete="off" />
                </Campo>
                <div className="space-y-1.5">
                  <Label htmlFor="p-tipo">{tu('sheet.tipoPessoa')}</Label>
                  <Select value={form.tipoPessoa} onValueChange={(v) => setForm((f) => ({ ...f, tipoPessoa: v as TipoPessoa, cpf: (v === 'Pessoa Jurídica' ? maskCNPJ : maskCPF)(f.cpf) }))}>
                    <SelectTrigger id="p-tipo" className="w-full"><SelectValue>{tu(`tipoPessoa.${form.tipoPessoa}` as 'tipoPessoa.Pessoa Física')}</SelectValue></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pessoa Física">{tu('tipoPessoa.Pessoa Física')}</SelectItem>
                      <SelectItem value="Pessoa Jurídica">{tu('tipoPessoa.Pessoa Jurídica')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Campo id="p-nasc" label={tu('sheet.data.nascimento')}>
                  <Input id="p-nasc" inputMode="numeric" value={form.nascimento} onChange={(e) => set('nascimento', maskData(e.target.value))} placeholder={tu('sheet.data.placeholder')} autoComplete="off" />
                </Campo>
              </div>
            </Panel>

            {/* Alterar senha (opcional, com política de força) */}
            <Panel title={t('senha.titulo')} desc={t('senha.desc')}>
              <div className="space-y-4">
                <div className="sm:max-w-[calc(50%-0.5rem)]">
                  <Campo id="p-atual" label={t('senha.atual')}>
                    <Input id="p-atual" type="password" value={senha.atual} onChange={(e) => setS('atual', e.target.value)} autoComplete="current-password" />
                  </Campo>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo id="p-nova" label={t('senha.nova')}>
                    <Input id="p-nova" type="password" value={senha.nova} onChange={(e) => setS('nova', e.target.value)} aria-invalid={nova.length > 0 && !novaForte} aria-describedby="p-nova-req" autoComplete="new-password" />
                  </Campo>
                  <Campo id="p-conf" label={t('senha.confirmar')} erro={naoConfere ? t('senha.erroConfirma') : undefined}>
                    <Input id="p-conf" type="password" value={senha.confirmar} onChange={(e) => setS('confirmar', e.target.value)} aria-invalid={naoConfere} autoComplete="new-password" />
                  </Campo>
                </div>
                {querSenha && (
                  <div id="p-nova-req" className="rounded-lg bg-muted/50 p-3">
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
              <Button variant="outline" onClick={() => onNavigate('dashboard')}><X aria-hidden /> {t('cancelar')}</Button>
              <Button onClick={salvar} disabled={!podeSalvar}><Check aria-hidden /> {t('salvar')}</Button>
            </div>
            </div>
          </div>
        </PageContainer>
      </div>
    </AppShell>
  )
}
