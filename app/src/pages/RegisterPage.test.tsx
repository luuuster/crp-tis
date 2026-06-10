import { test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RegisterPage } from './RegisterPage'

test('renderiza o formulário de cadastro com os campos', () => {
  render(<RegisterPage />)
  expect(screen.getByRole('heading', { name: /crie sua conta/i })).toBeInTheDocument()
  expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/^Senha/)).toBeInTheDocument()
  expect(screen.getByLabelText(/^Confirmar senha/)).toBeInTheDocument()
})

test('checklist de requisitos da senha atualiza ao vivo (0/5 → 5/5)', async () => {
  const user = userEvent.setup()
  render(<RegisterPage />)
  expect(screen.getByText('0/5')).toBeInTheDocument()
  await user.type(screen.getByLabelText(/^Senha/), 'SenhaForte@9')
  await user.type(screen.getByLabelText(/^Confirmar senha/), 'SenhaForte@9')
  expect(await screen.findByText('5/5')).toBeInTheDocument()
})

test('submeter sem aceitar os termos bloqueia e NÃO chama onRegistered', async () => {
  const user = userEvent.setup()
  const onRegistered = vi.fn()
  render(<RegisterPage onRegistered={onRegistered} />)
  await user.click(screen.getByRole('button', { name: /criar conta/i }))
  expect(await screen.findByText(/aceitar os termos/i)).toBeInTheDocument()
  expect(onRegistered).not.toHaveBeenCalled()
})

test('"Entrar" no rodapé dispara onBackToLogin', async () => {
  const user = userEvent.setup()
  const onBackToLogin = vi.fn()
  render(<RegisterPage onBackToLogin={onBackToLogin} />)
  await user.click(screen.getByRole('button', { name: /^entrar$/i }))
  expect(onBackToLogin).toHaveBeenCalledTimes(1)
})
