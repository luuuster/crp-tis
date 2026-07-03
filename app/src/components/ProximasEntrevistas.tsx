/**
 * "Próximas entrevistas" — busca por nome + lista paginada dos agendamentos do mês selecionado. Fonte
 * ÚNICA, compartilhada pela tela de Entrevistas e pela visão "Calendário" do Funil. Busca e página são
 * estado INTERNO; recebe os eventos + mês/ano e o handler de abrir. 100% token-driven, WCAG 2.2 AA.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarDays, CalendarX2, Clock, MapPin, Search, Video, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { focusRing } from '@/lib/focus'
import { usePagination } from '@/lib/usePagination'
import { mesAbrev, mesLongo } from '@/lib/datetime'
import { Panel, Paginacao } from '@/components/page'
import { Input } from '@/components/ui/input'
import type { Evento } from '@/pages/Entrevistas'

const PER_PAGE = 10

export function ProximasEntrevistas({ eventos, mes, ano, onAbrir, onFechar }: {
  eventos: Evento[]
  mes: number
  ano: number
  onAbrir: (ev: Evento) => void
  onFechar?: () => void // botão "X" no cabeçalho do painel (além do ícone na barra do calendário)
}) {
  const { t } = useTranslation('entrevistas')
  const [q, setQ] = useState('')
  // Só o mês selecionado, filtrado por nome do candidato e ordenado por dia/horário.
  const proximas = eventos
    .filter((e) => e.y === ano && e.m === mes && e.cand.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => a.d - b.d || a.hora.localeCompare(b.hora))
  const { page, setPage, pageItems, total, inicio, totalItems } = usePagination(proximas, PER_PAGE)

  return (
    <Panel
      icon={CalendarDays}
      title={t('proximas.title')}
      desc={t('proximas.desc', { n: proximas.length, mes: mesLongo(mes) })}
      action={onFechar && (
        <button
          type="button" onClick={onFechar} aria-label={t('proximas.fecharAria')}
          className={cn('-mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground', focusRing)}
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    >
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder={t('proximas.buscar')} aria-label={t('proximas.buscarAria')} className="pl-9" />
      </div>
      {proximas.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-muted/30 px-6 py-10 text-center">
          <CalendarX2 className="size-7 text-muted-foreground/60" aria-hidden />
          <p className="text-balance ty-body-sm text-muted-foreground">{q.trim() ? t('proximas.vaziaBusca') : t('proximas.vazia')}</p>
        </div>
      ) : (
        <>
          <ul className="space-y-2.5">
            {pageItems.map((ev, i) => (
              <li key={i}>
                {/* Linha clicável → abre o detalhe/processo. */}
                <button type="button" onClick={() => onAbrir(ev)} className="flex w-full items-center gap-3 rounded-xl bg-muted/30 p-3 text-left transition-colors hover:bg-muted/50 focus-visible:focus-ring">
                  <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-card text-center shadow-sm ring-1 ring-surface-ring" aria-hidden>
                    <span className="font-heading text-base font-bold leading-none tabular-nums text-foreground">{String(ev.d).padStart(2, '0')}</span>
                    <span className="ty-caption text-muted-foreground uppercase">{mesAbrev(ev.m)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate ty-body-sm font-medium text-foreground">{ev.cand}</p>
                    <p className="truncate ty-caption text-muted-foreground">{ev.vaga}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="flex items-center gap-1 ty-body-sm font-medium tabular-nums text-foreground"><Clock className="size-3.5 text-muted-foreground" aria-hidden /> {ev.hora}</span>
                    <span className="flex items-center gap-1 ty-caption text-muted-foreground">
                      {ev.tipo === 'Online' ? <Video className="size-3" aria-hidden /> : <MapPin className="size-3" aria-hidden />} {t(`formato.${ev.tipo}`)}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          {total > 1 && (
            <Paginacao compact page={page} total={total} inicio={inicio} shown={pageItems.length} totalItems={totalItems} onPage={setPage} />
          )}
        </>
      )}
    </Panel>
  )
}
