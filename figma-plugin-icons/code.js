// CRP DS — Lucide → Components (plugin Figma, separado do plugin de Variables).
//
// Cria, para CADA ícone, um ComponentSet `lucide/<nome>` com a propriedade Size = 16/20/24/32 (busca por
// nome no painel Assets). Cada variante = figma.createNodeFromSvg(svg), com:
//   • COR  (stroke E fill) ligada a uma Variable de cor escolhida na UI (default primary-foreground);
//   • TAMANHO ligado ao primitivo `icon/<t>` (icon/sm=16…icon/xl=32) e ESPESSURA ao `border-width/<n>` —
//     ambos JÁ existentes em CRP/Primitives. NÃO cria collection; reaproveita os primitivos por VALOR.
//
// Robustez: try/catch por ícone; clone (1 parse de SVG por ícone); yield a cada 8 (UI + cancelar); "pular
// existentes" retoma sem duplicar; persiste o bundle e as opções (clientStorage). Read-only no resto do doc.

const SIZE_FALLBACK = [16, 20, 24, 32];
const COLS = 16, CELL_W = 200, CELL_H = 96, PAD = 48;
const ICON_COLOR = '#1E1E1E';            // fallback determinístico (Figma não resolve currentColor)
const BUNDLE_KEY = 'crpLucide:bundle';            // legado (lucide) — fallback de leitura
const BUNDLE_PREFIX = 'crpIcons:bundle:';         // por fonte/estilo: crpIcons:bundle:lucide | crpIcons:bundle:material:outlined
const PREFS_KEY = 'crpLucide:prefs';
const PREFS_VERSION = 2;                  // bump quando mudam os DEFAULTS (ex.: espessura 32→3) p/ prefs velhas não os sobrescreverem

// Normaliza a fonte (UI/bundle) p/ 'lucide' | 'material'. (o bundle Lucide traz source='lucide-static'.)
function normSource(s) { return s === 'material' ? 'material' : 'lucide'; }
// Eixo FILL do Material (outline vs preenchido) entra na chave: material:<estilo>[:fill].
function bundleKeyFor(source, style, filled) {
  if (normSource(source) !== 'material') return BUNDLE_PREFIX + 'lucide';
  return BUNDLE_PREFIX + 'material:' + String(style || 'outlined') + (filled ? ':fill' : '');
}
function embedKey(source, style, filled) {
  if (normSource(source) !== 'material') return 'lucide';
  return 'material:' + String(style || 'outlined') + (filled ? ':fill' : '');
}
// Dados embutidos no plugin (code.bundled.js). Ausentes em dev/test (code.js puro) -> cai p/ clientStorage/file-load.
const EMBED_META = (typeof __ICON_META__ !== 'undefined' && __ICON_META__) ? __ICON_META__ : {};
const EMBED_DATA = (typeof __ICON_DATA__ !== 'undefined' && __ICON_DATA__) ? __ICON_DATA__ : {};
// (fonte, estilo, filled) -> prefixo do set, página, rótulo e `fill` (= tipo sem stroke; sempre true no Material).
// O eixo FILL (outline/preenchido) entra no prefixo/página: Material-<Estilo>[ Fill]. Tudo em páginas próprias.
function setMeta(source, style, filled) {
  if (normSource(source) === 'material') {
    const st = String(style || 'outlined');
    const Cap = st.charAt(0).toUpperCase() + st.slice(1);
    return {
      prefix: 'material-' + st + (filled ? '-fill' : '') + '/',
      page: 'Material ' + Cap + (filled ? ' Fill' : ''),
      label: 'Material ' + Cap + (filled ? ' Fill' : ''),
      fill: true,
    };
  }
  return { prefix: 'lucide/', page: 'Lucide Icons', label: 'Lucide', fill: false };
}

let cancelled = false;

figma.showUI(__html__, { width: 460, height: 720, themeColors: true });

