// Tipagem das chaves de tradução: `t('...')` ganha autocomplete e ERRO DE COMPILAÇÃO para chave
// inexistente. A árvore pt-BR é a referência (toda chave nova entra primeiro nela). Ver ./index.ts.
import 'i18next'
import type { resources } from './index'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: (typeof resources)['pt-BR']
  }
}
