// Validação do output gerado (roda no CI antes de publicar).
//  - Todos os temas presentes com o seletor correto.
//  - Contrato shadcn completo em cada tema.
//  - Nenhuma referência quebrada (todo var() resolve a um valor literal).
//  - Contraste WCAG dos pares fg/bg (AA = 4.5). Falha o build em pares críticos.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse, wcagContrast } from 'culori';
import { scopesOf, makeResolve, tintOver, mixOklch } from './lib/css.mjs';

const DIST = join(process.cwd(), 'dist');
const TOKENS_CSS = join(DIST, 'tokens.css');

const EXPECTED_SELECTORS = {
  'CRP-Light (:root)': ':root',
  'CRP-Dark': '.dark',
  'MarcaB-Light': '[data-brand="marca-b"]',
  'MarcaB-Dark': '[data-brand="marca-b"].dark',
};

// Contrato shadcn que deve existir em TODO tema.
const REQUIRED = [
  'background','foreground','card','card-foreground','popover','popover-foreground',
  'primary','primary-foreground','secondary','secondary-foreground','muted','muted-foreground',
  'accent','accent-foreground','destructive','destructive-foreground','border','input','ring',
  'warning','warning-foreground','success','success-foreground','info','info-foreground',
  'link',
  'primary-text','destructive-text','warning-text','success-text','info-text',
  'radius',
  'chart-1','chart-2','chart-3','chart-4','chart-5','chart-6',
  'chart-7','chart-8','chart-9','chart-10','chart-11','chart-12',
  'sidebar','sidebar-foreground','sidebar-primary','sidebar-primary-foreground',
  'sidebar-accent','sidebar-accent-foreground','sidebar-border','sidebar-ring',
];

// Pares (foreground, background) a checar. fatal=true reprova o build.
const PAIRS = [
  ['foreground','background', true],
  ['primary-foreground','primary', true],
  ['link','background', true],
  ['link','card', true],
  // Acentos de TEXTO das variantes não-sólidas (outline/ghost/link) — AA como texto sobre bg E card, nos 4 temas.
  ['primary-text','background', true],
  ['primary-text','card', true],
  ['destructive-text','background', true],
  ['destructive-text','card', true],
  ['warning-text','background', true],
  ['warning-text','card', true],
  ['success-text','background', true],
  ['success-text','card', true],
  ['info-text','background', true],
  ['info-text','card', true],
  // Secondary não-sólido usa secondary-foreground como acento de texto (sobre bg/card).
  ['secondary-foreground','background', true],
  ['secondary-foreground','card', true],
  ['warning-foreground','warning', true],
  ['success-foreground','success', true],
  ['info-foreground','info', true],
  ['card-foreground','card', false],
  ['popover-foreground','popover', false],
  ['secondary-foreground','secondary', false],
  ['accent-foreground','accent', false],
  ['destructive-foreground','destructive', true],
  ['muted-foreground','muted', true],          // superfície REAL onde o texto muted pousa — fatal (AA)
  ['muted-foreground','background', false],
  ['sidebar-foreground','sidebar', false],
];
const AA = 4.5;

// Tipografia semântica: famílias (heading/body/mono) + amostra das escalas compostas
// (expandidas em -font-size/-line-height/-letter-spacing). Presença obrigatória por tema.
const TYPO_REQUIRED = [
  'font-heading', 'font-body', 'font-mono',
  'text-display-font-size', 'text-h1-font-size', 'text-h1-letter-spacing',
  'text-body-font-family', 'text-body-font-size', 'text-body-line-height',
  'text-label-sm-font-size', 'text-label-font-size', 'text-label-lg-font-size',
  'text-link-font-size', 'text-link-text-decoration',
  'text-code-font-family',
];

// Badges categóricos chart-1..12: exige os pares e valida contraste.
// soft (bg 100/950 + texto 800/200) = AA garantido → fatal. solid (fundo 500/400) = borderline em algumas hues → aviso.
for (let i = 1; i <= 12; i++) {
  REQUIRED.push(`chart-${i}-solid`, `chart-${i}-solid-foreground`, `chart-${i}-soft`, `chart-${i}-soft-foreground`);
  PAIRS.push([`chart-${i}-solid-foreground`, `chart-${i}-solid`, true]); // branco em shade escuro (600/700) → AA
  PAIRS.push([`chart-${i}-soft-foreground`, `chart-${i}-soft`, true]);
}

