import { useEffect, useState } from 'react'

export type Brand = 'crp' | 'marca-b'
export type Mode = 'light' | 'dark'

// Lê do localStorage com guarda (valida contra a lista de valores aceitos) e tolera storage indisponível.
export function readStored<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const v = localStorage.getItem(key) as T | null
    return v && allowed.includes(v) ? v : fallback
  } catch {
    return fallback
  }
}

/**
 * Estado de MARCA + TEMA, compartilhado pelos dois apps da plataforma (recrutador :5173 e candidato :5172).
 * Aplica `.dark` + `[data-brand]` no `<html>` — os tokens do CRP (importados no main) fazem o resto, sem
 * cor escrita à mão — e persiste em localStorage. Obs.: localStorage é por ORIGEM, então cada porta lembra
 * a sua preferência (não sincronizam entre si — esperado, são origens diferentes no dev).
 */
export function useBrandMode() {
  const [brand, setBrand] = useState<Brand>(() => readStored('crp.brand', ['crp', 'marca-b'], 'crp'))
  const [mode, setMode] = useState<Mode>(() => readStored('crp.mode', ['light', 'dark'], 'light'))

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', mode === 'dark')
    if (brand === 'marca-b') root.setAttribute('data-brand', 'marca-b')
    else root.removeAttribute('data-brand')
  }, [brand, mode])

  useEffect(() => {
    try {
      localStorage.setItem('crp.brand', brand)
      localStorage.setItem('crp.mode', mode)
    } catch {
      /* storage indisponível (modo privado/quota) — segue sem persistir */
    }
  }, [brand, mode])

  const cycleBrand = () => setBrand((b) => (b === 'crp' ? 'marca-b' : 'crp'))
  const toggleMode = () => setMode((m) => (m === 'dark' ? 'light' : 'dark'))

  return { brand, setBrand, mode, setMode, cycleBrand, toggleMode }
}
