// Export: componentes SHADCN do app -> figma-plugin-components/figma-components.json
//
// FONTE DA VERDADE: app/src/components/ui/{button,input}.tsx (shadcn) — o kit do Figma espelha
// EXATAMENTE a API que as telas usam (variant × size do cva), com cada classe Tailwind traduzida
// p/ a Variable do contrato (bg-primary -> CRP/Modes::primary, border-input -> CRP/Modes::input,
// min-h-[var(--button-height-md)] -> CRP/Components::button/height/md, rounded-md ->
// CRP/Base::radius-md, px-4 -> CRP/Primitives::space/4 …).
//
// Matriz do kit (espelha o atom/button vivo — produto CARTESIANO completo do cva, sem recorte):
//   Button: variant (10) × size (8: default/xs/sm/lg + icon/icon-xs/icon-sm/icon-lg) × state (4) = 320
//   Input:  default + invalid (aria-invalid: borda destructive) = 2
//
// Pré-requisito: `npm run export:figma` (valida cada ref contra figma-variables.json).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const FV_PATH = join(ROOT, 'figma-plugin', 'figma-variables.json');
const OUT = join(ROOT, 'figma-plugin-components', 'figma-components.json');
// Matriz sempre COMPLETA (320): não há mais recorte nem flags --full/--min (o cva permite toda combinação variant×size).

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

// ---- Button COMPLETO — espelho FIEL do cva de app/src/components/ui/button.tsx ----
// base: rounded-md text-sm(14px) font-medium gap-2 · [&_svg]:size-4 (16px) · focus-visible:ring · disabled:opacity-50
// Eixos de VARIANTE (produto CARTESIANO completo, igual ao atom/button vivo no Figma):
//   variant (10) × size (8) × state (4) = 320. Toda combinação variant×size é prop React válida → vira variante.
// PROPRIEDADES (não viram variante): Texto (TEXT, label editável), Ícone esquerda/direita (BOOLEAN +
//   INSTANCE_SWAP p/ ícone da biblioteca lucide). No SÓ-ÍCONE, um único ícone central.
// ESTADOS = os REAIS do cva: default · hover (hover:) · focus (focus-visible:) · disabled (disabled:).
//   NÃO há 'active' (o cva não usa active:) nem estado 'loading' — isLoading é a prop booleana `Loading`.
//   (Render de só-ícone size-aware e da booleana Loading = TODO do plugin figma-plugin-components; ver README.)
const RADIUS_MD = ref(B, 'radius-md');
const RADIUS_MD_PX = pxOf(B, 'radius-md');
const TXT = 'Label/Small';     // text-sm 14px (sm/md/lg). Antes: Label/Base (16px) — divergência de 2px corrigida (web manda).
const TXT_XS = 'Label/XSmall'; // text-xs 12px (xs)
const IC = (n) => ref(P, 'icon/' + n); // icon/12|16|20|24

const RING = ref(M, 'ring-50'), RINGW = ref(C, 'button/ring-width'); // anel = cor de estado ring/50 (alpha embutido)
const DIS_ALPHA = ref(B, 'opacity-disabled');
const ringPx = pxOf(C, 'button/ring-width'), disPx = pxOf(B, 'opacity-disabled');

const H_XS = ref(C, 'button/height/xs'), H_SM = ref(C, 'button/height/sm'), H_MD = ref(C, 'button/height/md'), H_LG = ref(C, 'button/height/lg');
const H_XS_PX = pxOf(C, 'button/height/xs'), H_SM_PX = pxOf(C, 'button/height/sm'), H_MD_PX = pxOf(C, 'button/height/md'), H_LG_PX = pxOf(C, 'button/height/lg');

