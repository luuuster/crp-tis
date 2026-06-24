import { describe, it, expect } from 'vitest'
import {
  VAGAS_CATALOGO, FILTRO_VAZIO, filtrarVagas, filtroAtivo, ordenarVagas, PAISES, estadosDe, cidadesDe,
  dataExpiracao, diasRestantes, estaExpirada, vagasAtivas, PRAZO_PADRAO_DIAS, type VagaPublica,
} from './vagasCatalogo'

const chaveData = (d: string) => d.split('/').reverse().join('')

describe('vagasCatalogo — filtro do mural', () => {
  it('sem filtro retorna todas as vagas', () => {
    expect(filtrarVagas(VAGAS_CATALOGO, FILTRO_VAZIO)).toHaveLength(VAGAS_CATALOGO.length)
    expect(filtroAtivo(FILTRO_VAZIO)).toBe(false)
  })

  it('busca casa por cargo (case-insensitive)', () => {
    const porCargo = filtrarVagas(VAGAS_CATALOGO, { ...FILTRO_VAZIO, q: 'designer' })
    expect(porCargo.length).toBeGreaterThan(0)
    expect(porCargo.every((v) => v.briefing.cargo.toLowerCase().includes('designer'))).toBe(true)
  })

  it('filtra por nível, modelo e PcD (combináveis)', () => {
    const remoto = filtrarVagas(VAGAS_CATALOGO, { ...FILTRO_VAZIO, modelo: 'Remoto' })
    expect(remoto.every((v) => v.briefing.modelo === 'Remoto')).toBe(true)

    const senior = filtrarVagas(VAGAS_CATALOGO, { ...FILTRO_VAZIO, nivel: 'Sênior' })
    expect(senior.every((v) => v.briefing.nivel === 'Sênior')).toBe(true)

    const pcd = filtrarVagas(VAGAS_CATALOGO, { ...FILTRO_VAZIO, soPcd: true })
    expect(pcd.length).toBeGreaterThan(0)
    expect(pcd.every((v) => v.pcd)).toBe(true)
  })

  it('filtra por local em cascata (país → estado → cidade)', () => {
    const brasil = filtrarVagas(VAGAS_CATALOGO, { ...FILTRO_VAZIO, pais: 'Brasil' })
    expect(brasil.every((v) => v.pais === 'Brasil')).toBe(true)

    const sp = filtrarVagas(VAGAS_CATALOGO, { ...FILTRO_VAZIO, pais: 'Brasil', estado: 'SP' })
    expect(sp.every((v) => v.estado === 'SP')).toBe(true)
    expect(sp.length).toBeLessThanOrEqual(brasil.length)

    const campinas = filtrarVagas(VAGAS_CATALOGO, { ...FILTRO_VAZIO, pais: 'Brasil', estado: 'SP', cidade: 'Campinas' })
    expect(campinas.every((v) => v.cidade === 'Campinas')).toBe(true)
    expect(campinas.length).toBeLessThanOrEqual(sp.length)
  })

  it('opções em cascata derivam do catálogo e respeitam o nível acima', () => {
    expect(PAISES).toContain('Brasil')
    expect(PAISES.length).toBeGreaterThan(1) // tem país internacional
    // estados de Brasil ⊋ estados de um país com 1 estado
    expect(estadosDe('Brasil')).toContain('SP')
    // cidades de SP incluem mais de uma (São Paulo e Campinas) — prova a cascata
    expect(cidadesDe('Brasil', 'SP').length).toBeGreaterThan(1)
  })

  it('filtroAtivo detecta qualquer filtro aplicado', () => {
    expect(filtroAtivo({ ...FILTRO_VAZIO, q: 'x' })).toBe(true)
    expect(filtroAtivo({ ...FILTRO_VAZIO, soPcd: true })).toBe(true)
    expect(filtroAtivo({ ...FILTRO_VAZIO, pais: 'Brasil' })).toBe(true)
    expect(filtroAtivo({ ...FILTRO_VAZIO, cidade: 'São Paulo' })).toBe(true)
  })

  it('ordena por data de publicação (recentes ↓ / antigas ↑)', () => {
    const rec = ordenarVagas(VAGAS_CATALOGO, 'recentes').map((v) => chaveData(v.publicada))
    const ant = ordenarVagas(VAGAS_CATALOGO, 'antigas').map((v) => chaveData(v.publicada))
    expect(rec).toEqual([...rec].sort().reverse()) // descendente
    expect(ant).toEqual([...ant].sort()) // ascendente
    expect(ordenarVagas(VAGAS_CATALOGO, 'recentes')).toHaveLength(VAGAS_CATALOGO.length) // não perde itens
  })

  it('localização sempre traz o país (Brasil ou exterior)', () => {
    expect(VAGAS_CATALOGO.every((v) => v.local.includes(v.pais))).toBe(true)
    expect(VAGAS_CATALOGO.some((v) => v.pais !== 'Brasil')).toBe(true) // tem vaga fora do Brasil
  })

  it('algumas vagas PJ têm salário "A combinar" (só em PJ)', () => {
    const aCombinar = VAGAS_CATALOGO.filter((v) => v.briefing.budget === 'A combinar')
    expect(aCombinar.length).toBeGreaterThan(0)
    expect(aCombinar.every((v) => v.briefing.modalidade === 'PJ')).toBe(true)
  })

  it('toda vaga do catálogo tem briefing + perfil completos (abre a InscricaoVaga sem furo)', () => {
    for (const v of VAGAS_CATALOGO) {
      expect(v.briefing.cargo).toBeTruthy()
      expect(v.briefing.modelo).toBeTruthy()
      expect(v.briefing.nivel).toBeTruthy()
      expect(v.perfil.stackObrigatoria.length).toBeGreaterThan(0)
      expect(v.perfil.responsabilidades).toBeTruthy()
    }
  })
})

