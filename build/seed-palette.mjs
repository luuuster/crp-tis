// SEED: (re)gera tokens/core/{color,dimension,typography}.json a partir do tema padrão
// do Tailwind v4 instalado + cores da marca CRP (hexes abaixo). Rode com `node build/seed-palette.mjs`.
// ⚠ SOBRESCREVE os 3 arquivos core/ — use só para semear/atualizar do Tailwind; depois disso a
// fonte da verdade é o Token Studio. Mudou a cor da marca? Edite os hexes e re-rode (ou edite no Token Studio).
import { readFileSync, writeFileSync } from 'node:fs';
import { oklch, clampChroma, formatHex } from 'culori';

const theme = readFileSync('node_modules/tailwindcss/theme.css', 'utf8');

// Parse genérico de "--nome: valor;" (valor pode ter quebras de linha, p/ font stacks).
const vars = {};
for (const m of theme.matchAll(/--([\w-]+):\s*([^;]+);/gs)) {
  vars[m[1]] = m[2].replace(/\s+/g, ' ').trim();
}

const r = (n, d = 3) => Math.round(n * 10 ** d) / 10 ** d;
const fmt = (c) => { const k = clampChroma({ mode: 'oklch', l: c.l, c: c.c, h: c.h }, 'oklch', 'p3');
  return `oklch(${r(k.l)} ${r(k.c)} ${r(k.h ?? 0, 2)})`; };

// ---------- CORES ----------
const palettes = {};
for (const [k, v] of Object.entries(vars)) {
  let mm = k.match(/^color-([a-z]+)-(\d+)$/);
  if (mm) { (palettes[mm[1]] ||= {})[mm[2]] = v; continue; }
  mm = k.match(/^color-(white|black)$/);
  if (mm) palettes[mm[1]] = v;
}

// Rampas da marca: 500 = cor exata; demais seguem a curva (L,C) de um template Tailwind, com a hue da marca.
const SHADES = [50,100,200,300,400,500,600,700,800,900,950];
function brandRamp(hex, templateName) {
  const base = oklch(hex);
  const tpl = {}; for (const s of SHADES) tpl[s] = oklch(palettes[templateName][s]);
  const c500 = tpl[500].c || base.c;
  const out = {};
  for (const s of SHADES) {
    out[s] = s === 500
      ? fmt({ l: base.l, c: base.c, h: base.h })
      : fmt({ l: tpl[s].l, c: tpl[s].c * (base.c / c500), h: base.h });
  }
  return out;
}

// Cada token guarda o $value em OKLCH e, em $description, o HEX de referência (sRGB).
const hex = (v) => formatHex(v) || v;
const tok = (value, exactHex) => ({ $value: value, $description: exactHex || hex(value) });

const colorJson = { color: { $type: 'color' } };
// black/white
if (palettes.white) colorJson.color.white = tok(palettes.white, '#ffffff');
if (palettes.black) colorJson.color.black = tok(palettes.black, '#000000');
// todas as rampas do Tailwind
for (const [name, shades] of Object.entries(palettes)) {
  if (name === 'white' || name === 'black') continue;
  colorJson.color[name] = {};
  for (const [s, val] of Object.entries(shades)) colorJson.color[name][s] = tok(val);
}
// rampas da marca CRP (500/DEFAULT = HEX exato informado)
const mkBrand = (hexInput, tpl) => {
  const obj = Object.fromEntries(Object.entries(brandRamp(hexInput, tpl)).map(([s, v]) => [s, tok(v)]));
  obj['500'].$description = hexInput.toLowerCase();
  obj.DEFAULT = tok(fmt(oklch(hexInput)), hexInput.toLowerCase());
  return obj;
};
colorJson.color.brand = { primary: mkBrand('#036EF2', 'blue'), secondary: mkBrand('#8e51ff', 'violet') };
writeFileSync('tokens/core/color.json', JSON.stringify(colorJson, null, 2) + '\n');

// ---------- DIMENSÕES ----------
const SPACE = [0,1,2,3,4,5,6,7,8,9,10,11,12,14,16,20,24,28,32,36,40,44,48,52,56,60,64,72,80,96];
const dim = { space: { $type: 'dimension', px: { $value: '1px' } }, radii: { $type: 'dimension' }, breakpoint: { $type: 'dimension' } };
for (const n of SPACE) dim.space[n] = { $value: n === 0 ? '0px' : `${n * 0.25}rem` };
for (const [k, v] of Object.entries(vars)) {
  let mm = k.match(/^radius-(.+)$/); if (mm) dim.radii[mm[1]] = { $value: v };
  mm = k.match(/^breakpoint-(.+)$/); if (mm) dim.breakpoint[mm[1]] = { $value: v };
}
dim.radii.none = { $value: '0px' };
dim.radii.base = { $value: '0.625rem' }; // raio base do shadcn (contrato usa {radii.base})
dim.radii.full = { $value: '9999px' };
writeFileSync('tokens/core/dimension.json', JSON.stringify(dim, null, 2) + '\n');

// ---------- TIPOGRAFIA ----------
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
for (const [k, v] of Object.entries(vars)) {
  let mm = k.match(/^font-weight-(.+)$/); if (mm) { typ.font.weight[mm[1]] = { $value: Number(v) }; continue; }
  mm = k.match(/^text-([\w]+)--line-height$/); if (mm) { typ.font.lineHeight[mm[1]] = { $value: v }; continue; }
  mm = k.match(/^text-([\w]+)$/); if (mm) { typ.font.size[mm[1]] = { $value: v }; continue; }
  mm = k.match(/^leading-(.+)$/); if (mm) { typ.font.leading[mm[1]] = { $value: Number(v) || v }; continue; }
  mm = k.match(/^tracking-(.+)$/); if (mm) { typ.font.tracking[mm[1]] = { $value: v }; continue; }
}
writeFileSync('tokens/core/typography.json', JSON.stringify(typ, null, 2) + '\n');

// resumo
console.log('paletas:', Object.keys(palettes).filter((p) => p !== 'white' && p !== 'black').length, '+ white/black + brand(primary,secondary)');
console.log('brand.primary.500 =', colorJson.color.brand.primary[500].$value, '(#036EF2)');
console.log('brand.secondary.500 =', colorJson.color.brand.secondary[500].$value, '(#8e51ff)');
console.log('space:', Object.keys(dim.space).length, '| radii:', Object.keys(dim.radii).length - 1, '| breakpoints:', Object.keys(dim.breakpoint).length - 1);
console.log('font sizes:', Object.keys(typ.font.size).length, '| weights:', Object.keys(typ.font.weight).length, '| tracking:', Object.keys(typ.font.tracking).length - 1, '| leading:', Object.keys(typ.font.leading).length - 1);
