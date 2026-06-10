// Contrato de build/lib/color.mjs — conversões de cor compartilhadas por export-figma e verify-figma.
// Hoje provadas só por uso (gate verde); estes testes documentam o contrato e protegem refactors.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parse, converter, inGamut } from 'culori';
import { hexToRgb, oklchToRgb, cssValToRgb, dist } from './color.mjs';

const toRgb = converter('rgb');
const near = (a, b, tol = 0.012) => assert.ok(Math.abs(a - b) <= tol, `${a} ≉ ${b} (tol ${tol})`);

describe('hexToRgb', () => {
  it('branco e preto em 6 dígitos', () => {
    assert.deepEqual(hexToRgb('#ffffff'), { r: 1, g: 1, b: 1, a: 1 });
    assert.deepEqual(hexToRgb('#000000'), { r: 0, g: 0, b: 0, a: 1 });
  });
  it('aceita # opcional e 3 dígitos (expande)', () => {
    assert.deepEqual(hexToRgb('fff'), { r: 1, g: 1, b: 1, a: 1 });
    assert.deepEqual(hexToRgb('#000'), { r: 0, g: 0, b: 0, a: 1 });
  });
  it('lê alpha de 8 dígitos', () => {
    const c = hexToRgb('#ff000080');
    assert.deepEqual([c.r, c.g, c.b], [1, 0, 0]);
    near(c.a, 0x80 / 255, 1e-9);
  });
});

describe('oklchToRgb', () => {
  it('L em % e L decimal são equivalentes', () => {
    assert.deepEqual(oklchToRgb('oklch(50% 0.1 120)'), oklchToRgb('oklch(0.5 0.1 120)'));
  });
  it('L=0 → preto; cinza neutro tem r=g=b', () => {
    const black = oklchToRgb('oklch(0% 0 0)');
    assert.deepEqual([black.r, black.g, black.b], [0, 0, 0]);
    const gray = oklchToRgb('oklch(0.5 0 0)');
    near(gray.r, gray.g, 1e-9);
    near(gray.g, gray.b, 1e-9);
  });
  it('CLAMPA wide-gamut para sRGB (cada canal em 0..1)', () => {
    const c = oklchToRgb('oklch(0.7 0.4 30)'); // croma 0.4 = bem fora do sRGB
    for (const ch of [c.r, c.g, c.b]) assert.ok(ch >= 0 && ch <= 1, `canal ${ch} fora de 0..1`);
  });
  it('bate com culori em cores DENTRO do gamut sRGB', () => {
    for (const s of ['oklch(0.6 0.05 250)', 'oklch(0.4 0.08 30)', 'oklch(0.8 0.04 140)']) {
      assert.ok(inGamut('rgb')(parse(s)), `${s} deveria estar no gamut`);
      const mine = oklchToRgb(s), ref = toRgb(parse(s));
      near(mine.r, ref.r); near(mine.g, ref.g); near(mine.b, ref.b);
    }
  });
  it('retorna null em entrada não-oklch', () => {
    assert.equal(oklchToRgb('rgb(1 2 3)'), null);
    assert.equal(oklchToRgb('xyz'), null);
  });
});

describe('cssValToRgb', () => {
  it('hex do comentário tem prioridade sobre o valor', () => {
    assert.deepEqual(cssValToRgb('oklch(0.5 0 0)', '#ffffff'), hexToRgb('#ffffff'));
  });
  it('sem hex: parseia oklch() ou #hex; senão null', () => {
    assert.deepEqual(cssValToRgb('oklch(0% 0 0)', null), oklchToRgb('oklch(0% 0 0)'));
    assert.deepEqual(cssValToRgb('#000000', null), hexToRgb('#000000'));
    assert.equal(cssValToRgb('12px', null), null);
  });
});

describe('dist (Chebyshev por canal, inclui alpha)', () => {
  it('cor igual → 0; alpha ausente trata como 1', () => {
    assert.equal(dist({ r: 0, g: 0, b: 0, a: 1 }, { r: 0, g: 0, b: 0 }), 0);
  });
  it('pega o maior delta entre os canais', () => {
    assert.equal(dist({ r: 0.2, g: 0, b: 0, a: 1 }, { r: 0, g: 0.1, b: 0, a: 1 }), 0.2);
  });
  it('detecta divergência de alpha', () => {
    near(dist({ r: 0, g: 0, b: 0, a: 1 }, { r: 0, g: 0, b: 0, a: 0.5 }), 0.5, 1e-9);
  });
});
