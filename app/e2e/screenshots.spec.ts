import { test } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { login, setTheme } from './helpers'
import { BRANDS, MODES } from './themes'

// Vitrine como artifact do PR: quem revisa VÊ a mudança visual sem rodar nada.
// Login/Dashboard/Componentes × CRP/MarcaB × light/dark = 12 PNGs (gitignored; publicados no CI).
const OUT = 'e2e/__screenshots__'

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

  // App (depois de logar). Dashboard é AppShell (nav pela sidebar); Componentes é a vitrine com dock de
  // abas — então navegamos por QUALQUER um que existir na tela atual (tab do dock OU botão da sidebar).
  const go = (name: string) =>
    page.getByRole('tab', { name }).or(page.getByRole('button', { name, exact: true })).first().click()
  await login(page)
  for (const brand of BRANDS)
    for (const mode of MODES) {
      await setTheme(page, brand, mode)
      await go('Dashboard')
      await page.waitForTimeout(300)
      await page.screenshot({ path: `${OUT}/dashboard-${brand}-${mode}.png`, fullPage: true })
      await go('Componentes')
      await page.waitForTimeout(300)
      await page.screenshot({ path: `${OUT}/componentes-${brand}-${mode}.png`, fullPage: true })
    }
})
