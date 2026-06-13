// Gera a REFERÊNCIA de tokens consumida pela extensão CRP Inspector (crp-editor-extension/tokens.json).
// Resolve as var() do dist para literais e converte cores → hex sRGB (oklchToRgb bate com o pixel do
// navegador, validado por canvas). É um ARTEFATO gerado — não editar à mão; rode `npm run export:ext`.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { scopesOf, makeResolve } from './lib/css.mjs';
import { oklchToRgb } from './lib/color.mjs';
import { loadThemes } from './lib/themes.mjs';

const ROOT = process.cwd();
const OUT_DIR = join(ROOT, 'crp-editor-extension');
const scopes = scopesOf(readFileSync(join(ROOT, 'dist', 'tokens.css'), 'utf8'));
const root = scopes[':root'] || {};

// Cores semânticas do CONTRATO (o que um componente deve usar) — não a paleta crua.
// Inclui as variantes `-text` (texto colorido é pintado com elas, não com o fill) e as cores de
// status success/warning/info — sem elas, um verde de sucesso casava no token errado (chart/muted).
const COLOR_TOKENS = [
  'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
  'primary', 'primary-foreground', 'primary-text',
  'secondary', 'secondary-foreground', 'secondary-text',
  'muted', 'muted-foreground', 'accent', 'accent-foreground',
  'destructive', 'destructive-foreground', 'destructive-text',
  'success', 'success-foreground', 'success-text',
  'warning', 'warning-foreground', 'warning-text',
  'info', 'info-foreground', 'info-text',
  'border', 'input', 'ring', 'link',
  'sidebar', 'sidebar-foreground', 'sidebar-primary', 'sidebar-accent', 'sidebar-border',
  ...Array.from({ length: 12 }, (_, i) => `chart-${i + 1}`),
];

// Roles tipográficos (mesma lista do editor) — size/weight/lh/ls são independentes de marca; a
// família vem via var(--text-{role}-font-family) na aplicação (resolve por marca em runtime).
const ROLES = ['display', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body-lg', 'body', 'body-sm',
  'label-lg', 'label', 'label-sm', 'link', 'caption', 'overline', 'code'];

const RADII = ['sm', 'md', 'base', 'lg', 'xl', '2xl', 'full'];

// Resolve um valor de cor (já com var() expandido) → hex sRGB. Aceita OKLCH/OKLab, hex (#rgb/#rrggbb)
// e rgb()/rgba(). Antes só tratava OKLCH — então tokens definidos como hex (ex.: `--color-white: #ffffff`
// em background/card/popover) caíam fora e a cor ficava "órfã" na auditoria (casava no cinza próximo).
const toHex = (v) => {
  if (v == null) return null;
  const s = String(v).trim();
  let m = s.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (m) {
    let h = m[1].toLowerCase();
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return '#' + h;
  }
  m = s.match(/^rgba?\(([^)]+)\)/i);
  if (m) {
    const p = m[1].split(/[\s,/]+/).map(Number);
    if (p.length >= 3 && p.slice(0, 3).every((n) => !isNaN(n))) {
      const h = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
      return '#' + h(p[0]) + h(p[1]) + h(p[2]);
    }
  }
  const c = oklchToRgb(s);
  if (!c) return null;
  const h = (n) => Math.round(n * 255).toString(16).padStart(2, '0');
  return '#' + h(c.r) + h(c.g) + h(c.b);
};
const toPx = (v) => {
  if (v == null) return null;
  const s = String(v).trim();
  if (s.endsWith('rem')) return Math.round(parseFloat(s) * 16 * 100) / 100;
  if (s.endsWith('px')) return Math.round(parseFloat(s) * 100) / 100;
  if (/^[\d.]+$/.test(s)) return parseFloat(s); // unitless → assume px
  return null;
};

// cores por tema (a marca/modo muda os semânticos)
const { themes, selectorsByTheme } = loadThemes(ROOT);
const colorsByTheme = {};
for (const [name, sel] of Object.entries(selectorsByTheme)) {
  const scope = scopes[sel] || root;
  const resolve = makeResolve(root);
  const map = {};
  for (const t of COLOR_TOKENS) {
    const raw = scope[`--${t}`] ?? root[`--${t}`];
    if (raw == null) continue;
    const hex = toHex(resolve(raw, scope));
    if (hex) map[t] = hex;
  }
  colorsByTheme[name] = map;
}

const resolveRoot = makeResolve(root);
const radii = {};
for (const r of RADII) {
  const raw = root[r === 'base' ? '--radius' : `--radius-${r}`];
  const px = toPx(resolveRoot(raw, root));
  if (px != null) radii[r] = px;
}

const typography = {};
for (const role of ROLES) {
  const get = (p) => resolveRoot(root[`--text-${role}-${p}`], root);
  const sizePx = toPx(get('font-size'));
  if (sizePx == null) continue;
  typography[role] = {
    sizePx,
    weight: Number(get('font-weight')) || null,
    lineHeight: get('line-height') ?? null,
    letterSpacing: get('letter-spacing') ?? null,
  };
}

const out = {
  generatedFrom: 'dist/tokens.css',
  note: 'Artefato gerado por build/export-extension-tokens.mjs — não editar à mão.',
  themes: Object.keys(colorsByTheme),
  colorsByTheme,
  radii,
  typography,
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, 'tokens.json'), JSON.stringify(out, null, 2) + '\n');
// tokens.js: mesma data, injetável no content script (define globalThis.CRP_TOKENS).
writeFileSync(join(OUT_DIR, 'tokens.js'),
  '/* Gerado por build/export-extension-tokens.mjs — não editar à mão. */\n' +
  'globalThis.CRP_TOKENS = ' + JSON.stringify(out) + ';\n');
const nColors = Object.values(colorsByTheme)[0] ? Object.keys(Object.values(colorsByTheme)[0]).length : 0;
console.log(`crp-editor-extension/tokens.json ✓  (${out.themes.length} temas × ${nColors} cores, ${Object.keys(radii).length} raios, ${Object.keys(typography).length} roles)`);
