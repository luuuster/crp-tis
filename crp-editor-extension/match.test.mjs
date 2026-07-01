// Testa a lógica pura de casamento da extensão (lib/match.js) — lê o arquivo e avalia num escopo
// isolado (mesmo padrão dos testes do figma-plugin: o arquivo é script de runtime, não módulo ESM).
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const code = readFileSync(join(here, 'lib', 'match.js'), 'utf8');
const g = {};
new Function('globalThis', code)(g);
const M = g.CRPMatch;

const COLORS = { primary: '#045dce', foreground: '#0a0a0a', muted: '#f5f5f5', destructive: '#e7000b' };
const RADII = { sm: 4, md: 6, base: 10, lg: 8, full: 9999 };
const TYPO = { h1: { sizePx: 48, weight: 700 }, h2: { sizePx: 36, weight: 700 }, body: { sizePx: 16, weight: 400 }, 'label-sm': { sizePx: 14, weight: 500 } };

describe('cor', () => {
  it('idêntica → distância 0', () => assert.equal(M.colorDist('#045dce', '#045dce'), 0));
  it('nearestColor exato bate o token', () => {
    const r = M.nearestColor('#045dce', COLORS);
    assert.equal(r.name, 'primary');
    assert.equal(r.exact, true);
  });
  it('cor crua perto do primary → sugere primary, NÃO exato', () => {
    const r = M.nearestColor('#3b82f6', COLORS); // blue-500: azul distinto do #045dce
    assert.equal(r.name, 'primary');
    assert.equal(r.exact, false);
  });
  it('distância maior p/ cores bem diferentes', () => {
    assert.ok(M.colorDist('#045dce', '#e7000b') > M.colorDist('#045dce', '#3b82f6'));
  });
});

describe('raio', () => {
  it('10px → base exato', () => {
    const r = M.nearestRadius(10, RADII);
    assert.equal(r.name, 'base');
    assert.equal(r.exact, true);
  });
  it('11px → base, não exato', () => {
    const r = M.nearestRadius(11, RADII);
    assert.equal(r.name, 'base');
    assert.equal(r.exact, false);
  });
  it('5px → empata perto de sm(4)/md(6); pega o mais próximo', () => {
    assert.ok(['sm', 'md'].includes(M.nearestRadius(5, RADII).name));
  });
  it('raio gigante (rounded-full ≈ 33554400px) → full EXATO, não desvio', () => {
    const r = M.nearestRadius(33554400, RADII);
    assert.equal(r.name, 'full');
    assert.equal(r.exact, true);
  });
});

describe('tipografia', () => {
  it('16px/400 → body exato', () => {
    const r = M.nearestType(16, 400, TYPO);
    assert.equal(r.role, 'body');
    assert.equal(r.exact, true);
  });
  it('15px → body (mais próximo que label-sm 14)', () => {
    assert.equal(M.nearestType(15, 400, TYPO).role, 'body');
  });
  it('37px → h2', () => assert.equal(M.nearestType(37, 700, TYPO).role, 'h2'));
});

describe('redline', () => {
  const changes = [
    { selector: 'button.cta', kind: 'cor', prop: 'color', from: '#3b82f6', to: '#045dce', token: 'var(--primary)' },
    { selector: 'button.cta', kind: 'raio', prop: 'border-radius', from: '6px', to: '10px', token: 'var(--radius)' },
    { selector: 'h1.title', kind: 'tipografia', prop: 'tipografia', from: '40px', to: 'h2', token: 'ty-h2' },
  ];
  it('gera Markdown agrupado por elemento com nomes de token', () => {
    const { markdown } = M.buildRedline(changes, { url: 'http://x' });
    assert.match(markdown, /button\.cta/);
    assert.match(markdown, /var\(--primary\)/);
    assert.match(markdown, /ty-h2/);
    assert.match(markdown, /h1\.title/);
  });
  it('gera bloco p/ IA mencionando tokens e instrução', () => {
    const { ai } = M.buildRedline(changes);
    assert.match(ai, /tokens do CRP/);
    assert.match(ai, /var\(--primary\)/);
  });
  it('vazio → mensagem clara', () => {
    assert.match(M.buildRedline([]).markdown, /Nenhuma altera/);
  });
  it('com localização da fiber: componente + origem + identidade', () => {
    const c = [{ components: ['Stepper', 'JobGenerator'], source: 'pages/JobGenerator.tsx:759', tag: 'button',
      text: 'Resumo da Vaga', selector: 'button.flex.w-full', kind: 'raio', prop: 'border-radius',
      from: '4px', to: '12px', token: 'var(--radius-xl)' }];
    const { markdown, ai } = M.buildRedline(c);
    assert.match(markdown, /<Stepper> › <JobGenerator>/);
    assert.match(markdown, /JobGenerator\.tsx:759/);
    assert.match(ai, /COMPONENTE: <Stepper> › <JobGenerator>/);
    assert.match(ai, /ONDE: pages\/JobGenerator\.tsx:759/);
    assert.match(ai, /var\(--radius-xl\)/);
  });
});
