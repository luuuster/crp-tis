import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AlertTriangle, CheckCircle2, FileText, Plus, Rocket, Sparkles, Wand2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { focusRing } from '@/lib/focus'
import { CARD } from '@/lib/surfaces'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { buildDesc, type Briefing, type Perfil, type Tom } from '@/lib/vaga'
import { JobDocArticle } from '../JobDocArticle'
import {
  TONS,
  buildPostText,
  melhorarDesafio,
  melhorarObjetivo,
  melhorarResumo,
  missingRequired,
  requiredBriefingOk,
  requiredPerfilOk,
  type SetBriefing,
} from '../model'
import { CharBadge } from './CharBadge'
import { CopyButton } from './CopyButton'
import { CopyPostBlock } from './CopyPostBlock'

export function ReviewStep({ data, perfil, tom, onTom, set, resumoOverride, onResumoChange, onResolve, onPublish, onNova, ctaLabel }: {
  data: Briefing; perfil: Perfil; tom: Tom; onTom: (t: Tom) => void
  set: SetBriefing; resumoOverride: string | null; onResumoChange: (v: string | null) => void
  onResolve: (n: number) => void; onPublish: () => void; onNova: () => void; ctaLabel: string
}) {
  const { t } = useTranslation('gerador')
  const desc = buildDesc(data, perfil, tom)
  const resumoFinal = resumoOverride ?? desc.resumo
  const [melhorando, setMelhorando] = useState(false)
  // "Melhorar com IA" (demo): aprimora os 3 blocos narrativos de uma vez — dá pra editar à mão depois.
  const melhorar = () => {
    setMelhorando(true)
    window.setTimeout(() => {
      onResumoChange(melhorarResumo(data, perfil))
      set('desafio', melhorarDesafio(data))
      set('objetivo', melhorarObjetivo(data, perfil))
      setMelhorando(false)
      toast.success(t('review.melhorarToast'))
    }, 850)
  }
  const previewLen = (desc.titulo + resumoFinal + (data.desafio || '') + (data.objetivo || '') + desc.responsabilidades.join('') + desc.requisitos.join('') + desc.beneficios.join('') + data.processoSeletivo.join('')).length
  const postText = buildPostText(data, perfil, desc)
  const { brief, perf, briefTotal, perfTotal } = missingRequired(data, perfil)
  const missingCount = brief.length + perf.length
  const totalReq = briefTotal + perfTotal
  const charOk = previewLen <= 2000
  const score = Math.max(0, (totalReq ? (totalReq - missingCount) / totalReq : 1) * 100 - (charOk ? 0 : 8))
  const aprovado = missingCount === 0 && charOk
  const pendencias = [
    ...(requiredBriefingOk(data) ? [] : [{ label: t('review.briefingIncompleto'), goto: 1 }]),
    ...(requiredPerfilOk(perfil) ? [] : [{ label: t('review.perfilIncompleto'), goto: 2 }]),
    ...(charOk ? [] : [{ label: t('review.textoAcimaLimite'), goto: 3 }]),
  ]

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* ───── coluna principal · editar + tom + IA (no mobile vem PRIMEIRO; Publicar fica no rodapé fixo) ───── */}
      <div className="min-w-0 space-y-4">
        {/* barra de tom — reescreve o resumo automático ao vivo */}
        <div className="flex flex-col gap-3 rounded-xl bg-primary/[0.05] px-4 py-3 ring-1 ring-primary/15 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 ty-body-sm font-medium text-primary-text"><Sparkles className="size-4 shrink-0" aria-hidden /> {t('review.tomTitulo')}</p>
          <div role="group" aria-label={t('review.tomGrupo')} className="inline-flex rounded-lg bg-muted/60 p-0.5">
            {TONS.map((tomOpt) => (
              <button key={tomOpt} type="button" aria-pressed={tom === tomOpt} onClick={() => onTom(tomOpt)}
                className={cn('rounded-md px-2.5 py-1 ty-caption font-medium transition-colors', focusRing, tom === tomOpt ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{t(`review.tom.${tomOpt}`)}</button>
            ))}
          </div>
        </div>
        {/* título da descrição + ações de IA/cópia */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <h2 className="flex items-center gap-1.5 ty-label-sm font-medium text-foreground"><FileText className="size-3.5 shrink-0 text-muted-foreground" aria-hidden /> {t('review.descricaoVaga')}</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" isLoading={melhorando} onClick={melhorar} className="bg-secondary/10 text-secondary-text hover:bg-secondary/15 hover:text-secondary-text">
              {!melhorando && <Wand2 className="size-3.5" aria-hidden />}
              {melhorando ? t('review.melhorando') : t('review.melhorarIA')}
            </Button>
            <CopyButton text={postText} />
          </div>
        </div>
        <JobDocArticle
          desc={desc} data={data} perfil={perfil} resumo={resumoFinal}
          onEditResumo={(v) => onResumoChange(v.trim() ? v : null)}
          onEditDesafio={(v) => set('desafio', v)}
          onEditObjetivo={(v) => set('objetivo', v)}
        />
        <CharBadge len={previewLen} />
        <CopyPostBlock text={postText} />
      </div>

      {/* ───── coluna lateral · Ações (desktop: à direita, sticky; mobile: abaixo do post) ───── */}
      <aside className="space-y-4 lg:sticky lg:top-4" aria-label={t('review.acoes')}>
        <h2 className="ty-overline text-muted-foreground">{t('review.acoes')}</h2>

        {/* Score de qualidade — número + barra de progresso (derivado da completude + tamanho do post). */}
        <div className={cn(CARD, 'space-y-3 p-4', aprovado ? 'bg-success/5' : 'bg-warning/5')}>
          <div className="flex items-center justify-between gap-2">
            <span className="ty-label-sm text-muted-foreground">{t('review.scoreQualidade')}</span>
            <span className={cn('inline-flex items-center gap-1.5 ty-label-sm font-semibold', aprovado ? 'text-success-text' : 'text-warning-text')}>
              {aprovado ? <CheckCircle2 className="size-4 shrink-0" aria-hidden /> : <AlertTriangle className="size-4 shrink-0" aria-hidden />}
              {aprovado ? t('review.aprovado') : t('review.emRevisao')}
            </span>
          </div>
          <div className="flex items-end gap-1.5">
            <span className="ty-h3 tabular-nums text-foreground" style={{ fontWeight: 'var(--font-weight-bold)' }}>{score.toFixed(0)}</span>
            <span className="pb-1 ty-body-sm text-muted-foreground">/ 100</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(score)} aria-valuemin={0} aria-valuemax={100} aria-label={t('review.scoreQualidade')}>
            <div className={cn('h-full rounded-full motion-safe:transition-[width] motion-safe:duration-500', aprovado ? 'bg-success' : 'bg-warning')} style={{ width: `${score}%` }} />
          </div>
          <p className="ty-body-sm text-muted-foreground">{aprovado ? t('review.prontaParaPublicar') : t('review.resolvaPendencias')}</p>
          {pendencias.length > 0 && (
            <ul className="space-y-1.5 pt-1">
              {pendencias.map((item) => (
                <li key={item.label}>
                  <button type="button" onClick={() => onResolve(item.goto)} className={cn('inline-flex items-center gap-1.5 rounded-md ty-body-sm text-primary-text transition-colors hover:underline', focusRing)}>
                    <AlertTriangle className="size-3.5 shrink-0 text-warning-text" aria-hidden /> {t('review.resolver', { label: item.label })}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Ações principais. No mobile o "Publicar" vai pro rodapé fixo (sempre alcançável). */}
        <div className="space-y-2">
          <Button className="w-full max-lg:hidden" onClick={onPublish}><Rocket aria-hidden /> {ctaLabel}</Button>
          <ConfirmDialog
            icon={Plus} tone="primary" confirmVariant="default"
            title={t('review.novaVagaTitulo')}
            description={t('review.novaVagaDescricao')}
            confirmLabel={t('review.novaVagaConfirmar')} onConfirm={onNova}
            trigger={<Button variant="outline" className="w-full"><Plus aria-hidden /> {t('review.novaVaga')}</Button>}
          />
        </div>
      </aside>
    </div>
  )
}
