/**
 * Lista (banco de talentos) — KPIs + tabela com filtros e paginação. Estado de filtro/página VIVE no
 * orquestrador (pages/Candidatos.tsx); aqui só desce o JSX, recebendo dados e handlers por props (os
 * setters continuam sendo chamados em handlers, nunca em effect). ColFilter é privado deste arquivo.
 */
import { ClipboardCheck, LayoutList, Search, UserCheck, Users, Video } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { CARD } from '@/lib/surfaces'
import { iniciais } from '@/lib/format'
import { tintFor } from '@/lib/avatar'
import { exportCsv } from '@/lib/exportCsv'
import { ExportButton } from '@/components/ExportButton'
import { PageContainer, PageHeader, StatCard, Paginacao, EmptyState, TableSkeleton, ErrorState } from '@/components/page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Candidato, ETAPA_FILTROS } from './types'
import { EtapaBadge, scoreTint, useSenioridadeLabel } from './styles'

// Filtro de coluna: o VALOR canônico pt-BR é a opção (preserva comparações/estado); `renderLabel` traduz a EXIBIÇÃO.
function ColFilter({ value, onChange, options, label, renderLabel }: { value: string; onChange: (v: string) => void; options: readonly string[]; label: string; renderLabel: (v: string) => string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" aria-label={label} className="w-full font-normal"><SelectValue /></SelectTrigger>
      <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{renderLabel(o)}</SelectItem>)}</SelectContent>
    </Select>
  )
}

