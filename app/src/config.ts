/**
 * Configuração de ambiente (Vite). Lê `import.meta.env.VITE_*` com defaults seguros — ponto único onde
 * o app consome variáveis de ambiente (ex.: DSN de telemetria). Tipagem em src/vite-env.d.ts.
 */
export const config = {
  /** DSN do Sentry/telemetria. Vazio na demo → telemetria fica em modo console (no-op de envio). */
  sentryDsn: import.meta.env.VITE_SENTRY_DSN ?? '',
  /** 'development' | 'production' (do Vite). */
  env: import.meta.env.MODE,
  /** Versão exibida na telemetria/erros. */
  appVersion: import.meta.env.VITE_APP_VERSION ?? 'dev',
} as const
