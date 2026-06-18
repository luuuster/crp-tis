import type { ComponentType } from 'react'

/**
 * Tipos e metadados das seções da vitrine de componentes (Showcase).
 * O registry de demos (./index.ts) é a fonte que a Showcase mapeia E que o gate de a11y
 * (../a11y-manifest.test.ts) cruza com o manifesto — todo componente precisa de um demo aqui.
 */
export type SectionId = 'botoes' | 'formulario' | 'dados' | 'feedback' | 'navegacao' | 'estrutura'

// Metadados das seções: id (âncora), título e os tokens de contrato que a família consome
// (documentação viva — "que token isto usa?"). Mantém o padrão do Showcase original.
export const SECTIONS: { id: SectionId; title: string; tokens: string[] }[] = [
  { id: 'botoes', title: 'Botões & ações', tokens: ['--primary', '--primary-foreground', '--secondary', '--destructive', '--ring'] },
  { id: 'formulario', title: 'Formulário', tokens: ['--input', '--ring', '--foreground', '--muted-foreground', '--destructive-text'] },
  { id: 'dados', title: 'Dados & status', tokens: ['--primary', '--muted', '--secondary', '--card', '--border'] },
  { id: 'feedback', title: 'Feedback & overlays', tokens: ['--popover', '--popover-foreground', '--accent', '--destructive'] },
  { id: 'navegacao', title: 'Navegação & conteúdo', tokens: ['--muted', '--background', '--ring', '--accent'] },
  { id: 'estrutura', title: 'Estrutura & layout', tokens: ['--card', '--border', '--muted-foreground', '--sidebar'] },
]

/**
 * Um demo da vitrine: renderiza UM componente em seus estados-chave.
 * - `component` casa com o nome do arquivo em ui/<component>.tsx (chave do manifesto/gate).
 * - `id` é o identificador estável (data-demo) que a Showcase e a auditoria usam.
 * - `Render` é o conteúdo do demo (sem Card em volta — a Showcase embrulha).
 */
export interface Demo {
  id: string
  component: string
  title: string
  section: SectionId
  desc?: string
  tokens?: string[]
  Render: ComponentType
}
