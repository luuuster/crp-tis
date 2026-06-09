import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { LoginPage } from '@/pages/LoginPage'
import { Showcase } from '@/pages/Showcase'

type Brand = 'crp' | 'marca-b'
type Mode = 'light' | 'dark'
type View = 'login' | 'componentes'

export function App() {
  const [brand, setBrand] = useState<Brand>('crp')
  const [mode, setMode] = useState<Mode>('light')
  const [view, setView] = useState<View>('login')

  // Re-tematiza tudo igual aos previews: classe .dark + atributo [data-brand] no <html>.
  // Os tokens do CRP (importados em main.tsx) cuidam do resto — zero cor escrita à mão.
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', mode === 'dark')
    if (brand === 'marca-b') root.setAttribute('data-brand', 'marca-b')
    else root.removeAttribute('data-brand')
  }, [brand, mode])

  return (
    <TooltipProvider delayDuration={200}>
      {/* Controles flutuantes (compartilhados): view · marca · tema */}
      <div className="fixed top-3 right-3 z-50 flex items-center gap-2 rounded-full border bg-card/85 p-1 shadow-sm backdrop-blur">
        <Tabs value={view} onValueChange={(v) => setView(v as View)}>
          <TabsList className="h-8">
            <TabsTrigger value="login" className="text-xs">Login</TabsTrigger>
            <TabsTrigger value="componentes" className="text-xs">Componentes</TabsTrigger>
          </TabsList>
        </Tabs>
        <Separator orientation="vertical" className="h-5" />
        <Tabs value={brand} onValueChange={(v) => setBrand(v as Brand)}>
          <TabsList className="h-8">
            <TabsTrigger value="crp" className="text-xs">CRP</TabsTrigger>
            <TabsTrigger value="marca-b" className="text-xs">Marca B</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={mode === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          onClick={() => setMode((m) => (m === 'dark' ? 'light' : 'dark'))}
        >
          {mode === 'dark' ? <Sun /> : <Moon />}
        </Button>
      </div>

      {view === 'login' ? <LoginPage /> : <Showcase />}

      <Toaster />
    </TooltipProvider>
  )
}
