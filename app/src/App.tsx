import { Suspense, lazy, useEffect, useState } from 'react'

import { Tabs, TabsContent } from '@/components/ui/tabs'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { Spinner } from '@/components/ui/spinner'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ThemeToggles, DOCK } from '@/components/ThemeToggles'
import { useBrandMode, readStored } from '@/lib/useBrandMode'
import { LoginPage } from '@/pages/LoginPage'

// Code-split: Dashboard (recharts) só carrega após o login — corta o chunk inicial
// (aviso de >500 kB do vite build) sem mudar comportamento. (A galeria de Componentes mudou
// para o hub de documentação na porta :5174 — ver pages/Componentes.)
const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const JobGenerator = lazy(() => import('@/pages/JobGenerator').then((m) => ({ default: m.JobGenerator })))
const Entrevistas = lazy(() => import('@/pages/Entrevistas').then((m) => ({ default: m.Entrevistas })))
const EntrevistasIA = lazy(() => import('@/pages/EntrevistasIA').then((m) => ({ default: m.EntrevistasIA })))
const Candidatos = lazy(() => import('@/pages/Candidatos').then((m) => ({ default: m.Candidatos })))
const Usuarios = lazy(() => import('@/pages/Usuarios').then((m) => ({ default: m.Usuarios })))
const Pipeline = lazy(() => import('@/pages/Pipeline').then((m) => ({ default: m.Pipeline })))

// O cadastro é do CANDIDATO (porta 5172 — /cadastro). Recrutadores são provisionados internamente, então
// o app do recrutador não tem tela de "Criar conta".
type View = 'login' | 'dashboard' | 'gerador' | 'entrevistas' | 'entrevistas-ia' | 'candidatos' | 'pipeline' | 'usuarios'

const VIEWS: View[] = ['login', 'dashboard', 'gerador', 'entrevistas', 'entrevistas-ia', 'candidatos', 'pipeline', 'usuarios']

const PageFallback = () => (
  <div className="grid min-h-dvh place-items-center" role="status" aria-label="Carregando página">
    <Spinner className="size-6" />
  </div>
)

export function App() {
  const { brand, mode, cycleBrand, toggleMode } = useBrandMode()
  const [view, setView] = useState<View>(() => readStored('crp.view', VIEWS, 'login'))
  // A aba "Vagas" (Gerador) usa forceMount e preserva seu estado interno (lista/detalhe/wizard).
  const [geradorKey, setGeradorKey] = useState(0)

  // Persiste a view da demo (tema/marca são persistidos pelo useBrandMode) para sobreviver ao refresh.
  useEffect(() => {
    try {
      localStorage.setItem('crp.view', view)
    } catch {
      /* storage indisponível (modo privado/quota) — segue sem persistir */
    }
  }, [view])

  const loggedIn = view === 'dashboard' || view === 'gerador' || view === 'entrevistas' || view === 'entrevistas-ia' || view === 'candidatos' || view === 'pipeline' || view === 'usuarios'

  // Navegação central. Ao ir para a aba "Vagas" vindo de OUTRA tela, remonta o Gerador (bump no `key`)
  // para cair sempre na LISTA — mesmo que o usuário tenha deixado o wizard "Nova vaga" aberto antes de
  // sair. (Dentro do próprio Gerador, o menu "Vagas" já volta à lista pelo onVagas, sem remontar.)
  const navigate = (v: View) => {
    if (v === 'gerador' && view !== 'gerador') setGeradorKey((k) => k + 1)
    setView(v)
  }

  return (
    <TooltipProvider delayDuration={200}>
      {loggedIn ? (
        // Tabs DE VERDADE: cada gatilho controla um <TabsContent> existente (aria-controls válido).
        // forceMount mantém ambos no DOM (o inativo fica hidden) — o gatilho nunca aponta p/ um painel
        // ausente. className="contents" deixa o layout (dock fixa + página) intacto.
        <Tabs value={view} onValueChange={(v) => navigate(v as View)} className="contents">
          <ErrorBoundary>
            <TabsContent value="dashboard" forceMount className="m-0 outline-none data-[state=inactive]:hidden">
              <Suspense fallback={<PageFallback />}>
                <Dashboard onNavigate={(v) => navigate(v as View)} brand={brand} mode={mode} onCycleBrand={cycleBrand} onToggleMode={toggleMode} />
              </Suspense>
            </TabsContent>
            <TabsContent value="gerador" forceMount className="m-0 outline-none data-[state=inactive]:hidden">
              <Suspense fallback={<PageFallback />}>
                <JobGenerator key={geradorKey} onNavigate={(v) => navigate(v as View)} brand={brand} mode={mode} onCycleBrand={cycleBrand} onToggleMode={toggleMode} />
              </Suspense>
            </TabsContent>
            <TabsContent value="entrevistas" forceMount className="m-0 outline-none data-[state=inactive]:hidden">
              <Suspense fallback={<PageFallback />}>
                <Entrevistas onNavigate={(v) => navigate(v as View)} brand={brand} mode={mode} onCycleBrand={cycleBrand} onToggleMode={toggleMode} />
              </Suspense>
            </TabsContent>
            <TabsContent value="entrevistas-ia" forceMount className="m-0 outline-none data-[state=inactive]:hidden">
              <Suspense fallback={<PageFallback />}>
                <EntrevistasIA onNavigate={(v) => navigate(v as View)} brand={brand} mode={mode} onCycleBrand={cycleBrand} onToggleMode={toggleMode} />
              </Suspense>
            </TabsContent>
            <TabsContent value="candidatos" forceMount className="m-0 outline-none data-[state=inactive]:hidden">
              <Suspense fallback={<PageFallback />}>
                <Candidatos onNavigate={(v) => navigate(v as View)} brand={brand} mode={mode} onCycleBrand={cycleBrand} onToggleMode={toggleMode} />
              </Suspense>
            </TabsContent>
            <TabsContent value="usuarios" forceMount className="m-0 outline-none data-[state=inactive]:hidden">
              <Suspense fallback={<PageFallback />}>
                <Usuarios onNavigate={(v) => navigate(v as View)} brand={brand} mode={mode} onCycleBrand={cycleBrand} onToggleMode={toggleMode} />
              </Suspense>
            </TabsContent>
            <TabsContent value="pipeline" forceMount className="m-0 outline-none data-[state=inactive]:hidden">
              <Suspense fallback={<PageFallback />}>
                <Pipeline onNavigate={(v) => navigate(v as View)} brand={brand} mode={mode} onCycleBrand={cycleBrand} onToggleMode={toggleMode} />
              </Suspense>
            </TabsContent>
          </ErrorBoundary>
        </Tabs>
      ) : (
        <>
          <div className={DOCK}><ThemeToggles brand={brand} mode={mode} onCycleBrand={cycleBrand} onToggleMode={toggleMode} /></div>
          <ErrorBoundary>
            <LoginPage onLogin={() => setView('dashboard')} brand={brand} />
          </ErrorBoundary>
        </>
      )}

      <Toaster theme={mode} />
    </TooltipProvider>
  )
}
