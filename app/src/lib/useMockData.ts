import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Carga SIMULADA de dados mock (este app é um protótipo — os dados são síncronos). Dá às telas o ciclo
 * real `{ data, loading, error, retry, setData }` para exercitar skeleton + estado de erro sem backend.
 *
 * - Skeleton só na 1ª visita de cada tela POR SESSÃO (`loadedOnce`): navegar de volta é instantâneo (sem
 *   re-piscar). `setData` mantém as mutações locais (ex.: fechar vaga, convidar usuário) funcionando.
 * - Modo erro de DEMO: abra com `?erro=1` e a 1ª carga falha; o "Tentar novamente" (ErrorState) recupera.
 * - Sob AUTOMAÇÃO (`navigator.webdriver`) a carga é INSTANTÂNEA — mantém os e2e verdes/rápidos sem tocar
 *   nas specs. Override `?demoload` força o atraso mesmo sob automação; `?demoload=3000` define o atraso
 *   em ms (p/ congelar o skeleton em demo/captura). Sem o param, o atraso padrão é DELAY_MS.
 */
const DELAY_MS = 450
const loadedOnce = new Set<string>()

function params(): URLSearchParams {
  try { return new URLSearchParams(window.location.search) } catch { return new URLSearchParams() }
}
const wantErro = () => params().has('erro')
// null = sem override; nº = atraso em ms (?demoload=3000); presença sem nº válido = DELAY_MS (?demoload).
function demoOverride(): number | null {
  const v = params().get('demoload')
  if (v === null) return null
  const n = Number(v)
  return Number.isFinite(n) && n >= 50 ? n : DELAY_MS
}
// Playwright marca navigator.webdriver; jsdom (vitest) traz "jsdom" no userAgent. Em ambos a carga é
// instantânea — e2e/unit ficam verdes e rápidos sem ver o skeleton/erro simulados.
const automated = () => {
  try { return navigator.webdriver === true || /jsdom/i.test(navigator.userAgent) } catch { return false }
}
// Instantâneo sob automação, EXCETO com ?demoload (aí queremos ver o skeleton/erro de propósito).
const instantaneo = () => automated() && demoOverride() === null

type State<T> = { data: T; loading: boolean; error: Error | null }

export function useMockData<T>(id: string, load: () => T, empty: T) {
  // load/empty são estáveis na prática (sempre `() => CONSTANTE` e `[]`); capturar o 1º via ref basta
  // e evita pôr `load` nas deps do run (arrow nova a cada render → reiniciaria a carga em loop).
  const loadRef = useRef(load)
  const emptyRef = useRef(empty)
  const pronto = () => instantaneo() || loadedOnce.has(id)
  // Inicializador roda 1x no mount: usa os parâmetros crus (não refs) p/ não acessar ref durante render.
  const [state, setState] = useState<State<T>>(() =>
    pronto() ? { data: load(), loading: false, error: null } : { data: empty, loading: true, error: null },
  )
  const attempt = useRef(0)

  const run = useCallback(() => {
    attempt.current += 1
    const a = attempt.current
    setState({ data: emptyRef.current, loading: true, error: null })
    const timer = setTimeout(() => {
      if (wantErro() && a === 1) {
        setState({ data: emptyRef.current, loading: false, error: new Error('Falha simulada de carregamento') })
      } else {
        loadedOnce.add(id)
        setState({ data: loadRef.current(), loading: false, error: null })
      }
    }, demoOverride() ?? DELAY_MS)
    return timer
  }, [id])

  useEffect(() => {
    if (pronto()) { loadedOnce.add(id); return }
    const timer = run()
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, run])

  const setData = useCallback(
    (u: T | ((prev: T) => T)) => setState((s) => ({ ...s, data: typeof u === 'function' ? (u as (p: T) => T)(s.data) : u })),
    [],
  )
  const retry = useCallback(() => { void run() }, [run])

  return { data: state.data, loading: state.loading, error: state.error, setData, retry }
}
