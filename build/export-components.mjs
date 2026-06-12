// Export: componentes SHADCN do app -> figma-plugin-components/figma-components.json
//
// FONTE DA VERDADE: app/src/components/ui/{button,input}.tsx (shadcn) — o kit do Figma espelha
// EXATAMENTE a API que as telas usam (variant × size do cva), com cada classe Tailwind traduzida
// p/ a Variable do contrato (bg-primary -> CRP/Modes::primary, border-input -> CRP/Modes::input,
// min-h-[var(--button-height-md)] -> CRP/Components::button/height/md, rounded-md ->
// CRP/Base::radius-md, px-4 -> CRP/Primitives::space/4 …).
//
// Recorte do kit (decisão de design — combinações VÁLIDAS, não produto cartesiano):
//   Button: variant default/secondary/destructive/outline/ghost/link × size sm/default/lg = 18
//           (link SEM outras cores/estados; xs e icon-* atrás de --full)
//   Input:  default + invalid (aria-invalid: borda destructive) = 2
//
// Pré-requisito: `npm run export:figma` (valida cada ref contra figma-variables.json).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const FV_PATH = join(ROOT, 'figma-plugin', 'figma-variables.json');
const OUT = join(ROOT, 'figma-plugin-components', 'figma-components.json');
const FULL = process.argv.includes('--full');
const MIN = process.argv.includes('--min'); // debug: só Button default × default × [default, hover, focus]

if (!existsSync(FV_PATH)) { console.error('❌ figma-plugin/figma-variables.json não existe. Rode `npm run export:figma` antes.'); process.exit(1); }
const fv = JSON.parse(readFileSync(FV_PATH, 'utf8'));
const varIndex = new Map();
for (const c of fv.collections) for (const v of c.variables) varIndex.set(c.name + '::' + v.name, v);
const textStyleNames = new Set(fv.styles.text.map((s) => s.name));

function pxOf(coll, name, depth = 0) {
  const v = varIndex.get(coll + '::' + name);
  if (!v || depth > 6) return null;
  const slot = v.values.Value || Object.values(v.values)[0];
  if (!slot) return null;
  if (slot.number !== undefined) return slot.number;
  if (slot.alias) for (const c of fv.collections) if (varIndex.has(c.name + '::' + slot.alias)) return pxOf(c.name, slot.alias, depth + 1);
  return null;
}

const P = 'CRP/Primitives', M = 'CRP/Modes', B = 'CRP/Base', C = 'CRP/Components';
const ref = (coll, name) => ({ coll, name });
// cores de ESTADO (hover/anel) moram em CRP/Modes (mesmos modos Light/Dark que as cores base — 1 seletor controla tudo)

// ---- Button COMPLETO (espelho FIEL do cva de app/src/components/ui/button.tsx) ----
// base: rounded-md text-sm font-medium gap-2 · [&_svg]:size-4 (16px) · focus-visible:ring · disabled:opacity-50
// Eixos de VARIANTE: variant × size × state (só isto vira régua de variantes).
// PROPRIEDADES (não viram variante): Texto (TEXT, label editável), Ícone esquerda/direita (BOOLEAN + INSTANCE_SWAP
// p/ ícone da biblioteca lucide). size é SÓ tamanho (sm/default/lg) — icon-only saiu do eixo (confundia).
// hover/active = IGUAL AO APP: muda o próprio fill (bg-primary/90 etc.) — sem véu. focus = ring do contrato.
const RADIUS_MD = ref(B, 'radius-md');
const RADIUS_MD_PX = pxOf(B, 'radius-md');
const LABEL = 'Label/Base';
const ICON_PX = 16; // [&_svg]:size-4

const RING = ref(M, 'ring-50'), RINGW = ref(C, 'button/ring-width'); // anel = cor de estado ring/50 (alpha embutido)
const DIS_ALPHA = ref(B, 'opacity-disabled'), LOAD_ALPHA = ref(P, 'opacity/70');
const ringPx = pxOf(C, 'button/ring-width'), disPx = pxOf(B, 'opacity-disabled'), loadPx = pxOf(P, 'opacity/70');

