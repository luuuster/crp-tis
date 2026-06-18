import { describe, expect, it } from 'vitest'

import { toCsv, type CsvColumn } from './exportCsv'

type Row = { nome: string | null; idade: number | string | undefined }
const cols: CsvColumn<Row>[] = [
  { header: 'Nome', value: (r) => r.nome },
  { header: 'Idade', value: (r) => r.idade },
]

describe('toCsv', () => {
  it('monta cabeçalho + linhas separadas por ;', () => {
    expect(toCsv([{ nome: 'Ana', idade: 30 }], cols)).toBe('Nome;Idade\r\nAna;30')
  })

  it('escapa células com separador, aspas ou quebra de linha', () => {
    expect(toCsv([{ nome: 'Silva; João', idade: '"x"' }], cols)).toBe('Nome;Idade\r\n"Silva; João";"""x"""')
  })

  it('retorna só o cabeçalho quando não há linhas', () => {
    expect(toCsv([], cols)).toBe('Nome;Idade')
  })

  it('trata null/undefined como vazio', () => {
    expect(toCsv([{ nome: null, idade: undefined }], cols)).toBe('Nome;Idade\r\n;')
  })
})