export function ListaCandidatos({
  cands, loading, error, onRetry, filtrados, pageItems,
  etapaF, vagaF, senioridadeF, q,
  vagas, senioridades, etapaFiltros,
  page, total, inicio, totalItems,
  emEntrevista, entrevistados, contratados,
  onEtapaF, onVagaF, onSenioridadeF, onBusca,
  onPage, onAbrir,
}: {
  cands: Candidato[]; loading: boolean; error: boolean; onRetry: () => void; filtrados: Candidato[]; pageItems: Candidato[]
  etapaF: string; vagaF: string; senioridadeF: string; q: string
  vagas: string[]; senioridades: string[]; etapaFiltros: typeof ETAPA_FILTROS
  page: number; total: number; inicio: number; totalItems: number
  emEntrevista: number; entrevistados: number; contratados: number
  onEtapaF: (v: string) => void; onVagaF: (v: string) => void; onSenioridadeF: (v: string) => void; onBusca: (v: string) => void
  onPage: (p: number | ((prev: number) => number)) => void; onAbrir: (c: Candidato) => void
}) {
  const { t } = useTranslation('candidatos')
  const { t: tc } = useTranslation('common')
  const senLabel = useSenioridadeLabel()
  // Opção 'Todas' (filtro) reusa o genérico do common; as demais traduzem a EXIBIÇÃO mantendo o valor canônico.
  const etapaLabel = (v: string) => (v === 'Todas' ? tc('filtro.todas') : t(`etapa.${v}` as 'etapa.Triagem'))
  const senFiltroLabel = (v: string) => (v === 'Todas' ? tc('filtro.todas') : senLabel(v))
  const vagaLabel = (v: string) => (v === 'Todas' ? tc('filtro.todas') : v)

  // Estado vazio: se há filtro/busca ativos, oferece "Limpar filtros" (zera tudo via os setters do orquestrador).
  const filtrosAtivos = q !== '' || etapaF !== 'Todas' || vagaF !== 'Todas' || senioridadeF !== 'Todas'
  const limparFiltros = () => { onBusca(''); onEtapaF('Todas'); onVagaF('Todas'); onSenioridadeF('Todas') }

  // Exporta a lista FILTRADA (não só a página) — colunas traduzidas; valores de etapa/senioridade
  // exportados pelo rótulo traduzido (display), nome/e-mail/vaga ficam como estão (dados).
  const exportar = () =>
    exportCsv(t('export.arquivo'), filtrados, [
      { header: t('export.col.nome'), value: (c) => c.nome },
      { header: t('export.col.email'), value: (c) => c.email },
      { header: t('export.col.vaga'), value: (c) => c.vaga },
      { header: t('export.col.senioridade'), value: (c) => senLabel(c.senioridade) },
      { header: t('export.col.etapa'), value: (c) => t(`etapa.${c.etapa}` as 'etapa.Triagem') },
      { header: t('export.col.score'), value: (c) => `${c.score}%` },
    ])

  return (
    <PageContainer>
      <PageHeader
        icon={Users}
        title={t('header.titulo')}
        desc={t('header.descricao')}
        actions={<ExportButton onExport={exportar} disabled={filtrados.length === 0} />}
      />

      {/* KPIs */}
      <section aria-label={t('aria.indicadores')} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label={t('kpi.total')} value={cands.length} loading={loading} />
        <StatCard icon={Video} label={t('kpi.emEntrevista')} value={emEntrevista} loading={loading} />
        <StatCard icon={ClipboardCheck} label={t('kpi.entrevistados')} value={entrevistados} loading={loading} />
        <StatCard icon={UserCheck} label={t('kpi.contratados')} value={contratados} loading={loading} />
      </section>

      {/* Banco — filtros DENTRO do card */}
      <section aria-labelledby="lista-candidatos" className={cn(CARD, 'overflow-hidden')}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 p-4 sm:p-5">
          <h2 id="lista-candidatos" className="flex items-center gap-2 ty-body-lg text-foreground" style={{ fontWeight: 'var(--font-weight-bold)' }}>
            <LayoutList className="size-5 shrink-0 text-primary-text" aria-hidden /> {t('lista.titulo')}
            <span className="ty-body-sm font-normal text-muted-foreground tabular-nums">({filtrados.length})</span>
          </h2>
        </div>

        <div className="hidden md:block">
        <Table className="[&_:is(th,td):first-child]:pl-5 [&_:is(th,td):last-child]:pr-5">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="ty-caption font-semibold tracking-wide text-muted-foreground uppercase">{t('tabela.candidato')}</TableHead>
              <TableHead className="ty-caption font-semibold tracking-wide text-muted-foreground uppercase">{t('tabela.vaga')}</TableHead>
              <TableHead className="ty-caption font-semibold tracking-wide text-muted-foreground uppercase">{t('tabela.senioridade')}</TableHead>
              <TableHead className="ty-caption font-semibold tracking-wide text-muted-foreground uppercase">{t('tabela.pontuacao')}</TableHead>
              <TableHead className="ty-caption font-semibold tracking-wide text-muted-foreground uppercase">{t('tabela.etapa')}</TableHead>
              <TableHead className="ty-caption font-semibold tracking-wide text-muted-foreground uppercase">{t('tabela.atualizado')}</TableHead>
            </TableRow>
            {/* Linha de FILTRO — barra de ferramentas (td, não th: não são cabeçalhos de coluna). */}
            <TableRow className="bg-muted/20 hover:bg-muted/20">
              <TableCell className="py-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input value={q} onChange={(e) => onBusca(e.target.value)} placeholder={t('busca.placeholder')} aria-label={t('busca.aria')} className="h-8 pl-8 ty-body-sm font-normal" />
                </div>
              </TableCell>
              <TableCell className="py-2"><ColFilter value={vagaF} onChange={onVagaF} options={vagas} label={t('filtro.vaga')} renderLabel={vagaLabel} /></TableCell>
              <TableCell className="py-2"><ColFilter value={senioridadeF} onChange={onSenioridadeF} options={senioridades} label={t('filtro.senioridade')} renderLabel={senFiltroLabel} /></TableCell>
              <TableCell className="py-2" />
              <TableCell className="py-2"><ColFilter value={etapaF} onChange={onEtapaF} options={etapaFiltros} label={t('filtro.etapa')} renderLabel={etapaLabel} /></TableCell>
              <TableCell className="py-2" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeleton cols={6} />
            ) : error ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="p-0"><ErrorState onRetry={onRetry} /></TableCell>
              </TableRow>
            ) : filtrados.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="p-0">
                  <EmptyState
                    icon={Search}
                    title={t('vazio')}
                    description={tc('vazio.descricaoFiltro')}
                    action={filtrosAtivos ? <Button variant="outline" size="sm" onClick={limparFiltros}>{tc('acao.limparFiltros')}</Button> : undefined}
                  />
                </TableCell>
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
                  <TableCell className="py-3"><Badge variant="ghost" className="bg-muted ty-caption font-medium text-muted-foreground">{senLabel(c.senioridade)}</Badge></TableCell>
                  <TableCell className="py-3"><Badge variant="ghost" className={cn('ty-caption font-semibold tabular-nums', scoreTint(c.score))}>{c.score}%</Badge></TableCell>
                  <TableCell className="py-3"><EtapaBadge value={c.etapa} /></TableCell>
                  <TableCell className="py-3 ty-body-sm text-muted-foreground">{c.atualizado}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>

        {/* Mobile (<md): filtros + cards no lugar da tabela (mesmo estado/handlers). */}
        <div className="space-y-3 p-4 md:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input value={q} onChange={(e) => onBusca(e.target.value)} placeholder={t('busca.placeholder')} aria-label={t('busca.aria')} className="h-9 pl-9 ty-body-sm font-normal" />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <ColFilter value={vagaF} onChange={onVagaF} options={vagas} label={t('filtro.vaga')} renderLabel={vagaLabel} />
            <ColFilter value={senioridadeF} onChange={onSenioridadeF} options={senioridades} label={t('filtro.senioridade')} renderLabel={senFiltroLabel} />
            <ColFilter value={etapaF} onChange={onEtapaF} options={etapaFiltros} label={t('filtro.etapa')} renderLabel={etapaLabel} />
          </div>
          {loading ? null : error ? (
            <ErrorState onRetry={onRetry} />
          ) : filtrados.length === 0 ? (
            <EmptyState icon={Search} title={t('vazio')} description={tc('vazio.descricaoFiltro')} action={filtrosAtivos ? <Button variant="outline" size="sm" onClick={limparFiltros}>{tc('acao.limparFiltros')}</Button> : undefined} />
          ) : (
            <ul className="space-y-3">
              {pageItems.map((c) => (
                <li key={c.id} className={cn(CARD, 'space-y-3 p-4')}>
                  <div className="flex items-center gap-3">
                    <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full ty-caption font-semibold', tintFor(c.nome))} aria-hidden>{iniciais(c.nome)}</span>
                    <div className="min-w-0 flex-1">
                      <button type="button" onClick={() => onAbrir(c)} className="block max-w-full truncate rounded-sm text-left ty-body-sm font-medium text-foreground transition-colors hover:text-primary-text focus-visible:focus-ring">{c.nome}</button>
                      <p className="truncate ty-caption text-muted-foreground">{c.email}</p>
                    </div>
                    <Badge variant="ghost" className={cn('shrink-0 ty-caption font-semibold tabular-nums', scoreTint(c.score))}>{c.score}%</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <EtapaBadge value={c.etapa} />
                    <Badge variant="ghost" className="bg-muted ty-caption font-medium text-muted-foreground">{senLabel(c.senioridade)}</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-3 ty-caption text-muted-foreground">
                    <span className="truncate">{c.vaga}</span>
                    <span className="shrink-0">{c.atualizado}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

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
