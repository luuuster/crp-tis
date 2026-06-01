// Build dos tokens: Token Studio (JSON/DTCG) -> CSS (Tailwind v4 / shadcn).
// Fonte da verdade = tokens/. Saída GERADA = dist/. NUNCA edite dist/ à mão.
//
// Estratégia (ver §6 #2 e #4 do plano):
//  1) Emite os PRIMITIVOS uma única vez em :root (primitives.css).
//  2) Constrói cada tema COM os primitivos presentes -> o Style Dictionary gera
//     referências `var(--primitivo)` limpas (em vez de inlinar o valor).
//  3) Remove as linhas de primitivos dos blocos de tema (ficam só os semânticos/contrato),
//     evitando duplicar as rampas em todo seletor.
//  4) Concatena tudo em tokens.css e gera theme.css (Tailwind @theme inline) para o shadcn.

import StyleDictionary from 'style-dictionary';
import { register, permutateThemes } from '@tokens-studio/sd-transforms';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const TOKENS = join(ROOT, 'tokens');
const DIST = join(ROOT, 'dist');
const THEMES_DIR = join(DIST, 'themes');

register(StyleDictionary);

// Cada theme (brand×mode) do Token Studio -> um seletor CSS.
// Dark via classe `.dark` (padrão shadcn/next-themes); marca via [data-brand]. Marca default (CRP) sem atributo.
const SELECTOR = {
  'CRP-Light':    ':root',
  'CRP-Dark':     '.dark',
  'MarcaB-Light': '[data-brand="marca-b"]',
  'MarcaB-Dark':  '[data-brand="marca-b"].dark',
};

const isPrimitive = (token) => token.filePath.replaceAll('\\', '/').includes('/core/');

const baseCssPlatform = (files) => ({
  transformGroup: 'tokens-studio',
  transforms: ['name/kebab'],
  buildPath: DIST + '/',
  files,
});

function declaredVarNames(css) {
  const names = new Set();
  for (const m of css.matchAll(/^\s*(--[\w-]+)\s*:/gm)) names.add(m[1]);
  return names;
}

