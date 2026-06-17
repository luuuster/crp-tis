import { describe, expect, it, vi } from 'vitest'

import { paginar, withReset } from './usePagination'

const seq = (n: number) => Array.from({ length: n }, (_, i) => i + 1)

describe('paginar', () => {
  it('1ª página de 25 itens (perPage 10)', () => {
    const r = paginar(seq(25), 10, 1)
    expect(r).toMatchObject({ page: 1, total: 3, inicio: 0, totalItems: 25 })
    expect(r.pageItems).toEqual(seq(10))
  })
  it('última página parcial', () => {
    const r = paginar(seq(25), 10, 3)
    expect(r.inicio).toBe(20)
    expect(r.pageItems).toEqual([21, 22, 23, 24, 25])
  })
  it('saneia página acima do total', () => {
    expect(paginar(seq(25), 10, 99).page).toBe(3)
  })
  it('saneia página abaixo de 1', () => {
    expect(paginar(seq(25), 10, 0).page).toBe(1)
  })
  it('lista vazia → 1 página, sem itens', () => {
    const r = paginar([], 10, 1)
    expect(r).toMatchObject({ page: 1, total: 1, inicio: 0, totalItems: 0 })
    expect(r.pageItems).toEqual([])
  })
  it('lista menor que perPage → 1 página com tudo', () => {
    expect(paginar(seq(5), 10, 1).pageItems).toEqual(seq(5))
  })
})

describe('withReset', () => {
  it('aplica o set do filtro e volta para a página 1', () => {
    const set = vi.fn()
    const setPage = vi.fn()
    withReset(set, setPage)('Aberta')
    expect(set).toHaveBeenCalledWith('Aberta')
    expect(setPage).toHaveBeenCalledWith(1)
  })
})
