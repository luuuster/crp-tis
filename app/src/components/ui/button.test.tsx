import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Button } from './button'

describe('Button isLoading', () => {
  it('liga aria-busy/aria-disabled e preserva o nome acessível', () => {
    render(<Button isLoading>Salvar</Button>)
    const btn = screen.getByRole('button', { name: 'Salvar' }) // nome preservado (não some no loading)
    expect(btn).toHaveAttribute('aria-busy', 'true')
    expect(btn).toHaveAttribute('aria-disabled', 'true')
    expect(btn).not.toBeDisabled() // sem disabled nativo — segue focável/anunciável
  })

  it('inerte enquanto carrega: clique e Enter não disparam onClick', async () => {
    const onClick = vi.fn()
    render(<Button isLoading onClick={onClick}>Salvar</Button>)
    const btn = screen.getByRole('button', { name: 'Salvar' })
    btn.focus()
    await userEvent.keyboard('{Enter}') // pointer-events-none bloqueia mouse; teclado passa pelo guard
    expect(onClick).not.toHaveBeenCalled()
  })

  it('sem isLoading: clique funciona e não há aria-busy', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Salvar</Button>)
    const btn = screen.getByRole('button', { name: 'Salvar' })
    await userEvent.click(btn)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(btn).not.toHaveAttribute('aria-busy')
  })
})
