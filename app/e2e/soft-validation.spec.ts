import { test, expect } from '@playwright/test'
import { login } from './helpers'

// Validação SOFT do wizard (Gerador): ao tentar avançar com obrigatório em branco, o campo é
// DESTACADO (aria-invalid + mensagem) — mas o fluxo NÃO TRAVA (um 2º clique prossegue). É o que o
// usuário pediu: "mostrar onde estão os campos não preenchidos, sem travar a continuidade".
// No briefing inicial alguns obrigatórios começam vazios (Budget, Horário, Carga) — o teste usa o
// "Budget" como alvo, mas o destaque vale para todos os faltantes.

test.describe('validação SOFT — Gerador (mostra faltantes, não trava)', () => {
  test('1º clique destaca o campo vazio e não pula; 2º clique avança mesmo assim', async ({ page }) => {
    await login(page)
    await page.getByRole('tab', { name: 'Gerador' }).click()

    const budget = page.locator('#budget')
    await expect(budget).toBeVisible()
    await expect(budget).not.toHaveAttribute('aria-invalid', 'true') // limpo no início
    await expect(page.getByText(/Etapa 01/)).toBeVisible()

    // 1º clique em prosseguir → destaca (aria-invalid + mensagem) e SEGURA nesta etapa
    await page.getByRole('button', { name: /Avançar para/ }).click()
    await expect(budget).toHaveAttribute('aria-invalid', 'true')
    await expect(page.locator('#budget-error')).toBeVisible()
    await expect(page.getByText(/Etapa 01/)).toBeVisible() // não pulou no 1º clique

    // NÃO TRAVA: a ação "Avançar assim mesmo" do aviso prossegue, mesmo com o campo vazio
    await page.getByRole('button', { name: 'Avançar assim mesmo' }).click()
    await expect(page.getByText(/Etapa 02/)).toBeVisible()

    // e o Stepper sinaliza a etapa deixada incompleta
    await expect(page.getByText('Incompleta')).toBeVisible()
  })

  test('preencher o campo remove o destaque na hora (reativo)', async ({ page }) => {
    await login(page)
    await page.getByRole('tab', { name: 'Gerador' }).click()
    await page.getByRole('button', { name: /Avançar para/ }).click()

    const budget = page.locator('#budget')
    await expect(budget).toHaveAttribute('aria-invalid', 'true')
    await budget.fill('R$ 10.000 — 14.000')
    await expect(budget).not.toHaveAttribute('aria-invalid', 'true')
    await expect(page.locator('#budget-error')).toHaveCount(0)
  })
})
