// SEED: (re)gera tokens/core/*.json a partir do tema padrão do Tailwind v4 instalado
// + cores da marca CRP. Rode com `node build/seed-palette.mjs`.
//
// PARIDADE TOTAL com o Tailwind: além de color/dimension/typography, traz também
// container, shadow (box/inset/drop/text), blur, perspective, aspect, ease, duration e animate.
//
// ⚠ SOBRESCREVE os arquivos em tokens/core/ — use só para semear/atualizar do Tailwind; depois
// disso a fonte da verdade é o Token Studio. Mudou a cor da marca? Edite os hexes e re-rode.
//
// Tipos compostos (sombra/easing) são guardados com o $type que o sd-transforms preserva sem
// "fazer conta" (boxShadow/cubicBezier) — ver probe; 'other' NÃO é seguro (resolveMath avalia).
import { readFileSync, writeFileSync } from 'node:fs';
import { oklch, clampChroma, formatHex } from 'culori';

// Só o bloco @theme principal — ignora o bloco "/* Deprecated */" (ex.: --shadow-inner, --radius legado).
const theme = readFileSync('node_modules/tailwindcss/theme.css', 'utf8').split('/* Deprecated */')[0];

// Parse genérico de "--nome: valor;" (valor pode ter quebras de linha: font stacks, sombras multi-camada).
const vars = {};
for (const m of theme.matchAll(/--([\w-]+):\s*([^;]+);/gs)) {
  vars[m[1]] = m[2].replace(/\s+/g, ' ').trim();
}
const entriesMatching = (re) =>
  Object.entries(vars).map(([k, v]) => [k.match(re), v]).filter(([m]) => m);
const write = (file, obj) => writeFileSync(`tokens/core/${file}`, JSON.stringify(obj, null, 2) + '\n');

const r = (n, d = 3) => Math.round(n * 10 ** d) / 10 ** d;
const fmt = (c) => { const k = clampChroma({ mode: 'oklch', l: c.l, c: c.c, h: c.h }, 'oklch', 'p3');
  return `oklch(${r(k.l)} ${r(k.c)} ${r(k.h ?? 0, 2)})`; };
const hex = (v) => formatHex(v) || v;
const tok = (value, exactHex) => ({ $value: value, $description: exactHex || hex(value) });

// Para valores de comprimento NÃO-pixel (rem/em), guarda o equivalente em px no $description
// (rem/em × 16). px / unitless / strings ficam sem $description. D() = dimensão com referência.
const pxOf = (v) => {
  if (typeof v !== 'string') return null;
  const m = v.trim().match(/^(-?[\d.]+)(rem|em)$/);
  return m ? `${+(parseFloat(m[1]) * 16).toFixed(4)}px` : null;
};
const D = (v) => { const px = pxOf(v); return px ? { $value: v, $description: px } : { $value: v }; };

// ===================== CORES =====================
// Só as 22 famílias OFICIAIS do Tailwind v4 (descarta extras não-padrão do pacote, ex. mauve/olive/mist/taupe).
const OFFICIAL = new Set([
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue',
  'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose', 'slate', 'gray', 'zinc', 'neutral', 'stone',
]);
const palettes = {};
for (const [k, v] of Object.entries(vars)) {
  let mm = k.match(/^color-([a-z]+)-(\d+)$/);
  if (mm) { if (OFFICIAL.has(mm[1])) (palettes[mm[1]] ||= {})[mm[2]] = v; continue; }
  mm = k.match(/^color-(white|black)$/);
  if (mm) palettes[mm[1]] = v;
}

// Rampas da marca: ancora a cor EXATA no shade de lightness mais próximo e gera rampa MONOTÔNICA.
const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const LADDER = { 50: 0.971, 100: 0.936, 200: 0.885, 300: 0.808, 400: 0.704, 500: 0.637, 600: 0.577, 700: 0.505, 800: 0.444, 900: 0.396, 950: 0.258 };
const BELL = { 50: 0.10, 100: 0.22, 200: 0.42, 300: 0.65, 400: 0.88, 500: 1.0, 600: 1.0, 700: 0.88, 800: 0.74, 900: 0.62, 950: 0.42 };
function ramp(hexInput) {
  const base = oklch(hexInput);
  let anchor = 500, best = Infinity;
  for (const s of SHADES) { const d = Math.abs(LADDER[s] - base.l); if (d < best) { best = d; anchor = s; } }
  const out = {};
  for (const s of SHADES) {
    out[s] = s === anchor ? fmt({ l: base.l, c: base.c, h: base.h })
      : fmt({ l: LADDER[s], c: base.c * BELL[s] / BELL[anchor], h: base.h });
  }
  return { out, anchor };
}

