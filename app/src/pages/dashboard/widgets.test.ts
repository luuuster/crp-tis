import { describe, expect, it } from 'vitest'
import { DEFAULT_LAYOUT, WIDGETS, WIDGET_LIST } from './widgets'

const EXTRAS = ['origem-candidatos', 'tempo-por-etapa', 'proximas-entrevistas', 'taxa-aceitacao']

describe('catálogo de widgets do Dashboard', () => {
  it('o catálogo é maior que o layout padrão (o "Adicionar widget" nunca nasce vazio)', () => {
    expect(WIDGET_LIST.length).toBeGreaterThan(DEFAULT_LAYOUT.length)
  })

  it('todo id do layout padrão existe no registry', () => {
    for (const item of DEFAULT_LAYOUT) expect(WIDGETS[item.id]).toBeTruthy()
  })

  it('ids do catálogo são únicos', () => {
    const ids = WIDGET_LIST.map((w) => w.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('os 4 extras existem no catálogo e ficam FORA do layout padrão', () => {
    const defaultIds = new Set(DEFAULT_LAYOUT.map((i) => i.id))
    for (const id of EXTRAS) {
      expect(WIDGETS[id]).toBeTruthy()
      expect(defaultIds.has(id)).toBe(false)
    }
  })
})
