import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import i18n from '@/i18n'
import { dataLonga, mesAbrev, mesLongo, semanaCurta } from './datetime'

// Garante que, em pt-BR (idioma padrão), a saída é IDÊNTICA aos arrays que estes helpers substituíram —
// senão a UI pt-BR (e os testes que dependem dela) mudariam. E confere que en/es realmente localizam.
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

describe('datetime (pt-BR idêntico ao legado)', () => {
  beforeAll(async () => { await i18n.changeLanguage('pt-BR') })
  afterAll(async () => { await i18n.changeLanguage('pt-BR') })

  it('mesLongo bate com o array MESES', () => {
    for (let m = 0; m < 12; m++) expect(mesLongo(m)).toBe(MESES[m])
  })

  it('mesAbrev bate com MESES.slice(0,3)', () => {
    for (let m = 0; m < 12; m++) expect(mesAbrev(m)).toBe(MESES[m].slice(0, 3))
  })

  it('semanaCurta bate com o array SEMANA (segunda→domingo)', () => {
    expect(semanaCurta()).toEqual(SEMANA)
  })

  it('dataLonga bate com o formato "dia-da-semana, D de mês de AAAA"', () => {
    expect(dataLonga(2026, 5, 16)).toBe('terça-feira, 16 de junho de 2026')
  })
})

describe('datetime (localiza en/es)', () => {
  afterAll(async () => { await i18n.changeLanguage('pt-BR') })

  it('mesLongo muda por idioma', async () => {
    await i18n.changeLanguage('en')
    expect(mesLongo(5)).toBe('June')
    await i18n.changeLanguage('es')
    expect(mesLongo(5)).toBe('Junio')
  })
})
