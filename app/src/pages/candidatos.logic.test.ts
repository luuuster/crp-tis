import { describe, expect, it } from 'vitest'

import { areaInfo, charlieRank, pick, pickN, senioridadeScore, type Candidato } from './candidatos.logic'

// Fixture mínima de Candidato conforme o tipo (id/nome/email/vaga/senioridade/etapa/score/atualizado).
const cand = (over: Partial<Candidato> = {}): Candidato => ({
  id: '1',
  nome: 'Fulano de Tal',
  email: 'fulano@email.com',
  vaga: 'Desenvolvedor Backend',
  senioridade: 'Pleno',
  etapa: 'Triagem',
  score: 80,
  atualizado: 'ontem',
  ...over,
})

describe('pick', () => {
  it('índice circular: pick(4) com len 3 → wrap para o índice 1', () => {
    expect(pick(['a', 'b', 'c'], 4)).toBe('b')
  })
  it('wrap exato em múltiplo do tamanho (3 → índice 0)', () => {
    expect(pick(['a', 'b', 'c'], 3)).toBe('a')
  })
  it('índice 0 → primeiro item', () => {
    expect(pick(['a', 'b', 'c'], 0)).toBe('a')
  })
})

describe('pickN', () => {
  it('seed + n com wrap: pickN(2, 2) → ["c","a"]', () => {
    expect(pickN(['a', 'b', 'c'], 2, 2)).toEqual(['c', 'a'])
  })
  it('clampa n ao tamanho do array', () => {
    expect(pickN(['a', 'b', 'c'], 0, 5)).toEqual(['a', 'b', 'c'])
  })
  it('n = 0 → lista vazia', () => {
    expect(pickN(['a', 'b', 'c'], 1, 0)).toEqual([])
  })
})

describe('areaInfo', () => {
  it('Desenvolvedor Backend → cargoBase "Desenvolvedor(a) Backend"', () => {
    expect(areaInfo('Desenvolvedor Backend').cargoBase).toBe('Desenvolvedor(a) Backend')
  })
  it('BUG LATENTE CONHECIDO: "Tech Lead Frontend" cai no ramo "front" → Frontend (NÃO Tech Lead)', () => {
    // "front" é testado antes de "tech lead"; documenta o comportamento ATUAL (não o desejado).
    expect(areaInfo('Tech Lead Frontend').cargoBase).toBe('Desenvolvedor(a) Frontend')
  })
  it('cargo inexistente → fallback cargoBase "Profissional"', () => {
    expect(areaInfo('Vaga Inexistente XYZ').cargoBase).toBe('Profissional')
  })
  it('é case-insensitive', () => {
    expect(areaInfo('desenvolvedor BACKEND').cargoBase).toBe('Desenvolvedor(a) Backend')
  })
})

describe('senioridadeScore', () => {
  it('alvo "Qualquer" → 0.7 (neutro)', () => {
    expect(senioridadeScore('Qualquer', 'Júnior')).toBe(0.7)
  })
  it('alvo === candidato → 1', () => {
    expect(senioridadeScore('Pleno', 'Pleno')).toBe(1)
  })
  it('distância 0.5 → 0.75', () => {
    expect(senioridadeScore('Pleno', 'Pleno/Sênior')).toBe(0.75)
  })
  it('distância 1 → 0.5', () => {
    expect(senioridadeScore('Pleno', 'Sênior')).toBe(0.5)
  })
  it('distância 2 → 0.25', () => {
    expect(senioridadeScore('Júnior', 'Sênior')).toBe(0.25)
  })
})

describe('charlieRank', () => {
  it('ordena desc por pct', () => {
    const cands = [
      cand({ id: 'a', nome: 'A', vaga: 'Analista de Marketing', senioridade: 'Júnior', score: 30 }),
      cand({ id: 'b', nome: 'B', vaga: 'Desenvolvedor Backend', senioridade: 'Pleno', score: 95 }),
      cand({ id: 'c', nome: 'C', vaga: 'Desenvolvedor Backend', senioridade: 'Júnior', score: 50 }),
    ]
    const out = charlieRank('Desenvolvedor Backend', 'Pleno', '', cands)
    const pcts = out.map((m) => m.pct)
    expect(pcts).toEqual([...pcts].sort((x, y) => y - x))
  })
  it('pct sempre dentro de [8, 99]', () => {
    const cands = [
      cand({ id: 'a', nome: 'A', vaga: 'Desenvolvedor Backend', senioridade: 'Pleno', score: 100 }),
      cand({ id: 'b', nome: 'B', vaga: 'Analista de Marketing', senioridade: 'Júnior', score: 0 }),
    ]
    const out = charlieRank('Desenvolvedor Backend', 'Pleno', 'node.js python java api rest desenvolvedor(a) backend', cands)
    for (const m of out) {
      expect(m.pct).toBeGreaterThanOrEqual(8)
      expect(m.pct).toBeLessThanOrEqual(99)
    }
  })
  it('é determinístico (mesma entrada → mesma saída)', () => {
    const cands = [
      cand({ id: 'a', nome: 'A', vaga: 'Desenvolvedor Backend', senioridade: 'Pleno', score: 80 }),
      cand({ id: 'b', nome: 'B', vaga: 'Product Manager', senioridade: 'Sênior', score: 70 }),
    ]
    const a = charlieRank('Desenvolvedor Backend', 'Pleno', 'react', cands)
    const b = charlieRank('Desenvolvedor Backend', 'Pleno', 'react', cands)
    expect(a).toEqual(b)
  })
  it('candidato de outra área → motivo começa com "Perfil de outra área"', () => {
    const cands = [cand({ id: 'a', nome: 'A', vaga: 'Analista de Marketing', senioridade: 'Pleno', score: 60 })]
    const out = charlieRank('Desenvolvedor Backend', 'Pleno', '', cands)
    expect(out[0].motivo.startsWith('Perfil de outra área')).toBe(true)
  })
  it('ctx vazio não soma bônus (pct igual ao de ctx só com texto irrelevante)', () => {
    const cands = [cand({ id: 'a', nome: 'A', vaga: 'Desenvolvedor Backend', senioridade: 'Pleno', score: 80 })]
    const semCtx = charlieRank('Desenvolvedor Backend', 'Pleno', '', cands)[0].pct
    const ctxIrrelevante = charlieRank('Desenvolvedor Backend', 'Pleno', 'zzz nada a ver', cands)[0].pct
    expect(semCtx).toBe(ctxIrrelevante)
  })
})
