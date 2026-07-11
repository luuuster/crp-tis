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
execSync('node build/export-components.mjs', { cwd: join(DIR, '..', '..'), stdio: 'pipe' });
const SPEC = JSON.parse(readFileSync(join(DIR, 'figma-components.json'), 'utf8'));
const FV = JSON.parse(readFileSync(join(DIR, '..', 'figma-plugin', 'figma-variables.json'), 'utf8'));

const HAVE_VARS = new Set(FV.collections.flatMap((c) => c.variables.map((v) => c.name + '::' + v.name)));
const HAVE_STYLES = new Set(FV.styles.text.map((s) => s.name));
const BTN = () => SPEC.components.find((c) => c.name === 'Button');

test('variantNodeName: nome estável a partir de props + ordem de eixos', () => {
  assert.equal(F.variantNodeName({ size: 'sm', variant: 'default' }, ['variant', 'size']), 'variant=default, size=sm');
  assert.equal(F.variantNodeName({ state: 'invalid' }, ['state']), 'state=invalid');
});

test('spec real (fonte shadcn): Button cartesiano 10×8×4 = 320 + Input 2', () => {
  assert.deepEqual(F.validateComponentsSpec(SPEC), []);
  assert.equal(SPEC.source, 'shadcn (app/src/components/ui)');
  const btn = BTN();
  assert.deepEqual(btn.axesOrder, ['variant', 'size', 'state']);
  // 10 variantes = as 10 do cva de button.tsx
  assert.deepEqual([...new Set(btn.variants.map((v) => v.props.variant))].sort(),
    ['default', 'destructive', 'destructive-outline', 'ghost', 'link', 'outline', 'primary-soft', 'secondary', 'secondary-soft', 'warning']);
  // 8 tamanhos = 4 com texto (default/xs/sm/lg) + 4 só-ícone (icon/icon-xs/icon-sm/icon-lg)
  assert.deepEqual([...new Set(btn.variants.map((v) => v.props.size))].sort(),
    ['default', 'icon', 'icon-lg', 'icon-sm', 'icon-xs', 'lg', 'sm', 'xs']);
  // 4 estados REAIS do cva (sem active — não existe no cva; sem loading — é a booleana Loading)
  assert.deepEqual([...new Set(btn.variants.map((v) => v.props.state))].sort(),
    ['default', 'disabled', 'focus', 'hover']);
  // matriz CARTESIANA completa 10×8×4
  assert.equal(btn.variants.length, 320);
  // toda combinação variant×size tem exatamente os 4 estados
  const dd = btn.variants.filter((v) => v.props.variant === 'default' && v.props.size === 'default');
  assert.equal(dd.length, 4);
  const input = SPEC.components.find((c) => c.name === 'Input');
  assert.equal(input.variants.length, 2); // default + invalid
});

test('só-ícone: quadrado, sem texto, ícone cresce (12/16/20/24); com texto: rótulo 14px (xs 12px)', () => {
  const btn = BTN();
  const iconOnly = btn.variants.filter((v) => v.layout.iconOnly);
  assert.equal(iconOnly.length, 160); // 4 tamanhos só-ícone × 10 variants × 4 estados
  for (const v of iconOnly) {
    assert.equal(v.text, null);                         // sem rótulo
    assert.ok(v.iconColor && v.iconColor.name);         // ícone colorido (currentColor)
    assert.ok(v.layout.square && v.layout.square.name); // caixa QUADRADA
  }
  // o ícone CRESCE com a caixa (fallbackPx.icon por tamanho só-ícone) — espelha size-3/4/5/6 do cva
  const iconPx = (size) => btn.variants.find((v) => v.props.size === size).layout.fallbackPx.icon;
  assert.equal(iconPx('icon-xs'), 12);
  assert.equal(iconPx('icon-sm'), 16);
  assert.equal(iconPx('icon'), 20);
  assert.equal(iconPx('icon-lg'), 24);
  // botão COM texto: rótulo 14px (Label/Small) em sm/md/lg; 12px (Label/XSmall) no xs.
  // (corrige o antigo Label/Base = 16px, que divergia do text-sm = 14px do cva — web manda.)
  const style = (size) => btn.variants.find((v) => v.props.size === size && !v.layout.iconOnly).text.styleName;
  assert.equal(style('default'), 'Label/Small');
  assert.equal(style('lg'), 'Label/Small');
  assert.equal(style('sm'), 'Label/Small');
  assert.equal(style('xs'), 'Label/XSmall');
});

