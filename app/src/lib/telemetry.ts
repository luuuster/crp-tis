import { config } from '@/config'

/**
 * Telemetria PLUGÁVEL. Hoje: `console.error` estruturado. Quando `VITE_SENTRY_DSN` existir, é AQUI que o
 * Sentry (ou outro) seria chamado — a interface (`captureError`) não muda para o resto do app, então
 * instalar o Sentry de fato fica como follow-up. Usado pelo ErrorBoundary, useAsync e handlers globais.
 */
type Ctx = Record<string, unknown>

export function captureError(error: unknown, ctx?: Ctx) {
  const err = error instanceof Error ? error : new Error(typeof error === 'string' ? error : 'Erro desconhecido')
  console.error('[telemetry]', err.message, { stack: err.stack, env: config.env, version: config.appVersion, ...ctx })
  // if (config.sentryDsn) Sentry.captureException(err, { extra: ctx })   // follow-up (instalar @sentry/react)
}

/** Liga os handlers globais de erro (erros não capturados e promessas rejeitadas). Chamar 1x no bootstrap. */
export function initTelemetry() {
  if (typeof window === 'undefined') return
  window.addEventListener('error', (e) => captureError(e.error ?? e.message, { source: 'window.onerror' }))
  window.addEventListener('unhandledrejection', (e) => captureError(e.reason, { source: 'unhandledrejection' }))
}
