import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@crp/design-tokens/tokens.css' // contrato de tokens CRP (:root / .dark / [data-brand]) — folha separada
import './index.css' // Tailwind + @theme inline (mapeia o contrato p/ os utilitários)
import './i18n' // inicializa o react-i18next (pt-BR padrão + en/es) — efeito colateral, antes do render
import { initTelemetry } from './lib/telemetry'
import { CandidatoApp } from './CandidatoApp'

initTelemetry() // handlers globais de erro (window.onerror / unhandledrejection) → telemetria

// Título por DEEP LINK (aba/histórico/compartilhamento distinguíveis — antes /acesso e /painel dividiam
// "Inscrição na vaga · TIS"). Cobre o carregamento; a navegação interna (pushState) mantém o título da
// área, o que é aceitável — cada área tem o seu no boot.
const TITULOS: [string, string][] = [
  ['/acesso', 'Acesso do candidato · TIS'],
  ['/redefinir_senha', 'Redefinir senha · TIS'],
  ['/cadastro', 'Cadastro do candidato · TIS'],
  ['/painel', 'Mural de vagas · TIS'],
  ['/perfil', 'Perfil do candidato · TIS'],
  ['/candidaturas_finalizadas', 'Candidaturas finalizadas · TIS'],
  ['/candidaturas', 'Minhas candidaturas · TIS'],
  ['/agendar', 'Agendamento de entrevista · TIS'],
  ['/entrevista', 'Entrevista · TIS'],
]
const rota = window.location.pathname.toLowerCase()
const titulo = TITULOS.find(([p]) => rota.startsWith(p))
if (titulo) document.title = titulo[1]

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CandidatoApp />
  </StrictMode>,
)
