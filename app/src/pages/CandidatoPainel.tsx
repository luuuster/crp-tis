/**
 * Mural de VAGAS do candidato (porta :5172, rota /painel) — a tela em que o candidato cai depois de
 * definir a senha e entrar na plataforma. Lista TODAS as vagas abertas do sistema, com busca (cargo/empresa)
 * e filtros (modelo, nível, local, empresa, PcD). Clicar num card abre a descrição/inscrição real da vaga
 * (InscricaoVaga), via @/lib/vagasCatalogo (seleção persistida p/ sobreviver à navegação).
 *
 * Área LOGADA: topbar própria (logo + idioma/marca/tema + sair), diferente do dock flutuante das telas
 * públicas. 100% token-driven, multi-marca, claro/escuro e WCAG 2.2 AA.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Accessibility, ArrowRight, Briefcase, ChevronDown, CircleDollarSign, Clock, Gift, LayoutGrid, MapPin, Search, SearchX, Trash2, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { CARD } from '@/lib/surfaces'
import type { Brand, Mode } from '@/lib/useBrandMode'
import { NIVEIS, MODELOS } from '@/pages/job-generator/model'
import {
  VAGAS_CATALOGO, PAISES, estadosDe, cidadesDe, FILTRO_VAZIO, filtrarVagas, filtroAtivo, ordenarVagas, vagasAtivas, diasRestantes, type VagaPublica, type FiltroVagas, type Ordem,
} from '@/lib/vagasCatalogo'
import { usePagination } from '@/lib/usePagination'
import { estaLogado, guardarEmailCandidato } from '@/lib/candidatoSessao'
import { CandidatoShell } from '@/components/candidato/CandidatoShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageContainer, PageHeader, EmptyState, Paginacao } from '@/components/page'

const H_MD = 'h-[var(--button-height-md)]' // 40px — altura padrão dos controles de filtro (DS)

function VagaCard({ v, dias, onAbrir }: { v: VagaPublica; dias: number; onAbrir: (v: VagaPublica) => void }) {
  const { t } = useTranslation('painel')
  // Urgência do prazo: ≤7 dias destaca em âmbar (warning). "Expira hoje" quando dias === 0.
  const urgente = dias <= 7
  const prazoLabel = dias === 0 ? t('card.expiraHoje') : t('card.expiraEm', { count: dias })
  const valor = v.briefing.budget?.trim() || t('card.naoInformado')
  // Meta secundária (local/vagas/benefícios). Modelo e modalidade viram "tags"; salário tem destaque próprio.
  const metas = [
    { Icon: MapPin, txt: v.local },
    { Icon: Briefcase, txt: t('card.vagas', { count: v.briefing.quantidade }) },
    { Icon: Gift, txt: t('card.beneficios', { count: v.briefing.beneficios.length }) },
  ]
  return (
    <article className={cn(CARD, 'group flex h-full flex-col gap-4 p-5 transition-[transform,border-color,box-shadow] hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg')}>
      {/* Topo: data de publicação + prazo de expiração na MESMA linha (urgência ≤7 dias em âmbar). */}
      <div className="flex items-center justify-between gap-2 ty-caption font-medium">
        <span className="text-muted-foreground">{t('card.publicadaEm', { data: v.publicada })}</span>
        <span className={cn('flex shrink-0 items-center gap-1.5', urgente ? 'text-warning-text' : 'text-muted-foreground')}>
          <Clock className="size-3.5 shrink-0" aria-hidden /> {prazoLabel}
        </span>
      </div>

      {/* Cargo + tags (nível sólido; modelo/modalidade em contorno). Sem empresa — tudo TIS. */}
      <div className="space-y-2.5">
        <h2 className="ty-body-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary-text">{v.briefing.cargo}</h2>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="font-semibold">{v.briefing.nivel}</Badge>
          {[v.briefing.modelo, v.briefing.modalidade].map((tg) => (
            <Badge key={tg} variant="outline" className="font-medium text-muted-foreground">{tg}</Badge>
          ))}
          {/* Selo PcD movido pra cá (tags), liberando o topo para data + expiração na mesma linha. */}
          {v.pcd && (
            <Badge variant="outline" className="gap-1 font-medium text-muted-foreground">
              <Accessibility className="size-3.5" aria-hidden /> {t('card.pcd')}
            </Badge>
          )}
        </div>
      </div>

      {/* Salário + meta numa lista ÚNICA e alinhada (chip + label). Salário lidera: chip da marca + negrito. */}
      <ul className="space-y-2.5">
        <li className="flex items-center gap-2.5">
          <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary-text"><CircleDollarSign className="size-4" /></span>
          <span className="ty-body-sm font-bold text-foreground">{valor}</span>
        </li>
        {metas.map(({ Icon, txt }) => (
          <li key={txt} className="flex items-center gap-2.5">
            <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground"><Icon className="size-4" /></span>
            <span className="truncate ty-body-sm text-foreground">{txt}</span>
          </li>
        ))}
      </ul>

      <footer className="mt-auto border-t border-border/50 pt-4">
        <Button onClick={() => onAbrir(v)} aria-label={t('card.verDetalhesAria', { cargo: v.briefing.cargo })} className="w-full">
          {t('card.verDetalhes')} <ArrowRight aria-hidden className="transition-transform group-hover:translate-x-0.5" />
        </Button>
      </footer>
    </article>
  )
}

