import { Suspense, lazy, useEffect, useState } from 'react'
import { LogOut, Moon, Palette, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { Spinner } from '@/components/ui/spinner'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'

// Code-split: Dashboard (recharts) e Showcase (galeria inteira) só carregam após o login —
// corta o chunk inicial (aviso de >500 kB do vite build) sem mudar comportamento.
const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const Showcase = lazy(() => import('@/pages/Showcase').then((m) => ({ default: m.Showcase })))

type Brand = 'crp' | 'marca-b'
type Mode = 'light' | 'dark'
type View = 'login' | 'register' | 'dashboard' | 'componentes'

// Dock flutuante (marca + tema sempre; navegação só depois de logado).
const DOCK =
  'fixed top-4 right-4 z-50 flex items-center gap-1.5 rounded-full border border-border/50 bg-card/70 p-1 shadow-xs backdrop-blur-md'

const PageFallback = () => (
  <div className="grid min-h-dvh place-items-center" role="status" aria-label="Carregando página">
    <Spinner className="size-6" />
  </div>
)

export function App() {
  const [brand, setBrand] = useState<Brand>('crp')
  const [mode, setMode] = useState<Mode>('light')
  const [view, setView] = useState<View>('login')

  // Re-tematiza tudo: classe .dark + atributo [data-brand] no <html>.
  // Os tokens do CRP (importados em main.tsx) cuidam do resto — zero cor escrita à mão.
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', mode === 'dark')
    if (brand === 'marca-b') root.setAttribute('data-brand', 'marca-b')
    else root.removeAttribute('data-brand')
  }, [brand, mode])

  const loggedIn = view === 'dashboard' || view === 'componentes'

  const themeToggles = (
    <>
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
        <Tabs value={view} onValueChange={(v) => setView(v as View)} className="contents">
          <div className={DOCK}>
            <TabsList className="h-8">
              <TabsTrigger value="dashboard" className="text-xs">Dashboard</TabsTrigger>
              <TabsTrigger value="componentes" className="text-xs">Componentes</TabsTrigger>
            </TabsList>
            <Button variant="ghost" size="icon-sm" aria-label="Sair" onClick={() => setView('login')}><LogOut /></Button>
            <Separator orientation="vertical" className="h-5" />
            {themeToggles}
          </div>

          <ErrorBoundary>
            <TabsContent value="dashboard" forceMount className="m-0 outline-none data-[state=inactive]:hidden">
              <Suspense fallback={<PageFallback />}><Dashboard /></Suspense>
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
