import { Link2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { A11Y_MANIFEST } from '@/components/ui/a11y-manifest'
import { DEMOS, SECTIONS } from '@/components/ui/demos'
import type { SectionId } from '@/components/ui/demos/_types'

const TOTAL = Object.keys(A11Y_MANIFEST).length

// Chips dos tokens — texto muted-foreground sobre a superfície (par validado AA no check.mjs),
// borda em --border (não-textual, 3:1). Documenta sem competir com o conteúdo.
function TokenChips({ tokens, label }: { tokens: string[]; label: string }) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label={label}>
      {tokens.map((t) => (
        <li key={t}>
          <code className="inline-block rounded-md border px-2 py-0.5 font-mono text-xs leading-5 text-muted-foreground">{t}</code>
        </li>
      ))}
    </ul>
  )
}

// Cabeçalho de seção: h2 ancorado (scroll-mt p/ não sumir sob a dock fixa) + chips de tokens.
function SectionHeader({ id, title, tokens }: { id: SectionId; title: string; tokens: string[] }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
      <h2 id={`h-${id}`} className="group/h flex items-center gap-2 font-heading text-xl font-semibold tracking-tight">
        {title}
        <a
          href={`#${id}`}
          aria-label={`Link para a seção ${title}`}
          className="rounded-sm text-muted-foreground opacity-0 transition-opacity group-hover/h:opacity-100 focus-visible:opacity-100 focus-visible:focus-ring"
        >
          <Link2 className="size-4" />
        </a>
      </h2>
      <TokenChips tokens={tokens} label={`Tokens da seção ${title}`} />
    </div>
  )
}

// Índice navegável (TOC). Sidebar fixa no desktop; <details> recolhível no mobile — ambos só âncoras.
function CatalogNav() {
  const links = SECTIONS.map((s) => (
    <li key={s.id}>
      <a href={`#${s.id}`} className="block rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground focus-visible:focus-ring">
        {s.title}
      </a>
    </li>
  ))
  return (
    <>
      <details className="rounded-lg border bg-card p-3 text-sm lg:hidden">
        <summary className="cursor-pointer font-medium">Índice de componentes</summary>
        <ul className="mt-2 space-y-0.5">{links}</ul>
      </details>
      <nav aria-label="Índice de componentes" className="hidden lg:block">
        <div className="sticky top-20">
          <p className="mb-2 px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Nesta página</p>
          <ul className="space-y-0.5 text-sm">{links}</ul>
        </div>
      </nav>
    </>
  )
}

export function Showcase() {
  return (
    <main className="mx-auto max-w-6xl px-6 pt-20 pb-16">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="#">Início</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Componentes</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="mb-10 space-y-3">
        <Badge variant="secondary">shadcn/ui × @crp/design-tokens</Badge>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Componentes tematizados pelos seus tokens</h1>
        <p className="max-w-2xl text-muted-foreground">
          Troque a <strong className="text-foreground">marca</strong> e o <strong className="text-foreground">tema</strong> no
          canto superior direito — cada componente re-tematiza em runtime, direto do contrato de tokens. Cada um tem
          contrato de a11y garantido (foco, teclado, contraste nos 4 temas) auditado no CI.
        </p>
      </section>

      <div className="lg:grid lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-10">
        <CatalogNav />

        <div className="min-w-0 space-y-12">
          {SECTIONS.map((section) => {
            const demos = DEMOS.filter((d) => d.section === section.id)
            return (
              <section key={section.id} id={section.id} aria-labelledby={`h-${section.id}`} className="scroll-mt-24 space-y-4">
                <SectionHeader id={section.id} title={section.title} tokens={section.tokens} />
                <div className="grid gap-4">
                  {demos.map((demo) => (
                    <Card key={demo.id} data-demo={demo.id} data-component={demo.component}>
                      <CardHeader>
                        <CardTitle className="text-base">{demo.title}</CardTitle>
                        {demo.desc && <CardDescription>{demo.desc}</CardDescription>}
                        {demo.tokens && demo.tokens.length > 0 && <TokenChips tokens={demo.tokens} label={`Tokens de ${demo.title}`} />}
                      </CardHeader>
                      <CardContent><demo.Render /></CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )
          })}

          <p className="pt-2 text-center text-sm text-muted-foreground">
            {TOTAL} componentes shadcn/ui · contrato de a11y garantido por @crp/design-tokens
          </p>
        </div>
      </div>
    </main>
  )
}
