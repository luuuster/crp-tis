/**
 * Logo da TIS — fonte única dos SVGs (os imports vivem só aqui).
 * - variant="auto": troca dark/white conforme o tema (logo escuro no claro, branco-com-símbolo-azul no escuro).
 * - variant="onBrand": logo MONOCROMÁTICO 100% branco (símbolo + wordmark) — para superfícies bg-primary,
 *   que são azuis em qualquer tema. O `logo-white` tem o símbolo AZUL e sumiria no fundo azul; por isso
 *   o onBrand usa o lockup totalmente branco.
 */
import { cn } from '@/lib/utils'
import logoWhite from '@/assets/logo/logo-white.svg'
import logoDark from '@/assets/logo/logo-dark.svg'
import logoOnBrand from '@/assets/logo/logo-onbrand.svg'

export function Logo({
  className,
  alt = 'TIS',
  variant = 'auto',
}: {
  className?: string
  alt?: string
  variant?: 'auto' | 'onBrand'
}) {
  if (variant === 'onBrand') {
    return <img src={logoOnBrand} alt={alt} className={cn('h-12 w-auto', className)} />
  }
  return (
    <>
      <img src={logoDark} alt={alt} className={cn('h-12 w-auto dark:hidden', className)} />
      <img src={logoWhite} alt={alt} className={cn('hidden h-12 w-auto dark:block', className)} />
    </>
  )
}
