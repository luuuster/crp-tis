import { useEffect, useId, useRef, useState } from 'react'
import { Check, FileText, Pencil } from 'lucide-react'

import { cn } from '@/lib/utils'
import { focusRing } from '@/lib/focus'
import { FIELD, CARD } from '@/lib/surfaces'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { Briefing, Perfil, GeneratedDesc } from '@/lib/vaga'

// Bloco de PROSA editável inline: mostra o texto + "editar"; ao clicar, vira textarea com Salvar/Cancelar.
// Usado nos 3 blocos narrativos da descrição (resumo, desafio, objetivo). O botão fica SEMPRE visível
// (toque + teclado), só ganha ênfase no hover/foco. Esc cancela; Ctrl/Cmd+Enter salva.
function EditableProse({ value, onSave, label, placeholder, textClassName }: {
  value: string; onSave: (v: string) => void; label: string; placeholder?: string; textClassName?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLTextAreaElement>(null)
  // Foca o textarea ao entrar em edição. O rascunho é (re)inicializado no clique de "editar" — não por
  // efeito — então um "Melhorar com IA" externo não dispara render em cascata e a edição parte do texto atual.
  useEffect(() => { if (editing) ref.current?.focus() }, [editing])
  const startEdit = () => { setDraft(value); setEditing(true) }
  const save = () => { onSave(draft.trim()); setEditing(false) }
  const cancel = () => setEditing(false)

  if (editing) {
    return (
      <div className="space-y-2">
        <Textarea
          ref={ref} value={draft} onChange={(e) => setDraft(e.target.value)} aria-label={`Editar ${label}`}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { e.preventDefault(); cancel() }
            else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); save() }
          }}
          style={{ lineHeight: 1.65 }} className={cn('min-h-24 resize-y', FIELD)}
        />
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={save}><Check className="size-3.5" aria-hidden /> Salvar</Button>
          <Button size="sm" variant="ghost" onClick={cancel}>Cancelar</Button>
        </div>
      </div>
    )
  }
  return (
    <div className="group/edit space-y-1">
      <p className={cn(textClassName, !value.trim() && 'text-muted-foreground/60 italic')}>{value.trim() ? value : (placeholder || 'Sem conteúdo.')}</p>
      <button
        type="button" onClick={startEdit} aria-label={`Editar ${label}`}
        className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 ty-caption font-medium text-muted-foreground transition-colors hover:text-primary-text', focusRing)}
      >
        <Pencil className="size-3" aria-hidden /> editar
      </button>
    </div>
  )
}

// Documento da vaga — layout do preview (cabeçalho + blocos narrativos + seções com bullets + benefícios
// em chips). Inclui "Operação & condições" e "Processo seletivo" p/ cobrir TODO o briefing/perfil. Quando
// recebe os handlers onEdit*, os 3 blocos narrativos (resumo, desafio, objetivo) viram editáveis inline.
export function JobDocArticle({ desc, data, perfil, resumo, onEditResumo, onEditDesafio, onEditObjetivo }: {
  desc: GeneratedDesc; data: Briefing; perfil: Perfil; resumo?: string
  onEditResumo?: (v: string) => void; onEditDesafio?: (v: string) => void; onEditObjetivo?: (v: string) => void
}) {
  const titleId = useId()
  const benefId = useId()
  const resumoText = resumo ?? desc.resumo
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
        {onEditResumo
          ? <EditableProse value={resumoText} onSave={onEditResumo} label="resumo" placeholder="Escreva um resumo da vaga." textClassName="ty-body text-muted-foreground" />
          : <p className="ty-body text-muted-foreground">{resumoText}</p>}
      </header>
      {(onEditDesafio || onEditObjetivo || data.desafio?.trim() || data.objetivo?.trim()) && (
        <section className="space-y-5">
          {(onEditDesafio || data.desafio?.trim()) && (
            <div className="space-y-2">
              <h3 className="ty-label text-foreground" style={{ fontWeight: 'var(--font-weight-semibold)' }}>Sobre o desafio</h3>
              {onEditDesafio
                ? <EditableProse value={data.desafio || ''} onSave={onEditDesafio} label="Sobre o desafio" placeholder="Descreva o contexto do desafio." textClassName="ty-body-sm leading-relaxed text-muted-foreground" />
                : <p className="ty-body-sm leading-relaxed text-muted-foreground">{data.desafio?.trim()}</p>}
            </div>
          )}
          {(onEditObjetivo || data.objetivo?.trim()) && (
            <div className="space-y-2">
              <h3 className="ty-label text-foreground" style={{ fontWeight: 'var(--font-weight-semibold)' }}>Objetivo</h3>
              {onEditObjetivo
                ? <EditableProse value={data.objetivo || ''} onSave={onEditObjetivo} label="Objetivo" placeholder="Descreva o objetivo da contratação." textClassName="ty-body-sm leading-relaxed text-muted-foreground" />
                : <p className="ty-body-sm leading-relaxed text-muted-foreground">{data.objetivo?.trim()}</p>}
            </div>
          )}
        </section>
      )}
      <DocSection title="Responsabilidades" items={desc.responsabilidades} />
      <DocSection title="Requisitos" items={desc.requisitos} />
      <DocSection title="Operação & condições" items={operacao} />
      {data.processoSeletivo.length > 0 && <DocSection title="Processo seletivo" items={data.processoSeletivo} />}
      {/* Benefícios — chips, último bloco; fio sutil separa do resto. */}
      <section aria-labelledby={benefId} className="space-y-3 border-t border-border/50 pt-6">
        {/* ty-label é unlayered (peso 500) e anula font-semibold → forço o 600 pelo token (inline vence). */}
        <h3 id={benefId} className="flex items-baseline gap-2 ty-label text-foreground" style={{ fontWeight: 'var(--font-weight-semibold)' }}>Benefícios<span className="ty-caption tabular-nums text-muted-foreground">{desc.beneficios.length}</span></h3>
        <ul className="flex flex-wrap gap-2">
          {desc.beneficios.map((b) => <li key={b} className="rounded-full bg-muted px-3 py-1 ty-body-sm text-foreground">{b}</li>)}
        </ul>
      </section>
    </article>
  )
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
