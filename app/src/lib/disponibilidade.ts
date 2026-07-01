/**
 * Disponibilidade informada pelo CANDIDATO (dias da semana + períodos) — o insumo do auto-agendamento.
 * Compartilhado entre a tela pública do candidato (que COLETA a disponibilidade e a cruza com a agenda da
 * equipe) e o formulário de reagendamento do RH (que a LÊ como dica para remarcar respeitando o candidato).
 *
 * MOCK, sem backend: `disponibilidadeDe` deriva a disponibilidade de forma DETERMINÍSTICA por candidato
 * (via hashNum) — o mesmo padrão do free/busy do Teams em entrevistas.logic. No produto, viria do que o
 * candidato de fato escolheu na conversa (e ficaria persistido no processo dele).
 */
import { hashNum } from '@/lib/hash'
import { WORK_SLOTS, slotLivre } from '@/pages/entrevistas.logic'

// Período do dia. A manhã vai das 09:00 às 12:00 e a tarde das 13:00 às 17:00 — as FAIXAS que o candidato
// vê nos cartões e os slots (WORK_SLOTS) de fato ofertados em cada uma. `fim` é a hora-limite exibida (o
// último slot começa antes: 11:00 na manhã, 17:00 na tarde).
export type Periodo = 'manha' | 'tarde'
export const PERIODOS: Periodo[] = ['manha', 'tarde']
export const FAIXA_PERIODO: Record<Periodo, { inicio: string; fim: string }> = {
  manha: { inicio: '09:00', fim: '12:00' },
  tarde: { inicio: '13:00', fim: '17:00' },
}
export const SLOTS_PERIODO: Record<Periodo, string[]> = {
  manha: WORK_SLOTS.filter((s) => s >= '09:00' && s < '12:00'),
  tarde: WORK_SLOTS.filter((s) => s >= '13:00'),
}

const isoDe = (dt: Date) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`

// Uma data concreta do calendário (dia útil) que o candidato pode escolher.
export type DiaDisponivel = { iso: string; y: number; m: number; d: number; dia: number }

/** Próximos `n` dias ÚTEIS (seg–sex) a partir de `base` (exclusiva) — as datas concretas oferecidas ao candidato. */
export function proximosDiasUteis(base: Date, n = 10): DiaDisponivel[] {
  const out: DiaDisponivel[] = []
  const y0 = base.getFullYear()
  const m0 = base.getMonth()
  const d0 = base.getDate()
  for (let i = 1; out.length < n && i <= 60; i++) {
    const dt = new Date(y0, m0, d0 + i)
    const dia = dt.getDay()
    if (dia === 0 || dia === 6) continue // pula fim de semana
    out.push({ iso: isoDe(dt), y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate(), dia })
  }
  return out
}

// Disponibilidade que um candidato informou no auto-agendamento: datas concretas + períodos.
export type DispCandidato = { datas: DiaDisponivel[]; periodos: Periodo[] }

/**
 * Disponibilidade (mock determinístico) informada por um candidato — 2 a 3 DATAS concretas (dos próximos
 * dias úteis) + 1 a 2 períodos. É o que o RH lê no reagendamento para remarcar respeitando o candidato.
 */
export function disponibilidadeDe(cand: string): DispCandidato {
  const h = hashNum(cand)
  const opcoes = proximosDiasUteis(new Date(), 10)
  const nDatas = Math.min(2 + (h % 2), opcoes.length) // 2 ou 3 datas
  const datas: DiaDisponivel[] = []
  for (let i = 0; datas.length < nDatas && i < opcoes.length; i++) {
    const opt = opcoes[(h + i * 3) % opcoes.length]
    if (!datas.some((x) => x.iso === opt.iso)) datas.push(opt)
  }
  datas.sort((a, b) => a.iso.localeCompare(b.iso))
  const periodos: Periodo[] = h % 3 === 0 ? ['manha', 'tarde'] : h % 2 === 0 ? ['manha'] : ['tarde']
  return { datas, periodos }
}

export type SlotCruzado = { iso: string; y: number; m: number; d: number; dia: number; hora: string }

/**
 * Cruza as DATAS escolhidas pelo candidato com a agenda (free/busy) dos entrevistadores → horários CONCRETOS.
 * Para cada data, dentro dos períodos escolhidos, mantém os slots livres para TODOS os entrevistadores.
 * Para em `max` horários (ordem cronológica: as datas já vêm ordenadas).
 */
export function horariosEmDatas(dias: DiaDisponivel[], periodos: Periodo[], entrevistadores: string[], max = 8): SlotCruzado[] {
  const out: SlotCruzado[] = []
  const slots = periodos.flatMap((p) => SLOTS_PERIODO[p]).sort()
  for (const d of dias) {
    for (const hora of slots) {
      if (out.length >= max) break
      if (slotLivre(entrevistadores, d.iso, hora)) out.push({ iso: d.iso, y: d.y, m: d.m, d: d.d, dia: d.dia, hora })
    }
    if (out.length >= max) break
  }
  return out
}
