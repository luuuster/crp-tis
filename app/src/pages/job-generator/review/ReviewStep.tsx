import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AlertTriangle, ArrowUpRight, CheckCircle2, FileText, Info, Rocket, Sparkles, Wand2 } from 'lucide-react'
import type { TFunction } from 'i18next'

import { cn } from '@/lib/utils'
import { focusRing } from '@/lib/focus'
import { CARD } from '@/lib/surfaces'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
import type { Finding, Severity } from '../charlie-review'
import { CharBadge } from './CharBadge'
import { CopyButton } from './CopyButton'
import { CopyPostBlock } from './CopyPostBlock'

// Ícone + cor (token -text, AA por tema) de cada severidade do achado do Charlie.
const TONE: Record<Severity, { Icon: typeof AlertTriangle; cls: string }> = {
  critica: { Icon: AlertTriangle, cls: 'text-destructive-text' },
  aviso: { Icon: AlertTriangle, cls: 'text-warning-text' },
  info: { Icon: Info, cls: 'text-muted-foreground' },
  ok: { Icon: CheckCircle2, cls: 'text-success-text' },
}

function FindingRow({ f, t, onAjustar }: { f: Finding; t: TFunction<'gerador'>; onAjustar: (n: 1 | 2 | 3) => void }) {
  const { Icon, cls } = TONE[f.severity]
  return (
    <li className="flex gap-2.5">
      <Icon className={cn('mt-0.5 size-4 shrink-0', cls)} aria-hidden />
      <div className="min-w-0 space-y-0.5">
        <p className="ty-body-sm font-medium text-foreground">{t(`review.charlie.${f.tituloKey}` as 'review.charlie.salarioAbaixo.titulo', f.params)}</p>
        <p className="ty-caption text-muted-foreground">{t(`review.charlie.${f.detalheKey}` as 'review.charlie.salarioAbaixo.detalhe', f.params)}</p>
        {f.goto && f.severity !== 'ok' && (
          <button type="button" onClick={() => onAjustar(f.goto!)} className={cn('mt-0.5 inline-flex items-center gap-1 rounded-md ty-caption font-medium text-primary-text transition-colors hover:underline', focusRing)}>
            <ArrowUpRight className="size-3 shrink-0" aria-hidden /> {t('review.charlie.ajustar')}
          </button>
        )}
      </div>
    </li>
  )
}

