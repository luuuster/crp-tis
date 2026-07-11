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
  // Tolerância de "é o MESMO token" (arredondamento hex/rgb). Mantido APERTADO (0.012): vários tokens
  // DISTINTOS do DS ficam perto demais — no dark `secondary-text`≈`chart-2` (ΔE 0.0036); no light
  // `primary-foreground`≈`muted` (0.0133). Um limiar maior (ex. 0.02) passaria a marcar como "exato"
  // cores quase-token CHUMBADAS (falso "no contrato"). Uso real de um token sempre casa nele (dist ~0
  // vence o vizinho); quem cai ENTRE dois tokens quase-iguais é cor visualmente idêntica de qualquer jeito.
  const EXACT = 0.012;

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
    // 'rounded-full' resolve p/ um px gigante (Tailwind v4: calc(infinity*1px) ≈ 33554400px). É
    // semanticamente o token `full` — qualquer raio "absurdo" casa EXATO com full (não é desvio).
    if (px >= 1000 && radiiMap.full != null) return { name: 'full', px: radiiMap.full, dist: 0, exact: true };
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
  // Cada change carrega a LOCALIZAÇÃO capturada via fiber do React pelo content script:
  //   { components[], source 'arquivo:linha', componentProps{}, tag, role, ariaLabel, text, selector,
  //     kind, prop, from, to, token }
  // Assim o redline diz COMPONENTE / ONDE / O QUÊ — não um seletor CSS frágil. (Campos são opcionais:
  // degrada pro selector se a fiber/origem não estiver disponível.)
  function buildRedline(changes, ctx) {
    ctx = ctx || {};
    const url = ctx.url ? ` (${ctx.url})` : '';
    if (!changes || !changes.length) return { markdown: '_Nenhuma alteração._', ai: 'Nenhuma alteração.' };

    const keyOf = (c) => c.source || c.selector || (c.components && c.components.join('>')) || c.text || '?';
    const groups = new Map();
    for (const c of changes) {
      const k = keyOf(c);
      if (!groups.has(k)) groups.set(k, { meta: c, items: [] });
      groups.get(k).items.push(c);
    }
    const compStr = (cs) => (cs && cs.length) ? cs.map((c) => `<${c}>`).join(' › ') : null;
    const idBits = (c) => {
      const b = [];
      if (c.tag) b.push(`tag=${c.tag}`);
      if (c.role) b.push(`role=${c.role}`);
      if (c.ariaLabel) b.push(`aria-label="${c.ariaLabel}"`);
      if (c.componentProps) for (const [k, v] of Object.entries(c.componentProps)) b.push(`${k}="${v}"`);
      if (c.text) b.push(`texto="${c.text}"`);
      if (c.selector && c.components && c.components.length) b.push(`seletor=${c.selector}`);
      return b;
    };
    const line = (c) => `${c.prop}: \`${c.from}\` → \`${c.token || c.to}\``;

    const md = [`# Redline CRP${url}`, '', 'Aplique usando os **tokens do design system** (não valores crus):', ''];
    for (const { meta, items } of groups.values()) {
      const comp = compStr(meta.components);
      const title = comp ? `\`${comp}\`` : (meta.selector ? `\`${meta.selector}\`` : '(elemento)');
      md.push(`### ${title}${meta.source ? ` — \`${meta.source}\`` : ''}`);
      const id = idBits(meta);
      if (id.length) md.push(id.join(' · '));
      for (const c of items) md.push(`- ${line(c)}`);
      md.push('');
    }

    const ai = [
      `Você é um dev front-end no design system CRP. Aplique EXATAMENTE estas mudanças na tela${url},`,
      `usando os tokens do CRP (CSS custom properties / classes ty-*), nunca valores hardcoded.`,
      `Cada item diz o COMPONENTE, ONDE (arquivo:linha quando disponível) e O QUÊ muda:`,
      '',
      ...[...groups.values()].flatMap(({ meta, items }) => {
        const comp = compStr(meta.components) || meta.selector || '(elemento)';
        const id = idBits(meta);
        return [
          `COMPONENTE: ${comp}`,
          meta.source ? `  ONDE: ${meta.source}` : null,
          id.length ? `  ${id.join(' · ')}` : null,
          ...items.map((c) => `  MUDAR ${c.prop}: usar ${c.token || c.to} (estava ${c.from})`),
          '',
        ].filter((x) => x !== null);
      }),
      'Se um valor não tiver token exato, use o mais próximo indicado e comente o porquê.',
    ].join('\n');

    return { markdown: md.join('\n'), ai };
  }

  const CRPMatch = { hexToRgb, srgbToOklab, colorDist, nearestColor, nearestRadius, nearestType, buildRedline, EXACT };
  if (typeof globalThis !== 'undefined') globalThis.CRPMatch = CRPMatch;
})();
