// Code Connect — liga o componente `lucide/<nome>` do Figma ao <Icon> do React.
// Resultado: no Dev Mode, clicar num ícone mostra o snippet pronto (`<Icon name="…" size={…} />`).
//
// ⚠ Este arquivo é um EXEMPLO (1 ícone). Para os ~1962, rode o gerador — ele SOBRESCREVE este arquivo
//   com um figma.connect() por ícone lido da lib publicada:
//     FIGMA_FILE_KEY=xxx FIGMA_TOKEN=figd_xxx node gen-code-connect.mjs
//
// Pré-requisitos no app:
//   1) npm i -D @figma/code-connect
//   2) a Library de ícones PUBLICADA no Figma (sem isso não há URLs/node-ids dos componentes)

import figma from '@figma/code-connect';
import { Icon } from './Icon';

figma.connect(
  Icon,
  // Cole a URL do ComponentSet `lucide/arrow-right` (Figma → botão direito → Copy link to selection):
  'https://www.figma.com/design/<FILE_KEY>/<FILE>?node-id=<NODE_ID>',
  {
    props: {
      // A propriedade de variante no Figma chama-se "Size".
      size: figma.enum('Size', { '16': 16, '20': 20, '24': 24, '32': 32 }),
    },
    example: ({ size }) => <Icon name="arrow-right" size={size} />,
  },
);
