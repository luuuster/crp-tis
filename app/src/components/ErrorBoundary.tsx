import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * Error Boundary do app: captura erros de render e mostra um fallback acessível
 * (não uma tela branca). Token-driven (cores do contrato), claro/escuro e multi-marca.
 */
type Props = { children: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Em produção, mandar para telemetria (Sentry etc.). Na demo, console.
    console.error('ErrorBoundary capturou um erro de render:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div role="alert" className="grid min-h-dvh place-items-center bg-background px-6 text-center">
          <div className="max-w-md space-y-3">
            <h1 className="ty-h3 text-foreground">Algo deu errado</h1>
            <p className="ty-body-sm text-muted-foreground">
              Ocorreu um erro inesperado ao montar a tela. Recarregue a página para tentar novamente.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-2 inline-flex min-h-[var(--button-height-md)] items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground outline-none transition-colors hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              Recarregar
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