const SIZES = {
  sm:      { minHeight: ref(C, 'button/height/sm'), minHeightPx: pxOf(C, 'button/height/sm'), padX: ref(P, 'space/3'), padXPx: 12, gapPx: 6, gapVar: null },
  default: { minHeight: ref(C, 'button/height/md'), minHeightPx: pxOf(C, 'button/height/md'), padX: ref(P, 'space/4'), padXPx: 16, gapPx: 8, gapVar: ref(P, 'space/2') },
  lg:      { minHeight: ref(C, 'button/height/lg'), minHeightPx: pxOf(C, 'button/height/lg'), padX: ref(P, 'space/6'), padXPx: 24, gapPx: 8, gapVar: ref(P, 'space/2') },
};
// variant → fill/text base + hover/active. hover usa a COR DE ESTADO de CRP/States (cor base + alpha
// JÁ embutido — a tradução Figma de bg-primary/90 etc.); o kit binda e compõe sobre a `surface`.
// accent (outline/ghost) é 100% → cor direta. active não existe no shadcn (gap) → tom derivado via op.
const VARIANTS = {
  default:     { fill: ref(M, 'primary'),     text: ref(M, 'primary-foreground'),                       hov: { stateFill: ref(M, 'primary-90') },     act: { stateFill: ref(M, 'primary-80') } },     // hover:bg-primary/90 · active /80
  secondary:   { fill: ref(M, 'secondary'),   text: ref(M, 'secondary-foreground'),                     hov: { stateFill: ref(M, 'secondary-80') },   act: { stateFill: ref(M, 'secondary-70') } },   // hover:bg-secondary/80 · active /70
  destructive: { fill: ref(M, 'destructive'), text: ref(P, 'color/white'),                              hov: { stateFill: ref(M, 'destructive-90') }, act: { stateFill: ref(M, 'destructive-80') } }, // hover:bg-destructive/90 · active /80
  outline:     { fill: ref(M, 'background'),  text: ref(M, 'foreground'), stroke: ref(M, 'border'), shadow: true, hov: { fill: ref(M, 'accent'), text: ref(M, 'accent-foreground') }, act: { fill: ref(M, 'accent'), text: ref(M, 'accent-foreground') } }, // border bg-background shadow-xs · hover:bg-accent
  ghost:       { fill: null,                  text: ref(M, 'foreground'),                               hov: { fill: ref(M, 'accent'), text: ref(M, 'accent-foreground') }, act: { fill: ref(M, 'accent'), text: ref(M, 'accent-foreground') } }, // hover:bg-accent
  link:        { fill: null,                  text: ref(M, 'link'), noBox: true,                        hov: { underline: true }, act: { underline: true } },                                              // text-link, hover:underline
};
const ALL_STATES = ['default', 'hover', 'active', 'focus', 'disabled', 'loading'];
const LINK_STATES = ['default', 'hover', 'focus', 'disabled']; // link não tem active/loading (sem fundo/ação)

function mkButton(variant, vd, size, sd, state) {
  const isLink = !!vd.noBox, box = !isLink;
  const e = {
    props: { variant, size, state },
    layout: {
      minHeight: box ? sd.minHeight : null,
      paddingX: box ? sd.padX : null,
      gap: sd.gapVar,
      radius: RADIUS_MD, // sempre (até o link): sem fundo não muda nada visualmente, mas ARREDONDA o anel de foco
      fallbackPx: { minHeight: box ? sd.minHeightPx : 0, paddingX: box ? sd.padXPx : 0, paddingY: box ? 4 : 0, gap: sd.gapPx || 0, radius: RADIUS_MD_PX, icon: ICON_PX },
    },
    fill: vd.fill ? { var: vd.fill, opacity: 1 } : null,
    surface: null,                      // fundo (superfície) por baixo quando o fill é translúcido (hover/active)
    stroke: vd.stroke ? { var: vd.stroke, opacity: 1, weightPx: 1 } : null,
    shadow: !!vd.shadow, // shadow-xs (só o outline, fiel ao shadcn base)
    ring: null,
    alpha: { var: null, value: 1 },
    text: { styleName: LABEL, characters: 'Button', underline: false, fillVar: vd.text },
    iconColor: vd.text,                 // ícones herdam a cor do texto (currentColor)
    slots: { leading: true, trailing: true },
    spinner: false,
  };
  // hover/active: muda o PRÓPRIO fill/texto, igual ao app. Quando o fill é translúcido (/90, /80…),
  // poe a SUPERFÍCIE (background) por baixo — assim o navegador-like compõe e o hover fica VISÍVEL.
  const apply = (s) => {
    if (!s) return;
    // hover: cor de estado de CRP/States (alpha já embutido) + SUPERFÍCIE (background) por baixo → o
    // Figma compõe igual o navegador (fica VISÍVEL no canvas, não depende de "opacity de fill").
    if (s.stateFill) { e.fill = { var: s.stateFill, opacity: 1 }; e.surface = ref(M, 'background'); }
    else if (s.fill) { e.fill = { var: s.fill, opacity: s.op == null ? 1 : s.op }; if (s.op != null && s.op < 1) e.surface = ref(M, 'background'); }
    if (s.text) { e.text.fillVar = s.text; e.iconColor = s.text; } // ícone segue a cor do texto no estado (currentColor)
    if (s.underline) e.text.underline = true;
  };
  if (state === 'hover') apply(vd.hov);
  else if (state === 'active') apply(vd.act);
  else if (state === 'focus') e.ring = { colorVar: RING, opacity: 0.5, widthVar: RINGW, widthPx: ringPx };
  else if (state === 'disabled') e.alpha = { var: DIS_ALPHA, value: disPx };
  else if (state === 'loading') { e.alpha = { var: LOAD_ALPHA, value: loadPx }; e.spinner = true; }
  return e;
}

