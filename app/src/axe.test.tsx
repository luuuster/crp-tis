import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import axe from 'axe-core'

import { App } from './App'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { Dashboard } from './pages/Dashboard'
import { Entrevistas, AgendamentoDetalhe, AgendarEntrevista, type Evento } from './pages/Entrevistas'
import { EntrevistasIA, CandidatoDetalhe, AvaliacaoIAConteudo, buildDetalhe, type Candidato } from './pages/EntrevistasIA'
import { Candidatos, CandidatoPerfil, ProcessoDetalhe, buildProcessos, type Candidato as CandidatoBanco } from './pages/Candidatos'
import { Usuarios } from './pages/Usuarios'
import { JobGenerator } from './pages/JobGenerator'
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

// Conteúdo PORTALED (Sheet/Dialog): o gate só vê o que está no DOM, e Sheets ficam atrás de estado.
// Renderiza a página, clica no gatilho (por nome acessível) p/ abrir o painel e audita o document.body
// inteiro (o portal vive fora do `container`). Espera o Radix montar (role="dialog") antes de medir.
async function expectNoViolationsOpen(ui: React.ReactElement, gatilho: string | RegExp) {
  render(ui)
  fireEvent.click(screen.getByRole('button', { name: gatilho }))
  await screen.findByRole('dialog')
  const result = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } })
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
    await expectNoViolations(<TooltipProvider><Dashboard onNavigate={() => {}} /></TooltipProvider>)
  })
  it('Entrevistas', async () => {
    await expectNoViolations(<TooltipProvider><Entrevistas onNavigate={() => {}} /></TooltipProvider>)
  })
  it('Entrevistas — detalhe do agendamento', async () => {
    const ev: Evento = { y: 2026, m: 5, d: 16, hora: '09:00', cand: 'Teste Candidato', vaga: 'Desenvolvedor Backend', tipo: 'Online' }
    await expectNoViolations(<TooltipProvider><AgendamentoDetalhe ev={ev} onReagendar={() => {}} onCancelar={() => {}} /></TooltipProvider>)
  })
  it('Entrevistas — agendar', async () => {
    await expectNoViolations(<TooltipProvider><AgendarEntrevista cand="Teste Candidato" vaga="Desenvolvedor Backend" onCancelar={() => {}} onConfirmar={() => {}} /></TooltipProvider>)
  })
  it('EntrevistasIA', async () => {
    await expectNoViolations(<TooltipProvider><EntrevistasIA onNavigate={() => {}} /></TooltipProvider>)
  })
  it('EntrevistasIA — detalhe do candidato', async () => {
    const c: Candidato = { id: 't', nome: 'Teste Candidato', email: 'teste@email.com', vaga: 'Desenvolvedor Backend', data: '01/06/2026', score: 70, status: 'Pendente' }
    await expectNoViolations(<TooltipProvider><CandidatoDetalhe c={c} onVoltar={() => {}} onAprovar={() => {}} onReprovar={() => {}} /></TooltipProvider>)
  })
  it('EntrevistasIA — avaliação IA embutida (etapa Triagem)', async () => {
    const d = buildDetalhe({ nome: 'Teste Candidato', vaga: 'Product Manager', data: '10/06/2026', score: 72 })
    await expectNoViolations(<TooltipProvider><AvaliacaoIAConteudo d={d} email="teste@email.com" vaga="Product Manager" statusLabel="Aprovado bot" /></TooltipProvider>)
  })
  it('Candidatos', async () => {
    await expectNoViolations(<TooltipProvider><Candidatos onNavigate={() => {}} /></TooltipProvider>)
  })
  it('Candidatos — perfil/histórico', async () => {
    const c: CandidatoBanco = { id: 'p', nome: 'Teste Candidato', email: 'teste@email.com', vaga: 'Desenvolvedor Backend', senioridade: 'Pleno', etapa: 'Em entrevista', score: 78, atualizado: 'ontem' }
    await expectNoViolations(<TooltipProvider><CandidatoPerfil c={c} onVoltar={() => {}} onAbrirProcesso={() => {}} /></TooltipProvider>)
  })
  it('Candidatos — detalhe do processo (reprovado)', async () => {
    const c: CandidatoBanco = { id: 'p', nome: 'Teste Candidato', email: 'teste@email.com', vaga: 'Desenvolvedor Full Stack', senioridade: 'Júnior', etapa: 'Reprovado', score: 58, atualizado: 'há 5 dias' }
    await expectNoViolations(<TooltipProvider><ProcessoDetalhe c={c} p={buildProcessos(c)[0]} onVoltar={() => {}} /></TooltipProvider>)
  })
  it('Candidatos — Charlie (Sheet aberto)', async () => {
    await expectNoViolationsOpen(<TooltipProvider><Candidatos onNavigate={() => {}} /></TooltipProvider>, 'Falar com Charlie')
  })
  it('Usuarios', async () => {
    await expectNoViolations(<TooltipProvider><Usuarios onNavigate={() => {}} /></TooltipProvider>)
  })
  it('Usuarios — cadastro (Sheet aberto)', async () => {
    await expectNoViolationsOpen(<TooltipProvider><Usuarios onNavigate={() => {}} /></TooltipProvider>, 'Cadastro de usuário')
  })
  it('JobGenerator (lista de vagas)', async () => {
    await expectNoViolations(<TooltipProvider><JobGenerator onNavigate={() => {}} /></TooltipProvider>)
  })
  it('Showcase', async () => {
    await expectNoViolations(<TooltipProvider><Showcase /></TooltipProvider>)
  })
})
