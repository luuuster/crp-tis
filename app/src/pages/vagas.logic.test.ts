import { describe, expect, it } from 'vitest'

import { BENEF, PROCESSO, mkGen, mkVaga } from './vagas.logic'
import { type Briefing, type Perfil } from '@/lib/vaga'

const meta = { id: '99', data: '01/01/2026', inscritos: 12, aprovados: 3, status: 'Aberta' as const }

const briefing: Briefing = {
  cargo: 'Desenvolvedor Full Stack', nivel: 'Pleno/Sênior', modelo: 'Remoto',
  cliente: 'TIS Talent AI Platform', gestor: 'Carlos Mendes',
  desafio: 'Desafio de teste.', objetivo: 'Objetivo de teste.',
  local: 'São Paulo — SP', horario: '09h às 18h', carga: '40h semanais', motivo: 'Aumento do quadro', quantidade: 2,
  budget: 'R$ 9.000 a R$ 14.000', modalidade: 'CLT', beneficios: BENEF, processoSeletivo: PROCESSO,
}

const perfil: Perfil = {
  formacao: 'Superior completo.', experiencia: 'Mínimo 4 anos.', exigencias: ['Comprovação de experiência'],
  stackObrigatoria: ['TypeScript', 'React'], conhecimentosDesejaveis: ['Next.js'],
  responsabilidades: 'Desenvolver e manter aplicações.',
  habilidades: ['Comunicação clara'], justificativa: 'Expansão do time.',
}

describe('mkVaga', () => {
  it('deriva os campos da tabela do briefing', () => {
    const v = mkVaga(meta, briefing, perfil)
    expect(v.vaga).toBe(briefing.cargo)
    expect(v.senioridade).toBe(briefing.nivel)
    expect(v.modelo).toBe(briefing.modelo)
  })

  it('preserva os campos de meta', () => {
    const v = mkVaga(meta, briefing, perfil)
    expect(v.id).toBe(meta.id)
    expect(v.data).toBe(meta.data)
    expect(v.inscritos).toBe(meta.inscritos)
    expect(v.aprovados).toBe(meta.aprovados)
    expect(v.status).toBe(meta.status)
  })

  it('guarda o briefing e o perfil originais por referência', () => {
    const v = mkVaga(meta, briefing, perfil)
    expect(v.briefing).toBe(briefing)
    expect(v.perfil).toBe(perfil)
  })
})

describe('mkGen', () => {
  const cargo = 'Desenvolvedor Mobile'
  const nivel = 'Pleno'
  const modelo = 'Remoto'
  const gestor = 'Carlos Mendes'
  const budget = 'R$ 8.000 a R$ 12.000'
  const stack = ['React Native', 'TypeScript', 'iOS']
  const responsabilidades = 'Desenvolver e manter aplicativos móveis.'
  const v = mkGen(meta, cargo, nivel, modelo, gestor, budget, stack, responsabilidades)

  it('repassa cargo/nivel/modelo para o briefing (e deriva os campos da tabela)', () => {
    expect(v.briefing.cargo).toBe(cargo)
    expect(v.briefing.nivel).toBe(nivel)
    expect(v.briefing.modelo).toBe(modelo)
    expect(v.vaga).toBe(cargo)
    expect(v.senioridade).toBe(nivel)
    expect(v.modelo).toBe(modelo)
  })

  it('repassa gestor, budget e stack', () => {
    expect(v.briefing.gestor).toBe(gestor)
    expect(v.briefing.budget).toBe(budget)
    expect(v.perfil.stackObrigatoria).toBe(stack)
  })

  it('reaproveita BENEF e PROCESSO da empresa', () => {
    expect(v.briefing.beneficios).toBe(BENEF)
    expect(v.briefing.processoSeletivo).toBe(PROCESSO)
  })

  it('aplica os defaults fixos de cliente/modalidade/quantidade', () => {
    expect(v.briefing.cliente).toBe('TIS Talent AI Platform')
    expect(v.briefing.modalidade).toBe('CLT')
    expect(v.briefing.quantidade).toBe(1)
  })

  it('faz passthrough das responsabilidades para o perfil', () => {
    expect(v.perfil.responsabilidades).toBe(responsabilidades)
  })

  it('preserva os campos de meta', () => {
    expect(v.id).toBe(meta.id)
    expect(v.status).toBe(meta.status)
  })
})
