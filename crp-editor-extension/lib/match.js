/* CRP Inspector — lógica PURA de casamento token↔valor + geração de redline.
 * Sem DOM: recebe valores já normalizados (hex sRGB, px, weight). A normalização (canvas, computed
 * style) mora no content script. Roda no navegador (define globalThis.CRPMatch) e é testável em node
 * (build/.. test lê este arquivo e avalia — mesmo padrão do figma-plugin). */
(function () {
  // ---- cor: sRGB → OKLab (perceptual) p/ distância tipo ΔE ----
  function hexToRgb(hex) {
    let h = String(hex).replace('#', '').trim();
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }
  const srgbLin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  function srgbToOklab({ r, g, b }) {
    const lr = srgbLin(r), lg = srgbLin(g), lb = srgbLin(b);
    const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
    const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
    const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
    const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
    return {
      L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
      a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
      b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
    };
  }
  // ΔE OKLab ≈ distância euclidiana (0 = igual; ~0.02 já é perceptível).
  function colorDist(hexA, hexB) {
    const A = srgbToOklab(hexToRgb(hexA)), B = srgbToOklab(hexToRgb(hexB));
    return Math.hypot(A.L - B.L, A.a - B.a, A.b - B.b);
  }
  const EXACT = 0.012; // tolerância de "é o mesmo token" (arredondamento de hex/rgb)

  // Casa um hex contra { nome: hex }. Retorna { name, hex, dist, exact }.
  function nearestColor(hex, colorMap) {
    let best = null;
    for (const name in colorMap) {
      const d = colorDist(hex, colorMap[name]);
      if (!best || d < best.dist) best = { name, hex: colorMap[name], dist: d };
    }
    if (best) best.exact = best.dist <= EXACT;
    return best;
  }

  // raio em px contra { nome: px }. Exato se diferença < 0.5px.
  function nearestRadius(px, radiiMap) {
    let best = null;
    for (const name in radiiMap) {
      const d = Math.abs(px - radiiMap[name]);
      if (!best || d < best.dist) best = { name, px: radiiMap[name], dist: d };
    }
    if (best) best.exact = best.dist < 0.5;
    return best;
  }

  // tipografia: role mais próximo por TAMANHO (desempate por peso). typo = { role: {sizePx, weight} }.
  function nearestType(sizePx, weight, typo) {
    let best = null;
    for (const role in typo) {
      const t = typo[role];
      const dSize = Math.abs(sizePx - t.sizePx);
      const dWeight = weight && t.weight ? Math.abs(weight - t.weight) / 100 : 0;
      const dist = dSize + dWeight * 0.5; // tamanho domina
      if (!best || dist < best.dist) best = { role, sizePx: t.sizePx, weight: t.weight, dist, dSize };
    }
    if (best) best.exact = best.dSize < 0.5;
    return best;
  }

  // ---- redline: lista de mudanças → Markdown (pro front) + bloco pra IA ----
  // changes: [{ selector, kind: 'cor'|'raio'|'tipografia'|'espaço', prop, from, to, token }]
  function buildRedline(changes, ctx) {
    ctx = ctx || {};
    const url = ctx.url ? ` (${ctx.url})` : '';
    if (!changes || !changes.length) return { markdown: '_Nenhuma alteração._', ai: 'Nenhuma alteração.' };

    const byEl = new Map();
    for (const c of changes) {
      if (!byEl.has(c.selector)) byEl.set(c.selector, []);
      byEl.get(c.selector).push(c);
    }
    const line = (c) => `${c.prop}: \`${c.from}\` → \`${c.token || c.to}\``;

    const md = [`# Redline CRP${url}`, '', 'Aplique usando os **tokens do design system** (não valores crus):', ''];
    for (const [sel, cs] of byEl) {
      md.push(`### \`${sel}\``);
      for (const c of cs) md.push(`- ${line(c)}`);
      md.push('');
    }

    const ai = [
      `Você é um dev front-end no design system CRP. Aplique EXATAMENTE estas mudanças na tela${url},`,
      `usando os tokens do CRP (CSS custom properties / classes ty-*), nunca valores hardcoded:`,
      '',
      ...[...byEl].flatMap(([sel, cs]) => [
        `Elemento ${sel}:`,
        ...cs.map((c) => `  - ${c.prop}: usar ${c.token || c.to} (estava ${c.from})`),
      ]),
      '',
      'Se um valor não tiver token exato, use o token mais próximo indicado e comente o porquê.',
    ].join('\n');

    return { markdown: md.join('\n'), ai };
  }

  const CRPMatch = { hexToRgb, srgbToOklab, colorDist, nearestColor, nearestRadius, nearestType, buildRedline, EXACT };
  if (typeof globalThis !== 'undefined') globalThis.CRPMatch = CRPMatch;
})();
