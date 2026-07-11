/**
 * Shell compartilhado das telas de auth (Login/Cadastro). Concentra todo o layout duplicado:
 * - ≥ lg: split em 2 colunas [BrandPanel aside | formulário].
 * - < lg: faixa de marca (BrandPanel banner) no topo + formulário abaixo — dá presença de marca no
 *   tablet/mobile e evita o formulário "boiando" no vazio onde o aside some.
 * A página só fornece title/subtitle/headline/subline, o conteúdo do <form> (children) e o footer
 * de troca de tela. Tudo token-driven; animação de entrada preservada.
 */
import { useEffect, useRef, type ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { BrandPanel } from './BrandPanel'
import { Logo } from './Logo'

// Mapa literal (Tailwind v4 JIT não enxerga `max-w-${x}` montado por template string).
const MAX_W = { sm: 'max-w-sm', md: 'max-w-md' } as const

export function AuthLayout({
  headline,
  subline,
  title,
  subtitle,
  maxWidth = 'sm',
  brand,
  children,
  footer,
  focusKey,
}: {
  headline: string
  subline: string
  title: string
  subtitle: string
  maxWidth?: 'sm' | 'md'
  brand?: string
  children: ReactNode
  footer?: ReactNode
  /**
   * A11y de fluxos multi-passo (ex.: acesso → recuperar → redefinir): quando muda, o foco vai para o título
   * da tela, fazendo o leitor de tela anunciar a nova etapa (mudança de contexto sem recarregar a página).
   * `undefined` (Login/Cadastro de tela única) = comportamento original, sem mover foco.
   */
  focusKey?: string | number
}) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (focusKey === undefined) return
    titleRef.current?.focus()
  }, [focusKey])
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* ≥ lg: painel lateral da marca */}
      <BrandPanel headline={headline} subline={subline} variant="aside" brand={brand} />

      {/* coluna do formulário (única visível < lg) */}
      <div className="flex flex-col">
        {/* < lg: faixa de marca no topo */}
        <BrandPanel headline={headline} subline={subline} variant="banner" brand={brand} className="lg:hidden" />

        {/* < lg: form ancorado ao topo (logo abaixo do banner, sem boiar); ≥ lg: centralizado na coluna */}
        <main className="flex flex-1 items-start justify-center bg-background px-6 py-12 lg:items-center">
          <div
            className={cn(
              'w-full motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500',
              MAX_W[maxWidth],
            )}
          >
            <Logo brand={brand} className="mb-8" />

            <div className="space-y-2">
              {/* tabIndex=-1 só quando há focusKey: alvo de foco programático na troca de etapa (sem virar
                  tab-stop normal). outline-none: foco é programático, não precisa do anel visível no h1. */}
              <h1 ref={titleRef} tabIndex={focusKey === undefined ? undefined : -1} className="ty-h3 outline-none">{title}</h1>
              <p className="ty-body-sm text-muted-foreground">{subtitle}</p>
            </div>

            <div className="mt-8">{children}</div>

            {footer && <div className="mt-8 text-center">{footer}</div>}
          </div>
        </main>
      </div>
    </div>
  )
}
