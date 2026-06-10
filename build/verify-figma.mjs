// Validador do figma-plugin/figma-variables.json (estrutura de 2 eixos: Brand × Modes) contra a
// saída REAL do build (dist/themes/*.css, Style Dictionary). COMPÕE os eixos: resolve cada cor de
// CRP/Modes para um tema completo (marca + light/dark) seguindo os aliases até o primitivo, e compara
// com o terminal do CSS daquele tema. Se baterem, está correto de fato. Relatório (sai != 0 se erro).
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadThemes } from './lib/themes.mjs';
import { cssValToRgb, dist } from './lib/color.mjs';

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist');
const fig = JSON.parse(readFileSync(join(ROOT, 'figma-plugin', 'figma-variables.json'), 'utf8'));

// Marcas/modos/temas derivados de tokens/$themes.json (build/lib/themes.mjs) — marca nova entra sozinha.
const SSOT = loadThemes(ROOT);
const BRAND_MODES = SSOT.brands.map((b) => b.name);   // modes do eixo CRP/Brand
const LIGHT_MODES = SSOT.modes.map((m) => m.name);    // modes do eixo CRP/Modes
// theme completo -> arquivo CSS + (brandMode, lightMode) dos eixos figma
const FULL = SSOT.themes.map((t) => [t.brand, t.mode, t.name]);
const errors = [], warnings = [];

// ---- figma ----
// Os aliases do bundle resolvem por NOME PURO (sem qualificador de collection) — aqui e no plugin. Isso
// exige nome ÚNICO entre as 5 collections; um nome repetido sobrescreveria figVars e mis-resolveria em
// silêncio (corrompendo a própria verificação). Guarda fatal: nome duplicado entre collections é erro.
const figVars = new Map(); // name -> { type, values, collection }
const firstColl = new Map(); // name -> primeira collection vista
for (const c of fig.collections) for (const v of c.variables) {
  if (firstColl.has(v.name) && firstColl.get(v.name) !== c.name)
    errors.push(`NOME DUPLICADO: "${v.name}" em ${firstColl.get(v.name)} e ${c.name} — aliases resolvem por nome puro; o nome precisa ser único entre as collections`);
  else if (!firstColl.has(v.name)) firstColl.set(v.name, c.name);
  figVars.set(v.name, { type: v.type, values: v.values, collection: c.name });
}
const coll = (n) => fig.collections.find((c) => c.name === n);
const modeKeyFor = (collection, brandMode, lightMode) => collection === 'CRP/Brand' ? brandMode : collection === 'CRP/Modes' ? lightMode : 'Value';
// resolve um nome figma até o terminal (var com valor cru), dado os 2 eixos
function resolveFig(name, brandMode, lightMode, seen) {
  seen = seen || new Set();
  if (seen.has(name)) return null;
  seen.add(name);
  const v = figVars.get(name);
  if (!v) return null;
  const slot = v.values[modeKeyFor(v.collection, brandMode, lightMode)];
  if (!slot) return null;
  if (slot.alias !== undefined) return resolveFig(slot.alias, brandMode, lightMode, seen);
  return { name, collection: v.collection, color: slot.color, number: slot.number, string: slot.string };
}

