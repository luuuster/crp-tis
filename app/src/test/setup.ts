import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// --- Polyfills do jsdom (faltam por padrão) ---
// recharts (Dashboard) usa ResizeObserver; sonner/libs usam matchMedia; Radix usa pointer capture.
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = globalThis.ResizeObserver || (ResizeObserverMock as unknown as typeof ResizeObserver)

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return false },
  })) as unknown as typeof window.matchMedia
}

for (const m of ['scrollIntoView', 'hasPointerCapture', 'setPointerCapture', 'releasePointerCapture'] as const) {
  if (!(m in Element.prototype)) {
    // @ts-expect-error — stub mínimo p/ Radix não quebrar no jsdom
    Element.prototype[m] = function () { return m === 'hasPointerCapture' ? false : undefined }
  }
}

// Limpa o DOM e o estado de tema (.dark / [data-brand]) entre os testes — o App tematiza o <html>.
afterEach(() => {
  cleanup()
  document.documentElement.className = ''
  document.documentElement.removeAttribute('data-brand')
})
