import { useCallback, useEffect, useRef, useState } from 'react'

import { captureError } from '@/lib/telemetry'

/**
 * Estado de operação assíncrona reutilizável: `{ data, loading, error, run, retry, reset }`. SEM retry
 * automático — `retry()` reexecuta com os últimos argumentos. Casa com `<Button isLoading>` e `<ErrorState>`.
 * Guarda de desmontagem (não atualiza estado após unmount) e captura o erro na telemetria.
 */
type State<T> = { data: T | null; loading: boolean; error: Error | null }

export function useAsync<T, A extends unknown[]>(fn: (...args: A) => Promise<T>) {
  const [state, setState] = useState<State<T>>({ data: null, loading: false, error: null })
  const lastArgs = useRef<A | null>(null)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const run = useCallback(
    async (...args: A): Promise<T | undefined> => {
      lastArgs.current = args
      setState((s) => ({ ...s, loading: true, error: null }))
      try {
        const data = await fn(...args)
        if (mounted.current) setState({ data, loading: false, error: null })
        return data
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e))
        captureError(error, { hook: 'useAsync' })
        if (mounted.current) setState((s) => ({ ...s, loading: false, error }))
        return undefined
      }
    },
    [fn],
  )

  const retry = useCallback(() => (lastArgs.current ? run(...lastArgs.current) : Promise.resolve(undefined)), [run])
  const reset = useCallback(() => setState({ data: null, loading: false, error: null }), [])

  return { ...state, run, retry, reset }
}
