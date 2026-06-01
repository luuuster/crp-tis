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

// Rampas da marca: ancora a cor EXATA no shade de lightness mais próximo e gera uma rampa
// MONOTÔNICA (hue da marca + croma em sino). Funciona p/ qualquer cor — clara ou escura.
const SHADES = [50,100,200,300,400,500,600,700,800,900,950];
const LADDER = { 50:0.971,100:0.936,200:0.885,300:0.808,400:0.704,500:0.637,600:0.577,700:0.505,800:0.444,900:0.396,950:0.258 };
const BELL   = { 50:0.10,100:0.22,200:0.42,300:0.65,400:0.88,500:1.0,600:1.0,700:0.88,800:0.74,900:0.62,950:0.42 };
function ramp(hexInput) {
  const base = oklch(hexInput);
  let anchor = 500, best = Infinity;
  for (const s of SHADES) { const d = Math.abs(LADDER[s] - base.l); if (d < best) { best = d; anchor = s; } }
  const out = {};
  for (const s of SHADES) {
    out[s] = s === anchor
      ? fmt({ l: base.l, c: base.c, h: base.h })
      : fmt({ l: LADDER[s], c: base.c * BELL[s] / BELL[anchor], h: base.h });
  }
  return { out, anchor };
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

// Cores das marcas (primary/secondary por marca). O shade-âncora e o DEFAULT = HEX exato informado.
const BRANDS = {
  crp:       { primary: '#036EF2', secondary: '#8e51ff' },
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
    obj[anchor].$description = h.toLowerCase();           // shade-âncora = cor exata
    obj.DEFAULT = tok(fmt(oklch(h)), h.toLowerCase());    // DEFAULT = cor exata
    colorJson.color.brand[brand][role] = obj;
    brandAnchors[brand][role] = anchor;
  }
}
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
console.log('paletas Tailwind:', Object.keys(palettes).filter((p) => p !== 'white' && p !== 'black').length, '+ white/black');
for (const [b, roles] of Object.entries(brandAnchors))
  for (const [role, a] of Object.entries(roles))
    console.log(`brand.${b}.${role}: âncora=${a}, exato=${colorJson.color.brand[b][role].DEFAULT.$description}`);
console.log('space:', Object.keys(dim.space).length, '| radii:', Object.keys(dim.radii).length - 1, '| breakpoints:', Object.keys(dim.breakpoint).length - 1);
console.log('font sizes:', Object.keys(typ.font.size).length, '| weights:', Object.keys(typ.font.weight).length, '| tracking:', Object.keys(typ.font.tracking).length - 1, '| leading:', Object.keys(typ.font.leading).length - 1);
