// Regra de lint local do CRP — impede que os anti-padrões de cor/tipografia voltem.
// Roda em src/** (flat config). Escaneia literais de className/cva e strings de estilo.
// Foco: pegar a CLASSE de bug que o usuário vinha catando no olho (fill como texto, cor chumbada,
// tipografia abaixo do piso) — antes de virar PR. NÃO policia o que é legítimo (text-white sobre
// fill sólido, bg-black/<n> de scrim de modal, border-/ring-<fill> de estado aria-invalid).

const FILL = '(?:primary|secondary|destructive|success|warning|info|muted)'

const STRING_CHECKS = [
  {
    // text-<fill> como TEXTO/ÍCONE (sem -text/-foreground). Aceita prefixo de variante (hover:, etc.).
    re: new RegExp(`(?:^|[\\s"'\`:])text-${FILL}(?![\\w-])`),
    msg: "Cor de TEXTO/ÍCONE colorido deve usar a variante -text (ex.: text-primary-text), nunca o token de fill (reprova contraste). Ver lib/surfaces.ts → toneBadge.",
  },
  {
    // cor chumbada (hex / funções de cor) — bypassa os tokens do DS. (chart.tsx tem disable: Recharts.)
    re: /#[0-9a-fA-F]{3,8}\b|(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch)\(/,
    msg: "Cor chumbada não é permitida — use um token do DS (bg-/text-/ring-/border- do contrato). Se faltar o token, alinhe para criá-lo no DS antes de chumbar.",
  },
  {
    // anel hairline chumbado (ring-black/.. ring-white/..) — agora é token.
    re: /\bring-(?:black|white)\//,
    msg: "Anel hairline chumbado — use o token ring-surface-ring (DS) ou os primitivos de lib/surfaces.ts (FLOAT/CARD).",
  },
]

const TINY_PX = /\btext-\[(\d+(?:\.\d+)?)px\]/
const TINY_REM = /\btext-\[(\d+(?:\.\d+)?)rem\]/

function checkString(context, node, text) {
  if (typeof text !== 'string' || !text) return
  for (const c of STRING_CHECKS) if (c.re.test(text)) context.report({ node, message: c.msg })
  const px = TINY_PX.exec(text)
  if (px && parseFloat(px[1]) < 14)
    context.report({ node, message: `Tipografia abaixo do piso: ${px[1]}px. Mínimo é 14px (12px só via .ty-caption/.ty-overline).` })
  const rem = TINY_REM.exec(text)
  if (rem && parseFloat(rem[1]) < 0.875)
    context.report({ node, message: `Tipografia abaixo do piso: ${rem[1]}rem (< 0.875rem = 14px).` })
}

const designTokens = {
  meta: {
    type: 'problem',
    docs: { description: 'Proíbe fill-token como texto, cor chumbada e tipografia < 14px (usa tokens do DS).' },
    schema: [],
  },
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value === 'string') checkString(context, node, node.value)
      },
      TemplateElement(node) {
        checkString(context, node, node.value && node.value.raw)
      },
    }
  },
}

export default { rules: { 'design-tokens': designTokens } }
