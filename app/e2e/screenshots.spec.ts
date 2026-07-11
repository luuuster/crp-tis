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

  // App (depois de logar): a view persiste (crp.view), então goto('/') volta na Dashboard logada.
  // Componentes mudou pro hub de docs (/componentes via rewrite do preview) — página avulsa; o tema
  // setado na Dashboard persiste por origem (localStorage), sem re-setar na vitrine.
  await login(page)
  for (const brand of BRANDS)
    for (const mode of MODES) {
      await page.goto('/')
      await setTheme(page, brand, mode)
      await page.waitForTimeout(300)
      await page.screenshot({ path: `${OUT}/dashboard-${brand}-${mode}.png`, fullPage: true })
      await page.goto('/componentes')
      await page.waitForTimeout(300)
      await page.screenshot({ path: `${OUT}/componentes-${brand}-${mode}.png`, fullPage: true })
    }
})
