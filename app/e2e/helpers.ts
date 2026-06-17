import { type Page, expect } from '@playwright/test'

export type Brand = 'crp' | 'marca-b'
export type Mode = 'light' | 'dark'

// "auth" simulada: só o par de demo (recrutador@talentai.com / talentai123) entra.
export async function login(page: Page) {
  await page.goto('/')
  await page.getByLabel('E-mail').fill('recrutador@talentai.com')
  await page.getByLabel('Senha', { exact: true }).fill('talentai123')
  await page.getByRole('button', { name: 'Entrar' }).click()
  // Logado → cai na Dashboard (AppShell). O botão de conta da topbar é o sinal de que a view trocou.
  await expect(page.getByRole('button', { name: 'Sua conta' })).toBeVisible()
}

// Login → "Criar conta" → tela de cadastro (espera o 1º campo aparecer).
export async function gotoRegister(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page.getByLabel(/Nome completo/)).toBeVisible()
}

// Marca + tema: toggles GLOBAIS ([data-brand] + .dark no <html>). Vivem em DOIS lugares conforme a tela:
// - dock flutuante (login/cadastro/Componentes): "Trocar para…" / "Mudar para tema…"
// - topbar do AppShell (Dashboard, Banco, Usuários, Gerador…): "Trocar marca (atual: …)" / "Tema claro|escuro"
// Casamos os dois conjuntos e usamos .first(). Idempotente: só clica se o estado atual divergir.
export async function setTheme(page: Page, brand: Brand, mode: Mode) {
  const html = page.locator('html')

  const curBrand: Brand = (await html.getAttribute('data-brand')) === 'marca-b' ? 'marca-b' : 'crp'
  if (curBrand !== brand) await page.getByRole('button', { name: /Trocar para|Trocar marca/ }).first().click()

  const curDark = ((await html.getAttribute('class')) || '').split(/\s+/).includes('dark')
  if ((mode === 'dark') !== curDark) await page.getByRole('button', { name: /Mudar para tema|Tema (claro|escuro)/ }).first().click()

  await page.waitForTimeout(120) // deixa a re-tematização assentar
}

// Navega pelo MENU do app. Desktop (≥768px): a Sidebar fixa do AppShell; os itens são botões com
// aria-label = rótulo. Mobile (<768px): abre o drawer (hambúrguer "Abrir menu") e clica o item no Dialog.
export async function gotoMenu(page: Page, label: string) {
  const isMobile = (page.viewportSize()?.width ?? 1280) < 768
  if (isMobile) {
    await page.getByRole('button', { name: 'Abrir menu' }).click()
    await page.getByRole('dialog', { name: 'Navegação principal' }).getByRole('button', { name: label, exact: true }).click()
  } else {
    await page.getByRole('button', { name: label, exact: true }).first().click()
  }
  await page.waitForTimeout(150)
}

// Entra no wizard do Gerador a partir da LISTA de vagas (o índice clica em "Abrir vaga").
export async function abrirVaga(page: Page) {
  await page.getByRole('button', { name: 'Abrir vaga' }).first().click()
  await expect(page.locator('#budget')).toBeVisible() // sinal de que o wizard (briefing) montou
}