const MIN_STATES = ['default', 'hover', 'focus'];
const buttonVariants = [];
for (const [variant, vd] of Object.entries(VARIANTS)) {
  if (MIN && variant !== 'default') continue;
  const states = MIN ? MIN_STATES : (vd.noBox ? LINK_STATES : ALL_STATES);
  for (const [size, sd] of Object.entries(SIZES)) {
    if (MIN && size !== 'default') continue;
    for (const state of states) buttonVariants.push(mkButton(variant, vd, size, sd, state));
  }
}

// ---- Input (espelho de app/src/components/ui/input.tsx) ----
// min-h button/height/md · px-3 · rounded-md · border border-input · placeholder muted-foreground
const inputBase = (invalid) => ({
  props: { state: invalid ? 'invalid' : 'default' },
  layout: { minHeight: ref(C, 'button/height/md'), paddingX: ref(P, 'space/3'), gap: null, radius: RADIUS_MD,
    fallbackPx: { minHeight: 40, paddingX: 12, paddingY: 4, gap: 0, radius: pxOf(B, 'radius-md') } },
  fill: null, // bg-transparent (dark usa input/30 — nuance de modo documentada no plano)
  stroke: { var: invalid ? ref(M, 'destructive') : ref(M, 'input'), opacity: 1, weightPx: 1 },
  text: { styleName: 'Body/Small', characters: 'Placeholder', underline: false, fillVar: ref(M, 'muted-foreground') },
  stretchText: false, fixedWidthPx: 320,
});
const inputVariants = [inputBase(false), inputBase(true)];

const components = [
  { name: 'Button', setName: 'CRP Components/Button', axesOrder: ['variant', 'size', 'state'], variants: buttonVariants },
  ...(MIN ? [] : [{ name: 'Input', setName: 'CRP Components/Input', axesOrder: ['state'], variants: inputVariants }]),
];

// ---- validação fail-loud (toda ref de Variable/Style tem de existir no figma-variables.json) ----
const missing = [];
const checkRef = (r) => { if (r && !varIndex.has(r.coll + '::' + r.name)) missing.push(r.coll + '::' + r.name); };
for (const c of components) for (const v of c.variants) {
  for (const k of ['paddingX', 'gap', 'minHeight', 'radius', 'square']) checkRef(v.layout[k]);
  checkRef(v.fill && v.fill.var); checkRef(v.surface); checkRef(v.stroke && v.stroke.var);
  checkRef(v.veil && v.veil.colorVar);
  checkRef(v.ring && v.ring.colorVar); checkRef(v.ring && v.ring.widthVar);
  checkRef(v.alpha && v.alpha.var); checkRef(v.iconColor);
  if (v.text) { checkRef(v.text.fillVar); if (!textStyleNames.has(v.text.styleName)) missing.push('TextStyle::' + v.text.styleName); }
}
if (missing.length) { console.error('❌ export-components: refs ausentes no figma-variables.json:\n  - ' + [...new Set(missing)].join('\n  - ')); process.exit(1); }

const spec = {
  $schema: 'crp-components-figma/3',
  generatedBy: 'build/export-components.mjs',
  source: 'shadcn (app/src/components/ui)',
  full: FULL,
  components,
};
writeFileSync(OUT, JSON.stringify(spec, null, 2));
const total = components.reduce((a, c) => a + c.variants.length, 0);
console.log(`✅ figma-components.json — ${components.map((c) => c.name + ':' + c.variants.length).join(' · ')} (${total} variantes${FULL ? ', FULL' : ''}) · fonte shadcn · deps validadas`);
