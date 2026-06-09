import { useEffect, useState } from 'react'
import { LogOut, Moon, Palette, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { LoginPage } from '@/pages/LoginPage'
import { Dashboard } from '@/pages/Dashboard'
import { Showcase } from '@/pages/Showcase'

type Brand = 'crp' | 'marca-b'
type Mode = 'light' | 'dark'
type View = 'login' | 'dashboard' | 'componentes'

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
        {view !== 'login' && (
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

      {view === 'login' ? (
        <LoginPage onLogin={() => setView('dashboard')} />
      ) : view === 'dashboard' ? (
        <Dashboard />
      ) : (
        <Showcase />
      )}

      <Toaster theme={mode} />
    </TooltipProvider>
  )
}
