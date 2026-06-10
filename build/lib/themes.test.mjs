// Contrato de build/lib/themes.mjs — deriva marcas/modos/temas/seletores de tokens/$themes.json
// (SSOT do Token Studio). Testa o repo real (documenta o contrato vigente) + os guards por fixture.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadThemes } from './themes.mjs';

function fixture($themes) {
  const dir = mkdtempSync(join(tmpdir(), 'crp-themes-'));
  mkdirSync(join(dir, 'tokens'));
  writeFileSync(join(dir, 'tokens', '$themes.json'), JSON.stringify($themes));
  return dir;
}

describe('loadThemes — repo real', () => {
  const r = loadThemes(process.cwd());

  it('a 1ª marca é a default (sem [data-brand]) e o slug vem do set brand/*', () => {
    assert.ok(r.brands.length >= 1);
    assert.equal(r.brands[0].isDefault, true);
    assert.equal(r.brands.filter((b) => b.isDefault).length, 1);
    const crp = r.brands.find((b) => b.name === 'CRP');
    assert.ok(crp && crp.slug === 'crp');
  });

  it('exatamente um modo default, e é o Light', () => {
    const def = r.modes.filter((m) => m.isDefault);
    assert.equal(def.length, 1);
    assert.equal(def[0].name, 'Light');
  });

  it('temas = produto marcas × modos', () => {
    assert.equal(r.themes.length, r.brands.length * r.modes.length);
  });

  it('seletores: default+Light = :root; Dark = .dark; marca não-default = [data-brand]', () => {
    assert.deepEqual(r.selectorsByTheme, {
      'CRP-Light': ':root',
      'CRP-Dark': '.dark',
      'MarcaB-Light': '[data-brand="marca-b"]',
      'MarcaB-Dark': '[data-brand="marca-b"].dark',
    });
  });
});

describe('loadThemes — guards (fixtures)', () => {
  it('grupos Brand/Mode vazios → lança', () => {
    const dir = fixture([]);
    try { assert.throws(() => loadThemes(dir), /vazios/); }
    finally { rmSync(dir, { recursive: true, force: true }); }
  });

  it('Brand sem set brand/* → lança nomeando a marca', () => {
    const dir = fixture([{ group: 'Brand', name: 'X', selectedTokenSets: { 'core/color': 'enabled' } }]);
    try { assert.throws(() => loadThemes(dir), /sem set brand/); }
    finally { rmSync(dir, { recursive: true, force: true }); }
  });
});