const microYield = () => new Promise((r) => { try { setTimeout(r, 0); } catch (e) { r(); } });
const safe = (fn) => { try { return fn(); } catch (e) { return undefined; } };

// ---- Startup: manda p/ a UI as Variables de cor, o bundle salvo e as preferências ----
(async function init() {
  let colorVars = [];
  try {
    const vs = await figma.variables.getLocalVariablesAsync('COLOR');
    colorVars = (vs || []).map((v) => ({ id: v.id, name: v.name })).sort((a, b) => a.name.localeCompare(b.name));
  } catch (e) {}
  let prefs = {};
  try { prefs = (await figma.clientStorage.getAsync(PREFS_KEY)) || {}; } catch (e) {}
  const aSource = normSource(prefs.activeSource), aStyle = prefs.activeStyle || null, aFilled = !!prefs.activeFilled;
  // A UI pede o bundle ativo via getBundle (embed ou clientStorage) — não empurramos os dados aqui.
  figma.ui.postMessage({ type: 'init', colorVars, embeddedMeta: EMBED_META, savedSource: aSource, savedStyle: aStyle, savedFilled: aFilled, prefs });
})();

figma.ui.onmessage = async (msg) => {
  if (!msg || typeof msg !== 'object') return;
  if (msg.type === 'cancel') { cancelled = true; return; }
  if (msg.type === 'saveBundle') {
    try {
      // Persistimos SEM as tags (só name/svg/alias) p/ caber na cota do clientStorage (~1MB).
      const doc = msg.bundle || {};
      const slim = Object.assign({}, doc, { icons: (doc.icons || []).map((i) => { const o = { name: i.name, svg: i.svg }; if (i.alias) o.alias = true; return o; }) });
      await figma.clientStorage.setAsync(bundleKeyFor(msg.source || doc.source, msg.style || doc.style, msg.filled != null ? msg.filled : doc.filled), slim);
      figma.ui.postMessage({ type: 'saved', ok: true });
    } catch (e) { figma.ui.postMessage({ type: 'saved', ok: false, message: String((e && e.message) || e) }); }
    return;
  }
  if (msg.type === 'getBundle') {
    // Serve o conjunto pedido: embed (blob gzip+base64, a UI descompacta) OU clientStorage (objeto pronto).
    const src = normSource(msg.source), sty = src === 'material' ? (msg.style || 'outlined') : null, fl = src === 'material' && !!msg.filled;
    let blob = EMBED_DATA[embedKey(src, sty, fl)] || null, bundle = null;
    if (!blob) {
      try { bundle = await figma.clientStorage.getAsync(bundleKeyFor(src, sty, fl)); } catch (e) {}
      if (!bundle && src === 'lucide') { try { bundle = await figma.clientStorage.getAsync(BUNDLE_KEY); } catch (e) {} }
    }
    figma.ui.postMessage({ type: 'bundle', source: src, style: sty, filled: fl, blob: blob, bundle: bundle || null });
    return;
  }
  if (msg.type === 'dryRun') { try { await dryRun(msg); } catch (e) {} return; }
  if (msg.type === 'clearAll') {
    try { await clearAll(msg); }
    catch (e) { figma.ui.postMessage({ type: 'error', message: String((e && e.message) || e) }); }
    return;
  }
  if (msg.type === 'run') {
    cancelled = false;
    try { await run(msg); }
    catch (e) { figma.ui.postMessage({ type: 'error', message: String((e && e.message) || e) }); }
  }
};

function getTargetPage(name) {
  const page = figma.root.children.find((p) => p.name === name);
  if (page) return page;
  const p = figma.createPage(); p.name = name; return p;
}

function getContainer(page, name) {
  let c = page.children.find((n) => n.type === 'FRAME' && n.name === name);
  if (!c) {
    c = figma.createFrame();
    c.name = name; c.layoutMode = 'NONE'; c.clipsContent = false;
    safe(() => { c.fills = []; });
    page.appendChild(c); c.x = 0; c.y = 0;
  }
  return c;
}

