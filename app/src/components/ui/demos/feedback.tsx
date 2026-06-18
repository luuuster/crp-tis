import { Bell, Calendar, Check, ChevronDown, LogOut, Search, Settings, Smile, User } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger,
} from '@/components/ui/drawer'
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ContextMenu, ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarTrigger,
} from '@/components/ui/menubar'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from '@/components/ui/command'
import { Toaster } from '@/components/ui/sonner'
import type { Demo } from './_types'

export const FEEDBACK_DEMOS: Demo[] = [
  {
    id: 'alert', component: 'alert', section: 'feedback', title: 'Alert',
    desc: 'Mensagem em destaque (role=alert).',
    Render: () => (
      <div className="max-w-md space-y-3">
        <Alert>
          <Check />
          <AlertTitle>Tudo certo</AlertTitle>
          <AlertDescription>Suas alterações foram salvas com sucesso.</AlertDescription>
        </Alert>
      </div>
    ),
  },
  {
    id: 'alert-dialog', component: 'alert-dialog', section: 'feedback', title: 'Alert Dialog',
    desc: 'Confirmação modal destrutiva (role=alertdialog).',
    Render: () => (
      <AlertDialog>
        <AlertDialogTrigger asChild><Button variant="destructive">Excluir conta</Button></AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita. A conta e os dados serão removidos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ),
  },
  {
    id: 'dialog', component: 'dialog', section: 'feedback', title: 'Dialog',
    desc: 'Diálogo modal com foco preso e Esc para fechar.',
    Render: () => (
      <Dialog>
        <DialogTrigger asChild><Button variant="outline">Editar perfil</Button></DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
            <DialogDescription>Atualize seus dados. Salve quando terminar.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="dlg-name">Nome</Label>
            <Input id="dlg-name" defaultValue="Marina Alves" />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={() => toast.success('Perfil atualizado')}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    ),
  },
  {
    id: 'drawer', component: 'drawer', section: 'feedback', title: 'Drawer',
    desc: 'Painel deslizante inferior (vaul); foco preso.',
    Render: () => (
      <Drawer>
        <DrawerTrigger asChild><Button variant="outline">Abrir gaveta</Button></DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Filtros</DrawerTitle>
            <DrawerDescription>Refine a busca de candidatos.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Button>Aplicar</Button>
            <DrawerClose asChild><Button variant="outline">Fechar</Button></DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    ),
  },
  {
    id: 'sheet', component: 'sheet', section: 'feedback', title: 'Sheet',
    desc: 'Painel lateral modal (role=dialog).',
    Render: () => (
      <Sheet>
        <SheetTrigger asChild><Button variant="outline">Abrir painel</Button></SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Configurações</SheetTitle>
            <SheetDescription>Ajuste suas preferências de conta.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-2 p-4">
            <Label htmlFor="sht-nome">Nome de exibição</Label>
            <Input id="sht-nome" defaultValue="Marina" />
          </div>
        </SheetContent>
      </Sheet>
    ),
  },
  {
    id: 'popover', component: 'popover', section: 'feedback', title: 'Popover',
    desc: 'Conteúdo flutuante não-modal na superfície popover.',
    Render: () => (
      <Popover>
        <PopoverTrigger asChild><Button variant="outline">Abrir popover</Button></PopoverTrigger>
        <PopoverContent className="space-y-2">
          <p className="text-sm font-medium">Dimensões</p>
          <p className="text-sm text-muted-foreground">Conteúdo flutuante na superfície popover do tema.</p>
        </PopoverContent>
      </Popover>
    ),
  },
  {
    id: 'hover-card', component: 'hover-card', section: 'feedback', title: 'Hover Card',
    desc: 'Cartão de prévia que abre em hover/foco.',
    Render: () => (
      <HoverCard>
        <HoverCardTrigger asChild><Button variant="link">@crp_ds</Button></HoverCardTrigger>
        <HoverCardContent className="w-72">
          <div className="flex gap-3">
            <Avatar><AvatarFallback>DS</AvatarFallback></Avatar>
            <div className="space-y-1">
              <p className="text-sm font-semibold">CRP Design System</p>
              <p className="text-sm text-muted-foreground">Tokens, componentes e a11y — multi-marca.</p>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    ),
  },
  {
    id: 'tooltip', component: 'tooltip', section: 'feedback', title: 'Tooltip',
    desc: 'Dica que aparece em hover/foco do gatilho.',
    Render: () => (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Notificações"><Bell /></Button>
          </TooltipTrigger>
          <TooltipContent>3 novas notificações</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
  },
  {
    id: 'dropdown-menu', component: 'dropdown-menu', section: 'feedback', title: 'Dropdown Menu',
    desc: 'Menu de ações (button aria-haspopup); setas navegam.',
    Render: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2" aria-label="Abrir menu de conta">
            <Avatar className="size-5"><AvatarFallback className="text-xs">MA</AvatarFallback></Avatar>
            Conta <ChevronDown className="size-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Marina Alves</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem><User /> Perfil</DropdownMenuItem>
          <DropdownMenuItem><Settings /> Configurações</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive-text focus:text-destructive-text"><LogOut /> Sair</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
  {
    id: 'context-menu', component: 'context-menu', section: 'feedback', title: 'Context Menu',
    desc: 'Menu de contexto (botão direito).',
    Render: () => (
      <ContextMenu>
        <ContextMenuTrigger className="flex h-24 w-full max-w-sm items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
          Área de clique direito
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Voltar</ContextMenuItem>
          <ContextMenuItem>Recarregar</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuCheckboxItem checked>Mostrar régua</ContextMenuCheckboxItem>
        </ContextMenuContent>
      </ContextMenu>
    ),
  },
  {
    id: 'menubar', component: 'menubar', section: 'feedback', title: 'Menubar',
    desc: 'Barra de menus (menubar + menu); setas navegam.',
    Render: () => (
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Arquivo</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Novo <MenubarShortcut>⌘N</MenubarShortcut></MenubarItem>
            <MenubarItem>Abrir</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Imprimir <MenubarShortcut>⌘P</MenubarShortcut></MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Editar</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Desfazer</MenubarItem>
            <MenubarItem>Refazer</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    ),
  },
  {
    id: 'command', component: 'command', section: 'feedback', title: 'Command',
    desc: 'Paleta de comandos (cmdk): combobox + listbox dentro de um Popover.',
    Render: () => (
      <Popover>
        <PopoverTrigger asChild><Button variant="outline">Abrir paleta de comandos</Button></PopoverTrigger>
        <PopoverContent className="w-72 p-0">
          <Command>
            <CommandInput placeholder="Buscar comando…" />
            <CommandList>
              <CommandEmpty>Nada encontrado.</CommandEmpty>
              <CommandGroup heading="Sugestões">
                <CommandItem><Calendar /> Agendar entrevista</CommandItem>
                <CommandItem><Smile /> Avaliar candidato</CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Ações">
                <CommandItem><User /> Perfil <CommandShortcut>⌘P</CommandShortcut></CommandItem>
                <CommandItem><Search /> Buscar vagas</CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    ),
  },
  {
    id: 'sonner', component: 'sonner', section: 'feedback', title: 'Sonner (Toast)',
    desc: 'Notificações transitórias em região aria-live (montadas app-wide).',
    Render: () => (
      <div className="flex flex-col items-start gap-3">
        <Button variant="outline" onClick={() => toast('Mensagem enviada', { description: 'Há poucos segundos' })}>
          Disparar toast
        </Button>
        <Toaster />
      </div>
    ),
  },
]
