// pretest (achado #5): os bundles de ícone são GERADOS (gitignored) e só existem após
// `npm run icons` (que demora minutos baixando lucide-static/@material-symbols). Sem eles,
// 3 suites (bundle/run/material) morrem com ENOENT no parse — erro críptico para quem clonou
// agora. Este guard FALHA CEDO com instrução clara. Ele NÃO gera os bundles (seria lento e
// surpreendente num `npm test`); o CI roda `npm run icons` antes do test, então segue verde.
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join(process.cwd(), 'figma-plugin-icons');
const REQUIRED = [
  'lucide-icons.json',                                   // bundle.test + run.test
  'material-outlined.json', 'material-outlined-fill.json',
  'material-rounded.json', 'material-rounded-fill.json',
  'material-sharp.json', 'material-sharp-fill.json',     // material.test (3 estilos × 2 variantes)
];

const missing = REQUIRED.filter((f) => !existsSync(join(DIR, f)));
if (missing.length) {
  console.error(`\n⛔ Faltam ${missing.length} bundle(s) de ícone (gerados, não versionados):`);
  for (const f of missing) console.error(`   • figma-plugin-icons/${f}`);
  console.error('\n   Rode `npm run icons` para gerá-los (export Lucide/Material + embed; pode levar alguns minutos),');
  console.error('   depois `npm test` de novo. (O CI já faz essa ordem automaticamente.)\n');
  process.exit(1);
}
