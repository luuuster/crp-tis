// Parsing de CSS gerado + resolução de var() + composição de color-mix — COMPARTILHADO
// entre check.mjs e audit-dark.mjs (antes duplicado nos dois; divergência silenciosa era
// questão de tempo). Opera sobre dist/tokens.css (output do build), não sobre as fontes.
import { parse, wcagContrast, formatHex, converter, interpolate } from 'culori';

// Parse de blocos: [{ selector, decls: { '--name': value } }]
export function parseBlocks(text) {
  const blocks = [];
  const re = /([^{}\/]+)\{([^}]*)\}/g; // seletor { ...decls... }
  for (const m of text.matchAll(re)) {
    const selector = m[1].trim().split('\n').pop().trim();
    const decls = {};
    for (const d of m[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) decls[d[1]] = d[2].trim();
    if (Object.keys(decls).length) blocks.push({ selector, decls });
  }
  return blocks;
}

// Mescla blocos repetidos do mesmo seletor: { selector -> { '--name': value } }
export function scopesOf(cssText) {
  const bySelector = {};
  for (const b of parseBlocks(cssText)) {
    (bySelector[b.selector] ||= {});
    Object.assign(bySelector[b.selector], b.decls);
  }
  return bySelector;
}

// Resolve var(--x) até o literal, com fallback do escopo do tema para :root (cascata real).
export function makeResolve(rootMap) {
  return function resolve(value, scope, depth = 0) {
    if (!value) return value;
    if (depth > 10) {
      // Estouro do limite (ciclo ou cadeia >10 níveis): antes retornava o var() não resolvido
      // em SILÊNCIO. Agora avisa — o check.mjs já reprova a ref não resolvida, mas o warn aponta
      // ONDE travou. (Não é fatal aqui; deixa o gate downstream decidir.)
      if (/^var\(/.test(String(value))) console.warn(`⚠ resolve: profundidade >10 em "${value}" — ciclo ou cadeia longa de var()?`);
      return value;
    }
    const m = String(value).match(/^var\((--[\w-]+)\)$/);
    if (!m) return value;
    return resolve(scope[m[1]] ?? rootMap[m[1]], scope, depth + 1);
  };
}

export const contrast = (a, b) => wcagContrast(parse(a), parse(b));

const toRgb = converter('rgb');

// Composita color-mix(in oklch, ACCENT P%, transparent) sobre uma SURFACE opaca.
// transparent contribui só com alpha (interpolação premultiplicada), então o canal de cor
// é o do accent e o alpha = P; o "over" acontece em sRGB (como o browser composita),
// p/ luminância fiel ao wcagContrast.
export function tintOver(accentValue, pct, surfaceValue) {
  const a = toRgb(parse(accentValue)), s = toRgb(parse(surfaceValue));
  if (!a || !s) return null;
  const mix = (c1, c2) => c1 * pct + c2 * (1 - pct);
  return formatHex({ mode: 'rgb', r: mix(a.r, s.r), g: mix(a.g, s.g), b: mix(a.b, s.b) });
}

// color-mix(in oklch, BASE, OVERLAY P%) entre duas cores OPACAS — interpolação em OKLCH
// de verdade (é o que o browser faz no hover do .btn.solid), não uma média em sRGB.
export function mixOklch(baseValue, overlayValue, pct) {
  const a = parse(baseValue), b = parse(overlayValue);
  if (!a || !b) return null;
  return formatHex(toRgb(interpolate([a, b], 'oklch')(pct)));
}
