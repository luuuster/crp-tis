import { cn } from '@/lib/utils'
import { FIELD, CARD } from '@/lib/surfaces'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  PROCESSO_POOL,
  QUANTIDADES,
  SECTIONS,
  fieldsStatus,
  isFilledVal,
  type SetBriefing,
} from './model'

export function BriefingForm({ data, set, showErrors }: { data: Briefing; set: SetBriefing; showErrors?: boolean }) {
  const inv = (k: keyof Briefing) => !!showErrors && !isFilledVal(data[k])
  return (
    <div className={cn(CARD, 'divide-y divide-border/50 overflow-hidden')}>
      <SectionBlock meta={SECTIONS[0]} status={fieldsStatus(data, SECTIONS[0].fields)}>
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field id="cargo" label="Cargo / Papel" required invalid={inv('cargo')}><SearchSelect id="cargo" value={data.cargo} onChange={(v) => set('cargo', v)} options={CARGOS} placeholder="Selecione o cargo" searchPlaceholder="Buscar cargo…" /></Field>
            <Field id="nivel" label="Senioridade" required invalid={inv('nivel')}><FormSelect id="nivel" value={data.nivel} onChange={(v) => set('nivel', v)} options={NIVEIS} placeholder="Selecione a senioridade" /></Field>
            <Field id="modelo" label="Modelo" required invalid={inv('modelo')}><FormSelect id="modelo" value={data.modelo} onChange={(v) => set('modelo', v)} options={MODELOS} placeholder="Selecione o modelo" /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="cliente" label="Cliente / Projeto" required hint="Cliente ou projeto interno ao qual a vaga pertence." invalid={inv('cliente')}><Input id="cliente" value={data.cliente} onChange={(e) => set('cliente', e.target.value)} placeholder="Nome do cliente" className={cn(FIELD, 'min-h-[var(--button-height-lg)]')} /></Field>
            <Field id="gestor" label="Gestor imediato" required hint="Pessoa a quem a vaga se reporta." invalid={inv('gestor')}><Input id="gestor" value={data.gestor} onChange={(e) => set('gestor', e.target.value)} placeholder="Nome do gestor" className={cn(FIELD, 'min-h-[var(--button-height-lg)]')} /></Field>
          </div>
        </div>
      </SectionBlock>

      <SectionBlock meta={SECTIONS[1]} status={fieldsStatus(data, SECTIONS[1].fields)}>
        <div className="space-y-5">
          <Field id="desafio" label="Sobre o desafio" required hint="O cenário em que a vaga nasce — o time/projeto e o momento." invalid={inv('desafio')}>
            <Textarea id="desafio" value={data.desafio} onChange={(e) => set('desafio', e.target.value)} placeholder="Ex: Estamos expandindo o time de engenharia do TIS Talent AI Platform para sustentar o crescimento da plataforma." style={{ lineHeight: 1.65 }} className={cn('min-h-24 resize-y', FIELD)} />
          </Field>
          <Field id="objetivo" label="Objetivo da vaga" required hint="O que essa contratação precisa alcançar." invalid={inv('objetivo')}>
            <Textarea id="objetivo" value={data.objetivo} onChange={(e) => set('objetivo', e.target.value)} placeholder="Ex: Ampliar a capacidade de entrega de soluções backend de alta performance, garantindo escalabilidade e qualidade nas integrações da plataforma." style={{ lineHeight: 1.65 }} className={cn('min-h-24 resize-y', FIELD)} />
          </Field>
        </div>
      </SectionBlock>

      <SectionBlock meta={SECTIONS[2]} status={fieldsStatus(data, SECTIONS[2].fields)}>
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="local" label="Local de trabalho" required hint="Cidade/UF base (mesmo em remoto/híbrido)." invalid={inv('local')}><Input id="local" value={data.local} onChange={(e) => set('local', e.target.value)} placeholder="Cidade — UF" className={cn(FIELD, 'min-h-[var(--button-height-lg)]')} /></Field>
            <Field id="horario" label="Horário" required invalid={inv('horario')}><FormSelect id="horario" value={data.horario} onChange={(v) => set('horario', v)} options={HORARIOS} placeholder="Selecione um horário" /></Field>
            <Field id="carga" label="Carga semanal" required invalid={inv('carga')}><FormSelect id="carga" value={data.carga} onChange={(v) => set('carga', v)} options={CARGAS} placeholder="Selecione uma carga semanal" /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="motivo" label="Motivo de abertura" required invalid={inv('motivo')}><FormSelect id="motivo" value={data.motivo} onChange={(v) => set('motivo', v)} options={MOTIVOS} placeholder="Selecione o motivo" /></Field>
            <Field id="quantidade" label="Quantidade de vagas" required invalid={inv('quantidade')}><SearchSelect id="quantidade" value={String(data.quantidade)} onChange={(v) => set('quantidade', Number(v))} options={QUANTIDADES} placeholder="Selecione a quantidade" searchPlaceholder="Buscar número…" /></Field>
          </div>
        </div>
      </SectionBlock>

      <SectionBlock meta={SECTIONS[3]} status={fieldsStatus(data, SECTIONS[3].fields)}>
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="budget" label="Budget" required hint="Faixa salarial prevista." invalid={inv('budget')}><Input id="budget" value={data.budget} onChange={(e) => set('budget', e.target.value)} placeholder="R$ 8.000 — 10.000" className={cn(FIELD, 'min-h-[var(--button-height-lg)]')} /></Field>
            <Field id="modalidade" label="Modalidade contratual" required invalid={inv('modalidade')}><FormSelect id="modalidade" value={data.modalidade} onChange={(v) => set('modalidade', v)} options={MODALIDADES} placeholder="Selecione a modalidade" /></Field>
          </div>
          <Field id="beneficios" label="Benefícios" required invalid={inv('beneficios')}><Chips value={data.beneficios} onChange={(v) => set('beneficios', v)} pool={BENEFICIOS_POOL} addLabel="benefício" searchPlaceholder="Buscar benefício…" emptyHint="Nenhum benefício adicionado." /></Field>
        </div>
      </SectionBlock>

      <SectionBlock meta={SECTIONS[4]} status={fieldsStatus(data, SECTIONS[4].fields)}>
        <Field id="processo" label="Etapas do processo" required hint="Selecione as etapas e ordene a sequência com as setas." invalid={inv('processoSeletivo')}>
          <Chips ordered value={data.processoSeletivo} onChange={(v) => set('processoSeletivo', v)} pool={PROCESSO_POOL} addLabel="etapa" searchPlaceholder="Buscar etapa…" emptyHint="Nenhuma etapa adicionada." />
        </Field>
      </SectionBlock>
    </div>
  )
}
