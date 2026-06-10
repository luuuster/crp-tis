import { test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'

test('renderiza a tela de login por padrão', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: /entrar na sua conta/i })).toBeInTheDocument()
})

test('alterna a marca aplicando data-brand no <html>', async () => {
  const user = userEvent.setup()
  render(<App />)
  expect(document.documentElement.getAttribute('data-brand')).toBeNull()
  await user.click(screen.getByRole('button', { name: /trocar para marca b/i }))
  expect(document.documentElement.getAttribute('data-brand')).toBe('marca-b')
  await user.click(screen.getByRole('button', { name: /trocar para tis/i }))
  expect(document.documentElement.getAttribute('data-brand')).toBeNull()
})

test('alterna o tema aplicando a classe .dark no <html>', async () => {
  const user = userEvent.setup()
  render(<App />)
  expect(document.documentElement.classList.contains('dark')).toBe(false)
  await user.click(screen.getByRole('button', { name: /mudar para tema escuro/i }))
  expect(document.documentElement.classList.contains('dark')).toBe(true)
  await user.click(screen.getByRole('button', { name: /mudar para tema claro/i }))
  expect(document.documentElement.classList.contains('dark')).toBe(false)
})

test('navega de login para cadastro pelo "Criar conta"', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('button', { name: /criar conta/i }))
  expect(await screen.findByRole('heading', { name: /crie sua conta/i })).toBeInTheDocument()
})

// silencia o ruído esperado do recharts em jsdom (dimensões 0) caso alguma view o monte
vi.spyOn(console, 'warn').mockImplementation(() => {})
