"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

// O app controla light/dark pela classe .dark no <html> (sem next-themes), entao o tema do
// toast vem por prop (App passa o mode atual). Cores e raio saem do contrato CRP.
// position top-center + richColors: o feedback aparece no TOPO/CENTRO da tela e com COR FORTE por
// tipo (sucesso/erro/aviso/info), usando os pares FILL + -foreground do DS (AA por tema) — não o
// cinza fraco do popover. Sombra reforçada (shadow-xl) p/ destacar da tela.
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      position="bottom-right"
      richColors
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast: "!shadow-xl",
          // a descrição herda a cor do tipo (texto sobre o fill/superfície do tipo) — sem atenuar, p/ manter AA.
          description: "!text-current",
          // botão de ação (ex.: "Avançar assim mesmo"): botão ÂMBAR sólido do DS (par warning/-foreground,
          // AA no check.mjs) em vez do pill preto padrão do sonner. Só os toasts de aviso usam ação hoje.
          actionButton: "!bg-warning !text-warning-foreground !font-semibold !rounded-md hover:!bg-warning/90",
        },
      }}
      style={
        {
          // toast NEUTRO (sem tipo) — superfície de popover do DS
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius-md)",
          // richColors por TIPO → tokens do DS (fill sólido + -foreground = par AA validado no check.mjs)
          "--success-bg": "var(--success)",
          "--success-text": "var(--success-foreground)",
          "--success-border": "var(--success)",
          "--error-bg": "var(--destructive)",
          "--error-text": "var(--destructive-foreground)",
          "--error-border": "var(--destructive)",
          // AVISO em TOM SOFT (pedido do usuário): superfície de popover levemente tingida de âmbar (como os
          // avisos bg-warning/10 do resto do app), texto -text (AA sobre card/background) e borda âmbar suave —
          // calmo, não o bloco laranja sólido. Usa --color-warning-text (alias Tailwind) p/ evitar o ciclo CSS
          // de setar --warning-text com var(--warning-text). Mantém o ícone âmbar (richColors usa o -text).
          "--warning-bg": "color-mix(in oklab, var(--warning) 12%, var(--popover))",
          "--warning-text": "var(--color-warning-text)",
          "--warning-border": "color-mix(in oklab, var(--warning) 35%, var(--popover))",
          "--info-bg": "var(--primary)",
          "--info-text": "var(--primary-foreground)",
          "--info-border": "var(--primary)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
