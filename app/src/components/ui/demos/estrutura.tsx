import { Home, Inbox, Settings } from 'lucide-react'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider,
} from '@/components/ui/sidebar'
import type { Demo } from './_types'

export const ESTRUTURA_DEMOS: Demo[] = [
  {
    id: 'card', component: 'card', section: 'estrutura', title: 'Card',
    desc: 'Superfície de conteúdo; a semântica vem do conteúdo (heading etc.).',
    Render: () => (
      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle>Plano Pro</CardTitle>
          <CardDescription>Tudo do Starter, com relatórios avançados.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">R$ 49/mês por usuário.</CardContent>
        <CardFooter><Button size="sm">Assinar</Button></CardFooter>
      </Card>
    ),
  },
  {
    id: 'separator', component: 'separator', section: 'estrutura', title: 'Separator',
    desc: 'Divisória horizontal/vertical (role=separator).',
    Render: () => (
      <div className="space-y-3 text-sm">
        <p>Seção um</p>
        <Separator />
        <p>Seção dois</p>
        <div className="flex h-5 items-center gap-3">
          <span>Início</span>
          <Separator orientation="vertical" />
          <span>Docs</span>
          <Separator orientation="vertical" />
          <span>Sobre</span>
        </div>
      </div>
    ),
  },
  {
    id: 'aspect-ratio', component: 'aspect-ratio', section: 'estrutura', title: 'Aspect Ratio',
    desc: 'Mantém a proporção da caixa (utilitário de layout).',
    Render: () => (
      <div className="w-56">
        <AspectRatio ratio={16 / 9} className="flex items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">
          16 / 9
        </AspectRatio>
      </div>
    ),
  },
  {
    id: 'scroll-area', component: 'scroll-area', section: 'estrutura', title: 'Scroll Area',
    desc: 'Viewport rolável estilizada; rola por teclado.',
    Render: () => (
      <ScrollArea className="h-36 w-full max-w-xs rounded-md border p-3">
        <div className="space-y-2 text-sm">
          {Array.from({ length: 14 }).map((_, i) => (
            <p key={i}>Linha {i + 1} — conteúdo rolável</p>
          ))}
        </div>
      </ScrollArea>
    ),
  },
  {
    id: 'resizable', component: 'resizable', section: 'estrutura', title: 'Resizable',
    desc: 'Painéis com separador redimensionável (handle focável).',
    Render: () => (
      <ResizablePanelGroup orientation="horizontal" className="h-32 max-w-md rounded-lg border">
        <ResizablePanel defaultSize={50}>
          <div className="flex h-full items-center justify-center p-4 text-sm">Painel A</div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50}>
          <div className="flex h-full items-center justify-center p-4 text-sm">Painel B</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    ),
  },
  {
    id: 'sidebar', component: 'sidebar', section: 'estrutura', title: 'Sidebar',
    desc: 'Navegação lateral (requer SidebarProvider); aqui em escala reduzida.',
    tokens: ['--sidebar', '--sidebar-foreground', '--sidebar-accent'],
    Render: () => (
      <SidebarProvider className="min-h-0 h-64 w-fit items-start overflow-hidden rounded-lg border">
        <Sidebar collapsible="none" className="w-56">
          <SidebarHeader className="px-3 py-2 text-sm font-semibold">TalentAI</SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive><Home /> Início</SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton><Inbox /> Caixa de entrada</SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton><Settings /> Configurações</SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    ),
  },
]
