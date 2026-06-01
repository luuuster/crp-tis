// CRP DS — Tokens → Figma Variables
// Lê o bundle do Token Studio (token-studio/tokens.json, gerado por `npm run export:ts`)
// e cria as Figma Variables no arquivo aberto. Estrutura "Dois eixos (Brand × Mode)":
//
//   Primitives (1 mode "Value")  — core/color, core/dimension, core/typography
//   Base       (1 mode "Value")  — semantic/base (radius, chart-*) → alias dos primitivos
//   Brand      (modes CRP|MarcaB) — brand/* (primary, ring, sidebar-*) → alias dos primitivos
//   Mode       (modes Light|Dark) — mode/* (background, card, border…) → alias dos primitivos
//
// O contrato é todo referência {…}, então no Figma vira ALIAS: o designer troca o mode
// e os aliases re-apontam sozinhos. Cores usam o hex sRGB do $description (exato); se faltar,
// caímos no conversor OKLCH→sRGB. Read-only sobre os tokens: o plugin só ESCREVE no Figma.

const COLLECTIONS = {
  primitives: 'CRP/Primitives',
  base: 'CRP/Base',
  brand: 'CRP/Brand',
  mode: 'CRP/Mode',
};
const REM_PX = 16; // 1rem = 16px (base do Tailwind)

figma.showUI(__html__, { width: 460, height: 560, themeColors: true });

figma.ui.onmessage = (msg) => {
  if (msg.type === 'import') {
    try {
      runImport(msg.bundle);
    } catch (e) {
      ui({ type: 'error', line: 'Falhou: ' + (e && e.message ? e.message : String(e)) });
    }
  } else if (msg.type === 'close') {
    figma.closePlugin();
  }
};

const ui = (m) => figma.ui.postMessage(m);
const log = (line) => ui({ type: 'log', line });

// ---------------------------------------------------------------------------
// Conversões puras (cor / dimensão / número) — sem depender da API do Figma
// ---------------------------------------------------------------------------

function hexToRgb(hex) {
  let h = String(hex).replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length === 4) h = h.split('').map((c) => c + c).join(''); // #rgba
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const a = h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
}

// OKLCH → sRGB (0..1). Fallback quando não houver $description.
function oklchToRgb(str) {
  const m = String(str).match(
    /oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([-\d.]+)\s*(?:\/\s*([\d.]+%?))?\s*\)/i
  );
  if (!m) return null;
  const L = m[1].endsWith('%') ? parseFloat(m[1]) / 100 : parseFloat(m[1]);
  const C = parseFloat(m[2]);
  const H = (parseFloat(m[3]) * Math.PI) / 180;
  const alpha = m[4] ? (m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4])) : 1;
  const a = C * Math.cos(H);
  const b = C * Math.sin(H);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ * l_ * l_;
  const mm = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  const R = 4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s;
  const G = -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s;
  const B = -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s;
  const gamma = (c) => {
    const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.min(1, Math.max(0, v));
  };
  return { r: gamma(R), g: gamma(G), b: gamma(B), a: alpha };
}

function toColor(token) {
  const d = typeof token.$description === 'string' ? token.$description.trim() : '';
  if (/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(d)) return hexToRgb(d);
  const v = token.$value;
  if (typeof v === 'string' && v.trim().startsWith('#')) return hexToRgb(v);
  if (typeof v === 'string' && /^oklch/i.test(v.trim())) return oklchToRgb(v);
  return null;
}

function evalCalc(expr) {
  const m = String(expr).trim().match(/^(-?[\d.]+)\s*([*/+\-])\s*(-?[\d.]+)$/);
  if (m) {
    const a = parseFloat(m[1]);
    const b = parseFloat(m[3]);
    if (m[2] === '*') return a * b;
    if (m[2] === '/') return a / b;
    if (m[2] === '+') return a + b;
    if (m[2] === '-') return a - b;
  }
  const f = parseFloat(expr);
  return isNaN(f) ? null : f;
}

// dimensão/número → FLOAT (px). rem/em ×16, px/unitless direto, calc() avaliado.
function toFloat(token) {
  const v = token.$value;
  if (typeof v === 'number') return v;
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (s.startsWith('calc(')) return evalCalc(s.slice(5, -1));
  const m = s.match(/^(-?[\d.]+)(px|rem|em)?$/);
  if (m) {
    const n = parseFloat(m[1]);
    return m[2] === 'rem' || m[2] === 'em' ? n * REM_PX : n;
  }
  const f = parseFloat(s);
  return isNaN(f) ? null : f;
}

