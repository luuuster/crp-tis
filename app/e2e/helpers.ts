import { type Page, expect } from '@playwright/test'

export type Brand = 'crp' | 'marca-b'
export type Mode = 'light' | 'dark'

// "auth" simulada: qualquer e-mail válido + a senha de demo entram.
export async function login(page: Page) {
  await page.goto('/')
  await page.getByLabel('E-mail').fill('demo@empresa.com')
  await page.getByLabel('Senha', { exact: true }).fill('123456')
  await page.getByRole('button', { name: 'Entrar' }).click()
  // as tabs Dashboard/Componentes só existem DEPOIS de logado — sinal de que a view trocou.
  await expect(page.getByRole('tab', { name: 'Componentes' })).toBeVisible()
}

// Login → "Criar conta" → tela de cadastro (espera o 1º campo aparecer).
export async function gotoRegister(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page.getByLabel(/Nome completo/)).toBeVisible()
}

// Acerta marca + tema clicando nos toggles flutuantes (mesma fonte de verdade do app:
// [data-brand] + .dark no <html>). Idempotente: só clica se o estado atual divergir.
export async function setTheme(page: Page, brand: Brand, mode: Mode) {
  const html = page.locator('html')

  const curBrand: Brand = (await html.getAttribute('data-brand')) === 'marca-b' ? 'marca-b' : 'crp'
  if (curBrand !== brand) await page.getByRole('button', { name: /Trocar para/ }).click()

  const curDark = ((await html.getAttribute('class')) || '').split(/\s+/).includes('dark')
  if ((mode === 'dark') !== curDark) await page.getByRole('button', { name: /Mudar para tema/ }).click()

  await page.waitForTimeout(120) // deixa a re-tematização assentar
}
