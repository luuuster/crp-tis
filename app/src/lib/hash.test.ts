import { describe, expect, it } from 'vitest'

import { hashNum } from './hash'

describe('hashNum', () => {
  it('é determinístico (mesma string → mesmo número)', () => {
    expect(hashNum('Mariana Lopes')).toBe(hashNum('Mariana Lopes'))
  })
  it('string vazia → 0', () => {
    expect(hashNum('')).toBe(0)
  })
  it('âncoras da fórmula base-31 (trava regressão)', () => {
    expect(hashNum('A')).toBe(65)
    expect(hashNum('AB')).toBe(65 * 31 + 66)
  })
  it('é sensível à ordem dos caracteres', () => {
    expect(hashNum('AB')).not.toBe(hashNum('BA'))
  })
  it('é sempre inteiro não-negativo (uint32)', () => {
    for (const s of ['', 'a', 'João Pereira', 'Çãáéí', 'x'.repeat(300), '🚀 teams']) {
      expect(hashNum(s)).toBeGreaterThanOrEqual(0)
      expect(Number.isInteger(hashNum(s))).toBe(true)
    }
  })
  it('não colide nos nomes do mock', () => {
    const nomes = ['Mariana Lopes', 'João Pereira', 'Ana Souza', 'Bruno Lima', 'Helena Castro', 'Paula Dias']
    expect(new Set(nomes.map(hashNum)).size).toBe(nomes.length)
  })
})
