import { Suspense, lazy, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Tabs, TabsContent } from '@/components/ui/tabs'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { Spinner } from '@/components/ui/spinner'
import { ErrorBoundary } from '@/components/composicoes/ErrorBoundary'
import { ThemeToggles, DOCK } from '@/components/composicoes/ThemeToggles'
import { useBrandMode, readStored } from '@/lib/useBrandMode'
import { LoginPage } from '@/pages/LoginPage'
import { viewFromPath, VIEW_PATH } from '@/lib/urlView'

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
const EditarPerfil = lazy(() => import('@/pages/EditarPerfil').then((m) => ({ default: m.EditarPerfil })))

// O cadastro é do CANDIDATO (porta 5172 — /cadastro). Recrutadores são provisionados internamente, então
// o app do recrutador não tem tela de "Criar conta".
type View = 'login' | 'dashboard' | 'gerador' | 'entrevistas' | 'entrevistas-ia' | 'candidatos' | 'pipeline' | 'usuarios' | 'perfil'

const VIEWS: View[] = ['login', 'dashboard', 'gerador', 'entrevistas', 'entrevistas-ia', 'candidatos', 'pipeline', 'usuarios', 'perfil']

const PageFallback = () => {
  const { t } = useTranslation('common')
  return (
    <div className="grid min-h-dvh place-items-center" role="status" aria-label={t('carregando.pagina')}>
      <Spinner className="size-6" />
    </div>
  )
}

export function App() {
  const { brand, mode, cycleBrand, toggleMode } = useBrandMode()
  // Tela inicial: a URL manda (deep-link /vagas etc.); sem rota casada, cai no localStorage/login.
  const [view, setView] = useState<View>(() => viewFromPath() ?? readStored('crp.view', VIEWS, 'login'))
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

  // Sincroniza URL ↔ view SEM recarregar (deep-link + botão voltar), preservando o forceMount/estado.
  // Na montagem alinha a URL à view resolvida (ex.: restaurada do localStorage); popstate (voltar/avançar)
  // reflete a URL de volta no estado. A escrita da URL na navegação normal é feita em `navigate`.
  useEffect(() => {
    const path = VIEW_PATH[view]
    // `viewFromPath` (não o pathname exato) para não sobrescrever as SUBROTAS de /vagas (/vagas/nova,
    // /vagas/:id…), que resolvem para `gerador` e são roteadas dentro do JobGenerator.
    if (viewFromPath() !== view) window.history.replaceState(null, '', path)
    const onPop = () => setView(viewFromPath() ?? 'login')
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
    // Só na montagem: alinha a URL inicial e registra o listener (view inicial é estável aqui).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loggedIn = view === 'dashboard' || view === 'gerador' || view === 'entrevistas' || view === 'entrevistas-ia' || view === 'candidatos' || view === 'pipeline' || view === 'usuarios' || view === 'perfil'

  // Navegação central. Ao ir para a aba "Vagas" vindo de OUTRA tela, remonta o Gerador (bump no `key`)
  // para cair sempre na LISTA — mesmo que o usuário tenha deixado o wizard "Nova vaga" aberto antes de
  // sair. (Dentro do próprio Gerador, o menu "Vagas" já volta à lista pelo onVagas, sem remontar.)
  const navigate = (v: View) => {
    if (v === 'gerador' && view !== 'gerador') setGeradorKey((k) => k + 1)
    setView(v)
    // Reflete a navegação na URL (pushState = entra no histórico → botão voltar funciona). Sem recarga.
    const path = VIEW_PATH[v]
    if (window.location.pathname !== path) window.history.pushState(null, '', path)
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
            <TabsContent value="perfil" forceMount className="m-0 outline-none data-[state=inactive]:hidden">
              <Suspense fallback={<PageFallback />}>
                <EditarPerfil onNavigate={(v) => navigate(v as View)} brand={brand} mode={mode} onCycleBrand={cycleBrand} onToggleMode={toggleMode} />
              </Suspense>
            </TabsContent>
          </ErrorBoundary>
        </Tabs>
      ) : (
        <>
          <div className={DOCK}><ThemeToggles brand={brand} mode={mode} onCycleBrand={cycleBrand} onToggleMode={toggleMode} /></div>
          <ErrorBoundary>
            <LoginPage onLogin={() => navigate('dashboard')} brand={brand} />
          </ErrorBoundary>
        </>
      )}

      <Toaster theme={mode} />
    </TooltipProvider>
  )
}
