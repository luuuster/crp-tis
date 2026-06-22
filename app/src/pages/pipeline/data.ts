/**
 * Funil de contratação (board) — modelo + dados mock + lógica PURA (sem JSX/React). É um protótipo:
 * os dados vivem em memória e a interação só move o card de coluna (sem backend).
 *
 * Ideia: TODO o fluxo de seleção numa tela só, em colunas (Kanban). O diferencial é que cada etapa tem
 * um GATE próprio de avanço — não é um "mover" genérico:
 *   - decisao  → Aprovar / Reprovar. A 1ª etapa é a Entrevista por IA, que dá um SCORE de compatibilidade
 *                com a vaga; mesmo com score alto, quem libera é uma pessoa.
 *   - agendar  → primeiro AGENDAR a conversa; só depois Aprovar / Reprovar (ex.: Entrevista RH / gestor).
 *   - teste    → primeiro APLICAR o teste; depois Aprovar / Reprovar (ex.: Teste técnico).
 *   - proposta → ENVIAR a proposta; depois Aceitou (→ Contratado) / Recusou (→ Reprovado).
 *   - final    → terminal (Contratado / Reprovado).
 */
import type { BadgeTone } from '@/components/page'

export type FaseId = 'ia' | 'rh' | 'teste' | 'gestor' | 'proposta' | 'contratado' | 'reprovado'
export type Gate = 'decisao' | 'agendar' | 'teste' | 'proposta' | 'final'

export type Fase = {
  id: FaseId
  /** Cor da coluna — paleta de DADOS/semântica (NUNCA a marca; ver convenção "marca ≠ dado"). */
  tone: BadgeTone
  gate: Gate
  /** Para onde "Aprovar" empurra. Ausente em proposta/contratado/reprovado (tratados à parte). */
  next?: FaseId
  /** Etapa conduzida pela IA (score = compatibilidade do currículo) — muda o visual do card. */
  ia?: boolean
}

// Ordem do funil (esquerda → direita). "reprovado" é o fim.
export const FASES: Fase[] = [
  { id: 'ia', tone: 'blue', gate: 'decisao', next: 'rh', ia: true },
  { id: 'rh', tone: 'teal', gate: 'agendar', next: 'teste' },
  { id: 'teste', tone: 'violet', gate: 'teste', next: 'gestor' },
  { id: 'gestor', tone: 'blue', gate: 'agendar', next: 'proposta' },
  { id: 'proposta', tone: 'warning', gate: 'proposta', next: 'contratado' },
  { id: 'contratado', tone: 'success', gate: 'final' },
  { id: 'reprovado', tone: 'destructive', gate: 'final' },
]
export const FASE = Object.fromEntries(FASES.map((f) => [f.id, f])) as Record<FaseId, Fase>

// Card do board (um candidato no funil). agendamento/aplicado/enviada = sub-estado do gate da fase atual.
export type Card = {
  id: string
  nome: string
  vaga: string
  score: number
  fase: FaseId
  agendamento?: string // "dd/mm/aaaa hh:mm" — gate 'agendar' cumprido
  aplicado?: boolean // gate 'teste' cumprido (teste enviado)
  enviada?: boolean // gate 'proposta' cumprido (proposta enviada)
}

// Seed determinístico (nomes/vagas reaproveitados do banco de talentos), distribuído pelas fases.
export const CARDS_INICIAL: Card[] = [
  { id: 'c1', nome: 'Felipe Santos', vaga: 'Analista de QA', score: 65, fase: 'ia' },
  { id: 'c2', nome: 'Ricardo Nunes', vaga: 'Analista de QA', score: 71, fase: 'ia' },
  { id: 'c3', nome: 'Juliana Reis', vaga: 'Product Manager', score: 73, fase: 'ia' },
  { id: 'c18', nome: 'Letícia Gomes', vaga: 'Cientista de Dados', score: 90, fase: 'ia' },
  { id: 'c4', nome: 'Mariana Lopes', vaga: 'Desenvolvedor Full Stack', score: 91, fase: 'ia' },
  { id: 'c5', nome: 'Carla Mendonça', vaga: 'Engenheiro de Dados', score: 88, fase: 'ia' },
  { id: 'c6', nome: 'Vitor Hugo', vaga: 'DevOps Engineer', score: 79, fase: 'ia' },
  { id: 'c7', nome: 'Jair Carmona', vaga: 'Desenvolvedor Backend', score: 82, fase: 'rh' },
  { id: 'c8', nome: 'Diego Teixeira', vaga: 'Product Manager', score: 68, fase: 'rh', agendamento: '24/06/2026 14:00' },
  { id: 'c9', nome: 'Larissa Castro', vaga: 'Cientista de Dados', score: 84, fase: 'teste' },
  { id: 'c10', nome: 'Sofia Martins', vaga: 'Desenvolvedor Mobile', score: 80, fase: 'teste', aplicado: true },
  { id: 'c11', nome: 'Thiago Barros', vaga: 'Arquiteto de Software', score: 86, fase: 'gestor', agendamento: '25/06/2026 10:30' },
  { id: 'c12', nome: 'Rafael Tavares', vaga: 'DevOps Engineer', score: 77, fase: 'gestor' },
  { id: 'c13', nome: 'Bianca Ferreira', vaga: 'Desenvolvedor Backend', score: 95, fase: 'proposta', enviada: true },
  { id: 'c14', nome: 'Aline Ramos', vaga: 'Tech Lead Frontend', score: 90, fase: 'proposta' },
  { id: 'c15', nome: 'Bruno Lima', vaga: 'Engenheiro de Dados', score: 91, fase: 'contratado' },
  { id: 'c16', nome: 'Gustavo Pereira', vaga: 'Product Manager', score: 58, fase: 'reprovado' },
  { id: 'c17', nome: 'Patrícia Lima', vaga: 'UX Designer III', score: 49, fase: 'reprovado' },
]

// ---------- transições puras (limpam o sub-estado do gate ao trocar de fase) ----------

const semGate = (c: Card): Card => ({ ...c, agendamento: undefined, aplicado: undefined, enviada: undefined })

/** Aprovar → empurra para a próxima fase (no-op se terminal). */
export const aprovar = (c: Card): Card => {
  const f = FASE[c.fase]
  return f.next ? { ...semGate(c), fase: f.next } : c
}
/** Reprovar → coluna "Reprovado". */
export const reprovar = (c: Card): Card => ({ ...semGate(c), fase: 'reprovado' })
/** Proposta aceita → "Contratado". */
export const contratar = (c: Card): Card => ({ ...semGate(c), fase: 'contratado' })

/** Cumpre o gate 'agendar' (registra data/hora). */
export const agendar = (c: Card, quando: string): Card => ({ ...c, agendamento: quando })
/** Cumpre o gate 'teste' (teste enviado). */
export const aplicarTeste = (c: Card): Card => ({ ...c, aplicado: true })
/** Cumpre o gate 'proposta' (proposta enviada). */
export const enviarProposta = (c: Card): Card => ({ ...c, enviada: true })

/** Já cumpriu o gate da fase atual? (decisão fica disponível direto; agendar/teste/proposta exigem o passo 1) */
export const gateCumprido = (c: Card): boolean => {
  const g = FASE[c.fase].gate
  if (g === 'agendar') return !!c.agendamento
  if (g === 'teste') return !!c.aplicado
  if (g === 'proposta') return !!c.enviada
  return g === 'decisao' // 'final' não tem gate de ação
}