const errors = [];
const warnings = [];

if (!existsSync(TOKENS_CSS)) { console.error('❌ dist/tokens.css não existe. Rode `npm run build`.'); process.exit(1); }
const css = readFileSync(TOKENS_CSS, 'utf8');

// ----------------------------------------------------------------
// A11y de COMPORTAMENTO shippada: valida que os artefatos gerados em dist/
// existem E contêm as regras-chave. Falha o build se qualquer um faltar — o
// consumidor de @crp/design-tokens DEVE receber a a11y de comportamento, não só os tokens.
// (Cada item: caminho relativo a dist/ + lista de regex que precisam estar presentes.)
// ----------------------------------------------------------------
const A11Y_ARTIFACTS = [
  { file: 'base.css', label: 'base a11y', mustHave: [
    [/@layer\s+base/, '@layer base'],
    [/:focus-visible/, ':focus-visible'],
    [/outline:[^;]*var\(--(?:button-)?ring/, 'outline com var(--ring)'],
    [/outline-offset/, 'outline-offset'],
    [/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/, 'prefers-reduced-motion: reduce'],
    [/\[data-crp-motion="essential"\]/, 'exceção de movimento ESSENCIAL (loader não congela)'],
    [/@media\s*\(\s*forced-colors:\s*active\s*\)/, 'forced-colors: active'],
  ] },
  { file: 'components/button.css', label: 'botão', mustHave: [
    [/@layer\s+components/, '@layer components'],
    [/\.btn\b/, '.btn'],
    [/\.btn\.solid\b/, 'estilo solid'],
    [/\.btn\.outline\b/, 'estilo outline'],
    [/\.btn\.soft\b/, 'estilo soft'],
    [/\.btn\.ghost\b/, 'estilo ghost'],
    [/\.btn\.link\b/, 'estilo link'],
    [/\.btn\.intent-primary\b/, 'intent primary'],
    [/\.btn\.intent-danger\b/, 'intent danger'],
    [/\.btn:focus-visible[^{]*\{[^}]*var\(--ring\)/, 'foco usa var(--ring)'],
    [/\.btn\[aria-disabled="true"\]/, 'estado aria-disabled'],
    [/\.btn\.is-loading\b/, 'estado loading'],
    [/\.btn-spinner\b/, 'spinner de loading'],
    [/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/, 'prefers-reduced-motion: reduce'],
    [/@media\s*\(\s*forced-colors:\s*active\s*\)/, 'forced-colors: active'],
  ] },
  { file: 'components/button.js', label: 'guard JS', mustHave: [
    [/\[aria-disabled="true"\]/, 'seletor aria-disabled'],
    [/addEventListener\(\s*['"]click['"][\s\S]*?,\s*true\s*\)/, "listener de click em fase de captura (true)"],
    [/preventDefault\(\)/, 'preventDefault()'],
    [/stopImmediatePropagation\(\)/, 'stopImmediatePropagation()'],
  ] },
];

const a11yErrors = [];
for (const { file, label, mustHave } of A11Y_ARTIFACTS) {
  const path = join(DIST, file);
  if (!existsSync(path)) { a11yErrors.push(`A11Y artefato ausente: dist/${file} (${label}). Rode \`npm run build\`.`); continue; }
  const txt = readFileSync(path, 'utf8');
  if (!/GERADO/.test(txt)) a11yErrors.push(`A11Y dist/${file}: header "GERADO" ausente (deve ser gerado pelo build, não editado à mão).`);
  for (const [re, desc] of mustHave) {
    if (!re.test(txt)) a11yErrors.push(`A11Y dist/${file} (${label}): regra ausente — ${desc}.`);
  }
}

// ----------------------------------------------------------------
// USO-DE-COR (texto) — varredura das FONTES (preview/ + src/).
// Um TOKEN de PREENCHIMENTO (primary/secondary/destructive/warning/success/info) NÃO pode
// ser usado como `color:` de TEXTO: no dark ele é um shade escuro e reprova AA como texto
// (ex.: erro com --destructive = red.600 → 3.64 sobre o card). O texto dessas variantes usa
// o token *-text (mode-aware). ÚNICA exceção legítima: texto pousando sobre o PRÓPRIO
// *-foreground (contraste = par já validado, simétrico → AA garantido) — detectado quando a
// MESMA linha define background var(--X-foreground) (caso avatar/logo, single-line).
// O check de TOKEN não pega isto (o token está certo; o USO é que está errado). FATAL.
// ----------------------------------------------------------------
const FILL_TOKENS = ['primary', 'secondary', 'destructive', 'warning', 'success', 'info'];
const LINT_DIRS = ['preview', 'src/components', 'src/a11y'];
const usageErrors = [];
for (const dir of LINT_DIRS) {
  const abs = join(process.cwd(), dir);
  if (!existsSync(abs)) continue;
  for (const file of readdirSync(abs)) {
    if (!/\.(html|css)$/.test(file)) continue;
    const lines = readFileSync(join(abs, file), 'utf8').split('\n');
    lines.forEach((ln, i) => {
      for (const tok of FILL_TOKENS) {
        // (?<![-\w]) garante a PROPRIEDADE `color` (exclui border-color/background-color/color-mix).
        if (!new RegExp(`(?<![-\\w])color\\s*:\\s*var\\(--${tok}\\)`).test(ln)) continue;
        const onOwnFg = new RegExp(`background(-color)?\\s*:\\s*var\\(--${tok}-foreground\\)`).test(ln);
        if (!onOwnFg) usageErrors.push(`USO-DE-COR ${dir}/${file}:${i + 1} — color: var(--${tok}) como texto; use var(--${tok}-text) (--${tok} é PREENCHIMENTO, reprova AA como texto no dark).`);
      }
    });
  }
}

// Parsing/resolução/composição compartilhados (build/lib/css.mjs).
const bySelector = scopesOf(css);
const rootMap = bySelector[':root'] || {};
const resolve = makeResolve(rootMap);
const blockCount = Object.keys(bySelector).length;

// Variantes SOFT do button: o TEXTO (accent-text) fica sobre uma tinta = color-mix(accent, transparent) sobre a superfície.
// Validamos o resultado REAL contra bg E card (a card no dark é mais clara → pior caso). fatal.
const SOFT_INTENTS = [
  ['primary-text', 'primary-text'],
  ['destructive-text', 'destructive-text'],
  ['warning-text', 'warning-text'],
  ['success-text', 'success-text'],
  ['info-text', 'info-text'],
  ['secondary-foreground', 'secondary-foreground'],
];

// 1) Seletores presentes
for (const [label, sel] of Object.entries(EXPECTED_SELECTORS)) {
  if (!bySelector[sel]) errors.push(`Seletor ausente: ${label} (${sel})`);
}

// 2) Contrato completo + 3) refs resolvem + 4) contraste, por tema
for (const [label, sel] of Object.entries(EXPECTED_SELECTORS)) {
  const scope = bySelector[sel];
  if (!scope) continue;
  for (const name of REQUIRED) {
    if (!(`--${name}` in scope)) errors.push(`[${label}] contrato faltando: --${name}`);
  }
  for (const name of TYPO_REQUIRED) {
    if (!(`--${name}` in scope)) errors.push(`[${label}] tipografia faltando: --${name}`);
  }
  // refs quebradas
  for (const [k, v] of Object.entries(scope)) {
    const r = resolve(v, scope);
    if (typeof r === 'string' && r.startsWith('var(')) errors.push(`[${label}] referência não resolvida: ${k} -> ${v}`);
  }
  // contraste
  for (const [fg, bg, fatal] of PAIRS) {
    const fgv = resolve(scope[`--${fg}`], scope);
    const bgv = resolve(scope[`--${bg}`], scope);
    const ca = parse(fgv), cb = parse(bgv);
    if (!ca || !cb) { warnings.push(`[${label}] não consegui parsear cor p/ ${fg}/${bg} (${fgv} / ${bgv})`); continue; }
    const ratio = wcagContrast(ca, cb);
    const ok = ratio >= AA;
    const msg = `[${label}] ${fg}/${bg} = ${ratio.toFixed(2)}:1 ${ok ? 'OK' : '< ' + AA}`;
    if (!ok && fatal) errors.push('CONTRASTE ' + msg);
    else if (!ok) warnings.push('contraste ' + msg);
  }
}

// 5) Variantes SOFT do button — texto (accent-text) sobre a tinta real do MESMO accent.
//    A tinta = color-mix(accent-text, transparent) na opacidade --state-soft, compositada sobre bg e card.
for (const [label, sel] of Object.entries(EXPECTED_SELECTORS)) {
  const scope = bySelector[sel];
  if (!scope) continue;
  const softPct = parseFloat(resolve(scope['--state-soft'], scope));
  if (!(softPct >= 0)) { warnings.push(`[${label}] não consegui ler --state-soft`); continue; }
  for (const [textTok] of SOFT_INTENTS) {
    const accent = resolve(scope[`--${textTok}`], scope);
    for (const surf of ['background', 'card']) {
      const surfV = resolve(scope[`--${surf}`], scope);
      const tint = tintOver(accent, softPct, surfV);
      if (!tint) { warnings.push(`[${label}] soft: não consegui compor tinta p/ ${textTok} sobre ${surf}`); continue; }
      const ratio = wcagContrast(parse(accent), parse(tint));
      const ok = ratio >= AA;
      if (!ok) errors.push(`CONTRASTE [${label}] soft ${textTok} sobre tinta(${surf}) = ${ratio.toFixed(2)}:1 < ${AA}`);
    }
  }
}

// 6) WCAG 1.4.11 — contraste NÃO-TEXTUAL (>= 3:1) dos limites que comunicam o controle:
//    (a) BORDA do outline em repouso = color-mix(in oklch, TINT calc(state-border*100%), transparent)
//        compositada sobre a superfície (bg E card) → contra a própria superfície.
//    (b) ANEL de foco (--ring), opaco, contra bg E card (o anel fica no offset, sobre a superfície).
//    Os tints do outline são os MESMOS accents de texto por intent.
const NONTEXT = 3.0;
// (intent -> token de tint usado como borda do outline; espelha o mapa --_tint no button.html)
const OUTLINE_TINTS = ['primary-text', 'secondary-foreground', 'destructive-text', 'warning-text', 'success-text', 'info-text'];
for (const [label, sel] of Object.entries(EXPECTED_SELECTORS)) {
  const scope = bySelector[sel];
  if (!scope) continue;
  const borderPct = parseFloat(resolve(scope['--state-border'], scope));
  if (!(borderPct >= 0)) { warnings.push(`[${label}] não consegui ler --state-border`); }
  else {
    for (const tintTok of OUTLINE_TINTS) {
      const tint = resolve(scope[`--${tintTok}`], scope);
      for (const surf of ['background', 'card']) {
        const surfV = resolve(scope[`--${surf}`], scope);
        const border = tintOver(tint, borderPct, surfV); // mesma composição do soft (mix sobre opaca)
        if (!border) { warnings.push(`[${label}] outline: não consegui compor borda p/ ${tintTok} sobre ${surf}`); continue; }
        const ratio = wcagContrast(parse(border), parse(surfV));
        if (ratio < NONTEXT) errors.push(`NÃO-TEXTUAL [${label}] outline-border ${tintTok}/${surf} = ${ratio.toFixed(2)}:1 < ${NONTEXT} (1.4.11)`);
      }
    }
  }
  // (b) anel de foco contra as superfícies
  const ring = resolve(scope['--ring'], scope);
  for (const surf of ['background', 'card']) {
    const surfV = resolve(scope[`--${surf}`], scope);
    const ratio = wcagContrast(parse(ring), parse(surfV));
    if (ratio < NONTEXT) errors.push(`NÃO-TEXTUAL [${label}] ring/${surf} = ${ratio.toFixed(2)}:1 < ${NONTEXT} (1.4.11)`);
  }
}

// 7) Layering (z-index) — contrato de camadas presente e em ordem CRESCENTE (base < … < tooltip).
//    Overlays empilham nesta ordem; fora de ordem = bug visual (ex.: tooltip atrás do modal).
const LAYER_ORDER = ['layer-base', 'layer-raised', 'layer-dropdown', 'layer-sticky', 'layer-fixed', 'layer-overlay', 'layer-modal', 'layer-popover', 'layer-toast', 'layer-tooltip'];
{
  const scope = bySelector[':root'] || {};
  let prev = -Infinity, prevName = null;
  for (const name of LAYER_ORDER) {
    const raw = resolve(scope[`--${name}`], scope);
    if (raw === undefined || raw === null) { errors.push(`LAYER faltando: --${name}`); continue; }
    const n = parseFloat(raw);
    if (isNaN(n)) { errors.push(`LAYER inválido (não numérico): --${name} = ${raw}`); continue; }
    if (n < prev) errors.push(`LAYER fora de ordem: --${name} (${n}) deveria ser > --${prevName} (${prev})`);
    prev = n; prevName = name;
  }
}

// 8) Coerência marcas/temas — tokens/$themes.json (SSOT) deve concordar com EXPECTED_SELECTORS.
//    Trava o bug clássico de adicionar uma marca e esquecer de mapear o seletor num arquivo de build.
{
  const $themes = JSON.parse(readFileSync(join(process.cwd(), 'tokens', '$themes.json'), 'utf8'));
  const brands = [...new Set($themes.filter((t) => t.group === 'Brand').map((t) => t.name))];
  const modes = [...new Set($themes.filter((t) => t.group === 'Mode').map((t) => t.name))];
  const themeNameOf = (key) => key.replace(/\s*\(.*\)\s*$/, '').trim(); // tira o sufixo " (:root)"
  const selectorThemeNames = Object.keys(EXPECTED_SELECTORS).map(themeNameOf);
  // (a) todo brand×mode do $themes precisa de um seletor mapeado
  for (const b of brands)
    for (const m of modes)
      if (!selectorThemeNames.includes(`${b}-${m}`))
        errors.push(`COERÊNCIA: tema ${b}-${m} existe em tokens/$themes.json mas falta seletor em check/build (EXPECTED_SELECTORS).`);
  // (b) nenhum seletor órfão (brand/mode sem correspondente no $themes)
  for (const name of selectorThemeNames) {
    const [brand, mode] = name.split('-');
    if (!brands.includes(brand)) errors.push(`COERÊNCIA: seletor "${name}" não tem brand "${brand}" em tokens/$themes.json.`);
    if (mode && !modes.includes(mode)) errors.push(`COERÊNCIA: seletor "${name}" não tem mode "${mode}" em tokens/$themes.json.`);
  }
  console.log(`Coerência marcas/temas: ${brands.length} marca(s) × ${modes.length} modo(s) vs ${selectorThemeNames.length} seletor(es)`);
}

// Mescla as falhas de presença a11y e de USO-DE-COR nas falhas gerais (mesma severidade).
errors.push(...a11yErrors, ...usageErrors);

console.log(`\nVerificação do Design System (${blockCount} seletores, ${Object.keys(rootMap).length} declarações em :root)`);
console.log(`A11y shippada: ${A11Y_ARTIFACTS.length} artefatos verificados (base.css, components/button.css, components/button.js)`);
console.log(`Uso-de-cor (texto): ${LINT_DIRS.join(', ')} varridos — ${usageErrors.length} uso(s) de cor de preenchimento como texto`);
if (warnings.length) { console.log('\n⚠ Avisos:'); warnings.forEach((w) => console.log('  - ' + w)); }
if (errors.length) {
  console.log('\n❌ Erros:'); errors.forEach((e) => console.log('  - ' + e));
  process.exit(1);
}
console.log('\n✅ check OK — contrato completo, refs resolvidas, contraste crítico AA, coerência marcas/temas, a11y de comportamento presente no dist.');
