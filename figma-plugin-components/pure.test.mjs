// Testes da LÓGICA PURA do plugin CRP DS — Components (sem Figma; padrão do repo).
import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
// extrai as funções PURAS do code.js (repo é ESM; o code.js do plugin é script Figma) —
// mesmo harness dos outros plugins do repo.
const src = readFileSync(join(DIR, 'code.js'), 'utf8');
const grab = (re, name) => { const m = src.match(re); if (!m) throw new Error('não achei ' + name); return m[0]; };
const F = new Function([
  grab(/function variantNodeName\([\s\S]*?\n\}/, 'variantNodeName'),
  grab(/function validateComponentsSpec\([\s\S]*?\n\}/, 'validateComponentsSpec'),
  grab(/function planDeps\([\s\S]*?\n\}/, 'planDeps'),
  grab(/function missingDeps\([\s\S]*?\n\}/, 'missingDeps'),
  'return { variantNodeName, validateComponentsSpec, planDeps, missingDeps };',
].join('\n'))();

if (!existsSync(join(DIR, '..', 'figma-plugin', 'figma-variables.json')))
  throw new Error('figma-variables.json ausente — rode `npm run export:figma` antes do teste.');
// spec REAL gerado pelo build (garante que teste e artefato não divergem)
execSync('node build/export-components.mjs', { cwd: join(DIR, '..'), stdio: 'pipe' });
const SPEC = JSON.parse(readFileSync(join(DIR, 'figma-components.json'), 'utf8'));
const FV = JSON.parse(readFileSync(join(DIR, '..', 'figma-plugin', 'figma-variables.json'), 'utf8'));

const HAVE_VARS = new Set(FV.collections.flatMap((c) => c.variables.map((v) => c.name + '::' + v.name)));
const HAVE_STYLES = new Set(FV.styles.text.map((s) => s.name));

test('variantNodeName: nome estável a partir de props + ordem de eixos', () => {
  assert.equal(F.variantNodeName({ size: 'sm', variant: 'default' }, ['variant', 'size']), 'variant=default, size=sm');
  assert.equal(F.variantNodeName({ state: 'invalid' }, ['state']), 'state=invalid');
});

test('spec real (fonte shadcn): Button completo (variant×size×state) e Input 2', () => {
  assert.deepEqual(F.validateComponentsSpec(SPEC), []);
  assert.equal(SPEC.source, 'shadcn (app/src/components/ui)');
  const btn = SPEC.components.find((c) => c.name === 'Button');
  assert.deepEqual(btn.axesOrder, ['variant', 'size', 'state']);
  // 6 estados completos (default/hover/active/focus/disabled/loading)
  const states = new Set(btn.variants.map((v) => v.props.state));
  assert.deepEqual([...states].sort(), ['active', 'default', 'disabled', 'focus', 'hover', 'loading']);
  // size é só tamanho (sm/default/lg) — icon-only saiu do eixo
  assert.deepEqual([...new Set(btn.variants.map((v) => v.props.size))].sort(), ['default', 'lg', 'sm']);
  // matriz: 5 variants (não-link) × 3 sizes × 6 estados + link (3 sizes × 4 estados) = 102
  assert.equal(btn.variants.length, 102);
  // default/default tem os 6 estados
  const dd = btn.variants.filter((v) => v.props.variant === 'default' && v.props.size === 'default');
  assert.equal(dd.length, 6);
  // todo Button tem texto (não há mais icon-only)
  assert.ok(btn.variants.every((v) => v.text && v.text.fillVar));
  const input = SPEC.components.find((c) => c.name === 'Input');
  assert.equal(input.variants.length, 2); // default + invalid
});

