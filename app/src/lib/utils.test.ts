import { describe, expect, it } from 'vitest'

import { cn } from './utils'

describe('cn', () => {
  it('resolve conflito de utilitário Tailwind: o último vence', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
    expect(cn('px-2', 'p-4')).toBe('p-4')
  })
  it('descarta valores falsy', () => {
    expect(cn('text-sm', false, undefined, null, '', 'font-bold')).toBe('text-sm font-bold')
  })
  it('aceita arrays e objetos condicionais', () => {
    expect(cn(['flex', 'items-center'], { 'gap-2': true, 'gap-4': false })).toBe('flex items-center gap-2')
  })
  it('resolve conflito de background (padrão de tinta do app)', () => {
    expect(cn('bg-primary/10', 'bg-secondary/10')).toBe('bg-secondary/10')
  })
  it('vazio / no-op → string vazia', () => {
    expect(cn()).toBe('')
    expect(cn('')).toBe('')
  })
  it('é idempotente', () => {
    expect(cn(cn('px-2', 'p-4'))).toBe(cn('px-2', 'p-4'))
  })
})
