// Conversão de cor — COMPARTILHADA entre export-figma.mjs e verify-figma.mjs (antes copiada
// byte a byte nos dois; mesmo risco de divergência silenciosa que motivou build/lib/css.mjs).
// NOTA (achado #2): oklchToRgb CLAMPA cada canal a 0..1 (sRGB). Cores OKLCH wide-gamut (P3) —
// ~40% das paletas, herança do Tailwind v4 — saem levemente diferentes do que o browser
// renderiza em telas P3. É intencional: o modelo de cor do Figma é sRGB. O export loga a contagem
// de clamp e o verify-figma compara os DOIS lados já clampados (por design). Ver README.

export function hexToRgb(hex) {
  let h = String(hex).replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length === 4) h = h.split('').map((c) => c + c).join('');
  return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255, a: h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 };
}

export function oklchToRgb(str) {
  const m = String(str).match(/oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([-\d.]+)\s*(?:\/\s*([\d.]+%?))?\s*\)/i);
  if (!m) return null;
  const L = m[1].endsWith('%') ? parseFloat(m[1]) / 100 : parseFloat(m[1]);
  const C = parseFloat(m[2]); const H = (parseFloat(m[3]) * Math.PI) / 180;
  const alpha = m[4] ? (m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4])) : 1;
  const a = C * Math.cos(H), b = C * Math.sin(H);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b, m_ = L - 0.1055613458 * a - 0.0638541728 * b, s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, mm = m_ ** 3, s = s_ ** 3;
  const R = 4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s;
  const G = -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s;
  const B = -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s;
  const g = (c) => { const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; return Math.min(1, Math.max(0, v)); };
  return { r: g(R), g: g(G), b: g(B), a: alpha };
}

// CSS terminal -> rgb: hex do comentário (/** #rrggbb */) tem prioridade; senão parseia oklch()/#hex.
export const cssValToRgb = (val, hex) => hex ? hexToRgb(hex) : (/^oklch/i.test(val) ? oklchToRgb(val) : (val.startsWith('#') ? hexToRgb(val) : null));

// distância Chebyshev por canal (inclui alpha) — tolerância de igualdade de cor.
export const dist = (a, b) => Math.max(Math.abs(a.r - b.r), Math.abs(a.g - b.g), Math.abs(a.b - b.b), Math.abs((a.a == null ? 1 : a.a) - (b.a == null ? 1 : b.a)));
