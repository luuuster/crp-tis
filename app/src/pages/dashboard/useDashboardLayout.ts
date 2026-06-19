/**
 * Estado do layout MODULAR do Dashboard, persistido em localStorage (client-side — coerente com o
 * mockup, sem backend). Lê uma vez na inicialização (lazy init) e grava a cada mutação direto no handler
 * — sem effect/ref, para não bater nas regras do React Compiler. Ids/tamanhos inválidos são descartados
 * (tolerante a layout salvo antigo: um widget removido do catálogo simplesmente some).
 */
import { useState } from 'react'
import { DEFAULT_LAYOUT, WIDGETS, WIDGET_LIST, type LayoutItem, type WidgetDef, type WidgetSize } from './widgets'

const KEY = 'crp-dashboard-layout-v1'
const SIZES: WidgetSize[] = ['sm', 'md', 'lg', 'full']

function load(): LayoutItem[] {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(KEY) : null
    if (raw == null) return DEFAULT_LAYOUT // nunca personalizou → dashboard de fábrica
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return DEFAULT_LAYOUT
    const seen = new Set<string>()
    return parsed.filter((it): it is LayoutItem => {
      if (!it || typeof it !== 'object') return false
      const { id, size } = it as Partial<LayoutItem>
      if (typeof id !== 'string' || !WIDGETS[id] || seen.has(id) || !size || !SIZES.includes(size)) return false
      seen.add(id)
      return true
    })
  } catch {
    return DEFAULT_LAYOUT
  }
}

export function useDashboardLayout() {
  const [items, setItems] = useState<LayoutItem[]>(load)

  const persist = (next: LayoutItem[]) => {
    setItems(next)
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      /* localStorage indisponível (modo privado etc.) — segue só em memória */
    }
  }

  const addWidget = (id: string) => {
    if (!WIDGETS[id] || items.some((i) => i.id === id)) return
    persist([...items, { id, size: WIDGETS[id].defaultSize }])
  }
  const removeWidget = (id: string) => persist(items.filter((i) => i.id !== id))
  const setSize = (id: string, size: WidgetSize) => persist(items.map((i) => (i.id === id ? { ...i, size } : i)))
  const move = (id: string, dir: -1 | 1) => {
    const idx = items.findIndex((i) => i.id === id)
    const j = idx + dir
    if (idx < 0 || j < 0 || j >= items.length) return
    const next = items.slice()
    ;[next[idx], next[j]] = [next[j], next[idx]]
    persist(next)
  }
  const reset = () => persist(DEFAULT_LAYOUT)

  // Widgets ainda NÃO adicionados (alimenta o catálogo "Adicionar widget").
  const available: WidgetDef[] = WIDGET_LIST.filter((w) => !items.some((i) => i.id === w.id))

  return { items, addWidget, removeWidget, setSize, move, reset, available }
}