// Filtro "Local de trabalho" — popover com País → Estado → Cidade em cascata + Limpar/Aplicar. Mantém um
// RASCUNHO interno (só comita no Aplicar). As opções de cada nível derivam do catálogo e do nível acima.
function LocalFiltro({ pais, estado, cidade, onAplicar }: {
  pais: string; estado: string; cidade: string
  onAplicar: (loc: { pais: string; estado: string; cidade: string }) => void
}) {
  const { t } = useTranslation('painel')
  const [open, setOpen] = useState(false)
  const [d, setD] = useState({ pais, estado, cidade })

  const ativo = pais !== 'todos' || estado !== 'todos' || cidade !== 'todas'
  const resumo = [cidade !== 'todas' ? cidade : null, estado !== 'todos' ? estado : null, pais !== 'todos' ? pais : null]
    .filter(Boolean).slice(0, 2).join(', ')

  const campo = (rotulo: string, value: string, placeholder: string, opcoes: string[], todos: { valor: string; rotulo: string }, onChange: (v: string) => void) => (
    <div className="space-y-1.5">
      <p className="ty-label-sm text-muted-foreground">{rotulo}</p>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger size="md" aria-label={rotulo} className="w-full font-normal"><SelectValue>{value === todos.valor ? placeholder : value}</SelectValue></SelectTrigger>
        <SelectContent>
          <SelectItem value={todos.valor}>{todos.rotulo}</SelectItem>
          {opcoes.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )

  // onOpenChange sincroniza o rascunho com o filtro aplicado ao abrir (no handler, não em efeito).
  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) setD({ pais, estado, cidade }) }}>
      <PopoverTrigger asChild>
        <Button variant={ativo ? 'default' : 'outline'} className={cn(H_MD, 'gap-1.5 font-normal')}>
          <MapPin className="size-4" aria-hidden /> {ativo ? resumo : t('localFiltro.titulo')} <ChevronDown className="size-4 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" aria-label={t('localFiltro.titulo')} className="w-72">
        <p className="text-sm font-semibold text-foreground">{t('localFiltro.titulo')}</p>
        <div className="mt-4 space-y-3">
          {campo(t('localFiltro.pais'), d.pais, t('localFiltro.todosPaises'), PAISES, { valor: 'todos', rotulo: t('localFiltro.todosPaises') },
            (v) => setD({ pais: v, estado: 'todos', cidade: 'todas' }))}
          {campo(t('localFiltro.estado'), d.estado, t('localFiltro.todosEstados'), estadosDe(d.pais), { valor: 'todos', rotulo: t('localFiltro.todosEstados') },
            (v) => setD((p) => ({ ...p, estado: v, cidade: 'todas' })))}
          {campo(t('localFiltro.cidade'), d.cidade, t('localFiltro.todasCidades'), cidadesDe(d.pais, d.estado), { valor: 'todas', rotulo: t('localFiltro.todasCidades') },
            (v) => setD((p) => ({ ...p, cidade: v })))}
        </div>
        <Separator className="my-4" />
        <div className="space-y-2">
          <Button variant="ghost" onClick={() => { const z = { pais: 'todos', estado: 'todos', cidade: 'todas' }; setD(z); onAplicar(z); setOpen(false) }} className="w-full gap-1.5 text-link">
            <Trash2 className="size-4" aria-hidden /> {t('localFiltro.limpar')}
          </Button>
          <Button onClick={() => { onAplicar(d); setOpen(false) }} className="w-full">{t('localFiltro.aplicar')}</Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function CandidatoPainel({ brand, mode, onCycleBrand, onToggleMode, onSair }: {
  brand: Brand
  mode: Mode
  onCycleBrand: () => void
  onToggleMode: () => void
  onSair?: () => void
}) {
  // O mural É a área LOGADA. Se a pessoa chegou sem sessão (navegou direto p/ /painel), estabelece uma
  // sessão demo — assim a vaga aberta em NOVA ABA sabe que está logado (mostra o modal de confirmar, não o
  // formulário público). Se ela logou pelo /acesso, o e-mail real já está salvo e isto não sobrescreve.
  if (!estaLogado()) guardarEmailCandidato('ana.souza@exemplo.com')

  const { t } = useTranslation('painel')
  const [f, setF] = useState<FiltroVagas>(FILTRO_VAZIO)
  const [ordem, setOrdem] = useState<Ordem>('recentes')
  // "Hoje" fixado na montagem (estável entre renders). O mural só lista vagas ATIVAS — as que passaram do
  // prazo (publicada + prazoDias) somem automaticamente.
  const [hoje] = useState(() => new Date())

  const resultados = ordenarVagas(filtrarVagas(vagasAtivas(VAGAS_CATALOGO, hoje), f), ordem)
  const { page, setPage, pageItems, total, inicio, totalItems } = usePagination(resultados, 9)
  const ativos = filtroAtivo(f)

  // Qualquer mudança de filtro/ordenação volta para a 1ª página (senão você fica "preso" numa página vazia).
  const set = <K extends keyof FiltroVagas>(k: K, v: FiltroVagas[K]) => { setF((prev) => ({ ...prev, [k]: v })); setPage(1) }
  const limparTudo = () => { setF(FILTRO_VAZIO); setPage(1) }

  function abrir(v: VagaPublica) {
    // Abre a vaga em NOVA ABA (id na URL); o mural continua aberto na aba atual.
    window.open(`/descricao_da_vaga?vaga=${v.id}`, '_blank', 'noopener')
  }

  return (
    <CandidatoShell active="vagas" brand={brand} mode={mode} onCycleBrand={onCycleBrand} onToggleMode={onToggleMode} onSair={onSair}>
      <main className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
       <PageContainer>
        <PageHeader icon={LayoutGrid} title={t('header.titulo')} desc={t('header.subtitulo')} />

        {/* Busca + filtros */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={f.q}
              onChange={(e) => set('q', e.target.value)}
              placeholder={t('busca.placeholder')}
              aria-label={t('busca.aria')}
              className={cn(H_MD, 'pl-9')}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Ordenar por data de publicação. */}
            <Select value={ordem} onValueChange={(v) => { setOrdem(v as Ordem); setPage(1) }}>
              <SelectTrigger size="md" aria-label={t('ordenar.label')} className="w-auto min-w-[10rem] font-normal"><SelectValue>{ordem === 'recentes' ? t('ordenar.recentes') : t('ordenar.antigas')}</SelectValue></SelectTrigger>
              <SelectContent>
                <SelectItem value="recentes">{t('ordenar.recentes')}</SelectItem>
                <SelectItem value="antigas">{t('ordenar.antigas')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={f.modelo} onValueChange={(v) => set('modelo', v)}>
              <SelectTrigger size="md" aria-label={t('filtro.modelo')} className="w-auto min-w-[10rem] font-normal"><SelectValue>{f.modelo === 'todos' ? t('filtro.todosModelos') : f.modelo}</SelectValue></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">{t('filtro.todosModelos')}</SelectItem>
                {MODELOS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* Nível: lista canônica da plataforma (job-generator/model.ts), não só os que aparecem no mock. */}
            <Select value={f.nivel} onValueChange={(v) => set('nivel', v)}>
              <SelectTrigger size="md" aria-label={t('filtro.nivel')} className="w-auto min-w-[9rem] font-normal"><SelectValue>{f.nivel === 'todos' ? t('filtro.todosNiveis') : f.nivel}</SelectValue></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">{t('filtro.todosNiveis')}</SelectItem>
                {NIVEIS.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>

            <LocalFiltro pais={f.pais} estado={f.estado} cidade={f.cidade} onAplicar={(loc) => { setF((p) => ({ ...p, ...loc })); setPage(1) }} />

            <Button
              variant={f.soPcd ? 'default' : 'outline'}
              aria-pressed={f.soPcd}
              onClick={() => set('soPcd', !f.soPcd)}
              className={cn(H_MD, 'gap-1.5 font-normal')}
            >
              <Accessibility className="size-4" aria-hidden /> {t('filtro.somentePcd')}
            </Button>

            {ativos && (
              <Button variant="ghost" onClick={limparTudo} className={cn(H_MD, 'gap-1.5')}>
                <X className="size-4" aria-hidden /> {t('filtro.limpar')}
              </Button>
            )}
          </div>

          <p className="ty-body-sm text-muted-foreground" role="status" aria-live="polite">{t('header.resultados', { count: totalItems })}</p>
        </div>

        {/* Resultados (paginados) + rodapé "Mostrando X–Y de N" + pager */}
        {totalItems > 0 ? (
          <div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pageItems.map((v) => <li key={v.id}><VagaCard v={v} dias={diasRestantes(v, hoje)} onAbrir={abrir} /></li>)}
            </ul>
            <Paginacao page={page} total={total} inicio={inicio} shown={pageItems.length} totalItems={totalItems} onPage={setPage} />
          </div>
        ) : (
          <EmptyState
            icon={SearchX}
            title={t('vazio.titulo')}
            description={t('vazio.descricao')}
            action={<Button variant="outline" onClick={limparTudo} className="gap-1.5"><X className="size-4" aria-hidden /> {t('vazio.limpar')}</Button>}
          />
        )}
       </PageContainer>
      </main>
    </CandidatoShell>
  )
}
