/**
 * Modelo de dados de uma Vaga (briefing + perfil) — FONTE ÚNICA compartilhada entre o Gerador (wizard,
 * edição) e a Lista/Detalhe de vagas (leitura). Inclui o builder da descrição (buildDesc) e um renderer
 * READ-ONLY do documento completo da vaga (VagaDocumento). Não importa do JobGenerator → sem ciclo.
 * 100% token-driven (zero cor à mão).
 */
import { useId } from 'react'
import { FileText } from 'lucide-react'

import { cn } from '@/lib/utils'
import { CARD } from '@/lib/surfaces'

export type Briefing = {
  cargo: string; nivel: string; modelo: string; cliente: string; gestor: string
  desafio: string; objetivo: string
  local: string; horario: string; carga: string; motivo: string; quantidade: number
  prazo: number // dias que a vaga fica aberta para candidaturas (definido pelo RH na criação)
  budget: string; modalidade: string; beneficios: string[]; processoSeletivo: string[]
}
export type Perfil = {
  formacao: string; experiencia: string; exigencias: string[]; stackObrigatoria: string[]
  conhecimentosDesejaveis: string[]; responsabilidades: string; habilidades: string[]; justificativa: string
}
export type Tom = 'Equilibrado' | 'Descontraído' | 'Formal'
export type GeneratedDesc = { titulo: string; resumo: string; responsabilidades: string[]; requisitos: string[]; beneficios: string[] }

// Deriva a descrição estruturada da vaga a partir do briefing + perfil (e do tom do resumo).
export function buildDesc(d: Briefing, p: Perfil, tom: Tom = 'Equilibrado'): GeneratedDesc {
  const resumo = {
    Equilibrado: `Buscamos ${d.cargo} ${d.nivel} para atuar em modelo ${d.modelo}, em ${d.local}, integrando o time do projeto ${d.cliente} e reportando-se a ${d.gestor}.`,
    Descontraído: `Bora construir junto? Procuramos uma pessoa ${d.cargo} ${d.nivel} pra somar com o time do ${d.cliente} em ${d.local}, modelo ${d.modelo}, sem burocracia.`,
    Formal: `A organização seleciona profissional para a posição de ${d.cargo} ${d.nivel}, em regime ${d.modelo}, com base em ${d.local}, vinculado(a) ao projeto ${d.cliente} sob gestão de ${d.gestor}.`,
  }[tom]
  const resp = p.responsabilidades.split(/[.;\n]+/).map((s) => s.trim()).filter(Boolean).map((s) => s.charAt(0).toUpperCase() + s.slice(1))
  return {
    titulo: `${d.cargo} ${d.nivel} · ${d.modelo}`,
    resumo,
    responsabilidades: resp.length ? resp : ['Atuar nas entregas do time conforme o briefing.'],
    requisitos: [
      ...(p.formacao.trim() ? [`Formação: ${p.formacao.trim()}`] : []),
      ...(p.experiencia.trim() ? [`Experiência: ${p.experiencia.trim()}`] : []),
      ...(p.exigencias.length ? [`Exigências: ${p.exigencias.join(' · ')}`] : []),
      ...(p.stackObrigatoria.length ? [`Stack obrigatória: ${p.stackObrigatoria.join(', ')}`] : []),
      ...(p.conhecimentosDesejaveis.length ? [`Desejável: ${p.conhecimentosDesejaveis.join(', ')}`] : []),
      ...(p.habilidades.length ? [`Perfil comportamental: ${p.habilidades.join(', ')}`] : []),
    ],
    beneficios: d.beneficios,
  }
}

function DocSection({ title, items }: { title: string; items: string[] }) {
  const hid = useId()
  return (
    <section aria-labelledby={hid} className="space-y-3">
      {/* ty-label é unlayered (peso 500) e anula font-semibold → forço o 600 pelo token (inline vence). */}
      <h3 id={hid} className="flex items-baseline gap-2 ty-label text-foreground" style={{ fontWeight: 'var(--font-weight-semibold)' }}>
        {title}<span className="ty-caption tabular-nums text-muted-foreground">{items.length}</span>
      </h3>
      <ul className="space-y-2.5">
        {items.map((t, i) => (
          <li key={i} className="flex gap-3 ty-body-sm text-foreground"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden /><span className="leading-relaxed">{t}</span></li>
        ))}
      </ul>
    </section>
  )
}

