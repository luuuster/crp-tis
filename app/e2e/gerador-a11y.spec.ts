import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { login, setTheme, type Brand, type Mode } from './helpers'

// A11y do Gerador com BEST-PRACTICE além do WCAG (pega landmark/região, que as tags WCAG puras não
// pegam — foi assim que apareceu o <main> faltando). color-contrast fica desligado (o axe erra OKLCH;
// o contraste é validado por pixel em contrast.spec). Só checamos `violations`: o único `incomplete`
// é o tabpanel do Radix Tabs (aria-labelledby do shell do app) — benigno.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']
type V = Awaited<ReturnType<AxeBuilder['analyze']>>['violations'][number]
const fmt = (vs: V[]) => vs.map((v) => `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length}x)`).join('\n')
const scan = (page: Parameters<typeof login>[0]) =>
  new AxeBuilder({ page }).withTags(TAGS).disableRules(['color-contrast']).analyze()

const BRANDS: Brand[] = ['crp', 'marca-b']
const MODES: Mode[] = ['light', 'dark']

test.describe('a11y Gerador (best-practice)', () => {
  for (const brand of BRANDS)
    for (const mode of MODES) {
      test(`Passo 1 — Briefing · ${brand} · ${mode}`, async ({ page }) => {
        await login(page)
        await setTheme(page, brand, mode)
        await page.getByRole('tab', { name: 'Vagas' }).click()
        await page.waitForTimeout(300)
        const r = await scan(page)
        expect(r.violations, fmt(r.violations)).toEqual([])
      })
    }
})
