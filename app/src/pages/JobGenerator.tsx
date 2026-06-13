/**
 * Gerador de Vagas — tela interna (wizard de 4 etapas) com o copiloto "Charlie" num painel à direita.
 * Shell completo e autossuficiente: topbar (breadcrumb + tema/marca + "Falar com Charlie" + conta),
 * sidebar agrupada (Workspace/Pipeline) e rodapé de ações fixo. O briefing é um card único dividido em
 * seções numeradas, cada uma com STATUS REATIVO (Completa / Em revisão / A preencher) calculado dos campos.
 *
 * Abrir o Charlie recolhe o menu da esquerda (mutuamente exclusivos) — só um painel lateral por vez.
 * 100% token-driven (zero cor à mão) e multi-marca: cor, tipografia (.ty-*) e espaçamento vêm do
 * contrato CRP. A "chrome" de marca é SÓLIDA (sem gradiente): o menu, o avatar da conta e o ícone do
 * herói usam bg-primary/text-primary-foreground; a PERSONA do Charlie (CTA, avatares "C", ícones de
 * sugestão) usa bg-secondary/text-secondary-foreground — a 2ª cor da marca (roxo CRP / azul MarcaB).
 * Ambos os pares são AA garantidos pelo check.mjs e auditáveis por pixel. Demo sem backend: Charlie e
 * as ações apenas simulam; algumas sugestões do Charlie preenchem campos de verdade.
 */
import { cloneElement, isValidElement, useEffect, useId, useRef, useState, type ComponentType, type PointerEvent as ReactPointerEvent, type ReactElement, type ReactNode } from 'react'
import { toast } from 'sonner'
import {
  AlertTriangle,
  AlignLeft,
  ArrowRight,
  Bot,
  Briefcase,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ClipboardList,
  Code2,
  DollarSign,
  FileText,
  GripHorizontal,
  HelpCircle,
  LayoutDashboard,
  ListChecks,
  Loader2,
  LogOut,
  Megaphone,
  Menu,
  Mic,
  Moon,
  Palette,
  Paperclip,
  Plus,
  RefreshCw,
  Rocket,
  Save,
  Search,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  Sun,
  Trash2,
  UserRound,
  Wallet,
  Wand2,
  X,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { focusRing, focusRingOnPrimary } from '@/lib/focus'
import { FIELD, FLOAT, CARD, toneBadge } from '@/lib/surfaces'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Dialog as DialogPrimitive } from 'radix-ui'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Logo } from '@/components/auth/Logo'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import logoMark from '@/assets/logo/logo-mark-white.svg'

// `< md`: o menu lateral some e o hambúrguer abre um DRAWER (overlay). `≥ md`: o hambúrguer só
// recolhe/expande a largura do menu fixo. Esse hook diz em qual dos dois mundos estamos.
function useIsMobile(query = '(max-width: 767px)') {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [query])
  return isMobile
}

/* ────────────────────────────── dados estáticos ────────────────────────────── */

const NAV_GROUPS = [
  { label: 'Workspace', items: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'gerador', label: 'Vagas', icon: ClipboardList },
    { key: 'candidatos', label: 'Candidatos', icon: UserRound },
  ] },
  { label: 'Pipeline', items: [
    { key: 'vagas', label: 'Vagas Ativas', icon: Briefcase },
    { key: 'buscar', label: 'Buscar Talentos', icon: Search },
  ] },
] as const

const STEPS = [
  { n: 1, title: 'Briefing da Vaga', eyebrow: 'Briefing', desc: 'Dados institucionais e operacionais' },
  { n: 2, title: 'Perfil e Requisitos', eyebrow: 'Perfil', desc: 'Skills, experiência e formação' },
  { n: 3, title: 'Preview & Gerar com IA', eyebrow: 'Preview', desc: 'Revise e gere a descrição' },
  { n: 4, title: 'Revisar & Publicar', eyebrow: 'Revisão', desc: 'Ajustes finais antes de publicar' },
] as const

const CARGOS = ['Desenvolvedor Backend', 'Desenvolvedor Frontend', 'Desenvolvedor Fullstack', 'Product Manager', 'Designer UX/UI', 'Analista de Dados', 'Engenheiro DevOps', 'Analista de QA']
const NIVEIS = ['Estágio', 'Júnior', 'Pleno', 'Sênior', 'Especialista', 'Liderança']
const MODELOS = ['Presencial', 'Híbrido', 'Remoto']
const CARGAS = ['20 horas', '30 horas', '40 horas', '44 horas']
const HORARIOS = ['08:00 às 17:00', '09:00 às 18:00', '10:00 às 19:00', '12:00 às 21:00', 'Horário flexível', 'Escala 12x36']
const MOTIVOS = ['Aumento do quadro', 'Substituição', 'Novo projeto', 'Backfill', 'Confidencial']
const MODALIDADES = ['CLT', 'PJ', 'Estágio', 'Temporário', 'Cooperado']
const QUANTIDADES = Array.from({ length: 20 }, (_, i) => String(i + 1))
const BENEFICIOS_POOL = ['Vale-refeição', 'Vale-transporte', 'Plano de saúde', 'Plano odontológico', 'Auxílio home-office', 'Day-off aniversário', 'Gympass', 'Bônus anual', 'Stock options', 'Auxílio creche', 'Seguro de vida', 'Horário flexível']
const PROCESSO_POOL = ['Triagem de currículo', 'Entrevista com RH', 'Entrevista comportamental', 'Teste técnico / Case', 'Entrevista técnica', 'Entrevista com gestor', 'Entrevista com liderança', 'Dinâmica de grupo', 'Verificação de referências', 'Proposta']

type Briefing = {
  cargo: string; nivel: string; modelo: string; cliente: string; gestor: string
  local: string; horario: string; carga: string; motivo: string; quantidade: number
  budget: string; modalidade: string; beneficios: string[]; processoSeletivo: string[]
}
type SetBriefing = <K extends keyof Briefing>(k: K, v: Briefing[K]) => void

const BRIEFING_INICIAL: Briefing = {
  cargo: 'Desenvolvedor Backend', nivel: 'Pleno', modelo: 'Híbrido',
  cliente: 'TIS Talent AI Platform', gestor: 'Carlos Mendes',
  local: 'São Paulo — SP', horario: '', carga: '', motivo: 'Aumento do quadro', quantidade: 1,
  budget: '', modalidade: 'CLT', beneficios: ['Vale-refeição', 'Plano de saúde', 'Auxílio home-office', 'Day-off aniversário'],
  processoSeletivo: ['Entrevista comportamental', 'Entrevista técnica', 'Entrevista com RH'],
}

/* seções do briefing: ícone + campos (p/ status reativo conforme o usuário preenche) */
const SECTIONS = [
  { icon: Building2, title: 'Identidade da vaga', desc: 'Como essa posição se posiciona dentro da organização.', fields: ['cargo', 'nivel', 'modelo', 'cliente', 'gestor'] as (keyof Briefing)[] },
  { icon: CalendarClock, title: 'Operação & rotina', desc: 'Onde, quando e em que ritmo essa pessoa vai trabalhar.', fields: ['local', 'horario', 'carga', 'motivo', 'quantidade'] as (keyof Briefing)[] },
  { icon: Wallet, title: 'Investimento', desc: 'A faixa salarial e benefícios que tornam essa vaga competitiva.', fields: ['budget', 'modalidade', 'beneficios'] as (keyof Briefing)[] },
  { icon: ListChecks, title: 'Processo seletivo', desc: 'As etapas da seleção, na ordem — o que quem se candidata vai enfrentar.', fields: ['processoSeletivo'] as (keyof Briefing)[] },
] as const

const isFilledVal = (v: unknown) =>
  Array.isArray(v) ? v.length > 0 : typeof v === 'number' ? v > 0 : typeof v === 'string' ? v.trim().length > 0 : v != null
type Status = 'completa' | 'preenchendo' | 'pendente' | 'opcional'
function fieldsStatus<T extends object>(obj: T, fields: readonly (keyof T)[]): Status {
  const filled = fields.filter((k) => isFilledVal(obj[k])).length
  return filled === fields.length ? 'completa' : filled > 0 ? 'preenchendo' : 'pendente'
}

/* ───────── etapa 2 · Perfil e Requisitos ───────── */
const STACK_POOL = ['Python 3.10+', 'FastAPI', 'Django', 'PostgreSQL', 'MySQL', 'Docker', 'Kubernetes', 'Git', 'APIs RESTful', 'GraphQL', 'Redis', 'Kafka', 'AWS', 'GCP', 'CI/CD', 'TypeScript', 'Node.js', 'Testes automatizados', 'Microsserviços', 'Observabilidade'] as const
const CONHECIMENTOS_POOL = ['Kubernetes', 'Redis', 'Kafka', 'GraphQL', 'Cloud (AWS/Azure/GCP)', 'Observabilidade', 'Terraform', 'gRPC', 'Event Sourcing', 'Data Engineering'] as const
const HABILIDADES_POOL = ['Comunicação clara', 'Trabalho em equipe', 'Pensamento analítico', 'Proatividade', 'Mentoria', 'Autonomia', 'Organização', 'Resolução de problemas', 'Adaptabilidade'] as const
const EXIGENCIAS = ['Ensino superior obrigatório', 'Comprovação de experiência', 'Certificações profissionais'] as const

type Perfil = {
  formacao: string; experiencia: string; exigencias: string[]; stackObrigatoria: string[]
  conhecimentosDesejaveis: string[]; responsabilidades: string; habilidades: string[]; justificativa: string
}
type SetPerfil = <K extends keyof Perfil>(k: K, v: Perfil[K]) => void

const PERFIL_INICIAL: Perfil = {
  formacao: 'Superior completo em Ciência da Computação, Engenharia de Software, Sistemas de Informação ou áreas correlatas.',
  experiencia: 'Mínimo 3 anos em desenvolvimento backend, com experiência comprovada em APIs RESTful, bancos de dados relacionais e ambientes em produção.',
  exigencias: ['Ensino superior obrigatório'],
  stackObrigatoria: ['Python 3.10+', 'FastAPI', 'PostgreSQL', 'Docker', 'Git', 'APIs RESTful', 'Testes automatizados'],
  conhecimentosDesejaveis: ['Kubernetes', 'Redis', 'Kafka', 'GraphQL', 'Cloud (AWS/Azure/GCP)', 'Observabilidade'],
  responsabilidades: 'Desenvolver e manter APIs RESTful de alta performance; projetar soluções técnicas escaláveis; realizar code reviews; mentorar desenvolvedores júnior; garantir qualidade através de testes automatizados.',
  habilidades: ['Comunicação clara', 'Trabalho em equipe', 'Pensamento analítico', 'Proatividade', 'Mentoria'],
  justificativa: 'Expansão da equipe para suportar o crescimento do produto e reduzir o tempo de entrega das squads de backend.',
}

