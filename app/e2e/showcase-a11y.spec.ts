import { test, expect, type Page } from '@playwright/test'
import { fmt, scanOverlay } from './axe'
import { login, setTheme, gotoMenu, type Brand, type Mode } from './helpers'
import { A11Y_MANIFEST } from '../src/components/ui/a11y-manifest'

// AUDITORIA AXE-ABERTO: o a11y.spec varre a tela "Componentes" FECHADA; aqui abrimos CADA overlay do
// manifesto (dialog, menu, popover, tooltip, select, calendário…) e auditamos a estrutura ARIA com o
// overlay montado — nos 4 temas. Dirigido pelo manifesto: um overlay novo é auditado sozinho ao
// declarar `openTrigger`/`openVia`, sem editar este arquivo.
const BRANDS: Brand[] = ['crp', 'marca-b']
const MODES: Mode[] = ['light', 'dark']

// Só os overlays cujo contrato inclui 'axe-open' — todos os overlays do DS qualificam. (O `command`/cmdk
// emitia aria-required-children aberto por causa do `cmdk-list-sizer`; corrigido em command.tsx, agora
// auditado aberto como os demais — este sweep trava a regressão.)
const OVERLAYS = Object.values(A11Y_MANIFEST).filter(
  (e) => e.kind === 'overlay' && e.openTrigger && e.verifiedBy.includes('axe-open'),
)

function trigger(page: Page, name: string) {
  return page
    .getByRole('button', { name, exact: true })
    .or(page.getByRole('combobox', { name, exact: true }))
    .or(page.getByRole('menuitem', { name, exact: true })) // MenubarTrigger = role menuitem
    .or(page.getByRole('link', { name, exact: true }))
    .first()
}

async function abrir(page: Page, name: string, via: string) {
  if (via === 'contextmenu') {
    await page.getByText(name, { exact: true }).click({ button: 'right' })
  } else {
    const t = trigger(page, name)
    if (via === 'hover') await t.hover()
    else if (via === 'focus') await t.focus()
    else await t.click()
  }
  await page.waitForTimeout(280) // monta + assenta a animação
}

async function fechar(page: Page) {
  await page.keyboard.press('Escape')
  await page.mouse.move(2, 2) // dissipa hover/tooltip
  await page.waitForTimeout(160)
}

test.describe('axe estrutural — overlays da vitrine (abertos)', () => {
  for (const brand of BRANDS)
    for (const mode of MODES) {
      test(`Componentes · overlays · ${brand} · ${mode}`, async ({ page }) => {
        // O sweep abre/escaneia/fecha ~14 overlays em sequência (1 worker, axe real por overlay) — ~30s
        // por tema, no limite do default. Damos folga p/ não falsar timeout (não é lentidão de app).
        test.setTimeout(60_000)
        await login(page)
        await setTheme(page, brand, mode)
        await gotoMenu(page, 'Componentes')
        await page.waitForTimeout(200)

        for (const ov of OVERLAYS) {
          await abrir(page, ov.openTrigger!, ov.openVia ?? 'click')
          const r = await scanOverlay(page)
          expect(r.violations, `${ov.component} (aberto) · ${brand} · ${mode}:\n${fmt(r.violations)}`).toEqual([])
          await fechar(page)
        }
      })
    }
})
