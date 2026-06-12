import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { login, gotoRegister, setTheme, type Brand, type Mode } from './helpers'

// axe ESTRUTURAL no DOM renderizado (ARIA, roles, labels, heading-order) — nas 4 combinações
// marca × tema, nas telas de auth e pós-login. É o que o jsdom (axe.test.tsx) não exercita: o
// fluxo real do app (dock + navegação) — foi aqui que apareceu o aria-controls inválido do <Tabs>.
//
// CONTRASTE fica DESLIGADO de propósito: o axe-core 4.12 converte OKLCH→sRGB de forma NÃO-confiável.
// Provado por pixel de canvas (o que o navegador realmente pinta):
//   oklch(0.505 0.19 258.68) → axe diz #2774d5 (4.46:1) | navegador pinta #045dce (5.81:1).
// Ele gera falsos positivos perto do limiar (botão primário light, placeholder MarcaB-dark medem
// >5.8 de verdade, mas o axe reprova). O contraste é validado com PRECISÃO (e fatal) em
// build/check.mjs via culori, que bate com o pixel real em todos os casos testados.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

type V = Awaited<ReturnType<AxeBuilder['analyze']>>['violations'][number]
const fmt = (vs: V[]) => vs.map((v) => `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length}x)`).join('\n')
const scan = (page: Parameters<typeof login>[0]) =>
  new AxeBuilder({ page }).withTags(TAGS).disableRules(['color-contrast']).analyze()

const BRANDS: Brand[] = ['crp', 'marca-b']
const MODES: Mode[] = ['light', 'dark']
const TABS = [
  { tab: 'Dashboard', label: 'Dashboard' },
  { tab: 'Gerador', label: 'Gerador' },
  { tab: 'Componentes', label: 'Componentes' },
] as const

test.describe('axe estrutural — telas de auth', () => {
  for (const brand of BRANDS)
    for (const mode of MODES) {
      test(`Login · ${brand} · ${mode}`, async ({ page }) => {
        await page.goto('/')
        await setTheme(page, brand, mode)
        const r = await scan(page)
        expect(r.violations, fmt(r.violations)).toEqual([])
      })

      test(`Cadastro · ${brand} · ${mode}`, async ({ page }) => {
        await gotoRegister(page)
        await setTheme(page, brand, mode)
        const r = await scan(page)
        expect(r.violations, fmt(r.violations)).toEqual([])
      })
    }
})

test.describe('axe estrutural — app (pós-login)', () => {
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

// O drawer do copiloto Charlie (overlay com sugestões + conversa + composer) também precisa passar.
test.describe('axe estrutural — Gerador + Charlie aberto', () => {
  for (const brand of BRANDS)
    for (const mode of MODES) {
      test(`Charlie · ${brand} · ${mode}`, async ({ page }) => {
        await login(page)
        await setTheme(page, brand, mode)
        await page.getByRole('tab', { name: 'Gerador' }).click()
        await page.getByRole('button', { name: /Falar com Charlie/i }).click()
        await page.waitForTimeout(300)
        const r = await scan(page)
        expect(r.violations, fmt(r.violations)).toEqual([])
      })
    }
})

// A MODAL flutuante de "+ adicionar" dos chips (busca + checkboxes, arrastável, sem overlay): título
// acessível, foco no campo de busca, e cada item é um checkbox real (estado anunciado). Deve passar.
test.describe('axe estrutural — modal de chips (Benefícios)', () => {
  for (const brand of BRANDS)
    for (const mode of MODES) {
      test(`Modal chips · ${brand} · ${mode}`, async ({ page }) => {
        await login(page)
        await setTheme(page, brand, mode)
        await page.getByRole('tab', { name: 'Gerador' }).click()
        await page.getByRole('button', { name: 'Adicionar benefício' }).click()
        await expect(page.getByRole('dialog', { name: /Adicionar benefício/ })).toBeVisible()
        await page.waitForTimeout(200)
        const r = await scan(page)
        expect(r.violations, fmt(r.violations)).toEqual([])
      })
    }
})