test('estados: hover = cor de estado + surface; focus = anel ring/50; disabled = opacidade (sem active/loading)', () => {
  const btn = BTN();
  const g = (variant, state) => btn.variants.find((v) => v.props.variant === variant && v.props.size === 'default' && v.props.state === state);
  assert.ok(!btn.variants.some((v) => v.veil));    // véu eliminado
  assert.ok(!btn.variants.some((v) => v.spinner)); // loading NÃO é estado (é a booleana Loading — render é TODO do plugin)
  // default/secondary/destructive hover: cada um sua cor de estado (alpha embutido na Variable) + background por baixo
  assert.equal(g('default', 'hover').fill.var.name, 'primary-90');
  assert.deepEqual(g('default', 'hover').surface, { coll: 'CRP/Modes', name: 'background' });
  assert.equal(g('default', 'default').surface, null); // repouso opaco, sem surface
  assert.equal(g('secondary', 'hover').fill.var.name, 'secondary-80');
  assert.equal(g('destructive', 'hover').fill.var.name, 'destructive-90');
  // outline/ghost: hover troca fill p/ accent (100%) E texto/ícone p/ accent-foreground — sem surface
  assert.equal(g('outline', 'hover').fill.var.name, 'accent');
  assert.equal(g('outline', 'hover').text.fillVar.name, 'accent-foreground');
  assert.equal(g('outline', 'hover').iconColor.name, 'accent-foreground');
  assert.equal(g('outline', 'hover').surface, null);
  assert.equal(g('ghost', 'hover').fill.var.name, 'accent');
  // focus = anel ring/50 (CRP/Modes); disabled = opacity-disabled
  assert.equal(g('default', 'focus').ring.colorVar.coll, 'CRP/Modes');
  assert.equal(g('default', 'focus').ring.colorVar.name, 'ring-50');
  assert.equal(g('default', 'disabled').alpha.var.name, 'opacity-disabled');
});

test('4 variantes de marca fiéis ao button.tsx: warning / destructive-outline / soft', () => {
  const btn = BTN();
  const base = (variant) => btn.variants.find((v) => v.props.variant === variant && v.props.size === 'default' && v.props.state === 'default');
  const hov = (variant) => btn.variants.find((v) => v.props.variant === variant && v.props.size === 'default' && v.props.state === 'hover');
  // warning: bg-warning / text-warning-foreground · hover:bg-warning/90
  assert.equal(base('warning').fill.var.name, 'warning');
  assert.equal(base('warning').text.fillVar.name, 'warning-foreground');
  assert.equal(hov('warning').fill.var.name, 'warning-90');
  // destructive-outline: border+text destructive-text, bg-background, shadow-xs · hover:bg-destructive/10
  assert.equal(base('destructive-outline').stroke.var.name, 'destructive-text');
  assert.equal(base('destructive-outline').text.fillVar.name, 'destructive-text');
  assert.equal(base('destructive-outline').fill.var.name, 'background');
  assert.equal(base('destructive-outline').shadow, true);
  assert.equal(hov('destructive-outline').fill.var.name, 'destructive-10');
  // primary-soft: bg-primary/10 (+ surface) text-primary-text · hover:bg-primary/15
  assert.equal(base('primary-soft').fill.var.name, 'primary-10');
  assert.deepEqual(base('primary-soft').surface, { coll: 'CRP/Modes', name: 'background' });
  assert.equal(base('primary-soft').text.fillVar.name, 'primary-text');
  assert.equal(hov('primary-soft').fill.var.name, 'primary-15');
  // secondary-soft: idem com a cor secundária
  assert.equal(base('secondary-soft').fill.var.name, 'secondary-10');
  assert.equal(base('secondary-soft').text.fillVar.name, 'secondary-text');
  assert.equal(hov('secondary-soft').fill.var.name, 'secondary-15');
});

test('link: só texto, underline no hover, sem fill; presente em todos os tamanhos e estados', () => {
  const links = BTN().variants.filter((v) => v.props.variant === 'link');
  assert.equal(links.length, 32); // 8 sizes × 4 states (cartesiano completo)
  for (const l of links) {
    assert.equal(l.fill, null);
    assert.deepEqual(l.layout.radius, { coll: 'CRP/Base', name: 'radius-md' }); // link tb arredonda (anel de foco redondo)
    if (!l.layout.iconOnly) {
      assert.equal(l.text.fillVar.name, 'link');
      assert.equal(l.text.underline, l.props.state === 'hover'); // underline só no hover (fiel ao shadcn)
    }
  }
});

test('mapa shadcn→Variables: destructive usa color/white; outline usa border+background+shadow', () => {
  const btn = BTN();
  const find = (variant) => btn.variants.find((v) => v.props.variant === variant && v.props.size === 'default' && v.props.state === 'default');
  const d = find('destructive');
  assert.equal(d.fill.var.name, 'destructive');
  assert.deepEqual(d.text.fillVar, { coll: 'CRP/Primitives', name: 'color/white' });
  const o = find('outline');
  assert.equal(o.stroke.var.name, 'border');
  assert.equal(o.fill.var.name, 'background');
  // shadow-xs: SÓ outline e destructive-outline têm (fiel ao shadcn base); as outras não
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
