import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import axe from 'axe-core'

import { App } from './App'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { Dashboard } from './pages/Dashboard'
import { Showcase } from './pages/Showcase'
import { TooltipProvider } from './components/ui/tooltip'

// Gate permanente de a11y estrutural (axe-core sobre o DOM renderizado).
// - color-contrast fica DESLIGADO: jsdom não tem layout/stylesheet — contraste já é validado
//   de verdade (e fatal) em build/check.mjs, sobre os tokens reais.
// - Temas/marcas não mudam o resultado aqui pelo mesmo motivo (classes não aplicam CSS em jsdom);
//   a estrutura ARIA é a mesma nos 4 temas.
// Qualquer violação => teste falha => npm test (e o CI) ficam vermelhos.
async function expectNoViolations(ui: React.ReactElement) {
  const { container } = render(ui)
  const result = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  })
  const resumo = result.violations
    .map((v) => `[${v.impact}] ${v.id}: ${v.help} → ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)
    .join('\n')
  expect(result.violations, `violações axe:\n${resumo}`).toHaveLength(0)
}

describe('axe — zero violações por página', () => {
  it('App (estado inicial: login)', async () => {
    await expectNoViolations(<App />)
  })
  it('LoginPage', async () => {
    await expectNoViolations(<LoginPage onLogin={() => {}} onCreateAccount={() => {}} />)
  })
  it('RegisterPage', async () => {
    await expectNoViolations(<RegisterPage onBackToLogin={() => {}} onRegistered={() => {}} />)
  })
  it('Dashboard', async () => {
    await expectNoViolations(<TooltipProvider><Dashboard /></TooltipProvider>)
  })
  it('Showcase', async () => {
    await expectNoViolations(<TooltipProvider><Showcase /></TooltipProvider>)
  })
})
