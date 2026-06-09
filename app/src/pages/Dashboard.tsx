import { Briefcase, DollarSign, Download, TrendingDown, TrendingUp, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const KPIS = [
  { label: 'Colaboradores', valor: '1.243', delta: '+4,2%', up: true, icon: Users },
  { label: 'Taxa de ativos', valor: '94%', delta: '+1,1%', up: true, icon: TrendingUp },
  { label: 'Vagas abertas', valor: '38', delta: '-3', up: false, icon: Briefcase },
  { label: 'Custo médio', valor: 'R$ 8,9k', delta: '+2,0%', up: true, icon: DollarSign },
]

const CONTRATACOES = [
  { mes: 'Jan', total: 12 },
  { mes: 'Fev', total: 19 },
  { mes: 'Mar', total: 15 },
  { mes: 'Abr', total: 27 },
  { mes: 'Mai', total: 22 },
  { mes: 'Jun', total: 31 },
]

const chartConfig = {
  total: { label: 'Contratações', color: 'var(--chart-1)' },
} satisfies ChartConfig

const TIMES = [
  { nome: 'Engenharia', pct: 38 },
  { nome: 'Produto', pct: 22 },
  { nome: 'Comercial', pct: 18 },
  { nome: 'RH', pct: 12 },
  { nome: 'Outros', pct: 10 },
]

const RECENTES = [
  { nome: 'Marina Alves', cargo: 'Head de RH', time: 'RH', ativo: true },
  { nome: 'João Pereira', cargo: 'Engenheiro', time: 'Engenharia', ativo: true },
  { nome: 'Ana Souza', cargo: 'Designer', time: 'Produto', ativo: false },
  { nome: 'Caio Rocha', cargo: 'Product Manager', time: 'Produto', ativo: true },
  { nome: 'Bruna Lima', cargo: 'Recrutadora', time: 'RH', ativo: true },
]

function iniciais(nome: string) {
  return nome.split(' ').slice(0, 2).map((p) => p[0]).join('')
}

export function Dashboard() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-6 pt-20 pb-16">
      {/* cabeçalho da página */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>Painel de pessoas</h1>
          <p className="text-sm text-muted-foreground">Visão geral da operação de RH · junho de 2026</p>
        </div>
        <Button variant="outline"><Download /> Exportar</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map(({ label, valor, delta, up, icon: Icon }) => (
          <Card key={label}>
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-3xl tabular-nums" style={{ fontFamily: 'var(--font-heading)' }}>{valor}</CardTitle>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                <span>{delta}</span> <span>vs. mês anterior</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-4.5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* gráfico + distribuição */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Contratações por mês</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[240px] w-full">
              <BarChart accessibilityLayer data={CONTRATACOES}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="total" fill="var(--color-total)" radius={6} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por time</CardTitle>
            <CardDescription>Participação no quadro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {TIMES.map((t) => (
              <div key={t.nome} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span>{t.nome}</span>
                  <span className="tabular-nums text-muted-foreground">{t.pct}%</span>
                </div>
                <Progress value={t.pct} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* tabela de contratações recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Contratações recentes</CardTitle>
          <CardDescription>Últimas pessoas que entraram</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pessoa</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {RECENTES.map((p) => (
                <TableRow key={p.nome}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8"><AvatarFallback className="text-xs">{iniciais(p.nome)}</AvatarFallback></Avatar>
                      <span className="font-medium">{p.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.cargo}</TableCell>
                  <TableCell className="text-muted-foreground">{p.time}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={p.ativo ? 'secondary' : 'outline'}>{p.ativo ? 'Ativo' : 'Onboarding'}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}
