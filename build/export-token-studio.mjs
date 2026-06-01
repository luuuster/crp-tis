// Export: tokens/ (multi-file) -> bundle SINGLE-FILE do Token Studio (para "Load from JSON").
// Lê tokens/, VALIDA compatibilidade e grava dist/token-studio/tokens.json.
// Read-only sobre tokens/ (a fonte): NÃO edita nada em tokens/. O bundle é GERADO.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const TOKENS = join(ROOT, 'tokens');
// Fora de dist/ de propósito: `npm run build` faz rm em dist/ e apagaria o bundle.
const OUT_DIR = join(ROOT, 'token-studio');
const OUT = join(OUT_DIR, 'tokens.json');

// $type aceitos pelo Token Studio (DTCG + legados). Fora disso → aviso.
const SUPPORTED_TYPES = new Set([
  'color', 'dimension', 'fontFamily', 'fontWeight', 'number', 'string', 'boolean',
  'typography', 'shadow', 'border', 'cubicBezier', 'duration', 'strokeStyle', 'gradient',
  'spacing', 'sizing', 'borderRadius', 'borderWidth', 'opacity', 'fontSizes', 'lineHeights',
  'letterSpacing', 'paragraphSpacing', 'textCase', 'textDecoration', 'boxShadow',
  'fontFamilies', 'fontWeights', 'asset', 'other',
]);

const errors = [];
const warnings = [];
const rel = (p) => p.replace(ROOT + '\\', '').replace(ROOT + '/', '').replaceAll('\\', '/');

const metadata = JSON.parse(readFileSync(join(TOKENS, '$metadata.json'), 'utf8'));
const themes = JSON.parse(readFileSync(join(TOKENS, '$themes.json'), 'utf8'));
const order = metadata.tokenSetOrder || [];

// --- 1) Carrega os sets na ordem do $metadata e achata p/ resolução de referências ---
const bundle = {};
const flat = new Map(); // dotpath -> token
const types = new Set();
let tokenCount = 0;

function walk(node, prefix) {
  if (!node || typeof node !== 'object') return;
  if (typeof node.$type === 'string') types.add(node.$type);
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('$')) continue;
    if (v && typeof v === 'object' && '$value' in v) {
      flat.set([...prefix, k].join('.'), v);
      tokenCount++;
      if (typeof v.$type === 'string') types.add(v.$type);
    } else {
      walk(v, [...prefix, k]);
    }
  }
}

for (const set of order) {
  const file = join(TOKENS, `${set}.json`);
  if (!existsSync(file)) { errors.push(`Set "${set}" está em $metadata mas tokens/${set}.json não existe.`); continue; }
  const content = JSON.parse(readFileSync(file, 'utf8'));
  bundle[set] = content;
  walk(content, []);
}

// --- 2) Validações ---
// 2a) themes só citam sets que existem na ordem
for (const t of themes) {
  for (const s of Object.keys(t.selectedTokenSets || {})) {
    if (!order.includes(s)) errors.push(`Theme "${t.name}" usa o set "${s}", ausente de $metadata.tokenSetOrder.`);
  }
}

// 2b) arquivos de set no disco fora da ordem (ex.: components/button) → aviso
function listSets(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listSets(full));
    else if (name.endsWith('.json')) {
      const r = rel(full).slice('tokens/'.length).replace(/\.json$/, '');
      if (r !== '$metadata' && r !== '$themes') out.push(r);
    }
  }
  return out;
}
for (const s of listSets(TOKENS)) {
  if (!order.includes(s)) warnings.push(`Set "tokens/${s}.json" não está em $metadata.tokenSetOrder — não entra no bundle.`);
}

// 2c) toda referência {...} resolve contra o mapa global
for (const [path, tok] of flat) {
  if (typeof tok.$value !== 'string') continue;
  for (const m of tok.$value.matchAll(/\{([^}]+)\}/g)) {
    const target = m[1].trim();
    if (!flat.has(target)) errors.push(`Referência não resolvida em "${path}": {${target}} não existe.`);
  }
}

// 2d) $type suportado
for (const t of types) if (!SUPPORTED_TYPES.has(t)) warnings.push(`$type "${t}" pode não ser suportado pelo Token Studio.`);

// --- 3) Monta o single-file e grava ---
const single = { ...bundle, $themes: themes, $metadata: metadata };
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, JSON.stringify(single, null, 2) + '\n');

// --- 4) Resumo ---
console.log(`Export Token Studio → ${rel(OUT)}`);
console.log(`  sets: ${order.length} | tokens: ${tokenCount} | themes: ${themes.length} | tipos: ${[...types].sort().join(', ')}`);
if (warnings.length) { console.log('\n⚠ Avisos:'); warnings.forEach((w) => console.log('  - ' + w)); }
if (errors.length) { console.log('\n❌ Erros:'); errors.forEach((e) => console.log('  - ' + e)); process.exit(1); }
console.log('\n✅ export OK — bundle pronto para "Load from JSON" no Token Studio (ative "Use DTCG format").');
