import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@crp/design-tokens/tokens.css' // contrato de tokens CRP (:root / .dark / [data-brand]) — folha separada
import './index.css' // Tailwind + @theme inline (mapeia o contrato p/ os utilitários)
import './i18n' // inicializa o react-i18next (pt-BR padrão + en/es) — efeito colateral, antes do render
import { initTelemetry } from './lib/telemetry'
import { App } from './App'

initTelemetry() // handlers globais de erro (window.onerror / unhandledrejection) → telemetria

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
