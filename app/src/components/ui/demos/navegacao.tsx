import { useState } from 'react'
import { ChevronsUpDown } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination'
import {
  NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList,
  NavigationMenuTrigger, navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { Button } from '@/components/ui/button'
import type { Demo } from './_types'

function CollapsibleDemo() {
  const [open, setOpen] = useState(false)
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="max-w-sm space-y-2">
      <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
        <span className="font-medium">Detalhes da vaga</span>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Alternar detalhes"><ChevronsUpDown className="size-4" /></Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-2 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        <p>Modelo: Híbrido · São Paulo</p>
        <p>Senioridade: Pleno</p>
      </CollapsibleContent>
    </Collapsible>
  )
}

export const NAVEGACAO_DEMOS: Demo[] = [
  {
    id: 'tabs', component: 'tabs', section: 'navegacao', title: 'Tabs',
    desc: 'Tablist + tabpanel; setas navegam entre abas.',
    Render: () => (
      <Tabs defaultValue="conta" className="max-w-md">
        <TabsList>
          <TabsTrigger value="conta">Conta</TabsTrigger>
          <TabsTrigger value="senha">Senha</TabsTrigger>
          <TabsTrigger value="time">Time</TabsTrigger>
        </TabsList>
        <TabsContent value="conta" className="pt-3 text-sm text-muted-foreground">Dados da conta e preferências gerais.</TabsContent>
        <TabsContent value="senha" className="pt-3 text-sm text-muted-foreground">Troca de senha e 2FA.</TabsContent>
        <TabsContent value="time" className="pt-3 text-sm text-muted-foreground">Membros do time e permissões.</TabsContent>
      </Tabs>
    ),
  },
  {
    id: 'accordion', component: 'accordion', section: 'navegacao', title: 'Accordion',
    desc: 'Conteúdo expansível; o gatilho é um heading + button.',
    Render: () => (
      <Accordion type="single" collapsible className="w-full max-w-md">
        <AccordionItem value="1">
          <AccordionTrigger headingLevel={3}>O tema troca em runtime?</AccordionTrigger>
          <AccordionContent>Sim — alternando [data-brand] e .dark no html. Nenhum rebuild.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="2">
          <AccordionTrigger headingLevel={3}>De onde vêm as cores?</AccordionTrigger>
          <AccordionContent>100% do contrato de @crp/design-tokens (OKLCH).</AccordionContent>
        </AccordionItem>
      </Accordion>
    ),
  },
  {
    id: 'breadcrumb', component: 'breadcrumb', section: 'navegacao', title: 'Breadcrumb',
    desc: 'Trilha de navegação com a página atual marcada.',
    Render: () => (
      <Breadcrumb aria-label="Exemplo de breadcrumb">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="#">Início</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink href="#">Vagas</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Desenvolvedor Backend</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    ),
  },
  {
    id: 'pagination', component: 'pagination', section: 'navegacao', title: 'Pagination',
    desc: 'Navegação de páginas (nav + página atual).',
    Render: () => (
      <Pagination>
        <PaginationContent>
          <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
          <PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem>
          <PaginationItem><PaginationLink href="#" isActive>2</PaginationLink></PaginationItem>
          <PaginationItem><PaginationLink href="#">3</PaginationLink></PaginationItem>
          <PaginationItem><PaginationEllipsis /></PaginationItem>
          <PaginationItem><PaginationNext href="#" /></PaginationItem>
        </PaginationContent>
      </Pagination>
    ),
  },
  {
    id: 'navigation-menu', component: 'navigation-menu', section: 'navegacao', title: 'Navigation Menu',
    desc: 'Navegação com submenus em painel flutuante.',
    Render: () => (
      <NavigationMenu aria-label="Navegação de exemplo">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[280px] gap-1 p-2">
                <li><NavigationMenuLink href="#">Visão geral</NavigationMenuLink></li>
                <li><NavigationMenuLink href="#">Integrações</NavigationMenuLink></li>
                <li><NavigationMenuLink href="#">Novidades</NavigationMenuLink></li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#" className={navigationMenuTriggerStyle()}>Preços</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    ),
  },
  {
    id: 'collapsible', component: 'collapsible', section: 'navegacao', title: 'Collapsible',
    desc: 'Mostra/esconde um trecho (disclosure).',
    Render: CollapsibleDemo,
  },
  {
    id: 'carousel', component: 'carousel', section: 'navegacao', title: 'Carousel',
    desc: 'Slides navegáveis (botões focáveis); região com aria-roledescription.',
    Render: () => (
      <Carousel className="mx-auto w-full max-w-xs">
        <CarouselContent>
          {[1, 2, 3, 4].map((n) => (
            <CarouselItem key={n}>
              <div className="flex h-28 items-center justify-center rounded-lg border bg-muted/40 text-2xl font-semibold tabular-nums">{n}</div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    ),
  },
]
