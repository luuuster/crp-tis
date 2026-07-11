// Integridade do embed (build/embed-icons.mjs). Prova que gzip+base64 -> de volta é fiel e menor.
// A descompressão real roda na UI (DecompressionStream); aqui validamos os dados com o zlib do Node.
import test from 'node:test';
import assert from 'node:assert/strict';
import { gzipSync, gunzipSync } from 'node:zlib';

function roundtrip(json) {
  const b64 = gzipSync(Buffer.from(json), { level: 9 }).toString('base64');
  const back = gunzipSync(Buffer.from(b64, 'base64')).toString('utf8');
  return { b64, back };
}

test('gzip+base64 round-trip preserva o JSON exatamente', () => {
  const bundle = {
    source: 'lucide', version: '1.17.0', sizes: [16, 20, 24, 32], count: 3,
    icons: [
      { name: 'arrow-right', svg: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>', tags: ['next', 'forward'] },
      { name: 'home', svg: '<svg fill="currentColor" viewBox="0 -960 960 960"><path d="M220-180h150z"/></svg>' },
      { name: 'alert-circle', svg: '<svg stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>', alias: true },
    ],
  };
  const json = JSON.stringify(bundle);
  const { back } = roundtrip(json);
  assert.equal(back, json, 'round-trip divergiu byte a byte');
  assert.deepEqual(JSON.parse(back), bundle);
});

test('comprimido fica bem menor que o JSON cru (SVGs são repetitivos)', () => {
  const icons = Array.from({ length: 800 }, (_, i) => ({
    name: 'icon-' + i,
    svg: '<svg fill="currentColor" viewBox="0 -960 960 960"><path d="M220-180h150v-250h220v250h150v-390L480-765 220-570v390Z"/></svg>',
  }));
  const json = JSON.stringify({ source: 'material', style: 'outlined', icons });
  const { b64, back } = roundtrip(json);
  assert.equal(back, json);
  assert.ok(b64.length < json.length * 0.5, 'esperava <50% do tamanho; veio ' + Math.round((b64.length / json.length) * 100) + '%');
});