const colorJson = { color: { $type: 'color' } };
if (palettes.white) colorJson.color.white = tok(palettes.white, '#ffffff');
if (palettes.black) colorJson.color.black = tok(palettes.black, '#000000');
for (const [name, shades] of Object.entries(palettes)) {
  if (name === 'white' || name === 'black') continue;
  colorJson.color[name] = {};
  for (const [s, val] of Object.entries(shades)) colorJson.color[name][s] = tok(val);
}

const BRANDS = {
  crp: { primary: '#036EF2', secondary: '#8e51ff' },
  'marca-b': { primary: '#B30631', secondary: '#2886F3' },
};
const brandAnchors = {};
colorJson.color.brand = {};
for (const [brand, roles] of Object.entries(BRANDS)) {
  colorJson.color.brand[brand] = {};
  brandAnchors[brand] = {};
  for (const [role, h] of Object.entries(roles)) {
    const { out, anchor } = ramp(h);
    const obj = Object.fromEntries(Object.entries(out).map(([s, v]) => [s, tok(v)]));
    obj[anchor].$description = h.toLowerCase();
    obj.DEFAULT = tok(fmt(oklch(h)), h.toLowerCase());
    colorJson.color.brand[brand][role] = obj;
    brandAnchors[brand][role] = anchor;
  }
}
write('color.json', colorJson);

// ===================== DIMENSÃO (layout) =====================
const SPACE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96];
const dim = {
  space: { $type: 'dimension', px: { $value: '1px' } },
  radii: { $type: 'dimension' },
  breakpoint: { $type: 'dimension' },
  container: { $type: 'dimension' },
};
for (const n of SPACE) dim.space[n] = D(n === 0 ? '0px' : `${n * 0.25}rem`);
for (const [m, v] of entriesMatching(/^radius-(.+)$/)) dim.radii[m[1]] = D(v);
dim.radii.none = D('0px');
dim.radii.base = D('0.625rem'); // raio base do shadcn (contrato usa {radii.base})
dim.radii.full = D('9999px');
for (const [m, v] of entriesMatching(/^breakpoint-(.+)$/)) dim.breakpoint[m[1]] = D(v);
dim.breakpoint['2xl'] = D('90rem'); // override CRP: 2xl = 1440px (Tailwind default = 96rem/1536px)
for (const [m, v] of entriesMatching(/^container-(.+)$/)) dim.container[m[1]] = D(v);
write('dimension.json', dim);

// ===================== TIPOGRAFIA =====================
const typ = {
  font: {
    family: { $type: 'fontFamily' },
    weight: { $type: 'fontWeight' },
    size: { $type: 'dimension' },
    lineHeight: { $type: 'number' },
    leading: { $type: 'number' },
    tracking: { $type: 'dimension' },
  },
};
for (const fam of ['sans', 'serif', 'mono']) if (vars['font-' + fam]) typ.font.family[fam] = { $value: vars['font-' + fam] };
for (const [m, v] of entriesMatching(/^font-weight-(.+)$/)) typ.font.weight[m[1]] = { $value: Number(v) };
for (const [m, v] of entriesMatching(/^text-([\w]+)--line-height$/)) typ.font.lineHeight[m[1]] = { $value: v };
for (const [m, v] of entriesMatching(/^text-([\w]+)$/)) typ.font.size[m[1]] = D(v);
for (const [m, v] of entriesMatching(/^leading-(.+)$/)) typ.font.leading[m[1]] = { $value: Number(v) || v };
for (const [m, v] of entriesMatching(/^tracking-(.+)$/)) typ.font.tracking[m[1]] = D(v);
write('typography.json', typ);

