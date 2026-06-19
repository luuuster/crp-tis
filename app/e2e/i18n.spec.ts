import { test, expect } from '@playwright/test'
import { login } from './helpers'

// i18n: trocar o idioma no shell reflete na navegação (e persiste). Endônimos (Português/English/Español)
// são estáveis entre idiomas, então servem de âncora para abrir o seletor e escolher.
test.describe('seletor de idioma', () => {
  test('troca pt-BR → English → Español e volta, refletindo na nav', async ({ page }) => {
    await login(page)
    const sidebar = page.locator('aside').first()
    const abrir = () => page.getByRole('button', { name: /^(Idioma|Language):/ }).click()

    // pt-BR (padrão)
    await expect(sidebar.getByRole('button', { name: 'Banco de talentos' })).toBeVisible()

    // English
    await abrir()
    await page.getByRole('menuitem', { name: 'English' }).click()
    await expect(sidebar.getByRole('button', { name: 'Talent pool' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')

    // Español
    await abrir()
    await page.getByRole('menuitem', { name: 'Español' }).click()
    await expect(sidebar.getByRole('button', { name: 'Vacantes' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')

    // Persiste após reload
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')

    // Volta para pt-BR (deixa o estado limpo p/ outros testes na mesma origem)
    await abrir()
    await page.getByRole('menuitem', { name: 'Português' }).click()
    await expect(sidebar.getByRole('button', { name: 'Banco de talentos' })).toBeVisible()
  })
})
