import { parse, wcagContrast, converter } from 'culori'

// getComputedStyle devolve oklab/oklch (tokens do CRP são OKLCH) — converte p/ rgb 0..1 antes de compor.
const toRgb = converter('rgb')
export type Rgb = { r: number; g: number; b: number; alpha?: number }
export const rgbOf = (s: string): Rgb | null => {
  const p = parse(s)
  return p ? (toRgb(p) as Rgb) : null
}

// Compõe uma pilha de backgrounds (índice 0 = mais na frente; último = mais ao fundo) até opaco.
// Devolve {r,g,b} 0..1. Fallback branco se a pilha não fechar opaca.
export function flatten(bgStack: string[]): { r: number; g: number; b: number } {
  let base = { r: 1, g: 1, b: 1 }
  for (let i = bgStack.length - 1; i >= 0; i--) {
    const c = rgbOf(bgStack[i])
    if (!c) continue
    const a = c.alpha ?? 1
    base = { r: c.r * a + base.r * (1 - a), g: c.g * a + base.g * (1 - a), b: c.b * a + base.b * (1 - a) }
  }
  return base
}

// Contraste WCAG de uma cor (texto/borda/outline, possivelmente translúcida) sobre uma pilha de fundos.
export function contrastOnStack(colorStr: string, bgStack: string[]): number {
  const fg = rgbOf(colorStr)
  if (!fg) return 21
  const a = fg.alpha ?? 1
  const bg = flatten(bgStack)
  const comp = { mode: 'rgb' as const, r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a) }
  return wcagContrast(comp, { mode: 'rgb' as const, ...bg })
}

// Limiar AA por tamanho/peso (texto grande = ≥24px, ou ≥18.66px e bold ≥700 → 3:1; senão 4.5:1).
export function aaThreshold(fontSizePx: number, fontWeight: number): number {
  const large = fontSizePx >= 24 || (fontSizePx >= 18.66 && fontWeight >= 700)
  return large ? 3 : 4.5
}
