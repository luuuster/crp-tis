/**
 * Raiz do app do CANDIDATO (porta :5172 no dev — origem separada do app do recrutador :5173, mas MESMA
 * plataforma: mesmo DS, tokens, i18n e componentes). É o "lado de fora" do produto: quem se candidata.
 * Hoje só a página de inscrição na vaga; as próximas telas do candidato (entrevista por IA, acompanhamento)
 * entram aqui. Chrome mínimo: só a dock de idioma/marca/tema — sem a navegação interna do recrutador.
 */
import { Suspense, lazy } from 'react'

import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { Spinner } from '@/components/ui/spinner'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ThemeToggles, DOCK } from '@/components/ThemeToggles'
import { PainelSkeleton } from '@/components/PainelSkeleton'
import { useBrandMode } from '@/lib/useBrandMode'
import { vagaPorId } from '@/lib/vagasCatalogo'
import { sairCandidato } from '@/lib/candidatoSessao'

const InscricaoVaga = lazy(() => import('@/pages/InscricaoVaga').then((m) => ({ default: m.InscricaoVaga })))
const CandidatoAcesso = lazy(() => import('@/pages/CandidatoAcesso').then((m) => ({ default: m.CandidatoAcesso })))
// Cadastro é do CANDIDATO (se cadastra na plataforma) — reaproveita a RegisterPage (nome/e-mail/senha/CV).
const RegisterPage = lazy(() => import('@/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })))
// Área logada: mural de vagas (todas as vagas do sistema + busca + filtros).
const CandidatoPainel = lazy(() => import('@/pages/CandidatoPainel').then((m) => ({ default: m.CandidatoPainel })))
// Área logada: minhas candidaturas (acompanhamento das vagas a que já se candidatou).
const CandidatoCandidaturas = lazy(() => import('@/pages/CandidatoCandidaturas').then((m) => ({ default: m.CandidatoCandidaturas })))

const PageFallback = () => (
  <div className="grid min-h-dvh place-items-center" role="status" aria-label="Carregando página">
    <Spinner className="size-6" />
  </div>
)

export function CandidatoApp() {
  const { brand, mode, cycleBrand, toggleMode } = useBrandMode()
  // Áreas do portal, por caminho: /acesso = login/conta, /cadastro = criar conta, o resto = vaga pública
  // (inscrição). A troca é por navegação real (recarrega o app nesta porta), então basta ler o pathname
  // na montagem. (toLowerCase: /ACESSO, /Cadastro etc. também batem — senão cai no app do recrutador.)
  const path = window.location.pathname.toLowerCase()
  const acesso = path.startsWith('/acesso')
  // Redefinir senha: rota própria do fluxo "esqueci a senha" (alvo do link do e-mail) — renderiza o CandidatoAcesso,
  // que deriva a etapa pela URL. Fica fora de /acesso porque, no produto, viria de um link externo com token.
  const redefinir = path.startsWith('/redefinir')
  const cadastro = path.startsWith('/cadastro')
  const painel = path.startsWith('/painel')
  // Abas da área logada (mesma topbar/abas do mural). Finalizadas ANTES de candidaturas — senão
  // /candidaturas capturaria /candidaturas_finalizadas (ambos começam com "/candidaturas").
  const finalizadas = path.startsWith('/candidaturas_finalizadas')
  const candidaturas = path.startsWith('/candidaturas') && !finalizadas
  const logada = painel || candidaturas || finalizadas // áreas com topbar própria (sem o dock flutuante)
  // Link PÚBLICO da vaga (ex.: divulgada no LinkedIn): abre a vaga SEM exigir login — visão de quem ainda não
  // tem conta (formulário público de inscrição), mesmo que haja sessão nesta porta.
  const linkpublico = path.startsWith('/linkpublico')
  // Vaga aberta em NOVA ABA pelo mural: id na URL (?vaga=<id>). Sem id (link público direto) → exemplo padrão.
  const vagaId = new URLSearchParams(window.location.search).get('vaga')
  const vagaSel = vagaId ? vagaPorId(vagaId) : undefined
  return (
    <TooltipProvider delayDuration={200}>
      {/* Dock flutuante só nas telas PÚBLICAS; a área logada (mural/candidaturas) tem topbar própria. */}
      {!logada && (
        <div className={DOCK}>
          <ThemeToggles brand={brand} mode={mode} onCycleBrand={cycleBrand} onToggleMode={toggleMode} />
        </div>
      )}
      <ErrorBoundary>
        {/* No /painel, o fallback é o ESQUELETO do mural (formato real) em vez do spinner — melhor em conexão lenta. */}
        <Suspense fallback={painel ? <PainelSkeleton brand={brand} /> : <PageFallback />}>
          {painel ? (
            <CandidatoPainel brand={brand} mode={mode} onCycleBrand={cycleBrand} onToggleMode={toggleMode} onSair={() => { sairCandidato(); window.location.href = '/acesso' }} />
          ) : finalizadas ? (
            <CandidatoCandidaturas tipo="finalizadas" brand={brand} mode={mode} onCycleBrand={cycleBrand} onToggleMode={toggleMode} onSair={() => { sairCandidato(); window.location.href = '/acesso' }} />
          ) : candidaturas ? (
            <CandidatoCandidaturas tipo="andamento" brand={brand} mode={mode} onCycleBrand={cycleBrand} onToggleMode={toggleMode} onSair={() => { sairCandidato(); window.location.href = '/acesso' }} />
          ) : cadastro ? (
            <RegisterPage brand={brand} onBackToLogin={() => { window.location.href = '/acesso' }} onRegistered={() => { window.location.href = '/acesso' }} />
          ) : acesso || redefinir ? (
            <CandidatoAcesso brand={brand} />
          ) : (
            <InscricaoVaga brand={brand} vaga={vagaSel} publico={linkpublico} />
          )}
        </Suspense>
      </ErrorBoundary>
      <Toaster theme={mode} />
    </TooltipProvider>
  )
}
