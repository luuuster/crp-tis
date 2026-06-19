/**
 * Dashboard — painel de recrutamento MODULAR. Fora do modo "Personalizar" é a visão geral de sempre;
 * nele, o usuário monta a própria dashboard escolhendo widgets (KPIs, gráficos, listas) do catálogo,
 * reordenando e redimensionando. O layout persiste em localStorage (client-side — é mockup, sem backend).
 * 100% token-driven. `onNavigate` liga os CTAs/menu às demais telas (shell compartilhado).
 */
import { useState } from 'react'
import { Check, LayoutGrid, Plus, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { exportCsv } from '@/lib/exportCsv'
import { type StatusVaga as Status } from '@/lib/types'
import { AppShell } from '@/components/shell/AppShell'
import { ExportButton } from '@/components/ExportButton'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { PageContainer, PageHeader } from '@/components/page'
import { Button } from '@/components/ui/button'
import { CONTRATACOES, FUNIL, KPIS, NOME, STATUS_DONUT } from './dashboard/data'
import { DashboardCanvas } from './dashboard/DashboardCanvas'
import { useDashboardLayout } from './dashboard/useDashboardLayout'

export function Dashboard({ onNavigate, brand, mode, onCycleBrand, onToggleMode }: {
  onNavigate: (v: string) => void; brand?: string; mode?: string; onCycleBrand?: () => void; onToggleMode?: () => void
}) {
  const { t } = useTranslation('dashboard')
  const [editMode, setEditMode] = useState(false)
  const layout = useDashboardLayout()

  // Tradução só da EXIBIÇÃO (o valor canônico pt-BR é a chave); usado no export.
  const tStatus = (v: Status) => t(`status.${v}` as 'status.Aberta')
  const tEtapa = (v: string) => t(`etapa.${v}` as 'etapa.Inscritos')
  const tMes = (v: string) => t(`mes.${v}` as 'mes.Jan')

  // Exporta um CSV com KPIs e dados dos gráficos (seção · métrica · valor).
  const handleExport = () => {
    const rows: { secao: string; metrica: string; valor: string }[] = [
      ...KPIS.map((k) => ({ secao: t('export.kpis'), metrica: t(`kpi.${k.key}`), valor: k.valor })),
      ...STATUS_DONUT.map((s) => ({ secao: t('export.vagasPorStatus'), metrica: tStatus(s.label as Status), valor: String(s.value) })),
      ...CONTRATACOES.map((c) => ({ secao: t('export.contratacoesPorMes'), metrica: tMes(c.mes), valor: String(c.total) })),
      ...FUNIL.map((f) => ({ secao: t('export.funil'), metrica: tEtapa(f.etapa), valor: String(f.valor) })),
    ]
    exportCsv(t('export.arquivo'), rows, [
      { header: t('export.secao'), value: (r) => r.secao },
      { header: t('export.metrica'), value: (r) => r.metrica },
      { header: t('export.valor'), value: (r) => r.valor },
    ])
  }

  return (
    <AppShell active="dashboard" crumb="Dashboard" onNavigate={onNavigate} brand={brand} mode={mode} onCycleBrand={onCycleBrand} onToggleMode={onToggleMode}>
      <PageContainer>
        <PageHeader
          title={<>{t('saudacao', { nome: NOME })} <span aria-hidden>👋</span></>}
          desc={editMode ? t('personalizar.desc') : t('desc')}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {editMode ? (
                <>
                  <ConfirmDialog
                    trigger={<Button variant="ghost"><RotateCcw aria-hidden /> {t('personalizar.restaurarPadrao')}</Button>}
                    icon={RotateCcw} tone="warning" confirmVariant="warning"
                    title={t('personalizar.restaurarTitulo')}
                    description={t('personalizar.restaurarDesc')}
                    confirmLabel={t('personalizar.restaurarConfirmar')}
                    onConfirm={layout.reset}
                  />
                  <Button onClick={() => setEditMode(false)}><Check aria-hidden /> {t('personalizar.concluir')}</Button>
                </>
              ) : (
                <>
                  <ExportButton onExport={handleExport} />
                  <Button variant="outline" onClick={() => setEditMode(true)}><LayoutGrid aria-hidden /> {t('personalizar.entrar')}</Button>
                  <Button onClick={() => onNavigate?.('gerador')}><Plus aria-hidden /> {t('abrirVaga')}</Button>
                </>
              )}
            </div>
          }
        />

        <DashboardCanvas editMode={editMode} onNavigate={onNavigate} layout={layout} onPersonalizar={() => setEditMode(true)} />
      </PageContainer>
    </AppShell>
  )
}
