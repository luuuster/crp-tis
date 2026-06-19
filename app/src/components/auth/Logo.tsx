/**
 * Logo da plataforma — fonte única dos SVGs (os imports vivem só aqui). É BRAND-AWARE: cada marca tem
 * sua identidade (CRP = "TIS", azul; Marca B = "Trevo", verde). O `brand` vem do app (mesma fonte do
 * [data-brand] no <html>), então trocar de marca troca o logo + o nome — como se fosse outra empresa.
 * - variant="auto": troca dark/white conforme o tema (wordmark escuro no claro, branco no escuro).
 * - variant="onBrand": lockup 100% branco (símbolo + wordmark) — para superfícies bg-primary (a cor da marca).
 */
import { cn } from '@/lib/utils'
import logoWhite from '@/assets/logo/logo-white.svg'
import logoDark from '@/assets/logo/logo-dark.svg'
import logoOnBrand from '@/assets/logo/logo-onbrand.svg'
import trevoWhite from '@/assets/logo/trevo-white.svg'
import trevoDark from '@/assets/logo/trevo-dark.svg'
import trevoOnBrand from '@/assets/logo/trevo-onbrand.svg'

export type Brand = 'crp' | 'marca-b'

const ASSETS: Record<Brand, { dark: string; white: string; onBrand: string; name: string }> = {
  crp: { dark: logoDark, white: logoWhite, onBrand: logoOnBrand, name: 'TIS' },
  'marca-b': { dark: trevoDark, white: trevoWhite, onBrand: trevoOnBrand, name: 'Trevo' },
}

export function Logo({
  className,
  brand = 'crp',
  alt,
  variant = 'auto',
}: {
  className?: string
  brand?: string
  alt?: string
  variant?: 'auto' | 'onBrand'
}) {
  const a = ASSETS[brand as Brand] ?? ASSETS.crp
  const label = alt ?? a.name
  if (variant === 'onBrand') {
    return <img src={a.onBrand} alt={label} className={cn('h-12 w-auto', className)} />
  }
  return (
    <>
      <img src={a.dark} alt={label} className={cn('h-12 w-auto dark:hidden', className)} />
      <img src={a.white} alt={label} className={cn('hidden h-12 w-auto dark:block', className)} />
    </>
  )
}
