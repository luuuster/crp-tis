import { test, expect } from '@playwright/test'
import { fmt, scan } from './axe'
import { login, setTheme, gotoMenu, abrirVaga } from './helpers'
import { BRANDS, MODES } from './themes'

// axe ESTRUTURAL no DOM renderizado (ARIA, roles, labels, heading-order) — nas 4 combinações
// marca × tema, nas telas de auth e pós-login. É o que o jsdom (axe.test.tsx) não exercita: o
// fluxo real do app (dock + navegação). Helpers (TAGS/scan/fmt) vivem em ./axe (compartilhados com
// showcase-a11y.spec.ts). CONTRASTE fica desligado no axe — validado por culori (ver ./axe e contrast.spec).
// Login cai na Dashboard (AppShell); as demais telas vêm pelo MENU (sidebar), não pelo dock de abas.
const TABS: { label: string; go: (p: Parameters<typeof login>[0]) => Promise<void> }[] = [
  { label: 'Dashboard', go: async () => {} },
  { label: 'Vagas', go: async (p) => { await gotoMenu(p, 'Vagas') } },
  { label: 'Componentes', go: async (p) => { await gotoMenu(p, 'Componentes') } },
]

test.describe('axe estrutural — telas de auth', () => {
  for (const brand of BRANDS)
    for (const mode of MODES) {
      test(`Login · ${brand} · ${mode}`, async ({ page }) => {
        await page.goto('/')
        await setTheme(page, brand, mode)
        const r = await scan(page)
        expect(r.violations, fmt(r.violations)).toEqual([])
      })
      // Cadastro saiu do recrutador (virou do candidato, porta 5172 — dev-only, fora do preview).
      // A11y estrutural do form fica coberta no jsdom (axe.test.tsx → RegisterPage).
    }
})

test.describe('axe estrutural — app (pós-login)', () => {
  for (const brand of BRANDS)
    for (const mode of MODES)
      for (const { label, go } of TABS) {
        test(`${label} · ${brand} · ${mode}`, async ({ page }) => {
          await login(page)
          await setTheme(page, brand, mode)
          await go(page)
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
        await gotoMenu(page, 'Vagas')
        await abrirVaga(page)
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
        await gotoMenu(page, 'Vagas')
        await abrirVaga(page)
        await page.getByRole('button', { name: 'Adicionar benefício' }).click()
        await expect(page.getByRole('dialog', { name: /Adicionar benefício/ })).toBeVisible()
        await page.waitForTimeout(200)
        const r = await scan(page)
        expect(r.violations, fmt(r.violations)).toEqual([])
      })
    }
})
