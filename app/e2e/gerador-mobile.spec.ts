import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { login, setTheme } from './helpers'

// A11y do Gerador em VIEWPORT DE CELULAR (390px): trava a ESTRUTURA dos overlays full-screen novos.
// No mobile o menu lateral some e o Charlie deixava o conteúdo esmagado num painel de 300px — agora
// o MENU (drawer) e o CHARLIE ocupam a tela toda. axe best-practice (pega landmark/região, como no
// gerador-a11y); color-contrast fica desligado (o axe erra OKLCH — contraste é por pixel no contrast.spec).
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']
type V = Awaited<ReturnType<AxeBuilder['analyze']>>['violations'][number]
const fmt = (vs: V[]) => vs.map((v) => `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length}x)`).join('\n')
const scan = (page: Parameters<typeof login>[0]) =>
  new AxeBuilder({ page }).withTags(TAGS).disableRules(['color-contrast']).analyze()

test.use({ viewport: { width: 390, height: 844 } })

test.describe('a11y mobile — Gerador (390px)', () => {
  test('Passo 1 — Briefing', async ({ page }) => {
    await login(page)
    await setTheme(page, 'crp', 'light')
    await page.getByRole('tab', { name: 'Gerador' }).click()
    await page.waitForTimeout(300)
    const r = await scan(page)
    expect(r.violations, fmt(r.violations)).toEqual([])
  })

  test('Menu em tela cheia', async ({ page }) => {
    await login(page)
    await setTheme(page, 'crp', 'light')
    await page.getByRole('tab', { name: 'Gerador' }).click()
    await page.getByRole('button', { name: 'Abrir menu' }).click()
    await expect(page.getByRole('dialog', { name: 'Navegação principal' })).toBeVisible()
    await page.waitForTimeout(200)
    const r = await scan(page)
    expect(r.violations, fmt(r.violations)).toEqual([])
  })

  // No mobile o Charlie é um MODAL de verdade (Radix Dialog): foco preso/restaurado, aria-modal, Esc.
  test('Charlie em tela cheia (modal)', async ({ page }) => {
    await login(page)
    await setTheme(page, 'crp', 'dark')
    await page.getByRole('tab', { name: 'Gerador' }).click()
    await page.getByRole('button', { name: 'Falar com Charlie' }).click()
    await expect(page.getByRole('dialog', { name: /Charlie/ })).toBeVisible()
    await page.waitForTimeout(200)
    const r = await scan(page)
    expect(r.violations, fmt(r.violations)).toEqual([])
  })

  // Prova do conserto de FOCO (o axe não testa isto): o modal prende o foco ao abrir e o RESTAURA
  // ao gatilho ao fechar — o que faltava quando o Charlie era um <aside> comum no overlay.
  test('Charlie modal — foco entra e volta ao gatilho', async ({ page }) => {
    await login(page)
    await setTheme(page, 'crp', 'light')
    await page.getByRole('tab', { name: 'Gerador' }).click()
    const trigger = page.getByRole('button', { name: 'Falar com Charlie' })
    await trigger.click()
    const dialog = page.getByRole('dialog', { name: /Charlie/ })
    await expect(dialog).toBeVisible()
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true)
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  // Select vira BOTTOM SHEET no mobile (combobox → diálogo com listbox; selecionado anunciado).
  test('Select (bottom sheet)', async ({ page }) => {
    await login(page)
    await setTheme(page, 'crp', 'light')
    await page.getByRole('tab', { name: 'Gerador' }).click()
    await page.getByRole('combobox', { name: /Senioridade/ }).click()
    await expect(page.getByRole('dialog', { name: 'Selecione' })).toBeVisible()
    await page.waitForTimeout(200)
    const r = await scan(page)
    expect(r.violations, fmt(r.violations)).toEqual([])
  })

  // "Incluir benefícios" vira BOTTOM SHEET (busca + checkboxes; estado anunciado nativamente).
  test('Benefícios (bottom sheet)', async ({ page }) => {
    await login(page)
    await setTheme(page, 'marca-b', 'dark')
    await page.getByRole('tab', { name: 'Gerador' }).click()
    await page.getByRole('button', { name: 'Adicionar benefício' }).click()
    await expect(page.getByRole('dialog', { name: 'Adicionar benefício' })).toBeVisible()
    await page.waitForTimeout(200)
    const r = await scan(page)
    expect(r.violations, fmt(r.violations)).toEqual([])
  })
})
