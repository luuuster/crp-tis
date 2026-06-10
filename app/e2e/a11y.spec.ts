import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { login, setTheme, type Brand, type Mode } from './helpers'

// A dimensão que o axe.test.tsx (jsdom) NÃO cobre: CONTRASTE renderizado. Aqui o navegador real
// aplica os tokens (OKLCH → sRGB) e o axe mede color-contrast de verdade — nas 4 combinações
// marca × tema, nas 2 páginas pós-login.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

type V = Awaited<ReturnType<AxeBuilder['analyze']>>['violations'][number]
const fmt = (vs: V[]) => vs.map((v) => `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length}x)`).join('\n')
const scan = (page: Parameters<typeof login>[0]) => new AxeBuilder({ page }).withTags(TAGS).analyze()

const BRANDS: Brand[] = ['crp', 'marca-b']
const MODES: Mode[] = ['light', 'dark']
const TABS = [
  { tab: 'Dashboard', label: 'Dashboard' },
  { tab: 'Componentes', label: 'Componentes' },
] as const

test.describe('axe REAL — contraste renderizado', () => {
  for (const brand of BRANDS)
    for (const mode of MODES)
      for (const { tab, label } of TABS) {
        test(`${label} · ${brand} · ${mode}`, async ({ page }) => {
          await login(page)
          await setTheme(page, brand, mode)
          await page.getByRole('tab', { name: tab }).click()
          await page.waitForTimeout(300)
          const r = await scan(page)
          expect(r.violations, fmt(r.violations)).toEqual([])
        })
      }
})
