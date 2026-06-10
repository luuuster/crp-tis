/* CRP DS — Editor embutido para os previews (experiência tipo Figma).
 * Painel flutuante (arrastável), sem instalar nada. Inclua com: <script defer src="_editor.js"></script>
 * Faz: editar textos, selecionar elemento e trocar papel tipográfico (ty-*), largura/padding/gap
 * (slider OU digitar o número), excluir elementos, tokens ao vivo, e EXPORTAR só o diff.
 * HISTÓRICO: Desfazer passo a passo (Ctrl+Z) e Resetar tudo.
 * Nada disto altera os tokens da fonte — é só no navegador.
 */
(function () {
  if (window.__crpEditor) return;
  window.__crpEditor = true;

  const ROLES = ['display', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body-lg', 'body', 'body-sm', 'label-lg', 'label', 'label-sm', 'link', 'caption', 'overline', 'code'];
  const root = document.documentElement;

  const style = document.createElement('style');
  style.id = 'crp-editor-style';
  style.textContent = `
    #crp-editor, #crp-editor * { box-sizing: border-box; font-family: ui-sans-serif, system-ui, sans-serif; }
    #crp-editor { position: fixed; left: 16px; bottom: 16px; z-index: 2147483647; width: 296px;
      background: #1b1b1f; color: #e8e8ea; border: 1px solid #34343a; border-radius: 12px;
      box-shadow: 0 12px 34px rgba(0,0,0,.45); font-size: 13px; overflow: hidden; }
    #crp-editor.min { width: auto; }
    #crp-editor header { display: flex; align-items: center; gap: 6px; padding: 10px 12px; background: #232329; cursor: move; }
    #crp-editor header b { font-size: 13px; flex: 1; }
    #crp-editor header button { background: transparent; border: 0; color: #9a9aa2; cursor: pointer; font-size: 14px; padding: 2px 7px; border-radius: 6px; line-height: 1; }
    #crp-editor header button:hover { background: #34343a; color: #fff; }
    #crp-editor .body { padding: 12px; display: flex; flex-direction: column; gap: 16px; max-height: 74vh; overflow: auto; }
    #crp-editor.min .body { display: none; }
    #crp-editor .sec { display: flex; flex-direction: column; gap: 8px; }
    #crp-editor .sec > .h { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #8a8a92; }
    #crp-editor .row { display: flex; align-items: center; gap: 8px; }
    #crp-editor .row > span:first-child { width: 64px; flex: none; color: #c7c7cd; }
    #crp-editor button.act { background: #2e2e35; border: 1px solid #3d3d45; color: #e8e8ea; border-radius: 8px; padding: 8px 10px; cursor: pointer; font-size: 12px; text-align: left; }
    #crp-editor button.act:hover:not(:disabled) { background: #3a3a42; }
    #crp-editor button.act.on { background: #3b82f6; border-color: #3b82f6; color: #fff; }
    #crp-editor button.act.mini { padding: 6px 9px; font-size: 11px; text-align: center; }
    #crp-editor button.act:disabled { opacity: .4; cursor: default; }
    #crp-editor button.act.danger { border-color: #5b2530; color: #fca5a5; }
    #crp-editor button.act.danger:hover:not(:disabled) { background: #7f1d1d; border-color: #7f1d1d; color: #fff; }
    #crp-editor select { width: 100%; background: #2e2e35; color: #e8e8ea; border: 1px solid #3d3d45; border-radius: 8px; padding: 7px; font-size: 12px; }
    #crp-editor select:disabled { opacity: .5; }
    #crp-editor input[type=range] { flex: 1; min-width: 0; }
    #crp-editor input[type=range]:disabled { opacity: .4; }
    #crp-editor input[type=color] { width: 40px; height: 28px; padding: 0; border: 1px solid #3d3d45; border-radius: 6px; background: #2e2e35; cursor: pointer; }
    #crp-editor input.val { width: 60px; flex: none; background: #15151a; border: 1px solid #2c2c33; color: #e8e8ea; border-radius: 6px; padding: 5px 6px; font-size: 11px; text-align: right; font-variant-numeric: tabular-nums; }
    #crp-editor input.val:focus { outline: none; border-color: #3b82f6; }
    #crp-editor input.val:disabled { opacity: .4; }
    #crp-editor .sel-info { font-family: ui-monospace, monospace; font-size: 11px; color: #c7c7cd; word-break: break-all; background: #15151a; border: 1px solid #2c2c33; border-radius: 6px; padding: 6px 8px; }
    #crp-editor .hint { font-size: 11px; color: #76767e; line-height: 1.45; }
    #crp-editor .toast { position: fixed; left: 16px; bottom: 16px; z-index: 2147483647; background: #22c55e; color: #04210f; font-weight: 600; padding: 9px 14px; border-radius: 8px; font: 600 13px ui-sans-serif, system-ui; box-shadow: 0 8px 24px rgba(0,0,0,.4); }
    .crp-hi { outline: 2px solid #3b82f6 !important; outline-offset: 1px; cursor: crosshair !important; }
    .crp-sel { outline: 2px dashed #22c55e !important; outline-offset: 1px; }
  `;

  const NUM = (id, v) => `<input type="text" class="val" id="${id}" value="${v}">`;
  const panel = document.createElement('div');
  panel.id = 'crp-editor';
  panel.contentEditable = 'false';
  panel.innerHTML = `
    <header>
      <b>CRP Editor</b>
      <button data-a="min" title="Minimizar">—</button>
      <button data-a="close" title="Fechar">✕</button>
    </header>
    <div class="body">
      <div class="sec">
        <span class="h">Histórico</span>
        <div class="row" style="gap:6px">
          <button class="act mini" data-a="undo" disabled style="flex:1">↶ Desfazer</button>
          <button class="act mini" data-a="reset" style="flex:1">↺ Resetar tudo</button>
        </div>
        <span class="hint">Desfaz a última ação (também <b>Ctrl+Z</b>). Resetar volta ao original.</span>
      </div>
      <div class="sec">
        <span class="h">Conteúdo</span>
        <button class="act" data-a="text">✎ Editar textos na página</button>
      </div>
      <div class="sec">
        <span class="h">Elemento</span>
        <button class="act" data-a="pick">🎯 Selecionar elemento</button>
        <div class="sel-info" id="crp-sel">nenhum selecionado</div>
        <button class="act mini" data-a="parent" disabled>↑ selecionar a caixa pai</button>
        <select id="crp-role" disabled><option value="">— papel tipográfico —</option>${ROLES.map((r) => `<option value="ty-${r}">${r}</option>`).join('')}</select>
        <div class="row"><span>Largura</span><input type="range" id="crp-w" min="0" max="1600" step="10" value="0" disabled>${NUM('crp-w-v', 'auto')}</div>
        <div class="row"><span>Largura máx</span><input type="range" id="crp-mw" min="0" max="1600" step="10" value="0" disabled>${NUM('crp-mw-v', '—')}</div>
        <div class="row"><span>Padding</span><input type="range" id="crp-pad" min="0" max="160" step="1" value="0" disabled>${NUM('crp-pad-v', '—')}</div>
        <div class="row"><span>Gap</span><input type="range" id="crp-gap" min="0" max="160" step="1" value="0" disabled>${NUM('crp-gap-v', '—')}</div>
        <button class="act mini danger" data-a="del" disabled>🗑 Excluir elemento</button>
        <span class="hint">Arraste OU <b>digite</b> o número no campo (Enter aplica). 0 = limpa. Tipografia aplica em qualquer elemento.</span>
      </div>
      <div class="sec">
        <span class="h">Tokens (ao vivo)</span>
        <div class="row"><span>Cor primária</span><input type="color" id="crp-primary" value="#036ef2" style="flex:1"></div>
        <div class="row"><span>Raio base</span><input type="range" id="crp-radius" min="0" max="40" step="1" value="10">${NUM('crp-radius-v', '10px')}</div>
        <div class="row"><span>Escala (rem)</span><input type="range" id="crp-scale" min="12" max="22" step="0.5" value="16">${NUM('crp-scale-v', '16px')}</div>
      </div>
      <div class="sec">
        <span class="h">Exportar</span>
        <button class="act" data-a="copy-changes">📋 Copiar alterações (recomendado)</button>
        <button class="act" data-a="copy-html">📋 Copiar HTML inteiro</button>
        <button class="act" data-a="copy-tokens">📋 Copiar tokens</button>
      </div>
    </div>`;

  function mount() { document.head.appendChild(style); document.body.appendChild(panel); wire(); }
  if (document.body) mount(); else addEventListener('DOMContentLoaded', mount);

  function wire() {
    // Todos os listeners de document/window usam este signal — o "Fechar" aborta tudo de uma vez
    // (sem ele, reinjetar o editor duplicaria handlers: undo duplo, seleção dupla).
    const ac = new AbortController();
    const SIG = { signal: ac.signal };
    const $ = (id) => panel.querySelector(id);
    const selInfo = $('#crp-sel'), roleSel = $('#crp-role');
    const wS = $('#crp-w'), wV = $('#crp-w-v'), mwS = $('#crp-mw'), mwV = $('#crp-mw-v');
    const padS = $('#crp-pad'), padV = $('#crp-pad-v'), gapS = $('#crp-gap'), gapV = $('#crp-gap-v');
    const parentBtn = panel.querySelector('[data-a="parent"]'), delBtn = panel.querySelector('[data-a="del"]'), undoBtn = panel.querySelector('[data-a="undo"]');
    const primaryI = $('#crp-primary'), radiusS = $('#crp-radius'), radiusV = $('#crp-radius-v'), scaleS = $('#crp-scale'), scaleV = $('#crp-scale-v');
    let picking = false, selected = null, hovered = null, editing = false;

    function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 1500); }
    function copy(text) {
      const done = () => toast('Copiado!');
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, () => fb(text)); else fb(text);
      function fb(t) { const ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { prompt('Copie manualmente (Ctrl+C):', t); } ta.remove(); }
    }
    const curTy = (el) => [...el.classList].find((c) => c.startsWith('ty-')) || '';

    // ===== HISTÓRICO =====
    const history = []; const MAX = 80;
    function pushUndo(fn) { history.push(fn); if (history.length > MAX) history.shift(); undoBtn.disabled = false; }
    function doUndo() { const fn = history.pop(); if (fn) { try { fn(); } catch (e) {} } undoBtn.disabled = history.length === 0; }
    function snapStyle(el) { const v = el.getAttribute('style'); return () => { if (v === null) el.removeAttribute('style'); else el.setAttribute('style', v); if (el === selected) syncBox(el); }; }
    function snapRoot() { const v = root.getAttribute('style'); return () => { if (v === null) root.removeAttribute('style'); else root.setAttribute('style', v); syncKnobs(); }; }

    // ===== registro de alterações (export do diff) =====
    const touched = new Set(); const origStyle = new Map(); const deletions = [];
    const parseStyle = (s) => { const o = {}; (s || '').split(';').forEach((d) => { const i = d.indexOf(':'); if (i < 0) return; const k = d.slice(0, i).trim(); if (k) o[k] = d.slice(i + 1).trim(); }); return o; };
    function descriptor(el) {
      const cls = [...el.classList].filter((c) => !c.startsWith('crp-')).map((c) => '.' + c).join('');
      const txt = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 44);
      return el.tagName.toLowerCase() + cls + (txt ? `  "${txt}${txt.length >= 44 ? '…' : ''}"` : '');
    }

    // ===== sincroniza UI =====
    function syncBox(el) {
      const cs = getComputedStyle(el);
      const cw = Math.round(parseFloat(cs.width)) || 0;
      wS.value = Math.min(cw, +wS.max); wV.value = el.style.width || 'auto';
      const cmw = cs.maxWidth;
      if (cmw && cmw !== 'none') { mwS.value = Math.min(Math.round(parseFloat(cmw)), +mwS.max); mwV.value = el.style.maxWidth || Math.round(parseFloat(cmw)) + 'px'; }
      else { mwS.value = 0; mwV.value = el.style.maxWidth || 'nenhuma'; }
      const cpad = Math.round(parseFloat(cs.paddingTop)) || 0;
      padS.value = Math.min(cpad, +padS.max); padV.value = el.style.padding || cpad + 'px';
      const g = cs.gap && cs.gap !== 'normal' ? Math.round(parseFloat(cs.gap)) || 0 : 0;
      gapS.value = Math.min(g, +gapS.max); gapV.value = el.style.gap || (g ? g + 'px' : 'nenhum');
      roleSel.value = curTy(el);
    }
    function syncKnobs() {
      const rad = root.style.getPropertyValue('--radius'); radiusS.value = rad ? parseFloat(rad) : 10; radiusV.value = radiusS.value + 'px';
      const fs = root.style.fontSize; scaleS.value = fs ? parseFloat(fs) : 16; scaleV.value = scaleS.value + 'px';
      const pr = (root.style.getPropertyValue('--primary') || '').trim(); if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(pr)) primaryI.value = pr;
    }
    const elFields = [wS, mwS, padS, gapS, wV, mwV, padV, gapV];
    function clearSel() {
      if (selected) selected.classList.remove('crp-sel');
      selected = null; selInfo.textContent = 'nenhum selecionado';
      roleSel.value = ''; roleSel.disabled = true;
      elFields.forEach((s) => { s.disabled = true; });
      [wS, mwS, padS, gapS].forEach((s) => { s.value = 0; });
      wV.value = 'auto'; mwV.value = '—'; padV.value = '—'; gapV.value = '—';
      parentBtn.disabled = true; delBtn.disabled = true;
    }

    // ===== editar textos =====
    function setText(on) { editing = on; document.designMode = on ? 'on' : 'off'; panel.contentEditable = 'false'; panel.querySelector('[data-a="text"]').classList.toggle('on', on); if (on && picking) setPick(false); }

    // ===== selecionar =====
    function setPick(on) {
      picking = on; panel.querySelector('[data-a="pick"]').classList.toggle('on', on);
      document.body.style.cursor = on ? 'crosshair' : '';
      if (!on && hovered) { hovered.classList.remove('crp-hi'); hovered = null; }
      if (on && editing) setText(false);
    }
    function select(el) {
      if (selected) selected.classList.remove('crp-sel');
      selected = el; el.classList.add('crp-sel');
      const cls = [...el.classList].filter((c) => c !== 'crp-sel' && c !== 'crp-hi');
      selInfo.textContent = `<${el.tagName.toLowerCase()}>` + (cls.length ? ' .' + cls.join('.') : '');
      roleSel.disabled = false; parentBtn.disabled = !el.parentElement || el.parentElement.id === 'crp-editor';
      delBtn.disabled = false; elFields.forEach((s) => { s.disabled = false; });
      syncBox(el);
    }
    document.addEventListener('mouseover', (e) => { if (!picking || panel.contains(e.target)) return; if (hovered) hovered.classList.remove('crp-hi'); hovered = e.target; hovered.classList.add('crp-hi'); }, SIG);
    document.addEventListener('click', (e) => { if (!picking || panel.contains(e.target)) return; e.preventDefault(); e.stopPropagation(); if (hovered) hovered.classList.remove('crp-hi'); select(e.target); setPick(false); }, { capture: true, signal: ac.signal });

    // ===== tipografia (inline via tokens; histórico) =====
    roleSel.addEventListener('change', () => {
      if (!selected) return;
      if (!origStyle.has(selected)) origStyle.set(selected, selected.getAttribute('style') || '');
      pushUndo(snapStyle(selected)); touched.add(selected);
      ['fontFamily', 'fontWeight', 'fontSize', 'lineHeight', 'letterSpacing', 'textDecoration'].forEach((p) => { selected.style[p] = ''; });
      const v = roleSel.value;
      if (v) {
        const r = v.slice(3);
        selected.style.fontFamily = `var(--text-${r}-font-family)`;
        selected.style.fontWeight = `var(--text-${r}-font-weight)`;
        selected.style.fontSize = `var(--text-${r}-font-size)`;
        selected.style.lineHeight = `var(--text-${r}-line-height)`;
        selected.style.letterSpacing = `var(--text-${r}-letter-spacing)`;
        if (r === 'link') selected.style.textDecoration = 'var(--text-link-text-decoration)';
      }
    });

    // ===== controle slider+número (arrastar OU digitar; 1 passo de histórico por interação) =====
    function pairControl(slider, num, scope, apply) {
      let snap = null, el = null;
      const begin = () => { if (snap) return; if (scope === 'el') { if (!selected) return; el = selected; if (!origStyle.has(el)) origStyle.set(el, el.getAttribute('style') || ''); snap = snapStyle(el); } else snap = snapRoot(); };
      const commit = () => { if (snap) { pushUndo(snap); if (scope === 'el' && el) touched.add(el); snap = null; el = null; } };
      slider.addEventListener('pointerdown', begin);
      slider.addEventListener('keydown', begin);
      slider.addEventListener('input', () => { num.value = apply(+slider.value); });
      slider.addEventListener('change', commit);
      num.addEventListener('focus', begin);
      num.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); num.blur(); } });
      num.addEventListener('change', () => {
        begin();
        let v = parseFloat(num.value); if (isNaN(v)) v = 0;
        v = Math.max(+slider.min, Math.min(v, +slider.max));
        slider.value = v; num.value = apply(v); commit();
      });
    }
    const aW = (v) => { if (!selected) return 'auto'; if (v <= 0) { selected.style.width = ''; return 'auto'; } selected.style.width = v + 'px'; return v + 'px'; };
    const aMW = (v) => { if (!selected) return 'nenhuma'; if (v <= 0) { selected.style.maxWidth = ''; return 'nenhuma'; } selected.style.maxWidth = v + 'px'; return v + 'px'; };
    const aPad = (v) => { if (!selected) return '0px'; if (v <= 0) { selected.style.padding = ''; return '0px'; } selected.style.padding = v + 'px'; return v + 'px'; };
    const aGap = (v) => { if (!selected) return 'nenhum'; if (v <= 0) { selected.style.gap = ''; return 'nenhum'; } selected.style.gap = v + 'px'; return v + 'px'; };
    const aRadius = (v) => {
      root.style.setProperty('--radius', v + 'px');
      root.style.setProperty('--radius-sm', Math.max(0, v - 4) + 'px');
      root.style.setProperty('--radius-md', Math.max(0, v - 2) + 'px');
      root.style.setProperty('--radius-lg', (v + 2) + 'px');
      root.style.setProperty('--radius-xl', (v + 6) + 'px');
      root.style.setProperty('--radius-2xl', (v + 10) + 'px');
      return v + 'px';
    };
    const aScale = (v) => { root.style.fontSize = v + 'px'; return v + 'px'; };
    pairControl(wS, wV, 'el', aW);
    pairControl(mwS, mwV, 'el', aMW);
    pairControl(padS, padV, 'el', aPad);
    pairControl(gapS, gapV, 'el', aGap);
    pairControl(radiusS, radiusV, 'root', aRadius);
    pairControl(scaleS, scaleV, 'root', aScale);
    // cor primária (sem campo numérico)
    (function () { let snap = null; primaryI.addEventListener('pointerdown', () => { if (!snap) snap = snapRoot(); }); primaryI.addEventListener('input', () => root.style.setProperty('--primary', primaryI.value)); primaryI.addEventListener('change', () => { if (snap) { pushUndo(snap); snap = null; } }); })();

    // ===== exportar =====
    function exportHTML() {
      const clone = root.cloneNode(true);
      clone.querySelectorAll('#crp-editor, #crp-editor-style, .toast').forEach((n) => n.remove());
      clone.querySelectorAll('.crp-hi, .crp-sel').forEach((n) => { n.classList.remove('crp-hi', 'crp-sel'); if (!n.getAttribute('class')) n.removeAttribute('class'); });
      return '<!DOCTYPE html>\n' + clone.outerHTML;
    }
    function exportTokens() {
      const s = root.getAttribute('style'); if (!s) return '/* nenhum token alterado */';
      return ':root {\n' + s.split(';').map((d) => d.trim()).filter(Boolean).map((d) => '  ' + d + ';').join('\n') + '\n}';
    }
    function exportChanges() {
      const blocks = [], styleLines = [];
      for (const el of touched) {
        if (!el.isConnected) continue;
        const orig = parseStyle(origStyle.get(el) || ''), cur = parseStyle(el.getAttribute('style') || ''), ch = [];
        for (const p in cur) if (cur[p] !== orig[p]) ch.push(`${p}: ${cur[p]};`);
        for (const p in orig) if (!(p in cur)) ch.push(`/* remover ${p} */`);
        if (!ch.length) continue;
        const m = (cur['font-size'] || '').match(/var\(--text-(.+?)-font-size\)/);
        styleLines.push(`  ${descriptor(el)}${m ? `   (tipografia: ${m[1]})` : ''}\n    ${ch.join(' ')}`);
      }
      if (styleLines.length) blocks.push('ESTILO (inline):\n' + styleLines.join('\n'));
      if (deletions.length) blocks.push('EXCLUÍDOS:\n' + deletions.map((d) => '  ' + d.desc).join('\n'));
      const tok = exportTokens(); if (!tok.startsWith('/*')) blocks.push('TOKENS (:root):\n' + tok);
      return blocks.length ? '/* Alterações do preview — só o que mudou */\n\n' + blocks.join('\n\n') : '/* nenhuma alteração registrada */';
    }

    // ===== arrastar painel =====
    (function () {
      const header = panel.querySelector('header');
      let dragging = false, ox = 0, oy = 0;
      header.addEventListener('mousedown', (e) => {
        if (e.target.closest('button')) return;
        const r = panel.getBoundingClientRect(); dragging = true; ox = e.clientX - r.left; oy = e.clientY - r.top;
        panel.style.left = r.left + 'px'; panel.style.top = r.top + 'px'; panel.style.right = 'auto'; panel.style.bottom = 'auto';
        document.body.style.userSelect = 'none'; e.preventDefault();
      });
      document.addEventListener('mousemove', (e) => { if (!dragging) return; panel.style.left = Math.max(0, Math.min(e.clientX - ox, innerWidth - 44)) + 'px'; panel.style.top = Math.max(0, Math.min(e.clientY - oy, innerHeight - 28)) + 'px'; }, SIG);
      document.addEventListener('mouseup', () => { dragging = false; document.body.style.userSelect = ''; }, SIG);
    })();

    // ===== Ctrl+Z (não atrapalha campos de texto) =====
    document.addEventListener('keydown', (e) => {
      if (editing) return;
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z') return;
      const t = e.target;
      const textEntry = !!t && ((t.tagName === 'INPUT' && /^(text|email|password|search|url|tel|number|)$/i.test(t.type) && !t.classList.contains('val')) || t.tagName === 'TEXTAREA' || t.isContentEditable);
      if (textEntry) return;
      e.preventDefault(); doUndo();
    }, SIG);

    // ===== ações =====
    panel.addEventListener('click', (e) => {
      const a = e.target.closest('[data-a]'); if (!a) return;
      switch (a.dataset.a) {
        case 'min': panel.classList.toggle('min'); break;
        case 'close': setText(false); setPick(false); ac.abort(); panel.remove(); style.remove(); window.__crpEditor = false; break;
        case 'text': setText(!editing); break;
        case 'pick': setPick(!picking); break;
        case 'parent': if (selected && selected.parentElement && selected.parentElement.id !== 'crp-editor') select(selected.parentElement); break;
        case 'del': {
          if (!selected) break;
          const node = selected, parent = node.parentNode, next = node.nextSibling;
          node.classList.remove('crp-sel');
          const entry = { desc: descriptor(node) }; deletions.push(entry);
          pushUndo(() => { if (parent && parent.isConnected) parent.insertBefore(node, (next && next.parentNode === parent) ? next : null); const i = deletions.indexOf(entry); if (i >= 0) deletions.splice(i, 1); });
          node.remove(); clearSel(); toast('Elemento removido');
          break;
        }
        case 'undo': doUndo(); break;
        case 'reset':
          while (history.length) { const fn = history.pop(); try { fn(); } catch (e2) {} }
          root.removeAttribute('style'); undoBtn.disabled = true; syncKnobs(); clearSel(); toast('Tudo resetado');
          break;
        case 'copy-changes': copy(exportChanges()); break;
        case 'copy-html': copy(exportHTML()); break;
        case 'copy-tokens': copy(exportTokens()); break;
      }
    });
  }
})();