export function ReviewStep({ data, perfil, tom, onTom, set, resumoOverride, onResumoChange, onResolve, onPublish, ctaLabel, findings, revisado, onRevisar, canPublish, overridden, onOverride }: {
  data: Briefing; perfil: Perfil; tom: Tom; onTom: (t: Tom) => void
  set: SetBriefing; resumoOverride: string | null; onResumoChange: (v: string | null) => void
  onResolve: (n: number) => void; onPublish: () => void; ctaLabel: string
  // Revisão do Charlie: `findings` é calculado ao vivo no pai (reage à edição da vaga); `revisado` marca
  // que o usuário rodou a revisão (libera o painel); `canPublish` já considera críticas + override.
  findings: Finding[]; revisado: boolean; onRevisar: () => void
  canPublish: boolean; overridden: boolean; onOverride: () => void
}) {
  const { t } = useTranslation('gerador')
  const desc = buildDesc(data, perfil, tom)
  const resumoFinal = resumoOverride ?? desc.resumo
  const [revisando, setRevisando] = useState(false)
  const criticas = findings.filter((f) => f.severity === 'critica').length
  const avisos = findings.filter((f) => f.severity === 'aviso').length
  // "Revisar vaga com Charlie" (demo): o Charlie aprimora os 3 blocos narrativos E revela a análise de
  // consistência (salário × mercado, experiência × nível…). Os achados em si reagem à edição da vaga.
  const revisar = () => {
    setRevisando(true)
    window.setTimeout(() => {
      onResumoChange(melhorarResumo(data, perfil))
      set('desafio', melhorarDesafio(data))
      set('objetivo', melhorarObjetivo(data, perfil))
      setRevisando(false)
      onRevisar()
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
  // Mensagem ligada ao bloqueio do Publicar (revise → corrija crítica → libera).
  const publishHint = !revisado ? t('review.reviseParaPublicar')
    : criticas > 0 && !overridden ? t('review.charlie.bloqueadoCritica')
    : null

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
        {/* título da descrição + cópia (o "Revisar vaga com Charlie" mora na coluna de Ações, ao lado da análise) */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <h2 className="flex items-center gap-1.5 ty-label-sm font-medium text-foreground"><FileText className="size-3.5 shrink-0 text-muted-foreground" aria-hidden /> {t('review.descricaoVaga')}</h2>
          <CopyButton text={postText} />
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

        {/* Card único "Qualidade & Revisão": faixa compacta de completude + análise de consistência do Charlie. */}
        <div className={cn(CARD, 'space-y-4 p-4', revisado && criticas > 0 ? 'bg-destructive/5' : aprovado ? 'bg-success/5' : 'bg-warning/5')}>
          {/* Qualidade (completude) — número inline + barra fina, sem o número gigante de antes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="ty-label-sm text-muted-foreground">{t('review.scoreQualidade')}</span>
              <span className={cn('inline-flex items-center gap-1.5 ty-label-sm font-semibold', aprovado ? 'text-success-text' : 'text-warning-text')}>
                {aprovado ? <CheckCircle2 className="size-4 shrink-0" aria-hidden /> : <AlertTriangle className="size-4 shrink-0" aria-hidden />}
                <span className="tabular-nums text-foreground">{score.toFixed(0)}</span><span className="text-muted-foreground">/100</span>
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(score)} aria-valuemin={0} aria-valuemax={100} aria-label={t('review.scoreQualidade')}>
              <div className={cn('h-full rounded-full motion-safe:transition-[width] motion-safe:duration-500', aprovado ? 'bg-success' : 'bg-warning')} style={{ width: `${score}%` }} />
            </div>
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

          <div className="h-px bg-border/60" aria-hidden />

          {/* Revisão do Charlie — consistência (salário × mercado, jornada, experiência × nível…). */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-1.5 ty-label-sm font-medium text-foreground"><Sparkles className="size-4 shrink-0 text-secondary-text" aria-hidden /> {t('review.charlie.titulo')}</h3>
            {!revisado ? (
              <p className="ty-body-sm text-muted-foreground">{t('review.charlie.aguardando')}</p>
            ) : (
              <>
                {criticas > 0 || avisos > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {criticas > 0 && <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 ty-caption font-medium text-destructive-text">{t('review.charlie.resumoCriticas', { count: criticas })}</span>}
                    {avisos > 0 && <span className="inline-flex items-center rounded-full bg-warning/10 px-2 py-0.5 ty-caption font-medium text-warning-text">{t('review.charlie.resumoAvisos', { count: avisos })}</span>}
                  </div>
                ) : (
                  <p className="flex items-center gap-1.5 ty-body-sm text-success-text"><CheckCircle2 className="size-4 shrink-0" aria-hidden /> {t('review.charlie.tudoCerto')}</p>
                )}
                {findings.length > 0 && (
                  <ul className="space-y-2.5">
                    {findings.map((f) => <FindingRow key={f.id} f={f} t={t} onAjustar={onResolve} />)}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>

        {/* Ações principais. No mobile o "Publicar" vai pro rodapé fixo (sempre alcançável). */}
        {/* Publicar fica BLOQUEADO até revisar com o Charlie e zerar as inconsistências críticas (ou "Publicar mesmo assim"). */}
        <div className="space-y-2">
          {/* mobile: dica visível (o botão de publicar vive no rodapé fixo, sem hover) */}
          {publishHint && <p className="ty-caption text-muted-foreground lg:hidden">{publishHint}</p>}
          {/* desktop: o "porquê" do bloqueio aparece no hover/foco do próprio Publicar.
              O <span> é necessário porque o <button disabled> não emite eventos de mouse (Radix). */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block w-full max-lg:hidden" tabIndex={canPublish ? undefined : 0}>
                <Button className="w-full" disabled={!canPublish} onClick={onPublish}><Rocket aria-hidden /> {ctaLabel}</Button>
              </span>
            </TooltipTrigger>
            {!canPublish && publishHint && <TooltipContent side="top" className="max-w-[16rem] text-center">{publishHint}</TooltipContent>}
          </Tooltip>
          {revisado && criticas > 0 && !overridden && (
            <button type="button" onClick={onOverride} className={cn('inline-flex w-full items-center justify-center rounded-md py-1 ty-caption font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline', focusRing)}>
              {t('review.charlie.publicarMesmoAssim')}
            </button>
          )}
          {/* Disparo da revisão do Charlie — persona secundária da marca (roxo CRP / azul MarcaB). */}
          <Button variant="secondary-soft" isLoading={revisando} onClick={revisar} className="w-full">
            {!revisando && <Wand2 aria-hidden />}
            {revisando ? t('review.melhorando') : revisado ? t('review.charlie.revisarNovamente') : t('review.melhorarIA')}
          </Button>
        </div>
      </aside>
    </div>
  )
}
