// Auditor de contraste do MODO DARK — varredura de USO (não só de token), surface-aware.
//
// O check.mjs valida os TOKENS (pares fg/bg do contrato). Mas uma tela pode CONSUMIR
// o token errado — ex.: usar --destructive (cor de PREENCHIMENTO) como `color:` de texto.
// Este script varre todo `color: var(--X)` dos previews, descobre a SUPERFÍCIE onde o texto
// pousa (se a mesma linha define background var(--X-foreground), pousa no foreground claro;
// senão, sobre background/card) e mede o contraste WCAG real nos temas DARK, apontando o que
// reprova AA (4.5) como TEXTO. RELATÓRIO por padrão; com --strict, FALHA (exit 1) se achar bug —
// use --strict no CI. O gate fatal equivalente sobre os tokens vive no check.mjs.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { scopesOf, makeResolve, contrast } from './lib/css.mjs';
import { loadThemes } from './lib/themes.mjs';

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist');
const PREVIEW = join(ROOT, 'preview');
const AA = 4.5;
const STRICT = process.argv.includes('--strict');

// Temas dark derivados de tokens/$themes.json (build/lib/themes.mjs) — marca nova entra sozinha.
const DARK = Object.fromEntries(
  loadThemes(ROOT).themes.filter((t) => t.mode === 'Dark').map((t) => [t.name, t.selector])
);

// ---- parse de dist/tokens.css — compartilhado com check.mjs (build/lib/css.mjs) ----
const bySel = scopesOf(readFileSync(join(DIST, 'tokens.css'), 'utf8'));
const resolve = makeResolve(bySel[':root'] || {});
const ratio = contrast;

// ---- coleta os usos `color: var(--X)` dos previews, com a linha (p/ descobrir a superfície) ----
const FILL = new Set(['destructive', 'warning', 'success', 'info', 'primary', 'secondary']);
const uses = [];
for (const f of readdirSync(PREVIEW).filter((x) => x.endsWith('.html'))) {
  readFileSync(join(PREVIEW, f), 'utf8').split('\n').forEach((ln, i) => {
    for (const m of ln.matchAll(/(?<![-\w])color\s*:\s*var\((--[\w-]+)\)/g)) {
      uses.push({ file: f, line: i + 1, token: m[1].slice(2), text: ln });
    }
  });
}

const pad = (s, n) => String(s).padEnd(n);
let bugs = 0;

for (const [theme, sel] of Object.entries(DARK)) {
  const scope = bySel[sel];
  console.log(`\n━━━ ${theme} (${sel}) ━━━`);
  console.log(pad('color: var(--TOKEN)', 24) + pad('superfície', 22) + pad('contraste', 12) + 'uso');
  // agrupa por (token + superfície) p/ não repetir; superfície = own-foreground se a linha definir
  const rows = new Map();
  for (const u of uses) {
    const onOwnFg = new RegExp(`background(-color)?\\s*:\\s*var\\(--${u.token}-foreground\\)`).test(u.text);
    const surfaces = onOwnFg ? [`${u.token}-foreground`] : ['background', 'card'];
    const key = `${u.token}|${surfaces.join(',')}`;
    if (!rows.has(key)) rows.set(key, { token: u.token, surfaces, where: [] });
    rows.get(key).where.push(`${u.file}:${u.line}`);
  }
  for (const { token, surfaces, where } of rows.values()) {
    const val = resolve(scope[`--${token}`], scope);
    const results = surfaces.map((s) => ({ s, r: ratio(val, resolve(scope[`--${s}`], scope)) }));
    const worst = results.reduce((a, b) => (b.r < a.r ? b : a));
    const ok = worst.r >= AA;
    const isBug = !ok && FILL.has(token);
    if (isBug) bugs++;
    console.log(
      pad(token, 24) + pad(surfaces.join('+'), 22) +
      pad(`${worst.r.toFixed(2)} ${ok ? '✓' : '✗AA'}`, 12) +
      where.slice(0, 2).join(' ') + (where.length > 2 ? ` +${where.length - 2}` : '') +
      (isBug ? '  ⛔ FILL-COMO-TEXTO' : '')
    );
  }
}

console.log(`\n${bugs ? '⛔' : '✅'} cor de PREENCHIMENTO como texto reprovando AA em superfície real (dark): ${bugs}`);
console.log('   (relatório surface-aware; o gate fatal equivalente está em build/check.mjs)');

if (STRICT && bugs) {
  console.error(`\n⛔ --strict: ${bugs} bug(s) de cor reprovando AA — falhando o build (exit 1).`);
  process.exit(1);
}
