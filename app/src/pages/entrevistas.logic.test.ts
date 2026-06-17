import { describe, expect, it } from 'vitest'

import { ENTREVISTADORES, DURACOES, WORK_SLOTS, ocupado, slotLivre, temHorarioLivre, proximaDataLivre, painelDe, duracaoDe, linkDe } from './entrevistas.logic'

describe('ocupado', () => {
  it('é livre (false) quando a data está vazia', () => {
    expect(ocupado('Marina Albuquerque · RH', '', '08:00')).toBe(false)
  })

  it('é determinístico para a mesma chave (entrevistador + data + slot)', () => {
    const a = ocupado('Marina Albuquerque · RH', '2026-06-16', '08:00')
    const b = ocupado('Marina Albuquerque · RH', '2026-06-16', '08:00')
    expect(a).toBe(b)
  })

  it('ancora um valor computado conhecido (Marina · 2026-06-16 · 08:00 → ocupado)', () => {
    expect(ocupado('Marina Albuquerque · RH', '2026-06-16', '08:00')).toBe(true)
  })

  it('ancora um valor livre conhecido (Marina · 2026-06-16 · 09:00 → livre)', () => {
    expect(ocupado('Marina Albuquerque · RH', '2026-06-16', '09:00')).toBe(false)
  })
})

describe('slotLivre (interseção das agendas)', () => {
  it('é false sem data ou sem entrevistadores', () => {
    expect(slotLivre([], '2026-06-16', '09:00')).toBe(false)
    expect(slotLivre(['Marina Albuquerque · RH'], '', '09:00')).toBe(false)
  })

  it('exige TODOS os entrevistadores livres no slot', () => {
    // 08:00: Marina está ocupada (âncora conhecida) → não é livre para o grupo.
    expect(slotLivre(['Marina Albuquerque · RH'], '2026-06-16', '08:00')).toBe(false)
    // 09:00: Marina está livre (âncora conhecida) → livre para o grupo de 1.
    expect(slotLivre(['Marina Albuquerque · RH'], '2026-06-16', '09:00')).toBe(true)
  })
})

describe('temHorarioLivre', () => {
  it('true quando há ao menos um horário em comum', () => {
    expect(temHorarioLivre(['Marina Albuquerque · RH'], '2026-06-16')).toBe(true)
  })

  it('false sem data ou sem entrevistadores', () => {
    expect(temHorarioLivre(['Marina Albuquerque · RH'], '')).toBe(false)
    expect(temHorarioLivre([], '2026-06-16')).toBe(false)
  })

  it('o estado "sem horário" é ALCANÇÁVEL p/ os 4 e é consistente com slotLivre', () => {
    // Existe pelo menos um dia 100% ocupado p/ o painel completo (senão o aviso nunca apareceria).
    let achou = ''
    for (let m = 1; m <= 12 && !achou; m++)
      for (let d = 1; d <= 28 && !achou; d++) {
        const iso = `2026-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        if (!temHorarioLivre(ENTREVISTADORES, iso)) achou = iso
      }
    expect(achou, 'esperava um dia sem horário em comum p/ os 4 entrevistadores em 2026').not.toBe('')
    // Consistência: nesse dia, NENHUM slot pode estar livre p/ todos.
    for (const s of WORK_SLOTS) expect(slotLivre(ENTREVISTADORES, achou, s)).toBe(false)
  })
})

describe('proximaDataLivre', () => {
  it('retorna "" sem data ou sem entrevistadores', () => {
    expect(proximaDataLivre(ENTREVISTADORES, '')).toBe('')
    expect(proximaDataLivre([], '2026-06-16')).toBe('')
  })

  it('a partir de um dia SEM horário, retorna a PRIMEIRA data futura com disponibilidade', () => {
    // acha um dia 100% ocupado p/ os 4 (origem)
    let origem = ''
    for (let m = 1; m <= 12 && !origem; m++)
      for (let d = 1; d <= 28 && !origem; d++) {
        const iso = `2026-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        if (!temHorarioLivre(ENTREVISTADORES, iso)) origem = iso
      }
    expect(origem, 'esperava um dia sem horário em comum em 2026').not.toBe('')

    const prox = proximaDataLivre(ENTREVISTADORES, origem)
    expect(prox).not.toBe('')
    expect(prox > origem).toBe(true) // é futura
    expect(temHorarioLivre(ENTREVISTADORES, prox)).toBe(true) // e TEM disponibilidade

    // e é a PRIMEIRA: nenhum dia entre a origem e `prox` tem horário em comum.
    const [y, mo, d] = origem.split('-').map(Number)
    for (let i = 1; ; i++) {
      const iso = new Date(Date.UTC(y, mo - 1, d + i)).toISOString().slice(0, 10)
      if (iso === prox) break
      expect(temHorarioLivre(ENTREVISTADORES, iso)).toBe(false)
    }
  })
})

describe('painelDe', () => {
  const candidatos = ['Ana Souza', 'João Pereira', 'Marina Alves', 'Caio Rocha', 'Bruno Lima', 'Thiago Barros']

  it('retorna entre 2 e 4 entrevistadores', () => {
    for (const cand of candidatos) {
      const n = painelDe({ cand }).length
      expect(n).toBeGreaterThanOrEqual(2)
      expect(n).toBeLessThanOrEqual(4)
    }
  })

  it('não tem duplicatas', () => {
    for (const cand of candidatos) {
      const p = painelDe({ cand })
      expect(new Set(p).size).toBe(p.length)
    }
  })

  it('todos os nomes pertencem a ENTREVISTADORES', () => {
    for (const cand of candidatos) {
      for (const p of painelDe({ cand })) expect(ENTREVISTADORES).toContain(p)
    }
  })

  it('depende apenas de `cand` (determinístico; ignora outras props)', () => {
    expect(painelDe({ cand: 'Ana Souza' })).toEqual(painelDe({ cand: 'Ana Souza' }))
    expect(painelDe({ cand: 'Ana Souza', d: 1, m: 1 } as { cand: string })).toEqual(painelDe({ cand: 'Ana Souza' }))
  })
})

describe('duracaoDe', () => {
  const candidatos = ['Ana Souza', 'João Pereira', 'Marina Alves', 'Caio Rocha']

  it('sempre retorna um valor de DURACOES', () => {
    for (const cand of candidatos) expect(DURACOES).toContain(duracaoDe({ cand }))
  })

  it('é determinístico por candidato', () => {
    for (const cand of candidatos) expect(duracaoDe({ cand })).toBe(duracaoDe({ cand }))
  })
})

describe('linkDe', () => {
  it('usa o 1º nome em minúsculas + d + (m+1)', () => {
    expect(linkDe({ cand: 'Ana Souza', d: 16, m: 5 })).toBe('meet.tis.app/ana-166')
  })
})
