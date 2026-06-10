import { Suspense, lazy, useEffect, useState } from 'react'
import { LogOut, Moon, Palette, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

  return (
    <TooltipProvider delayDuration={200}>
      {/* Controle flutuante: marca + tema sempre; navegação de views só DEPOIS de logado. */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-1.5 rounded-full border border-border/50 bg-card/70 p-1 shadow-xs backdrop-blur-md">
        {(view === 'dashboard' || view === 'componentes') && (
          <>
            <Tabs value={view} onValueChange={(v) => setView(v as View)}>
              <TabsList className="h-8">
                <TabsTrigger value="dashboard" className="text-xs">Dashboard</TabsTrigger>
                <TabsTrigger value="componentes" className="text-xs">Componentes</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="ghost" size="icon-sm" aria-label="Sair" onClick={() => setView('login')}><LogOut /></Button>
            <Separator orientation="vertical" className="h-5" />
          </>
        )}

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
      </div>

      <ErrorBoundary>
        {view === 'login' ? (
          <LoginPage onLogin={() => setView('dashboard')} onCreateAccount={() => setView('register')} />
        ) : view === 'register' ? (
          <RegisterPage onBackToLogin={() => setView('login')} onRegistered={() => setView('login')} />
        ) : (
          <Suspense
            fallback={
              <div className="grid min-h-dvh place-items-center" role="status" aria-label="Carregando página">
                <Spinner className="size-6" />
              </div>
            }
          >
            {view === 'dashboard' ? <Dashboard /> : <Showcase />}
          </Suspense>
        )}
      </ErrorBoundary>

      <Toaster theme={mode} />
    </TooltipProvider>
  )
}