// ===================== SOMBRAS (compostas → CSS) =====================
// $type boxShadow preserva a string multi-camada (o ts/resolveMath não "faz conta" nela).
const shadow = {
  shadow: { $type: 'boxShadow' },
  insetShadow: { $type: 'boxShadow' },
  dropShadow: { $type: 'boxShadow' },
  textShadow: { $type: 'boxShadow' },
};
for (const [m, v] of entriesMatching(/^text-shadow-(.+)$/)) shadow.textShadow[m[1]] = { $value: v };
for (const [m, v] of entriesMatching(/^inset-shadow-(.+)$/)) shadow.insetShadow[m[1]] = { $value: v };
for (const [m, v] of entriesMatching(/^drop-shadow-(.+)$/)) shadow.dropShadow[m[1]] = { $value: v };
for (const [m, v] of entriesMatching(/^shadow-(.+)$/)) shadow.shadow[m[1]] = { $value: v };
write('shadow.json', shadow);

// ===================== EFEITOS (blur/perspective/aspect) =====================
const effect = {
  blur: { $type: 'dimension' },
  perspective: { $type: 'dimension' },
  aspect: { $type: 'other' },
  opacity: { $type: 'number' },
};
for (const [m, v] of entriesMatching(/^blur-(.+)$/)) effect.blur[m[1]] = D(v);
for (const [m, v] of entriesMatching(/^perspective-(.+)$/)) effect.perspective[m[1]] = D(v);
for (const [m, v] of entriesMatching(/^aspect-(.+)$/)) effect.aspect[m[1]] = { $value: v };
// opacity: o Tailwind não define tokens (utility usa valor solto) — escala própria 0–100 (a cada 5), 0–1.
for (let p = 0; p <= 100; p += 5) effect.opacity[p] = { $value: +(p / 100).toFixed(2), $description: `${p}%` };
write('effect.json', effect);

// ===================== MOVIMENTO (ease/duration/animate) =====================
const motion = {
  ease: { $type: 'cubicBezier' },
  duration: { $type: 'duration' },
  animate: { $type: 'other' },
};
for (const [m, v] of entriesMatching(/^ease-(.+)$/)) motion.ease[m[1]] = { $value: v };
if (vars['default-transition-timing-function']) motion.ease.DEFAULT = { $value: vars['default-transition-timing-function'] };
if (vars['default-transition-duration']) motion.duration.DEFAULT = { $value: vars['default-transition-duration'] };
for (const [m, v] of entriesMatching(/^animate-(.+)$/)) motion.animate[m[1]] = { $value: v };
write('motion.json', motion);

// ===================== RESUMO =====================
const n = (o, g) => Object.keys(o[g]).filter((k) => !k.startsWith('$')).length;
console.log('cores (oficiais):', Object.keys(palettes).filter((p) => p !== 'white' && p !== 'black').length, '+ white/black + marca');
for (const [b, roles] of Object.entries(brandAnchors))
  for (const [role, a] of Object.entries(roles))
    console.log(`  brand.${b}.${role}: âncora=${a}, exato=${colorJson.color.brand[b][role].DEFAULT.$description}`);
console.log('dimension → space:', n(dim, 'space'), '| radii:', n(dim, 'radii'), '| breakpoint:', n(dim, 'breakpoint'), '| container:', n(dim, 'container'));
console.log('typography → size:', n(typ.font, 'size'), '| weight:', n(typ.font, 'weight'), '| tracking:', n(typ.font, 'tracking'), '| leading:', n(typ.font, 'leading'), '| lineHeight:', n(typ.font, 'lineHeight'));
console.log('shadow →', n(shadow, 'shadow'), '| inset:', n(shadow, 'insetShadow'), '| drop:', n(shadow, 'dropShadow'), '| text:', n(shadow, 'textShadow'));
console.log('effect → blur:', n(effect, 'blur'), '| perspective:', n(effect, 'perspective'), '| aspect:', n(effect, 'aspect'), '| opacity:', n(effect, 'opacity'));
console.log('motion → ease:', n(motion, 'ease'), '| duration:', n(motion, 'duration'), '| animate:', n(motion, 'animate'));
