/**
 * Esqueleto de carregamento do mural de vagas (rota /painel). Espelha o layout real (topbar + busca +
 * filtros + grade de cards) enquanto o chunk lazy da página baixa — melhor que um spinner solto.
 * É EAGER de propósito (não pode estar no chunk lazy que ele cobre). 100% token-driven; role=status anuncia.
 */
import { cn } from '@/lib/utils'
import { CARD } from '@/lib/surfaces'
import { Logo } from '@/components/auth/Logo'
import { Skeleton } from '@/components/ui/skeleton'

const LARGURAS = ['w-3/4', 'w-2/3', 'w-1/2', 'w-3/5'] // larguras variadas p/ as linhas não ficarem "tijolo"

function CardSkeleton() {
  return (
    <div className={cn(CARD, 'flex h-full flex-col gap-4 p-5')}>
      {/* Topo: data publicada (esq.) + expiração (dir.) na mesma linha — espelha o VagaCard. */}
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="space-y-2.5">
        <Skeleton className="h-6 w-3/4" />
        <div className="flex gap-1.5">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
      <div className="space-y-2.5">
        {LARGURAS.map((w, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <Skeleton className="size-7 shrink-0 rounded-md" />
            <Skeleton className={cn('h-4', w)} />
          </div>
        ))}
      </div>
      <Skeleton className="mt-auto h-10 w-full rounded-md" />
    </div>
  )
}

export function PainelSkeleton({ brand }: { brand?: string }) {
  return (
    <div className="min-h-dvh bg-background" role="status" aria-label="Carregando vagas">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-card/80 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="flex h-16 items-center gap-4">
            <Logo brand={brand} className="h-8" />
            <Skeleton className="ml-auto size-9 rounded-full" />
          </div>
          {/* abas (espelha o CandidatoShell: Vagas · Minhas candidaturas · Candidaturas finalizadas) */}
          <div className="-mb-px flex gap-4 pb-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-36" />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pt-10 pb-16">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="mt-2.5 h-5 w-80 max-w-full" />

        {/* busca + filtros */}
        <div className="mt-6 space-y-3">
          <Skeleton className="h-10 w-full rounded-md" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-36 rounded-md" />)}
          </div>
        </div>

        {/* grade de cards */}
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <li key={i}><CardSkeleton /></li>)}
        </ul>
      </main>
    </div>
  )
}
