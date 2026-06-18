import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'

// Helpers compartilhados do axe ESTRUTURAL (ARIA, roles, labels, heading-order) — usados pelo
// a11y.spec.ts e pelo showcase-a11y.spec.ts.
//
// CONTRASTE fica DESLIGADO de propósito: o axe-core converte OKLCH→sRGB de forma NÃO-confiável
// (falsos positivos perto do limiar). O contraste é validado com PRECISÃO (e fatal) por culori em
// contrast.spec.ts e em build/check.mjs. NÃO ligar 'color-contrast' aqui.
export const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

type V = Awaited<ReturnType<AxeBuilder['analyze']>>['violations'][number]

export const fmt = (vs: V[]) =>
  vs
    .map((v) => `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length}x) → ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)
    .join('\n')

export const scan = (page: Page) =>
  new AxeBuilder({ page }).withTags(TAGS).disableRules(['color-contrast']).analyze()

// Para OVERLAY ABERTO: além do color-contrast, desligamos `aria-hidden-focus`. Ao abrir um overlay
// modal, o Radix FocusScope PRENDE o foco dentro dele (o fundo fica inalcançável por teclado) e marca
// o fundo com aria-hidden (o leitor de tela pula). O axe é ESTÁTICO e não enxerga o focus-trap em
// runtime → falso-positivo clássico de libs de overlay. Todas as outras regras seguem ativas
// (incl. aria-required-children, que pegou o gap real do cmdk).
export const scanOverlay = (page: Page) =>
  new AxeBuilder({ page }).withTags(TAGS).disableRules(['color-contrast', 'aria-hidden-focus']).analyze()