// SIZES (8) — espelha button.tsx. 4 COM texto (default=md, xs, sm, lg) + 4 SÓ-ÍCONE (icon=md, icon-xs, icon-sm, icon-lg).
//   Texto:  min-height (alvo de toque), padding-x, gap, style (=font-size) e icon-size do cva.
//   Só-ícone: QUADRADO (size-[--button-height-*]); o ícone CRESCE com a caixa (12/16/20/24), sem texto.
const SIZES = {
  default:   { minHeight: H_MD, minHeightPx: H_MD_PX, padX: ref(P, 'space/4'), padXPx: 16, gapVar: ref(P, 'space/2'), gapPx: 8, style: TXT,    iconPx: 16, iconVar: IC(16) },
  xs:        { minHeight: H_XS, minHeightPx: H_XS_PX, padX: ref(P, 'space/2'), padXPx: 8,  gapVar: ref(P, 'space/1'), gapPx: 4, style: TXT_XS, iconPx: 12, iconVar: IC(12) },
  sm:        { minHeight: H_SM, minHeightPx: H_SM_PX, padX: ref(P, 'space/3'), padXPx: 12, gapVar: null,             gapPx: 6, style: TXT,    iconPx: 16, iconVar: IC(16) },
  lg:        { minHeight: H_LG, minHeightPx: H_LG_PX, padX: ref(P, 'space/6'), padXPx: 24, gapVar: ref(P, 'space/2'), gapPx: 8, style: TXT,    iconPx: 16, iconVar: IC(16) },
  icon:      { iconOnly: true, square: H_MD, squarePx: H_MD_PX, iconPx: 20, iconVar: IC(20) }, // size-[--button-height-md] · size-5
  'icon-xs': { iconOnly: true, square: H_XS, squarePx: H_XS_PX, iconPx: 12, iconVar: IC(12) }, // size-6 · size-3
  'icon-sm': { iconOnly: true, square: H_SM, squarePx: H_SM_PX, iconPx: 16, iconVar: IC(16) }, // size-[--button-height-sm] · size-4
  'icon-lg': { iconOnly: true, square: H_LG, squarePx: H_LG_PX, iconPx: 24, iconVar: IC(24) }, // size-[--button-height-lg] · size-6
};
// variant (10) → fill/text base + hover. hover usa a COR DE ESTADO (cor base + alpha JÁ embutido na
//   Variable — tradução Figma de bg-primary/90 etc.), com a `surface` (background) por baixo p/ compor.
//   soft: fill translúcido (bg-*/10) já no repouso → surface por baixo. accent (outline/ghost) é 100%.
const VARIANTS = {
  default:               { fill: ref(M, 'primary'),      text: ref(M, 'primary-foreground'),   hov: { stateFill: ref(M, 'primary-90') } },                                              // bg-primary · hover /90
  destructive:           { fill: ref(M, 'destructive'),  text: ref(P, 'color/white'),          hov: { stateFill: ref(M, 'destructive-90') } },                                          // bg-destructive · hover /90
  warning:               { fill: ref(M, 'warning'),      text: ref(M, 'warning-foreground'),   hov: { stateFill: ref(M, 'warning-90') } },                                              // bg-warning · hover /90
  outline:               { fill: ref(M, 'background'),   text: ref(M, 'foreground'), stroke: ref(M, 'border'),               shadow: true, hov: { fill: ref(M, 'accent'), text: ref(M, 'accent-foreground') } },                    // border bg-background shadow-xs · hover:bg-accent
  'destructive-outline': { fill: ref(M, 'background'),   text: ref(M, 'destructive-text'), stroke: ref(M, 'destructive-text'), shadow: true, hov: { stateFill: ref(M, 'destructive-10'), text: ref(M, 'destructive-text') } },   // border+text destructive-text bg-background · hover:bg-destructive/10
  secondary:             { fill: ref(M, 'secondary'),    text: ref(M, 'secondary-foreground'), hov: { stateFill: ref(M, 'secondary-80') } },                                            // bg-secondary · hover /80
  'primary-soft':        { fill: ref(M, 'primary-10'),   soft: true, text: ref(M, 'primary-text'),   hov: { stateFill: ref(M, 'primary-15'),   text: ref(M, 'primary-text') } },        // bg-primary/10 text-primary-text · hover /15
  'secondary-soft':      { fill: ref(M, 'secondary-10'), soft: true, text: ref(M, 'secondary-text'), hov: { stateFill: ref(M, 'secondary-15'), text: ref(M, 'secondary-text') } },      // bg-secondary/10 text-secondary-text · hover /15
  ghost:                 { fill: null,                   text: ref(M, 'foreground'),           hov: { fill: ref(M, 'accent'), text: ref(M, 'accent-foreground') } },                     // hover:bg-accent
  link:                  { fill: null,                   text: ref(M, 'link'), noBox: true,    hov: { underline: true } },                                                              // text-link · hover:underline
};
const ALL_STATES = ['default', 'hover', 'focus', 'disabled']; // os 4 estados REAIS do cva (sem active/loading)