function hexToRgb(hex) {
  const h = String(hex).replace('#', '');
  return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255 };
}

// Paint do ícone ligado à Variable (se houver). Retorna { paint, bound } — bound = vínculo REAL.
function makeIconPaint(colorVar) {
  const base = { type: 'SOLID', color: hexToRgb(ICON_COLOR) };
  if (colorVar) {
    try {
      const p = figma.variables.setBoundVariableForPaint(base, 'color', colorVar);
      const ok = !!(p && p.boundVariables && p.boundVariables.color);
      return { paint: ok ? p : base, bound: ok };
    } catch (e) {}
  }
  return { paint: base, bound: false };
}

// Reaplica o paint em todo nó com stroke E/OU fill (Lucide é stroke, mas ~9 ícones têm fill).
function applyColor(frame, paint) {
  let targets = [];
  try {
    targets = frame.findAll((n) =>
      (Array.isArray(n.strokes) && n.strokes.length > 0) || (Array.isArray(n.fills) && n.fills.length > 0));
  } catch (e) {}
  for (const n of targets) {
    try { if (Array.isArray(n.strokes) && n.strokes.length > 0) n.strokes = [paint]; } catch (e) {}
    try { if (Array.isArray(n.fills) && n.fills.length > 0) n.fills = [paint]; } catch (e) {}
  }
}

// Lê o valor numérico de uma Variable FLOAT (1º modo). null se for alias/sem valor.
function floatVal(v) {
  try {
    const vbm = v.valuesByMode;
    if (vbm) for (const k in vbm) { const x = vbm[k]; if (typeof x === 'number') return x; }
  } catch (e) {}
  return null;
}

// NÃO cria collection. Acha os primitivos JÁ existentes em CRP/Primitives e casa por VALOR:
//   tamanho  -> icon/* (icon/sm=16 … icon/xl=32)      espessura -> border-width/* (1px, 2px…)
// strokeMap = { 16: 1, 20: 1, 24: 2, 32: 2 } (valor de border-width escolhido na UI, por tamanho).
// Retorna { size:{sz:var}, stroke:{sz:var}, hasSize, hasStroke } ou null.
async function findPrimitiveVars(sizes, strokeMap) {
  let vars = [];
  try { vars = await figma.variables.getLocalVariablesAsync('FLOAT'); } catch (e) { return null; }
  if (!Array.isArray(vars)) return null;

  const iconByVal = new Map(), borderByVal = new Map();
  for (const v of vars) {
    const nm = String(v.name || ''), val = floatVal(v);
    if (val == null) continue;
    if (nm.indexOf('icon/') === 0) { if (!iconByVal.has(val)) iconByVal.set(val, v); }
    else if (nm.indexOf('border-width/') === 0) { if (!borderByVal.has(val)) borderByVal.set(val, v); }
  }

  const size = {}, stroke = {};
  for (const sz of sizes) {
    if (iconByVal.has(sz)) size[sz] = iconByVal.get(sz);
    const sw = strokeMap && strokeMap[sz];
    if (sw != null && borderByVal.has(sw)) stroke[sz] = borderByVal.get(sw);
  }
  return { size, stroke, hasSize: Object.keys(size).length > 0, hasStroke: Object.keys(stroke).length > 0 };
}

// Liga width/height do componente à Variable de tamanho e o strokeWeight dos vetores à de espessura.
// Constraints SCALE p/ a arte acompanhar quando a Variable de tamanho mudar.
function bindSizeStroke(comp, sizeVar, strokeVar) {
  if (sizeVar) { safe(() => comp.setBoundVariable('width', sizeVar)); safe(() => comp.setBoundVariable('height', sizeVar)); }
  let nodes = [];
  try { nodes = comp.findAll((n) => (Array.isArray(n.strokes) && n.strokes.length > 0) || (Array.isArray(n.fills) && n.fills.length > 0)); } catch (e) {}
  for (const n of nodes) {
    safe(() => { n.constraints = { horizontal: 'SCALE', vertical: 'SCALE' }; });
    if (strokeVar && Array.isArray(n.strokes) && n.strokes.length > 0) safe(() => n.setBoundVariable('strokeWeight', strokeVar));
  }
}

