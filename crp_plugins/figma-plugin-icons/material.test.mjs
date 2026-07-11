// Integridade dos bundles Material Symbols (node --test). Roda sobre os ARTEFATOS gerados por
// `npm run export:material` — se estiverem stale/quebrados, falha.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const STYLES = ['outlined', 'rounded', 'sharp'];
const VARIANTS = [{ suffix: '', filled: false }, { suffix: '-fill', filled: true }];
const read = (s, suf) => JSON.parse(readFileSync(new URL(`./material-${s}${suf}.json`, import.meta.url), 'utf8'));

for (const style of STYLES) {
  for (const v of VARIANTS) {
    const name = `material-${style}${v.suffix}`;
    const b = read(style, v.suffix);

    test(`${name}: schema/source/style/filled/sizes/count`, () => {
      assert.equal(b.$schema, 'crp-icons-figma/1');
      assert.equal(b.source, 'material');
      assert.equal(b.style, style);
      assert.equal(b.filled, v.filled, 'flag filled errada');
      assert.deepEqual(b.sizes, [16, 20, 24, 32]);
      assert.equal(b.count, b.icons.length);
      assert.ok(b.icons.length > 3000, `esperava >3000 ícones, veio ${b.icons.length}`);
    });

    test(`${name}: nomes únicos e svg fill com currentColor + viewBox 0 -960 960 960`, () => {
      const names = b.icons.map((i) => i.name);
      assert.equal(new Set(names).size, names.length, 'nomes duplicados');
      for (const ic of b.icons) {
        assert.ok(ic.svg.startsWith('<svg') && ic.svg.endsWith('</svg>'), 'mal-formado: ' + ic.name);
        assert.ok(ic.svg.includes('currentColor'), 'sem currentColor: ' + ic.name);
        assert.ok(ic.svg.includes('viewBox="0 -960 960 960"'), 'viewBox inesperado: ' + ic.name);
      }
      assert.ok(b.icons.find((i) => i.name === 'home'), 'home ausente');
      assert.ok(!b.icons.some((i) => i.name.endsWith('-fill')), 'o sufixo -fill não deve vazar p/ o nome');
    });
  }
}

test('outline e fill têm a mesma cobertura de nomes mas arte diferente', () => {
  const out = read('outlined', ''), fill = read('outlined', '-fill');
  assert.equal(out.icons.length, fill.icons.length);
  const fo = Object.fromEntries(out.icons.map((i) => [i.name, i.svg]));
  const ff = Object.fromEntries(fill.icons.map((i) => [i.name, i.svg]));
  // home muda entre outline e fill
  assert.notEqual(fo['home'], ff['home'], 'outline e fill de home deveriam diferir');
});

test('os 3 estilos (outline) têm a mesma cobertura de nomes', () => {
  const sets = STYLES.map((s) => new Set(read(s, '').icons.map((i) => i.name)));
  assert.equal(sets[0].size, sets[1].size);
  assert.equal(sets[0].size, sets[2].size);
});
