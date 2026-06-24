import { test, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginPage } from './LoginPage'

test('e-mail inválido mostra mensagem do zod', async () => {
  const user = userEvent.setup()
  render(<LoginPage />)
  await user.type(screen.getByLabelText(/e-mail/i), 'invalido')
  await user.type(screen.getByLabelText('Senha'), '123456')
  await user.click(screen.getByRole('button', { name: /entrar/i }))
  expect(await screen.findByText(/informe um e-mail válido/i)).toBeInTheDocument()
})

test('senha curta mostra mensagem do zod', async () => {
  const user = userEvent.setup()
  render(<LoginPage />)
  await user.type(screen.getByLabelText(/e-mail/i), 'a@b.com')
  await user.type(screen.getByLabelText('Senha'), '123')
  await user.click(screen.getByRole('button', { name: /entrar/i }))
  expect(await screen.findByText(/ao menos 6 caracteres/i)).toBeInTheDocument()
})

test('senha errada mostra erro de credencial e NÃO chama onLogin', async () => {
  const user = userEvent.setup()
  const onLogin = vi.fn()
  render(<LoginPage onLogin={onLogin} />)
  await user.type(screen.getByLabelText(/e-mail/i), 'recrutador@talentai.com')
  await user.type(screen.getByLabelText('Senha'), 'senhaerrada')
  await user.click(screen.getByRole('button', { name: /entrar/i }))
  // a "auth" simulada tem delay (~1100ms) — espera com timeout folgado
  expect(await screen.findByText(/e-mail ou senha incorretos/i, {}, { timeout: 3000 })).toBeInTheDocument()
  expect(onLogin).not.toHaveBeenCalled()
})

test('credenciais de demo (recrutador@talentai.com / talentai123) chamam onLogin', async () => {
  const user = userEvent.setup()
  const onLogin = vi.fn()
  render(<LoginPage onLogin={onLogin} />)
  await user.type(screen.getByLabelText(/e-mail/i), 'recrutador@talentai.com')
  await user.type(screen.getByLabelText('Senha'), 'talentai123')
  await user.click(screen.getByRole('button', { name: /entrar/i }))
  await waitFor(() => expect(onLogin).toHaveBeenCalledTimes(1), { timeout: 3000 })
})

