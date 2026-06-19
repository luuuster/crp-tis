import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import { Inbox, UserPlus } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Button } from '@/components/ui/button'
import {
  Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle,
} from '@/components/ui/empty'
import {
  Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle,
} from '@/components/ui/item'
import type { Demo } from './_types'

const PESSOAS = [
  { nome: 'Marina Alves', cargo: 'Head de RH', time: 'RH', ativo: true },
  { nome: 'João Pereira', cargo: 'Engenheiro', time: 'Engenharia', ativo: true },
  { nome: 'Ana Souza', cargo: 'Designer', time: 'Produto', ativo: false },
]

const CHART_DATA = [
  { mes: 'Jan', total: 12 }, { mes: 'Fev', total: 19 }, { mes: 'Mar', total: 15 },
  { mes: 'Abr', total: 27 }, { mes: 'Mai', total: 22 }, { mes: 'Jun', total: 31 },
]
const CHART_CONFIG = { total: { label: 'Contratações', color: 'var(--chart-1)' } } satisfies ChartConfig

export const DADOS_DEMOS: Demo[] = [
  {
    id: 'badge', component: 'badge', section: 'dados', title: 'Badge',
    desc: 'Rótulo de status; variantes seguem a marca.',
    Render: () => (
      <div className="flex flex-wrap gap-2">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="outline">Outline</Badge>
      </div>
    ),
  },
  {
    id: 'avatar', component: 'avatar', section: 'dados', title: 'Avatar',
    desc: 'Imagem com fallback de iniciais; grupo com contagem.',
    Render: () => (
      <div className="flex items-center gap-6">
        <Avatar><AvatarFallback>MA</AvatarFallback></Avatar>
        <AvatarGroup>
          <Avatar><AvatarFallback>MA</AvatarFallback></Avatar>
          <Avatar><AvatarFallback>JP</AvatarFallback></Avatar>
          <Avatar><AvatarFallback>AS</AvatarFallback></Avatar>
          <AvatarGroupCount>+5</AvatarGroupCount>
        </AvatarGroup>
      </div>
    ),
  },
  {
    id: 'progress', component: 'progress', section: 'dados', title: 'Progress',
    desc: 'Barra de progresso (role=progressbar) com rótulo acessível.',
    Render: () => (
      <div className="max-w-sm space-y-2">
        <div className="flex justify-between text-sm"><span>Onboarding</span><span className="text-muted-foreground">66%</span></div>
        <Progress value={66} aria-label="Onboarding: 66% concluído" />
      </div>
    ),
  },
  {
    id: 'skeleton', component: 'skeleton', section: 'dados', title: 'Skeleton',
    desc: 'Placeholder visual de carregamento (decorativo).',
    Render: () => (
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    ),
  },
  {
    id: 'spinner', component: 'spinner', section: 'dados', title: 'Spinner',
    desc: 'Indicador de carregamento (movimento essencial; respeita reduced-motion).',
    Render: () => (
      <div className="flex items-center gap-3">
        <Spinner />
        <span className="text-sm text-muted-foreground">Carregando…</span>
      </div>
    ),
  },
  {
    id: 'kbd', component: 'kbd', section: 'dados', title: 'Kbd',
    desc: 'Representação de teclas e atalhos.',
    Render: () => (
      <div className="flex items-center gap-3 text-sm">
        <span>Buscar:</span>
        <KbdGroup><Kbd>⌘</Kbd><Kbd>K</Kbd></KbdGroup>
        <span>Salvar:</span>
        <KbdGroup><Kbd>Ctrl</Kbd><Kbd>S</Kbd></KbdGroup>
      </div>
    ),
  },
  {
    id: 'table', component: 'table', section: 'dados', title: 'Table',
    desc: 'Tabela semântica (cabeçalho/linha/célula).',
    Render: () => (
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
    ),
  },
  {
    id: 'chart', component: 'chart', section: 'dados', title: 'Chart',
    desc: 'Gráfico (recharts) tematizado por tokens; números acompanham em legenda/tabela.',
    tokens: ['--chart-1', '--border', '--muted-foreground'],
    Render: () => (
      <ChartContainer config={CHART_CONFIG} className="h-[200px] w-full">
        <BarChart accessibilityLayer data={CHART_DATA}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Bar dataKey="total" fill="var(--color-total)" radius={6} />
        </BarChart>
      </ChartContainer>
    ),
  },
  {
    id: 'item', component: 'item', section: 'dados', title: 'Item',
    desc: 'Linha de lista com mídia, conteúdo e ações.',
    Render: () => (
      <ItemGroup className="max-w-md gap-2">
        <Item variant="outline" role="listitem">
          <ItemMedia variant="icon"><UserPlus /></ItemMedia>
          <ItemContent>
            <ItemTitle>Marina Alves</ItemTitle>
            <ItemDescription>Head de RH · convidada há 2 dias</ItemDescription>
          </ItemContent>
          <ItemActions><Button size="sm" variant="ghost">Ver</Button></ItemActions>
        </Item>
        <Item variant="muted" role="listitem">
          <ItemMedia variant="icon"><UserPlus /></ItemMedia>
          <ItemContent>
            <ItemTitle>João Pereira</ItemTitle>
            <ItemDescription>Engenheiro · ativo</ItemDescription>
          </ItemContent>
          <ItemActions><Button size="sm" variant="ghost">Ver</Button></ItemActions>
        </Item>
      </ItemGroup>
    ),
  },
  {
    id: 'empty', component: 'empty', section: 'dados', title: 'Empty',
    desc: 'Estado vazio com ícone, texto e ação.',
    Render: () => (
      <Empty className="max-w-md border">
        <EmptyHeader>
          <EmptyMedia variant="icon"><Inbox /></EmptyMedia>
          <EmptyTitle>Sem candidatos ainda</EmptyTitle>
          <EmptyDescription>Quando alguém se inscrever na vaga, aparece aqui.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent><Button size="sm">Convidar candidato</Button></EmptyContent>
      </Empty>
    ),
  },
]
