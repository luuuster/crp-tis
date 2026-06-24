/**
 * Aba "Componentes" do hub de documentação (:5174, rota /componentes). Reusa o Showcase (galeria do DS) dentro
 * da casca compartilhada. `noMain` no DocShell porque o Showcase já traz o próprio <main> (evita 2 landmarks).
 */
import { DocShell } from '@/components/DocShell'
import { Showcase } from '@/pages/Showcase'

export function Componentes() {
  return (
    <DocShell active="comp" noMain>
      <Showcase />
    </DocShell>
  )
}
