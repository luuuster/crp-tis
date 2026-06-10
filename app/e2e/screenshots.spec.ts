import { test } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { login, setTheme, type Brand, type Mode } from './helpers'

// Vitrine como artifact do PR: quem revisa VÊ a mudança visual sem rodar nada.
// Login/Dashboard/Componentes × CRP/MarcaB × light/dark = 12 PNGs (gitignored; publicados no CI).
const OUT = 'e2e/__screenshots__'
const BRANDS: Brand[] = ['crp', 'marca-b']
const MODES: Mode[] = ['light', 'dark']

test('matriz da vitrine (Login/Dashboard/Componentes × marca × tema)', async ({ page }) => {
  test.slow() // 12 telas + navegação
  mkdirSync(OUT, { recursive: true })
  await page.setViewportSize({ width: 1440, height: 900 })

  // Telas de auth (antes de logar)
  for (const brand of BRANDS)
    for (const mode of MODES) {
      await page.goto('/')
      await setTheme(page, brand, mode)
      await page.screenshot({ path: `${OUT}/login-${brand}-${mode}.png`, fullPage: true })
    }

  // App (depois de logar)
  await login(page)
  for (const brand of BRANDS)
    for (const mode of MODES) {
      await setTheme(page, brand, mode)
      await page.getByRole('tab', { name: 'Dashboard' }).click()
      await page.waitForTimeout(300)
      await page.screenshot({ path: `${OUT}/dashboard-${brand}-${mode}.png`, fullPage: true })
      await page.getByRole('tab', { name: 'Componentes' }).click()
      await page.waitForTimeout(300)
      await page.screenshot({ path: `${OUT}/componentes-${brand}-${mode}.png`, fullPage: true })
    }
})
