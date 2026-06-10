// Contrato de build/lib/css.mjs — parsing do CSS gerado, resolução de var() e composição de cor.
// Compartilhado por check.mjs e audit-dark.mjs; divergência silenciosa entre cópias era o risco
// que motivou o módulo. Estes testes fixam o comportamento.
import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { parseBlocks, scopesOf, makeResolve, contrast, tintOver, mixOklch } from './css.mjs';

describe('parseBlocks', () => {
  it('extrai seletor + declarações --token', () => {
    const b = parseBlocks(':root { --a: 1; --b: 2px; }');
    assert.equal(b.length, 1);
    assert.equal(b[0].selector, ':root');
    assert.deepEqual(b[0].decls, { '--a': '1', '--b': '2px' });
  });
  it('lê múltiplos blocos e ignora os sem declarações', () => {
    const b = parseBlocks('.dark { --c: red; } .empty { }');
    assert.equal(b.length, 1);
    assert.equal(b[0].selector, '.dark');
  });
  it('seletor multilinha → usa a última linha', () => {
    const b = parseBlocks('/* comentário */\n:root { --a: 1; }');
    assert.equal(b[0].selector, ':root');
  });
});

describe('scopesOf', () => {
  it('mescla blocos repetidos do mesmo seletor (o último vence)', () => {
    const s = scopesOf(':root { --a: 1; } :root { --a: 2; --b: 3; }');
    assert.deepEqual(s[':root'], { '--a': '2', '--b': '3' });
  });
});

describe('makeResolve', () => {
  it('resolve var() do escopo, com fallback p/ :root', () => {
    const resolve = makeResolve({ '--a': 'red', '--b': 'var(--a)' });
    assert.equal(resolve('var(--a)', {}), 'red');         // veio do root
    assert.equal(resolve('var(--b)', {}), 'red');         // cadeia --b → --a → red
    assert.equal(resolve('var(--a)', { '--a': 'blue' }), 'blue'); // escopo sobrepõe root
  });
  it('valor literal passa intacto; var() inexistente → undefined', () => {
    const resolve = makeResolve({});
    assert.equal(resolve('10px', {}), '10px');
    assert.equal(resolve('var(--nope)', {}), undefined);
  });
  it('ciclo/profundidade >10 não trava: retorna var() e AVISA', () => {
    const warn = mock.method(console, 'warn', () => {});
    const resolve = makeResolve({ '--loop': 'var(--loop)' });
    const out = resolve('var(--loop)', {});
    assert.match(String(out), /^var\(/);
    assert.ok(warn.mock.calls.length >= 1, 'deveria ter avisado');
    warn.mock.restore();
  });
});

describe('contrast (WCAG)', () => {
  it('preto×branco ≈ 21:1; igual = 1:1', () => {
    assert.ok(contrast('#000000', '#ffffff') > 20.9);
    assert.equal(Math.round(contrast('#777777', '#777777')), 1);
  });
});

describe('tintOver (color-mix accent P% sobre surface, em sRGB)', () => {
  it('extremos: pct=1 → accent, pct=0 → surface', () => {
    assert.equal(tintOver('#ff0000', 1, '#ffffff').toLowerCase(), '#ff0000');
    assert.equal(tintOver('#ff0000', 0, '#ffffff').toLowerCase(), '#ffffff');
  });
  it('meio termo fica ENTRE os dois (clareia o vermelho sobre branco)', () => {
    const mid = tintOver('#ff0000', 0.5, '#ffffff').toLowerCase();
    assert.match(mid, /^#[0-9a-f]{6}$/);
    assert.equal(mid.slice(1, 3), 'ff');            // R permanece no máximo
    assert.ok(mid.slice(3, 5) === mid.slice(5, 7)); // G == B (cinza-rosado)
  });
  it('entrada inválida → null', () => {
    assert.equal(tintOver('garbage', 0.5, '#fff'), null);
  });
});

describe('mixOklch (interpolação em OKLCH entre cores opacas)', () => {
  it('extremos batem com base/overlay', () => {
    assert.equal(mixOklch('#000000', '#ffffff', 0).toLowerCase(), '#000000');
    assert.equal(mixOklch('#000000', '#ffffff', 1).toLowerCase(), '#ffffff');
  });
  it('meio é um cinza válido distinto dos extremos', () => {
    const mid = mixOklch('#000000', '#ffffff', 0.5).toLowerCase();
    assert.match(mid, /^#[0-9a-f]{6}$/);
    assert.notEqual(mid, '#000000');
    assert.notEqual(mid, '#ffffff');
  });
  it('entrada inválida → null', () => {
    assert.equal(mixOklch('nope', '#fff', 0.5), null);
  });
});
