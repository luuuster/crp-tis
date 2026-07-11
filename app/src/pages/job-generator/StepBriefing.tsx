import { useTranslation } from 'react-i18next'

import { Accessibility } from 'lucide-react'

import { cn } from '@/lib/utils'
import { FIELD, CARD } from '@/lib/surfaces'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { PAISES, estadosDe, cidadesDe, localLabel } from '@/lib/vagasCatalogo'
import type { Briefing } from '@/lib/vaga'
import { SectionBlock } from './SectionBlock'
import { Field, FormSelect, SearchSelect, Chips } from './fields'
import {
  BENEFICIOS_POOL,
  CARGAS,
  CARGOS,
  HORARIOS,
  MODALIDADES,
  MODELOS,
  MOTIVOS,
  NIVEIS,
  PRAZOS,
  PROCESSO_POOL,
  QUANTIDADES,
  SECTIONS,
  fieldsStatus,
  isFilledVal,
  optLabeler,
  type SetBriefing,
} from './model'

export function BriefingForm({ data, set, showErrors }: { data: Briefing; set: SetBriefing; showErrors?: boolean }) {
  const { t } = useTranslation('gerador')
  const inv = (k: keyof Briefing) => !!showErrors && !isFilledVal(data[k])
  // Local de trabalho em cascata: escolher um nível acima limpa os de baixo e recalcula o rótulo `local`
  // (usado na prosa gerada). País → Estado → Cidade, reaproveitando os dados do mural (PAISES/estadosDe/cidadesDe).
  const setLocal = (pais: string, estado: string, cidade: string) => {
    set('pais', pais); set('estado', estado); set('cidade', cidade); set('local', localLabel(pais, estado, cidade))
  }
  return (
    <div className={cn(CARD, 'divide-y divide-border/50 overflow-hidden')}>
      <SectionBlock meta={SECTIONS[0]} status={fieldsStatus(data, SECTIONS[0].fields)}>
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field id="cargo" label={t('briefing.cargo.label')} required invalid={inv('cargo')}><SearchSelect id="cargo" value={data.cargo} onChange={(v) => set('cargo', v)} options={CARGOS} labelOf={optLabeler(t, 'cargo')} placeholder={t('briefing.cargo.placeholder')} searchPlaceholder={t('briefing.cargo.buscar')} /></Field>
            <Field id="nivel" label={t('briefing.nivel.label')} required invalid={inv('nivel')}><FormSelect id="nivel" value={data.nivel} onChange={(v) => set('nivel', v)} options={NIVEIS} labelOf={optLabeler(t, 'nivel')} placeholder={t('briefing.nivel.placeholder')} /></Field>
            <Field id="modelo" label={t('briefing.modelo.label')} required invalid={inv('modelo')}><FormSelect id="modelo" value={data.modelo} onChange={(v) => set('modelo', v)} options={MODELOS} labelOf={optLabeler(t, 'modelo')} placeholder={t('briefing.modelo.placeholder')} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="cliente" label={t('briefing.cliente.label')} required hint={t('briefing.cliente.hint')} invalid={inv('cliente')}><Input id="cliente" value={data.cliente} onChange={(e) => set('cliente', e.target.value)} placeholder={t('briefing.cliente.placeholder')} className={cn(FIELD, 'min-h-[var(--button-height-lg)]')} /></Field>
            <Field id="gestor" label={t('briefing.gestor.label')} required hint={t('briefing.gestor.hint')} invalid={inv('gestor')}><Input id="gestor" value={data.gestor} onChange={(e) => set('gestor', e.target.value)} placeholder={t('briefing.gestor.placeholder')} className={cn(FIELD, 'min-h-[var(--button-height-lg)]')} /></Field>
          </div>
        </div>
      </SectionBlock>

      {/* "Sobre a vaga" é OPCIONAL: vem como rascunho e é refinada no passo do Charlie (sem obrigatoriedade). */}
      <SectionBlock meta={SECTIONS[1]} status="opcional">
        <div className="space-y-5">
          <Field id="desafio" label={t('briefing.desafio.label')} hint={t('briefing.desafio.hint')}>
            <Textarea id="desafio" value={data.desafio} onChange={(e) => set('desafio', e.target.value)} placeholder={t('briefing.desafio.placeholder')} style={{ lineHeight: 1.65 }} className={cn('min-h-24 resize-y', FIELD)} />
          </Field>
          <Field id="objetivo" label={t('briefing.objetivo.label')} hint={t('briefing.objetivo.hint')}>
            <Textarea id="objetivo" value={data.objetivo} onChange={(e) => set('objetivo', e.target.value)} placeholder={t('briefing.objetivo.placeholder')} style={{ lineHeight: 1.65 }} className={cn('min-h-24 resize-y', FIELD)} />
          </Field>
        </div>
      </SectionBlock>

      <SectionBlock meta={SECTIONS[2]} status={fieldsStatus(data, SECTIONS[2].fields)}>
        <div className="space-y-5">
          {/* Local de trabalho — cascata País → Estado → Cidade (cada nível destrava o seguinte). */}
          <div>
            <p className="mb-2 ty-caption font-semibold tracking-wide text-muted-foreground uppercase">{t('briefing.local.label')}</p>
            <div className="grid gap-4 sm:grid-cols-3">
              {/* País é uma PRÉVIA: a seleção de país entra numa próxima versão — por ora fica em Brasil (desabilitado). */}
              <Field id="pais" label={t('briefing.pais.label')} required invalid={inv('pais')} badge={<Badge variant="ghost" className="bg-warning/10 px-1.5 py-0 text-warning-text">{t('briefing.emBreve')}</Badge>} note={t('briefing.emBreveNota')}><FormSelect id="pais" value={data.pais} onChange={(v) => setLocal(v, '', '')} options={PAISES} placeholder={t('briefing.pais.placeholder')} disabled /></Field>
              <Field id="estado" label={t('briefing.estado.label')} required invalid={inv('estado')}><SearchSelect id="estado" value={data.estado} onChange={(v) => setLocal(data.pais, v, '')} options={estadosDe(data.pais)} disabled={!data.pais} placeholder={t('briefing.estado.placeholder')} /></Field>
              <Field id="cidade" label={t('briefing.cidade.label')} required invalid={inv('cidade')}><SearchSelect id="cidade" value={data.cidade} onChange={(v) => setLocal(data.pais, data.estado, v)} options={cidadesDe(data.pais, data.estado)} disabled={!data.estado} placeholder={t('briefing.cidade.placeholder')} /></Field>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="horario" label={t('briefing.horario.label')} required invalid={inv('horario')}><FormSelect id="horario" value={data.horario} onChange={(v) => set('horario', v)} options={HORARIOS} placeholder={t('briefing.horario.placeholder')} /></Field>
            <Field id="carga" label={t('briefing.carga.label')} required invalid={inv('carga')}><FormSelect id="carga" value={data.carga} onChange={(v) => set('carga', v)} options={CARGAS} labelOf={optLabeler(t, 'carga')} placeholder={t('briefing.carga.placeholder')} /></Field>
            <Field id="motivo" label={t('briefing.motivo.label')} required invalid={inv('motivo')}><FormSelect id="motivo" value={data.motivo} onChange={(v) => set('motivo', v)} options={MOTIVOS} labelOf={optLabeler(t, 'motivo')} placeholder={t('briefing.motivo.placeholder')} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="quantidade" label={t('briefing.quantidade.label')} required invalid={inv('quantidade')}><SearchSelect id="quantidade" value={String(data.quantidade)} onChange={(v) => set('quantidade', Number(v))} options={QUANTIDADES} placeholder={t('briefing.quantidade.placeholder')} searchPlaceholder={t('briefing.quantidade.buscar')} /></Field>
            {/* Prazo: por quanto tempo a vaga fica aberta (definido pelo RH). */}
            <Field id="prazo" label={t('briefing.prazo.label')} required hint={t('briefing.prazo.hint')} invalid={inv('prazo')}><FormSelect id="prazo" value={String(data.prazo)} onChange={(v) => set('prazo', Number(v))} options={PRAZOS} labelOf={(v) => t('briefing.prazo.dias', { count: Number(v) })} placeholder={t('briefing.prazo.placeholder')} /></Field>
          </div>
          {/* Vaga afirmativa para PcD — toggle OPCIONAL (fora dos campos obrigatórios da seção). */}
          <div className="flex items-center justify-between gap-3 rounded-xl border p-3.5">
            <div className="flex items-start gap-2.5">
              <Accessibility className="mt-0.5 size-4.5 shrink-0 text-muted-foreground" aria-hidden />
              <div>
                <p id="pcd-label" className="ty-body-sm font-medium text-foreground">{t('briefing.pcd.label')}</p>
                <p id="pcd-hint" className="mt-0.5 ty-caption text-muted-foreground">{t('briefing.pcd.hint')}</p>
              </div>
            </div>
            <Switch id="pcd" checked={data.pcd} onCheckedChange={(v) => set('pcd', v)} aria-labelledby="pcd-label" aria-describedby="pcd-hint" />
          </div>
        </div>
      </SectionBlock>

      <SectionBlock meta={SECTIONS[3]} status={fieldsStatus(data, SECTIONS[3].fields)}>
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="budget" label={t('briefing.budget.label')} required hint={t('briefing.budget.hint')} invalid={inv('budget')}><Input id="budget" value={data.budget} onChange={(e) => set('budget', e.target.value)} placeholder={t('briefing.budget.placeholder')} className={cn(FIELD, 'min-h-[var(--button-height-lg)]')} /></Field>
            <Field id="modalidade" label={t('briefing.modalidade.label')} required invalid={inv('modalidade')}><FormSelect id="modalidade" value={data.modalidade} onChange={(v) => set('modalidade', v)} options={MODALIDADES} labelOf={optLabeler(t, 'modalidade')} placeholder={t('briefing.modalidade.placeholder')} /></Field>
          </div>
          <Field id="beneficios" label={t('briefing.beneficios.label')} required invalid={inv('beneficios')}><Chips value={data.beneficios} onChange={(v) => set('beneficios', v)} pool={BENEFICIOS_POOL} labelOf={optLabeler(t, 'beneficio')} addLabel={t('briefing.beneficios.addLabel')} searchPlaceholder={t('briefing.beneficios.buscar')} emptyHint={t('briefing.beneficios.vazio')} /></Field>
        </div>
      </SectionBlock>

      <SectionBlock meta={SECTIONS[4]} status={fieldsStatus(data, SECTIONS[4].fields)}>
        <Field id="processo" label={t('briefing.processo.label')} required hint={t('briefing.processo.hint')} invalid={inv('processoSeletivo')}>
          <Chips ordered value={data.processoSeletivo} onChange={(v) => set('processoSeletivo', v)} pool={PROCESSO_POOL} labelOf={optLabeler(t, 'processo')} addLabel={t('briefing.processo.addLabel')} searchPlaceholder={t('briefing.processo.buscar')} emptyHint={t('briefing.processo.vazio')} />
        </Field>
      </SectionBlock>
    </div>
  )
}
