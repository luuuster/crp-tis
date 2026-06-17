import { describe, expect, it } from 'vitest'

import { iniciais } from './format'
import { AVATAR_TINTS, tintFor } from './avatar'

describe('iniciais', () => {
  it('duas palavras → 2 iniciais maiúsculas', () => {
    expect(iniciais('Mariana Lopes')).toBe('ML')
  })
  it('uma palavra → 1 inicial', () => {
    expect(iniciais('ana')).toBe('A')
  })
  it('usa só as 2 primeiras palavras', () => {
    expect(iniciais('João da Silva Souza')).toBe('JD')
  })
  it('sempre em maiúsculas', () => {
    expect(iniciais('rafael tavares')).toBe('RT')
  })
  it('nunca passa de 2 caracteres', () => {
    for (const n of ['ana', 'Mariana Lopes', 'a b c d e']) expect(iniciais(n).length).toBeLessThanOrEqual(2)
  })
})

describe('tintFor', () => {
  it('escolhe uma tintura do conjunto AVATAR_TINTS', () => {
    expect(AVATAR_TINTS).toContain(tintFor('Mariana Lopes'))
  })
  it('é estável por nome (mesmo nome → mesma cor)', () => {
    expect(tintFor('João Pereira')).toBe(tintFor('João Pereira'))
  })
})
