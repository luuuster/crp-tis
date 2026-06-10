// Embute os bundles de ícones DENTRO do plugin -> figma-plugin-icons/code.bundled.js
//
// Por quê: o sandbox do Figma não lê disco. Pra você NÃO precisar carregar o .json no plugin, embutimos os
// ícones no próprio código. Pra não inchar, vão GZIP+base64 (a UI descompacta sob demanda via DecompressionStream).
// O manifest aponta p/ code.bundled.js (gerado) — `code.js` continua sendo a FONTE da lógica (editável/testada).
//
// Fluxo: npm run export:icons  (gera os *.json)  →  npm run embed:icons  (gera code.bundled.js).  `npm run icons` faz os dois.
// Atualizou versão de lib? Rode `npm run icons` de novo. NUNCA edite code.bundled.js à mão (é artefato).

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const ROOT = process.cwd();
const DIR = join(ROOT, 'figma-plugin-icons');
// chave = como a UI identifica (lucide | material:<estilo>[:fill])
const SOURCES = [
  { key: 'lucide', file: 'lucide-icons.json' },
  { key: 'material:outlined', file: 'material-outlined.json' },
  { key: 'material:rounded', file: 'material-rounded.json' },
  { key: 'material:sharp', file: 'material-sharp.json' },
  { key: 'material:outlined:fill', file: 'material-outlined-fill.json' },
  { key: 'material:rounded:fill', file: 'material-rounded-fill.json' },
  { key: 'material:sharp:fill', file: 'material-sharp-fill.json' },
];

// Só o necessário p/ o plugin (a compressão cuida do resto). Mantém tags do Lucide (busca por palavra-chave).
function slim(b) {
  return {
    source: b.source, style: b.style || null, filled: !!b.filled, version: b.version || '', sizes: b.sizes, count: b.count,
    icons: (b.icons || []).map((i) => {
      const o = { name: i.name, svg: i.svg };
      if (i.tags && i.tags.length) o.tags = i.tags;
      if (i.alias) o.alias = true;
      return o;
    }),
  };
}

function main() {
  const codePath = join(DIR, 'code.js');
  if (!existsSync(codePath)) { console.error(`✗ falta ${codePath}`); process.exit(1); }
  const code = readFileSync(codePath, 'utf8');

  // Falha ALTO se algum bundle esperado faltar — senão gera code.bundled.js INCOMPLETO em silêncio.
  // Escape p/ dev: --allow-partial (build parcial intencional).
  const missing = SOURCES.filter((s) => !existsSync(join(DIR, s.file)));
  if (missing.length && !process.argv.includes('--allow-partial')) {
    console.error(`✗ bundles ausentes (${missing.length}/${SOURCES.length}): ${missing.map((s) => s.file).join(', ')}`);
    console.error('  Rode "npm run export:icons" antes (ou passe --allow-partial p/ build parcial em dev).');
    process.exit(1);
  }

  const meta = {}, data = {};
  let totalJson = 0, totalB64 = 0, found = 0;
  for (const s of SOURCES) {
    const p = join(DIR, s.file);
    if (!existsSync(p)) {
      console.warn(`· ${s.file} ausente — pulando (--allow-partial).`);
      continue;
    }
    const bundle = slim(JSON.parse(readFileSync(p, 'utf8')));
    const json = JSON.stringify(bundle);
    const b64 = gzipSync(Buffer.from(json), { level: 9 }).toString('base64');
    data[s.key] = b64;
    meta[s.key] = { source: bundle.source, style: bundle.style || null, filled: !!bundle.filled, version: bundle.version, count: bundle.count };
    totalJson += Buffer.byteLength(json); totalB64 += b64.length; found++;
  }
  if (!found) { console.error('✗ nenhum bundle encontrado. Rode "npm run export:icons" antes.'); process.exit(1); }

  const preamble =
    '// GERADO por build/embed-icons.mjs — NÃO editar. Dados embutidos (gzip+base64) + code.js.\n' +
    'var __ICON_META__ = ' + JSON.stringify(meta) + ';\n' +
    'var __ICON_DATA__ = ' + JSON.stringify(data) + ';\n';

  const out = join(DIR, 'code.bundled.js');
  try {
    writeFileSync(out, preamble + code);
  } catch (e) {
    console.error(`✗ falha ao escrever ${out}: ${e.message}`);
    process.exit(1);
  }
  console.log(`✓ ${out}`);
  console.log(`  ${found} conjuntos · ${(totalJson / 1048576).toFixed(1)} MB JSON → ${(totalB64 / 1048576).toFixed(2)} MB embutidos (gzip+base64)`);
}

main();
