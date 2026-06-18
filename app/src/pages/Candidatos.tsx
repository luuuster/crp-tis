/**
 * Candidatos — banco de talentos: TODOS os candidatos e a etapa de cada um no funil. Clicar numa linha
 * abre o PERFIL do candidato: histórico de processos seletivos que participou, em que fase chegou em
 * cada um e o resultado FASE A FASE (a análise de cada processo, separadamente).
 * Reconstruída no DS (AppShell, CARD, .ty-*, tokens) — nada de cor/borda à mão. Demo: dados mockados.
 *
 * Este arquivo é o ORQUESTRADOR + BARREL: hospeda o estado de roteamento de view (perfil/processo),
 * filtros, paginação, o botão "Falar com Charlie" e o Sheet; e re-exporta a superfície pública
 * consumida por App.tsx (lazy) e axe.test.tsx. O domínio mora em ./candidatos/*.
 */
import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { usePagination } from '@/lib/usePagination'
import { useMockData } from '@/lib/useMockData'
import { AppShell } from '@/components/shell/AppShell'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'

import { CANDIDATOS_INICIAL, ETAPA_FILTROS, PER_PAGE, type Candidato, type Processo } from './candidatos/types'
import { ListaCandidatos } from './candidatos/ListaCandidatos'
import { CandidatoPerfil } from './candidatos/CandidatoPerfil'
import { ProcessoDetalhe } from './candidatos/ProcessoDetalhe'
import { CharlieAssistente } from './candidatos/CharlieAssistente'

// ── Barrel: superfície pública estável de './pages/Candidatos' (App.tsx lazy + axe.test importam daqui) ──
export type { Candidato } from './candidatos/types'
export { buildProcessos } from './candidatos/builders'
export { charlieRank, senioridadeScore } from './candidatos.logic'
export { CandidatoPerfil } from './candidatos/CandidatoPerfil'
export { ProcessoDetalhe } from './candidatos/ProcessoDetalhe'
export { CharlieAssistente } from './candidatos/CharlieAssistente'

export function Candidatos({ onNavigate, brand, mode, onCycleBrand, onToggleMode }: {
  onNavigate: (v: string) => void; brand?: string; mode?: string; onCycleBrand?: () => void; onToggleMode?: () => void
}) {
  const { t } = useTranslation('candidatos')
  const { data: cands, loading, error, retry } = useMockData<Candidato[]>('candidatos', () => CANDIDATOS_INICIAL, [])
  const [etapaF, setEtapaF] = useState<(typeof ETAPA_FILTROS)[number]>('Todas')
  const [vagaF, setVagaF] = useState('Todas')
  const [senioridadeF, setSenioridadeF] = useState('Todas')
  const [q, setQ] = useState('')
  const [vendo, setVendo] = useState<Candidato | null>(null)
  const [proc, setProc] = useState<Processo | null>(null)
  const [charlie, setCharlie] = useState(false)

  const emEntrevista = cands.filter((c) => c.etapa === 'Em entrevista').length
  const entrevistados = cands.filter((c) => c.etapa === 'Entrevistado').length
  const contratados = cands.filter((c) => c.etapa === 'Contratado').length

  const vagas = ['Todas', ...Array.from(new Set(cands.map((c) => c.vaga)))]
  const senioridades = ['Todas', ...Array.from(new Set(cands.map((c) => c.senioridade)))]

  const filtrados = cands.filter(
    (c) =>
      (etapaF === 'Todas' || c.etapa === etapaF) &&
      (vagaF === 'Todas' || c.vaga === vagaF) &&
      (senioridadeF === 'Todas' || c.senioridade === senioridadeF) &&
      (c.nome.toLowerCase().includes(q.trim().toLowerCase()) || c.email.toLowerCase().includes(q.trim().toLowerCase())),
  )

  const { page, setPage, pageItems, total, inicio, totalItems } = usePagination(filtrados, PER_PAGE)
  const resetPage = () => setPage(1)

  // Qualquer clique no menu volta para o banco: limpa perfil e processo abertos.
  const handleNav = (v: string) => { setVendo(null); setProc(null); setCharlie(false); onNavigate(v) }
  const crumb = proc ? proc.titulo : vendo ? vendo.nome : t('crumbBanco')

  return (
    <AppShell
      active="candidatos" crumb={crumb} onNavigate={handleNav} brand={brand} mode={mode} onCycleBrand={onCycleBrand} onToggleMode={onToggleMode}
      headerAction={
        // Charlie é copiloto de match do BANCO — só na lista. Ao abrir um candidato (perfil/análise) ele
        // some, pois não há necessidade dele dentro da visualização de um candidato específico.
        vendo ? undefined : (
          <Button variant="secondary" aria-label={t('charlie.abrir')} onClick={() => setCharlie(true)}>
            <Sparkles aria-hidden /><span className="hidden sm:inline">{t('charlie.abrir')}</span>
          </Button>
        )
      }
    >
      {proc && vendo ? (
        <ProcessoDetalhe key={proc.id} c={vendo} p={proc} onVoltar={() => setProc(null)} />
      ) : vendo ? (
        <CandidatoPerfil c={vendo} onVoltar={() => { setVendo(null); setProc(null) }} onAbrirProcesso={setProc} />
      ) : (
        <ListaCandidatos
          cands={cands}
          loading={loading}
          error={!!error}
          onRetry={retry}
          filtrados={filtrados}
          pageItems={pageItems}
          etapaF={etapaF}
          vagaF={vagaF}
          senioridadeF={senioridadeF}
          q={q}
          vagas={vagas}
          senioridades={senioridades}
          etapaFiltros={ETAPA_FILTROS}
          page={page}
          total={total}
          inicio={inicio}
          totalItems={totalItems}
          emEntrevista={emEntrevista}
          entrevistados={entrevistados}
          contratados={contratados}
          onEtapaF={(v) => { setEtapaF(v as (typeof ETAPA_FILTROS)[number]); resetPage() }}
          onVagaF={(v) => { setVagaF(v); resetPage() }}
          onSenioridadeF={(v) => { setSenioridadeF(v); resetPage() }}
          onBusca={(v) => { setQ(v); resetPage() }}
          onPage={setPage}
          onAbrir={setVendo}
        />
      )}

      {/* painel lateral — Charlie, copiloto de match de talentos (modal lateral) */}
      <Sheet open={charlie} onOpenChange={(aberto) => { if (!aberto) setCharlie(false) }}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-lg">
          <SheetTitle className="sr-only">{t('charlie.sheetTitulo')}</SheetTitle>
          <SheetDescription className="sr-only">{t('charlie.sheetDescricao')}</SheetDescription>
          <CharlieAssistente
            cands={cands}
            vagas={vagas.slice(1)}
            onVerPerfil={(c) => { setCharlie(false); setProc(null); setVendo(c) }}
          />
        </SheetContent>
      </Sheet>
    </AppShell>
  )
}
