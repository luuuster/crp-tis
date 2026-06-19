/**
 * Canvas modular do Dashboard: renderiza os widgets do layout numa grade responsiva (4 colunas no
 * desktop) e, no modo "Personalizar", envolve cada um com um chrome de edição (mover, redimensionar,
 * remover) + um catálogo "Adicionar widget". Acessível por teclado (tudo são <button> com rótulo).
 * Fora do modo edição é só a visualização — idêntica ao Dashboard de sempre.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { ArrowDown, ArrowUp, LayoutGrid, Plus, Trash2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { focusRing } from '@/lib/focus'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/page'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { WIDGETS, type WidgetSize } from './widgets'
import type { useDashboardLayout } from './useDashboardLayout'

// span por tamanho (grade base 1col → sm 2col → lg 4col). sm = meia largura no sm / 1 de 4 no lg.
const SPAN: Record<WidgetSize, string> = {
  sm: 'lg:col-span-1',
  md: 'sm:col-span-2 lg:col-span-2',
  lg: 'sm:col-span-2 lg:col-span-3',
  full: 'sm:col-span-2 lg:col-span-4',
}
const SIZES: WidgetSize[] = ['sm', 'md', 'lg', 'full']
const BAR_W: Record<WidgetSize, number> = { sm: 7, md: 11, lg: 15, full: 20 }

type Layout = ReturnType<typeof useDashboardLayout>

function EditBar({ id, idx, total, size, layout, t }: {
  id: string; idx: number; total: number; size: WidgetSize; layout: Layout; t: TFunction<'dashboard'>
}) {
  const iconBtn = 'inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent'
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/70 p-1">
      <div className="flex items-center gap-0.5">
        <button type="button" className={cn(iconBtn, focusRing)} onClick={() => layout.move(id, -1)} disabled={idx === 0} aria-label={t('personalizar.moverCima')}><ArrowUp className="size-4" aria-hidden /></button>
        <button type="button" className={cn(iconBtn, focusRing)} onClick={() => layout.move(id, 1)} disabled={idx === total - 1} aria-label={t('personalizar.moverBaixo')}><ArrowDown className="size-4" aria-hidden /></button>
      </div>
      {/* tamanho: barras de largura crescente (idioma-neutro); o nome vai no aria-label */}
      <div role="group" aria-label={t('personalizar.tamanhoGrupo')} className="flex items-center gap-0.5">
        {SIZES.map((s) => (
          <button key={s} type="button" aria-pressed={size === s} aria-label={t(`personalizar.tamanho.${s}` as 'personalizar.tamanho.sm')}
            onClick={() => layout.setSize(id, s)}
            className={cn('inline-flex h-7 items-center justify-center rounded-md px-1.5 transition-colors', focusRing, size === s ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            <span className="block h-1.5 rounded-full bg-current" style={{ width: BAR_W[s] }} />
          </button>
        ))}
      </div>
      <button type="button" className={cn(iconBtn, 'hover:bg-destructive/10 hover:text-destructive-text', focusRing)} onClick={() => layout.removeWidget(id)} aria-label={t('personalizar.remover')}><Trash2 className="size-4" aria-hidden /></button>
    </div>
  )
}

export function DashboardCanvas({ editMode, onNavigate, layout, onPersonalizar }: {
  editMode: boolean; onNavigate: (v: string) => void; layout: Layout; onPersonalizar: () => void
}) {
  const { t } = useTranslation('dashboard')
  const [catalogOpen, setCatalogOpen] = useState(false)
  const { items, available } = layout
  const vazio = items.length === 0

  return (
    <>
      {vazio ? (
        <EmptyState
          icon={LayoutGrid}
          title={t('vazio.titulo')}
          description={editMode ? t('vazio.descEdicao') : t('vazio.descView')}
          action={
            editMode
              ? <Button onClick={() => setCatalogOpen(true)}><Plus aria-hidden /> {t('personalizar.adicionarWidget')}</Button>
              : <Button onClick={onPersonalizar}><LayoutGrid aria-hidden /> {t('personalizar.entrar')}</Button>
          }
        />
      ) : (
        // grade: items-stretch (default, sem items-start) → cards da mesma fileira alinham o fundo
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, idx) => {
            const def = WIDGETS[item.id]
            if (!def) return null
            const Widget = def.Component
            return (
              <div key={item.id} className={cn('flex min-w-0 flex-col gap-2', SPAN[item.size])}>
                {editMode && <EditBar id={item.id} idx={idx} total={items.length} size={item.size} layout={layout} t={t} />}
                {/* flex-1 + [&>*]:h-full: o card do widget estica até a altura da fileira (Panel já tem corpo flex-1). */}
                <div className={cn('min-w-0 flex-1 [&>*]:h-full', editMode && 'pointer-events-none select-none rounded-2xl ring-1 ring-primary/40 ring-offset-2 ring-offset-background')}>
                  <Widget onNavigate={onNavigate} />
                </div>
              </div>
            )
          })}

          {/* tile "Adicionar widget" — só no modo edição, ocupa a linha inteira */}
          {editMode && available.length > 0 && (
            <button
              type="button"
              onClick={() => setCatalogOpen(true)}
              className={cn('col-span-1 flex min-h-[88px] items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/60 ty-body-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary-text sm:col-span-2 lg:col-span-4', focusRing)}
            >
              <Plus className="size-4.5" aria-hidden /> {t('personalizar.adicionarWidget')}
            </button>
          )}
        </div>
      )}

      {/* catálogo de widgets disponíveis */}
      <Dialog open={catalogOpen} onOpenChange={setCatalogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('catalogo.titulo')}</DialogTitle>
            <DialogDescription>{t('catalogo.desc')}</DialogDescription>
          </DialogHeader>
          {available.length === 0 ? (
            <p className="py-6 text-center ty-body-sm text-muted-foreground">{t('catalogo.vazio')}</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {available.map((w) => (
                <li key={w.id}>
                  <button
                    type="button"
                    onClick={() => layout.addWidget(w.id)}
                    className={cn('flex w-full items-center justify-between gap-3 rounded-xl border border-border/60 p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5', focusRing)}
                  >
                    <span className="min-w-0">
                      <span className="block truncate ty-body-sm font-medium text-foreground">{t(w.tituloKey as 'kpi.vagasAbertas')}</span>
                      <span className="block ty-caption text-muted-foreground">{t(`catalogo.categoria.${w.categoria}` as 'catalogo.categoria.kpi')}</span>
                    </span>
                    <Plus className="size-4 shrink-0 text-primary-text" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
