import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Loader2, Underline } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Toggle } from '@/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Separator } from '@/components/ui/separator'
import type { Demo } from './_types'

export const BOTOES_DEMOS: Demo[] = [
  {
    id: 'button', component: 'button', section: 'botoes', title: 'Button',
    desc: 'Variantes, tamanhos e estados; o anel de foco usa --ring. Único com contrato CSS/JS vanilla.',
    tokens: ['--primary', '--primary-foreground', '--secondary', '--destructive', '--ring'],
    Render: () => (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Excluir</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
        <Separator />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Estados:</span>
            <Button disabled>Desabilitado</Button>
            <Button disabled><Loader2 className="animate-spin" /> Carregando</Button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Tamanhos:</span>
            <Button size="sm">Pequeno</Button>
            <Button>Médio</Button>
            <Button size="lg">Grande</Button>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'button-group', component: 'button-group', section: 'botoes', title: 'Button Group',
    desc: 'Botões agrupados como um único controle segmentado.',
    Render: () => (
      <ButtonGroup>
        <Button variant="outline">Dia</Button>
        <Button variant="outline">Semana</Button>
        <Button variant="outline">Mês</Button>
      </ButtonGroup>
    ),
  },
  {
    id: 'toggle', component: 'toggle', section: 'botoes', title: 'Toggle',
    desc: 'Botão de dois estados (aria-pressed).',
    Render: () => (
      <div className="flex items-center gap-2">
        <Toggle aria-label="Negrito"><Bold /></Toggle>
        <Toggle aria-label="Itálico" defaultPressed><Italic /></Toggle>
        <Toggle aria-label="Sublinhado" disabled><Underline /></Toggle>
      </div>
    ),
  },
  {
    id: 'toggle-group', component: 'toggle-group', section: 'botoes', title: 'Toggle Group',
    desc: 'Grupo de toggles (seleção única); setas navegam.',
    Render: () => (
      <ToggleGroup type="single" defaultValue="left" aria-label="Alinhamento">
        <ToggleGroupItem value="left" aria-label="Alinhar à esquerda"><AlignLeft /></ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Centralizar"><AlignCenter /></ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Alinhar à direita"><AlignRight /></ToggleGroupItem>
      </ToggleGroup>
    ),
  },
]