// Remove o header do SD e os comentários inline de hex (/** #rrggbb */, vindos do $description)
// SEM colapsar linhas. O hex de referência vive no color.json/Token Studio, não no CSS de produção.
function stripComments(css) {
  return css
    .replace(/\/\*\*[\s\S]*?\*\//g, '') // header + comentários inline /** ... */
    .replace(/[ \t]+$/gm, '')           // espaços à direita
    .replace(/\n{3,}/g, '\n\n')         // colapsa linhas em branco extras
    .trim();
}

async function main() {
  if (existsSync(DIST)) rmSync(DIST, { recursive: true, force: true });
  mkdirSync(THEMES_DIR, { recursive: true });

  // 1) PRIMITIVOS -> :root (canônico, uma vez só).
  const primSd = new StyleDictionary({
    source: ['tokens/core/**/*.json'],
    preprocessors: ['tokens-studio'],
    platforms: { css: baseCssPlatform([
      { destination: 'primitives.css', format: 'css/variables', options: { selector: ':root' } },
    ]) },
  });
  await primSd.buildAllPlatforms();
  const primitivesCss = readFileSync(join(DIST, 'primitives.css'), 'utf8');
  const primitiveNames = declaredVarNames(primitivesCss);

  // 2) Um build por tema (com primitivos presentes -> refs var() limpas).
  const $themes = JSON.parse(readFileSync(join(TOKENS, '$themes.json'), 'utf8'));
  const themes = permutateThemes($themes);

  const stripped = {}; // name -> css do bloco de tema (só semânticos/contrato)
  for (const [name, sets] of Object.entries(themes)) {
    const selector = SELECTOR[name];
    if (!selector) throw new Error(`Sem seletor mapeado para o theme "${name}". Atualize SELECTOR em build-tokens.mjs.`);

    const sd = new StyleDictionary({
      source: sets.map((s) => `tokens/${s}.json`),
      preprocessors: ['tokens-studio'],
      platforms: { css: baseCssPlatform([
        { destination: `themes/${name}.css`, format: 'css/variables', options: { selector, outputReferences: true } },
      ]) },
    });
    await sd.buildAllPlatforms();

    // 3) Remove as linhas de primitivos (ficam só os tokens semânticos/contrato).
    const raw = readFileSync(join(THEMES_DIR, `${name}.css`), 'utf8');
    const kept = raw.split('\n').filter((line) => {
      const m = line.match(/^\s*(--[\w-]+)\s*:/);
      return !(m && primitiveNames.has(m[1]));
    });
    // remove header/comentários do SD (as linhas de contrato não têm $description)
    stripped[name] = stripComments(kept.join('\n')) + '\n';
  }

  // 4a) tokens.css = primitivos (:root) + cada bloco de tema no seu seletor.
  const header = `/**\n * CRP Design System — tokens.css\n * GERADO automaticamente a partir de tokens/. NÃO EDITE À MÃO.\n * Fonte da verdade: Token Studio.\n */\n\n`;
  const tokensCss = header + stripComments(primitivesCss) + '\n\n' +
    Object.entries(stripped).map(([name, css]) => `/* theme: ${name} */\n${css}`).join('\n');
  writeFileSync(join(DIST, 'tokens.css'), tokensCss);

  // 4b) theme.css = ponte para o Tailwind v4 / shadcn (@theme inline).
  const contractNames = [...declaredVarNames(stripped['CRP-Light'])].map((n) => n.slice(2)); // sem '--'
  const colorNames = contractNames.filter((n) => n !== 'radius');
  const colorMap = colorNames.map((n) => `  --color-${n}: var(--${n});`).join('\n');

  const themeCss = `/**
 * CRP Design System — theme.css (Tailwind v4 + shadcn/ui)
 * GERADO automaticamente. Importe isto no seu app: import "@crp/design-tokens/theme.css";
 */
@import "tailwindcss";
@import "./tokens.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  /* cores do contrato shadcn -> utilities (bg-*, text-*, border-*) apontando p/ vars swappable */
${colorMap}

  /* raio (shadcn deriva sm/md/lg/xl a partir de --radius) */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  /* tipografia */
  --font-sans: var(--font-family-sans);
  --font-mono: var(--font-family-mono);
  --text-xs: var(--font-size-xs);
  --text-sm: var(--font-size-sm);
  --text-base: var(--font-size-base);
  --text-lg: var(--font-size-lg);
  --text-xl: var(--font-size-xl);
  --text-2xl: var(--font-size-2xl);
}
`;
  writeFileSync(join(DIST, 'theme.css'), themeCss);

  // 4c) metadados JS/TS úteis para o provider de tema no front-end.
  const brands = [...new Set($themes.filter((t) => t.group === 'Brand').map((t) => t.name))];
  const modes = [...new Set($themes.filter((t) => t.group === 'Mode').map((t) => t.name))];
  writeFileSync(join(DIST, 'tokens.js'),
    `export const brands = ${JSON.stringify(brands)};\n` +
    `export const modes = ${JSON.stringify(modes)};\n` +
    `export const themes = ${JSON.stringify(Object.keys(themes))};\n`);
  writeFileSync(join(DIST, 'tokens.d.ts'),
    `export declare const brands: string[];\n` +
    `export declare const modes: string[];\n` +
    `export declare const themes: string[];\n`);

  console.log('✅ build OK');
  console.log(`   primitivos: ${primitiveNames.size} vars`);
  console.log(`   temas: ${Object.keys(themes).join(', ')}`);
  console.log(`   contrato (por tema): ${contractNames.length} vars`);
}

main().catch((e) => { console.error('❌ build falhou:\n', e); process.exit(1); });
