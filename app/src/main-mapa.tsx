import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@crp/design-tokens/tokens.css' // contrato de tokens CRP (:root / .dark / [data-brand]) — folha separada
import './index.css' // Tailwind + @theme inline (mapeia o contrato p/ os utilitários)
import './i18n' // inicializa o react-i18next (pt-BR padrão + en/es) — efeito colateral, antes do render
import { initTelemetry } from './lib/telemetry'
import { TooltipProvider } from './components/ui/tooltip'
import { Toaster } from './components/ui/sonner'
import { ErrorBoundary } from './components/composicoes/ErrorBoundary'
import { MapaArquitetura } from './pages/MapaArquitetura'
import { UserFlow } from './pages/UserFlow'
import { Componentes } from './pages/Componentes'

initTelemetry() // handlers globais de erro (window.onerror / unhandledrejection) → telemetria

// Telas de documentação na mesma origem (:5174): / = Arquitetura, /userflow = User Flow, /componentes = Showcase.
const path = window.location.pathname.toLowerCase()
const tela = path.startsWith('/userflow') ? <UserFlow /> : path.startsWith('/componentes') ? <Componentes /> : <MapaArquitetura />
// Título por rota (deep link/aba/histórico distinguíveis — antes as 3 telas dividiam "Arquitetura · TIS").
document.title = path.startsWith('/userflow') ? 'User Flow · TIS' : path.startsWith('/componentes') ? 'Componentes · TIS' : 'Arquitetura · TIS'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TooltipProvider delayDuration={200}>
      <ErrorBoundary>
        {tela}
      </ErrorBoundary>
      <Toaster />
    </TooltipProvider>
  </StrictMode>,
)
