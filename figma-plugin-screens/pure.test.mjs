// Testes da LÓGICA PURA do plugin CRP DS — Screens (sem Figma; padrão do repo).
import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(DIR, '..');
// extrai as funções PURAS do code.js (mesmo harness dos outros plugins do repo).
const src = readFileSync(join(DIR, 'code.js'), 'utf8');
const grab = (re, name) => { const m = src.match(re); if (!m) throw new Error('não achei ' + name); return m[0]; };
const F = new Function([
  grab(/function variantNodeName\([\s\S]*?\n\}/, 'variantNodeName'),
  grab(/function axesOrderFromName\([\s\S]*?\n\}/, 'axesOrderFromName'),
  grab(/function missingDeps\([\s\S]*?\n\}/, 'missingDeps'),
  grab(/function screensDeps\([\s\S]*?\n\}/, 'screensDeps'),
  'return { variantNodeName, axesOrderFromName, missingDeps, screensDeps };',
].join('\n'))();

if (!existsSync(join(ROOT, 'figma-plugin', 'figma-variables.json')))
  throw new Error('figma-variables.json ausente — rode `npm run export:figma` antes do teste.');
// specs REAIS gerados pelo build (garante que teste e artefato não divergem)
execSync('node build/export-components.mjs', { cwd: ROOT, stdio: 'pipe' });
execSync('node build/export-screens.mjs', { cwd: ROOT, stdio: 'pipe' });
const SCREENS = JSON.parse(readFileSync(join(DIR, 'figma-screens.json'), 'utf8'));
const SPEC = JSON.parse(readFileSync(join(ROOT, 'figma-plugin-components', 'figma-components.json'), 'utf8'));
const FV = JSON.parse(readFileSync(join(ROOT, 'figma-plugin', 'figma-variables.json'), 'utf8'));

const HAVE_VARS = new Set(FV.collections.flatMap((c) => c.variables.map((v) => c.name + '::' + v.name)));
const HAVE_STYLES = new Set(FV.styles.text.map((s) => s.name));

test('variantNodeName: nome estável a partir de props + ordem de eixos', () => {
  assert.equal(F.variantNodeName({ size: 'sm', variant: 'default' }, ['variant', 'size']), 'variant=default, size=sm');
  assert.equal(F.variantNodeName({ state: 'invalid' }, ['state']), 'state=invalid');
});

test('axesOrderFromName: recupera a ordem dos eixos a partir do nome do filho do set', () => {
  assert.deepEqual(F.axesOrderFromName('variant=default, size=default'), ['variant', 'size']);
  assert.deepEqual(F.axesOrderFromName('state=default'), ['state']);
  assert.deepEqual(F.axesOrderFromName(''), []);
  // ida-e-volta: derivar a ordem do nome e reconstruir o nome dá o mesmo string
  const name = F.variantNodeName({ variant: 'outline', size: 'lg' }, ['variant', 'size']);
  assert.equal(F.variantNodeName({ variant: 'outline', size: 'lg' }, F.axesOrderFromName(name)), name);
});

test('spec real de telas: schema e ao menos a tela de Login', () => {
  assert.equal(SCREENS.$schema, 'crp-screens-figma/1');
  assert.ok(Array.isArray(SCREENS.screens) && SCREENS.screens.length >= 1);
  assert.ok(SCREENS.screens.some((s) => s.name === 'Login'));
});

test('screensDeps: deps das telas existem e toda instância referencia variante do spec de componentes', () => {
  const deps = F.screensDeps(SCREENS);
  assert.deepEqual(F.missingDeps({ vars: deps.vars, styles: deps.styles }, HAVE_VARS, HAVE_STYLES), []);
  const variantKeys = new Set();
  for (const c of SPEC.components) for (const v of c.variants) variantKeys.add(c.name + '::' + JSON.stringify(Object.fromEntries(c.axesOrder.map((k) => [k, v.props[k]]))));
  for (const k of deps.variants) assert.ok(variantKeys.has(k), 'instância sem variante: ' + k);
});

test('missingDeps: acusa Variable e TextStyle ausentes', () => {
  const miss = F.missingDeps({ vars: ['CRP/Modes::nao-existe'], styles: ['Label/Fantasma'] }, HAVE_VARS, HAVE_STYLES);
  assert.equal(miss.length, 2);
  assert.match(miss[0], /Variable CRP\/Modes::nao-existe/);
  assert.match(miss[1], /TextStyle Label\/Fantasma/);
});
