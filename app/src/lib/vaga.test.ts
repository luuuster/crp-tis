import { describe, expect, it } from 'vitest'

import { buildDesc, type Briefing, type Perfil } from './vaga'

const briefing = (over: Partial<Briefing> = {}): Briefing => ({
  cargo: 'Dev', nivel: 'Pleno', modelo: 'Remoto', cliente: 'Projeto X', gestor: 'Maria',
  desafio: '', objetivo: '', local: 'São Paulo', horario: '', carga: '', motivo: '', quantidade: 1,
  budget: '', modalidade: '', beneficios: [], processoSeletivo: [], ...over,
})
const perfil = (over: Partial<Perfil> = {}): Perfil => ({
  formacao: '', experiencia: '', exigencias: [], stackObrigatoria: [],
  conhecimentosDesejaveis: [], responsabilidades: '', habilidades: [], justificativa: '', ...over,
})

describe('buildDesc', () => {
  it('título = "<cargo> <nivel> · <modelo>"', () => {
    expect(buildDesc(briefing(), perfil()).titulo).toBe('Dev Pleno · Remoto')
  })

  it('o tom altera SÓ o resumo', () => {
    const b = briefing()
    const p = perfil()
    expect(buildDesc(b, p, 'Equilibrado').resumo).toMatch(/^Buscamos Dev Pleno/)
    expect(buildDesc(b, p, 'Descontraído').resumo).toMatch(/^Bora construir junto\?/)
    expect(buildDesc(b, p, 'Formal').resumo).toMatch(/^A organização seleciona/)
    const eq = buildDesc(b, p, 'Equilibrado')
    const fo = buildDesc(b, p, 'Formal')
    expect(fo.titulo).toBe(eq.titulo)
    expect(fo.responsabilidades).toEqual(eq.responsabilidades)
    expect(fo.requisitos).toEqual(eq.requisitos)
  })

  it('responsabilidades: split por .;\\n + trim + capitaliza a 1ª letra', () => {
    expect(buildDesc(briefing(), perfil({ responsabilidades: 'fazer x. fazer y; fazer z' })).responsabilidades)
      .toEqual(['Fazer x', 'Fazer y', 'Fazer z'])
  })

  it('responsabilidades vazias → fallback', () => {
    expect(buildDesc(briefing(), perfil({ responsabilidades: '   ' })).responsabilidades)
      .toEqual(['Atuar nas entregas do time conforme o briefing.'])
  })

  it('requisitos: só blocos não-vazios', () => {
    expect(buildDesc(briefing(), perfil({ formacao: 'CS', experiencia: '3 anos' })).requisitos)
      .toEqual(['Formação: CS', 'Experiência: 3 anos'])
  })

  it('requisitos completos: 6 itens na ordem canônica', () => {
    const r = buildDesc(briefing(), perfil({
      formacao: 'CS', experiencia: '3 anos', exigencias: ['CNH'], stackObrigatoria: ['React', 'Node'],
      conhecimentosDesejaveis: ['AWS'], habilidades: ['Comunicação'],
    })).requisitos
    expect(r).toEqual([
      'Formação: CS', 'Experiência: 3 anos', 'Exigências: CNH',
      'Stack obrigatória: React, Node', 'Desejável: AWS', 'Perfil comportamental: Comunicação',
    ])
  })

  it('benefícios passam intactos', () => {
    expect(buildDesc(briefing({ beneficios: ['VR', 'Plano'] }), perfil()).beneficios).toEqual(['VR', 'Plano'])
  })
})
