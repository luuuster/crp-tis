/**
 * "Minhas candidaturas" e "Candidaturas finalizadas" (porta :5172) — abas da área logada que listam as vagas
 * a que o candidato se candidatou. Em andamento: barra de progresso no funil (IA → RH → Teste → Gestor →
 * Proposta) + ação Desistir. Finalizadas: FAIXA de resultado no rodapé (verde aprovada · cinza sóbrio não
 * selecionada). Dados mock (@/lib/candidaturas), sem backend.
 *
 * Layout alinhado ao mural de Vagas (CandidatoPainel): mesma largura (max-w-6xl), grade de 3 colunas e o
 * mesmo chrome de card (cargo, tags, hover). 100% token-driven, multi-marca, claro/escuro e WCAG 2.2 AA.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Accessibility, ArrowUpRight, Ban, Briefcase, CheckCircle2, CircleSlash, ClipboardList, type LucideIcon, MapPin, MessageSquareText, Search, SearchX, Target, Trophy, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { CARD } from '@/lib/surfaces'
import type { Brand, Mode } from '@/lib/useBrandMode'
import { estaLogado, guardarEmailCandidato } from '@/lib/candidatoSessao'
import { FASES, lerCandidaturas, type CandidaturaComVaga } from '@/lib/candidaturas'
import { CandidatoShell } from '@/components/candidato/CandidatoShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PageContainer, PageHeader, EmptyState } from '@/components/page'

const TOTAL = FASES.length // 5 etapas do funil

function CandidaturaCard({ c, onDesistir }: { c: CandidaturaComVaga; onDesistir: (id: string) => void }) {
  const { t } = useTranslation('painel')
  const [confirmar, setConfirmar] = useState(false)
  const [feedbackAberto, setFeedbackAberto] = useState(false)
  const v = c.vaga
  const finalizado = c.status !== 'andamento'
  const aprovado = c.status === 'aprovado'
  const atual = aprovado ? TOTAL : c.faseIndex + 1
  const faseAtual = t(`candidaturas.fase.${FASES[c.faseIndex]}`)
  const mensagem = aprovado ? t('candidaturas.aprovadoMsg')
    : c.status === 'reprovado' ? t('candidaturas.reprovadoMsg', { fase: faseAtual })
      : t('candidaturas.andamentoMsg', { fase: faseAtual })
  const rotulo = aprovado ? t('candidaturas.status.aprovado') : t('candidaturas.status.reprovado')

  return (
    <article className={cn(CARD, 'group flex h-full flex-col gap-4 p-5 transition-[transform,border-color,box-shadow] hover:-translate-y-0.5 hover:shadow-lg', !finalizado && 'hover:ring-primary/40')}>
      {/* Cargo + tags (nível sólido; modelo/modalidade em contorno; PcD) — igual ao card de Vagas. */}
      <div className="space-y-2.5">
        <h2 className="ty-body-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary-text">{v.briefing.cargo}</h2>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="font-semibold">{v.briefing.nivel}</Badge>
          {[v.briefing.modelo, v.briefing.modalidade].map((tg) => (
            <Badge key={tg} variant="outline" className="font-medium text-muted-foreground">{tg}</Badge>
          ))}
          {v.pcd && (
            <Badge variant="outline" className="gap-1 font-medium text-muted-foreground">
              <Accessibility className="size-3.5" aria-hidden /> {t('card.pcd')}
            </Badge>
          )}
        </div>
      </div>

      {/* Local (chip + label) — mesmo padrão de meta do card de Vagas. */}
      <ul className="space-y-2.5">
        <li className="flex items-center gap-2.5">
          <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground"><MapPin className="size-4" /></span>
          <span className="truncate ty-body-sm text-foreground">{v.local}</span>
        </li>
      </ul>

      {finalizado ? (
        <>
          {/* Faixa de resultado TONAL (suave nos 4 temas, AA): aprovada = tint verde + texto verde -text;
              não selecionada = tint vermelho + texto vermelho -text. Chip de ícone + rótulo + mensagem. */}
          <div className={cn('flex items-start gap-3 rounded-lg px-3.5 py-3', aprovado ? 'bg-success/10' : 'bg-destructive/10')}>
            <span aria-hidden className={cn('grid size-9 shrink-0 place-items-center rounded-md', aprovado ? 'bg-success/15 text-success-text' : 'bg-destructive/15 text-destructive-text')}>
              {aprovado ? <Trophy className="size-5" /> : <CircleSlash className="size-5" />}
            </span>
            <div className="min-w-0 space-y-0.5">
              <p className={cn('ty-body-sm font-semibold', aprovado ? 'text-success-text' : 'text-destructive-text')}>{rotulo}</p>
              <p className="ty-body-sm text-foreground">{mensagem}</p>
            </div>
          </div>

          {/* Ação: ver o feedback do processo (CTA primário cheio). Divisória acima, como no card em andamento.
              Aviso de implementação (mockup): tooltip vermelho de "recurso em avaliação" no hover/foco. */}
          <footer className="mt-auto border-t border-border/50 pt-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={() => setFeedbackAberto(true)} className="w-full gap-1.5">
                  {t('candidaturas.verFeedback')} <ArrowUpRight className="size-4" aria-hidden />
                </Button>
              </TooltipTrigger>
              <TooltipContent tone="destructive" className="max-w-xs text-center">{t('candidaturas.verFeedbackAviso')}</TooltipContent>
            </Tooltip>
          </footer>

          <FeedbackIADialog open={feedbackAberto} onOpenChange={setFeedbackAberto} aprovado={aprovado} cargo={v.briefing.cargo} fase={faseAtual} />
        </>
      ) : (
        <>
          {/* Progresso no funil */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="ty-body-sm font-medium text-foreground">{t('candidaturas.seuProgresso')}</span>
              <span className="ty-caption font-semibold tabular-nums text-muted-foreground">{atual}/{TOTAL}</span>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar" aria-valuemin={0} aria-valuemax={TOTAL} aria-valuenow={atual}
              aria-label={`${t('candidaturas.seuProgresso')} — ${atual}/${TOTAL}`}
            >
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(atual / TOTAL) * 100}%` }} />
            </div>
            <p className="ty-caption text-muted-foreground">{mensagem}</p>
          </div>

          {/* Ações */}
          <footer className="mt-auto flex items-center justify-between gap-2 border-t border-border/50 pt-4">
            <Button variant="destructive-outline" onClick={() => setConfirmar(true)}>
              <Ban aria-hidden /> {t('candidaturas.desistir')}
            </Button>
            {/* Sem link ainda — a tela de acompanhamento detalhado não foi definida (placeholder "em breve"). */}
            <Button onClick={() => toast.info(t('candidaturas.andamentoEmBreve'))} className="gap-1.5">
              {t('candidaturas.verAndamento')} <ArrowUpRight className="size-4" aria-hidden />
            </Button>
          </footer>

          <ConfirmDialog
            open={confirmar} onOpenChange={setConfirmar} icon={Ban} tone="destructive" confirmVariant="destructive"
            title={t('candidaturas.desistirConfirm.titulo')} description={t('candidaturas.desistirConfirm.descricao')}
            cancelLabel={t('candidaturas.desistirConfirm.voltar')} confirmLabel={t('candidaturas.desistirConfirm.confirmar')}
            onConfirm={() => { onDesistir(c.id); toast.success(t('candidaturas.desistido', { cargo: v.briefing.cargo })) }}
          />
        </>
      )}
    </article>
  )
}

/** Lista rotulada do feedback (pontos fortes · a desenvolver) — ícone tonal + itens. */
function FeedbackLista({ titulo, itens, icon: Icon, tone }: {
  titulo: string; itens: string[]; icon: LucideIcon; tone: 'success' | 'muted'
}) {
  return (
    <div className="space-y-2">
      <p className="ty-caption font-semibold tracking-wide text-muted-foreground uppercase">{titulo}</p>
      <ul className="space-y-1.5">
        {itens.map((item, i) => (
          <li key={i} className="flex items-start gap-2 ty-body-sm text-foreground">
            <Icon className={cn('mt-0.5 size-4 shrink-0', tone === 'success' ? 'text-success-text' : 'text-muted-foreground')} aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Feedback do processo seletivo "gerado por IA" (MOCK): resumo + pontos fortes + pontos a desenvolver,
 * com texto contextual por status (aprovada/não selecionada) e fase. Sem backend — conteúdo vem do i18n.
 */
function FeedbackIADialog({ open, onOpenChange, aprovado, cargo, fase }: {
  open: boolean; onOpenChange: (o: boolean) => void; aprovado: boolean; cargo: string; fase: string
}) {
  const { t } = useTranslation('painel')
  const tipo = aprovado ? 'aprovado' : 'reprovado'
  const fortes = t(`candidaturas.feedback.${tipo}.fortes`, { returnObjects: true }) as string[]
  const desenvolver = t(`candidaturas.feedback.${tipo}.desenvolver`, { returnObjects: true }) as string[]
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquareText className="size-5 text-primary-text" aria-hidden />
            {t('candidaturas.feedback.titulo')}
          </DialogTitle>
          <DialogDescription>{t('candidaturas.feedback.subtitulo', { cargo })}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="ty-body-sm text-foreground">{t(`candidaturas.feedback.${tipo}.resumo`, { fase })}</p>
          <FeedbackLista titulo={t('candidaturas.feedback.fortesLabel')} itens={fortes} icon={CheckCircle2} tone="success" />
          <FeedbackLista titulo={t('candidaturas.feedback.desenvolverLabel')} itens={desenvolver} icon={Target} tone="muted" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('candidaturas.feedback.fechar')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function CandidatoCandidaturas({ brand, mode, onCycleBrand, onToggleMode, onSair, tipo = 'andamento' }: {
  brand: Brand
  mode: Mode
  onCycleBrand: () => void
  onToggleMode: () => void
  onSair?: () => void
  tipo?: 'andamento' | 'finalizadas'
}) {
  // Mesma garantia do mural: se chegou sem sessão, estabelece uma demo (mock, sem backend).
  if (!estaLogado()) guardarEmailCandidato('ana.souza@exemplo.com')
  const { t } = useTranslation('painel')
  const ns = tipo === 'finalizadas' ? 'finalizadas' : 'candidaturas' // namespace de textos da página
  // Cada aba mostra um conjunto: "Minhas candidaturas" = em andamento · "Finalizadas" = aprovada/reprovada.
  const [lista, setLista] = useState<CandidaturaComVaga[]>(
    () => lerCandidaturas().filter((c) => (tipo === 'finalizadas' ? c.status !== 'andamento' : c.status === 'andamento')),
  )
  const desistir = (id: string) => setLista((prev) => prev.filter((c) => c.id !== id))

  // Busca por cargo (mesmo padrão do mural de vagas).
  const [q, setQ] = useState('')
  const termo = q.trim().toLowerCase()
  const filtradas = termo ? lista.filter((c) => c.vaga.briefing.cargo.toLowerCase().includes(termo)) : lista

  return (
    <CandidatoShell active={tipo === 'finalizadas' ? 'finalizadas' : 'candidaturas'} brand={brand} mode={mode} onCycleBrand={onCycleBrand} onToggleMode={onToggleMode} onSair={onSair}>
      <main className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
       <PageContainer>
        <PageHeader icon={tipo === 'finalizadas' ? CheckCircle2 : ClipboardList} title={t(`${ns}.titulo`)} desc={t(`${ns}.subtitulo`)} />

        {lista.length > 0 ? (
          <div className="space-y-3">
            {/* Busca por cargo — mesmo padrão do mural de vagas. */}
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('busca.placeholder')}
                aria-label={t('busca.aria')}
                className="h-[var(--button-height-md)] pl-9"
              />
            </div>

            <p className="ty-body-sm text-muted-foreground" role="status" aria-live="polite">{t(`${ns}.resumo`, { count: filtradas.length })}</p>

            {filtradas.length > 0 ? (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtradas.map((c) => <li key={c.id}><CandidaturaCard c={c} onDesistir={desistir} /></li>)}
              </ul>
            ) : (
              <EmptyState
                icon={SearchX}
                title={t('busca.vazioTitulo')}
                description={t('busca.vazioDescricao')}
                action={<Button variant="outline" onClick={() => setQ('')} className="gap-1.5"><X className="size-4" aria-hidden /> {t('busca.limpar')}</Button>}
              />
            )}
          </div>
        ) : (
          <EmptyState
            icon={Briefcase}
            title={t(`${ns}.vazio.titulo`)}
            description={t(`${ns}.vazio.descricao`)}
            action={<Button onClick={() => { window.location.href = '/painel' }} className="gap-1.5">{t(`${ns}.vazio.irVagas`)}</Button>}
          />
        )}
       </PageContainer>
      </main>
    </CandidatoShell>
  )
}
