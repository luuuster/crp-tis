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
  // Snapshot dos nós de TEXTO direto (p/ desfazer edição de conteúdo sem tocar nos filhos/ícones).
  function snapText(el) { const ns = [...el.childNodes].filter((n) => n.nodeType === 3); const v = ns.map((n) => n.nodeValue); return () => ns.forEach((n, i) => { n.nodeValue = v[i]; }); }

  // LOCALIZAR a origem REAL do que está sendo editado (não um seletor CSS frágil): lê a fiber do React
  // (no dev server os nomes de componente estão intactos e, quando o build expõe, a origem arquivo:linha)
  // + a identidade rica do DOM. É ISSO que o redline carrega — pra você saber COMPONENTE / ONDE / O QUÊ.
  function fiberOf(el) { const k = Object.keys(el).find((p) => p.startsWith('__reactFiber$') || p.startsWith('__reactInternalInstance$')); return k ? el[k] : null; }
  function compName(t) {
    if (!t || typeof t === 'string') return null;
    if (typeof t === 'function') return t.displayName || t.name || null;
    if (typeof t === 'object') return t.displayName || (t.render && (t.render.displayName || t.render.name)) || (t.type && compName(t.type)) || null;
    return null;
  }
  function locate(el) {
    const components = []; let source = null, compProps = null;
    let f = fiberOf(el), hops = 0;
    while (f && hops < 100) {
      if (!source && f._debugSource && f._debugSource.fileName) source = f._debugSource;
      const n = compName(f.type);
      if (n && !components.includes(n)) {
        components.push(n);
        if (!compProps && f.memoizedProps) { // props identificadoras do componente mais próximo
          const wl = {};
          for (const key of ['variant', 'size', 'type', 'name', 'title', 'placeholder', 'aria-label']) {
            const v = f.memoizedProps[key];
            if (v != null && /string|number|boolean/.test(typeof v)) wl[key] = String(v).slice(0, 40);
          }
          if (Object.keys(wl).length) compProps = wl;
        }
      }
      f = f.return; hops++;
    }
    const txt = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    return {
      selector: selOf(el), tag: el.tagName.toLowerCase(), id: el.id || null,
      classes: [...el.classList].filter((c) => !c.startsWith('crp-')).join(' ') || null,
      role: el.getAttribute('role') || null, ariaLabel: el.getAttribute('aria-label') || null,
      text: txt || null, components: components.slice(0, 4), componentProps: compProps,
      source: source ? `${source.fileName.split(/[\\/]/).slice(-2).join('/')}:${source.lineNumber}` : null,
    };
  }
  function record(el, kind, prop, from, to, token, undo) {
    history.push(undo || snapStyle(el));
    changes.push({ ...locate(el), kind, prop, from, to, token });
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
    #crp-ins select,#crp-ins textarea{width:100%;background:#2e2e35;color:#e8e8ea;border:1px solid #3d3d45;border-radius:8px;padding:7px;font-size:12px}
    #crp-ins textarea{resize:vertical;min-height:34px;font-family:inherit;line-height:1.45}
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
      <div><div class="h">Editar — troque por qualquer token</div>
        <button class="act" data-a="pick">🎯 Selecionar elemento <span class="muted">Alt+1</span></button>
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
    const rendered = []; // mesma ordem das linhas, p/ religar o clique sem desalinhar
    for (const [name, list, from, tokenOf, sw] of groups) {
      const exactList = list.filter((x) => x.m && x.m.exact);
      const driftList = list.filter((x) => !(x.m && x.m.exact));
      // Exatos AGRUPADOS por token: o mesmo nome aparece UMA vez (Nx se vários pixels casam nele) — assim
      // `var(--muted)` não se repete com cores micro-diferentes. Desvios ficam um a um (são os acionáveis).
      const byToken = new Map();
      for (const x of exactList) { const t = tokenOf(x); const g = byToken.get(t); if (g) g.count++; else byToken.set(t, { rep: x, count: 1 }); }
      html += `<div style="margin-top:8px"><b>${name}</b> <span class="muted">${byToken.size} token(s) · ${driftList.length} desvio(s)</span>`;
      for (const [tk, { rep, count }] of byToken) {
        const c = (rep.m && rep.m.hex) || sw(rep); // swatch = cor canônica do token (não o pixel arredondado)
        const swatch = c ? `<span class="sw" style="background:${c}"></span>` : '';
        html += `<div class="drift">${swatch}<span class="ok">✓ ${tk}</span>${count > 1 ? ` <span class="muted">${count}×</span>` : ''}</div>`;
        rendered.push(rep);
      }
      for (const x of driftList) {
        const c = sw(x); // desvio mostra o pixel REAL (a cor fora do token)
        const swatch = c ? `<span class="sw" style="background:${c}"></span>` : '';
        html += `<div class="drift">${swatch}<span class="bad">${from(x)}</span> → <span class="ok">${tokenOf(x)}</span></div>`;
        rendered.push(x);
      }
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
    const loc = locate(el); // mostra o COMPONENTE + origem (confirma que o redline sabe onde está)
    selInfo.textContent = [loc.components[0] ? `<${loc.components[0]}>` : loc.tag, loc.source || loc.selector].filter(Boolean).join(' · ');
    selInfo.title = [loc.components.map((c) => `<${c}>`).join(' › '), loc.source, loc.text && `"${loc.text}"`].filter(Boolean).join('\n');
    showSnap(el);
  }
  // Editor: cada propriedade vira um <select> com TODOS os tokens do tema (não só o mais próximo).
  // 1ª opção = estado atual (no-op); escolher qualquer token aplica o valor resolvido + registra no redline.
  function editRow(label, currentText, options, onPick) {
    const wrap = document.createElement('div'); wrap.style.cssText = 'margin:8px 0 0';
    const lbl = document.createElement('div'); lbl.className = 'h'; lbl.style.marginBottom = '3px'; lbl.textContent = label;
    const sel = document.createElement('select');
    const cur = document.createElement('option'); cur.value = ''; cur.textContent = 'atual: ' + currentText; sel.appendChild(cur);
    for (const o of options) { const op = document.createElement('option'); op.value = o.value; op.textContent = o.text; sel.appendChild(op); }
    sel.addEventListener('change', () => { if (sel.value) onPick(sel.value); });
    wrap.appendChild(lbl); wrap.appendChild(sel);
    return wrap;
  }
  function showSnap(el) {
    const cs = getComputedStyle(el), cmap = colorsOf();
    const fg = paintHex(cs.color), bg = paintHex(cs.backgroundColor), br = px(cs.borderTopLeftRadius);
    const fs = Math.round(px(cs.fontSize)), fw = parseInt(cs.fontWeight) || 400;
    snapBox.innerHTML = '';

    // Texto (conteúdo) — só quando há texto DIRETO; edita sem quebrar filhos/ícones.
    const tnodes = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim());
    if (tnodes.length) {
      const fromText = tnodes.map((n) => n.nodeValue).join('').replace(/\s+/g, ' ').trim();
      const wrap = document.createElement('div'); wrap.style.cssText = 'margin:8px 0 0';
      const lbl = document.createElement('div'); lbl.className = 'h'; lbl.style.marginBottom = '3px'; lbl.textContent = 'Texto (conteúdo) — Ctrl+Enter aplica';
      const ta = document.createElement('textarea'); ta.value = fromText; ta.rows = Math.min(4, Math.max(1, Math.ceil(fromText.length / 36)));
      const run = () => {
        const to = ta.value;
        if (to === fromText) return;
        const undo = snapText(el);
        tnodes[0].nodeValue = to; for (let i = 1; i < tnodes.length; i++) tnodes[i].nodeValue = '';
        record(el, 'texto', 'textContent', fromText, to, null, undo); showSnap(el);
      };
      ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); } });
      const apply = btn('✓ aplicar texto', run); apply.style.marginTop = '4px';
      wrap.appendChild(lbl); wrap.appendChild(ta); wrap.appendChild(apply); snapBox.appendChild(wrap);
    }

    const colorOpts = Object.keys(cmap).map((n) => ({ value: n, text: `${n} — ${cmap[n]}` }));
    const near = (hex) => (hex ? M.nearestColor(hex, cmap).name : null);

    // Texto — cor
    snapBox.appendChild(editRow('Texto — cor', fg ? `${fg} (≈${near(fg)})` : '—', colorOpts,
      (name) => { record(el, 'cor', 'color', fg || cs.color, cmap[name], `var(--${name})`); el.style.color = cmap[name]; showSnap(el); }));

    // Fundo
    snapBox.appendChild(editRow('Fundo', bg ? `${bg} (≈${near(bg)})` : 'transparente', colorOpts,
      (name) => { record(el, 'cor', 'background-color', bg || 'transparent', cmap[name], `var(--${name})`); el.style.backgroundColor = cmap[name]; showSnap(el); }));

    // Raio
    const radOpts = Object.keys(TOK.radii).map((n) => ({ value: n, text: `${n} — ${TOK.radii[n]}px` }));
    const radNear = M.nearestRadius(br, TOK.radii);
    snapBox.appendChild(editRow('Raio', `${br}px${radNear ? ` (≈${radNear.name})` : ''}`, radOpts,
      (name) => { const tk = `var(--radius${name === 'base' ? '' : '-' + name})`; record(el, 'raio', 'border-radius', br + 'px', TOK.radii[name] + 'px', tk); el.style.borderRadius = TOK.radii[name] + 'px'; showSnap(el); }));

    // Tipografia (aplica size + weight + line-height + letter-spacing do role)
    const typeOpts = Object.keys(TOK.typography).map((r) => ({ value: r, text: `ty-${r} — ${TOK.typography[r].sizePx}px/${TOK.typography[r].weight || '—'}` }));
    const typeNear = M.nearestType(fs, fw, TOK.typography);
    snapBox.appendChild(editRow('Tipografia', `${fs}px/${fw}${typeNear ? ` (≈${typeNear.role})` : ''}`, typeOpts,
      (role) => { const t = TOK.typography[role]; record(el, 'tipografia', 'tipografia', `${fs}px/${fw}`, role, `ty-${role}`); el.style.fontSize = t.sizePx + 'px'; if (t.weight) el.style.fontWeight = t.weight; if (t.lineHeight) el.style.lineHeight = t.lineHeight; if (t.letterSpacing) el.style.letterSpacing = t.letterSpacing; showSnap(el); }));
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
  // Atalho: Alt+1 liga/desliga "Selecionar elemento" sem ir no botão. Esc cancela o modo.
  document.addEventListener('keydown', (e) => {
    if (e.altKey && (e.code === 'Digit1' || e.key === '1')) { e.preventDefault(); setPick(!picking); }
    else if (e.key === 'Escape' && picking) { e.preventDefault(); setPick(false); }
  }, SIG);

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