describe('vagasCatalogo — prazo / expiração (limite de tempo)', () => {
  // Vaga sintética publicada em 01/01/2026 com prazo de 10 dias → expira em 11/01/2026.
  const vaga = (prazoDias: number, publicada = '01/01/2026'): VagaPublica =>
    ({ ...VAGAS_CATALOGO[0], id: 't', publicada, prazoDias })

  it('toda vaga do catálogo tem prazo (default = PRAZO_PADRAO_DIAS)', () => {
    expect(VAGAS_CATALOGO.every((v) => v.prazoDias === PRAZO_PADRAO_DIAS)).toBe(true)
    expect(PRAZO_PADRAO_DIAS).toBe(30)
  })

  it('dataExpiracao = publicada + prazoDias', () => {
    expect(dataExpiracao(vaga(10))).toEqual(new Date(2026, 0, 11))
  })

  it('diasRestantes: futuro positivo, dia da expiração = 0, passado negativo', () => {
    const v = vaga(10) // expira 11/01/2026
    expect(diasRestantes(v, new Date(2026, 0, 1))).toBe(10)
    expect(diasRestantes(v, new Date(2026, 0, 11))).toBe(0) // expira hoje
    expect(diasRestantes(v, new Date(2026, 0, 12))).toBe(-1)
  })

  it('estaExpirada só após o dia do prazo (no dia ainda está ativa)', () => {
    const v = vaga(10)
    expect(estaExpirada(v, new Date(2026, 0, 11))).toBe(false) // dia da expiração: ainda vale
    expect(estaExpirada(v, new Date(2026, 0, 12))).toBe(true)
  })

  it('vagasAtivas remove as expiradas para o "hoje" dado', () => {
    const lista = [vaga(10), { ...vaga(2), id: 'velha' }] // 2ª expira 03/01/2026
    const ativas = vagasAtivas(lista, new Date(2026, 0, 5))
    expect(ativas.map((v) => v.id)).toEqual(['t']) // só a que ainda não expirou
  })
})
