// Validação do output gerado (roda no CI antes de publicar).
//  - Todos os temas presentes com o seletor correto.
//  - Contrato shadcn completo em cada tema.
//  - Nenhuma referência quebrada (todo var() resolve a um valor literal).
//  - Contraste WCAG dos pares fg/bg (AA = 4.5). Falha o build em pares críticos.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse, wcagContrast } from 'culori';
import { scopesOf, makeResolve, tintOver, mixOklch } from './lib/css.mjs';
import { loadThemes } from './lib/themes.mjs';

const DIST = join(process.cwd(), 'dist');
const TOKENS_CSS = join(DIST, 'tokens.css');

// Temas/seletores DERIVADOS de tokens/$themes.json (build/lib/themes.mjs) — a mesma fonte
// que o build usa. Coerência SSOT→dist por construção: marca nova no $themes aparece aqui
// automaticamente e a seção 1 reprova se o dist não tiver o seletor correspondente.
const SSOT = loadThemes();
const EXPECTED_SELECTORS = Object.fromEntries(
  SSOT.themes.map((t) => [t.selector === ':root' ? `${t.name} (:root)` : t.name, t.selector])
);

// Contrato shadcn que deve existir em TODO tema.
const REQUIRED = [
  'background','foreground','card','card-foreground','popover','popover-foreground',
  'primary','primary-foreground','secondary','secondary-foreground','muted','muted-foreground',
  'accent','accent-foreground','destructive','destructive-foreground','border','input','ring',
  'surface-ring',
  'warning','warning-foreground','success','success-foreground','info','info-foreground',
  'link',
  'primary-text','secondary-text','destructive-text','warning-text','success-text','info-text',
  'radius',
  'chart-1','chart-2','chart-3','chart-4','chart-5','chart-6',
  'chart-7','chart-8','chart-9','chart-10','chart-11','chart-12',
  'sidebar','sidebar-foreground','sidebar-primary','sidebar-primary-foreground',
  'sidebar-accent','sidebar-accent-foreground','sidebar-border','sidebar-ring',
  // Camada de interação — o button.css depende deles; ausência = estados quebrados (e a
  // validação de estados compostos da seção 5b seria pulada em silêncio). FATAL.
  'state-hover','state-active','state-border','state-soft','state-soft-active',
  'state-veil-darken','state-veil-lighten',
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
  // Secondary não-sólido (outline/ghost/soft) usa secondary-text (roxo) como acento — AA sobre bg E card.
  ['secondary-text','background', true],
  ['secondary-text','card', true],
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
    [/@media\s*\(\s*prefers-contrast:\s*more\s*\)/, 'prefers-contrast: more'],
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
    [/@media\s*\(\s*prefers-contrast:\s*more\s*\)/, 'prefers-contrast: more'],
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
// AUTO-DESCOBERTA DE COMPONENTES — fecha o ponto-cego do A11Y_ARTIFACTS hardcoded.
// Todo dist/components/*.css emitido pelo build DEVE ter uma entrada em A11Y_ARTIFACTS (que
// exige foco/reduced-motion/forced-colors + header GERADO). Um componente novo sem contrato
// reprova AQUI — nunca passa em silêncio (a11y-bar: WCAG AA fatal no check).
// ----------------------------------------------------------------
const COMPONENTS_DIR = join(DIST, 'components');
const A11Y_COVERED = new Set(A11Y_ARTIFACTS.map(({ file }) => file)); // ex.: 'components/button.css'
if (existsSync(COMPONENTS_DIR)) {
  for (const f of readdirSync(COMPONENTS_DIR)) {
    if (!f.endsWith('.css')) continue; // só os CSS de componente (o .js tem sua própria entrada)
    const rel = `components/${f}`;
    if (!A11Y_COVERED.has(rel))
      a11yErrors.push(`A11Y dist/${rel}: componente novo SEM contrato em A11Y_ARTIFACTS (check.mjs). Adicione foco/reduced-motion/forced-colors + par de contraste antes de shippar.`);
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
  ['secondary-text', 'secondary-text'],
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

  // 4b) SÉRIE GRÁFICA chart-1..12 como OBJETO GRÁFICO (linhas/barras/fatias) sobre as superfícies:
  //     WCAG 1.4.11 exige ≥3:1 contra a cor adjacente. Os PAIRS acima cobrem o uso como BADGE
  //     (texto sobre fill); este bloco cobre o uso como gráfico — foi exatamente o furo da
  //     auditoria rev5 (chart-3/4/6/8/9/11 @500 mediam 1.96–2.83:1 no light). FATAL.
  const GRAPHIC_MIN = 3.0; // 1.4.11 (mesmo valor de NONTEXT, declarada mais abaixo — TDZ impede usá-la aqui)
  for (let i = 1; i <= 12; i++) {
    const serie = resolve(scope[`--chart-${i}`], scope);
    const cs = parse(serie);
    if (!cs) { warnings.push(`[${label}] não consegui parsear --chart-${i} (${serie})`); continue; }
    for (const surf of ['background', 'card']) {
      const sv = parse(resolve(scope[`--${surf}`], scope));
      if (!sv) continue;
      const ratio = wcagContrast(cs, sv);
      if (ratio < GRAPHIC_MIN) errors.push(`CONTRASTE-GRÁFICO [${label}] chart-${i}/${surf} = ${ratio.toFixed(2)}:1 < ${GRAPHIC_MIN} (série de gráfico precisa de 3:1 — WCAG 1.4.11)`);
    }
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

// 5b) ESTADOS COMPOSTOS do button (:hover/:active) — espelha src/components/button.css. FATAL.
//     O repouso passar NÃO garante o estado: o véu/tinta pode comer a margem AA (era o caso:
//     92 combinações reprovavam antes do redesenho dos estados).
//     solid: fg sobre color-mix(in oklch, bg, VÉU p%) — véu por intent (darken; warning = lighten,
//            sempre na direção OPOSTA ao fg). outline/ghost: texto sobre tinta própria 10% (hover)
//            e state-soft 15% (active). soft: hover mantém a tinta de repouso (validada na seção 5,
//            o feedback é o contorno --_tint, coberto pelos PAIRS 4.5 > 3:1); active = tinta
//            state-soft-active. Teto medido da tinta própria ≈ 16% (pior caso dark/success/card).
const SOLID_INTENTS = [
  // [fg, bg, véu] — espelha .btn.intent-* (--_fg/--_bg/--_veil)
  ['primary-foreground', 'primary', 'darken'],
  ['secondary-foreground', 'secondary', 'darken'],
  ['destructive-foreground', 'destructive', 'darken'],
  ['warning-foreground', 'warning', 'lighten'],
  ['success-foreground', 'success', 'darken'],
  ['info-foreground', 'info', 'darken'],
];
for (const [label, sel] of Object.entries(EXPECTED_SELECTORS)) {
  const scope = bySelector[sel];
  if (!scope) continue;
  const R = (t) => resolve(scope[`--${t}`], scope);
  const P = (t) => parseFloat(R(t));
  const veils = { darken: R('state-veil-darken'), lighten: R('state-veil-lighten') };
  const STATES_SOLID = [['hover', P('state-hover')], ['active', P('state-active')]];
  const STATES_TINT = [
    ['outline/ghost:hover', P('state-hover')],
    ['outline/ghost:active', P('state-soft')],
    ['soft:active', P('state-soft-active')],
  ];
  if (!veils.darken || !veils.lighten || STATES_SOLID.some(([, p]) => !(p >= 0)) || STATES_TINT.some(([, p]) => !(p >= 0))) {
    warnings.push(`[${label}] estados: tokens state-* ausentes/ilegíveis — estados compostos não validados`);
    continue;
  }
  // solid hover/active: fg sobre o fundo com véu (mix OKLCH real, como o browser)
  for (const [fgT, bgT, veil] of SOLID_INTENTS) {
    for (const [st, p] of STATES_SOLID) {
      const mixed = mixOklch(R(bgT), veils[veil], p);
      if (!mixed) { warnings.push(`[${label}] estados: não compus solid:${st} de ${bgT}`); continue; }
      const ratio = wcagContrast(parse(R(fgT)), parse(mixed));
      if (ratio < AA) errors.push(`ESTADO [${label}] solid:${st} ${fgT}/${bgT}+véu-${veil} = ${ratio.toFixed(2)}:1 < ${AA}`);
    }
  }
  // translúcidas: texto-accent sobre a tinta da PRÓPRIA cor, compositada sobre bg e card
  for (const [textTok] of SOFT_INTENTS) {
    const text = R(textTok);
    for (const [st, p] of STATES_TINT) {
      for (const surf of ['background', 'card']) {
        const tinted = tintOver(text, p, R(surf));
        if (!tinted) { warnings.push(`[${label}] estados: não compus ${st} de ${textTok} sobre ${surf}`); continue; }
        const ratio = wcagContrast(parse(text), parse(tinted));
        if (ratio < AA) errors.push(`ESTADO [${label}] ${st} ${textTok}/tinta(${surf}) = ${ratio.toFixed(2)}:1 < ${AA}`);
      }
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
const OUTLINE_TINTS = ['primary-text', 'secondary-text', 'destructive-text', 'warning-text', 'success-text', 'info-text'];
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

// 8) Coerência marcas/temas — agora POR CONSTRUÇÃO: build e check derivam os seletores da
//    MESMA fonte (tokens/$themes.json via build/lib/themes.mjs); a seção 1 reprova se o dist
//    não materializar qualquer tema do SSOT. Não há mais mapa hardcoded p/ divergir.
console.log(`Coerência marcas/temas: ${SSOT.brands.length} marca(s) × ${SSOT.modes.length} modo(s) = ${SSOT.themes.length} tema(s), seletores derivados do $themes.json`);

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
