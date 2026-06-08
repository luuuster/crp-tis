// Export: node_modules/@material-symbols/svg-400 -> figma-plugin-icons/material-<estilo>.json
//
// Mesma ideia do export do Lucide: empacota cada SVG num JSON que o plugin carrega e vira Components.
// Diferenças do Material (vs Lucide): ícones são PREENCHIDOS (fill, não stroke), viewBox 0 -960 960 960,
// width/height=48. Injetamos fill="currentColor" no <svg> p/ cair no MESMO pipeline de cor do plugin
// (currentColor -> cor fixa -> bind na Variable). Gera 6 bundles: 3 estilos (outlined/rounded/sharp) × 2 do
// eixo FILL (outline `<name>.svg` e preenchido `<name>-fill.svg`). Grade/Optical Size NÃO vêm dos SVGs estáticos.
//
// Fonte: devDependency `@material-symbols/svg-400` (peso 400). Atualizar: npm i -D @material-symbols/svg-400@latest.

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const ROOT = process.cwd();
const PKG = join(ROOT, 'node_modules', '@material-symbols', 'svg-400');
const STYLES = ['outlined', 'rounded', 'sharp'];
const SIZES = [16, 20, 24, 32];
const OUT_DIR = join(ROOT, 'figma-plugin-icons');

function minifySvg(raw) {
  return raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/\s+\/>/g, '/>')
    .replace(/\s+>/g, '>')
    .trim();
}

function pkgVersion() {
  try { return JSON.parse(readFileSync(join(PKG, 'package.json'), 'utf8')).version || 'unknown'; }
  catch { return 'unknown'; }
}

function main() {
  if (!existsSync(PKG)) {
    console.error(`✗ não achei ${PKG}. Rode "npm i -D @material-symbols/svg-400".`);
    process.exit(1);
  }
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  const version = pkgVersion();
  let totalAll = 0;

  // Eixo FILL: outline (arquivos sem sufixo) e preenchido (-fill.svg, tirando o sufixo do nome).
  const VARIANTS = [
    { filled: false, suffix: '', pick: (f) => f.endsWith('.svg') && !f.endsWith('-fill.svg'), name: (f) => basename(f, '.svg') },
    { filled: true, suffix: '-fill', pick: (f) => f.endsWith('-fill.svg'), name: (f) => basename(f, '.svg').replace(/-fill$/, '') },
  ];

  let bundleCount = 0;
  for (const style of STYLES) {
    const dir = join(PKG, style);
    if (!existsSync(dir)) { console.error(`✗ estilo ausente: ${dir}`); process.exit(1); }
    const all = readdirSync(dir).sort();

    for (const v of VARIANTS) {
      const icons = all.filter(v.pick).map((f) => {
        const name = v.name(f);
        let svg = minifySvg(readFileSync(join(dir, f), 'utf8'));
        // Material não usa currentColor (path preto). Injeta no <svg> p/ os paths herdarem -> pipeline de cor do plugin.
        if (svg.indexOf('currentColor') < 0) svg = svg.replace(/<svg /, '<svg fill="currentColor" ');
        return { name, svg, tags: [] };
      });

      for (const ic of icons) {
        if (!ic.svg.startsWith('<svg') || !ic.svg.endsWith('</svg>') || ic.svg.indexOf('<', 5) < 0 || ic.svg.indexOf('currentColor') < 0) {
          console.error(`✗ SVG suspeito (${style}${v.suffix}) "${ic.name}": ${ic.svg.slice(0, 70)}…`);
          process.exit(1);
        }
      }
      if (!icons.length) { console.error(`✗ nenhum .svg (${style}${v.suffix}) em ${dir}`); process.exit(1); }

      const bundle = { $schema: 'crp-icons-figma/1', source: 'material', style, filled: v.filled, version, sizes: SIZES, count: icons.length, icons };
      const out = join(OUT_DIR, `material-${style}${v.suffix}.json`);
      const json = JSON.stringify(bundle);
      writeFileSync(out, json);
      totalAll += icons.length; bundleCount++;
      console.log(`✓ material-${style}${v.suffix}.json — ${icons.length} ícones · ${(Buffer.byteLength(json) / 1024).toFixed(0)} KB`);
    }
  }
  console.log(`  Material Symbols v${version} · ${STYLES.length} estilos × 2 (outline/fill) = ${bundleCount} bundles · ${totalAll} ícones · sizes ${SIZES.join('/')}`);
}

main();
