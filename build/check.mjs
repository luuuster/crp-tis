// Validação do output gerado (roda no CI antes de publicar).
//  - Todos os temas presentes com o seletor correto.
//  - Contrato shadcn completo em cada tema.
//  - Nenhuma referência quebrada (todo var() resolve a um valor literal).
//  - Contraste WCAG dos pares fg/bg (AA = 4.5). Falha o build em pares críticos.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse, wcagContrast } from 'culori';

const DIST = join(process.cwd(), 'dist');
const TOKENS_CSS = join(DIST, 'tokens.css');

const EXPECTED_SELECTORS = {
  'CRP-Light (:root)': ':root',
  'CRP-Dark': '.dark',
  'MarcaB-Light': '[data-brand="marca-b"]',
  'MarcaB-Dark': '[data-brand="marca-b"].dark',
};

// Contrato shadcn que deve existir em TODO tema.
const REQUIRED = [
  'background','foreground','card','card-foreground','popover','popover-foreground',
  'primary','primary-foreground','secondary','secondary-foreground','muted','muted-foreground',
  'accent','accent-foreground','destructive','destructive-foreground','border','input','ring',
  'radius','chart-1','chart-2','chart-3','chart-4','chart-5',
  'sidebar','sidebar-foreground','sidebar-primary','sidebar-primary-foreground',
  'sidebar-accent','sidebar-accent-foreground','sidebar-border','sidebar-ring',
];

// Pares (foreground, background) a checar. fatal=true reprova o build.
const PAIRS = [
  ['foreground','background', true],
  ['primary-foreground','primary', true],
  ['card-foreground','card', false],
  ['popover-foreground','popover', false],
  ['secondary-foreground','secondary', false],
  ['accent-foreground','accent', false],
  ['destructive-foreground','destructive', false],
  ['muted-foreground','background', false],
  ['sidebar-foreground','sidebar', false],
];
const AA = 4.5;

const errors = [];
const warnings = [];

if (!existsSync(TOKENS_CSS)) { console.error('❌ dist/tokens.css não existe. Rode `npm run build`.'); process.exit(1); }
const css = readFileSync(TOKENS_CSS, 'utf8');

// Parse de blocos: { selector -> { name -> value } }
function parseBlocks(text) {
  const blocks = [];
  const re = /([^{}\/]+)\{([^}]*)\}/g; // seletor { ...decls... }
  for (const m of text.matchAll(re)) {
    const selector = m[1].trim().split('\n').pop().trim();
    const decls = {};
    for (const d of m[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) decls[d[1]] = d[2].trim();
    if (Object.keys(decls).length) blocks.push({ selector, decls });
  }
  return blocks;
}

const blocks = parseBlocks(css);
const bySelector = {};
for (const b of blocks) (bySelector[b.selector] ||= {}), Object.assign(bySelector[b.selector], b.decls);

const rootMap = bySelector[':root'] || {};

function resolve(value, scope, depth = 0) {
  if (depth > 10 || !value) return value;
  const m = value.match(/^var\((--[\w-]+)\)$/);
  if (!m) return value;
  const next = scope[m[1]] ?? rootMap[m[1]];
  return resolve(next, scope, depth + 1);
}

// 1) Seletores presentes
for (const [label, sel] of Object.entries(EXPECTED_SELECTORS)) {
  if (!bySelector[sel]) errors.push(`Seletor ausente: ${label} (${sel})`);
}

// 2) Contrato completo + 3) refs resolvem + 4) contraste, por tema
for (const [label, sel] of Object.entries(EXPECTED_SELECTORS)) {
  const scope = bySelector[sel];
  if (!scope) continue;
  for (const name of REQUIRED) {
    if (!(`--${name}` in scope)) errors.push(`[${label}] contrato faltando: --${name}`);
  }
  // refs quebradas
  for (const [k, v] of Object.entries(scope)) {
    const r = resolve(v, scope);
    if (typeof r === 'string' && r.startsWith('var(')) errors.push(`[${label}] referência não resolvida: ${k} -> ${v}`);
  }
  // contraste
  for (const [fg, bg, fatal] of PAIRS) {
    const fgv = resolve(scope[`--${fg}`], scope);
    const bgv = resolve(scope[`--${bg}`], scope);
    const ca = parse(fgv), cb = parse(bgv);
    if (!ca || !cb) { warnings.push(`[${label}] não consegui parsear cor p/ ${fg}/${bg} (${fgv} / ${bgv})`); continue; }
    const ratio = wcagContrast(ca, cb);
    const ok = ratio >= AA;
    const msg = `[${label}] ${fg}/${bg} = ${ratio.toFixed(2)}:1 ${ok ? 'OK' : '< ' + AA}`;
    if (!ok && fatal) errors.push('CONTRASTE ' + msg);
    else if (!ok) warnings.push('contraste ' + msg);
  }
}

console.log(`\nVerificação do Design System (${blocks.length} blocos, ${Object.keys(rootMap).length} declarações em :root)`);
if (warnings.length) { console.log('\n⚠ Avisos:'); warnings.forEach((w) => console.log('  - ' + w)); }
if (errors.length) {
  console.log('\n❌ Erros:'); errors.forEach((e) => console.log('  - ' + e));
  process.exit(1);
}
console.log('\n✅ check OK — contrato completo, refs resolvidas, contraste crítico AA.');
