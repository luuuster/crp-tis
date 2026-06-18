import { Suspense, lazy, useEffect, useState } from 'react'
import { LogOut, Moon, Palette, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { Spinner } from '@/components/ui/spinner'
import { LanguageSelect } from '@/components/LanguageSelect'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'

// Code-split: Dashboard (recharts) e Showcase (galeria inteira) só carregam após o login —
// corta o chunk inicial (aviso de >500 kB do vite build) sem mudar comportamento.
const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const Showcase = lazy(() => import('@/pages/Showcase').then((m) => ({ default: m.Showcase })))
const JobGenerator = lazy(() => import('@/pages/JobGenerator').then((m) => ({ default: m.JobGenerator })))
const Entrevistas = lazy(() => import('@/pages/Entrevistas').then((m) => ({ default: m.Entrevistas })))
const EntrevistasIA = lazy(() => import('@/pages/EntrevistasIA').then((m) => ({ default: m.EntrevistasIA })))
const Candidatos = lazy(() => import('@/pages/Candidatos').then((m) => ({ default: m.Candidatos })))
const Usuarios = lazy(() => import('@/pages/Usuarios').then((m) => ({ default: m.Usuarios })))

type Brand = 'crp' | 'marca-b'
type Mode = 'light' | 'dark'
type View = 'login' | 'register' | 'dashboard' | 'componentes' | 'gerador' | 'entrevistas' | 'entrevistas-ia' | 'candidatos' | 'usuarios'

const VIEWS: View[] = ['login', 'register', 'dashboard', 'componentes', 'gerador', 'entrevistas', 'entrevistas-ia', 'candidatos', 'usuarios']

// Persistência leve em localStorage: um F5 não desloga nem reseta tema/marca — restaura a última
// view (e brand/mode). Lê com guarda (valida contra a lista) e tolera storage indisponível.
function readStored<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const v = localStorage.getItem(key) as T | null
    return v && allowed.includes(v) ? v : fallback
  } catch {
    return fallback
  }
}

// Dock flutuante (marca + tema sempre; navegação só depois de logado).
const DOCK =
  'fixed top-4 right-4 z-50 flex items-center gap-1.5 rounded-full border border-border/50 bg-card/70 p-1 shadow-xs backdrop-blur-md'

const PageFallback = () => (
  <div className="grid min-h-dvh place-items-center" role="status" aria-label="Carregando página">
    <Spinner className="size-6" />
  </div>
)

