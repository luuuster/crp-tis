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
  type SetPerfil,
} from './model'

export function PerfilForm({ perfil, set, showErrors }: { perfil: Perfil; set: SetPerfil; showErrors?: boolean }) {
  const inv = (k: keyof Perfil) => !!showErrors && !isFilledVal(perfil[k])
  const toggleExig = (e: string, on: boolean) => set('exigencias', on ? [...perfil.exigencias, e] : perfil.exigencias.filter((x) => x !== e))
  return (
    <div className="space-y-5">
      {/* Aviso de template: o passo 2 vem pré-preenchido a partir do briefing — pede revisão. */}
      <div className="flex items-start gap-3 rounded-xl border-l-2 border-primary bg-primary/5 px-4 py-3">
        <Sparkles className="mt-0.5 size-4.5 shrink-0 text-primary-text" aria-hidden />
        <p className="ty-body-sm text-muted-foreground"><span className="font-semibold text-foreground">Template aplicado automaticamente.</span> Revise e ajuste cada campo conforme a realidade do projeto antes de avançar.</p>
      </div>

      <div className={cn(CARD, 'divide-y divide-border/50 overflow-hidden')}>
        {/* 1 · Requisitos técnicos — formação (texto) + exigências formais (checkboxes) + stack */}
        <SectionBlock meta={PERFIL_SECTIONS[0]} status={fieldsStatus(perfil, PERFIL_SECTIONS[0].fields)}>
          <div className="space-y-5">
            <fieldset className="space-y-2">
              <legend className="ty-label-sm text-muted-foreground">Exigências formais</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {EXIGENCIAS.map((e) => (
                  <label key={e} className={cn('flex cursor-pointer items-center gap-2.5 rounded-lg border border-border/70 bg-muted/40 px-3 py-2.5 ty-body-sm transition-colors hover:border-border hover:bg-muted/60', focusRing)}>
                    <Checkbox checked={perfil.exigencias.includes(e)} onCheckedChange={(v) => toggleExig(e, v === true)} />
                    {e}
                  </label>
                ))}
              </div>
            </fieldset>
            <Field id="formacao" label="Formação / Escolaridade" required hint="Nível e áreas de formação aceitos." invalid={inv('formacao')}>
              <Textarea id="formacao" value={perfil.formacao} onChange={(e) => set('formacao', e.target.value)} placeholder="Ex: Superior completo em Ciência da Computação ou áreas correlatas." style={{ lineHeight: 1.65 }} className={cn('min-h-24 resize-y', FIELD)} />
            </Field>
            <Field id="experiencia" label="Experiência obrigatória" required hint="Tempo e tipo de experiência mínima exigida." invalid={inv('experiencia')}>
              <Textarea id="experiencia" value={perfil.experiencia} onChange={(e) => set('experiencia', e.target.value)} placeholder="Ex: Mínimo 3 anos em desenvolvimento backend com Python e APIs RESTful." style={{ lineHeight: 1.65 }} className={cn('min-h-24 resize-y', FIELD)} />
            </Field>
            <Field id="stack-obr" label="Stack técnica obrigatória" required hint="Sem isso, o perfil não avança na triagem." invalid={inv('stackObrigatoria')}>
              <Chips value={perfil.stackObrigatoria} onChange={(v) => set('stackObrigatoria', v)} pool={STACK_POOL} addLabel="tecnologia" searchPlaceholder="Buscar tecnologia…" emptyHint="Nenhuma tecnologia — adicione ou peça ao Charlie." />
            </Field>
          </div>
        </SectionBlock>

        {/* 2 · Diferenciais (opcional) */}
        <SectionBlock meta={PERFIL_SECTIONS[1]} status="opcional">
          <Field id="conhecimentos-des" label="Conhecimentos desejáveis" hint="Pesam positivamente, mas não bloqueiam.">
            <Chips value={perfil.conhecimentosDesejaveis} onChange={(v) => set('conhecimentosDesejaveis', v)} pool={CONHECIMENTOS_POOL} addLabel="conhecimento" searchPlaceholder="Buscar conhecimento…" emptyHint="Adicione os diferenciais desejados." />
          </Field>
        </SectionBlock>

        {/* 3 · Responsabilidades & perfil — atribuições (texto) + soft skills */}
        <SectionBlock meta={PERFIL_SECTIONS[2]} status={fieldsStatus(perfil, PERFIL_SECTIONS[2].fields)}>
          <div className="space-y-5">
            <Field id="responsabilidades" label="Atribuições e responsabilidades" required hint="Uma por frase — viram bullets na descrição gerada." invalid={inv('responsabilidades')}>
              <Textarea id="responsabilidades" value={perfil.responsabilidades} onChange={(e) => set('responsabilidades', e.target.value)} placeholder="Ex: Desenvolver e manter APIs RESTful. Realizar code reviews. Mentorar pessoas." style={{ lineHeight: 1.65 }} className={cn('min-h-28 resize-y', FIELD)} />
            </Field>
            <Field id="habilidades" label="Habilidades comportamentais" hint="O tipo de pessoa que você procura (opcional).">
              <Chips value={perfil.habilidades} onChange={(v) => set('habilidades', v)} pool={HABILIDADES_POOL} addLabel="habilidade" searchPlaceholder="Buscar habilidade…" emptyHint="Adicione as soft skills desejadas." />
            </Field>
            <Field id="justificativa" label="Justificativa da contratação" required hint="Por que essa vaga existe — contexto livre para a aprovação." invalid={inv('justificativa')}>
              <Textarea id="justificativa" value={perfil.justificativa} onChange={(e) => set('justificativa', e.target.value)} placeholder="Ex: Expansão do produto X para novo cliente — necessidade de reforço técnico no time de backend." style={{ lineHeight: 1.65 }} className={cn('min-h-24 resize-y', FIELD)} />
            </Field>
          </div>
        </SectionBlock>
      </div>
    </div>
  )
}
