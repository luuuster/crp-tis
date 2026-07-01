import { describe, expect, it, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'

import { App } from './App'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { Dashboard } from './pages/Dashboard'
import { Entrevistas, AgendamentoDetalhe, AgendarEntrevista, type Evento } from './pages/Entrevistas'
import { EntrevistasIA, CandidatoDetalhe, AvaliacaoIAConteudo, buildDetalhe, type Candidato } from './pages/EntrevistasIA'
import { Candidatos, CandidatoPerfil, ProcessoDetalhe, buildProcessos, type Candidato as CandidatoBanco } from './pages/Candidatos'
import { Usuarios } from './pages/Usuarios'
import { EditarPerfil } from './pages/EditarPerfil'
import { Pipeline } from './pages/Pipeline'
import { InscricaoVaga } from './pages/InscricaoVaga'
import { SegundaEtapa } from './pages/SegundaEtapa'
import { CandidatoAcesso } from './pages/CandidatoAcesso'
import { CandidatoPainel } from './pages/CandidatoPainel'
import { CandidatoCandidaturas } from './pages/CandidatoCandidaturas'
import { PainelSkeleton } from './components/PainelSkeleton'
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

// Alguns componentes (CandidatoPainel, modal logado) escrevem a sessão do candidato em localStorage.
// Limpa entre os testes p/ o estado "deslogado" (formulário público) não vazar de um teste pro outro.
afterEach(() => {
  try { localStorage.clear() } catch { /* jsdom sempre tem, mas por garantia */ }
  // CandidatoAcesso deriva a etapa da URL (fluxo "esqueci a senha"): reseta p/ "/" (= login) entre testes
  // pra a rota de um teste não vazar pro próximo.
  try { window.history.pushState({}, '', '/') } catch { /* idem */ }
})

describe('axe — zero violações por página', () => {
  it('App (estado inicial: login)', async () => {
    await expectNoViolations(<App />)
  })
  it('LoginPage', async () => {
    await expectNoViolations(<LoginPage onLogin={() => {}} />)
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
  it('EditarPerfil', async () => {
    await expectNoViolations(<TooltipProvider><EditarPerfil onNavigate={() => {}} /></TooltipProvider>)
  })
  it('Pipeline (funil de contratação)', async () => {
    await expectNoViolations(<TooltipProvider><Pipeline onNavigate={() => {}} /></TooltipProvider>)
  })
  it('InscricaoVaga (página pública do candidato — aba descrição)', async () => {
    await expectNoViolations(<InscricaoVaga onSair={() => {}} />)
  })
  it('InscricaoVaga — formulário de inscrição', async () => {
    const user = userEvent.setup()
    render(<InscricaoVaga onSair={() => {}} />)
    await user.click(screen.getByRole('button', { name: /candidatar/i })) // rodapé leva ao formulário
    await screen.findByLabelText(/nome completo/i) // garante que o formulário montou
    const result = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } })
    const resumo = result.violations
      .map((v) => `[${v.impact}] ${v.id}: ${v.help} → ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)
      .join('\n')
    expect(result.violations, `violações axe:\n${resumo}`).toHaveLength(0)
  })
  it('InscricaoVaga — modal "Confirmar candidatura" (candidato logado)', async () => {
    localStorage.setItem('candidato.email', 'ana.souza@exemplo.com') // simula logado
    try {
      const user = userEvent.setup()
      // Logado, o header mostra a conta (ContaMenu usa Tooltip) — precisa do provider, igual ao CandidatoApp.
      render(<TooltipProvider><InscricaoVaga /></TooltipProvider>)
      await user.click(screen.getByRole('button', { name: /candidatar/i })) // logado: abre o modal, não o form
      await screen.findByRole('dialog')
      const result = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } })
      const resumo = result.violations
        .map((v) => `[${v.impact}] ${v.id}: ${v.help} → ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)
        .join('\n')
      expect(result.violations, `violações axe:\n${resumo}`).toHaveLength(0)
    } finally {
      localStorage.removeItem('candidato.email') // não vaza p/ os outros testes
    }
  })
  it('SegundaEtapa (questionário do processo)', async () => {
    await expectNoViolations(<SegundaEtapa nome="Teste Candidato" vaga="Desenvolvedor Backend · Pleno" onConcluir={() => {}} onSair={() => {}} />)
  })
  it('CandidatoAcesso (login do candidato)', async () => {
    await expectNoViolations(<CandidatoAcesso />)
  })
  // Fluxo "esqueci a senha" — cada etapa tem rota própria; o CandidatoAcesso deriva a etapa da URL,
  // então auditamos cada tela fixando o pathname antes de renderizar. (afterEach reseta p/ "/".)
  it('CandidatoAcesso — recuperar senha (pede e-mail)', async () => {
    window.history.pushState({}, '', '/acesso/recuperar')
    await expectNoViolations(<CandidatoAcesso />)
  })
  it('CandidatoAcesso — e-mail enviado (confirmação)', async () => {
    window.history.pushState({}, '', '/acesso/recuperar/enviado')
    await expectNoViolations(<CandidatoAcesso />)
  })
  it('CandidatoAcesso — redefinir senha (nova senha)', async () => {
    window.history.pushState({}, '', '/redefinir_senha')
    await expectNoViolations(<CandidatoAcesso />)
  })
  it('CandidatoAcesso — senha redefinida (sucesso)', async () => {
    window.history.pushState({}, '', '/redefinir_senha/sucesso')
    await expectNoViolations(<CandidatoAcesso />)
  })
  it('CandidatoPainel (mural de vagas do candidato)', async () => {
    await expectNoViolations(
      <TooltipProvider><CandidatoPainel brand="crp" mode="light" onCycleBrand={() => {}} onToggleMode={() => {}} onSair={() => {}} /></TooltipProvider>,
    )
  })
  it('CandidatoCandidaturas (minhas candidaturas — em andamento)', async () => {
    await expectNoViolations(
      <TooltipProvider><CandidatoCandidaturas tipo="andamento" brand="crp" mode="light" onCycleBrand={() => {}} onToggleMode={() => {}} onSair={() => {}} /></TooltipProvider>,
    )
  })
  it('CandidatoCandidaturas (candidaturas finalizadas)', async () => {
    await expectNoViolations(
      <TooltipProvider><CandidatoCandidaturas tipo="finalizadas" brand="crp" mode="light" onCycleBrand={() => {}} onToggleMode={() => {}} onSair={() => {}} /></TooltipProvider>,
    )
  })
  it('PainelSkeleton (esqueleto de carregamento do mural)', async () => {
    await expectNoViolations(<PainelSkeleton />)
  })
  it('CandidatoPainel — filtro "Local de trabalho" aberto (popover portaled)', async () => {
    const user = userEvent.setup()
    render(<TooltipProvider><CandidatoPainel brand="crp" mode="light" onCycleBrand={() => {}} onToggleMode={() => {}} onSair={() => {}} /></TooltipProvider>)
    await user.click(screen.getByRole('button', { name: /local de trabalho/i }))
    await screen.findByText('Aplicar') // garante que o popover montou (conteúdo é portaled)
    const result = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } })
    const resumo = result.violations
      .map((v) => `[${v.impact}] ${v.id}: ${v.help} → ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)
      .join('\n')
    expect(result.violations, `violações axe:\n${resumo}`).toHaveLength(0)
  })
  it('JobGenerator (lista de vagas)', async () => {
    await expectNoViolations(<TooltipProvider><JobGenerator onNavigate={() => {}} /></TooltipProvider>)
  })
  it('Showcase', async () => {
    await expectNoViolations(<TooltipProvider><Showcase /></TooltipProvider>)
  })
})
