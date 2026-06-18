import { useTranslation } from 'react-i18next'
import { Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils'
import { focusRing } from '@/lib/focus'
import { FIELD, CARD } from '@/lib/surfaces'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import type { Perfil } from '@/lib/vaga'
import { SectionBlock } from './SectionBlock'
import { Field, Chips } from './fields'
import {
  CONHECIMENTOS_POOL,
  EXIGENCIAS,
  HABILIDADES_POOL,
  PERFIL_SECTIONS,
  STACK_POOL,
  fieldsStatus,
  isFilledVal,
  optLabeler,
  type SetPerfil,
} from './model'

export function PerfilForm({ perfil, set, showErrors }: { perfil: Perfil; set: SetPerfil; showErrors?: boolean }) {
  const { t } = useTranslation('gerador')
  const inv = (k: keyof Perfil) => !!showErrors && !isFilledVal(perfil[k])
  const exigLabel = optLabeler(t, 'exigencia')
  const techLabel = optLabeler(t, 'tech')
  const toggleExig = (e: string, on: boolean) => set('exigencias', on ? [...perfil.exigencias, e] : perfil.exigencias.filter((x) => x !== e))
  return (
    <div className="space-y-5">
      {/* Aviso de template: o passo 2 vem pré-preenchido a partir do briefing — pede revisão. */}
      <div className="flex items-start gap-3 rounded-xl border-l-2 border-primary bg-primary/5 px-4 py-3">
        <Sparkles className="mt-0.5 size-4.5 shrink-0 text-primary-text" aria-hidden />
        <p className="ty-body-sm text-muted-foreground"><span className="font-semibold text-foreground">{t('perfil.templateAviso')}</span>{t('perfil.templateAvisoResto')}</p>
      </div>

      <div className={cn(CARD, 'divide-y divide-border/50 overflow-hidden')}>
        {/* 1 · Requisitos técnicos — formação (texto) + exigências formais (checkboxes) + stack */}
        <SectionBlock meta={PERFIL_SECTIONS[0]} status={fieldsStatus(perfil, PERFIL_SECTIONS[0].fields)}>
          <div className="space-y-5">
            <fieldset className="space-y-2">
              <legend className="ty-label-sm text-muted-foreground">{t('perfil.exigenciasLegenda')}</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {EXIGENCIAS.map((e) => (
                  <label key={e} className={cn('flex cursor-pointer items-center gap-2.5 rounded-lg border border-border/70 bg-muted/40 px-3 py-2.5 ty-body-sm transition-colors hover:border-border hover:bg-muted/60', focusRing)}>
                    <Checkbox checked={perfil.exigencias.includes(e)} onCheckedChange={(v) => toggleExig(e, v === true)} />
                    {exigLabel(e)}
                  </label>
                ))}
              </div>
            </fieldset>
            <Field id="formacao" label={t('perfil.formacao.label')} required hint={t('perfil.formacao.hint')} invalid={inv('formacao')}>
              <Textarea id="formacao" value={perfil.formacao} onChange={(e) => set('formacao', e.target.value)} placeholder={t('perfil.formacao.placeholder')} style={{ lineHeight: 1.65 }} className={cn('min-h-24 resize-y', FIELD)} />
            </Field>
            <Field id="experiencia" label={t('perfil.experiencia.label')} required hint={t('perfil.experiencia.hint')} invalid={inv('experiencia')}>
              <Textarea id="experiencia" value={perfil.experiencia} onChange={(e) => set('experiencia', e.target.value)} placeholder={t('perfil.experiencia.placeholder')} style={{ lineHeight: 1.65 }} className={cn('min-h-24 resize-y', FIELD)} />
            </Field>
            <Field id="stack-obr" label={t('perfil.stackObrigatoria.label')} required hint={t('perfil.stackObrigatoria.hint')} invalid={inv('stackObrigatoria')}>
              <Chips value={perfil.stackObrigatoria} onChange={(v) => set('stackObrigatoria', v)} pool={STACK_POOL} labelOf={techLabel} addLabel={t('perfil.stackObrigatoria.addLabel')} searchPlaceholder={t('perfil.stackObrigatoria.buscar')} emptyHint={t('perfil.stackObrigatoria.vazio')} />
            </Field>
          </div>
        </SectionBlock>

        {/* 2 · Diferenciais (opcional) */}
        <SectionBlock meta={PERFIL_SECTIONS[1]} status="opcional">
          <Field id="conhecimentos-des" label={t('perfil.conhecimentos.label')} hint={t('perfil.conhecimentos.hint')}>
            <Chips value={perfil.conhecimentosDesejaveis} onChange={(v) => set('conhecimentosDesejaveis', v)} pool={CONHECIMENTOS_POOL} labelOf={techLabel} addLabel={t('perfil.conhecimentos.addLabel')} searchPlaceholder={t('perfil.conhecimentos.buscar')} emptyHint={t('perfil.conhecimentos.vazio')} />
          </Field>
        </SectionBlock>

        {/* 3 · Responsabilidades & perfil — atribuições (texto) + soft skills */}
        <SectionBlock meta={PERFIL_SECTIONS[2]} status={fieldsStatus(perfil, PERFIL_SECTIONS[2].fields)}>
          <div className="space-y-5">
            <Field id="responsabilidades" label={t('perfil.responsabilidades.label')} required hint={t('perfil.responsabilidades.hint')} invalid={inv('responsabilidades')}>
              <Textarea id="responsabilidades" value={perfil.responsabilidades} onChange={(e) => set('responsabilidades', e.target.value)} placeholder={t('perfil.responsabilidades.placeholder')} style={{ lineHeight: 1.65 }} className={cn('min-h-28 resize-y', FIELD)} />
            </Field>
            <Field id="habilidades" label={t('perfil.habilidades.label')} hint={t('perfil.habilidades.hint')}>
              <Chips value={perfil.habilidades} onChange={(v) => set('habilidades', v)} pool={HABILIDADES_POOL} labelOf={optLabeler(t, 'habilidade')} addLabel={t('perfil.habilidades.addLabel')} searchPlaceholder={t('perfil.habilidades.buscar')} emptyHint={t('perfil.habilidades.vazio')} />
            </Field>
            <Field id="justificativa" label={t('perfil.justificativa.label')} required hint={t('perfil.justificativa.hint')} invalid={inv('justificativa')}>
              <Textarea id="justificativa" value={perfil.justificativa} onChange={(e) => set('justificativa', e.target.value)} placeholder={t('perfil.justificativa.placeholder')} style={{ lineHeight: 1.65 }} className={cn('min-h-24 resize-y', FIELD)} />
            </Field>
          </div>
        </SectionBlock>
      </div>
    </div>
  )
}
