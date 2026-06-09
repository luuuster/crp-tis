import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@crp/design-tokens/tokens.css' // contrato de tokens CRP (:root / .dark / [data-brand]) — folha separada
import './index.css' // Tailwind + @theme inline (mapeia o contrato p/ os utilitários)
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
