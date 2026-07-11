// Integridade do bundle de ícones (node --test). Prova que lucide-icons.json é fiel à fonte (lucide-static).
// Roda sobre o ARTEFATO gerado — se ele estiver stale/quebrado, o teste falha.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const bundle = JSON.parse(readFileSync(new URL('./lucide-icons.json', import.meta.url), 'utf8'));

test('schema, versão e tamanhos esperados', () => {
  assert.equal(bundle.$schema, 'crp-lucide-figma/1');
  assert.equal(bundle.source, 'lucide-static');
  assert.deepEqual(bundle.sizes, [16, 20, 24, 32]);
  assert.ok(typeof bundle.version === 'string' && bundle.version.length > 0);
});

test('count bate com o array e cobre a lib inteira', () => {
  assert.equal(bundle.count, bundle.icons.length);
  assert.ok(bundle.icons.length >= 1900, 'esperava ~1962 ícones, veio ' + bundle.icons.length);
});

test('nomes únicos e não-vazios', () => {
  const names = bundle.icons.map((i) => i.name);
  assert.equal(new Set(names).size, names.length, 'há nomes duplicados');
  assert.ok(names.every((n) => typeof n === 'string' && n.length > 0));
});

test('todo svg é bem-formado (1 root <svg>…</svg> com filho)', () => {
  for (const ic of bundle.icons) {
    assert.ok(ic.svg.startsWith('<svg'), 'sem <svg>: ' + ic.name);
    assert.ok(ic.svg.endsWith('</svg>'), 'sem </svg>: ' + ic.name);
    assert.ok(ic.svg.indexOf('<', 5) > 0, 'sem elemento filho: ' + ic.name);
    assert.ok(ic.svg.indexOf('viewBox="0 0 24 24"') > 0, 'viewBox != 24: ' + ic.name);
    assert.ok(ic.svg.indexOf('stroke="currentColor"') > 0, 'sem currentColor: ' + ic.name);
  }
});

test('arrow-right tem a geometria oficial do Lucide', () => {
  const ic = bundle.icons.find((i) => i.name === 'arrow-right');
  assert.ok(ic, 'arrow-right ausente');
  assert.ok(ic.svg.includes('M5 12h14'), 'path 1 divergiu');
  assert.ok(ic.svg.includes('m12 5 7 7-7 7'), 'path 2 divergiu');
  assert.ok(ic.tags.includes('next') || ic.tags.includes('forward'), 'tags ausentes');
});

test('aliases marcados (alias:true) e canônicos sem a flag', () => {
  assert.ok(bundle.aliases > 0, 'esperava aliases marcados');
  assert.equal(bundle.canonical + bundle.aliases, bundle.count);
  const aliasCount = bundle.icons.filter((i) => i.alias).length;
  assert.equal(aliasCount, bundle.aliases);
  assert.ok(!bundle.icons.find((i) => i.name === 'arrow-right').alias, 'arrow-right não é alias');
  assert.ok(bundle.icons.find((i) => i.name === 'alert-circle').alias, 'alert-circle deveria ser alias');
});
