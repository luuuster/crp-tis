import { useEffect, useState } from 'react'
import { Bell, Check, ChevronDown, Loader2, LogOut, Moon, Settings, Sun, User } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Toaster } from '@/components/ui/sonner'

type Brand = 'crp' | 'marca-b'
type Mode = 'light' | 'dark'

const PESSOAS = [
  { nome: 'Marina Alves', cargo: 'Head de RH', time: 'RH', ativo: true },
  { nome: 'João Pereira', cargo: 'Engenheiro', time: 'Engenharia', ativo: true },
  { nome: 'Ana Souza', cargo: 'Designer', time: 'Produto', ativo: false },
  { nome: 'Caio Rocha', cargo: 'PM', time: 'Produto', ativo: true },
]

export function App() {
  const [brand, setBrand] = useState<Brand>('crp')
  const [mode, setMode] = useState<Mode>('light')

  // Re-tematiza tudo igual aos previews: classe .dark + atributo [data-brand] no <html>.
  // Os tokens do CRP (importados em main.tsx) cuidam do resto — zero cor escrita à mão aqui.
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', mode === 'dark')
    if (brand === 'marca-b') root.setAttribute('data-brand', 'marca-b')
    else root.removeAttribute('data-brand')
  }, [brand, mode])

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-dvh bg-background text-foreground">
        {/* ===== Header ===== */}
        <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-6">
            <div className="flex items-center gap-2 font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
              <span className="grid size-8 place-items-center rounded-md bg-primary font-bold text-primary-foreground">C</span>
              CRP <span className="font-normal text-muted-foreground">Design System</span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Tabs value={brand} onValueChange={(v) => setBrand(v as Brand)}>
                <TabsList>
                  <TabsTrigger value="crp">CRP</TabsTrigger>
                  <TabsTrigger value="marca-b">Marca B</TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                variant="outline"
                size="icon"
                aria-label={mode === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
                onClick={() => setMode((m) => (m === 'dark' ? 'light' : 'dark'))}
              >
                {mode === 'dark' ? <Sun /> : <Moon />}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2">
                    <Avatar className="size-7"><AvatarFallback>MA</AvatarFallback></Avatar>
                    <ChevronDown className="size-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Marina Alves</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem><User /> Perfil</DropdownMenuItem>
                  <DropdownMenuItem><Settings /> Configurações</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive"><LogOut /> Sair</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* ===== Conteúdo ===== */}
        <main className="mx-auto max-w-5xl space-y-10 px-6 py-10">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="#">Início</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Componentes</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <section className="space-y-3">
            <Badge variant="secondary">shadcn/ui × @crp/design-tokens</Badge>
            <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
              Componentes tematizados pelos seus tokens
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Troque a <strong className="text-foreground">marca</strong> (CRP / Marca B) e o
              {' '}<strong className="text-foreground">tema</strong> (claro/escuro) no topo — cada componente do shadcn
              re-tematiza em runtime, direto do contrato de tokens. Nenhuma cor escrita à mão.
            </p>
          </section>

          {/* Botões */}
          <Card>
            <CardHeader>
              <CardTitle>Botões</CardTitle>
              <CardDescription>Variantes, tamanhos e estados — primary/secondary/destructive seguem a marca.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Excluir</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Separator orientation="vertical" className="h-8" />
              <Button disabled><Loader2 className="animate-spin" /> Carregando</Button>
              <Button size="sm">Pequeno</Button>
              <Button size="lg">Grande</Button>
            </CardContent>
          </Card>

          {/* Formulário */}
          <Card>
            <CardHeader>
              <CardTitle>Formulário</CardTitle>
              <CardDescription>Input, textarea, select, checkbox, switch e radio — foco usa o anel (ring) da marca.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="voce@empresa.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Cargo</Label>
                <Select>
                  <SelectTrigger id="role"><SelectValue placeholder="Selecione…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rh">RH</SelectItem>
                    <SelectItem value="eng">Engenharia</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" placeholder="Conte um pouco sobre você…" />
              </div>
              <label className="flex items-center gap-2" htmlFor="remember">
                <Checkbox id="remember" defaultChecked />
                <span className="text-sm">Lembrar de mim</span>
              </label>
              <label className="flex items-center gap-2" htmlFor="notif">
                <Switch id="notif" defaultChecked />
                <span className="text-sm">Notificações por e-mail</span>
              </label>
              <div className="sm:col-span-2">
                <Label className="mb-2 block">Plano</Label>
                <RadioGroup defaultValue="mensal" className="flex gap-6">
                  <label className="flex items-center gap-2" htmlFor="p-mensal"><RadioGroupItem value="mensal" id="p-mensal" /><span className="text-sm">Mensal</span></label>
                  <label className="flex items-center gap-2" htmlFor="p-anual"><RadioGroupItem value="anual" id="p-anual" /><span className="text-sm">Anual</span></label>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Tabela */}
          <Card>
            <CardHeader>
              <CardTitle>Tabela</CardTitle>
              <CardDescription>Colaboradores e status — usa Badge para o estado.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PESSOAS.map((p) => (
                    <TableRow key={p.nome}>
                      <TableCell className="font-medium">{p.nome}</TableCell>
                      <TableCell>{p.cargo}</TableCell>
                      <TableCell>{p.time}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={p.ativo ? 'secondary' : 'outline'}>{p.ativo ? 'Ativo' : 'Pausado'}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Dados & controles */}
          <Card>
            <CardHeader>
              <CardTitle>Dados & controles</CardTitle>
              <CardDescription>Progress, slider e estados de carregamento (skeleton).</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span>Onboarding</span><span className="text-muted-foreground">66%</span></div>
                <Progress value={66} />
              </div>
              <div className="space-y-2">
                <Label>Volume</Label>
                <Slider defaultValue={[40]} max={100} step={1} />
              </div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <Skeleton className="size-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feedback & overlays */}
          <Card>
            <CardHeader>
              <CardTitle>Feedback & overlays</CardTitle>
              <CardDescription>Badges, alerta, diálogo, popover, tooltip e toast.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>

              <Alert>
                <Check />
                <AlertTitle>Tudo certo</AlertTitle>
                <AlertDescription>Suas alterações foram salvas com sucesso.</AlertDescription>
              </Alert>

              <div className="flex flex-wrap gap-3">
                <Dialog>
                  <DialogTrigger asChild><Button variant="outline">Abrir diálogo</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Editar perfil</DialogTitle>
                      <DialogDescription>Atualize seus dados. Salve quando terminar.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2 py-2">
                      <Label htmlFor="name">Nome</Label>
                      <Input id="name" defaultValue="Marina Alves" />
                    </div>
                    <DialogFooter>
                      <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                      <Button onClick={() => toast.success('Perfil atualizado')}>Salvar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Popover>
                  <PopoverTrigger asChild><Button variant="outline">Abrir popover</Button></PopoverTrigger>
                  <PopoverContent className="text-sm">Conteúdo flutuante, na superfície <code>popover</code> do tema.</PopoverContent>
                </Popover>

                <Tooltip>
                  <TooltipTrigger asChild><Button variant="outline" size="icon" aria-label="Notificações"><Bell /></Button></TooltipTrigger>
                  <TooltipContent>3 novas notificações</TooltipContent>
                </Tooltip>

                <Button variant="secondary" onClick={() => toast('Mensagem enviada', { description: 'Há poucos segundos' })}>
                  Disparar toast
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Navegação & conteúdo */}
          <Card>
            <CardHeader>
              <CardTitle>Navegação & conteúdo</CardTitle>
              <CardDescription>Tabs e accordion.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="conta">
                <TabsList>
                  <TabsTrigger value="conta">Conta</TabsTrigger>
                  <TabsTrigger value="senha">Senha</TabsTrigger>
                  <TabsTrigger value="time">Time</TabsTrigger>
                </TabsList>
                <TabsContent value="conta" className="pt-3 text-sm text-muted-foreground">Dados da conta e preferências gerais.</TabsContent>
                <TabsContent value="senha" className="pt-3 text-sm text-muted-foreground">Troca de senha e 2FA.</TabsContent>
                <TabsContent value="time" className="pt-3 text-sm text-muted-foreground">Membros do time e permissões.</TabsContent>
              </Tabs>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="1">
                  <AccordionTrigger>O tema troca em runtime?</AccordionTrigger>
                  <AccordionContent>Sim — alternando <code>[data-brand]</code> e <code>.dark</code> no <code>html</code>. Nenhum rebuild.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="2">
                  <AccordionTrigger>De onde vêm as cores?</AccordionTrigger>
                  <AccordionContent>100% do contrato de <code>@crp/design-tokens</code> (OKLCH), mapeado pro Tailwind via <code>@theme inline</code>.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="3">
                  <AccordionTrigger>É shadcn de verdade?</AccordionTrigger>
                  <AccordionContent>Sim — os componentes oficiais, adicionados pelo CLI. Só trocamos a fonte do tema.</AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <p className="pb-6 text-center text-sm text-muted-foreground">
            {brand === 'crp' ? 'CRP' : 'Marca B'} · tema {mode === 'dark' ? 'escuro' : 'claro'} ·
            57 componentes shadcn/ui tematizados por @crp/design-tokens
          </p>
        </main>

        <Toaster />
      </div>
    </TooltipProvider>
  )
}
