import { test, expect } from '@playwright/test'
import { contrastOnStack } from './wcag'
import { login, setTheme, type Brand, type Mode } from './helpers'

// AUDITORIA DE FOCO (WCAG 2.4.7 / 1.4.11): todo elemento na ordem de tabulação precisa de um
// indicador de foco VISÍVEL (outline ≥2px sólido OU um ring de box-shadow) e com contraste ≥3:1
// contra o fundo onde ele é desenhado. É o guard-rail que torna impossível repetir o bug do stepper
// (foco que sumia no dark) — sem depender do olho.
//
// Truque: desligamos transition/animation antes de medir, então o outline é IMEDIATO e determinístico
// (sem o flash do `transition-all` que media o outline do UA no meio do caminho).

const BRANDS: Brand[] = ['crp', 'marca-b']
const MODES: Mode[] = ['light', 'dark']
const NO_MOTION = '*,*::before,*::after{transition:none!important;animation:none!important}'

type FocusData = {
  tag: string; label: string
  outlineStyle: string; outlineWidth: number; outlineColor: string
  ring: string // box-shadow
  bgStack: string[] // do pai até a raiz (p/ compor o fundo sob o outline)
}

async function collectFocusStops(page: import('@playwright/test').Page): Promise<FocusData[]> {
  const out: FocusData[] = []
  const seen = new Set<string>()
  await page.keyboard.press('Tab')
  for (let i = 0; i < 60; i++) {
    const d = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null
      if (!el || el === document.body) return null
      const cs = getComputedStyle(el)
      const bgStack: string[] = []
      let p: HTMLElement | null = el.parentElement
      while (p) {
        const bg = getComputedStyle(p).backgroundColor
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') bgStack.push(bg)
        p = p.parentElement
      }
      const r = el.getBoundingClientRect()
      return {
        tag: el.tagName.toLowerCase(),
        label: (el.getAttribute('aria-label') || el.textContent || el.getAttribute('placeholder') || '').trim().slice(0, 30),
        outlineStyle: cs.outlineStyle, outlineWidth: parseFloat(cs.outlineWidth) || 0, outlineColor: cs.outlineColor,
        ring: cs.boxShadow,
        bgStack,
        sig: el.tagName + '|' + Math.round(r.x) + ',' + Math.round(r.y) + ',' + Math.round(r.width),
      }
    })
    if (!d) break
    if (seen.has(d.sig)) break // voltou ao começo / ciclou
    seen.add(d.sig)
    out.push(d)
    await page.keyboard.press('Tab')
  }
  return out
}

test.describe('auditoria de FOCO — Gerador', () => {
  for (const brand of BRANDS)
    for (const mode of MODES) {
      test(`foco visível ${brand} · ${mode}`, async ({ page }) => {
        await login(page)
        await setTheme(page, brand, mode)
        await page.getByRole('tab', { name: 'Gerador' }).click()
        await page.waitForTimeout(200)
        await page.addStyleTag({ content: NO_MOTION })

        const stops = await collectFocusStops(page)
        expect(stops.length, 'esperava elementos focáveis no Gerador').toBeGreaterThan(8)

        const fails: string[] = []
        for (const s of stops) {
          const hasOutline = s.outlineStyle !== 'none' && s.outlineWidth >= 2
          const hasRing = s.ring && s.ring !== 'none' // fallback p/ componentes ainda em ring
          if (!hasOutline && !hasRing) {
            fails.push(`SEM indicador: <${s.tag}> "${s.label}"`)
            continue
          }
          if (hasOutline) {
            const ratio = contrastOnStack(s.outlineColor, s.bgStack)
            if (ratio < 3) fails.push(`indicador fraco (${ratio.toFixed(2)}:1 < 3): <${s.tag}> "${s.label}"`)
          }
        }
        expect(fails, `${brand}·${mode} — foco:\n${fails.join('\n')}`).toEqual([])
      })
    }
})