// `optional` = seção que NÃO entra no readiness (Diferenciais) — mostra "Opcional" no StatusPill.
type PerfilSection = { icon: ComponentType<{ className?: string }>; title: string; desc: string; fields: (keyof Perfil)[]; optional?: boolean }
const PERFIL_SECTIONS: PerfilSection[] = [
  { icon: Code2, title: 'Requisitos técnicos', desc: 'O que essa pessoa precisa dominar logo de cara.', fields: ['formacao', 'experiencia', 'stackObrigatoria'] },
  { icon: Star, title: 'Diferenciais', desc: 'Conhecimentos que pesam positivamente, mas não são bloqueantes.', fields: ['conhecimentosDesejaveis'], optional: true },
  { icon: AlignLeft, title: 'Responsabilidades & perfil', desc: 'O dia a dia da posição e o tipo de pessoa que você procura.', fields: ['responsabilidades', 'justificativa'] },
]

/* ───────── etapa 3 · descrição gerada por IA ───────── */
type Tom = 'Equilibrado' | 'Descontraído' | 'Formal'
const TONS: Tom[] = ['Equilibrado', 'Descontraído', 'Formal']
type GeneratedDesc = { titulo: string; resumo: string; responsabilidades: string[]; requisitos: string[]; beneficios: string[] }

function buildDesc(d: Briefing, p: Perfil, tom: Tom): GeneratedDesc {
  const resumo = {
    Equilibrado: `Buscamos ${d.cargo} ${d.nivel} para atuar em modelo ${d.modelo}, em ${d.local}, integrando o time do projeto ${d.cliente} e reportando-se a ${d.gestor}.`,
    Descontraído: `Bora construir junto? Procuramos uma pessoa ${d.cargo} ${d.nivel} pra somar com o time do ${d.cliente} em ${d.local} — modelo ${d.modelo}, sem burocracia.`,
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

/* ───────── etapa 4 · publicação ───────── */
type Publish = { canais: string[]; visibilidade: string; prazo: string }
type SetPublish = <K extends keyof Publish>(k: K, v: Publish[K]) => void
const CANAIS = ['Página de carreiras TIS', 'LinkedIn', 'Banco de talentos interno', 'Indicação de colaboradores'] as const
const VISIBILIDADES = ['Pública', 'Interna', 'Confidencial']
const PRAZOS = ['15 dias', '30 dias', '60 dias', '90 dias', 'Sem prazo']
const PUBLISH_INICIAL: Publish = { canais: ['Página de carreiras TIS', 'LinkedIn'], visibilidade: 'Pública', prazo: '30 dias' }

// Tudo obrigatório: o readiness checa TODOS os campos de cada seção.
const requiredBriefingOk = (d: Briefing) => SECTIONS.flatMap((s) => s.fields).every((k) => isFilledVal(d[k]))
const requiredPerfilOk = (p: Perfil) => PERFIL_SECTIONS.filter((s) => !s.optional).flatMap((s) => s.fields).every((k) => isFilledVal(p[k]))

// Campos obrigatórios → rótulo legível (lista "Faltando completar" da Visão da vaga no passo 3).
const REQ_LABELS: Partial<Record<keyof Briefing | keyof Perfil, string>> = {
  cargo: 'Cargo', nivel: 'Nível', modelo: 'Modelo de atuação', cliente: 'Cliente/Projeto', gestor: 'Gestor imediato',
  local: 'Local de trabalho', horario: 'Horário', carga: 'Carga horária', motivo: 'Motivo de abertura', quantidade: 'Quantidade de vagas',
  budget: 'Budget', modalidade: 'Modalidade', beneficios: 'Benefícios', processoSeletivo: 'Processo seletivo',
  formacao: 'Formação', experiencia: 'Experiência obrigatória', stackObrigatoria: 'Stack técnica obrigatória', responsabilidades: 'Responsabilidades', justificativa: 'Justificativa da contratação',
}
type MissingField = { scope: 'Briefing' | 'Perfil'; label: string; hint: string }
function missingRequired(d: Briefing, p: Perfil) {
  const briefFields = SECTIONS.flatMap((s) => s.fields)
  const perfFields = PERFIL_SECTIONS.filter((s) => !s.optional).flatMap((s) => s.fields)
  const hint = (label: string, k: string) => (k === 'quantidade' ? 'Deve ser maior que zero.' : `Informe ${label.toLowerCase()}.`)
  const mk = (scope: 'Briefing' | 'Perfil') => (k: keyof Briefing | keyof Perfil): MissingField => {
    const label = REQ_LABELS[k] || String(k)
    return { scope, label, hint: hint(label, String(k)) }
  }
  return {
    brief: briefFields.filter((k) => !isFilledVal(d[k])).map(mk('Briefing')),
    perf: perfFields.filter((k) => !isFilledVal(p[k])).map(mk('Perfil')),
    briefTotal: briefFields.length, perfTotal: perfFields.length,
  }
}

/* ────────────────────────────── Charlie: sugestões por etapa ────────────────────────────── */

type SugCtx = { data: Briefing; set: SetBriefing; perfil: Perfil; setPerfil: SetPerfil; gerar: () => void }
type Suggestion = { icon: ComponentType<{ className?: string }>; label: string; run: (c: SugCtx) => string }

function suggestionsFor(step: number): Suggestion[] {
  switch (step) {
    case 1:
      return [
        { icon: DollarSign, label: 'Sugerir faixa salarial', run: ({ data, set }) => {
          const faixas: Record<string, string> = { 'Estágio': 'R$ 1.800 – R$ 2.500', 'Júnior': 'R$ 4.000 – R$ 6.500', 'Pleno': 'R$ 9.000 – R$ 13.000', 'Sênior': 'R$ 14.000 – R$ 19.000', 'Especialista': 'R$ 16.000 – R$ 22.000', 'Liderança': 'R$ 20.000 – R$ 28.000' }
          const faixa = faixas[data.nivel] ?? 'R$ 9.000 – R$ 13.000'
          set('budget', faixa)
          return `Para ${data.cargo} ${data.nivel} em ${data.local} (${data.modelo}), o mercado fica em torno de ${faixa}. Já preenchi o Budget — ajuste à vontade.`
        } },
        { icon: Wallet, label: 'Recomendar benefícios', run: ({ data, set }) => {
          const sugeridos = ['Plano de saúde', 'Vale-refeição', 'Auxílio home-office', 'Gympass', 'Bônus anual']
          const novos = sugeridos.filter((b) => !data.beneficios.includes(b))
          if (novos.length) set('beneficios', [...data.beneficios, ...novos])
          return novos.length
            ? `Adicionei benefícios que deixam a vaga mais competitiva: ${novos.join(', ')}. Remova o que não fizer sentido.`
            : 'Seu pacote de benefícios já está bem competitivo para essa vaga. 👍'
        } },
        { icon: ClipboardList, label: 'Revisar o briefing', run: ({ data }) => {
          const faltando = SECTIONS.flatMap((s) => s.fields).filter((k) => !isFilledVal(data[k])).length
          return faltando === 0
            ? `Briefing completo: ${data.cargo} ${data.nivel} · ${data.modelo} · ${data.local} · ${data.modalidade}. Pode avançar para o Perfil. 👍`
            : `Briefing quase pronto — ${faltando} campo(s) ainda em branco${data.budget ? '' : ', incluindo o Budget'}. Quer que eu sugira a faixa salarial?`
        } },
      ]
    case 2:
      return [
        { icon: Code2, label: 'Sugerir stack técnica', run: ({ data, perfil, setPerfil }) => {
          const novas = ['Python 3.10+', 'FastAPI', 'PostgreSQL', 'Docker', 'Testes automatizados'].filter((s) => !perfil.stackObrigatoria.includes(s))
          if (novas.length) setPerfil('stackObrigatoria', [...perfil.stackObrigatoria, ...novas])
          return novas.length ? `Adicionei à stack obrigatória: ${novas.join(', ')}. Para ${data.cargo} ${data.nivel}, essa base cobre bem o dia a dia.` : 'Sua stack obrigatória já cobre o essencial para esse cargo. 👍'
        } },
        { icon: Star, label: 'Diferenciais desejáveis', run: ({ perfil, setPerfil }) => {
          const novas = ['Kubernetes', 'Kafka', 'Observabilidade'].filter((s) => !perfil.conhecimentosDesejaveis.includes(s))
          if (novas.length) setPerfil('conhecimentosDesejaveis', [...perfil.conhecimentosDesejaveis, ...novas])
          return novas.length ? `Coloquei em diferenciais: ${novas.join(', ')}. Pesam a favor, mas sem barrar bons perfis.` : 'Seus diferenciais já estão bem cobertos.'
        } },
        { icon: Smile, label: 'Sugerir soft skills', run: ({ perfil, setPerfil }) => {
          const novas = ['Comunicação clara', 'Trabalho em equipe', 'Mentoria'].filter((s) => !perfil.habilidades.includes(s))
          if (novas.length) setPerfil('habilidades', [...perfil.habilidades, ...novas])
          return novas.length ? `Sugeri no comportamental: ${novas.join(', ')}. Equilibram o lado técnico com a colaboração.` : 'Seu perfil comportamental já está bem definido.'
        } },
      ]
    case 3:
      return [
        { icon: Wand2, label: 'Gerar descrição completa', run: ({ gerar }) => { gerar(); return 'Beleza! Estou montando a descrição com base no briefing e no perfil — aparece aqui na etapa em instantes.' } },
        { icon: AlignLeft, label: 'Resumir em um parágrafo', run: ({ data }) => `Resumo: vaga de ${data.cargo} ${data.nivel}, modelo ${data.modelo}, em ${data.local}, com foco em entregar valor ao projeto ${data.cliente}.` },
        { icon: Smile, label: 'Ajustar o tom da vaga', run: () => 'Use os botões Equilibrado / Descontraído / Formal acima da descrição — eu reescrevo o texto no tom escolhido na hora.' },
      ]
    default:
      return [
        { icon: ShieldCheck, label: 'Checar viés e inclusão', run: () => 'Revisei: evite termos como "jovem" ou "nativo digital" (podem indicar viés etário). O texto está neutro em gênero. 👍' },
        { icon: CheckCircle2, label: 'Revisar clareza', run: () => 'A descrição está clara. Sugiro separar os requisitos em "obrigatórios" e "desejáveis" para facilitar a leitura.' },
        { icon: Sparkles, label: 'Sugerir título chamativo', run: ({ data }) => `Que tal o título: "${data.cargo} ${data.nivel} (${data.modelo}) — ${data.local}"?` },
      ]
  }
}

/* ────────────────────────────── helpers de UI ────────────────────────────── */

function Field({ id, label, required, hint, className, invalid, children }: {
  id: string; label: string; required?: boolean; hint?: string; className?: string; invalid?: boolean; children: ReactNode
}) {
  // A11y do controle (injetado direto p/ leitores de tela): aria-labelledby liga o NOME (cobre grupos
  // como o Chips, que não têm <label for>); aria-required marca obrigatório (o "*" vira decorativo); e
  // aria-invalid + aria-describedby sinalizam o erro da validação soft (some sozinho ao preencher).
  const errId = `${id}-error`
  const labelId = `${id}-label`
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<{ 'aria-labelledby'?: string; 'aria-required'?: boolean; 'aria-invalid'?: boolean; 'aria-describedby'?: string }>, {
        'aria-labelledby': labelId,
        ...(required ? { 'aria-required': true } : {}),
        ...(invalid ? { 'aria-invalid': true, 'aria-describedby': errId } : {}),
      })
    : children
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex min-h-5 items-center justify-between gap-2">
        <Label htmlFor={id} id={labelId} className={cn('ty-label-sm', invalid ? 'text-destructive-text' : 'text-muted-foreground')}>{label}{required && <span className="text-destructive-text" aria-hidden> *</span>}</Label>
        {hint && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" aria-label={`Ajuda: ${label}`} className={cn('-my-1 flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:text-foreground', focusRing)}><HelpCircle className="size-3.5" aria-hidden /></button>
            </TooltipTrigger>
            <TooltipContent className="max-w-56 text-center">{hint}</TooltipContent>
          </Tooltip>
        )}
      </div>
      {control}
      {invalid && (
        <p id={errId} className="flex items-center gap-1 ty-caption font-medium text-destructive-text">
          <AlertTriangle className="size-3.5 shrink-0" aria-hidden /> Campo obrigatório
        </p>
      )}
    </div>
  )
}

