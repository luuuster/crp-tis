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

const brandName = (brand?: string) => (brand === 'marca-b' ? 'Trevo' : 'TIS')

export function BrandPanel({
  headline,
  subline,
  variant = 'aside',
  brand,
  className,
}: {
  headline: string
  subline: string
  variant?: 'aside' | 'banner'
  brand?: string
  className?: string
}) {
  const copyright = `© 2026 ${brandName(brand)} · Plataforma de RH`
  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'flex items-baseline gap-3 overflow-hidden bg-primary px-6 py-5 text-primary-foreground',
          className,
        )}
      >
        {/* items-baseline: o baseline da <img> (borda inferior) casa com o baseline do wordmark "TIS",
            então a frase senta na MESMA linha do "TIS" (o símbolo é alto e centralizado; alinhar pelo
            centro da caixa deixaria a frase flutuando acima do texto). */}
        <Logo variant="onBrand" brand={brand} className="h-9 shrink-0" />
        {/* < sm: só o logo (o dock de tema fixo no canto cobriria a frase); ≥ sm há espaço antes do dock. */}
        <p className="ty-body hidden font-medium text-balance sm:block">{headline}</p>
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
        {copyright}
      </p>
    </aside>
  )
}
