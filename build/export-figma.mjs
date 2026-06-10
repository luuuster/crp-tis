// Export: tokens/ -> figma-plugin/figma-variables.json (formato RESOLVIDO p/ o plugin Figma).
//
// Por que um arquivo separado do token-studio/tokens.json?
//  - O Token Studio quer DTCG multi-set (com $themes/$metadata) e entende compostos.
//  - O Figma Variables NÃO entende composto, e precisa do contrato JÁ FUNDIDO por tema
//    (brand + mode juntos). Aqui resolvemos os 4 temas (CRP/MarcaB × Light/Dark) como o build
//    de CSS faz, e entregamos collections prontas — o plugin só cria, sem adivinhar.
//
// Saída (collections):
//  CRP/Primitives (1 mode)          paleta core (cor/dimensão/número/família) — valores crus
//  CRP/Theme      (4 modes)         contrato de COR (background, primary, ring, link, charts…)
//                                   → cada cor = ALIAS do primitivo resolvido NAQUELE tema
//  CRP/Base       (1 mode)          semânticos invariáveis (radius, spacing, opacity, state,
//                                   layer) + tipografia EXPANDIDA em escalares
//  CRP/Components (1 mode)          components/* (button…) → alias dos primitivos
//
// Além das Variables, emitimos `styles` (compostos que o Figma guarda como STYLE, não Variable):
//  text   1 conjunto AGRUPADO, VINCULADO a Variables (família por MODO)   effect elevação por modo (Light/Dark)
//  paint  contrato de cor LIGADO à Variable                                grid   baseline + colunas por breakpoint
//
// Read-only sobre tokens/. O JSON gerado é ARTEFATO — não editar à mão.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadThemes } from './lib/themes.mjs';

const ROOT = process.cwd();
const TOKENS = join(ROOT, 'tokens');
const OUT_DIR = join(ROOT, 'figma-plugin');
const OUT = join(OUT_DIR, 'figma-variables.json');
const REM = 16;

const meta = JSON.parse(readFileSync(join(TOKENS, '$metadata.json'), 'utf8'));
const order = meta.tokenSetOrder;
if (!Array.isArray(order) || !order.length) {
  console.error('❌ tokens/$metadata.json sem tokenSetOrder válido — não dá pra montar os temas.');
  process.exit(1);
}

// Temas (brand×mode) e suas fontes de marca/mode — DERIVADOS de tokens/$themes.json
// (build/lib/themes.mjs). Aplicamos os sets na ORDEM do $metadata
// (core → semantic → brand → mode → components), então o mode sobrescreve a marca (dark vence).
const SSOT = loadThemes(ROOT);
const THEMES = Object.fromEntries(SSOT.themes.map((t) => [t.name, { brand: t.brandSet, mode: t.modeSet }]));
const MODES = Object.keys(THEMES);

const warnings = [];

// ---------- load + flatten ----------
const loadSet = (s) => { const f = join(TOKENS, s + '.json'); return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null; };
function flatten(obj) {
  const out = [];
  (function walk(n, p, inh) {
    if (!n || typeof n !== 'object') return;
    const t = typeof n.$type === 'string' ? n.$type : inh;
    if ('$value' in n) { out.push({ path: p.join('.'), token: n, type: t }); return; }
    for (const k of Object.keys(n)) { if (k.startsWith('$')) continue; walk(n[k], p.concat(k), t); }
  })(obj, [], undefined);
  return out;
}
const setFlat = {}; // set -> Map(path -> {token,type})
for (const s of order) {
  const o = loadSet(s);
  if (!o) { warnings.push('set ausente: ' + s); continue; }
  const m = new Map();
  for (const e of flatten(o)) m.set(e.path, e);
  setFlat[s] = m;
}
const corePaths = new Set();
const coreEntries = new Map(); // path -> {token,type}
for (const s of order) if (s.startsWith('core/') && setFlat[s]) for (const [p, e] of setFlat[s]) { corePaths.add(p); coreEntries.set(p, e); }

// merged map por tema (leaf override por path, na ordem do $metadata)
const themeSets = (t) => order.filter((s) =>
  s.startsWith('core/') || s.startsWith('semantic/') || s.startsWith('components/') || s === t.brand || s === t.mode);