function figmaType(dtcg) {
  switch (dtcg) {
    case 'color': return 'COLOR';
    case 'dimension': return 'FLOAT';
    case 'number': return 'FLOAT';
    case 'fontWeight': return 'FLOAT';
    case 'fontWeights': return 'FLOAT';
    case 'fontFamily': return 'STRING';
    case 'fontFamilies': return 'STRING';
    default: return null;
  }
}

// Achata um set DTCG em [{path, token, type}] respeitando herança de $type.
function flattenSet(setObj) {
  const out = [];
  (function walk(node, prefix, inherited) {
    if (!node || typeof node !== 'object') return;
    const type = typeof node.$type === 'string' ? node.$type : inherited;
    if ('$value' in node) {
      out.push({ path: prefix.join('.'), token: node, type });
      return;
    }
    for (const k of Object.keys(node)) {
      if (k.startsWith('$')) continue;
      walk(node[k], prefix.concat(k), type);
    }
  })(setObj, [], undefined);
  return out;
}

const varName = (dotpath) => dotpath.split('.').join('/');
const refTarget = (val) => {
  const m = typeof val === 'string' && val.match(/^\{([^}]+)\}$/);
  return m ? m[1].trim() : null;
};

// ---------------------------------------------------------------------------
// Camada Figma (escrita de collections / variáveis / modes)
// ---------------------------------------------------------------------------

function findCollection(name) {
  return figma.variables.getLocalVariableCollections().find((c) => c.name === name) || null;
}

function setupCollection(name, modeNames) {
  let coll = findCollection(name);
  if (!coll) coll = figma.variables.createVariableCollection(name);
  const modeIds = {};
  modeNames.forEach((mn, i) => {
    const existing = coll.modes.find((m) => m.name === mn);
    if (existing) {
      modeIds[mn] = existing.modeId;
    } else if (i === 0 && coll.modes.length === 1) {
      coll.renameMode(coll.modes[0].modeId, mn); // renomeia o mode default
      modeIds[mn] = coll.modes[0].modeId;
    } else {
      modeIds[mn] = coll.addMode(mn); // pode lançar em time Starter (limite de modes)
    }
  });
  return { coll, modeIds };
}

