/* CRP Inspector — content script (injetado pela extensão).
 * Auditar: a tela usa os tokens? · Editar: ajusta em tokens · Exportar: redline pro front/IA.
 * Aplica VALORES RESOLVIDOS (funciona em qualquer página) e REGISTRA nomes de token (pro redline). */
(function () {
  if (window.__crpInspector) return;
  window.__crpInspector = true;

  const TOK = globalThis.CRP_TOKENS;
  const M = globalThis.CRPMatch;
  if (!TOK || !M) { alert('CRP Inspector: tokens/lib não carregados.'); window.__crpInspector = false; return; }

  let theme = TOK.themes[0];
  const colorsOf = () => TOK.colorsByTheme[theme] || {};
  const ac = new AbortController();
  const SIG = { signal: ac.signal };

  // ---------- util ----------
  const cnv = document.createElement('canvas'); cnv.width = cnv.height = 1;
  const ctx = cnv.getContext('2d', { willReadFrequently: true });
  function paintHex(css) {
    if (!css || css === 'transparent' || css === 'none' || /rgba?\([^)]*,\s*0\s*\)$/.test(css)) return null;
    ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    if (d[3] < 8) return null; // ~transparente
    const h = (n) => n.toString(16).padStart(2, '0');
    return '#' + h(d[0]) + h(d[1]) + h(d[2]);
  }
  const px = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
  function selOf(el) {
    if (el.id) return '#' + el.id;
    const cls = [...el.classList].filter((c) => !c.startsWith('crp-')).slice(0, 2).map((c) => '.' + c).join('');
    let s = el.tagName.toLowerCase() + cls;
    if (!cls && el.parentElement) {
      const sibs = [...el.parentElement.children].filter((c) => c.tagName === el.tagName);
      if (sibs.length > 1) s += `:nth-of-type(${sibs.indexOf(el) + 1})`;
    }
    return s;
  }
  const isVisible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05;
  };

  // ---------- estado / histórico / mudanças ----------
  const history = [], changes = [];
  let selected = null, hovered = null, picking = false;
  function snapStyle(el) { const v = el.getAttribute('style'); return () => { if (v === null) el.removeAttribute('style'); else el.setAttribute('style', v); }; }
  function record(el, kind, prop, from, to, token) {
    history.push(snapStyle(el));
    changes.push({ selector: selOf(el), kind, prop, from, to, token });
    renderExport();
  }

  // ---------- UI ----------
  const style = document.createElement('style');
  style.id = 'crp-ins-style';
  style.textContent = `
    #crp-ins,#crp-ins *{box-sizing:border-box;font-family:ui-sans-serif,system-ui,sans-serif}
    #crp-ins{position:fixed;right:16px;top:16px;z-index:2147483647;width:320px;max-height:88vh;display:flex;flex-direction:column;
      background:#1b1b1f;color:#e8e8ea;border:1px solid #34343a;border-radius:12px;box-shadow:0 12px 34px rgba(0,0,0,.5);font-size:13px;overflow:hidden}
    #crp-ins header{display:flex;align-items:center;gap:6px;padding:10px 12px;background:#232329;cursor:move}
    #crp-ins header b{flex:1;font-size:13px}
    #crp-ins header button{background:transparent;border:0;color:#9a9aa2;cursor:pointer;font-size:14px;padding:2px 7px;border-radius:6px;line-height:1}
    #crp-ins header button:hover{background:#34343a;color:#fff}
    #crp-ins .body{padding:12px;display:flex;flex-direction:column;gap:14px;overflow:auto}
    #crp-ins.min .body{display:none}
    #crp-ins .h{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#8a8a92;margin-bottom:6px}
    #crp-ins button.act{width:100%;background:#2e2e35;border:1px solid #3d3d45;color:#e8e8ea;border-radius:8px;padding:8px 10px;cursor:pointer;font-size:12px;text-align:left}
    #crp-ins button.act:hover:not(:disabled){background:#3a3a42}
    #crp-ins button.act.on{background:#045dce;border-color:#045dce;color:#fff}
    #crp-ins button.act:disabled{opacity:.4;cursor:default}
    #crp-ins button.mini{display:inline-block;width:auto;padding:5px 8px;font-size:11px;margin:2px 4px 2px 0}
    #crp-ins select{width:100%;background:#2e2e35;color:#e8e8ea;border:1px solid #3d3d45;border-radius:8px;padding:7px;font-size:12px}
    #crp-ins .info{font-family:ui-monospace,monospace;font-size:11px;color:#c7c7cd;background:#15151a;border:1px solid #2c2c33;border-radius:6px;padding:6px 8px;word-break:break-all}
    #crp-ins .score{font-size:24px;font-weight:700}
    #crp-ins .muted{color:#8a8a92}
    #crp-ins .drift{display:flex;align-items:center;gap:6px;padding:4px 6px;border-radius:6px;cursor:pointer;font-size:11px}
    #crp-ins .drift:hover{background:#2a2a30}
    #crp-ins .sw{width:12px;height:12px;border-radius:3px;border:1px solid #0006;flex:none}
    #crp-ins .ok{color:#22c55e}#crp-ins .bad{color:#fca5a5}
    #crp-ins .toast{position:fixed;left:50%;transform:translateX(-50%);bottom:24px;z-index:2147483647;background:#22c55e;color:#04210f;font:600 13px ui-sans-serif,system-ui;padding:9px 14px;border-radius:8px}
    .crp-hi{outline:2px solid #045dce !important;outline-offset:1px}
    .crp-sel{outline:2px dashed #22c55e !important;outline-offset:1px}`;

  const panel = document.createElement('div');
  panel.id = 'crp-ins';
  panel.innerHTML = `
    <header><b>CRP Inspector</b>
      <button data-a="min" title="Minimizar">—</button>
      <button data-a="close" title="Fechar">✕</button></header>
    <div class="body">
      <div><div class="h">Tema de referência</div>
        <select id="crp-theme">${TOK.themes.map((t) => `<option>${t}</option>`).join('')}</select></div>
      <div><div class="h">Auditar — os tokens estão sendo usados?</div>
        <button class="act" data-a="audit">🔍 Auditar a página</button>
        <div id="crp-report" style="margin-top:8px"></div></div>
      <div><div class="h">Editar em tokens</div>
        <button class="act" data-a="pick">🎯 Selecionar elemento</button>
        <div class="info" id="crp-sel" style="margin-top:6px">nenhum selecionado</div>
        <div id="crp-snap" style="margin-top:6px"></div></div>
      <div><div class="h">Exportar redline</div>
        <div id="crp-exp"></div></div>
    </div>`;

  document.documentElement.appendChild(style);
  (document.body || document.documentElement).appendChild(panel);
  const $ = (s) => panel.querySelector(s);
  const undoBtnHolder = {};
  const report = $('#crp-report'), selInfo = $('#crp-sel'), snapBox = $('#crp-snap'), expBox = $('#crp-exp');
  $('#crp-theme').addEventListener('change', (e) => { theme = e.target.value; if (selected) showSnap(selected); });

  function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 1400); }
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(() => toast('Copiado!'), fb); else fb();
    function fb() { const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast('Copiado!'); } catch (e) { prompt('Copie (Ctrl+C):', text); } ta.remove(); }
  }

  // ---------- AUDITAR ----------
  function audit() {
    const colors = new Map(), radii = new Map(), types = new Map();
    const els = [...document.body.querySelectorAll('*')].filter((el) => !panel.contains(el) && isVisible(el)).slice(0, 4000);
    for (const el of els) {
      const cs = getComputedStyle(el);
      for (const prop of ['color', 'background-color', 'border-top-color']) {
        const hex = paintHex(cs.getPropertyValue(prop));
        if (hex && !colors.has(hex)) colors.set(hex, el);
      }
      const br = px(cs.borderTopLeftRadius);
      if (br > 0 && !radii.has(br)) radii.set(br, el);
      if ((el.textContent || '').trim().length > 1 && el.children.length === 0) {
        const key = Math.round(px(cs.fontSize)) + '/' + (parseInt(cs.fontWeight) || 400);
        if (!types.has(key)) types.set(key, el);
      }
    }
    const cmap = colorsOf();
    const C = [...colors].map(([hex, el]) => ({ hex, el, m: M.nearestColor(hex, cmap) }));
    const R = [...radii].map(([v, el]) => ({ v, el, m: M.nearestRadius(v, TOK.radii) }));
    const Tt = [...types].map(([k, el]) => { const [s, w] = k.split('/').map(Number); return { s, w, el, m: M.nearestType(s, w, TOK.typography) }; });
    renderReport(C, R, Tt);
  }
  function renderReport(C, R, Tt) {
    const groups = [['Cores', C, (x) => x.hex, (x) => `var(--${x.m.name})`, (x) => x.hex],
      ['Raios', R, (x) => x.v + 'px', (x) => `var(--radius${x.m.name === 'base' ? '' : '-' + x.m.name})`, () => null],
      ['Tipografia', Tt, (x) => x.s + 'px', (x) => `ty-${x.m.role}`, () => null]];
    const total = C.length + R.length + Tt.length;
    const onSys = [...C, ...R, ...Tt].filter((x) => x.m && x.m.exact).length;
    const pct = total ? Math.round((onSys / total) * 100) : 100;
    let html = `<div class="score ${pct >= 80 ? 'ok' : 'bad'}">${pct}% <span style="font-size:12px" class="muted">aderência (${onSys}/${total} no contrato)</span></div>`;
    const rendered = []; // mesma ordem/slice das linhas, p/ religar o clique sem desalinhar
    for (const [name, list, from, tokenOf, sw] of groups) {
      const drift = list.filter((x) => x.m && !x.m.exact);
      html += `<div style="margin-top:8px"><b>${name}</b> <span class="muted">${list.length - drift.length}/${list.length} no token</span>`;
      for (const x of drift.slice(0, 12)) {
        const c = sw(x), swatch = c ? `<span class="sw" style="background:${c}"></span>` : '';
        html += `<div class="drift">${swatch}<span class="bad">${from(x)}</span> → <span class="ok">${tokenOf(x)}</span></div>`;
        rendered.push(x);
      }
      if (drift.length > 12) html += `<div class="muted" style="font-size:11px">+${drift.length - 12} mais…</div>`;
      html += `</div>`;
    }
    report.innerHTML = html;
    [...report.querySelectorAll('.drift')].forEach((row, i) => row.addEventListener('click', () => {
      const el = rendered[i] && rendered[i].el;
      if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); flash(el); select(el); }
    }));
  }
  function flash(el) { el.classList.add('crp-hi'); setTimeout(() => el.classList.remove('crp-hi'), 1200); }

  // ---------- SELECIONAR + SNAP ----------
  function setPick(on) { picking = on; panel.querySelector('[data-a="pick"]').classList.toggle('on', on); document.body.style.cursor = on ? 'crosshair' : ''; if (!on && hovered) { hovered.classList.remove('crp-hi'); hovered = null; } }
  function select(el) {
    if (selected) selected.classList.remove('crp-sel');
    selected = el; el.classList.add('crp-sel');
    selInfo.textContent = selOf(el);
    showSnap(el);
  }
  function showSnap(el) {
    const cs = getComputedStyle(el), cmap = colorsOf();
    const fg = paintHex(cs.color), bg = paintHex(cs.backgroundColor), br = px(cs.borderTopLeftRadius);
    const fs = Math.round(px(cs.fontSize)), fw = parseInt(cs.fontWeight) || 400;
    const rows = [];
    if (fg) { const m = M.nearestColor(fg, cmap); rows.push(btn(`Texto → var(--${m.name})${m.exact ? ' ✓' : ''}`, () => { record(el, 'cor', 'color', fg, m.hex, `var(--${m.name})`); el.style.color = m.hex; showSnap(el); })); }
    if (bg) { const m = M.nearestColor(bg, cmap); rows.push(btn(`Fundo → var(--${m.name})${m.exact ? ' ✓' : ''}`, () => { record(el, 'cor', 'background-color', bg, m.hex, `var(--${m.name})`); el.style.backgroundColor = m.hex; showSnap(el); })); }
    if (br > 0) { const m = M.nearestRadius(br, TOK.radii); const tk = `var(--radius${m.name === 'base' ? '' : '-' + m.name})`; rows.push(btn(`Raio ${br}px → ${tk}${m.exact ? ' ✓' : ''}`, () => { record(el, 'raio', 'border-radius', br + 'px', m.px + 'px', tk); el.style.borderRadius = m.px + 'px'; showSnap(el); })); }
    { const m = M.nearestType(fs, fw, TOK.typography); const t = TOK.typography[m.role]; rows.push(btn(`Texto ${fs}px → ty-${m.role}${m.exact ? ' ✓' : ''}`, () => { record(el, 'tipografia', 'tipografia', fs + 'px', m.role, `ty-${m.role}`); el.style.fontSize = t.sizePx + 'px'; if (t.weight) el.style.fontWeight = t.weight; if (t.lineHeight) el.style.lineHeight = t.lineHeight; if (t.letterSpacing) el.style.letterSpacing = t.letterSpacing; showSnap(el); })); }
    snapBox.innerHTML = ''; rows.forEach((b) => snapBox.appendChild(b));
  }
  function btn(label, on) { const b = document.createElement('button'); b.className = 'act mini'; b.textContent = label; b.addEventListener('click', on); return b; }

  // ---------- EXPORTAR ----------
  function renderExport() {
    expBox.innerHTML = '';
    const info = document.createElement('div'); info.className = 'muted'; info.style.cssText = 'font-size:11px;margin-bottom:6px';
    info.textContent = changes.length ? `${changes.length} alteração(ões) registradas` : 'Edite algo para gerar o redline.';
    expBox.appendChild(info);
    expBox.appendChild(btn('📋 Copiar redline (Markdown)', () => copy(M.buildRedline(changes, { url: location.href }).markdown)));
    expBox.appendChild(btn('🤖 Copiar bloco pra IA', () => copy(M.buildRedline(changes, { url: location.href }).ai)));
    if (changes.length) expBox.appendChild(btn('↶ Desfazer última', doUndo));
  }
  function doUndo() { const fn = history.pop(); if (fn) { try { fn(); } catch (e) {} changes.pop(); renderExport(); if (selected) showSnap(selected); } }

  // ---------- eventos ----------
  document.addEventListener('mouseover', (e) => { if (!picking || panel.contains(e.target)) return; if (hovered) hovered.classList.remove('crp-hi'); hovered = e.target; hovered.classList.add('crp-hi'); }, SIG);
  document.addEventListener('click', (e) => { if (!picking || panel.contains(e.target)) return; e.preventDefault(); e.stopPropagation(); if (hovered) hovered.classList.remove('crp-hi'); select(e.target); setPick(false); }, { capture: true, signal: ac.signal });

  (function drag() {
    const header = panel.querySelector('header'); let on = false, ox = 0, oy = 0;
    header.addEventListener('mousedown', (e) => { if (e.target.closest('button')) return; const r = panel.getBoundingClientRect(); on = true; ox = e.clientX - r.left; oy = e.clientY - r.top; panel.style.left = r.left + 'px'; panel.style.top = r.top + 'px'; panel.style.right = 'auto'; document.body.style.userSelect = 'none'; e.preventDefault(); });
    document.addEventListener('mousemove', (e) => { if (!on) return; panel.style.left = Math.max(0, Math.min(e.clientX - ox, innerWidth - 44)) + 'px'; panel.style.top = Math.max(0, Math.min(e.clientY - oy, innerHeight - 28)) + 'px'; }, SIG);
    document.addEventListener('mouseup', () => { on = false; document.body.style.userSelect = ''; }, SIG);
  })();

  panel.addEventListener('click', (e) => {
    const a = e.target.closest('[data-a]'); if (!a) return;
    switch (a.dataset.a) {
      case 'min': panel.classList.toggle('min'); break;
      case 'close': window.__crpClose(); break;
      case 'audit': audit(); break;
      case 'pick': setPick(!picking); break;
    }
  });

  window.__crpClose = function () {
    setPick(false); ac.abort();
    if (selected) selected.classList.remove('crp-sel');
    document.querySelectorAll('.crp-hi,.crp-sel').forEach((n) => n.classList.remove('crp-hi', 'crp-sel'));
    panel.remove(); style.remove(); document.body.style.cursor = '';
    window.__crpInspector = false; window.__crpClose = null;
  };

  renderExport();
})();
