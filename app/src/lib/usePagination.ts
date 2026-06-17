import { useState } from 'react'

/**
 * Paginação reutilizável — o mesmo bloco de cálculo (`total = ceil(n/perPage)` → sanear página → fatiar)
 * estava copiado em 5 telas. `paginar` é o NÚCLEO PURO (testável sem React); `usePagination` só anexa o
 * estado da página atual. A página é saneada internamente: se a lista encolher (filtro), nunca extrapola.
 */
export type Paginacao<T> = {
  page: number
  setPage: (p: number | ((prev: number) => number)) => void
  pageItems: T[]
  total: number // total de PÁGINAS
  inicio: number // offset 0-based do 1º item da página
  totalItems: number // n de itens (para "de N")
}

export function paginar<T>(items: T[], perPage: number, page: number) {
  const total = Math.max(1, Math.ceil(items.length / perPage))
  const pageSafe = Math.min(Math.max(1, page), total)
  const inicio = (pageSafe - 1) * perPage
  return {
    page: pageSafe,
    total,
    inicio,
    totalItems: items.length,
    pageItems: items.slice(inicio, inicio + perPage),
  }
}

export function usePagination<T>(items: T[], perPage: number): Paginacao<T> {
  const [page, setPage] = useState(1)
  return { ...paginar(items, perPage, page), setPage }
}

/** Aplica o set de um filtro E volta para a 1ª página, em um passo (mantém o reset explícito por evento).
 *  Uso: `onValueChange={withReset(setVagaF, setPage)}`. */
export const withReset =
  <V,>(set: (v: V) => void, setPage: (p: number) => void) =>
  (v: V) => {
    set(v)
    setPage(1)
  }
