/**
 * Candidaturas do candidato logado (MOCK, sem backend) — as vagas a que ele já se candidatou e em que
 * ETAPA do funil cada uma está. Espelha o funil do recrutador (5 fases: IA → RH → Teste → Gestor →
 * Proposta — ver pipeline.json) e referencia vagas REAIS do catálogo por id (fonte única @/lib/vagasCatalogo).
 */
import { vagaPorId, type VagaPublica } from '@/lib/vagasCatalogo'

// As 5 fases do funil, na ordem. As chaves casam com painel.candidaturas.fase.* (i18n).
export const FASES = ['ia', 'rh', 'teste', 'gestor', 'proposta'] as const
export type Fase = (typeof FASES)[number]

// andamento = em progresso na fase atual · aprovado = passou tudo (proposta/contratado) · reprovado = parou na fase.
export type StatusCandidatura = 'andamento' | 'aprovado' | 'reprovado'

export type Candidatura = {
  id: string
  vagaId: string
  data: string // dd/mm/aaaa em que se candidatou
  faseIndex: number // 0..4 — etapa atual (andamento/reprovado) ou última (aprovado)
  status: StatusCandidatura
}

// MOCK — cobre os 3 estados em fases diferentes do funil, referenciando vagas do catálogo.
export const CANDIDATURAS: Candidatura[] = [
  { id: 'c1', vagaId: '1', data: '21/06/2026', faseIndex: 1, status: 'andamento' }, // Designer UX/UI — em RH
  { id: 'c2', vagaId: '4', data: '18/06/2026', faseIndex: 2, status: 'andamento' }, // Frontend Júnior — em Teste
  { id: 'c3', vagaId: '2', data: '20/06/2026', faseIndex: 0, status: 'andamento' }, // Backend Sênior — triagem por IA
  { id: 'c4', vagaId: '5', data: '10/06/2026', faseIndex: 4, status: 'aprovado' },  // Analista de Dados — proposta/contratado
  { id: 'c5', vagaId: '3', data: '12/06/2026', faseIndex: 0, status: 'reprovado' }, // Product Manager — não avançou
  // +10 não selecionadas (vagas variadas do catálogo) p/ exercitar a grade de finalizadas.
  { id: 'c6', vagaId: '6', data: '08/06/2026', faseIndex: 1, status: 'reprovado' },
  { id: 'c7', vagaId: '7', data: '07/06/2026', faseIndex: 0, status: 'reprovado' },
  { id: 'c8', vagaId: '8', data: '05/06/2026', faseIndex: 2, status: 'reprovado' },
  { id: 'c9', vagaId: '9', data: '03/06/2026', faseIndex: 3, status: 'reprovado' },
  { id: 'c10', vagaId: '10', data: '01/06/2026', faseIndex: 0, status: 'reprovado' },
  { id: 'c11', vagaId: '11', data: '29/05/2026', faseIndex: 1, status: 'reprovado' },
  { id: 'c12', vagaId: '12', data: '27/05/2026', faseIndex: 2, status: 'reprovado' },
  { id: 'c13', vagaId: '13', data: '25/05/2026', faseIndex: 3, status: 'reprovado' },
  { id: 'c14', vagaId: '14', data: '23/05/2026', faseIndex: 1, status: 'reprovado' },
  { id: 'c15', vagaId: '15', data: '21/05/2026', faseIndex: 0, status: 'reprovado' },
]

export type CandidaturaComVaga = Candidatura & { vaga: VagaPublica }

/** Resolve cada candidatura para a vaga do catálogo (descarta as que não existem mais). */
export function lerCandidaturas(): CandidaturaComVaga[] {
  return CANDIDATURAS
    .map((c) => { const vaga = vagaPorId(c.vagaId); return vaga ? { ...c, vaga } : null })
    .filter((c): c is CandidaturaComVaga => c !== null)
}

export type EstadoFase = 'feita' | 'atual' | 'pendente' | 'reprovada'

/** Estado de uma fase (índice i) para uma candidatura — dirige cor/ícone/aria do stepper. */
export function estadoDaFase(c: Candidatura, i: number): EstadoFase {
  if (c.status === 'aprovado') return 'feita'
  if (i < c.faseIndex) return 'feita'
  if (i === c.faseIndex) return c.status === 'reprovado' ? 'reprovada' : 'atual'
  return 'pendente'
}
