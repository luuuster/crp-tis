/**
 * Lista (banco de talentos) — KPIs + tabela com filtros e paginação. Estado de filtro/página VIVE no
 * orquestrador (pages/Candidatos.tsx); aqui só desce o JSX, recebendo dados e handlers por props (os
 * setters continuam sendo chamados em handlers, nunca em effect). ColFilter é privado deste arquivo.
 */
import { ClipboardCheck, LayoutList, Search, UserCheck, Users, Video } from 'lucide-react'

import { cn } from '@/lib/utils'
import { CARD } from '@/lib/surfaces'
import { iniciais } from '@/lib/format'
import { tintFor } from '@/lib/avatar'
import { PageContainer, PageHeader, StatCard, Paginacao } from '@/components/page'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Candidato, ETAPA_FILTROS } from './types'
import { EtapaBadge, scoreTint } from './styles'

function ColFilter({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: readonly string[]; label: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" aria-label={label} className="w-full font-normal"><SelectValue /></SelectTrigger>
      <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
    </Select>
  )
}

export function ListaCandidatos({
  cands, filtrados, pageItems,
  etapaF, vagaF, senioridadeF, q,
  vagas, senioridades, etapaFiltros,
  page, total, inicio, totalItems,
  emEntrevista, entrevistados, contratados,
  onEtapaF, onVagaF, onSenioridadeF, onBusca,
  onPage, onAbrir,
}: {
  cands: Candidato[]; filtrados: Candidato[]; pageItems: Candidato[]
  etapaF: string; vagaF: string; senioridadeF: string; q: string
  vagas: string[]; senioridades: string[]; etapaFiltros: typeof ETAPA_FILTROS
  page: number; total: number; inicio: number; totalItems: number
  emEntrevista: number; entrevistados: number; contratados: number
  onEtapaF: (v: string) => void; onVagaF: (v: string) => void; onSenioridadeF: (v: string) => void; onBusca: (v: string) => void
  onPage: (p: number | ((prev: number) => number)) => void; onAbrir: (c: Candidato) => void
}) {
  return (
    <PageContainer>
      <PageHeader
        icon={Users}
        title="Banco de talentos"
        desc="Veja todos os candidatos e em que etapa cada um está. Clique em um candidato para ver o histórico completo — quantos processos já participou e como foi em cada um."
      />

      {/* KPIs */}
      <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total de candidatos" value={cands.length} />
        <StatCard icon={Video} label="Em entrevista" value={emEntrevista} />
        <StatCard icon={ClipboardCheck} label="Entrevistados" value={entrevistados} />
        <StatCard icon={UserCheck} label="Contratados" value={contratados} />
      </section>

      {/* Banco — filtros DENTRO do card */}
      <section aria-labelledby="lista-candidatos" className={cn(CARD, 'overflow-hidden')}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 p-4 sm:p-5">
          <h2 id="lista-candidatos" className="flex items-center gap-2 ty-body-lg text-foreground" style={{ fontWeight: 'var(--font-weight-bold)' }}>
            <LayoutList className="size-5 shrink-0 text-primary-text" aria-hidden /> Candidatos
            <span className="ty-body-sm font-normal text-muted-foreground tabular-nums">({filtrados.length})</span>
          </h2>
        </div>

        <Table className="[&_:is(th,td):first-child]:pl-5 [&_:is(th,td):last-child]:pr-5">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="ty-caption font-semibold tracking-wide text-muted-foreground uppercase">Candidato</TableHead>
              <TableHead className="ty-caption font-semibold tracking-wide text-muted-foreground uppercase">Vaga de interesse</TableHead>
              <TableHead className="ty-caption font-semibold tracking-wide text-muted-foreground uppercase">Senioridade</TableHead>
              <TableHead className="ty-caption font-semibold tracking-wide text-muted-foreground uppercase">Pontuação</TableHead>
              <TableHead className="ty-caption font-semibold tracking-wide text-muted-foreground uppercase">Etapa</TableHead>
              <TableHead className="ty-caption font-semibold tracking-wide text-muted-foreground uppercase">Atualizado</TableHead>
            </TableRow>
            {/* Linha de FILTRO — barra de ferramentas (td, não th: não são cabeçalhos de coluna). */}
            <TableRow className="bg-muted/20 hover:bg-muted/20">
              <TableCell className="py-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input value={q} onChange={(e) => onBusca(e.target.value)} placeholder="Buscar nome ou e-mail…" aria-label="Buscar candidato por nome ou e-mail" className="h-8 pl-8 ty-body-sm font-normal" />
                </div>
              </TableCell>
              <TableCell className="py-2"><ColFilter value={vagaF} onChange={onVagaF} options={vagas} label="Filtrar por vaga" /></TableCell>
              <TableCell className="py-2"><ColFilter value={senioridadeF} onChange={onSenioridadeF} options={senioridades} label="Filtrar por senioridade" /></TableCell>
              <TableCell className="py-2" />
              <TableCell className="py-2"><ColFilter value={etapaF} onChange={onEtapaF} options={etapaFiltros} label="Filtrar por etapa" /></TableCell>
              <TableCell className="py-2" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-14 text-center ty-body-sm text-muted-foreground">Nenhum candidato encontrado com esses filtros.</TableCell>
              </TableRow>
            ) : (
              pageItems.map((c) => (
                // Linha clicável abre o perfil. O botão do nome é o acesso por teclado/leitor de tela.
                <TableRow key={c.id} onClick={() => onAbrir(c)} className="cursor-pointer">
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full ty-caption font-semibold', tintFor(c.nome))} aria-hidden>{iniciais(c.nome)}</span>
                      <div className="min-w-0">
                        <button type="button" onClick={(e) => { e.stopPropagation(); onAbrir(c) }} className="block max-w-full truncate rounded-sm text-left ty-body-sm font-medium text-foreground transition-colors hover:text-primary-text focus-visible:focus-ring">{c.nome}</button>
                        <p className="truncate ty-caption text-muted-foreground">{c.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 ty-body-sm text-muted-foreground">{c.vaga}</TableCell>
                  <TableCell className="py-3"><Badge variant="ghost" className="bg-primary/10 ty-caption font-medium text-primary-text">{c.senioridade}</Badge></TableCell>
                  <TableCell className="py-3"><Badge variant="ghost" className={cn('ty-caption font-semibold tabular-nums', scoreTint(c.score))}>{c.score}%</Badge></TableCell>
                  <TableCell className="py-3"><EtapaBadge value={c.etapa} /></TableCell>
                  <TableCell className="py-3 ty-body-sm text-muted-foreground">{c.atualizado}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Paginação — barra abaixo da tabela (10 itens por página) */}
        {filtrados.length > 0 && (
          <div className="p-4 sm:p-5">
            <Paginacao page={page} total={total} inicio={inicio} shown={pageItems.length} totalItems={totalItems} onPage={onPage} />
          </div>
        )}
      </section>
    </PageContainer>
  )
}