test('hover = COR DE ESTADO (CRP/States, alpha embutido) + SURFACE por baixo; focus = anel ring/50', () => {
  const btn = SPEC.components.find((c) => c.name === 'Button');
  assert.ok(!btn.variants.some((v) => v.veil)); // véu eliminado
  const g = (variant, state) => btn.variants.find((v) => v.props.variant === variant && v.props.size === 'default' && v.props.state === state);
  // default hover: binda CRP/Modes::primary-90 (a Variable já carrega o alpha do /90) + background por baixo
  assert.equal(g('default', 'hover').fill.var.coll, 'CRP/Modes');
  assert.equal(g('default', 'hover').fill.var.name, 'primary-90');
  assert.deepEqual(g('default', 'hover').surface, { coll: 'CRP/Modes', name: 'background' });
  assert.equal(g('default', 'default').surface, null); // estado normal é opaco, sem surface
  // secondary/destructive hover idem — cada um sua cor de estado própria (tradução do /80, /90)
  assert.equal(g('secondary', 'hover').fill.var.name, 'secondary-80');
  assert.equal(g('destructive', 'hover').fill.var.name, 'destructive-90');
  // active = cor de estado MAIS FORTE (também Variable, não opacity solta): /80, /70
  assert.equal(g('default', 'active').fill.var.name, 'primary-80');
  assert.equal(g('secondary', 'active').fill.var.name, 'secondary-70');
  assert.equal(g('destructive', 'active').fill.var.name, 'destructive-80');
  // outline/ghost: hover troca fill p/ accent (100%) E texto p/ accent-foreground — sem surface
  assert.equal(g('outline', 'hover').fill.var.name, 'accent');
  assert.equal(g('outline', 'hover').text.fillVar.name, 'accent-foreground');
  assert.equal(g('outline', 'hover').surface, null);
  assert.equal(g('ghost', 'hover').fill.var.name, 'accent');
  // gap #2 corrigido: o ÍCONE acompanha a cor do texto no estado (outline hover → accent-foreground)
  assert.equal(g('outline', 'hover').iconColor.name, 'accent-foreground');
  assert.equal(g('default', 'hover').iconColor.name, 'primary-foreground');
  // focus = anel ring/50 (CRP/Modes); disabled = opacidade; loading = spinner
  assert.equal(g('default', 'focus').ring.colorVar.coll, 'CRP/Modes');
  assert.equal(g('default', 'focus').ring.colorVar.name, 'ring-50');
  assert.equal(g('default', 'disabled').alpha.var.name, 'opacity-disabled');
  assert.equal(g('default', 'loading').spinner, true);
});

test('recorte do link: só texto, underline no hover, sem fill/active/loading (mas COM radius p/ o anel de foco)', () => {
  const links = SPEC.components.find((c) => c.name === 'Button').variants.filter((v) => v.props.variant === 'link');
  assert.equal(links.length, 12); // 3 tamanhos × 4 estados (default/hover/focus/disabled)
  assert.deepEqual([...new Set(links.map((l) => l.props.state))].sort(), ['default', 'disabled', 'focus', 'hover']);
  for (const l of links) {
    assert.equal(l.text.fillVar.name, 'link');
    assert.equal(l.fill, null);
    assert.deepEqual(l.layout.radius, { coll: 'CRP/Base', name: 'radius-md' }); // link tb arredonda (anel de foco redondo)
    assert.equal(l.text.underline, l.props.state === 'hover'); // underline só no hover (fiel ao shadcn)
  }
});

test('mapa shadcn→Variables: destructive usa text-white; outline usa border+background', () => {
  const btn = SPEC.components.find((c) => c.name === 'Button');
  const find = (variant) => btn.variants.find((v) => v.props.variant === variant && v.props.size === 'default' && v.props.state === 'default');
  const d = find('destructive');
  assert.equal(d.fill.var.name, 'destructive');
  assert.deepEqual(d.text.fillVar, { coll: 'CRP/Primitives', name: 'color/white' });
  const o = find('outline');
  assert.equal(o.stroke.var.name, 'border');
  assert.equal(o.fill.var.name, 'background');
  // shadow-xs: SÓ o outline tem (fiel ao shadcn base); as outras não
  assert.equal(o.shadow, true);
  assert.equal(find('default').shadow, false);
  assert.equal(find('secondary').shadow, false);
});

test('Input espelha input.tsx: borda input/destructive, altura do token de controle', () => {
  const input = SPEC.components.find((c) => c.name === 'Input');
  const def = input.variants.find((v) => v.props.state === 'default');
  assert.equal(def.stroke.var.name, 'input');
  assert.deepEqual(def.layout.minHeight, { coll: 'CRP/Components', name: 'button/height/md' });
  const inv = input.variants.find((v) => v.props.state === 'invalid');
  assert.equal(inv.stroke.var.name, 'destructive');
});

test('planDeps: todas as deps existem no export de Variables (contrato por nome)', () => {
  assert.deepEqual(F.missingDeps(F.planDeps(SPEC), HAVE_VARS, HAVE_STYLES), []);
});

test('missingDeps: acusa Variable e TextStyle ausentes', () => {
  const miss = F.missingDeps({ vars: ['CRP/Modes::nao-existe'], styles: ['Label/Fantasma'] }, HAVE_VARS, HAVE_STYLES);
  assert.equal(miss.length, 2);
  assert.match(miss[0], /Variable CRP\/Modes::nao-existe/);
  assert.match(miss[1], /TextStyle Label\/Fantasma/);
});

test('fallbackPx: todo layout tem número concreto (resiliência se o bind falhar)', () => {
  for (const c of SPEC.components) for (const v of c.variants) {
    const fb = v.layout.fallbackPx;
    for (const k of ['paddingX', 'minHeight', 'gap', 'radius']) assert.equal(typeof fb[k], 'number', `${c.name} ${F.variantNodeName(v.props, c.axesOrder)}.${k}`);
  }
});