function createVariableCompat(name, coll, type) {
  try {
    return figma.variables.createVariable(name, coll, type);
  } catch (e) {
    return figma.variables.createVariable(name, coll.id, type); // assinatura antiga (collectionId)
  }
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

function runImport(bundle) {
  if (!bundle || typeof bundle !== 'object') throw new Error('Bundle inválido (JSON vazio?).');
  const need = ['core/color', 'semantic/base', 'brand/crp', 'brand/marca-b', 'mode/light', 'mode/dark'];
  const missing = need.filter((k) => !bundle[k]);
  if (missing.length) throw new Error('Faltam sets no bundle: ' + missing.join(', ') + '. Rode `npm run export:ts`.');
  // Primitivos = TODOS os sets core/* presentes no bundle (color, dimension, typography, shadow, effect, motion…).
  const coreSets = Object.keys(bundle).filter((k) => k.indexOf('core/') === 0);

  const stats = { primitives: 0, base: 0, brand: 0, mode: 0, skipped: 0, aliasMissing: 0 };

  // índice de variáveis já existentes (idempotência) ----------------------
  const index = new Map(); // `${collId}::${name}` -> variable
  for (const v of figma.variables.getLocalVariables()) index.set(v.variableCollectionId + '::' + v.name, v);
  const getOrCreate = (name, coll, type) => {
    const key = coll.id + '::' + name;
    const found = index.get(key);
    if (found) {
      if (found.resolvedType === type) return found;
      found.remove(); // tipo mudou → recria
    }
    const created = createVariableCompat(name, coll, type);
    index.set(key, created);
    return created;
  };

  // 1) PRIMITIVES ---------------------------------------------------------
  log('Primitives…');
  const primMap = new Map(); // dotpath -> variable
  const prim = setupCollection(COLLECTIONS.primitives, ['Value']);
  const primMode = prim.modeIds['Value'];
  for (const setName of coreSets) {
    for (const { path, token, type } of flattenSet(bundle[setName])) {
      const ft = figmaType(type);
      if (!ft) { stats.skipped++; continue; }
      let value = null;
      if (ft === 'COLOR') value = toColor(token);
      else if (ft === 'FLOAT') value = toFloat(token);
      else if (ft === 'STRING') value = typeof token.$value === 'string' ? token.$value : String(token.$value);
      if (value === null || (ft === 'FLOAT' && isNaN(value))) { stats.skipped++; continue; }
      const v = getOrCreate(varName(path), prim.coll, ft);
      v.setValueForMode(primMode, value);
      primMap.set(path, v);
      stats.primitives++;
    }
  }
  log('  ' + stats.primitives + ' primitivos.');

  // helper p/ setar contrato (alias quando é referência; senão valor cru) --
  const setContractValue = (variable, modeId, token, ft) => {
    const target = refTarget(token.$value);
    if (target) {
      const tv = primMap.get(target);
      if (!tv) { stats.aliasMissing++; log('  ⚠ alias não encontrado: {' + target + '}'); return; }
      variable.setValueForMode(modeId, figma.variables.createVariableAlias(tv));
      return;
    }
    let value = ft === 'COLOR' ? toColor(token) : ft === 'FLOAT' ? toFloat(token) : token.$value;
    if (value === null) { stats.skipped++; return; }
    variable.setValueForMode(modeId, value);
  };

  // 2) BASE (1 mode) ------------------------------------------------------
  log('Base…');
  const base = setupCollection(COLLECTIONS.base, ['Value']);
  for (const { path, token, type } of flattenSet(bundle['semantic/base'])) {
    const ft = figmaType(type);
    if (!ft) { stats.skipped++; continue; }
    const v = getOrCreate(varName(path), base.coll, ft);
    setContractValue(v, base.modeIds['Value'], token, ft);
    stats.base++;
  }
  log('  ' + stats.base + ' tokens.');

  // 3) BRAND (modes CRP | MarcaB) ----------------------------------------
  log('Brand…');
  const brand = setupCollection(COLLECTIONS.brand, ['CRP', 'MarcaB']);
  const brandSrc = { CRP: 'brand/crp', MarcaB: 'brand/marca-b' };
  // união dos nomes de token entre as marcas (são os mesmos, mas garantimos)
  const brandPaths = new Map(); // path -> {type}
  for (const mode of Object.keys(brandSrc)) {
    for (const { path, type } of flattenSet(bundle[brandSrc[mode]])) brandPaths.set(path, { type });
  }
  for (const [path, { type }] of brandPaths) {
    const ft = figmaType(type);
    if (!ft) { stats.skipped++; continue; }
    const v = getOrCreate(varName(path), brand.coll, ft);
    for (const mode of Object.keys(brandSrc)) {
      const tok = findToken(bundle[brandSrc[mode]], path);
      if (tok) setContractValue(v, brand.modeIds[mode], tok, ft);
    }
    stats.brand++;
  }
  log('  ' + stats.brand + ' tokens × 2 modes.');

  // 4) MODE (modes Light | Dark) -----------------------------------------
  log('Mode…');
  const modeColl = setupCollection(COLLECTIONS.mode, ['Light', 'Dark']);
  const modeSrc = { Light: 'mode/light', Dark: 'mode/dark' };
  const modePaths = new Map();
  for (const mode of Object.keys(modeSrc)) {
    for (const { path, type } of flattenSet(bundle[modeSrc[mode]])) modePaths.set(path, { type });
  }
  for (const [path, { type }] of modePaths) {
    const ft = figmaType(type);
    if (!ft) { stats.skipped++; continue; }
    const v = getOrCreate(varName(path), modeColl.coll, ft);
    for (const mode of Object.keys(modeSrc)) {
      const tok = findToken(bundle[modeSrc[mode]], path);
      if (tok) setContractValue(v, modeColl.modeIds[mode], tok, ft);
    }
    stats.mode++;
  }
  log('  ' + stats.mode + ' tokens × 2 modes.');

  ui({ type: 'done', stats });
}

// localiza um token por dotpath dentro de um set (sem reflatten do set inteiro)
function findToken(setObj, dotpath) {
  let node = setObj;
  for (const seg of dotpath.split('.')) {
    if (!node || typeof node !== 'object') return null;
    node = node[seg];
  }
  return node && '$value' in node ? node : null;
}
