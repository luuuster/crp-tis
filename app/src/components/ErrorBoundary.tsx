import { Component, type ErrorInfo, type ReactNode } from 'react'

import i18n from '@/i18n'
import { captureError } from '@/lib/telemetry'

/**
 * Error Boundary do app: captura erros de render e mostra um fallback acessível
 * (não uma tela branca). Token-driven (cores do contrato), claro/escuro e multi-marca.
 * Encaminha o erro para a telemetria (plugável → Sentry no follow-up). Textos via i18n (imperativo,
 * pois é classe; o fallback aparece 1x no crash, sem reagir à troca de idioma — aceitável).
 */
type Props = { children: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    captureError(error, { boundary: 'ErrorBoundary', componentStack: info.componentStack })
  }

  render() {
    if (this.state.error) {
      return (
        <div role="alert" className="grid min-h-dvh place-items-center bg-background px-6 text-center">
          <div className="max-w-md space-y-3">
            <h1 className="ty-h3 text-foreground">{i18n.t('erro.titulo')}</h1>
            <p className="ty-body-sm text-muted-foreground">{i18n.t('erro.descricao')}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-2 inline-flex min-h-[var(--button-height-md)] items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground outline-none transition-colors hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {i18n.t('erro.recarregar')}
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
