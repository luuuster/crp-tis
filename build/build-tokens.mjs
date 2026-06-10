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
import { register, permutateThemes, expandTypesMap } from '@tokens-studio/sd-transforms';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { loadThemes } from './lib/themes.mjs';

const ROOT = process.cwd();
const TOKENS = join(ROOT, 'tokens');
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');
const THEMES_DIR = join(DIST, 'themes');

register(StyleDictionary);

// Cada theme (brand×mode) do Token Studio -> um seletor CSS — DERIVADO de tokens/$themes.json
// (build/lib/themes.mjs): dark via classe `.dark` (padrão shadcn/next-themes); marca via
// [data-brand]; marca default (1ª do grupo Brand) sem atributo. Adicionar marca = editar SÓ o $themes.
const SELECTOR = loadThemes(ROOT).selectorsByTheme;

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

// Artefatos de a11y AUTORADOS (src/) — não derivam de token via Style Dictionary.
// O build LÊ o fonte e ESCREVE em dist/ com um header "GERADO" (nunca edite dist/ à mão).
// O fonte continua sendo a fonte da verdade desses CSS/JS; o dist/ é a cópia shippada.
function gerHeader(srcRel) {
  // /** */ vale tanto p/ CSS quanto p/ JS — header único.
  const body =
    `CRP Design System — GERADO a partir de ${srcRel}. NÃO EDITE À MÃO.\n` +
    `Fonte da verdade: ${srcRel}. Regenerado por build/build-tokens.mjs (npm run build).`;
  return `/**\n * ${body.replace(/\n/g, '\n * ')}\n */\n`;
}
function emitAuthored(srcRel, distRel) {
  const srcPath = join(SRC, srcRel);
  if (!existsSync(srcPath)) throw new Error(`Fonte autorada ausente: src/${srcRel} (necessária p/ gerar dist/${distRel}).`);
  const distPath = join(DIST, distRel);
  mkdirSync(dirname(distPath), { recursive: true });
  const source = readFileSync(srcPath, 'utf8').replace(/^﻿/, '');
  writeFileSync(distPath, gerHeader(`src/${srcRel}`) + '\n' + source);
  return distRel;
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

// Nomes (kebab) dos tokens de CONTRATO do tipo color — base do @theme inline (--color-*).
// Tokens de contrato não-cor (radius, inset, gap, state, opacity, elevation, button-*) NÃO viram --color-*.
function colorContractNames(setNames) {
  const names = new Set();
  for (const s of setNames) {
    if (s.startsWith('core/')) continue; // primitivos não são contrato
    const file = join(TOKENS, `${s}.json`);
    if (!existsSync(file)) continue;
    (function walk(node, prefix, inherited) {
      if (!node || typeof node !== 'object') return;
      const type = typeof node.$type === 'string' ? node.$type : inherited;
      if ('$value' in node) { if (type === 'color') names.add(prefix.join('-')); return; }
      for (const k of Object.keys(node)) { if (k.startsWith('$')) continue; walk(node[k], prefix.concat(k), type); }
    })(JSON.parse(readFileSync(file, 'utf8')), [], undefined);
  }
  return names;
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
      // Expande SÓ os compostos de tipografia (DTCG `typography`) em props individuais
      // (--text-h1-font-size, -line-height, -letter-spacing, …) preservando o letterSpacing
      // — que o shorthand `font` do CSS descartaria. boxShadow/border NÃO expandem.
      expand: { typesMap: expandTypesMap, include: ['typography'] },
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
  // primitives.css era só intermediário (os primitivos já estão embutidos em tokens.css acima);
  // remove p/ não deixar artefato não-exportado/não-documentado no dist (achado #14).
  rmSync(join(DIST, 'primitives.css'), { force: true });

  // 4b) theme.css = ponte para o Tailwind v4 / shadcn (@theme inline).
  const contractNames = [...declaredVarNames(stripped['CRP-Light'])].map((n) => n.slice(2)); // sem '--'
  // só tokens de contrato COLOR viram --color-* (senão inset/gap/state/elevation/button virariam utilitário de cor).
  const colorMap = [...colorContractNames(themes['CRP-Light'])].map((n) => `  --color-${n}: var(--${n});`).join('\n');

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

  /* raio: escala vinda do contrato (radius-* → radii.*), não mais calc-offset */
  --radius-sm: var(--radius-sm);
  --radius-md: var(--radius-md);
  --radius-lg: var(--radius-lg);
  --radius-xl: var(--radius-xl);
  --radius-2xl: var(--radius-2xl);

  /* z-index / camadas (overlays) — vira utilitário z-* do Tailwind (z-modal, z-tooltip…) */
  --z-base: var(--layer-base);
  --z-raised: var(--layer-raised);
  --z-dropdown: var(--layer-dropdown);
  --z-sticky: var(--layer-sticky);
  --z-fixed: var(--layer-fixed);
  --z-overlay: var(--layer-overlay);
  --z-modal: var(--layer-modal);
  --z-popover: var(--layer-popover);
  --z-toast: var(--layer-toast);
  --z-tooltip: var(--layer-tooltip);

  /* tipografia — famílias semânticas (heading=Inter, body=Source Sans 3); sans default = body */
  --font-sans: var(--font-body);
  --font-heading: var(--font-heading);
  --font-body: var(--font-body);
  --font-mono: var(--font-mono);
  --text-xs: var(--font-size-xs);
  --text-sm: var(--font-size-sm);
  --text-base: var(--font-size-base);
  --text-lg: var(--font-size-lg);
  --text-xl: var(--font-size-xl);
  --text-2xl: var(--font-size-2xl);

  /* motion — utilities ease-*/animate-* e a transição default seguem o DS, não os
     defaults do Tailwind (hoje coincidem; se o DS divergir, as utilities acompanham).
     Os nomes de keyframes (spin/ping/pulse/bounce) são os do Tailwind — keyframes built-in
     continuam valendo; só os VALORES passam a vir dos tokens. */
  --ease-in: var(--ease-in);
  --ease-out: var(--ease-out);
  --ease-in-out: var(--ease-in-out);
  --default-transition-duration: var(--duration-default);
  --default-transition-timing-function: var(--ease-default);
  --animate-spin: var(--animate-spin);
  --animate-ping: var(--animate-ping);
  --animate-pulse: var(--animate-pulse);
  --animate-bounce: var(--animate-bounce);
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

  // 5) A11y de COMPORTAMENTO (artefatos autorados em src/) -> dist/ com header "GERADO".
  //    Camada base agnóstica + componente botão (CSS) + guard JS. Consumidos pelo app E
  //    pelos previews (a demo prova o artefato shippado; nada de CSS/JS duplicado).
  const a11yOut = [
    emitAuthored('a11y/base.css', 'base.css'),
    emitAuthored('components/button.css', 'components/button.css'),
    emitAuthored('components/button.js', 'components/button.js'),
  ];

  console.log('✅ build OK');
  console.log(`   primitivos: ${primitiveNames.size} vars`);
  console.log(`   temas: ${Object.keys(themes).join(', ')}`);
  console.log(`   contrato (por tema): ${contractNames.length} vars`);
  console.log(`   a11y (autorado -> dist): ${a11yOut.map((p) => 'dist/' + p).join(', ')}`);
}

main().catch((e) => { console.error('❌ build falhou:\n', e); process.exit(1); });
