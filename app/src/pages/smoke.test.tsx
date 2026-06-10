import { test } from 'vitest'
import { render } from '@testing-library/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Dashboard } from './Dashboard'
import { Showcase } from './Showcase'

// Smoke: garante que as telas pesadas (recharts no Dashboard, galeria do Showcase)
// montam sem lançar — cobre imports e composição básica.
test('Dashboard monta sem lançar', () => {
  render(<TooltipProvider><Dashboard /></TooltipProvider>)
})

test('Showcase monta sem lançar', () => {
  render(<TooltipProvider><Showcase /></TooltipProvider>)
})