// Monta um ComponentSet (Size=16/20/24/32) para um ícone. Perf: 1 parse + clone por tamanho.
// defaultSize: tamanho que vira a VARIANTE PADRÃO (1º filho do set) — é o que o Figma insere ao colocar
// o componente. A variante padrão de um ComponentSet é sempre o 1º filho, então o pomos primeiro.
function buildIconSet(ic, sizes, paint, varMap, defaultSize) {
  const svg = String(ic.svg).replace(/currentColor/g, ICON_COLOR);
  let base;
  try { base = figma.createNodeFromSvg(svg); } catch (e) { return null; }
  applyColor(base, paint);

  const ordered = (defaultSize && sizes.indexOf(defaultSize) >= 0)
    ? [defaultSize].concat(sizes.filter((s) => s !== defaultSize))
    : sizes;

  // Base real do SVG (Lucide=24px, Material=48px). Reescala pro alvo a partir dela — não assume 24.
  const baseW = (base && base.width) || 24;

  const comps = [];
  for (const sz of ordered) {
    let frame;
    try { frame = base.clone(); } catch (e) { continue; }
    const scale = sz / baseW;
    if (Math.abs(scale - 1) > 1e-4) safe(() => frame.rescale(scale));
    frame.name = ic.name;
    let comp = null;
    try { comp = figma.createComponentFromNode(frame); } catch (e) { comp = null; }
    if (!comp) {
      try {
        comp = figma.createComponent();
        comp.resizeWithoutConstraints(frame.width, frame.height);
        comp.appendChild(frame); frame.x = 0; frame.y = 0;
      } catch (e2) { safe(() => frame.remove()); comp = null; }
    }
    if (!comp) continue;
    comp.name = 'Size=' + sz;
    if (varMap) bindSizeStroke(comp, varMap.size[sz], varMap.stroke[sz]);
    comps.push(comp);
  }
  safe(() => base.remove());

  if (!comps.length) return null;
  let set;
  try { set = figma.combineAsVariants(comps, figma.currentPage); }
  catch (e) { comps.forEach((c) => safe(() => c.remove())); return null; }
  safe(() => {
    set.layoutMode = 'HORIZONTAL';
    set.primaryAxisSizingMode = 'AUTO'; set.counterAxisSizingMode = 'AUTO';
    set.counterAxisAlignItems = 'CENTER';
    set.itemSpacing = 16;
    set.paddingTop = set.paddingBottom = set.paddingLeft = set.paddingRight = 16;
  });
  return set;
}

// Prévia (read-only): conta o que o run faria, sem mexer no documento.
async function dryRun(msg) {
  const names = Array.isArray(msg.names) ? msg.names : [];
  const mode = msg.mode === 'sync' ? 'sync' : 'skip';
  const allNames = Array.isArray(msg.allNames) ? new Set(msg.allNames) : null;
  const meta = setMeta(msg.source, msg.style, msg.filled);
  const pageName = meta.page, prefix = meta.prefix;

  let page = null;
  try { page = figma.root.children.find((p) => p.name === pageName) || null; } catch (e) {}
  const existing = new Set();
  if (page) safe(() => { for (const s of page.findAllWithCriteria({ types: ['COMPONENT_SET'] })) if (s.name.indexOf(prefix) === 0) existing.add(s.name.slice(prefix.length)); });

  let willCreate = 0, willUpdate = 0, willSkip = 0;
  for (const nm of names) {
    if (existing.has(nm)) { if (mode === 'sync') willUpdate++; else willSkip++; }
    else willCreate++;
  }
  let willRemoveOrphans = 0;
  if (mode === 'sync' && allNames) { for (const nm of existing) if (!allNames.has(nm)) willRemoveOrphans++; }

  figma.ui.postMessage({ type: 'syncPlan', mode, willCreate, willUpdate, willSkip, willRemoveOrphans, existing: existing.size });
}

