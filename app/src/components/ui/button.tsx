import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Foco = utilitário `focus-ring` (outline, fonte única em index.css) — nunca colide com `ring` de
  // repouso nem é cortado por overflow. aria-invalid (estado de erro) segue ring, à parte.
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:focus-ring disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 dark:bg-destructive/60",
        // Ação de CAUTELA (não destrutiva) — ex.: "fechar vaga". Par warning/warning-foreground é AA.
        warning:
          "bg-warning text-warning-foreground hover:bg-warning/90",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        // Outline destrutivo: borda E texto na MESMA cor (--destructive-text, AA nos 4 temas),
        // hover com tinta destrutiva sutil. Substitui o className inline hand-rolled do "Cancelar".
        "destructive-outline":
          "border border-destructive-text bg-background text-destructive-text shadow-xs hover:bg-destructive/10 hover:text-destructive-text dark:border-destructive-text dark:bg-input/30",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-link underline-offset-4 hover:underline",
      },
      // Alturas/quadrados vêm do token de controle do DS (--button-height-*: sm 32 / md 40 / lg 44px)
      // como min-height (garante o alvo de toque AA). xs/icon-xs ficam fora da escala, p/ UI densa.
      size: {
        default: "min-h-[var(--button-height-md)] px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "min-h-[var(--button-height-sm)] gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "min-h-[var(--button-height-lg)] rounded-md px-6 has-[>svg]:px-4",
        icon: "size-[var(--button-height-md)]",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-[var(--button-height-sm)]",
        "icon-lg": "size-[var(--button-height-lg)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  isLoading = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /** Estado de carregamento acessível: liga aria-busy + aria-disabled (nome acessível
     *  preservado — sem `disabled` nativo, o botão segue focável/anunciável) e mostra o
     *  spinner com `motion-safe` (não congela quem pediu reduced-motion: some, sem girar). */
    isLoading?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }), isLoading && "pointer-events-none opacity-70")}
      {...props}
      aria-busy={isLoading || props["aria-busy"] || undefined}
      aria-disabled={isLoading || props["aria-disabled"] || undefined}
      onClick={isLoading ? (e) => e.preventDefault() : props.onClick}
    >
      {/* asChild: o Slot exige UM único filho — passar `children` direto (sem o spinner, que viraria
          um segundo nó e quebra o Slot). Sem asChild: mostra o spinner de loading antes do conteúdo. */}
      {asChild ? (
        children
      ) : (
        <>
          {isLoading && <Loader2 aria-hidden="true" className="motion-safe:animate-spin" />}
          {children}
        </>
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