function mergedMap(t) {
  const m = new Map();
  for (const s of themeSets(t)) { const f = setFlat[s]; if (!f) continue; for (const [p, e] of f) m.set(p, e); }
  return m;
}
const themeMaps = {};
for (const [name, t] of Object.entries(THEMES)) themeMaps[name] = mergedMap(t);

// ---------- referências / resolução ----------
const refTarget = (v) => { const m = typeof v === 'string' && v.match(/^\{([^}]+)\}$/); return m ? m[1].trim() : null; };
// segue a cadeia {ref} até o token terminal (com literal) DENTRO de um mapa de tema.
function resolveTerminal(path, map, seen) {
  seen = seen || new Set();
  if (seen.has(path)) return null;
  seen.add(path);
  const entry = map.get(path); // entry = { path, token, type }
  if (!entry) return null;
  const ref = refTarget(entry.token.$value);
  if (ref) { const r = resolveTerminal(ref, map, seen); if (r) return r; }
  return { path, token: entry.token, type: entry.type, isCore: corePaths.has(path) };
}

// ---------- conversões ----------
function hexToRgb(hex) {
  let h = String(hex).replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length === 4) h = h.split('').map((c) => c + c).join('');
  return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255, a: h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 };
}
function oklchToRgb(str) {
  const m = String(str).match(/oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([-\d.]+)\s*(?:\/\s*([\d.]+%?))?\s*\)/i);
  if (!m) return null;
  const L = m[1].endsWith('%') ? parseFloat(m[1]) / 100 : parseFloat(m[1]);
  const C = parseFloat(m[2]); const H = (parseFloat(m[3]) * Math.PI) / 180;
  const alpha = m[4] ? (m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4])) : 1;
  const a = C * Math.cos(H), b = C * Math.sin(H);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b, m_ = L - 0.1055613458 * a - 0.0638541728 * b, s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, mm = m_ ** 3, s = s_ ** 3;
  const R = 4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s;
  const G = -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s;
  const B = -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s;
  const g = (c) => { const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; return Math.min(1, Math.max(0, v)); };
  return { r: g(R), g: g(G), b: g(B), a: alpha };
}
function tokenToRgb(token) {
  const d = typeof token.$description === 'string' ? token.$description.trim() : '';
  if (/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(d)) return hexToRgb(d);
  const v = token.$value;
  if (typeof v === 'string' && v.trim().startsWith('#')) return hexToRgb(v);
  if (typeof v === 'string' && /^oklch/i.test(v.trim())) return oklchToRgb(v);
  return null;
}
function toNum(v) {
  if (typeof v === 'number') return v;
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (s.startsWith('calc(')) { const m = s.slice(5, -1).match(/^(-?[\d.]+)\s*([*/+\-])\s*(-?[\d.]+)$/); if (m) { const a = +m[1], b = +m[3]; return m[2] === '*' ? a * b : m[2] === '/' ? a / b : m[2] === '+' ? a + b : a - b; } }
  const m = s.match(/^(-?[\d.]+)(px|rem|em|ms|s)?$/);
  if (m) { const n = +m[1]; if (m[2] === 'rem' || m[2] === 'em') return n * REM; if (m[2] === 's') return n * 1000; return n; }
  const f = parseFloat(s); return isNaN(f) ? null : f;
}
const firstFamily = (s) => String(s).split(',')[0].replace(/["']/g, '').trim();

// ---------- helpers p/ STYLES (compostos: tipografia, sombra, grid) ----------
// Famílias CSS genéricas que NÃO existem como fonte no Figma (o plugin escolhe a 1ª real disponível).
const GENERIC_FAMILIES = new Set(['ui-sans-serif', 'system-ui', 'sans-serif', 'ui-serif', 'serif', 'ui-monospace', 'monospace', '-apple-system', 'blinkmacsystemfont', 'apple color emoji', 'segoe ui emoji', 'segoe ui symbol', 'noto color emoji', 'math', 'emoji']);
const familyList = (cssValue) => String(cssValue).split(',').map((s) => s.replace(/["']/g, '').trim()).filter((s) => s && !GENERIC_FAMILIES.has(s.toLowerCase()));
// tracking em em/%/0 → letterSpacing em PERCENT do Figma (em×100).
function letterSpacingPct(raw) {
  const s = String(raw).trim();
  let m = s.match(/^(-?[\d.]+)em$/); if (m) return +m[1] * 100;
  m = s.match(/^(-?[\d.]+)%$/); if (m) return +m[1];
  return 0; // 0 / 0px / 0em
}
// resolve um campo (ref {..} ou literal) ao valor terminal cru dentro de um mapa de tema.
function resolveFieldRaw(raw, map) {
  const ref = refTarget(raw);
  if (ref) { const t = resolveTerminal(ref, map); return t ? t.token.$value : raw; }
  return raw;
}
// cor CSS usada nas sombras: rgb(R G B / A), rgb(R,G,B[,A]), rgba(...), #hex.
function cssColorToRgba(str) {
  const s = String(str).trim();
  if (s.startsWith('#')) return hexToRgb(s);
  const m = s.match(/rgba?\(([^)]+)\)/i);
  if (!m) return { r: 0, g: 0, b: 0, a: 1 };
  const p = m[1].replace(/\//g, ' ').replace(/,/g, ' ').trim().split(/\s+/).map(parseFloat);
  const [r, g, b, a] = p;
  return { r: (r || 0) / 255, g: (g || 0) / 255, b: (b || 0) / 255, a: a == null || isNaN(a) ? 1 : a };
}
// separa por vírgula no nível de topo (respeita os parênteses de rgb(...)).
function splitTop(str, sep) {
  const out = []; let depth = 0, cur = '';
  for (const ch of String(str)) {
    if (ch === '(') depth++; else if (ch === ')') depth--;
    if (ch === sep && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}
const pxNum = (t) => { const n = parseFloat(t); return isNaN(n) ? 0 : n; };
// CSS box-shadow → efeitos do Figma (1+ camadas).
function parseShadow(str) {
  return splitTop(str, ',').map((layer) => {
    let s = layer.trim(); if (!s) return null;
    const inset = /(^|\s)inset(\s|$)/.test(s); s = s.replace(/(^|\s)inset(\s|$)/, ' ');
    const cm = s.match(/(rgba?\([^)]*\)|#[0-9a-fA-F]{3,8})/);
    const color = cm ? cssColorToRgba(cm[0]) : { r: 0, g: 0, b: 0, a: 1 };
    if (cm) s = s.replace(cm[0], ' ');
    const nums = s.trim().split(/\s+/).filter((x) => /^-?[\d.]+(px)?$/.test(x)).map(pxNum);
    const [ox = 0, oy = 0, blur = 0, spread = 0] = nums;
    const eff = { type: inset ? 'INNER_SHADOW' : 'DROP_SHADOW', color, offset: { x: ox, y: oy }, radius: blur, spread, visible: true, blendMode: 'NORMAL' };
    if (!inset) eff.showShadowBehindNode = false;
    return eff;
  }).filter(Boolean);
}

// $type DTCG -> tipo de Variable do Figma
function figmaType(dtcg) {
  if (dtcg === 'color') return 'COLOR';
  if (dtcg === 'fontFamily' || dtcg === 'fontFamilies') return 'STRING';
  if (['dimension', 'number', 'duration', 'opacity', 'borderRadius', 'borderWidth', 'sizing', 'spacing', 'fontWeight', 'fontWeights', 'fontSizes', 'lineHeights', 'letterSpacing', 'paragraphSpacing'].includes(dtcg)) return 'FLOAT';
  return null; // typography/boxShadow/cubicBezier/other → não-Variable (typography é expandido à parte)
}
function scopesFor(path, ft, dtcg) {
  const p = path.toLowerCase();
  if (ft === 'COLOR') return ['ALL_FILLS', 'STROKE_COLOR'];
  if (ft === 'STRING') return ['FONT_FAMILY'];
  if (dtcg === 'fontWeight' || /weight/.test(p)) return ['FONT_WEIGHT'];
  if (/radi|radius|corner/.test(p)) return ['CORNER_RADIUS'];
  if (/letter|tracking/.test(p)) return ['LETTER_SPACING'];
  if (/line-?height|leading/.test(p)) return ['LINE_HEIGHT'];
  if (/(font|text).?size|fontsize/.test(p)) return ['FONT_SIZE'];
  if (/opacity|alpha/.test(p)) return ['OPACITY'];
  if (/space|spacing|gap|padding|inset|margin|width|height|\bsize\b|dimension|container/.test(p)) return ['WIDTH_HEIGHT', 'GAP'];
  return ['ALL_SCOPES'];
}
// Espelha o name/kebab do Style Dictionary: camelCase → kebab + minúsculo
// (lineHeight→line-height, zIndex→z-index, borderWidth→border-width, DEFAULT→default).
// Garante que nome da Variable e o Dev Mode `var(--token)` fiquem IDÊNTICOS ao CSS shipado.
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const segs = (p) => p.split('.').map(kebab);
const nameOf = (p) => segs(p).join('/');
const codeOf = (p) => '--' + segs(p).join('-');

// ---------- montagem das collections ----------
// valor de modo: { alias } | { color } | { number } | { string }
const stats = { primitives: 0, brand: 0, modes: 0, base: 0, components: 0, typography: 0, skipped: 0 };

// 1) PRIMITIVES — paleta core, valores crus
const primVars = [];
for (const [path, e] of coreEntries) {
  const ft = figmaType(e.type);
  if (!ft) { stats.skipped++; continue; }
  let value;
  if (ft === 'COLOR') { const rgb = tokenToRgb(e.token); if (!rgb) { stats.skipped++; continue; } value = { color: rgb }; }
  else if (ft === 'FLOAT') { const n = toNum(e.token.$value); if (n === null) { stats.skipped++; continue; } value = { number: n }; }
  else { value = { string: e.type === 'fontFamily' ? firstFamily(e.token.$value) : String(e.token.$value) }; }
  primVars.push({ name: nameOf(path), type: ft, scopes: scopesFor(path, ft, e.type), code: codeOf(path), values: { Value: value } });
  stats.primitives++;
}

// helper: valor de um token resolvido num tema -> alias do primitivo OU valor cru
function resolvedValue(path, map, ft) {
  const term = resolveTerminal(path, map);
  if (!term) return null;
  if (term.isCore) return { alias: nameOf(term.path) }; // aponta p/ a variável de CRP/Primitives
  // terminal não-core (literal próprio) → valor cru
  if (ft === 'COLOR') { const rgb = tokenToRgb(term.token); return rgb ? { color: rgb } : null; }
  if (ft === 'FLOAT') { const n = toNum(term.token.$value); return n === null ? null : { number: n }; }
  return { string: term.type === 'fontFamily' ? firstFamily(term.token.$value) : String(term.token.$value) };
}

// Conjuntos de CAMADA p/ escolher o alias certo (Brand vs Primitives vs Modes).
const defaultBrandSet = SSOT.brands.find((b) => b.isDefault).set;
const brandAnchorPaths = new Set(setFlat[defaultBrandSet] ? [...setFlat[defaultBrandSet].keys()] : []);
const modeColorKeys = new Set();
for (const { set: s } of SSOT.modes) if (setFlat[s]) for (const [p, e] of setFlat[s]) if (e.type === 'color') modeColorKeys.add(p);
// devolve o alias na CAMADA correta — NÃO resolve "através" da marca (é isso que mantém a troca de marca viva).
function layerAlias(value) {
  const t = refTarget(value);
  if (!t) return null;
  if (brandAnchorPaths.has(t)) return { alias: nameOf(t) }; // → CRP/Brand
  if (corePaths.has(t)) return { alias: nameOf(t) };        // → CRP/Primitives
  if (modeColorKeys.has(t)) return { alias: nameOf(t) };    // → CRP/Modes (mesmo collection; ex.: link→primary)
  return null;
}

// 2a) BRAND (1 mode por marca do $themes) — âncoras de marca → alias do primitivo de CADA marca.
const BRANDS = SSOT.brands.map((b) => [b.name, b.set]);
const brandVars = [];
for (const key of brandAnchorPaths) {
  const sample = BRANDS.map(([, setName]) => setFlat[setName] && setFlat[setName].get(key)).find(Boolean);
  const ft = figmaType(sample ? sample.type : 'color'); // cor (brand-primary…) OU fontFamily (brand-font-*)
  if (!ft) { stats.skipped++; continue; }
  const values = {};
  for (const [brandMode, setName] of BRANDS) {
    const e = setFlat[setName] && setFlat[setName].get(key);
    if (!e) continue;
    const t = refTarget(e.token.$value);
    if (t && corePaths.has(t)) { values[brandMode] = { alias: nameOf(t) }; continue; } // → CRP/Primitives (paleta ou família)
    if (ft === 'COLOR') { const rgb = tokenToRgb(e.token); if (rgb) values[brandMode] = { color: rgb }; }
    else if (ft === 'STRING') { values[brandMode] = { string: e.type === 'fontFamily' ? firstFamily(e.token.$value) : String(e.token.$value) }; }
    else if (ft === 'FLOAT') { const n = toNum(e.token.$value); if (n !== null) values[brandMode] = { number: n }; }
  }
  if (Object.keys(values).length) {
    const scopes = ft === 'COLOR' ? ['ALL_FILLS', 'STROKE_COLOR'] : ft === 'STRING' ? ['FONT_FAMILY'] : scopesFor(key, ft, sample.type);
    brandVars.push({ name: nameOf(key), type: ft, scopes, code: codeOf(key), values });
    stats.brand++;
  }
}

// 2b) MODES (2 modes: Light, Dark) — contrato de COR. Tokens de marca aliasam CRP/Brand;
//     o resto aliasa CRP/Primitives; refs internas (ex.: link→primary) aliasam o próprio CRP/Modes.
const MODE_SRC = SSOT.modes.map((m) => [m.name, m.set]);
const modesVars = [];
for (const key of modeColorKeys) {
  const values = {};
  for (const [modeName, setName] of MODE_SRC) {
    const e = setFlat[setName] && setFlat[setName].get(key);
    if (!e) { warnings.push(`${key} ausente em ${setName}`); continue; }
    const la = layerAlias(e.token.$value);
    if (la) { values[modeName] = la; continue; }
    const term = resolveTerminal(key, themeMaps[modeName === 'Light' ? 'CRP-Light' : 'CRP-Dark']);
    const rgb = term ? tokenToRgb(term.token) : null;
    if (rgb) values[modeName] = { color: rgb }; else warnings.push(`cor sem valor: ${key} @ ${modeName}`);
  }
  if (Object.keys(values).length) { modesVars.push({ name: nameOf(key), type: 'COLOR', scopes: ['ALL_FILLS', 'STROKE_COLOR'], code: codeOf(key), values }); stats.modes++; }
}

// 3) BASE — semânticos invariáveis (não-cor) + tipografia escalar. Usa o mapa CRP-Light (invariável).
const baseMap = themeMaps['CRP-Light'];
const baseVars = [];
// fontFamily NÃO entra aqui: é decisão de MARCA (brand-font-*), exposta em CRP/Brand — não cabe
// num valor único de CRP/Base. Aqui ficam só os escalares invariáveis por marca.
const TYPO_PARTS = [['fontSize', 'font-size', 'dimension'], ['lineHeight', 'line-height', 'number'], ['letterSpacing', 'letter-spacing', 'dimension'], ['fontWeight', 'font-weight', 'fontWeight']];
for (const s of order) {
  if (!s.startsWith('semantic/') || !setFlat[s]) continue;
  for (const [path, e] of setFlat[s]) {
    if (e.type === 'typography' && e.token && typeof e.token.$value === 'object') {
      stats.typography++;
      const obj = e.token.$value;
      // tamanho do papel (px) — base p/ TRADUZIR lineHeight (razão) e letterSpacing (em) → px,
      // porque o Figma só vincula esses dois campos em PIXELS (não aceita razão/%).
      const sizePx = obj.fontSize != null ? toNum(resolveFieldRaw(obj.fontSize, baseMap)) : null;
      for (const [key, suffix, dtcg] of TYPO_PARTS) {
        if (!(key in obj)) continue;
        const ft = figmaType(dtcg);
        const subPath = path + '.' + suffix;
        const raw = obj[key];
        const ref = refTarget(raw);
        let value, noCode = false;
        if (key === 'lineHeight') {
          // px = razão × tamanho (snapshot; mudou o size no token → regenerar). CSS continua razão.
          const ratio = toNum(resolveFieldRaw(raw, baseMap));
          if (ratio === null || sizePx === null) { stats.skipped++; continue; }
          value = { number: Math.round(ratio * sizePx) };
          noCode = true; // não fingir que var(--…-line-height) é px (o CSS é razão)
        } else if (key === 'letterSpacing') {
          // px = em × tamanho (em é relativo ao tamanho). CSS continua em.
          if (sizePx === null) { stats.skipped++; continue; }
          const em = letterSpacingPct(resolveFieldRaw(raw, baseMap)) / 100;
          value = { number: +(em * sizePx).toFixed(2) };
          noCode = true;
        } else if (ref) {
          const term = resolveTerminal(ref, baseMap);
          if (term && term.isCore) value = { alias: nameOf(term.path) };
          else { const n = toNum(term ? term.token.$value : raw); if (n === null) { stats.skipped++; continue; } value = { number: n }; }
        } else {
          const n = toNum(raw); if (n === null) { stats.skipped++; continue; } value = { number: n };
        }
        const def = { name: nameOf(subPath), type: ft, scopes: scopesFor(subPath, ft, dtcg), values: { Value: value } };
        if (!noCode) def.code = codeOf(subPath);
        baseVars.push(def);
        stats.base++;
      }
      continue;
    }
    const ft = figmaType(e.type);
    if (!ft) { stats.skipped++; continue; }
    const value = resolvedValue(path, baseMap, ft);
    if (!value) { stats.skipped++; continue; }
    baseVars.push({ name: nameOf(path), type: ft, scopes: scopesFor(path, ft, e.type), code: codeOf(path), values: { Value: value } });
    stats.base++;
  }
}

// 4) COMPONENTS — components/* (1 mode). Alias dos primitivos (dims). Usa CRP-Light.
const compVars = [];
for (const s of order) {
  if (!s.startsWith('components/') || !setFlat[s]) continue;
  for (const [path, e] of setFlat[s]) {
    const ft = figmaType(e.type);
    if (!ft) { stats.skipped++; continue; }
    const value = resolvedValue(path, baseMap, ft);
    if (!value) { stats.skipped++; continue; }
    compVars.push({ name: nameOf(path), type: ft, scopes: scopesFor(path, ft, e.type), code: codeOf(path), values: { Value: value } });
    stats.components++;
  }
}

// ===================== STYLES (compostos — não viram Variable) =====================
// O Figma só guarda escalares em Variables; tipografia, sombra e grid são STYLES. Aqui os
// resolvemos prontos para o plugin criar (Text/Effect/Paint/Grid). Paint Styles são LIGADOS
// à Variable de CRP/Modes (não duplicam cor: seguem Brand × Light/Dark vivos).
const styleStats = { text: 0, effect: 0, paint: 0, grid: 0 };

// 1) TEXT — UM conjunto AGRUPADO (Display/Heading/Body/Label/Link/Caption/Overline/Code), com TODOS
//    os campos VINCULADOS a Variables. A FAMÍLIA aponta p/ brand-font-* (CRP/Brand) → troca por MODO de
//    marca (CRP/MarcaB); size/peso vinculam a CRP/Base; lineHeight/letterSpacing vinculam às Variables de
//    CRP/Base já TRADUZIDAS em px. Valores concretos (tema CRP-Light = default) viajam junto como fontName
//    inicial + fallback caso o binding não esteja disponível na versão da API.
// CADA categoria é uma PASTA (até as de um item só → leaf "Base", como em Body/Base, Label/Base).
const ROLE_GROUP = {
  display: 'Display/Base',
  h1: 'Heading/H1', h2: 'Heading/H2', h3: 'Heading/H3', h4: 'Heading/H4', h5: 'Heading/H5', h6: 'Heading/H6',
  'body-lg': 'Body/Large', body: 'Body/Base', 'body-sm': 'Body/Small',
  'label-lg': 'Label/Large', label: 'Label/Base', 'label-sm': 'Label/Small',
  link: 'Link/Base', caption: 'Caption/Base', overline: 'Overline/Base', code: 'Code/Base',
};
const baseMapTypo = themeMaps['CRP-Light'];
const textStyles = [];
for (const s of order) {
  if (!s.startsWith('semantic/') || !setFlat[s]) continue;
  for (const [path, e] of setFlat[s]) {
    if (e.type !== 'typography' || !e.token || typeof e.token.$value !== 'object') continue;
    const v = e.token.$value;
    const role = path.split('.').slice(1).join('/'); // text.h1 → h1 ; text.body-lg → body-lg
    const ffRef = refTarget(v.fontFamily); // font.heading | font.body | font.mono
    // mono é família de SISTEMA (mesma nas 2 marcas; primitivo = "ui-monospace", não é fonte real) →
    // NÃO vincular a família do code (fica concreta numa mono instalada). heading/body têm família real.
    const familyAnchor = ffRef === 'font.heading' ? 'brand-font-heading' : ffRef === 'font.body' ? 'brand-font-body' : null;
    // concretos no tema default (CRP)
    const fams = familyList(resolveFieldRaw(v.fontFamily, baseMapTypo));
    const weight = toNum(resolveFieldRaw(v.fontWeight, baseMapTypo)) || 400;
    const sizePx = toNum(resolveFieldRaw(v.fontSize, baseMapTypo));
    const lhRatio = v.lineHeight != null ? toNum(resolveFieldRaw(v.lineHeight, baseMapTypo)) : null;
    const lsEm = v.letterSpacing != null ? letterSpacingPct(resolveFieldRaw(v.letterSpacing, baseMapTypo)) / 100 : 0;
    const lhPx = lhRatio == null || sizePx == null ? null : Math.round(lhRatio * sizePx);
    const lsPx = sizePx == null ? 0 : +(lsEm * sizePx).toFixed(2);
    const base = nameOf(path); // text/h1
    const bind = { fontWeight: base + '/font-weight', fontSize: base + '/font-size' };
    if (familyAnchor) bind.fontFamily = familyAnchor; // família vinculada (heading/body) → troca por modo
    if (lhPx != null) bind.lineHeight = base + '/line-height';
    if (v.letterSpacing != null) bind.letterSpacing = base + '/letter-spacing';
    textStyles.push({
      name: ROLE_GROUP[role] || ('Text/' + role),
      fontFamilies: fams.length ? fams : ['Inter'],
      fontWeight: weight,
      fontSize: sizePx == null ? 16 : sizePx,
      lineHeight: lhPx == null ? { unit: 'AUTO' } : { unit: 'PIXELS', value: lhPx },
      letterSpacing: { unit: 'PIXELS', value: lsPx },
      textDecoration: /underline/i.test(String(v.textDecoration || '')) ? 'UNDERLINE' : 'NONE',
      bind, // { fontFamily, fontWeight, fontSize, lineHeight?, letterSpacing? } → nomes de Variable
      description: typeof e.token.$description === 'string' ? e.token.$description : undefined,
    });
    styleStats.text++;
  }
}
// Famílias REAIS das marcas (heading/body de CRP e MarcaB) p/ o plugin PRÉ-CARREGAR — assim a família
// vinculada renderiza em qualquer modo de marca. (mono não entra: é de sistema e não é vinculada.)
const textFamilies = [];
for (const { set: setName } of SSOT.brands) {
  for (const key of ['brand-font-heading', 'brand-font-body']) {
    const e = setFlat[setName] && setFlat[setName].get(key);
    if (!e) continue;
    const f = familyList(resolveFieldRaw(e.token.$value, baseMapTypo))[0];
    if (f && !textFamilies.includes(f)) textFamilies.push(f);
  }
}

// 2) EFFECT — elevação semântica resolvida POR MODO (Style não tem modes → 2 pastas Light/Dark).
const effectStyles = [];
for (const [label, themeName] of [['Light', 'CRP-Light'], ['Dark', 'CRP-Dark']]) {
  for (const key of ['xs', 'sm', 'md', 'lg', 'xl']) {
    const term = resolveTerminal('elevation.' + key, themeMaps[themeName]);
    if (!term || typeof term.token.$value !== 'string') continue;
    const effects = parseShadow(term.token.$value);
    if (!effects.length) continue;
    effectStyles.push({ name: 'Elevation/' + label + '/' + key, effects, description: 'Sombra de elevação ' + key + ' (' + label.toLowerCase() + ').' });
    styleStats.effect++;
  }
}

// 3) PAINT — contrato de cor de CRP/Modes; cada Paint Style LIGADO à sua Variable (segue Brand×Modes).
const paintStyles = [];
for (const v of modesVars) {
  const term = resolveTerminal(v.name, themeMaps['CRP-Light']); // nomes de Modes são single-seg (path == nome)
  const fb = term ? tokenToRgb(term.token) : null;
  paintStyles.push({
    name: 'Color/' + v.name,
    boundVariable: v.name,
    fallbackColor: fb || { r: 0, g: 0, b: 0, a: 1 },
    description: 'Ligado à Variable CRP/Modes "' + v.name + '" — segue Brand × Light/Dark.',
  });
  styleStats.paint++;
}

// 4) GRID — baseline (4/8px) + colunas responsivas por breakpoint (derivado de space/breakpoint).
const num = (p) => { const e = coreEntries.get(p); return e ? toNum(e.token.$value) : null; };
const gridColor = { r: 1, g: 0, b: 0, a: 0.08 };
const gutter = num('space.6') || 24;
const gridStyles = [];
const baselines = [['Grid/Baseline 4', num('space.1'), 'space.1'], ['Grid/Baseline 8', num('space.2'), 'space.2']];
for (const [name, size, src] of baselines) {
  if (size == null) continue;
  gridStyles.push({ name, layoutGrids: [{ pattern: 'GRID', sectionSize: size, visible: true, color: gridColor }], description: 'Malha de ' + size + 'px (' + src + ').' });
  styleStats.grid++;
}
for (const k of ['sm', 'md', 'lg', 'xl', '2xl']) {
  const w = num('breakpoint.' + k); if (w == null) continue;
  gridStyles.push({
    name: 'Columns/' + k + ' · ' + w,
    layoutGrids: [{ pattern: 'COLUMNS', alignment: 'STRETCH', count: 12, gutterSize: gutter, offset: gutter, visible: true, color: gridColor }],
    description: '12 colunas · gutter/margem ' + gutter + 'px — breakpoint ' + k + ' (' + w + 'px).',
  });
  styleStats.grid++;
}

// pares fg/bg do contrato → a auditoria do plugin recalcula o contraste AA sobre os valores ATUAIS do
// Figma (pega drift de edição manual; o build já garante AA na origem). Derivado das chaves *-foreground.
const contrastPairs = [];
for (const key of modeColorKeys) {
  if (key === 'foreground') { if (modeColorKeys.has('background')) contrastPairs.push({ bg: 'background', fg: 'foreground' }); continue; }
  if (!key.endsWith('-foreground')) continue;
  const base = key.slice(0, -'-foreground'.length);
  if (modeColorKeys.has(base)) contrastPairs.push({ bg: base, fg: key });
}

const doc = {
  $schema: 'crp-figma-variables/2',
  generatedFrom: 'tokens/ (npm run export:figma) — NÃO editar à mão',
  collections: [
    { name: 'CRP/Primitives', modes: ['Value'], variables: primVars },
    { name: 'CRP/Brand', modes: SSOT.brands.map((b) => b.name), variables: brandVars },
    { name: 'CRP/Modes', modes: SSOT.modes.map((m) => m.name), variables: modesVars },
    { name: 'CRP/Base', modes: ['Value'], variables: baseVars },
    { name: 'CRP/Components', modes: ['Value'], variables: compVars },
  ],
  styles: { text: textStyles, textFamilies, effect: effectStyles, paint: paintStyles, grid: gridStyles },
  audit: { contrastPairs },
  // migração de rename (opt-in): [{ from, to }] — o plugin renomeia a Variable existente (preserva
  // bindings) antes de criar/prune. Vazio por padrão; popule ao renomear um token p/ não perder vínculos.
  renames: [],
};

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
try {
  writeFileSync(OUT, JSON.stringify(doc, null, 2) + '\n');
} catch (e) {
  console.error(`❌ falha ao escrever ${OUT}: ${e.message}`);
  process.exit(1);
}

console.log('Export Figma Variables + Styles → figma-plugin/figma-variables.json');
console.log(`  Primitives: ${stats.primitives} | Brand (CRP/MarcaB): ${stats.brand} | Modes (Light/Dark): ${stats.modes} | Base: ${stats.base} (typografia: ${stats.typography} papéis) | Components: ${stats.components}`);
console.log(`  Styles → text: ${styleStats.text} | effect: ${styleStats.effect} | paint (ligados a Modes): ${styleStats.paint} | grid: ${styleStats.grid}`);
console.log(`  ignorados (composto/sem valor): ${stats.skipped}`);
if (warnings.length) { console.log('\n⚠ Avisos:'); warnings.slice(0, 12).forEach((w) => console.log('  - ' + w)); if (warnings.length > 12) console.log('  … +' + (warnings.length - 12)); }
console.log('\n✅ pronto — importe figma-plugin/figma-variables.json pelo plugin "CRP DS".');
