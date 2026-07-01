/**
 * User Flow COMPLETO da plataforma TalentAI (porta 5174, rota /userflow). Diferente da Arquitetura de
 * Informação (que mostra como o conteúdo é organizado — o site map), o user flow mostra o CAMINHO de ponta a
 * ponta, com pontos de decisão (losangos), bifurcações que reconvergem (fork) e estados finais.
 *
 * Cobre as 3 fases: criação/publicação (recrutador), acesso/candidatura (candidato) e o funil de 5 etapas
 * (IA → RH → Teste → Gestor → Proposta), com reprovação possível em cada porta. 100% token-driven,
 * multi-marca, claro/escuro e WCAG 2.2 AA (passos em ordem real; losangos/setas decorativos com aria-hidden;
 * cor sempre acompanhada de rótulo).
 */
import { Fragment, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight, BadgeCheck, Bot, Brain, CalendarCheck, CalendarClock, CheckCircle2, ChevronDown, ClipboardList, Clock,
  FilePlus2, FileSignature, FileText, FlaskConical, Handshake, HelpCircle, Inbox, KeyRound, LayoutGrid, Link2, LogIn,
  Mail, MailCheck, Megaphone, MessagesSquare, RefreshCw, RotateCcw, Send, Share2, Sparkles, Trophy, UserCheck,
  UserPlus, Users, X,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { toneBadge, type Tone } from '@/lib/surfaces'
import { DocShell } from '@/components/DocShell'
import { Badge } from '@/components/ui/badge'

type Ator = 'rec' | 'cand' | 'pub'
const ATOR_TOM: Record<Ator, Tone> = { rec: 'primary', cand: 'secondary', pub: 'warning' }

type Opcao = { branch: string; label: string; icon: LucideIcon; ator: Ator }
type FlowNode =
  | { kind: 'phase'; label: string }
  | { kind: 'nota'; label: string; icon: LucideIcon }
  | { kind: 'start'; label: string; icon: LucideIcon }
  | { kind: 'process'; label: string; icon: LucideIcon; ator: Ator }
  | { kind: 'decision'; label: string; icon: LucideIcon; nao: string; naoTom?: Tone; naoIcon?: LucideIcon }
  | { kind: 'fork'; label: string; icon: LucideIcon; opcoes: Opcao[] }
  | { kind: 'success'; label: string; icon: LucideIcon }

const FLOW: FlowNode[] = [
  { kind: 'phase', label: 'Fase 1 · Criação e publicação (recrutador)' },
  { kind: 'nota', label: 'Charlie (copiloto IA) participa de TODOS os passos da criação — sugere e preenche em cada etapa.', icon: Sparkles },
  { kind: 'start', label: 'Recrutador faz login', icon: LogIn },
  { kind: 'process', label: 'Cria a vaga — resumo', icon: FilePlus2, ator: 'rec' },
  { kind: 'process', label: 'Define o perfil da vaga', icon: ClipboardList, ator: 'rec' },
  { kind: 'process', label: 'Revisa — Charlie melhora a postagem ou muda o tom (Equilibrado · Descontraído · Formal)', icon: FileText, ator: 'rec' },
  { kind: 'decision', label: 'Publicar agora?', icon: Megaphone, nao: 'Salvo como rascunho — completa e publica depois', naoTom: 'warning', naoIcon: FileText },
  { kind: 'process', label: 'Vaga publicada · ativa (com prazo) no LinkedIn e em sites', icon: Share2, ator: 'pub' },

  { kind: 'phase', label: 'Fase 2 · Acesso e candidatura (candidato)' },
  { kind: 'process', label: 'Candidato abre a vaga (link público ou pelo mural)', icon: Link2, ator: 'cand' },
  {
    kind: 'fork', label: 'Já tem conta?', icon: HelpCircle, opcoes: [
      { branch: 'Não', label: 'Formulário público (cria conta)', icon: Send, ator: 'cand' },
      { branch: 'Sim', label: 'Confirma no modal (logado)', icon: BadgeCheck, ator: 'cand' },
    ],
  },
  { kind: 'process', label: 'Inscrição enviada', icon: Inbox, ator: 'cand' },
  { kind: 'process', label: 'Responde o questionário (2ª etapa)', icon: Brain, ator: 'cand' },

  { kind: 'phase', label: 'Fase 3 · Triagem e seleção (funil de 5 etapas)' },
  { kind: 'decision', label: 'Currículo aprovado pela IA?', icon: Bot, nao: 'Reprovado na análise de currículo' },
  { kind: 'process', label: 'Candidato agenda a entrevista (escolhe dias e horários)', icon: CalendarClock, ator: 'cand' },
  { kind: 'process', label: 'Entrevista marcada', icon: CalendarCheck, ator: 'rec' },
  { kind: 'decision', label: 'Entrevistadores podem comparecer?', icon: Users, nao: 'Imprevisto interno (recrutador/entrevistador não pode) → RH reagenda nos mesmos horários · avisa por e-mail + WhatsApp', naoTom: 'warning', naoIcon: RefreshCw },
  { kind: 'process', label: 'Entrevista com o RH', icon: MessagesSquare, ator: 'rec' },
  { kind: 'decision', label: 'RH aprova?', icon: UserCheck, nao: 'Reprovado no RH' },
  { kind: 'process', label: 'Teste técnico / case', icon: FlaskConical, ator: 'rec' },
  { kind: 'decision', label: 'Passa no teste?', icon: FlaskConical, nao: 'Reprovado no teste' },
  { kind: 'process', label: 'Entrevista com o gestor', icon: Users, ator: 'rec' },
  { kind: 'decision', label: 'Gestor aprova?', icon: Users, nao: 'Reprovado pelo gestor' },
  { kind: 'process', label: 'Proposta enviada', icon: FileSignature, ator: 'rec' },
  { kind: 'decision', label: 'Candidato aceita?', icon: Handshake, nao: 'Proposta recusada' },

  { kind: 'phase', label: 'Resultado' },
  { kind: 'nota', label: 'Em qualquer desfecho (aprovado ou não), o candidato vê o feedback do processo em "Minhas candidaturas → Finalizadas".', icon: MessagesSquare },
  { kind: 'success', label: 'Contratado 🎉', icon: Trophy },
]

// Caixa de passo (início/processo/sucesso). Oval nas pontas, retângulo no meio. `compact` p/ as raias
// (passos menores, cabem mais por linha).
function NodeBox({ icon: Icon, label, tom, oval = false, compact = false, className }: { icon: LucideIcon; label: string; tom: Tone; oval?: boolean; compact?: boolean; className?: string }) {
  return (
    <div className={cn('flex shrink-0 items-center shadow-sm ring-1 ring-surface-ring', oval ? 'rounded-full' : 'rounded-xl', compact ? 'gap-2 px-3 py-2' : 'gap-2.5 px-4 py-3', toneBadge[tom], className)}>
      <Icon className={cn('shrink-0', compact ? 'size-4' : 'size-4.5')} aria-hidden />
      <span className={cn('font-medium text-foreground', compact ? 'ty-caption' : 'ty-body-sm')}>{label}</span>
    </div>
  )
}

// Acento de cor da raia (sempre acompanhado do rótulo da condição — cor nunca é o único sinal).
const BAR: Record<Tone, string> = {
  primary: 'bg-primary', secondary: 'bg-secondary', success: 'bg-success', warning: 'bg-warning', destructive: 'bg-destructive',
}

// "Raia" (swimlane): condição à esquerda + trilha de passos à direita que NÃO quebra no meio da seta —
// rola na horizontal quando fica larga (igual à árvore da IA). Acento colorido por tom à esquerda.
function Raia({ cond, tom, children }: { cond: string; tom: Tone; children: ReactNode }) {
  return (
    <div className="flex items-stretch overflow-hidden rounded-xl bg-card/40 ring-1 ring-surface-ring">
      <span aria-hidden className={cn('w-1 shrink-0', BAR[tom])} />
      <div className="flex w-40 shrink-0 items-center px-3.5 py-3">
        <span className="ty-caption font-semibold text-muted-foreground">{cond}</span>
      </div>
      <span aria-hidden className="w-px shrink-0 bg-border/60" />
      <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-x-auto px-4 py-3">
        {children}
      </div>
    </div>
  )
}

// Losango de decisão (forma de fluxograma).
function Losango({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="relative grid size-44 shrink-0 place-items-center">
      <div aria-hidden className="absolute inset-5 rotate-45 rounded-2xl bg-warning/10 shadow-sm ring-1 ring-warning/35" />
      <div className="relative z-10 flex flex-col items-center gap-1 px-6 text-center">
        <Icon className="size-5 text-warning-text" aria-hidden />
        <span className="ty-body-sm font-semibold text-foreground">{label}</span>
      </div>
    </div>
  )
}

// Decisão: losango + ramo "Não" → desvio (reprovação por padrão; rascunho usa tom neutro). À direita no
// desktop, empilhado no mobile.
function Decisao({ node }: { node: Extract<FlowNode, { kind: 'decision' }> }) {
  const NaoIcon = node.naoIcon ?? X
  return (
    <div className="relative mb-4 flex w-full flex-col items-center">
      <Losango icon={node.icon} label={node.label} />
      <div className="mt-3 flex items-center gap-4 md:absolute md:top-[88px] md:left-[calc(50%+120px)] md:mt-0 md:-translate-y-1/2">
        <Badge variant="ghost" className="bg-destructive/15 px-2.5 py-0.5 font-bold text-destructive-text">Não</Badge>
        <span aria-hidden className="hidden h-px w-16 bg-muted-foreground/40 md:block" />
        <NodeBox icon={NaoIcon} label={node.nao} tom={node.naoTom ?? 'destructive'} oval={node.nao.length < 24} className="max-w-[15rem]" />
      </div>
    </div>
  )
}

// Seta horizontal rotulada — usada no mini state-diagram do ciclo de vida.
function Seta({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center" aria-hidden>
      {label && <span className="ty-caption text-muted-foreground">{label}</span>}
      <ArrowRight className="size-5 text-muted-foreground" />
    </div>
  )
}

// Fluxo de acesso do candidato à plataforma (cadastro, login e 1º acesso com troca de senha).
function AcessoCandidato() {
  return (
    <section aria-labelledby="acesso-cand" className="mt-12">
      <h2 id="acesso-cand" className="ty-h4 text-foreground">Acesso do candidato</h2>
      <p className="mt-1 ty-body-sm text-muted-foreground">Como o candidato entra na plataforma — cadastro, login, 1º acesso e recuperação de senha.</p>

      {/* Entrada */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <NodeBox icon={UserPlus} label="/cadastro" tom="secondary" compact />
        <Seta label="cria conta" />
        <NodeBox icon={LogIn} label="/acesso · login" tom="secondary" compact />
      </div>

      {/* Desfechos a partir do login — uma raia por condição */}
      <p className="mt-6 mb-2.5 ty-label-sm uppercase tracking-wide text-muted-foreground">A partir de /acesso · login</p>
      <div className="space-y-2.5">
        <Raia cond="conta cadastrada" tom="success">
          <NodeBox icon={LayoutGrid} label="/painel" tom="success" compact />
        </Raia>
        <Raia cond="senha provisória · 1º acesso" tom="warning">
          <NodeBox icon={KeyRound} label="Trocar a senha" tom="warning" compact />
          <Seta />
          <NodeBox icon={LayoutGrid} label="/painel" tom="success" compact />
        </Raia>
        {/* Esqueci a senha — sub-fluxo com rotas próprias (deep-link + link do e-mail) */}
        <Raia cond="esqueceu a senha" tom="secondary">
          <NodeBox icon={Mail} label="/acesso/recuperar" tom="secondary" compact />
          <Seta label="envia link" />
          <NodeBox icon={MailCheck} label="/acesso/recuperar/enviado" tom="secondary" compact />
          <Seta label="abre o link" />
          <NodeBox icon={KeyRound} label="/redefinir_senha" tom="warning" compact />
          <Seta />
          <NodeBox icon={CheckCircle2} label="/redefinir_senha/sucesso" tom="success" compact />
          <Seta />
          <NodeBox icon={LayoutGrid} label="/painel" tom="success" compact />
        </Raia>
        <Raia cond="senha incorreta" tom="destructive">
          <NodeBox icon={X} label="Erro — tenta de novo" tom="destructive" compact />
        </Raia>
      </div>
    </section>
  )
}

// Estados da vaga no sistema (rascunho → ativa → expirada/fechada) + loop de editar/republicar.
function CicloVida() {
  return (
    <section aria-labelledby="ciclo-vaga" className="mt-12">
      <h2 id="ciclo-vaga" className="ty-h4 text-foreground">Ciclo de vida da vaga</h2>
      <p className="mt-1 ty-body-sm text-muted-foreground">Estados da vaga no sistema (estado de origem → transições), do rascunho ao encerramento.</p>
      <div className="mt-5 space-y-2.5">
        <Raia cond="Rascunho" tom="warning">
          <Seta label="publicar" />
          <NodeBox icon={Megaphone} label="Ativa · prazo definido" tom="success" compact />
        </Raia>
        {/* Ativa tem duas saídas: o prazo expira (automático) ou o recrutador fecha (manual) */}
        <Raia cond="Ativa" tom="success">
          <Seta label="prazo expira" />
          <NodeBox icon={Clock} label="Expirada" tom="warning" compact />
          <span aria-hidden className="mx-1 h-8 w-px shrink-0 bg-border/60" />
          <Seta label="fechar manualmente" />
          <NodeBox icon={X} label="Fechada" tom="destructive" compact />
        </Raia>
        {/* Loop: editar e republicar volta ao estado Ativa com um novo prazo */}
        <Raia cond="Expirada ou Fechada" tom="secondary">
          <Seta label="editar e republicar" />
          <NodeBox icon={RotateCcw} label="volta a Ativa · novo prazo" tom="success" compact />
        </Raia>
      </div>
    </section>
  )
}

// Bifurcação que RECONVERGE: losango → dois caminhos lado a lado → barramento de merge → segue.
function Fork({ node }: { node: Extract<FlowNode, { kind: 'fork' }> }) {
  return (
    <div className="flex flex-col items-center">
      <Losango icon={node.icon} label={node.label} />
      <span aria-hidden className="h-6 w-px bg-muted-foreground/40" />
      <ul className="flex items-stretch">
        {node.opcoes.map((o, i) => {
          const first = i === 0
          const last = i === node.opcoes.length - 1
          return (
            <li key={o.label} className="relative flex flex-col items-center px-5 pt-6 pb-6">
              {/* barramento de split (topo) */}
              {!first && <span aria-hidden className="absolute top-0 left-0 h-px w-1/2 bg-muted-foreground/40" />}
              {!last && <span aria-hidden className="absolute top-0 right-0 h-px w-1/2 bg-muted-foreground/40" />}
              <span aria-hidden className="absolute top-0 left-1/2 h-6 w-px -translate-x-1/2 bg-muted-foreground/40" />
              <span className="mb-1 ty-caption font-semibold text-muted-foreground">{o.branch}</span>
              <NodeBox icon={o.icon} label={o.label} tom={ATOR_TOM[o.ator]} className="h-full max-w-[12rem]" />
              {/* barramento de merge (base) */}
              <span aria-hidden className="absolute bottom-0 left-1/2 h-6 w-px -translate-x-1/2 bg-muted-foreground/40" />
              {!first && <span aria-hidden className="absolute bottom-0 left-0 h-px w-1/2 bg-muted-foreground/40" />}
              {!last && <span aria-hidden className="absolute bottom-0 right-0 h-px w-1/2 bg-muted-foreground/40" />}
            </li>
          )
        })}
      </ul>
      <span aria-hidden className="h-6 w-px bg-muted-foreground/40" />
      <ChevronDown aria-hidden className="-mt-2.5 size-4 text-muted-foreground" />
    </div>
  )
}

// Conector vertical (com rótulo "Sim" quando sai de uma decisão).
function Liga({ sim = false }: { sim?: boolean }) {
  return (
    <div className="flex flex-col items-center" aria-hidden>
      {sim && <span className="mb-3 rounded bg-success/15 px-2.5 py-0.5 ty-caption font-bold text-success-text">Sim</span>}
      <span className="h-10 w-px bg-muted-foreground/40" />
      <ChevronDown className="-mt-2.5 size-4 text-muted-foreground" />
    </div>
  )
}

function PhaseBand({ label }: { label: string }) {
  return (
    <div className="my-7 flex w-full max-w-md items-center gap-3">
      <span aria-hidden className="h-px flex-1 bg-muted-foreground/40" />
      <span className="ty-label-sm uppercase tracking-wide text-muted-foreground">{label}</span>
      <span aria-hidden className="h-px flex-1 bg-muted-foreground/40" />
    </div>
  )
}

function NodeView({ node }: { node: FlowNode }) {
  switch (node.kind) {
    case 'phase': return <PhaseBand label={node.label} />
    case 'nota': return (
      <div className="flex flex-col items-center">
        <div className="flex max-w-md items-start gap-2.5 rounded-xl bg-secondary/10 px-4 py-3 ring-1 ring-surface-ring">
          <node.icon className="mt-0.5 size-4 shrink-0 text-secondary-text" aria-hidden />
          <span className="ty-body-sm text-foreground">{node.label}</span>
        </div>
        {/* conector tracejado: o Charlie é ambiente (acompanha a fase), por isso a linha é pontilhada */}
        <span aria-hidden className="mt-3 h-6 border-l-2 border-dashed border-secondary/60" />
      </div>
    )
    case 'decision': return <Decisao node={node} />
    case 'fork': return <Fork node={node} />
    case 'start': return <NodeBox icon={node.icon} label={node.label} tom="primary" oval />
    case 'success': return <NodeBox icon={node.icon} label={node.label} tom="success" oval className="ring-success/40" />
    case 'process': return <NodeBox icon={node.icon} label={node.label} tom={ATOR_TOM[node.ator]} />
  }
}

const LEGENDA: { tom: Tone; label: string }[] = [
  { tom: 'primary', label: 'Recrutador / IA' },
  { tom: 'secondary', label: 'Candidato' },
  { tom: 'warning', label: 'Publicação / decisão' },
  { tom: 'destructive', label: 'Reprovado (fim)' },
  { tom: 'success', label: 'Contratado (fim)' },
]

export function UserFlow() {
  return (
    <DocShell active="flow">
      {/* Hero */}
      <div className="max-w-2xl">
        <Badge variant="secondary" className="font-medium">User Flow</Badge>
        <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Da vaga à contratação — fluxo completo</h1>
        <p className="mt-2 ty-body text-muted-foreground">
          O <strong className="font-semibold text-foreground">caminho de ponta a ponta</strong>, com os dois modos de candidatura
          (público × logado) e o <strong className="font-semibold text-foreground">funil de 5 etapas</strong> — cada porta pode reprovar. É o
          complemento da <em>Arquitetura de Informação</em> (que mostra como o conteúdo se organiza).
        </p>
      </div>

      {/* Fluxo (spine vertical com fases, fork e decisões) */}
      <section aria-label="Fluxo completo da criação da vaga à contratação" className="mt-8 flex flex-col items-center">
        {FLOW.map((n, i) => {
          const prev = FLOW[i - 1]
          const liga = n.kind !== 'phase' && n.kind !== 'nota' && !!prev && prev.kind !== 'phase' && prev.kind !== 'nota' && prev.kind !== 'fork'
          return (
            <Fragment key={i}>
              {liga && <Liga sim={prev.kind === 'decision'} />}
              <NodeView node={n} />
            </Fragment>
          )
        })}
      </section>

      <AcessoCandidato />

      <CicloVida />

      {/* Legenda */}
      <section aria-labelledby="legenda" className="mt-12">
        <h2 id="legenda" className="mb-4 ty-h4 text-foreground">Legenda</h2>
        <ul className="flex flex-wrap gap-x-6 gap-y-2.5">
          {LEGENDA.map((l) => (
            <li key={l.label} className="flex items-center gap-2 ty-body-sm text-muted-foreground">
              <span aria-hidden className={cn('size-3.5 rounded-full', toneBadge[l.tom])} /> {l.label}
            </li>
          ))}
        </ul>
        <p className="mt-5 ty-caption text-muted-foreground">
          Losango = decisão · oval = início/fim · retângulo = passo · bifurcação = caminhos que reconvergem. Mockup sem
          backend · multi-marca (CRP / Trevo) × claro/escuro · WCAG 2.2 AA.
        </p>
      </section>
    </DocShell>
  )
}
