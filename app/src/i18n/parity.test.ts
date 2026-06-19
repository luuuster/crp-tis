import { describe, expect, it } from 'vitest'

import { LOCALES, resources } from './index'

// Guarda: TODA chave de tradução precisa existir nas 3 línguas (pt-BR fonte == en == es). Pega chave
// esquecida em en/es (que não quebra tipo nem teste — só cairia no fallback pt-BR na UICEstrangeira).
const keyPaths = (o: Record<string, unknown>, p = ''): string[] =>
  Object.entries(o).flatMap(([k, v]) =>
    v && typeof v === 'object' && !Array.isArray(v) ? keyPaths(v as Record<string, unknown>, `${p}${k}.`) : [`${p}${k}`])

describe('paridade de chaves i18n (pt-BR == en == es)', () => {
  const namespaces = Object.keys(resources['pt-BR']) as (keyof (typeof resources)['pt-BR'])[]

  for (const ns of namespaces) {
    it(`namespace "${ns}" tem as mesmas chaves nas 3 línguas`, () => {
      const pt = keyPaths(resources['pt-BR'][ns]).sort()
      for (const loc of LOCALES) {
        const outras = keyPaths(resources[loc][ns]).sort()
        expect(outras, `${loc}/${ns}`).toEqual(pt)
      }
    })
  }
})
