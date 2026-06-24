import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CandidatoAcesso } from './CandidatoAcesso'

// Teste de interação REAL (não axe): prova que os DOIS campos da troca de senha aceitam digitação.
// Regressão do bug em que o 2º Controller congelava por reuso de instância entre as etapas
// login→troca (mesma posição na árvore) — resolvido com `key` distinta nos forms.
describe('CandidatoAcesso — interação', () => {
  it('ambos os campos da troca de senha aceitam digitação (sem congelar o 2º)', async () => {
    const user = userEvent.setup()
    render(<CandidatoAcesso />)

    // login com a senha provisória (labels exatos p/ não casar com o botão "Mostrar senha")
    await user.type(screen.getByLabelText('E-mail'), 'a@b.com')
    await user.type(screen.getByLabelText('Senha provisória'), 'Provisoria123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    // espera a etapa de troca montar (onLogin tem setTimeout ~1s)
    await screen.findByLabelText('Nova senha', {}, { timeout: 2000 })

    await user.type(screen.getByLabelText('Nova senha'), 'MinhaSenha1!')
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'MinhaSenha1!')

    expect(screen.getByLabelText('Nova senha')).toHaveValue('MinhaSenha1!')
    expect(screen.getByLabelText('Confirmar nova senha')).toHaveValue('MinhaSenha1!')
  })
})
