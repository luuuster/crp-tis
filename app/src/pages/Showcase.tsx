import { Bell, Check, ChevronDown, Link2, Loader2, LogOut, Settings, User } from 'lucide-react'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const PESSOAS = [
  { nome: 'Marina Alves', cargo: 'Head de RH', time: 'RH', ativo: true },
  { nome: 'João Pereira', cargo: 'Engenheiro', time: 'Engenharia', ativo: true },
  { nome: 'Ana Souza', cargo: 'Designer', time: 'Produto', ativo: false },
  { nome: 'Caio Rocha', cargo: 'PM', time: 'Produto', ativo: true },
]

// Metadados das seções — fonte única do índice (TOC) E dos cabeçalhos: id (âncora), título e
// os tokens de contrato que cada família consome (documentação viva — "que token isto usa?").
const SECTIONS = [
  { id: 'botoes', title: 'Botões', tokens: ['--primary', '--primary-foreground', '--secondary', '--destructive', '--ring'] },
  { id: 'formulario', title: 'Formulário', tokens: ['--input', '--ring', '--foreground', '--muted-foreground'] },
  { id: 'tabela', title: 'Tabela', tokens: ['--card', '--border', '--muted-foreground'] },
  { id: 'dados', title: 'Dados & controles', tokens: ['--primary', '--muted', '--secondary'] },
  { id: 'feedback', title: 'Feedback & overlays', tokens: ['--popover', '--accent', '--destructive'] },
  { id: 'navegacao', title: 'Navegação & conteúdo', tokens: ['--muted', '--background', '--ring'] },
] as const

// Chips dos tokens — texto em muted-foreground sobre a superfície (par validado AA no check.mjs),
// borda em --border (não-textual, 3:1). Documenta sem competir com o conteúdo.
function TokenChips({ tokens }: { tokens: readonly string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Tokens usados nesta seção">
      {tokens.map((t) => (
        <li key={t}>
          <code className="inline-block rounded-md border px-2 py-0.5 font-mono text-xs leading-5 text-muted-foreground">
            {t}
          </code>
        </li>
      ))}
    </ul>
  )
}

// Cabeçalho de seção: h2 ancorado (scroll-mt p/ não sumir sob a dock fixa) + chips de tokens.
function SectionHeader({ id, title, tokens }: (typeof SECTIONS)[number]) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
      <h2 id={`h-${id}`} className="group/h flex items-center gap-2 font-heading text-xl font-semibold tracking-tight">
        {title}
        <a
          href={`#${id}`}
          aria-label={`Link para a seção ${title}`}
          className="text-muted-foreground opacity-0 transition-opacity group-hover/h:opacity-100 focus-visible:opacity-100 focus-visible:outline-none"
        >
          <Link2 className="size-4" />
        </a>
      </h2>
      <TokenChips tokens={tokens} />
    </div>
  )
}

// Índice navegável (TOC). Sidebar fixa no desktop; <details> recolhível no mobile — ambos só âncoras.
function CatalogNav() {
  const links = SECTIONS.map((s) => (
    <li key={s.id}>
      <a href={`#${s.id}`} className="block rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground focus-visible:outline-none">
        {s.title}
      </a>
    </li>
  ))
  return (
    <>
      <details className="rounded-lg border bg-card p-3 text-sm lg:hidden">
        <summary className="cursor-pointer font-medium">Índice de componentes</summary>
        <ul className="mt-2 space-y-0.5">{links}</ul>
      </details>
      <nav aria-label="Índice de componentes" className="hidden lg:block">
        <div className="sticky top-20">
          <p className="mb-2 px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Nesta página</p>
          <ul className="space-y-0.5 text-sm">{links}</ul>
        </div>
      </nav>
    </>
  )
}