// Remove TODOS os ComponentSets lucide/* da página (e os frames-grid que ficarem vazios). Não toca em
// Variables, em outras páginas, nem em nós que não sejam lucide/*.
async function clearAll(msg) {
  const meta = setMeta(msg.source, msg.style, msg.filled);
  const pageName = meta.page;
  let page = null;
  try { page = figma.root.children.find((p) => p.name === pageName) || null; } catch (e) {}
  let removed = 0;
  if (page) {
    let sets = [];
    safe(() => { sets = page.findAllWithCriteria({ types: ['COMPONENT_SET'] }).filter((s) => s.name.indexOf(meta.prefix) === 0); });
    for (const s of sets) { safe(() => s.remove()); removed++; }
    safe(() => {
      for (const c of page.children.slice()) {
        if (c.type === 'FRAME' && String(c.name).indexOf(meta.label) === 0 &&
            c.children.filter((ch) => ch.type === 'COMPONENT_SET').length === 0) c.remove();
      }
    });
  }
  figma.ui.postMessage({ type: 'cleared', removed });
  safe(() => figma.notify(removed ? (meta.label + ': ' + removed + ' removidos') : (meta.label + ': nada para remover')));
}

async function run(msg) {
  const icons = Array.isArray(msg.icons) ? msg.icons : [];
  let sizes = (Array.isArray(msg.sizes) && msg.sizes.length ? msg.sizes : SIZE_FALLBACK)
    .map(Number).filter((n) => n > 0).sort((a, b) => a - b);
  if (!sizes.length) sizes = SIZE_FALLBACK.slice();
  // Variante padrão (1º filho do set). Default 20px; se não estiver entre os tamanhos, cai p/ o menor.
  let defaultSize = Number(msg.defaultSize);
  if (!(defaultSize > 0) || sizes.indexOf(defaultSize) < 0) defaultSize = sizes.indexOf(20) >= 0 ? 20 : sizes[0];
  const strokes = (msg.strokes && typeof msg.strokes === 'object') ? msg.strokes : null;
  const mode = msg.mode === 'sync' ? 'sync' : 'skip';   // skip = retomar; sync = sobrescrever + remover órfãos
  const allNames = Array.isArray(msg.allNames) ? new Set(msg.allNames) : null;
  const meta = setMeta(msg.source, msg.style, msg.filled);
  const pageName = meta.page, prefix = meta.prefix;
  const containerName = (meta.label + (msg.version ? ' v' + msg.version : '') + (sizes.length < 4 ? ' (' + sizes.join('/') + ')' : '')).trim();

  if (!icons.length) { figma.ui.postMessage({ type: 'error', message: 'Nenhum ícone selecionado.' }); return; }

  // Página + foco.
  let page;
  try { page = getTargetPage(pageName); } catch (e) { page = figma.currentPage; }
  try { await figma.setCurrentPageAsync(page); } catch (e) { safe(() => { figma.currentPage = page; }); }

  // Cor: Variable escolhida na UI (por id). '' = cor editável (sem bind).
  let colorVar = null;
  if (msg.colorVarId) { try { colorVar = await figma.variables.getVariableByIdAsync(msg.colorVarId); } catch (e) { colorVar = null; } }
  const { paint: iconPaint, bound: linked } = makeIconPaint(colorVar);

  // Primitivos existentes (CRP/Primitives): tamanho -> icon/*, espessura -> border-width/*.
  const varMap = await findPrimitiveVars(sizes, strokes);

  // Persistir preferências (inclui a fonte/estilo ativos p/ reabrir no mesmo conjunto).
  try { await figma.clientStorage.setAsync(PREFS_KEY, { v: PREFS_VERSION, sizes, defaultSize, colorVarId: msg.colorVarId || '', strokes, mode, activeSource: normSource(msg.source), activeStyle: msg.style || null, activeFilled: !!msg.filled }); } catch (e) {}

  // Sets <prefix> existentes (nome -> node).
  const existingSets = new Map();
  safe(() => {
    for (const s of page.findAllWithCriteria({ types: ['COMPONENT_SET'] })) if (s.name.indexOf(prefix) === 0) existingSets.set(s.name, s);
  });

  // Sync: remover órfãos (sets cujo ícone sumiu da lib atual).
  let orphans = 0;
  if (mode === 'sync' && allNames) {
    for (const [nm, node] of Array.from(existingSets)) {
      if (!allNames.has(nm.slice(prefix.length))) { safe(() => node.remove()); existingSets.delete(nm); orphans++; }
    }
  }

  const container = getContainer(page, containerName);
  let startIdx = 0;
  safe(() => { startIdx = container.children.filter((ch) => ch.type === 'COMPONENT_SET').length; });

  let created = 0, updated = 0, skipped = 0, failed = 0, idx = startIdx;
  const t0 = safe(() => Date.now()) || 0;

  for (let i = 0; i < icons.length; i++) {
    if (cancelled) break;
    const ic = icons[i];
    if (!ic || !ic.name || !ic.svg) { failed++; continue; }
    const setName = prefix + ic.name;
    const exists = existingSets.has(setName);

    if (mode === 'skip' && exists) { skipped++; }
    else {
      // Sync: sobrescrever — remove o set antigo (reaproveitando a posição dele).
      let ox = null, oy = null;
      if (mode === 'sync' && exists) {
        const old = existingSets.get(setName);
        safe(() => { ox = old.x; oy = old.y; });
        safe(() => old.remove());
        existingSets.delete(setName);
      }
      const set = buildIconSet(ic, sizes, iconPaint, varMap, defaultSize);
      if (set) {
        set.name = setName;
        if (ic.tags && ic.tags.length) safe(() => { set.description = ic.tags.join(', '); });
        container.appendChild(set);
        if (ox != null && oy != null) { safe(() => { set.x = ox; set.y = oy; }); }
        else { const col = idx % COLS, row = Math.floor(idx / COLS); safe(() => { set.x = PAD + col * CELL_W; set.y = PAD + row * CELL_H; }); idx++; }
        existingSets.set(setName, set);
        if (exists && mode === 'sync') updated++; else created++;
      } else { failed++; }
    }

    if ((i & 7) === 0) {
      figma.ui.postMessage({ type: 'progress', done: i + 1, total: icons.length, name: ic.name, created, updated, skipped, failed });
      await microYield();
    }
  }

  safe(() => {
    const rows = Math.max(1, Math.ceil(idx / COLS));
    const cols = Math.max(1, Math.min(idx, COLS));
    container.resizeWithoutConstraints(PAD * 2 + cols * CELL_W, PAD * 2 + rows * CELL_H);
  });
  safe(() => { figma.currentPage.selection = [container]; figma.viewport.scrollAndZoomIntoView([container]); });

  const elapsed = t0 ? Math.round(((safe(() => Date.now()) || t0) - t0) / 1000) : null;
  figma.ui.postMessage({
    type: cancelled ? 'cancelled' : 'done',
    created, updated, skipped, failed, orphans, elapsed, page: pageName, mode, defaultSize,
    source: normSource(msg.source), filled: !!msg.filled, fill: meta.fill, prefix,
    linked, colorName: colorVar ? colorVar.name : null,
    boundSizes: !!(varMap && varMap.hasSize), boundStroke: !!(varMap && varMap.hasStroke),
  });
  safe(() => figma.notify(`${meta.label}: ${created} criados${updated ? ', ' + updated + ' atualizados' : ''}${skipped ? ', ' + skipped + ' pulados' : ''}${orphans ? ', ' + orphans + ' órfãos removidos' : ''}${failed ? ', ' + failed + ' falharam' : ''}${cancelled ? ' (cancelado)' : ''}`));
}
