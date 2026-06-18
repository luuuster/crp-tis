import type { Demo } from './_types'
import { BOTOES_DEMOS } from './botoes'
import { FORMULARIO_DEMOS } from './formulario'
import { DADOS_DEMOS } from './dados'
import { FEEDBACK_DEMOS } from './feedback'
import { NAVEGACAO_DEMOS } from './navegacao'
import { ESTRUTURA_DEMOS } from './estrutura'

/**
 * Registry de demos da vitrine: a Showcase mapeia isto, e o gate [../a11y-manifest.test.ts] cruza
 * os ids daqui com as entradas do manifesto que têm `demoId`. Adicionar um componente ⇒ adicionar
 * o demo aqui + a entrada no manifesto, ou o gate fica vermelho.
 */
export const DEMOS: Demo[] = [
  ...BOTOES_DEMOS,
  ...FORMULARIO_DEMOS,
  ...DADOS_DEMOS,
  ...FEEDBACK_DEMOS,
  ...NAVEGACAO_DEMOS,
  ...ESTRUTURA_DEMOS,
]

export type { Demo } from './_types'
export { SECTIONS } from './_types'