export function Showcase() {
  return (
    <main className="mx-auto max-w-6xl px-6 pt-20 pb-16">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="#">Início</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Componentes</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="mb-10 space-y-3">
        <Badge variant="secondary">shadcn/ui × @crp/design-tokens</Badge>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Componentes tematizados pelos seus tokens
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Troque a <strong className="text-foreground">marca</strong> e o <strong className="text-foreground">tema</strong> no
          canto superior direito — cada componente do shadcn re-tematiza em runtime, direto do contrato de tokens.
          Cada seção lista os <strong className="text-foreground">tokens</strong> que consome.
        </p>
      </section>

      <div className="lg:grid lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-10">
        <CatalogNav />

        <div className="min-w-0 space-y-12">
          {/* Botões */}
          <section id="botoes" aria-labelledby="h-botoes" className="scroll-mt-24 space-y-4">
            <SectionHeader {...SECTIONS[0]} />
            <Card>
              <CardHeader>
                <CardTitle>Variantes, tamanhos e estados</CardTitle>
                <CardDescription>primary/secondary/destructive seguem a marca; o anel de foco usa <code>--ring</code>.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <Button>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="destructive">Excluir</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                </div>
                <Separator />
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">Estados:</span>
                    <Button disabled>Desabilitado</Button>
                    <Button disabled><Loader2 className="animate-spin" /> Carregando</Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">Tamanhos:</span>
                    <Button size="sm">Pequeno</Button>
                    <Button>Médio</Button>
                    <Button size="lg">Grande</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Formulário */}
          <section id="formulario" aria-labelledby="h-formulario" className="scroll-mt-24 space-y-4">
            <SectionHeader {...SECTIONS[1]} />
            <Card>
              <CardHeader>
                <CardTitle>Campos e seletores</CardTitle>
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
          </section>

          {/* Tabela */}
          <section id="tabela" aria-labelledby="h-tabela" className="scroll-mt-24 space-y-4">
            <SectionHeader {...SECTIONS[2]} />
            <Card>
              <CardHeader>
                <CardTitle>Colaboradores</CardTitle>
                <CardDescription>Linhas e status — usa Badge para o estado.</CardDescription>
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
          </section>

          {/* Dados & controles */}
          <section id="dados" aria-labelledby="h-dados" className="scroll-mt-24 space-y-4">
            <SectionHeader {...SECTIONS[3]} />
            <Card>
              <CardHeader>
                <CardTitle>Progresso, slider e carregamento</CardTitle>
                <CardDescription>Progress, slider e estados de carregamento (skeleton).</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span>Onboarding</span><span className="text-muted-foreground">66%</span></div>
                  <Progress value={66} aria-label="Onboarding: 66% concluído" />
                </div>
                <div className="space-y-2">
                  <Label id="volume-label">Volume</Label>
                  <Slider defaultValue={[40]} max={100} step={1} aria-labelledby="volume-label" />
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
          </section>

          {/* Feedback & overlays */}
          <section id="feedback" aria-labelledby="h-feedback" className="scroll-mt-24 space-y-4">
            <SectionHeader {...SECTIONS[4]} />
            <Card>
              <CardHeader>
                <CardTitle>Badges, alertas e flutuantes</CardTitle>
                <CardDescription>Badges, alerta, diálogo, popover, menu, tooltip e toast.</CardDescription>
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

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2">
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
          </section>

          {/* Navegação & conteúdo */}
          <section id="navegacao" aria-labelledby="h-navegacao" className="scroll-mt-24 space-y-4">
            <SectionHeader {...SECTIONS[5]} />
            <Card>
              <CardHeader>
                <CardTitle>Tabs e accordion</CardTitle>
                <CardDescription>Navegação interna e conteúdo expansível.</CardDescription>
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

                {/* h3: fica sob o h2 da seção (ordem de heading correta) */}
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="1">
                    <AccordionTrigger headingLevel={3}>O tema troca em runtime?</AccordionTrigger>
                    <AccordionContent>Sim — alternando <code>[data-brand]</code> e <code>.dark</code> no <code>html</code>. Nenhum rebuild.</AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="2">
                    <AccordionTrigger headingLevel={3}>De onde vêm as cores?</AccordionTrigger>
                    <AccordionContent>100% do contrato de <code>@crp/design-tokens</code> (OKLCH), mapeado pro Tailwind via <code>@theme inline</code>.</AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="3">
                    <AccordionTrigger headingLevel={3}>É shadcn de verdade?</AccordionTrigger>
                    <AccordionContent>Sim — os componentes oficiais, adicionados pelo CLI. Só trocamos a fonte do tema.</AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </section>

          <p className="pt-2 text-center text-sm text-muted-foreground">
            57 componentes shadcn/ui tematizados por @crp/design-tokens
          </p>
        </div>
      </div>
    </main>
  )
}