function mkButton(variant, vd, size, sd, state) {
  const isLink = !!vd.noBox, box = !isLink;
  const iconOnly = !!sd.iconOnly;
  const layout = iconOnly
    ? { // SÓ-ÍCONE: quadrado (width=height=square), sem padding/gap/texto; ícone central cresce com a caixa
        square: sd.square, minHeight: sd.square, paddingX: null, gap: null, radius: RADIUS_MD, iconOnly: true,
        fallbackPx: { minHeight: sd.squarePx, paddingX: 0, paddingY: 0, gap: 0, radius: RADIUS_MD_PX, icon: sd.iconPx } }
    : { minHeight: box ? sd.minHeight : null, paddingX: box ? sd.padX : null, gap: sd.gapVar,
        radius: RADIUS_MD, // sempre (até o link): sem fundo não muda nada visualmente, mas ARREDONDA o anel de foco
        fallbackPx: { minHeight: box ? sd.minHeightPx : 0, paddingX: box ? sd.padXPx : 0, paddingY: box ? 4 : 0, gap: sd.gapPx || 0, radius: RADIUS_MD_PX, icon: sd.iconPx } };
  const e = {
    props: { variant, size, state },
    layout,
    fill: vd.fill ? { var: vd.fill, opacity: 1 } : null,
    surface: vd.soft ? ref(M, 'background') : null, // soft = fill translúcido no repouso → background por baixo p/ compor
    stroke: vd.stroke ? { var: vd.stroke, opacity: 1, weightPx: 1 } : null,
    shadow: !!vd.shadow, // shadow-xs (só outline/destructive-outline, fiel ao shadcn base)
    ring: null,
    alpha: { var: null, value: 1 },
    text: iconOnly ? null : { styleName: sd.style, characters: 'Button', underline: false, fillVar: vd.text },
    iconColor: vd.text,                 // o ícone herda a cor do texto (currentColor)
    slots: iconOnly ? { leading: true, trailing: false } : { leading: true, trailing: true },
    spinner: false,
  };
  // hover: muda o PRÓPRIO fill/texto, igual ao app. Quando o fill é translúcido (stateFill /90, /15…),
  // poe a SUPERFÍCIE (background) por baixo — o Figma compõe como o navegador (hover VISÍVEL no canvas).
  const apply = (s) => {
    if (!s) return;
    if (s.stateFill) { e.fill = { var: s.stateFill, opacity: 1 }; e.surface = ref(M, 'background'); }
    else if (s.fill) { e.fill = { var: s.fill, opacity: s.op == null ? 1 : s.op }; if (s.op != null && s.op < 1) e.surface = ref(M, 'background'); }
    if (s.text) { if (e.text) e.text.fillVar = s.text; e.iconColor = s.text; } // ícone segue a cor do texto no estado
    if (s.underline && e.text) e.text.underline = true; // só-ícone não tem texto p/ sublinhar
  };
  if (state === 'hover') apply(vd.hov);
  else if (state === 'focus') e.ring = { colorVar: RING, opacity: 0.5, widthVar: RINGW, widthPx: ringPx };
  else if (state === 'disabled') e.alpha = { var: DIS_ALPHA, value: disPx };
  return e;
}

const buttonVariants = [];
for (const [variant, vd] of Object.entries(VARIANTS)) {
  for (const [size, sd] of Object.entries(SIZES)) {
    for (const state of ALL_STATES) buttonVariants.push(mkButton(variant, vd, size, sd, state));
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
  { name: 'Input', setName: 'CRP Components/Input', axesOrder: ['state'], variants: inputVariants },
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
  full: true,
  components,
};
writeFileSync(OUT, JSON.stringify(spec, null, 2));
const total = components.reduce((a, c) => a + c.variants.length, 0);
console.log(`✅ figma-components.json — ${components.map((c) => c.name + ':' + c.variants.length).join(' · ')} (${total} variantes) · fonte shadcn · deps validadas`);
