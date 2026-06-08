// Export: node_modules/lucide-static -> figma-plugin-icons/lucide-icons.json (bundle p/ o plugin de ícones).
//
// Por quê: o plugin roda no sandbox do Figma e NÃO lê arquivos do disco. Então empacotamos cada ícone
// Lucide como uma string SVG (minificada) num único JSON que o plugin carrega via <input type=file>.
// O plugin faz figma.createNodeFromSvg(svg) e cria os components (1 ComponentSet por ícone, Size=16/20/24/32).
//
// Fonte da verdade: a devDependency `lucide-static` (icons/*.svg + icon-nodes.json + tags.json). Lê direto
// dela — sem cópia versionada no repo. Cobre TODOS os 1962 (inclui aliases, que o icon-nodes.json não tem).
// Atualizar: `npm i -D lucide-static@latest && npm run export:lucide`. O JSON gerado é ARTEFATO.

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const ROOT = process.cwd();
const LUCIDE = join(ROOT, 'node_modules', 'lucide-static');
const ICONS_DIR = join(LUCIDE, 'icons');
const OUT_DIR = join(ROOT, 'figma-plugin-icons');
const OUT = join(OUT_DIR, 'lucide-icons.json');

const SIZES = [16, 20, 24, 32];

// Minifica o SVG sem mexer na geometria: tira o comentário de licença e colapsa espaços em branco.
// Mantém class/atributos — createNodeFromSvg ignora o que não entende.
function minifySvg(raw) {
  return raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/\s+\/>/g, '/>')
    .replace(/\s+>/g, '>')
    .trim();
}

function lucideVersion() {
  try {
    const p = join(ROOT, 'node_modules', 'lucide-static', 'package.json');
    return JSON.parse(readFileSync(p, 'utf8')).version || 'unknown';
  } catch {
    return 'unknown';
  }
}

function main() {
  if (!existsSync(ICONS_DIR)) {
    console.error(`✗ não achei ${ICONS_DIR}. Rode "npm i" (a devDependency lucide-static fornece os ícones).`);
    process.exit(1);
  }
  let tags = {};
  try { tags = JSON.parse(readFileSync(join(LUCIDE, 'tags.json'), 'utf8')); } catch { /* tags opcionais */ }

  // Canônicos = chaves do icon-nodes.json (Lucide). Os .svg que NÃO estão lá são ALIASES (nomes
  // alternativos p/ a mesma arte). Marcamos p/ a UI poder ocultá-los e evitar duplicatas.
  let canonical = null;
  try { canonical = new Set(Object.keys(JSON.parse(readFileSync(join(LUCIDE, 'icon-nodes.json'), 'utf8')))); } catch { canonical = null; }

  const files = readdirSync(ICONS_DIR)
    .filter((f) => f.endsWith('.svg') && f !== 'sprite.svg')
    .sort();

  let aliasCount = 0;
  const icons = files.map((f) => {
    const name = basename(f, '.svg');
    const svg = minifySvg(readFileSync(join(ICONS_DIR, f), 'utf8'));
    const ic = { name, svg, tags: Array.isArray(tags[name]) ? tags[name] : [] };
    if (canonical && !canonical.has(name)) { ic.alias = true; aliasCount++; }
    return ic;
  });

  // Sanidade: 1 root <svg>…</svg>, com pelo menos 1 elemento filho.
  for (const ic of icons) {
    if (!ic.svg.startsWith('<svg') || !ic.svg.endsWith('</svg>') || ic.svg.indexOf('<', 5) < 0) {
      console.error(`✗ SVG suspeito para "${ic.name}": ${ic.svg.slice(0, 60)}…`);
      process.exit(1);
    }
  }
  if (icons.length === 0) {
    console.error('✗ nenhum .svg encontrado em node_modules/lucide-static/icons/');
    process.exit(1);
  }

  const bundle = {
    $schema: 'crp-lucide-figma/1',
    source: 'lucide-static',
    version: lucideVersion(),
    sizes: SIZES,
    count: icons.length,
    canonical: canonical ? icons.length - aliasCount : null,
    aliases: aliasCount,
    icons,
  };

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  const json = JSON.stringify(bundle);
  writeFileSync(OUT, json);
  console.log(`✓ ${OUT}`);
  console.log(`  ${icons.length} ícones (${aliasCount} aliases) · sizes ${SIZES.join('/')} · lucide ${bundle.version} · ${(Buffer.byteLength(json) / 1024).toFixed(0)} KB`);
}

main();
