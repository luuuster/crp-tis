/**
 * Painel da marca das telas de auth. Dois modos:
 * - variant="aside": coluna lateral (≥ lg) — fundo da marca, glow suave, headline/subline, copyright.
 * - variant="banner": faixa compacta no topo (< lg) — dá presença de marca no tablet/mobile e mata o
 *   vazio onde o aside some. Sem glow nem copyright; headline curta, sem subline.
 * Tudo token-driven (bg-primary / text-primary-foreground). O headline é <p> (não heading) pra não
 * competir com o <h1> do formulário — um único heading principal por tela (WCAG heading-order).
 */
import { cn } from '@/lib/utils'
import { Logo } from './Logo'

const COPYRIGHT = '© 2026 TIS · Plataforma de RH'

export function BrandPanel({
  headline,
  subline,
  variant = 'aside',
  className,
}: {
  headline: string
  subline: string
  variant?: 'aside' | 'banner'
  className?: string
}) {
  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'flex items-center gap-4 overflow-hidden bg-primary px-6 py-5 text-primary-foreground',
          className,
        )}
      >
        <Logo variant="onBrand" className="h-9 shrink-0" />
        <p className="ty-body font-medium text-balance">{headline}</p>
      </div>
    )
  }

  return (
    <aside
      className={cn(
        'relative hidden flex-col justify-center overflow-hidden bg-primary p-12 text-primary-foreground lg:flex xl:p-16',
        className,
      )}
    >
      {/* um único glow suave, sem texturas */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-24 size-[34rem] rounded-full bg-primary-foreground/[0.08] blur-3xl"
      />

      <div className="relative max-w-md">
        {/* <p> e não <h2>: evita um heading concorrente com o <h1> do form (heading-order). */}
        <p className="ty-h1 text-balance">{headline}</p>
        <p className="ty-body-lg mt-5 text-primary-foreground text-pretty">{subline}</p>
      </div>

      <p className="absolute inset-x-12 bottom-12 text-sm text-primary-foreground xl:inset-x-16 xl:bottom-16">
        {COPYRIGHT}
      </p>
    </aside>
  )
}