/**
 * Documento completo da vaga (READ-ONLY) — espelha o JobDocArticle do wizard, sem edição. Mostra TODAS as
 * informações: título, resumo, sobre o desafio, objetivo, responsabilidades, requisitos, operação &
 * condições, processo seletivo e benefícios.
 */
export function VagaDocumento({ data, perfil, tom = 'Equilibrado', beneficioEmoji }: { data: Briefing; perfil: Perfil; tom?: Tom; beneficioEmoji?: (b: string) => string }) {
  const titleId = useId()
  const benefId = useId()
  const desc = buildDesc(data, perfil, tom)
  const operacao = [
    `Modelo & jornada: ${[data.modelo, data.horario, data.carga].filter(Boolean).join(' · ') || '—'}`,
    `Local: ${data.local || '—'}`,
    `Cliente / projeto: ${data.cliente || '—'}`,
    `Reporta a: ${data.gestor || '—'}`,
    `Vagas & modalidade: ${data.quantidade} vaga(s)${data.modalidade ? ` · ${data.modalidade}` : ''}`,
    ...(data.budget ? [`Remuneração: ${data.budget}`] : []),
    ...(data.motivo ? [`Motivo de abertura: ${data.motivo}`] : []),
    ...(perfil.justificativa.trim() ? [`Justificativa da contratação: ${perfil.justificativa.trim()}`] : []),
  ]
  return (
    <article aria-labelledby={titleId} className={cn('space-y-7 p-6 sm:p-8', CARD)}>
      <header className="space-y-2 border-b border-border/50 pb-5">
        <span className="flex items-center gap-1.5 ty-label-sm uppercase text-muted-foreground"><FileText className="size-3.5" aria-hidden /> Descrição da vaga</span>
        <h2 id={titleId} className="ty-h4 text-foreground">{desc.titulo}</h2>
        <p className="ty-body text-muted-foreground">{desc.resumo}</p>
      </header>
      {(data.desafio?.trim() || data.objetivo?.trim()) && (
        <section className="space-y-5">
          {data.desafio?.trim() && (
            <div className="space-y-2">
              <h3 className="ty-label text-foreground" style={{ fontWeight: 'var(--font-weight-semibold)' }}>Sobre o desafio</h3>
              <p className="ty-body-sm leading-relaxed text-muted-foreground">{data.desafio.trim()}</p>
            </div>
          )}
          {data.objetivo?.trim() && (
            <div className="space-y-2">
              <h3 className="ty-label text-foreground" style={{ fontWeight: 'var(--font-weight-semibold)' }}>Objetivo</h3>
              <p className="ty-body-sm leading-relaxed text-muted-foreground">{data.objetivo.trim()}</p>
            </div>
          )}
        </section>
      )}
      <DocSection title="Responsabilidades" items={desc.responsabilidades} />
      <DocSection title="Requisitos" items={desc.requisitos} />
      <DocSection title="Operação & condições" items={operacao} />
      {data.processoSeletivo.length > 0 && <DocSection title="Processo seletivo" items={data.processoSeletivo} />}
      {/* Benefícios, chips, último bloco; fio sutil separa do resto. */}
      <section aria-labelledby={benefId} className="space-y-3 border-t border-border/50 pt-6">
        <h3 id={benefId} className="flex items-baseline gap-2 ty-label text-foreground" style={{ fontWeight: 'var(--font-weight-semibold)' }}>Benefícios<span className="ty-caption tabular-nums text-muted-foreground">{desc.beneficios.length}</span></h3>
        {beneficioEmoji ? (
          // Lista com emoji (1 por benefício) — usada na vaga pública do candidato. O emoji é decorativo.
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {desc.beneficios.map((b) => (
              <li key={b} className="flex items-center gap-2.5 ty-body-sm text-foreground">
                <span aria-hidden className="text-base leading-none">{beneficioEmoji(b)}</span> {b}
              </li>
            ))}
          </ul>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {desc.beneficios.map((b) => <li key={b} className="rounded-full bg-muted px-3 py-1 ty-body-sm text-foreground">{b}</li>)}
          </ul>
        )}
      </section>
    </article>
  )
}
