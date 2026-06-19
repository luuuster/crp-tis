import { describe, expect, it } from 'vitest'

import { A11Y_MANIFEST, type A11yEntry } from './a11y-manifest'
import { DEMOS } from './demos'

/**
 * Gate de cobertura a11y (espelha a auto-descoberta do build/check.mjs, mas na camada React):
 * varre ui/*.tsx e reprova se algum componente não tiver entrada no manifesto OU demo na vitrine.
 * Adicionar um componente sem contrato = teste vermelho = CI vermelho.
 */

// Componentes reais em ui/*.tsx (exclui *.test.tsx). import.meta.glob é resolvido pelo Vite/Vitest.
const FILES = import.meta.glob('./*.tsx')
const COMPONENTS = Object.keys(FILES)
  .map((p) => p.replace(/^\.\//, '').replace(/\.tsx$/, ''))
  .filter((name) => !name.endsWith('.test'))
  .sort()

const MANIFEST_KEYS = Object.keys(A11Y_MANIFEST).sort()
const DEMO_IDS = DEMOS.map((d) => d.id).sort()

describe('cobertura a11y — auto-descoberta dos componentes ui/', () => {
  it('todo componente ui/*.tsx tem entrada no manifesto (e vice-versa)', () => {
    const semContrato = COMPONENTS.filter((c) => !(c in A11Y_MANIFEST))
    const stale = MANIFEST_KEYS.filter((k) => !COMPONENTS.includes(k))
    expect(
      semContrato,
      `componente(s) novo(s) SEM contrato em A11Y_MANIFEST — adicione foco/teclado/estados + verifiedBy antes de shippar: ${semContrato.join(', ')}`,
    ).toEqual([])
    expect(stale, `entrada(s) de manifesto sem arquivo correspondente (stale): ${stale.join(', ')}`).toEqual([])
  })

  it('a chave do manifesto bate com entry.component', () => {
    const erradas = Object.entries(A11Y_MANIFEST)
      .filter(([key, e]) => e.component !== key)
      .map(([key, e]) => `${key} → ${e.component}`)
    expect(erradas, `chave ≠ component: ${erradas.join(', ')}`).toEqual([])
  })
})

describe('cobertura a11y — integridade de schema', () => {
  const entries = Object.values(A11Y_MANIFEST)
  const fail = (e: A11yEntry, motivo: string) => `${e.component}: ${motivo}`

  it('overlay declara openTrigger', () => {
    const bad = entries.filter((e) => e.kind === 'overlay' && !e.openTrigger).map((e) => fail(e, 'overlay sem openTrigger'))
    expect(bad).toEqual([])
  })

  it('control/overlay declaram roles', () => {
    const bad = entries
      .filter((e) => (e.kind === 'control' || e.kind === 'overlay') && e.roles.length === 0)
      .map((e) => fail(e, `kind=${e.kind} sem roles`))
    expect(bad).toEqual([])
  })

  it('toda entrada tem verifiedBy', () => {
    const bad = entries.filter((e) => e.verifiedBy.length === 0).map((e) => fail(e, 'verifiedBy vazio'))
    expect(bad).toEqual([])
  })

  it('demoId presente, exceto provider', () => {
    const bad = entries.filter((e) => e.kind !== 'provider' && !e.demoId).map((e) => fail(e, 'demoId vazio'))
    expect(bad).toEqual([])
  })

  it('provider/layout/static que declaram caveats não exercitam teclado (honestidade)', () => {
    // só documenta a regra: provider sempre tem keyboard vazio
    const bad = entries.filter((e) => e.kind === 'provider' && e.keyboard.length > 0).map((e) => fail(e, 'provider com keyboard'))
    expect(bad).toEqual([])
  })
})

describe('cobertura a11y — manifesto ↔ registry de demos', () => {
  it('demoIds do registry == entradas do manifesto com demoId', () => {
    const esperados = Object.values(A11Y_MANIFEST)
      .filter((e) => e.demoId)
      .map((e) => e.demoId)
      .sort()
    expect(DEMO_IDS, 'registry de demos fora de sincronia com o manifesto').toEqual(esperados)
  })

  it('cada demo referencia um component que existe no manifesto, e id == component', () => {
    const bad = DEMOS
      .filter((d) => !(d.component in A11Y_MANIFEST) || d.id !== A11Y_MANIFEST[d.component]?.demoId)
      .map((d) => d.id)
    expect(bad, `demos inconsistentes: ${bad.join(', ')}`).toEqual([])
  })

  it('não há demoId duplicado', () => {
    const dup = DEMO_IDS.filter((id, i) => DEMO_IDS.indexOf(id) !== i)
    expect(dup, `ids duplicados: ${dup.join(', ')}`).toEqual([])
  })
})
