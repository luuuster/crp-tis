// Testes das funções PURAS do plugin (node --test). Extrai as definições do PRÓPRIO code.js (fonte real,
// não uma cópia) e avalia num escopo isolado — assim um drift no code.js quebra o teste.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('./code.js', import.meta.url), 'utf8');
const grab = (re, name) => { const m = src.match(re); if (!m) throw new Error('não achei ' + name + ' em code.js'); return m[0]; };
const body = [
  grab(/function relLum\(c\) \{[\s\S]*?\n\}/, 'relLum'),
  grab(/function contrastRatio\(a, b\) \{[\s\S]*?\n\}/, 'contrastRatio'),
  grab(/const colorClose = [^;]+;/, 'colorClose'),
  grab(/const numClose = [\s\S]*?\+ 1\)\);/, 'numClose'),
  grab(/function normalizeParts\(p\) \{[\s\S]*?\n\}/, 'normalizeParts'),
  grab(/function validDoc\(doc\) \{[^\n]*\}/, 'validDoc'),
  grab(/function validateBundle\(doc\) \{[\s\S]*?\n\}/, 'validateBundle'),
  'return { relLum, contrastRatio, colorClose, numClose, normalizeParts, validDoc, validateBundle };',
].join('\n');
const F = new Function(body)();

test('contrastRatio: branco/preto = 21', () => {
  assert.ok(Math.abs(F.contrastRatio({ r: 1, g: 1, b: 1 }, { r: 0, g: 0, b: 0 }) - 21) < 0.01);
});
test('contrastRatio: simétrico e nunca < 1', () => {
  const a = { r: 0.2, g: 0.4, b: 0.6 }, b = { r: 0.9, g: 0.9, b: 0.9 };
  assert.ok(Math.abs(F.contrastRatio(a, b) - F.contrastRatio(b, a)) < 1e-9);
  assert.ok(F.contrastRatio(a, a) >= 1 - 1e-9 && F.contrastRatio(a, a) < 1.001);
});
test('numClose: absorve a quantização float32 do Figma', () => {
  assert.equal(F.numClose(Math.fround(4 / 3), 4 / 3), true);
  assert.equal(F.numClose(Math.fround(0.05), 0.05), true);
  assert.equal(F.numClose(Math.fround(-1.2), -1.2), true);
});
test('numClose: ainda pega uma edição real', () => {
  assert.equal(F.numClose(0.06, 0.05), false);
  assert.equal(F.numClose(1.4, 4 / 3), false);
});
test('colorClose: tolera Δ≤0.01 por canal, rejeita acima', () => {
  assert.equal(F.colorClose({ r: 0.5, g: 0.5, b: 0.5 }, { r: 0.505, g: 0.5, b: 0.5 }), true);
  assert.equal(F.colorClose({ r: 0.5, g: 0.5, b: 0.5 }, { r: 0.6, g: 0.5, b: 0.5 }), false);
});

test('validDoc: aceita collections[] ou styles, rejeita o resto', () => {
  assert.equal(F.validDoc(null), false);
  assert.equal(F.validDoc({}), false);
  assert.equal(F.validDoc({ collections: [] }), true);
  assert.equal(F.validDoc({ styles: {} }), true);
});

test('normalizeParts: sem seleção = tudo ligado; false desliga só o citado', () => {
  const all = F.normalizeParts(null);
  assert.equal(all.coll('CRP/Primitives'), true);
  assert.equal(all.style('text'), true);
  const sel = F.normalizeParts({ collections: { Primitives: false }, styles: { text: false } });
  assert.equal(sel.coll('CRP/Primitives'), false); // desligado
  assert.equal(sel.coll('CRP/Brand'), true);       // não citado → ligado
  assert.equal(sel.style('text'), false);
  assert.equal(sel.style('effect'), true);
});

test('validateBundle: bundle válido não gera issues', () => {
  const doc = { collections: [{ name: 'CRP/X', modes: [{ name: 'Value' }], variables: [
    { name: 'a', type: 'COLOR', values: { Value: { color: { r: 0, g: 0.5, b: 1 } } } },
    { name: 'b', type: 'FLOAT', values: { Value: { number: 4 } } },
    { name: 'c', type: 'COLOR', values: { Value: { alias: 'a' } } },
  ] }] };
  assert.deepEqual(F.validateBundle(doc), []);
});

test('validateBundle: acusa cor fora de 0..1, alias vazio e slot sem tipo', () => {
  const doc = { collections: [{ name: 'CRP/X', modes: [], variables: [
    { name: 'a', type: 'COLOR', values: { Value: { color: { r: 2, g: 0, b: 0 } } } },
    { name: 'b', type: 'COLOR', values: { Value: { alias: '' } } },
    { name: 'c', type: 'FLOAT', values: { Value: {} } },
  ] }] };
  const issues = F.validateBundle(doc);
  assert.ok(issues.some((m) => /cor fora de 0\.\.1/.test(m)));
  assert.ok(issues.some((m) => /alias inválido/.test(m)));
  assert.ok(issues.some((m) => /sem color\/number\/alias\/string/.test(m)));
});

test('validateBundle: variável malformada e collection sem nome', () => {
  const doc = { collections: [
    { modes: [], variables: [] },                                  // collection sem name
    { name: 'CRP/Y', modes: [], variables: [{ name: 'x' }] },       // variável sem type
  ] };
  const issues = F.validateBundle(doc);
  assert.ok(issues.some((m) => /collection sem nome/.test(m)));
  assert.ok(issues.some((m) => /variável malformada/.test(m)));
});