export function App() {
  const [brand, setBrand] = useState<Brand>(() => readStored('crp.brand', ['crp', 'marca-b'], 'crp'))
  const [mode, setMode] = useState<Mode>(() => readStored('crp.mode', ['light', 'dark'], 'light'))
  const [view, setView] = useState<View>(() => readStored('crp.view', VIEWS, 'login'))
  // A aba "Vagas" (Gerador) usa forceMount e preserva seu estado interno (lista/detalhe/wizard).
  const [geradorKey, setGeradorKey] = useState(0)

  // Re-tematiza tudo: classe .dark + atributo [data-brand] no <html>.
  // Os tokens do CRP (importados em main.tsx) cuidam do resto — zero cor escrita à mão.
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', mode === 'dark')
    if (brand === 'marca-b') root.setAttribute('data-brand', 'marca-b')
    else root.removeAttribute('data-brand')
  }, [brand, mode])

  // Persiste a sessão da demo (view + tema/marca) para sobreviver ao refresh.
  useEffect(() => {
    try {
      localStorage.setItem('crp.view', view)
      localStorage.setItem('crp.brand', brand)
      localStorage.setItem('crp.mode', mode)
    } catch {
      /* storage indisponível (modo privado/quota) — segue sem persistir */
    }
  }, [view, brand, mode])

  const loggedIn = view === 'dashboard' || view === 'componentes' || view === 'gerador' || view === 'entrevistas' || view === 'entrevistas-ia' || view === 'candidatos' || view === 'usuarios'

  // Navegação central. Ao ir para a aba "Vagas" vindo de OUTRA tela, remonta o Gerador (bump no `key`)
  // para cair sempre na LISTA — mesmo que o usuário tenha deixado o wizard "Nova vaga" aberto antes de
  // sair. (Dentro do próprio Gerador, o menu "Vagas" já volta à lista pelo onVagas, sem remontar.)
  const navigate = (v: View) => {
    if (v === 'gerador' && view !== 'gerador') setGeradorKey((k) => k + 1)
    setView(v)
  }

  const themeToggles = (
    <>
      <LanguageSelect />
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Trocar para ${brand === 'crp' ? 'Marca B' : 'TIS'}`}
        onClick={() => setBrand((b) => (b === 'crp' ? 'marca-b' : 'crp'))}
      >
        <Palette />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={mode === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        onClick={() => setMode((m) => (m === 'dark' ? 'light' : 'dark'))}
      >
        {mode === 'dark' ? <Sun /> : <Moon />}
      </Button>
    </>
  )

  return (
    <TooltipProvider delayDuration={200}>
      {loggedIn ? (
        // Tabs DE VERDADE: cada gatilho controla um <TabsContent> existente (aria-controls válido).
        // forceMount mantém ambos no DOM (o inativo fica hidden) — o gatilho nunca aponta p/ um painel
        // ausente. className="contents" deixa o layout (dock fixa + página) intacto.
        <Tabs value={view} onValueChange={(v) => navigate(v as View)} className="contents">
          {/* O Gerador tem o próprio shell (topbar com tema/marca/conta), então o dock flutuante
              é escondido nele p/ não duplicar/conflitar — as funções vão via props p/ a página. */}
          {view === 'componentes' && (
            <div className={DOCK}>
              <TabsList className="h-8">
                <TabsTrigger value="dashboard" className="text-xs">Dashboard</TabsTrigger>
                <TabsTrigger value="gerador" className="text-xs">Vagas</TabsTrigger>
                <TabsTrigger value="componentes" className="text-xs">Componentes</TabsTrigger>
              </TabsList>
              <Button variant="ghost" size="icon-sm" aria-label="Sair" onClick={() => setView('login')}><LogOut /></Button>
              <Separator orientation="vertical" className="h-5" />
              {themeToggles}
            </div>
          )}

          <ErrorBoundary>
            <TabsContent value="dashboard" forceMount className="m-0 outline-none data-[state=inactive]:hidden">
              <Suspense fallback={<PageFallback />}>
                <Dashboard
                  onNavigate={(v) => navigate(v as View)}
                  brand={brand}
                  mode={mode}
                  onCycleBrand={() => setBrand((b) => (b === 'crp' ? 'marca-b' : 'crp'))}
                  onToggleMode={() => setMode((m) => (m === 'dark' ? 'light' : 'dark'))}
                />
              </Suspense>
            </TabsContent>
            <TabsContent value="gerador" forceMount className="m-0 outline-none data-[state=inactive]:hidden">
              <Suspense fallback={<PageFallback />}>
                <JobGenerator
                  key={geradorKey}
                  onNavigate={(v) => navigate(v as View)}
                  brand={brand}
                  mode={mode}
                  onCycleBrand={() => setBrand((b) => (b === 'crp' ? 'marca-b' : 'crp'))}
                  onToggleMode={() => setMode((m) => (m === 'dark' ? 'light' : 'dark'))}
                />
              </Suspense>
            </TabsContent>
            <TabsContent value="entrevistas" forceMount className="m-0 outline-none data-[state=inactive]:hidden">
              <Suspense fallback={<PageFallback />}>
                <Entrevistas
                  onNavigate={(v) => navigate(v as View)}
                  brand={brand}
                  mode={mode}
                  onCycleBrand={() => setBrand((b) => (b === 'crp' ? 'marca-b' : 'crp'))}
                  onToggleMode={() => setMode((m) => (m === 'dark' ? 'light' : 'dark'))}
                />
              </Suspense>
            </TabsContent>
            <TabsContent value="entrevistas-ia" forceMount className="m-0 outline-none data-[state=inactive]:hidden">
              <Suspense fallback={<PageFallback />}>
                <EntrevistasIA
                  onNavigate={(v) => navigate(v as View)}
                  brand={brand}
                  mode={mode}
                  onCycleBrand={() => setBrand((b) => (b === 'crp' ? 'marca-b' : 'crp'))}
                  onToggleMode={() => setMode((m) => (m === 'dark' ? 'light' : 'dark'))}
                />
              </Suspense>
            </TabsContent>
            <TabsContent value="candidatos" forceMount className="m-0 outline-none data-[state=inactive]:hidden">
              <Suspense fallback={<PageFallback />}>
                <Candidatos
                  onNavigate={(v) => navigate(v as View)}
                  brand={brand}
                  mode={mode}
                  onCycleBrand={() => setBrand((b) => (b === 'crp' ? 'marca-b' : 'crp'))}
                  onToggleMode={() => setMode((m) => (m === 'dark' ? 'light' : 'dark'))}
                />
              </Suspense>
            </TabsContent>
            <TabsContent value="usuarios" forceMount className="m-0 outline-none data-[state=inactive]:hidden">
              <Suspense fallback={<PageFallback />}>
                <Usuarios
                  onNavigate={(v) => navigate(v as View)}
                  brand={brand}
                  mode={mode}
                  onCycleBrand={() => setBrand((b) => (b === 'crp' ? 'marca-b' : 'crp'))}
                  onToggleMode={() => setMode((m) => (m === 'dark' ? 'light' : 'dark'))}
                />
              </Suspense>
            </TabsContent>
            <TabsContent value="componentes" forceMount className="m-0 outline-none data-[state=inactive]:hidden">
              <Suspense fallback={<PageFallback />}><Showcase /></Suspense>
            </TabsContent>
          </ErrorBoundary>
        </Tabs>
      ) : (
        <>
          <div className={DOCK}>{themeToggles}</div>
          <ErrorBoundary>
            {view === 'login' ? (
              <LoginPage onLogin={() => setView('dashboard')} onCreateAccount={() => setView('register')} />
            ) : (
              <RegisterPage onBackToLogin={() => setView('login')} onRegistered={() => setView('login')} />
            )}
          </ErrorBoundary>
        </>
      )}

      <Toaster theme={mode} />
    </TooltipProvider>
  )
}