// ---- CSS ----
function parseCss(file) {
  const css = readFileSync(file, 'utf8');
  const decl = {}, hex = {};
  for (const m of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);(?:\s*\/\*\*?\s*(#[0-9a-fA-F]{3,8})\s*\*\/)?/g)) {
    decl[m[1]] = m[2].trim();
    if (m[3]) hex[m[1]] = m[3];
  }
  return { decl, hex };
}
const css = {};
for (const [, , t] of FULL) {
  const p = join(DIST, 'themes', t + '.css');
  if (!existsSync(p)) { errors.push('CSS por-tema ausente: ' + t + '.css (rode `npm run build`)'); continue; }
  css[t] = parseCss(p);
}
function resolveCss(decl, varname, depth) {
  depth = depth || 0;
  if (depth > 30) return null;
  const v = decl[varname];
  if (v === undefined) return { name: varname, value: undefined };
  const ref = v.match(/^var\((--[\w-]+)\)$/);
  if (ref) return resolveCss(decl, ref[1], depth + 1);
  return { name: varname, value: v };
}

// ---- cor (hexToRgb/oklchToRgb/cssValToRgb/dist em build/lib/color.mjs) ----
const fmt = (c) => c ? `rgb(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)})` : '?';
const TOL = 0.012; // ~3/255

let checkedColor = 0, checkedPrim = 0, checkedBase = 0;

// ===== 1) aliases sem ponteiro quebrado (todas as collections) =====
for (const [name, v] of figVars) for (const m of Object.keys(v.values)) {
  const a = v.values[m].alias;
  if (a !== undefined && !figVars.has(a)) errors.push(`ALIAS QUEBRADO: ${name}[${m}] → ${a} (não existe)`);
}

// ===== 2) completude dos eixos =====
const brand = coll('CRP/Brand'), modes = coll('CRP/Modes');
for (const v of brand.variables) for (const m of BRAND_MODES) if (!v.values[m]) errors.push(`BRAND incompleto: ${v.name} sem o mode ${m}`);
for (const v of modes.variables) for (const m of LIGHT_MODES) if (!v.values[m]) errors.push(`MODES incompleto: ${v.name} sem o mode ${m}`);
// Famílias tipográficas de marca (brand-font-*): cada marca resolve p/ uma família não-vazia.
for (const v of brand.variables) {
  if (v.type !== 'STRING') continue;
  for (const bm of BRAND_MODES) {
    const r = resolveFig(v.name, bm, 'Light');
    if (!r || typeof r.string !== 'string' || !r.string) errors.push(`BRAND STRING "${v.name}"[${bm}] não resolve p/ uma família tipográfica`);
  }
}

// ===== 3) cor certa por TEMA COMPLETO (compõe Brand × Modes e compara com o CSS) =====
for (const [brandMode, lightMode, themeName] of FULL) {
  const c = css[themeName];
  if (!c) continue;
  for (const v of modes.variables) {
    const cssTerm = resolveCss(c.decl, '--' + v.name);
    if (!cssTerm || cssTerm.value === undefined) { warnings.push(`${themeName}: --${v.name} não existe no CSS`); continue; }
    const figTerm = resolveFig(v.name, brandMode, lightMode);
    if (!figTerm) { errors.push(`SEM RESOLUÇÃO [${themeName}] ${v.name}`); continue; }
    checkedColor++;
    // nome do terminal (só compara nome se o terminal é um primitivo)
    if (figTerm.collection === 'CRP/Primitives') {
      const figName = figTerm.name.split('/').join('-'), cssName = cssTerm.name.slice(2);
      if (figName !== cssName) { errors.push(`COR ERRADA [${themeName}] ${v.name}: figma→${figName} | CSS→${cssName}`); continue; }
    }
    // valor
    const figRgb = figTerm.color, cssRgb = cssValToRgb(cssTerm.value, c.hex[cssTerm.name]);
    if (figRgb && cssRgb && dist(figRgb, cssRgb) > TOL) errors.push(`VALOR ERRADO [${themeName}] ${v.name}: figma ${fmt(figRgb)} vs CSS ${fmt(cssRgb)}`);
  }
}

// ===== 4) RGB de cada PRIMITIVO == hex de origem (CRP-Light.css tem todos os core) =====
const base = css['CRP-Light'];
for (const v of coll('CRP/Primitives').variables) {
  if (v.type !== 'COLOR') continue;
  const cssName = '--' + v.name.split('/').join('-');
  const raw = base.decl[cssName];
  if (raw === undefined) { warnings.push(`primitivo sem correspondência no CSS: ${v.name}`); continue; }
  const cssRgb = cssValToRgb(raw, base.hex[cssName]), figRgb = v.values.Value && v.values.Value.color;
  checkedPrim++;
  if (cssRgb && figRgb && dist(figRgb, cssRgb) > TOL) errors.push(`PRIMITIVO ERRADO ${v.name}: figma ${fmt(figRgb)} vs CSS ${fmt(cssRgb)}`);
}

// ===== 5) Base/Components: aliases batem com o CSS (CRP-Light, invariável) =====
for (const collName of ['CRP/Base', 'CRP/Components']) {
  for (const v of coll(collName).variables) {
    const slot = v.values.Value;
    if (!slot || slot.alias === undefined) continue;
    const cssVarName = '--' + v.name.split('/').join('-');
    const term = resolveCss(base.decl, cssVarName);
    if (!term || term.value === undefined) { warnings.push(`${collName}: ${cssVarName} não existe no CSS`); continue; }
    checkedBase++;
    if (slot.alias.split('/').join('-') !== term.name.slice(2)) errors.push(`ALIAS ERRADO [${collName}] ${v.name}: figma→${slot.alias.split('/').join('-')} | CSS→${term.name.slice(2)}`);
  }
}

// ===== 6) STYLES (compostos: text/effect/paint/grid) =====
let checkedStyles = 0;
const st = fig.styles || {};
const modesNames = new Set((coll('CRP/Modes')?.variables || []).map((v) => v.name));
const baseNames = new Set((coll('CRP/Base')?.variables || []).map((v) => v.name));
const brandAll = new Set((coll('CRP/Brand')?.variables || []).map((v) => v.name));
const brandStr = new Set((coll('CRP/Brand')?.variables || []).filter((v) => v.type === 'STRING').map((v) => v.name));
for (const t of (st.text || [])) {
  checkedStyles++;
  if (!(t.fontFamilies && t.fontFamilies.length)) warnings.push(`TEXT "${t.name}": sem fontFamilies (usará fallback)`);
  if (!(typeof t.fontSize === 'number' && t.fontSize > 0)) errors.push(`TEXT "${t.name}": fontSize inválido (${t.fontSize})`);
  const b = t.bind || {};
  // família vinculada → tem que existir em CRP/Brand e ser STRING (troca por modo de marca)
  if (b.fontFamily) {
    if (!brandAll.has(b.fontFamily)) errors.push(`TEXT "${t.name}": bind.fontFamily ${b.fontFamily} não existe em CRP/Brand`);
    else if (!brandStr.has(b.fontFamily)) errors.push(`TEXT "${t.name}": bind.fontFamily ${b.fontFamily} não é STRING`);
  }
  // escalares vinculados → têm que existir em CRP/Base
  for (const f of ['fontWeight', 'fontSize', 'lineHeight', 'letterSpacing']) {
    if (b[f] && !baseNames.has(b[f])) errors.push(`TEXT "${t.name}": bind.${f} ${b[f]} não existe em CRP/Base`);
  }
  // tradução %→px: a Variable de lineHeight/letterSpacing carrega o MESMO px do valor concreto do style
  for (const [f, slot] of [['lineHeight', t.lineHeight], ['letterSpacing', t.letterSpacing]]) {
    if (!b[f] || !slot || slot.unit !== 'PIXELS') continue;
    const r = resolveFig(b[f], 'CRP', 'Light');
    const n = r && r.number;
    if (typeof n !== 'number' || !isFinite(n)) errors.push(`TEXT "${t.name}": Variable ${b[f]} não resolve p/ número (px)`);
    else if (Math.abs(n - slot.value) > 0.5) errors.push(`TEXT "${t.name}": ${f} px divergente — Variable ${n} vs style ${slot.value}`);
  }
}
for (const p of (st.paint || [])) {
  checkedStyles++;
  if (!figVars.has(p.boundVariable)) errors.push(`PAINT "${p.name}": boundVariable ${p.boundVariable} não existe entre as Variables`);
  else if (!modesNames.has(p.boundVariable)) warnings.push(`PAINT "${p.name}": boundVariable ${p.boundVariable} não está em CRP/Modes`);
}
for (const e of (st.effect || [])) {
  checkedStyles++;
  if (!(e.effects && e.effects.length)) { errors.push(`EFFECT "${e.name}": sem camadas`); continue; }
  for (const ef of e.effects) {
    const ok = ef.color && [ef.offset && ef.offset.x, ef.offset && ef.offset.y, ef.radius, ef.spread].every((n) => typeof n === 'number' && isFinite(n));
    if (!ok) errors.push(`EFFECT "${e.name}": camada com número inválido`);
  }
}
for (const g of (st.grid || [])) {
  checkedStyles++;
  if (!(g.layoutGrids && g.layoutGrids.length)) errors.push(`GRID "${g.name}": sem layoutGrids`);
}

// ===== 7) AUDIT — pares de contraste referenciam tokens de CRP/Modes =====
let checkedPairs = 0;
for (const p of ((fig.audit && fig.audit.contrastPairs) || [])) {
  checkedPairs++;
  if (!modesNames.has(p.bg)) errors.push(`CONTRAST: bg "${p.bg}" não está em CRP/Modes`);
  if (!modesNames.has(p.fg)) errors.push(`CONTRAST: fg "${p.fg}" não está em CRP/Modes`);
}

// ---- relatório ----
console.log(`\nVerificação do figma-variables.json — 2 eixos (Brand × Modes), cruzado com dist/themes/*.css`);
console.log(`  cores de tema conferidas: ${checkedColor} | primitivos: ${checkedPrim} | base/components: ${checkedBase} | styles: ${checkedStyles} | pares de contraste: ${checkedPairs}`);
if (warnings.length) { console.log(`\n⚠ Avisos (${warnings.length}):`); warnings.slice(0, 20).forEach((w) => console.log('  - ' + w)); if (warnings.length > 20) console.log('  … +' + (warnings.length - 20)); }
if (errors.length) { console.log(`\n❌ Erros (${errors.length}):`); errors.forEach((e) => console.log('  - ' + e)); process.exit(1); }
console.log(`\n✅ figma-variables.json 100% consistente com o build — Brand × Modes resolve igual ao CSS em todos os 4 temas; styles (text/effect/paint/grid) bem-formados e ligados às Variables certas.`);
