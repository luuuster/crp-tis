// gen-code-connect.mjs — GERA `Icon.figma.tsx` com 1 `figma.connect()` por ícone `lucide/*`,
// lendo os ComponentSets PUBLICADOS da lib no Figma. Roda no repo do APP React (Node ≥ 18, tem `fetch`).
//
// Pré-requisito: a biblioteca de ícones PUBLICADA no Figma (painel Assets → Publish). Sem publicar não há
// node-ids. O <Icon> (Icon.tsx) é a fonte do snippet; aqui só mapeamos cada nó do Figma → <Icon name="…">.
//
// Uso:
//   FIGMA_FILE_KEY=abc123 FIGMA_TOKEN=figd_xxx node gen-code-connect.mjs
//   node gen-code-connect.mjs <FILE_KEY> <TOKEN>
//
// FILE_KEY: o trecho da URL do arquivo → figma.com/design/<FILE_KEY>/<nome>?node-id=…
// TOKEN:    Figma → Settings → Personal access tokens (escopo de leitura de arquivo). NÃO comite o token.
//
// Depois: `npx figma connect publish` (precisa de figma.config.json — incluído aqui).

import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const FILE_KEY = process.env.FIGMA_FILE_KEY || process.argv[2];
const TOKEN = process.env.FIGMA_TOKEN || process.argv[3];
const SIZES = [16, 20, 24, 32];
const PREFIX = 'lucide/';

if (!FILE_KEY || !TOKEN) {
  console.error('✗ Faltou FILE_KEY e/ou TOKEN.');
  console.error('  Uso: FIGMA_FILE_KEY=xxx FIGMA_TOKEN=figd_xxx node gen-code-connect.mjs');
  process.exit(1);
}

async function api(path) {
  const res = await fetch('https://api.figma.com/v1' + path, { headers: { 'X-Figma-Token': TOKEN } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 403) throw new Error('403 — token sem permissão ou file key errado. Gere um token com leitura de arquivo e confira o FILE_KEY.');
    throw new Error(`Figma API ${res.status} em ${path}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

const escName = (s) => String(s).replace(/[^a-z0-9-]/gi, ''); // nome de ícone é kebab seguro

async function main() {
  console.log(`· Lendo ComponentSets publicados de ${FILE_KEY}…`);
  const data = await api(`/files/${FILE_KEY}/component_sets`);
  const sets = (data && data.meta && data.meta.component_sets) || [];

  const seen = new Set();
  const lucide = sets
    .filter((s) => typeof s.name === 'string' && s.name.indexOf(PREFIX) === 0 && s.node_id)
    .map((s) => ({ icon: escName(s.name.slice(PREFIX.length)), nodeId: String(s.node_id) }))
    .filter((s) => s.icon && !seen.has(s.icon) && seen.add(s.icon))
    .sort((a, b) => a.icon.localeCompare(b.icon));

  if (!lucide.length) {
    console.error('✗ Nenhum ComponentSet "lucide/*" publicado encontrado neste arquivo.');
    console.error('  Publique a lib de ícones no Figma (Assets → Publish) e rode de novo.');
    console.error(`  (A API retornou ${sets.length} component_sets no total.)`);
    process.exit(1);
  }

  const sizeEnum = '{ ' + SIZES.map((s) => `'${s}': ${s}`).join(', ') + ' }';
  const head =
`// GERADO por gen-code-connect.mjs — NÃO editar à mão (rode o gerador de novo p/ atualizar).
// ${lucide.length} ícones · arquivo ${FILE_KEY}
import figma from '@figma/code-connect';
import { Icon } from './Icon';
`;
  const blocks = lucide.map(({ icon, nodeId }) => {
    const url = `https://www.figma.com/design/${FILE_KEY}/lucide?node-id=${nodeId.replace(':', '-')}`;
    return (
`figma.connect(Icon, '${url}', {
  props: { size: figma.enum('Size', ${sizeEnum}) },
  example: ({ size }) => <Icon name="${icon}" size={size} />,
});`);
  });

  const out = join(dirname(fileURLToPath(import.meta.url)), 'Icon.figma.tsx');
  writeFileSync(out, head + '\n' + blocks.join('\n\n') + '\n');
  console.log(`✓ ${out}`);
  console.log(`  ${lucide.length} figma.connect() gerados. Agora rode: npx figma connect publish`);
}

main().catch((e) => { console.error('✗', e.message); process.exit(1); });
