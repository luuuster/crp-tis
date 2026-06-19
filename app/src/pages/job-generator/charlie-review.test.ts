import { describe, expect, it } from 'vitest'
import { BRIEFING_INICIAL, PERFIL_INICIAL } from './model'
import { contarCriticas, faixaMercado, parseFaixa, reviewVaga } from './charlie-review'
import type { Briefing, Perfil } from '@/lib/vaga'

const vaga = (b: Partial<Briefing> = {}, p: Partial<Perfil> = {}): [Briefing, Perfil] => [
  { ...BRIEFING_INICIAL, ...b },
  { ...PERFIL_INICIAL, ...p },
]
const ach = (b: Partial<Briefing> = {}, p: Partial<Perfil> = {}) => reviewVaga(...vaga(b, p))
const tem = (b: Partial<Briefing>, p: Partial<Perfil>, id: string) => ach(b, p).some((f) => f.id === id)

describe('parseFaixa', () => {
  it('lê faixa pt-BR com milhar e travessão', () => {
    expect(parseFaixa('R$ 9.000 – R$ 13.000')).toEqual({ min: 9000, max: 13000 })
  })
  it('lê "a", "k" e "mil"', () => {
    expect(parseFaixa('R$ 9.000 a R$ 13.000')).toEqual({ min: 9000, max: 13000 })
    expect(parseFaixa('9k–13k')).toEqual({ min: 9000, max: 13000 })
    expect(parseFaixa('2 mil')).toEqual({ min: 2000, max: 2000 })
  })
  it('valor único vira min=max', () => {
    expect(parseFaixa('R$ 2.000')).toEqual({ min: 2000, max: 2000 })
  })
  it('sem número legível → null', () => {
    expect(parseFaixa('A combinar')).toBeNull()
    expect(parseFaixa('')).toBeNull()
  })
})

describe('faixaMercado (cargo × nível)', () => {
  it('Backend Pleno fica na casa de 8k–13k', () => {
    const f = faixaMercado('Desenvolvedor Backend', 'Pleno')
    expect(f.min).toBe(8000)
    expect(f.max).toBe(13000)
  })
  it('cargo muda a faixa no mesmo nível (Designer < Backend < PM)', () => {
    const designer = faixaMercado('Designer UX/UI', 'Pleno').min
    const backend = faixaMercado('Desenvolvedor Backend', 'Pleno').min
    const pm = faixaMercado('Product Manager', 'Pleno').min
    expect(designer).toBeLessThan(backend)
    expect(backend).toBeLessThan(pm)
  })
})

describe('reviewVaga — salário', () => {
  it('Backend Pleno por R$ 2 mil → CRÍTICA (o caso clássico)', () => {
    const fs = ach({ cargo: 'Desenvolvedor Backend', nivel: 'Pleno', budget: 'R$ 2.000' })
    const sal = fs.find((f) => f.id === 'salario-abaixo')
    expect(sal?.severity).toBe('critica')
    expect(contarCriticas(fs)).toBe(1)
  })
  it('faixa dentro do mercado → ok, sem crítica', () => {
    const fs = ach({ cargo: 'Desenvolvedor Backend', nivel: 'Pleno', budget: 'R$ 9.000 a R$ 13.000' })
    expect(fs.find((f) => f.id === 'salario-ok')?.severity).toBe('ok')
    expect(contarCriticas(fs)).toBe(0)
  })
  it('muito acima do teto → aviso (não bloqueia)', () => {
    const fs = ach({ cargo: 'Desenvolvedor Backend', nivel: 'Pleno', budget: 'R$ 30.000 a R$ 40.000' })
    expect(fs.some((f) => f.id === 'salario-acima' && f.severity === 'aviso')).toBe(true)
    expect(contarCriticas(fs)).toBe(0)
  })
  it('budget ilegível → aviso, não crítica', () => {
    const fs = ach({ budget: 'A combinar' })
    expect(fs.some((f) => f.id === 'salario-ilegivel' && f.severity === 'aviso')).toBe(true)
    expect(contarCriticas(fs)).toBe(0)
  })
  it('budget vazio → sem achado de salário', () => {
    expect(ach({ budget: '' }).some((f) => f.id.startsWith('salario'))).toBe(false)
  })
  it('faixa larga demais → aviso de faixa ampla', () => {
    expect(tem({ cargo: 'Desenvolvedor Backend', nivel: 'Pleno', budget: 'R$ 8.000 a R$ 20.000' }, {}, 'faixa-ampla')).toBe(true)
  })
})

describe('reviewVaga — experiência × nível', () => {
  it('Júnior exigindo 6 anos → aviso de experiência alta', () => {
    expect(tem({ nivel: 'Júnior' }, { experiencia: 'Mínimo 6 anos em backend.' }, 'exp-alta')).toBe(true)
  })
  it('Sênior pedindo 1 ano → aviso de experiência baixa', () => {
    expect(tem({ nivel: 'Sênior' }, { experiencia: 'Mínimo 1 ano de experiência.' }, 'exp-baixa')).toBe(true)
  })
  it('Pleno com 3 anos → coerente, sem aviso', () => {
    expect(tem({ nivel: 'Pleno' }, { experiencia: 'Mínimo 3 anos em backend.' }, 'exp-alta')).toBe(false)
  })
})

describe('reviewVaga — jornada × modalidade', () => {
  it('Estágio com 40h → CRÍTICA (teto legal de 30h)', () => {
    const fs = ach({ modalidade: 'Estágio', carga: '40 horas' })
    expect(fs.find((f) => f.id === 'estagio-carga')?.severity).toBe('critica')
    expect(contarCriticas(fs)).toBeGreaterThanOrEqual(1)
  })
  it('Estágio com 30h → ok, sem crítica de carga', () => {
    expect(tem({ modalidade: 'Estágio', carga: '30 horas' }, {}, 'estagio-carga')).toBe(false)
  })
  it('CLT com 20h → aviso (integral é 40h+)', () => {
    const fs = ach({ modalidade: 'CLT', carga: '20 horas' })
    expect(fs.find((f) => f.id === 'clt-carga')?.severity).toBe('aviso')
  })
  it('CLT com 44h → sem aviso de carga', () => {
    expect(tem({ modalidade: 'CLT', carga: '44 horas' }, {}, 'clt-carga')).toBe(false)
  })
  it('carga vazia → sem achado de jornada', () => {
    expect(ach({ carga: '' }).some((f) => f.id === 'clt-carga' || f.id === 'estagio-carga')).toBe(false)
  })
  it('PJ com VR/VT → info de benefícios CLT', () => {
    expect(tem({ modalidade: 'PJ', beneficios: ['Vale-refeição', 'Plano de saúde'] }, {}, 'pj-beneficios')).toBe(true)
  })
})

describe('reviewVaga — ordenação', () => {
  it('crítica vem antes de aviso/ok', () => {
    const fs = ach({ cargo: 'Desenvolvedor Backend', nivel: 'Júnior', budget: 'R$ 1.000' }, { experiencia: 'Mínimo 8 anos.' })
    expect(fs[0].severity).toBe('critica')
  })
})