// FIELD/FLOAT/CARD/toneBadge agora vêm de @/lib/surfaces (fonte única, reutilizável, token-driven).

/* ───────── padrão de MOBILE: bottom sheet (selects + chips) ───────── */

/** Bottom sheet (mobile): desliza de baixo, alça + título + fechar. É o "padrão de mobile" p/ seleção
 * — substitui o dropdown ancorado / a modal flutuante em telas estreitas (< md). O foco abre no
 * "Fechar" (1º focável do DOM), então NÃO dispara o teclado: o usuário toca na busca quando quer filtrar. */
function MobileSheet({ open, onOpenChange, title, description = 'Selecione uma opção da lista.', trigger, children }: {
  open: boolean; onOpenChange: (v: boolean) => void; title: string; description?: string; trigger: ReactNode; children: ReactNode
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-xs motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:fade-in-0 motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content className={cn('fixed inset-x-0 bottom-0 z-50 flex max-h-[60vh] flex-col overflow-hidden rounded-t-2xl bg-popover pb-[env(safe-area-inset-bottom)] text-popover-foreground outline-none motion-safe:duration-200 motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:slide-in-from-bottom motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:slide-out-to-bottom', FLOAT)}>
          <div className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-border" aria-hidden />
          <div className="flex shrink-0 items-center gap-2 px-4 pt-2 pb-3">
            <DialogPrimitive.Title className="ty-label font-semibold text-foreground">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close aria-label="Fechar" className={cn('-mr-1 ml-auto flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground', focusRing)}><X className="size-4.5" aria-hidden /></DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="sr-only">{description}</DialogPrimitive.Description>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/** Campo de busca do sheet (mesmo visual nos selects e nos chips). */
function SheetSearch({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-4">
      <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="h-11 w-full bg-transparent ty-body text-foreground outline-none placeholder:text-muted-foreground" />
    </div>
  )
}

/** Lista SINGLE-SELECT do sheet (listbox/option; selecionado destacado por cor/peso + check). */
function SheetOptions({ id, options, value, onPick }: { id?: string; options: readonly string[]; value: string; onPick: (o: string) => void }) {
  return (
    <div id={id} role="listbox" aria-label="Opções" className="min-h-0 flex-1 overflow-y-auto p-2">
      {options.length === 0
        ? <p className="px-3 py-8 text-center ty-body-sm text-muted-foreground">Nada encontrado.</p>
        : options.map((o) => {
            const sel = value === o
            return (
              <button
                key={o} type="button" role="option" aria-selected={sel} onClick={() => onPick(o)}
                className={cn('flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left ty-body transition-colors hover:bg-accent hover:text-accent-foreground', focusRing, sel ? 'font-semibold text-primary-text' : 'text-foreground')}
              >
                <span className="line-clamp-2">{o}</span>
                {sel && <Check className="size-5 shrink-0 text-primary-text" aria-hidden />}
              </button>
            )
          })}
    </div>
  )
}

/** Select limpo (Radix): parece um select normal, sem checkmark; campo preenchido e dropdown
 * definido por sombra (sem a borda preta marcada do popup nativo do SO). */
function FormSelect({ id, value, onChange, options, placeholder, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedby, "aria-required": ariaRequired }: {
  id: string; value: string; onChange: (v: string) => void; options: readonly string[]; placeholder?: string
  "aria-invalid"?: boolean; "aria-describedby"?: string; "aria-required"?: boolean
}) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)

  // Mobile: bottom sheet com a lista (padrão de mobile) no lugar do dropdown ancorado.
  if (isMobile) {
    return (
      <MobileSheet
        open={open} onOpenChange={setOpen} title={placeholder || 'Selecione'}
        trigger={
          <button
            id={id} type="button" role="combobox" aria-expanded={open} aria-controls={open ? `${id}-list` : undefined}
            aria-invalid={ariaInvalid} aria-describedby={ariaDescribedby} aria-required={ariaRequired}
            className={cn('flex min-h-[var(--button-height-lg)] w-full items-center justify-between gap-2 border px-3 outline-none', FIELD, 'focus-visible:focus-ring dark:bg-input/30 dark:hover:bg-input/50', !value && 'text-muted-foreground')}
          >
            <span className="line-clamp-1 text-left">{value || placeholder}</span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground opacity-60" aria-hidden />
          </button>
        }
      >
        <SheetOptions id={`${id}-list`} options={options} value={value} onPick={(o) => { onChange(o); setOpen(false) }} />
      </MobileSheet>
    )
  }

  return (
    <SelectPrimitive.Root value={value} onValueChange={onChange}>
      <SelectPrimitive.Trigger
        id={id}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedby}
        aria-required={ariaRequired}
        className={cn(
          'flex min-h-[var(--button-height-lg)] w-full items-center justify-between gap-2 border px-3 outline-none', FIELD,
          'focus-visible:focus-ring',
          'data-[placeholder]:text-muted-foreground dark:bg-input/30 dark:hover:bg-input/50 [&>span]:line-clamp-1 [&>span]:text-left',
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild><ChevronDown className="size-4 shrink-0 text-muted-foreground opacity-60" /></SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper" sideOffset={6}
          className={cn('relative z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl bg-popover text-popover-foreground motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:fade-in-0 motion-safe:data-[state=open]:zoom-in-95', FLOAT)}
        >
          <SelectPrimitive.Viewport className="max-h-72 overflow-y-auto p-1.5">
            {options.map((o) => (
              <SelectPrimitive.Item
                key={o} value={o}
                className="flex cursor-pointer items-center rounded-lg px-2.5 py-2 text-sm outline-none transition-colors select-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[state=checked]:font-semibold data-[state=checked]:text-primary-text"
              >
                <SelectPrimitive.ItemText>{o}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

/** Select COM BUSCA p/ listas longas (Popover + cmdk): trigger igual ao FormSelect (FIELD), com um
 * campo de busca no topo do dropdown que filtra as opções. Selecionado destacado por cor/peso (sem
 * checkmark — mesmo padrão do FormSelect). Use quando há muitas opções (regra de bolso: > 7). */
function SearchSelect({ id, value, onChange, options, placeholder, searchPlaceholder = 'Buscar…', "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedby, "aria-required": ariaRequired }: {
  id: string; value: string; onChange: (v: string) => void; options: readonly string[]; placeholder?: string; searchPlaceholder?: string
  "aria-invalid"?: boolean; "aria-describedby"?: string; "aria-required"?: boolean
}) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const triggerBtn = (
    <button
      id={id} type="button" role="combobox" aria-expanded={open} aria-controls={open ? `${id}-list` : undefined}
      aria-invalid={ariaInvalid} aria-describedby={ariaDescribedby} aria-required={ariaRequired}
      className={cn(
        'flex min-h-[var(--button-height-lg)] w-full items-center justify-between gap-2 border px-3 outline-none', FIELD,
        'focus-visible:focus-ring dark:bg-input/30 dark:hover:bg-input/50',
        !value && 'text-muted-foreground',
      )}
    >
      <span className="line-clamp-1 text-left">{value || placeholder}</span>
      <ChevronDown className="size-4 shrink-0 text-muted-foreground opacity-60" aria-hidden />
    </button>
  )

  // Mobile: bottom sheet com busca + lista (padrão de mobile) no lugar do popover ancorado.
  if (isMobile) {
    const filtered = options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()))
    return (
      <MobileSheet open={open} onOpenChange={(o) => { setOpen(o); if (o) setQuery('') }} title={placeholder || 'Selecione'} trigger={triggerBtn}>
        <SheetSearch value={query} onChange={setQuery} placeholder={searchPlaceholder} />
        <SheetOptions id={`${id}-list`} options={filtered} value={value} onPick={(o) => { onChange(o); setOpen(false) }} />
      </MobileSheet>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{triggerBtn}</PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className={cn('w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-xl p-0', FLOAT)}>
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList id={`${id}-list`} className="p-1.5">
            <CommandEmpty>Nada encontrado.</CommandEmpty>
            <CommandGroup className="p-0">
              {options.map((o) => (
                <CommandItem
                  key={o} value={o}
                  onSelect={() => { onChange(o); setOpen(false) }}
                  className={cn('cursor-pointer rounded-lg px-2.5 py-2', value === o && 'font-semibold text-primary-text')}
                >
                  {o}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/* Modal de confirmação reutilizável (AlertDialog): ícone tonal + título + descrição + 2 ações.
 * Use `trigger` p/ abrir por um botão (asChild) OU `open`/`onOpenChange` p/ controle externo. */
function ConfirmDialog({ open, onOpenChange, trigger, icon: Icon, tone, title, description, cancelLabel, confirmLabel, confirmVariant = 'default', onConfirm }: {
  open?: boolean; onOpenChange?: (v: boolean) => void; trigger?: ReactNode
  icon: ComponentType<{ className?: string }>; tone: 'primary' | 'destructive' | 'secondary'
  title: string; description: string; cancelLabel: string; confirmLabel: string
  confirmVariant?: 'default' | 'destructive' | 'secondary'; onConfirm: () => void
}) {
  const toneCls = toneBadge[tone]
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent className="max-w-md">
        <div className="flex items-start gap-4">
          <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', toneCls)}><Icon className="size-5" /></span>
          <div className="space-y-1.5">
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction variant={confirmVariant} onClick={onConfirm}>{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function StatusPill({ status }: { status: Status }) {
  const map = {
    completa: { label: 'Completa', text: 'text-success-text', dot: 'bg-success' },
    preenchendo: { label: 'Em revisão', text: 'text-primary-text', dot: 'bg-primary' },
    pendente: { label: 'A preencher', text: 'text-muted-foreground', dot: 'bg-muted-foreground/40' },
    opcional: { label: 'Opcional', text: 'text-muted-foreground', dot: 'bg-muted-foreground/40' },
  }[status]
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1.5 ty-caption font-semibold tracking-wide uppercase', map.text)}>
      <span className={cn('size-1.5 rounded-full', map.dot, status === 'preenchendo' && 'motion-safe:animate-pulse')} aria-hidden /> {map.label}
    </span>
  )
}

function formatAgo(at: number) {
  const s = Math.max(0, Math.round((Date.now() - at) / 1000))
  return s < 60 ? `Há ${s}s` : `Há ${Math.round(s / 60)}min`
}

/* ────────────────────────────── sidebar (esquerda) ────────────────────────────── */

function Sidebar({ expanded, onNavigate }: { expanded: boolean; onNavigate?: (v: string) => void }) {
  // Transição SUAVE recolher↔expandir: a largura anima com easing; o conteúdo NÃO é renderizado
  // condicionalmente (o que dava o "estalo") — ele faz fade/recolhe. `overflow-hidden` no aside corta
  // o que ultrapassa a largura recolhida durante a animação. O ícone fica FIXO (não pula de posição).
  return (
    <aside className={cn('relative z-20 hidden h-dvh shrink-0 flex-col overflow-hidden bg-primary text-primary-foreground shadow-panel-l transition-[width] duration-300 ease-in-out md:flex', expanded ? 'w-[300px]' : 'w-16')}>
      {/* logo: crossfade marca↔logo completo (sem swap seco), ambos ancorados à esquerda */}
      <div className="relative flex h-16 shrink-0 items-center px-4">
        <img src={logoMark} alt="" aria-hidden className={cn('absolute left-4 size-7 transition-opacity duration-300', expanded ? 'opacity-0' : 'opacity-100')} />
        <Logo variant="onBrand" className={cn('h-7 w-auto transition-opacity duration-300', expanded ? 'opacity-100' : 'opacity-0')} alt="TIS Talent" />
      </div>

      <nav className="flex-1 space-y-5 overflow-x-hidden overflow-y-auto px-2.5 py-3" aria-label="Navegação principal">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            {/* título do grupo: anima altura+opacidade (recolhe a 0 quando colapsado) — não some de estalo */}
            <p className={cn('overflow-hidden px-2 ty-caption font-semibold tracking-widest text-primary-foreground uppercase transition-all duration-300', expanded ? 'h-5 pb-1 opacity-100' : 'h-0 pb-0 opacity-0')}>{group.label}</p>
            {group.items.map(({ key, label, icon: Icon }) => {
              const active = key === 'gerador'
              // Tooltip SEMPRE montado (não remonta o botão na troca) — o conteúdo só aparece recolhido.
              return (
                <Tooltip key={key} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      type="button" aria-current={active ? 'page' : undefined} aria-label={label}
                      onClick={() => { if (active) return; if (key === 'dashboard' && onNavigate) onNavigate('dashboard'); else toast.info(`"${label}" não faz parte desta demo.`) }}
                      className={cn('group flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left ty-body-sm transition-colors', focusRingOnPrimary,
                        // Item ATIVO = pílula INVERTIDA (fundo claro, texto azul). text-primary sobre
                        // bg-primary-foreground é AA por SIMETRIA do par primary/primary-foreground do DS.
                        // eslint-disable-next-line crp/design-tokens
                        active ? 'bg-primary-foreground text-primary font-semibold shadow-sm' : 'text-primary-foreground hover:bg-primary-foreground/10')}
                    >
                      <Icon className={cn('size-4.5 shrink-0 transition-colors', !active && 'text-primary-foreground/80')} aria-hidden />
                      {/* label faz FADE (o fade é mais rápido que a largura → some antes de "cortar") */}
                      <span className={cn('truncate transition-opacity duration-200', !expanded && 'opacity-0')}>{label}</span>
                    </button>
                  </TooltipTrigger>
                  {!expanded && <TooltipContent side="right" sideOffset={8}>{label}</TooltipContent>}
                </Tooltip>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}

/* ────────────────────────────── menu mobile (drawer) ────────────────────────────── */

// `< md`: a Sidebar fixa some; o hambúrguer abre ESTE drawer (Radix Dialog → foco preso, Esc, scroll
// lock, nome acessível de graça). `md+` ele nunca abre (o estado é forçado a fechar — ver a página).
function MobileNav({ open, onOpenChange, onNavigate }: { open: boolean; onOpenChange: (v: boolean) => void; onNavigate?: (v: string) => void }) {
  const go = (key: string, label: string) => {
    onOpenChange(false)
    if (key === 'gerador') return
    if (key === 'dashboard' && onNavigate) onNavigate('dashboard')
    else toast.info(`"${label}" não faz parte desta demo.`)
  }
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content className="fixed inset-0 z-50 flex w-full flex-col bg-primary text-primary-foreground outline-none motion-safe:duration-200 motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:fade-in-0 motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:fade-out-0 md:hidden">
          <div className="flex h-16 shrink-0 items-center justify-between px-5">
            <Logo variant="onBrand" className="h-7 w-auto" alt="TIS Talent" />
            <DialogPrimitive.Close aria-label="Fechar menu" className={cn('flex size-9 items-center justify-center rounded-lg text-primary-foreground transition-colors hover:bg-primary-foreground/10', focusRingOnPrimary)}>
              <X className="size-5" aria-hidden />
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Title className="sr-only">Navegação principal</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">Acesse as áreas do workspace.</DialogPrimitive.Description>
          <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-4" aria-label="Navegação principal">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="space-y-1.5">
                <p className="px-3 pb-1 ty-caption font-semibold tracking-widest text-primary-foreground uppercase">{group.label}</p>
                {group.items.map(({ key, label, icon: Icon }) => {
                  const active = key === 'gerador'
                  return (
                    <button
                      key={key} type="button" aria-current={active ? 'page' : undefined} onClick={() => go(key, label)}
                      className={cn('group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left ty-body transition-colors', focusRingOnPrimary,
                        // eslint-disable-next-line crp/design-tokens -- pílula invertida (par primary/primary-foreground é AA por simetria), igual à Sidebar.
                        active ? 'bg-primary-foreground text-primary font-semibold shadow-sm' : 'text-primary-foreground hover:bg-primary-foreground/10')}
                    >
                      <Icon className={cn('size-5 shrink-0', !active && 'text-primary-foreground/80')} aria-hidden />
                      <span className="truncate">{label}</span>
                    </button>
                  )
                })}
              </div>
            ))}
          </nav>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/* ────────────────────────────── topbar ────────────────────────────── */

function TopBar({ onToggleMenu, menuExpanded, isMobile, onCharlie, charlieOpen, onLogout, brand, mode, onCycleBrand, onToggleMode }: {
  onToggleMenu: () => void; menuExpanded: boolean; isMobile?: boolean; onCharlie: () => void; charlieOpen: boolean; onLogout: () => void
  brand?: string; mode?: string; onCycleBrand?: () => void; onToggleMode?: () => void
}) {
  // `menuExpanded` = no mobile reflete o drawer aberto; no desktop, o menu fixo expandido.
  const menuLabel = isMobile ? (menuExpanded ? 'Fechar menu' : 'Abrir menu') : menuExpanded ? 'Recolher menu' : 'Expandir menu'
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border/40 bg-card/70 px-4 backdrop-blur-sm lg:px-6">
      <Button variant="ghost" size="icon" aria-label={menuLabel} aria-expanded={menuExpanded} onClick={onToggleMenu} className="text-muted-foreground hover:text-foreground">
        {isMobile ? <Menu /> : <ChevronLeft className={cn('transition-transform', !menuExpanded && 'rotate-180')} />}
      </Button>
      <nav aria-label="Trilha" className="hidden items-center gap-1.5 ty-caption font-medium tracking-wide text-muted-foreground uppercase sm:flex">
        <span>Workspace</span><span aria-hidden>/</span><span>Vagas</span><span aria-hidden>/</span><span className="text-foreground">Nova vaga</span>
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        {onCycleBrand && <Button variant="ghost" size="icon" aria-label={`Trocar marca (atual: ${brand})`} onClick={onCycleBrand}><Palette /></Button>}
        {onToggleMode && <Button variant="ghost" size="icon" aria-label={mode === 'dark' ? 'Tema claro' : 'Tema escuro'} onClick={onToggleMode}>{mode === 'dark' ? <Sun /> : <Moon />}</Button>}
        <Separator orientation="vertical" className="mx-1 h-5" />
        <button type="button" onClick={onCharlie} aria-pressed={charlieOpen} aria-label="Falar com Charlie"
          className={cn('inline-flex min-h-10 items-center gap-2 rounded-lg bg-secondary px-3 py-2 ty-label font-medium text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/90', focusRing)}>
          <Sparkles className="size-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">Falar com Charlie</span>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label="Sua conta" className={cn('relative ml-1 rounded-full', focusRing)}>
              <Avatar className="size-10"><AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">FL</AvatarFallback></Avatar>
              <span className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-card bg-success" aria-hidden />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={cn('w-60', FLOAT)}>
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <Avatar className="size-9"><AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">FL</AvatarFallback></Avatar>
              <div className="min-w-0 leading-tight">
                <p className="truncate ty-body-sm font-medium">Franklin L.</p>
                <p className="truncate ty-caption text-muted-foreground">recrutador@talentai.com</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => toast.info('Conta (demo).')}><UserRound /> Minha conta</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onLogout} className="text-destructive-text focus:bg-destructive/10 focus:text-destructive-text"><LogOut /> Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

/* ────────────────────────────── stepper ────────────────────────────── */

function Stepper({ step, onPick, complete }: { step: number; onPick: (n: number) => void; complete?: (n: number) => boolean }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label={`Progresso: etapa ${step} de ${STEPS.length}`}>
      {STEPS.map((s) => {
        const active = s.n === step
        const done = s.n < step
        // etapa já visitada mas deixada com obrigatórios em branco (validação soft não trava) → aviso.
        const incomplete = done && complete ? !complete(s.n) : false
        const status = active ? 'Em andamento' : incomplete ? 'Incompleta' : done ? 'Concluída' : 'Próxima'
        // Só as etapas JÁ PASSADAS viram botão (dá p/ voltar e revisar). A atual é onde você está; as
        // futuras ficam TRAVADAS até você chegar nelas — não são clicáveis (sem hover/foco/cursor).
        const navigable = done
        const card = cn(
          'flex w-full flex-col gap-3 rounded-xl p-4 text-left transition',
          active ? 'bg-primary/[0.05] shadow-sm ring-2 ring-primary/50'
            : incomplete ? 'bg-card shadow-sm ring-1 ring-destructive/40'
            : done ? 'bg-card shadow-sm ring-1 ring-foreground/[0.08]'
            : 'bg-muted/30 ring-1 ring-foreground/[0.06]', // futura: recuada/travada, sem sombra
        )
        const inner = (
          <>
            <span className={cn('flex size-8 items-center justify-center rounded-full ty-label-sm font-semibold tabular-nums', incomplete ? 'bg-destructive text-destructive-foreground' : done ? 'bg-success text-success-foreground' : active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')} aria-hidden>
              {incomplete ? <AlertTriangle className="size-4" /> : done ? <CheckCircle2 className="size-4" /> : s.n}
            </span>
            <span className="space-y-0.5">
              {/* sr-only: o badge com o número é aria-hidden; aqui o leitor de tela recebe "Etapa N" e,
                  na atual, um "Você está aqui" explícito (reforça o aria-current="step" da div). */}
              <span className="sr-only">{active ? `Etapa ${s.n}, você está aqui: ` : `Etapa ${s.n}: `}</span>
              <span className="block ty-body-sm font-semibold text-foreground">{s.title}</span>
              <span className={cn('block ty-caption font-medium', active ? 'text-primary-text' : incomplete ? 'text-destructive-text' : done ? 'text-success-text' : 'text-muted-foreground')}>{status}</span>
            </span>
          </>
        )
        return (
          <li key={s.n}>
            {navigable ? (
              // focusRing traz `rounded-sm` e, por vir depois do card no cn(), o twMerge anularia o
              // rounded-xl do card (→ 4px). Reforço rounded-xl por último p/ o card manter os 12px.
              <button type="button" onClick={() => onPick(s.n)} className={cn(card, 'cursor-pointer hover:bg-accent/40', focusRing, 'rounded-xl')}>
                {inner}
              </button>
            ) : (
              <div aria-current={active ? 'step' : undefined} className={card}>
                {inner}
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

/* ────────────────────────────── form: Briefing ────────────────────────────── */

type SectionMeta = { icon: ComponentType<{ className?: string }>; title: string; desc: string }
function SectionBlock({ meta, status, children }: { meta: SectionMeta; status: Status; children: ReactNode }) {
  const Icon = meta.icon
  return (
    <section className="px-6 py-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', toneBadge.primary)}><Icon className="size-4.5" aria-hidden /></span>
          <div className="min-w-0">
            {/* ty-body-lg é unlayered e anula o utilitário font-bold → forço o peso pelo token (inline vence). */}
            <h2 className="ty-body-lg text-foreground" style={{ fontWeight: 'var(--font-weight-bold)' }}>{meta.title}</h2>
            <p className="ty-label-sm text-muted-foreground">{meta.desc}</p>
          </div>
        </div>
        <StatusPill status={status} />
      </header>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function Chips({ value, onChange, pool, addLabel = 'adicionar', emptyHint, searchPlaceholder = 'Buscar…', ordered, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedby, "aria-labelledby": ariaLabelledby }: {
  value: string[]; onChange: (v: string[]) => void; pool: readonly string[]; addLabel?: string; emptyHint?: string; searchPlaceholder?: string; ordered?: boolean
  "aria-invalid"?: boolean; "aria-describedby"?: string; "aria-labelledby"?: string
}) {
  // Desktop: "+ adicionar" abre uma MODAL flutuante (SEM overlay), ARRASTÁVEL pela alça do topo.
  // Mobile: o mesmo conteúdo (busca + CHECKBOXES) vira um BOTTOM SHEET (padrão de mobile).
  // Cada item é um checkbox de verdade (estado lido por leitores de tela; Tab + Espaço) e a marcação
  // aplica na hora — dá p/ adicionar vários sem fechar.
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null) // null = centralizado via CSS
  const drag = useRef<{ ox: number; oy: number; el: HTMLElement } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const toggle = (b: string) => onChange(value.includes(b) ? value.filter((x) => x !== b) : [...value, b])
  // modo ORDENADO: troca o item i com o vizinho (cima/baixo) — a ORDEM do array É a sequência.
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= value.length) return
    const next = value.slice()
    const tmp = next[i]
    next[i] = next[j]
    next[j] = tmp
    onChange(next)
  }
  // A lista SEMPRE inclui o que já está selecionado (mesmo fora do pool) — senão um item pré-marcado
  // não apareceria na busca p/ desmarcar/remarcar. Protege todos os campos de chips contra esse descompasso.
  const options = [...pool, ...value.filter((v) => !pool.includes(v))]
  const filtered = options.filter((b) => b.toLowerCase().includes(query.trim().toLowerCase()))

  // Arrasta a modal pela alça: fixa em left/top a partir da posição atual e segue o ponteiro (com clamp
  // nas bordas). setPointerCapture garante o move mesmo se o cursor sai da alça.
  const onGrab = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget.parentElement as HTMLElement
    const r = el.getBoundingClientRect()
    drag.current = { ox: e.clientX - r.left, oy: e.clientY - r.top, el }
    setPos({ x: r.left, y: r.top })
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onDragMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    const x = Math.min(Math.max(8, e.clientX - d.ox), window.innerWidth - d.el.offsetWidth - 8)
    const y = Math.min(Math.max(8, e.clientY - d.oy), window.innerHeight - d.el.offsetHeight - 8)
    setPos({ x, y })
  }
  const onRelease = (e: ReactPointerEvent<HTMLDivElement>) => {
    drag.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const addTrigger = (
    <button type="button" aria-label={`Adicionar ${addLabel}`} className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 ty-body-sm font-medium text-primary-text transition-colors hover:bg-primary/10', focusRing)}><Plus className="size-3.5" aria-hidden /> adicionar mais</button>
  )

  return (
    <div role="group" aria-labelledby={ariaLabelledby} data-invalid={ariaInvalid ? '' : undefined} aria-describedby={ariaDescribedby} className={ordered ? 'space-y-2' : 'flex flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-muted/50 p-2 data-[invalid]:border-destructive'}>
      {value.length === 0 && emptyHint && <span className={ordered ? 'block ty-body-sm text-muted-foreground' : 'px-1.5 py-1 ty-body-sm text-muted-foreground'}>{emptyHint}</span>}
      {ordered
        ? value.length > 0 && (
            <ol className="space-y-2">
              {value.map((b, i) => (
                <li key={b} className="flex items-center gap-2.5 rounded-lg border border-border/70 bg-muted/50 px-2.5 py-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 ty-label-sm font-semibold text-primary-text tabular-nums" aria-hidden>{i + 1}</span>
                  <span className="min-w-0 flex-1 ty-body-sm text-foreground"><span className="sr-only">Etapa {i + 1}: </span>{b}</span>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button type="button" aria-label={`Mover ${b} para cima`} disabled={i === 0} onClick={() => move(i, -1)} className={cn('flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30', focusRing)}><ChevronUp className="size-4" aria-hidden /></button>
                    <button type="button" aria-label={`Mover ${b} para baixo`} disabled={i === value.length - 1} onClick={() => move(i, 1)} className={cn('flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30', focusRing)}><ChevronDown className="size-4" aria-hidden /></button>
                    <button type="button" aria-label={`Remover ${b}`} onClick={() => onChange(value.filter((x) => x !== b))} className={cn('flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground', focusRing)}><X className="size-4" aria-hidden /></button>
                  </div>
                </li>
              ))}
            </ol>
          )
        : value.map((b) => (
            <span key={b} className="inline-flex items-center gap-1.5 rounded-full bg-background py-1 pr-1.5 pl-2.5 ty-body-sm text-foreground shadow-sm ring-1 ring-surface-ring">
              {b}
              <button type="button" aria-label={`Remover ${b}`} onClick={() => onChange(value.filter((x) => x !== b))} className={cn('-mr-1 flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground', focusRing)}><X className="size-3.5" aria-hidden /></button>
            </span>
          ))}
      {isMobile ? (
        /* Mobile: bottom sheet (padrão de mobile) com busca + checkboxes. */
        <MobileSheet
          open={open} onOpenChange={(o) => { setOpen(o); if (o) setQuery('') }}
          title={`Adicionar ${addLabel}`} description="Pesquise e marque os itens. As alterações são aplicadas na hora; feche quando terminar."
          trigger={addTrigger}
        >
          <SheetSearch value={query} onChange={setQuery} placeholder={searchPlaceholder} />
          <div role="group" aria-label={`Opções de ${addLabel}`} className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2">
            {filtered.length === 0
              ? <p className="px-3 py-8 text-center ty-body-sm text-muted-foreground">Nada encontrado.</p>
              : filtered.map((b) => (
                  <label key={b} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 ty-body transition-colors hover:bg-accent hover:text-accent-foreground has-[:focus-visible]:bg-accent">
                    <Checkbox checked={value.includes(b)} onCheckedChange={() => toggle(b)} />
                    {b}
                  </label>
                ))}
          </div>
          {value.length > 0 && (
            <div className="shrink-0 border-t border-border/60 p-2">
              <button type="button" onClick={() => onChange([])} className={cn('flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-3 ty-body font-medium text-destructive-text transition-colors hover:bg-destructive/10', focusRing)}>
                <Trash2 className="size-4 shrink-0" aria-hidden /> Limpar tudo ({value.length})
              </button>
            </div>
          )}
        </MobileSheet>
      ) : (
      <DialogPrimitive.Root open={open} onOpenChange={(o) => { setOpen(o); if (o) { setPos(null); setQuery('') } }}>
        <DialogPrimitive.Trigger asChild>{addTrigger}</DialogPrimitive.Trigger>
        {/* pos null = centralizado (CSS); ao arrastar, fixa em left/top. Fecha por Esc / X / clique fora. */}
        <DialogPrimitive.Portal>
          <DialogPrimitive.Content
            onOpenAutoFocus={(e) => { e.preventDefault(); inputRef.current?.focus() }}
            style={pos ? { left: pos.x, top: pos.y } : undefined}
            className={cn(
              'fixed z-50 flex max-h-[80vh] w-[calc(100%-2rem)] max-w-sm flex-col overflow-hidden rounded-xl bg-popover p-0 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
              pos ? '' : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
              FLOAT,
            )}
          >
            {/* alça de arraste: título (= nome acessível do diálogo) + fechar */}
            <div onPointerDown={onGrab} onPointerMove={onDragMove} onPointerUp={onRelease} className="flex shrink-0 touch-none cursor-grab items-center gap-1.5 border-b border-border/60 px-3 py-2 select-none active:cursor-grabbing">
              <GripHorizontal className="size-4 shrink-0 text-muted-foreground/70" aria-hidden />
              <DialogPrimitive.Title className="ty-label-sm font-semibold text-foreground">Adicionar {addLabel}</DialogPrimitive.Title>
              <DialogPrimitive.Close onPointerDown={(e) => e.stopPropagation()} aria-label="Fechar" className={cn('ml-auto flex size-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground', focusRing)}>
                <X className="size-4" aria-hidden />
              </DialogPrimitive.Close>
            </div>
            <DialogPrimitive.Description className="sr-only">Pesquise e marque os itens. As alterações são aplicadas na hora; feche quando terminar.</DialogPrimitive.Description>
            {/* busca */}
            <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-3">
              <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={searchPlaceholder} aria-label={searchPlaceholder} className="h-10 w-full bg-transparent ty-body-sm text-foreground outline-none placeholder:text-muted-foreground" />
            </div>
            {/* lista de checkboxes (estado anunciado nativamente; Tab + Espaço). max-h-80 ≈ 8 itens
                visíveis; o resto entra por scroll, deixando a modal compacta. */}
            <div role="group" aria-label={`Opções de ${addLabel}`} className="min-h-0 max-h-80 space-y-0.5 overflow-y-auto p-1.5">
              {filtered.length === 0
                ? <p className="px-2.5 py-6 text-center ty-body-sm text-muted-foreground">Nada encontrado.</p>
                : filtered.map((b) => (
                    <label key={b} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 ty-body-sm transition-colors hover:bg-accent hover:text-accent-foreground has-[:focus-visible]:bg-accent">
                      <Checkbox checked={value.includes(b)} onCheckedChange={() => toggle(b)} />
                      {b}
                    </label>
                  ))}
            </div>
            {value.length > 0 && (
              <div className="shrink-0 border-t border-border/60 p-1.5">
                <button type="button" onClick={() => onChange([])} className={cn('flex w-full items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 ty-body-sm font-medium text-destructive-text transition-colors hover:bg-destructive/10', focusRing)}>
                  <Trash2 className="size-3.5" aria-hidden /> Limpar tudo ({value.length})
                </button>
              </div>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
      )}
    </div>
  )
}

function BriefingForm({ data, set, showErrors }: { data: Briefing; set: SetBriefing; showErrors?: boolean }) {
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

      <SectionBlock meta={SECTIONS[2]} status={fieldsStatus(data, SECTIONS[2].fields)}>
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="budget" label="Budget" required hint="Faixa salarial prevista." invalid={inv('budget')}><Input id="budget" value={data.budget} onChange={(e) => set('budget', e.target.value)} placeholder="R$ 8.000 — 10.000" className={cn(FIELD, 'min-h-[var(--button-height-lg)]')} /></Field>
            <Field id="modalidade" label="Modalidade contratual" required invalid={inv('modalidade')}><FormSelect id="modalidade" value={data.modalidade} onChange={(v) => set('modalidade', v)} options={MODALIDADES} placeholder="Selecione a modalidade" /></Field>
          </div>
          <Field id="beneficios" label="Benefícios" required invalid={inv('beneficios')}><Chips value={data.beneficios} onChange={(v) => set('beneficios', v)} pool={BENEFICIOS_POOL} addLabel="benefício" searchPlaceholder="Buscar benefício…" emptyHint="Nenhum benefício adicionado." /></Field>
        </div>
      </SectionBlock>

      <SectionBlock meta={SECTIONS[3]} status={fieldsStatus(data, SECTIONS[3].fields)}>
        <Field id="processo" label="Etapas do processo" required hint="Selecione as etapas e ordene a sequência com as setas." invalid={inv('processoSeletivo')}>
          <Chips ordered value={data.processoSeletivo} onChange={(v) => set('processoSeletivo', v)} pool={PROCESSO_POOL} addLabel="etapa" searchPlaceholder="Buscar etapa…" emptyHint="Nenhuma etapa adicionada." />
        </Field>
      </SectionBlock>
    </div>
  )
}

/* ────────────────────────────── etapa 2 · Perfil e Requisitos ────────────────────────────── */

function PerfilForm({ perfil, set, showErrors }: { perfil: Perfil; set: SetPerfil; showErrors?: boolean }) {
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

/* ────────────────────────────── etapa 3 · Preview & Gerar com IA ────────────────────────────── */

function PreviewStep({ data, perfil, desc, gerando, tom, onTom, onGerar }: {
  data: Briefing; perfil: Perfil; desc: GeneratedDesc | null; gerando: boolean
  tom: Tom; onTom: (t: Tom) => void; onGerar: () => void
}) {
  if (gerando) {
    return (
      <div className={cn('flex min-h-80 flex-col items-center justify-center gap-4 p-8 text-center', CARD)} role="status" aria-live="polite">
        <span className={cn('flex size-12 items-center justify-center rounded-full', toneBadge.primary)}><Loader2 className="size-6 animate-spin" aria-hidden /></span>
        <div className="space-y-1">
          <p className="ty-body font-semibold text-foreground">Charlie está escrevendo a descrição…</p>
          <p className="ty-body-sm text-muted-foreground">Combinando briefing, perfil e o tom selecionado.</p>
        </div>
      </div>
    )
  }

  if (!desc) {
    const localDesc = buildDesc(data, perfil, tom)
    const previewLen = (localDesc.titulo + localDesc.resumo + localDesc.responsabilidades.join('') + localDesc.requisitos.join('') + localDesc.beneficios.join('') + data.processoSeletivo.join('')).length
    const { brief, perf, briefTotal, perfTotal } = missingRequired(data, perfil)
    const resumo = ([['Cargo', data.cargo], ['Senioridade', data.nivel], ['Modelo', data.modelo], ['Budget', data.budget], ['Stack obrigatória', perfil.stackObrigatoria.join(', ')]] as [string, string][]).filter(([, v]) => isFilledVal(v))
    const ideal = previewLen <= 2000
    const faltando = [...brief, ...perf]
    return (
      <div className="space-y-6">
        {/* barra de tom + ação — a que você curtiu, agora também no pré-geração (topo) */}
        <div className="flex flex-col gap-3 rounded-xl bg-primary/[0.05] px-4 py-3 ring-1 ring-primary/15 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 ty-body-sm font-medium text-primary-text"><Sparkles className="size-4 shrink-0" aria-hidden /> Escolha o tom e gere o post com o Charlie.</p>
          <div className="flex items-center gap-2 max-sm:justify-between">
            <div role="group" aria-label="Tom da descrição" className="inline-flex rounded-lg bg-muted/60 p-0.5">
              {TONS.map((t) => (
                <button key={t} type="button" aria-pressed={tom === t} onClick={() => onTom(t)}
                  className={cn('rounded-md px-2.5 py-1 ty-caption font-medium transition-colors', focusRing, tom === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{t}</button>
              ))}
            </div>
            <Button onClick={onGerar}><Sparkles /> Gerar com IA</Button>
          </div>
        </div>

        {/* visão da vaga — PRIMEIRO (status/pendências antes de rolar o preview) */}
        <section aria-labelledby="visao-vaga" className="space-y-4">
          <h2 id="visao-vaga" className="ty-h4 text-foreground">Visão da vaga</h2>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <StatusRow label="Briefing" missing={brief.length} total={briefTotal} />
            <StatusRow label="Perfil" missing={perf.length} total={perfTotal} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {faltando.length > 0 && (
              <div className={cn('space-y-3 p-5', CARD)}>
                <h3 className="flex items-baseline gap-2 ty-label text-foreground" style={{ fontWeight: 'var(--font-weight-semibold)' }}>Faltando completar<span className="ty-caption tabular-nums text-muted-foreground">{faltando.length}</span></h3>
                <ul className="space-y-2.5">
                  {faltando.map((m, i) => (
                    <li key={i} className="flex gap-2.5 ty-body-sm">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-text" aria-hidden />
                      <span className="text-foreground"><span className="text-muted-foreground">[{m.scope}]</span> {m.label}: <span className="text-muted-foreground">{m.hint}</span></span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className={cn('space-y-3 p-5', faltando.length === 0 && 'lg:col-span-2', CARD)}>
              <h3 className="ty-label text-foreground" style={{ fontWeight: 'var(--font-weight-semibold)' }}>Resumo atual</h3>
              {resumo.length > 0 ? (
                <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  {resumo.map(([k, v]) => (
                    <div key={k} className="min-w-0 space-y-0.5">
                      <dt className="ty-label-sm text-muted-foreground">{k}</dt>
                      <dd className="ty-body-sm leading-snug text-foreground">{v}</dd>
                    </div>
                  ))}
                </dl>
              ) : <p className="ty-body-sm text-muted-foreground">Preencha o briefing para ver o resumo.</p>}
            </div>
          </div>
        </section>

        {/* preview — MESMO layout da descrição gerada (título + seções + chips), montado LOCAL */}
        <div className="space-y-2.5">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 ty-label-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><FileText className="size-3.5 shrink-0" aria-hidden /> Preview local — clique em Gerar com IA para o Charlie enriquecer</span>
            <span className={cn('inline-flex items-center gap-1.5', ideal ? 'text-success-text' : 'text-warning-text')}>
              <span className={cn('size-1.5 shrink-0 rounded-full', ideal ? 'bg-success' : 'bg-warning')} aria-hidden />
              {previewLen.toLocaleString('pt-BR')} caracteres
            </span>
          </p>
          <JobDocArticle desc={localDesc} data={data} perfil={perfil} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-primary/[0.05] px-4 py-3 ring-1 ring-primary/15">
        <p className="flex items-center gap-2 ty-body-sm font-medium text-primary-text"><Sparkles className="size-4 shrink-0" aria-hidden /> Gerado por IA — revise antes de publicar.</p>
        <div className="flex items-center gap-2">
          <div role="group" aria-label="Tom da descrição" className="inline-flex rounded-lg bg-muted/60 p-0.5">
            {TONS.map((t) => (
              <button key={t} type="button" aria-pressed={tom === t} onClick={() => onTom(t)}
                className={cn('rounded-md px-2.5 py-1 ty-caption font-medium transition-colors', focusRing, tom === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{t}</button>
            ))}
          </div>
          <Button variant="outline" onClick={onGerar}><RefreshCw /> Regenerar</Button>
        </div>
      </div>

      <JobDocArticle desc={desc} data={data} perfil={perfil} />
    </div>
  )
}

// Documento da vaga — o preview LOCAL e a descrição GERADA usam o MESMO layout (cabeçalho + seções
// com bullets + benefícios em chips). Inclui "Operação & condições" e "Processo seletivo" p/ cobrir
// TODO o briefing/perfil — nada dos passos 1 e 2 fica de fora.
function JobDocArticle({ desc, data, perfil }: { desc: GeneratedDesc; data: Briefing; perfil: Perfil }) {
  const titleId = useId()
  const benefId = useId()
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

// Linha de prontidão (Visão da vaga): verde "completo" ou âmbar "faltando X de N".
function StatusRow({ label, missing, total }: { label: string; missing: number; total: number }) {
  const ok = missing === 0
  return (
    <div className={cn('flex items-center justify-between gap-2 rounded-lg px-3 py-2 ty-body-sm', ok ? 'bg-success/10 text-success-text' : 'bg-warning/10 text-warning-text')}>
      <span className="flex items-center gap-2">
        {ok ? <CheckCircle2 className="size-4 shrink-0" aria-hidden /> : <AlertTriangle className="size-4 shrink-0" aria-hidden />}
        {label}
      </span>
      <span className="tabular-nums">{ok ? 'completo' : `faltando ${missing} de ${total}`}</span>
    </div>
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

/* ────────────────────────────── etapa 4 · Revisar & Publicar ────────────────────────────── */

function PublishStep({ data, perfil, desc, publish, set, onGoto, showErrors }: {
  data: Briefing; perfil: Perfil; desc: GeneratedDesc | null
  publish: Publish; set: SetPublish; onGoto: (n: number) => void; showErrors?: boolean
}) {
  const invCanais = !!showErrors && publish.canais.length === 0
  const checks = [
    { ok: requiredBriefingOk(data), label: 'Briefing com campos obrigatórios', fail: 'Faltam campos obrigatórios.', goto: 1 },
    { ok: requiredPerfilOk(perfil), label: 'Perfil com campos obrigatórios', fail: 'Complete o perfil.', goto: 2 },
    { ok: !!desc, label: 'Descrição gerada pela IA', fail: 'Gere a descrição.', goto: 3 },
  ]
  const recap: [string, string][] = [
    ['Cargo', `${data.cargo} · ${data.nivel}`],
    ['Modelo', data.modelo],
    ['Local', data.local],
    ['Modalidade', data.modalidade],
    ['Budget', data.budget || '—'],
    ['Vagas', String(data.quantidade)],
    ['Formação', perfil.formacao || '—'],
    ['Stack', perfil.stackObrigatoria.join(', ') || '—'],
    ['Comportamental', perfil.habilidades.join(', ') || '—'],
  ]
  const toggleCanal = (c: string, on: boolean) => set('canais', on ? [...publish.canais, c] : publish.canais.filter((x) => x !== c))

  return (
    <div className="space-y-5">
      <div className={cn(CARD, 'p-6')}>
        <h2 className="flex items-center gap-2 ty-body font-semibold text-foreground"><ListChecks className="size-4.5 text-primary-text" aria-hidden /> Prontidão para publicar</h2>
        <ul className="mt-4 space-y-2.5">
          {checks.map((c) => (
            <li key={c.label} className="flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <span className="flex items-center gap-2.5 ty-body-sm">
                {c.ok
                  ? <CheckCircle2 className="size-4.5 shrink-0 text-success-text" aria-hidden />
                  : <AlertTriangle className="size-4.5 shrink-0 text-destructive-text" aria-hidden />}
                <span className={c.ok ? 'text-foreground' : 'text-muted-foreground'}>{c.label}</span>
              </span>
              {!c.ok && (
                <Button variant="ghost" className="h-auto min-h-10 max-w-full shrink-0 py-1.5 text-left whitespace-normal text-primary-text hover:bg-primary/10 hover:text-primary-text" onClick={() => onGoto(c.goto)}>{c.fail} Resolver</Button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className={cn(CARD, 'p-6')}>
        <h2 className="flex items-center gap-2 ty-body font-semibold text-foreground"><ClipboardList className="size-4.5 text-primary-text" aria-hidden /> Resumo da vaga</h2>
        <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {recap.map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="ty-caption font-semibold tracking-wide text-muted-foreground uppercase">{k}</dt>
              <dd className="truncate ty-body-sm text-foreground" title={v}>{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className={cn(CARD, 'p-6')}>
        <h2 className="flex items-center gap-2 ty-body font-semibold text-foreground"><Megaphone className="size-4.5 text-primary-text" aria-hidden /> Configuração de publicação</h2>
        <div className="mt-4 space-y-5">
          <fieldset id="canais-group" data-invalid={invCanais ? '' : undefined} aria-describedby={invCanais ? 'canais-error' : undefined} className="space-y-2 scroll-mt-24">
            <legend className={cn('ty-label-sm', invCanais ? 'text-destructive-text' : 'text-muted-foreground')}>Canais de divulgação<span className="text-destructive-text"> *</span></legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {CANAIS.map((c) => (
                <label key={c} className={cn('flex cursor-pointer items-center gap-2.5 rounded-lg border border-border/70 bg-muted/40 px-3 py-2.5 ty-body-sm transition-colors hover:border-border hover:bg-muted/60', focusRing)}>
                  <Checkbox checked={publish.canais.includes(c)} onCheckedChange={(v) => toggleCanal(c, v === true)} />
                  {c}
                </label>
              ))}
            </div>
            {invCanais && (
              <p id="canais-error" className="flex items-center gap-1 ty-caption font-medium text-destructive-text">
                <AlertTriangle className="size-3.5 shrink-0" aria-hidden /> Selecione ao menos um canal
              </p>
            )}
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="visibilidade" label="Visibilidade" required invalid={!!showErrors && !isFilledVal(publish.visibilidade)}><FormSelect id="visibilidade" value={publish.visibilidade} onChange={(v) => set('visibilidade', v)} options={VISIBILIDADES} placeholder="Selecione a visibilidade" /></Field>
            <Field id="prazo" label="Prazo de exibição" required invalid={!!showErrors && !isFilledVal(publish.prazo)}><FormSelect id="prazo" value={publish.prazo} onChange={(v) => set('prazo', v)} options={PRAZOS} placeholder="Selecione o prazo" /></Field>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────── painel Charlie ────────────────────────────── */

type Msg = { id: number; role: 'user' | 'assistant'; text: string; at: number }

function CharlieRail({ open, onClose, step, msgs, onSuggestion, onSend, onClear }: {
  open: boolean; onClose: () => void; step: number; msgs: Msg[]
  onSuggestion: (s: Suggestion) => void; onSend: (text: string) => void; onClear: () => void
}) {
  const [draft, setDraft] = useState('')
  // `< lg`: o Charlie é um MODAL de tela cheia (Radix Dialog trata foco/Esc). `lg+`: painel lateral
  // NÃO-modal (dá p/ editar o form com ele aberto ao lado), então o Esc é manual aqui.
  const overlay = useIsMobile('(max-width: 1023px)')
  useEffect(() => {
    if (!open || overlay) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, overlay])

  // Desktop fechado: nada a renderizar (sem Radix). No mobile mantemos o Dialog.Root MONTADO mesmo
  // fechado — é assim que o Radix anima a saída e RESTAURA o foco ao gatilho (não pode desmontar antes).
  if (!overlay && !open) return null
  const suggestions = suggestionsFor(step)
  const submit = () => { const t = draft.trim(); if (!t) return; onSend(t); setDraft('') }

  const content = (
    <>
      <header className="flex items-center gap-3 border-b border-border/40 px-4 py-3">
        <span className="relative inline-flex">
          <Avatar className="size-9"><AvatarFallback className="bg-secondary font-semibold text-secondary-foreground">C</AvatarFallback></Avatar>
          <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-card bg-success" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="ty-body font-semibold text-foreground">Charlie</p>
          <p className="flex items-center gap-1.5 ty-caption font-medium text-muted-foreground"><span className="size-1.5 rounded-full bg-success" aria-hidden /> COPILOTO · <span className="text-success-text">ATIVO</span></p>
        </div>
        <Button variant="ghost" size="icon" aria-label="Fechar Charlie" onClick={onClose}><X /></Button>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <section className="space-y-2" aria-label="Sugestões">
          <h3 className="ty-overline text-muted-foreground">Sugestões para esta etapa</h3>
          <div className="space-y-2">
            {suggestions.map(({ icon: Icon, label, run }, i) => (
              <button key={i} type="button" onClick={() => onSuggestion({ icon: Icon, label, run })}
                className={cn('flex w-full items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5 text-left ty-body-sm transition-colors hover:bg-accent hover:text-accent-foreground', focusRing)}>
                <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-md', toneBadge.secondary)}><Icon className="size-4" /></span>
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3" aria-label="Conversa" aria-live="polite">
          <h3 className="ty-overline text-muted-foreground">Conversa</h3>
          {msgs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center text-muted-foreground"><Bot className="size-6" aria-hidden /><p className="max-w-48 ty-body-sm">Use uma sugestão acima ou escreva uma mensagem.</p></div>
          ) : (
            msgs.map((m) => (
              <div key={m.id} className={cn('flex items-start gap-2', m.role === 'user' && 'flex-row-reverse')}>
                {m.role === 'assistant'
                  ? <Avatar className="size-7"><AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">C</AvatarFallback></Avatar>
                  : <Avatar className="size-7"><AvatarFallback className="bg-muted text-muted-foreground"><UserRound className="size-3.5" /></AvatarFallback></Avatar>}
                <div className={cn('min-w-0', m.role === 'user' && 'flex flex-col items-end')}>
                  <div className={cn('w-fit max-w-64 rounded-2xl px-3 py-2 ty-body-sm', m.role === 'user' ? 'rounded-tr-sm bg-primary text-primary-foreground' : 'rounded-tl-sm bg-muted text-foreground')}>{m.text}</div>
                  <span className="mt-1 ty-caption text-muted-foreground">{formatAgo(m.at)}</span>
                </div>
              </div>
            ))
          )}
        </section>
      </div>

      <div className="border-t border-border/40 p-3">
        <div className="rounded-xl bg-muted/50 p-2 transition-colors focus-within:bg-background focus-within:ring-[3px] focus-within:ring-ring/50">
          <Label htmlFor="charlie-input" className="sr-only">Mensagem para o Charlie</Label>
          <Textarea id="charlie-input" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }} placeholder="Descreva a vaga ou pergunte…" className="min-h-10 resize-none border-0 bg-transparent p-1 shadow-none focus-visible:ring-0" />
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" aria-label="Anexar arquivo" onClick={() => toast.info('Anexar (demo).')}><Paperclip /></Button>
              <Button variant="ghost" size="icon" aria-label="Ditar por voz" onClick={() => toast.info('Voz (demo).')}><Mic /></Button>
            </div>
            <div className="flex items-center gap-2">
              {msgs.length > 0 && <Button variant="ghost" onClick={onClear}>Limpar</Button>}
              <Button onClick={submit} disabled={!draft.trim()}>Enviar <ArrowRight /></Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  // `< lg`: MODAL de tela cheia → Radix Dialog (foco PRESO + restaurado ao gatilho, scroll-lock,
  // aria-modal, fundo inerte, Esc). É o que fecha o gap de acessibilidade do overlay.
  if (overlay) {
    return (
      <DialogPrimitive.Root open={open} onOpenChange={(o) => { if (!o) onClose() }}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Content
            onCloseAutoFocus={(e) => { e.preventDefault(); document.querySelector<HTMLElement>('[aria-label="Falar com Charlie"]')?.focus() }}
            className="fixed inset-0 z-50 flex h-dvh w-full flex-col bg-card outline-none motion-safe:duration-200 motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:slide-in-from-right motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:slide-out-to-right"
          >
            <DialogPrimitive.Title className="sr-only">Charlie — copiloto</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">Sugestões e conversa para ajudar a montar a vaga.</DialogPrimitive.Description>
            {content}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    )
  }

  // `lg+`: painel lateral NÃO-modal (de propósito — dá p/ editar o form com o Charlie aberto ao lado).
  return (
    <aside aria-label="Copiloto Charlie" className="relative z-50 flex h-dvh w-[300px] shrink-0 flex-col border-l border-border/40 bg-card shadow-panel-r motion-safe:duration-200 motion-safe:animate-in motion-safe:slide-in-from-right">
      {content}
    </aside>
  )
}

/* ────────────────────────────── página ────────────────────────────── */

export function JobGenerator({ onNavigate, brand, mode, onCycleBrand, onToggleMode }: {
  onNavigate?: (v: string) => void; brand?: string; mode?: string; onCycleBrand?: () => void; onToggleMode?: () => void
} = {}) {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<Briefing>(BRIEFING_INICIAL)
  const [perfil, setPerfil] = useState<Perfil>(PERFIL_INICIAL)
  const [desc, setDesc] = useState<GeneratedDesc | null>(null)
  const [gerando, setGerando] = useState(false)
  const [tom, setTom] = useState<Tom>('Equilibrado')
  const [publish, setPublish] = useState<Publish>(PUBLISH_INICIAL)
  const [leftExpanded, setLeftExpanded] = useState(true)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [charlieOpen, setCharlieOpen] = useState(false)
  const isMobile = useIsMobile()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [publishOpen, setPublishOpen] = useState(false)
  // Validação SOFT por etapa: quando o usuário tenta avançar com obrigatórios em branco, ligamos o
  // destaque desta etapa (não trava — ver `avancar`). Some sozinho conforme preenche (é reativo).
  const [showErrors, setShowErrors] = useState<Record<number, boolean>>({})

  const set: SetBriefing = (k, v) => setData((d) => ({ ...d, [k]: v }))
  const setPerf: SetPerfil = (k, v) => setPerfil((p) => ({ ...p, [k]: v }))
  const setPub: SetPublish = (k, v) => setPublish((p) => ({ ...p, [k]: v }))

  // "Gerar com IA" (demo): sintetiza a descrição do briefing + perfil após um pequeno atraso.
  const gerar = () => {
    setGerando(true)
    window.setTimeout(() => { setDesc(buildDesc(data, perfil, tom)); setGerando(false); toast.success('Descrição gerada (demo).') }, 1400)
  }
  // Trocar o tom reescreve na hora (sem novo "loading") quando já existe descrição.
  const onTom = (t: Tom) => { setTom(t); if (desc) setDesc(buildDesc(data, perfil, t)) }
  const voltar = () => setStep((s) => Math.max(1, s - 1))
  // Cancelar a criação só executa após a confirmação na modal (zera tudo e volta ao começo).
  const resetAll = () => { setData(BRIEFING_INICIAL); setPerfil(PERFIL_INICIAL); setDesc(null); setPublish(PUBLISH_INICIAL); setStep(1); toast.info('Criação cancelada (demo).') }

  // mutuamente exclusivos: expandir o menu fecha o Charlie; abrir o Charlie recolhe o menu.
  const setLeft = (v: boolean) => { setLeftExpanded(v); if (v) setCharlieOpen(false) }
  // hambúrguer: `< md` abre/fecha o DRAWER overlay; `≥ md` recolhe/expande a largura do menu fixo.
  const toggleMenu = () => {
    if (isMobile) { setMobileNavOpen((o) => !o); setCharlieOpen(false) }
    else setLeft(!leftExpanded)
  }
  // `open` do drawer é DERIVADO (isMobile && …): no desktop fica false sozinho — sem effect que sincronize
  // estado (evita render em cascata) e sem Radix prendendo foco num overlay invisível.
  const navOpen = isMobile && mobileNavOpen
  const openCharlie = () => {
    setCharlieOpen(true); setLeftExpanded(false); setMobileNavOpen(false)
    if (msgs.length === 0) {
      const t = Date.now()
      setMsgs([{ id: t, role: 'assistant', at: t, text: `Oi! Sou o Charlie. Vi que marcou ${data.nivel} e ${data.modelo} em ${data.local}.${data.budget ? '' : ' O budget ainda está em branco — quer uma faixa de mercado?'}` }])
    }
  }
  const toggleCharlie = () => (charlieOpen ? setCharlieOpen(false) : openCharlie())

  const pushPair = (userText: string, assistantText: string) => {
    const t = Date.now()
    setMsgs((m) => [...m, { id: t, role: 'user', text: userText, at: t }, { id: t + 1, role: 'assistant', text: assistantText, at: t }])
  }
  const onSend = (text: string) => pushPair(text, 'Recebido! Nesta demo eu não preencho de verdade, mas é aqui que eu distribuiria o que reconhecesse nos campos.')
  const onSuggestion = (s: Suggestion) => pushPair(s.label, s.run({ data, set, perfil, setPerfil: setPerf, gerar }))

  // etapa "completa" = todos os obrigatórios preenchidos (3 = descrição gerada).
  const stepComplete = (n: number) =>
    n === 1 ? requiredBriefingOk(data)
    : n === 2 ? requiredPerfilOk(perfil)
    : n === 3 ? !!desc
    : publish.canais.length > 0 && isFilledVal(publish.visibilidade) && isFilledVal(publish.prazo)
  const countMissing = (n: number) =>
    n === 1 ? SECTIONS.flatMap((s) => s.fields).filter((k) => !isFilledVal(data[k])).length
    : n === 2 ? PERFIL_SECTIONS.flatMap((s) => s.fields).filter((k) => !isFilledVal(perfil[k])).length
    : n === 4 ? [isFilledVal(publish.visibilidade), isFilledVal(publish.prazo), publish.canais.length > 0].filter((ok) => !ok).length
    : 0
  // Rola/foca o 1º campo destacado (qualquer controle com aria-invalid), após o render do destaque.
  const focusFirstInvalid = () => window.setTimeout(() => {
    const el = document.querySelector<HTMLElement>('[aria-invalid="true"],[data-invalid]')
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus?.() }
  }, 0)

  // Validação SOFT: ao tentar avançar com obrigatórios em branco, DESTACA + avisa (com ação "avançar
  // assim mesmo") + foca o 1º, mas NÃO trava — um 2º clique (ou a ação do aviso) prossegue.
  const avancar = () => {
    if (step >= STEPS.length) {
      if (!desc) { toast.error('Gere a descrição na etapa 3 antes de publicar.'); setStep(3); return }
      if (!stepComplete(4) && !showErrors[4]) {
        setShowErrors((p) => ({ ...p, 4: true }))
        toast.warning(`${countMissing(4)} campo(s) de publicação em branco — destaquei em vermelho.`, {
          action: { label: 'Publicar assim mesmo', onClick: () => setPublishOpen(true) },
        })
        focusFirstInvalid()
        return
      }
      setPublishOpen(true)
      return
    }
    if ((step === 1 || step === 2) && !stepComplete(step) && !showErrors[step]) {
      setShowErrors((p) => ({ ...p, [step]: true }))
      toast.warning(`${countMissing(step)} campo(s) obrigatório(s) em branco — destaquei em vermelho.`, {
        description: 'Você pode preencher agora ou avançar assim mesmo.',
        action: { label: 'Avançar assim mesmo', onClick: () => setStep((s) => s + 1) },
      })
      focusFirstInvalid()
      return
    }
    setStep((s) => s + 1)
  }
  const nextLabel = step >= STEPS.length ? 'Publicar vaga' : `Avançar para ${STEPS[step].eyebrow.toLowerCase()}`

  return (
    <div className="ty-scale-16 flex h-dvh overflow-hidden bg-muted/40 text-foreground">
      <Sidebar expanded={leftExpanded} onNavigate={onNavigate} />
      <MobileNav open={navOpen} onOpenChange={setMobileNavOpen} onNavigate={onNavigate} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TopBar onToggleMenu={toggleMenu} menuExpanded={isMobile ? mobileNavOpen : leftExpanded} isMobile={isMobile} onCharlie={toggleCharlie} charlieOpen={charlieOpen} onLogout={() => onNavigate?.('login')} brand={brand} mode={mode} onCycleBrand={onCycleBrand} onToggleMode={onToggleMode} />

        {/* relative: ancora os filhos `sr-only` (position:absolute) AQUI, senão eles escapam p/ o <html>
            e esticam o documento (espaço em branco rolável abaixo do app). */}
        <main className="relative min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl space-y-7 px-5 py-8 lg:px-8">
            <header className="space-y-3">
              <p className="ty-overline text-muted-foreground">Etapa {String(step).padStart(2, '0')} — {STEPS[step - 1].eyebrow}</p>
              <h1 className="font-heading text-3xl font-bold tracking-tight">Nova vaga</h1>
              <p className="max-w-2xl ty-body text-muted-foreground">Estruture o briefing com calma. Quando precisar, abra o Charlie — ele dá sugestões e refina os campos com você.</p>
            </header>

            <Separator />

            <Stepper step={step} onPick={setStep} complete={stepComplete} />

            {step === 1 && <BriefingForm data={data} set={set} showErrors={!!showErrors[1]} />}
            {step === 2 && <PerfilForm perfil={perfil} set={setPerf} showErrors={!!showErrors[2]} />}
            {step === 3 && <PreviewStep data={data} perfil={perfil} desc={desc} gerando={gerando} tom={tom} onTom={onTom} onGerar={gerar} />}
            {step === 4 && <PublishStep data={data} perfil={perfil} desc={desc} publish={publish} set={setPub} onGoto={setStep} showErrors={!!showErrors[4]} />}
          </div>
        </main>

        {/* rodapé de ações */}
        <footer className="border-t border-border/40 bg-card/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl flex-col gap-2.5 px-5 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 lg:px-8">
            <div className="flex items-center gap-2">
              <ConfirmDialog
                trigger={<Button variant="destructive-outline" className="max-sm:flex-1"><X /> Cancelar criação</Button>}
                icon={AlertTriangle} tone="destructive"
                title="Cancelar criação de vaga?"
                description="Você está prestes a cancelar a criação desta vaga. Todo o progresso será perdido e não poderá ser recuperado."
                cancelLabel="Continuar editando" confirmLabel="Sim, cancelar" confirmVariant="destructive" onConfirm={resetAll}
              />
              <ConfirmDialog
                trigger={<Button variant="ghost" className="bg-secondary/10 text-secondary-text hover:bg-secondary/15 hover:text-secondary-text max-sm:flex-1"><Save /> Salvar rascunho</Button>}
                icon={Save} tone="secondary"
                title="Salvar como rascunho?"
                description="As informações preenchidas ficam guardadas para você retomar a criação desta vaga quando quiser."
                cancelLabel="Voltar" confirmLabel="Salvar rascunho" confirmVariant="secondary" onConfirm={() => toast.success('Rascunho salvo (demo).')}
              />
            </div>
            <div className="flex items-center gap-2">
              {step > 1 && <Button variant="ghost" onClick={voltar} className="max-sm:flex-1"><ChevronLeft /> Voltar</Button>}
              <Button onClick={avancar} className="max-sm:flex-1">{nextLabel} {step >= STEPS.length ? <Rocket /> : <ArrowRight />}</Button>
            </div>
          </div>
        </footer>

        {/* Confirmação de publicação (controlada — abre pelo botão primário na última etapa). */}
        <ConfirmDialog
          open={publishOpen} onOpenChange={setPublishOpen}
          icon={Rocket} tone="primary"
          title="Publicar esta vaga?"
          description="A vaga ficará visível nos canais selecionados e passará a receber candidaturas."
          cancelLabel="Revisar antes" confirmLabel="Publicar vaga" confirmVariant="default" onConfirm={() => toast.success('Vaga publicada! (demo)')}
        />
      </div>

      <CharlieRail open={charlieOpen} onClose={() => setCharlieOpen(false)} step={step} msgs={msgs} onSuggestion={onSuggestion} onSend={onSend} onClear={() => setMsgs([])} />
    </div>
  )
}
