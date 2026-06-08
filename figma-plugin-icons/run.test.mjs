// Harness de LÓGICA do plugin (node --test). Mocka a API do Figma (cena + Variables + clientStorage) e roda
// o run() REAL do code.js contra o bundle. Valida: 1 set por ícone (lucide/<nome>) com variantes Size; cor
// ligada por id (stroke+fill); collection "Icon" com size/<n> e stroke/<n>; bind de width/height/strokeWeight;
// retomar; persistência; init; falha isolada; linked honesto.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const code = readFileSync(new URL('./code.js', import.meta.url), 'utf8');
const bundle = JSON.parse(readFileSync(new URL('./lucide-icons.json', import.meta.url), 'utf8'));

class Node {
  constructor(type) { this.type = type; this.children = []; this.parent = null; this.x = 0; this.y = 0; this.width = 24; this.height = 24; this.name = ''; }
  appendChild(n) { if (n.parent) { const i = n.parent.children.indexOf(n); if (i >= 0) n.parent.children.splice(i, 1); } n.parent = this; this.children.push(n); }
  rescale(s) { if (!(s >= 0.01)) throw new Error('rescale inválido ' + s); this.width *= s; this.height *= s; }
  resizeWithoutConstraints(w, h) { this.width = w; this.height = h; }
  remove() { if (this.parent) { const i = this.parent.children.indexOf(this); if (i >= 0) this.parent.children.splice(i, 1); } this.removed = true; }
  setBoundVariable(field, variable) { this.boundVariables = this.boundVariables || {}; this.boundVariables[field] = { type: 'VARIABLE_ALIAS', id: variable.id }; }
  findAllWithCriteria(crit) { const out = []; const walk = (n) => { for (const c of n.children) { if (crit.types.includes(c.type)) out.push(c); walk(c); } }; walk(this); return out; }
  findAll(pred) { const out = []; const walk = (n) => { for (const c of n.children) { if (pred(c)) out.push(c); walk(c); } }; walk(this); return out; }
  clone() {
    const cp = (n) => {
      const c = new Node(n.type); c.width = n.width; c.height = n.height; c.name = n.name;
      if (Array.isArray(n.strokes)) c.strokes = n.strokes.map((s) => JSON.parse(JSON.stringify(s)));
      if (Array.isArray(n.fills)) c.fills = n.fills.map((s) => JSON.parse(JSON.stringify(s)));
      for (const ch of n.children) { const cc = cp(ch); cc.parent = c; c.children.push(cc); }
      return c;
    };
    const c = cp(this);
    if (this.parent) { c.parent = this.parent; this.parent.children.push(c); }
    return c;
  }
}

function makeFigma(opts) {
  const withVar = !opts || opts.withVar !== false;
  const messages = [];
  const store = new Map();
  const collections = [], variables = [];
  let cid = 0, vid = 0;
  const newColl = (name) => { const c = { id: 'Coll:' + (++cid), name, modes: [{ modeId: 'm1', name: 'Mode 1' }], defaultModeId: 'm1' }; collections.push(c); return c; };
  const newVar = (name, coll, type) => { const v = { id: 'Var:' + (++vid), name, variableCollectionId: coll.id, resolvedType: type, valuesByMode: {}, setValueForMode(m, val) { this.valuesByMode[m] = val; } }; variables.push(v); return v; };

  let colorVarId = '';
  if (withVar) {
    const mc = newColl('CRP/Modes'); const pf = newVar('primary-foreground', mc, 'COLOR'); colorVarId = pf.id;
    // Primitivos já existentes em CRP/Primitives (o que o plugin deve REUSAR).
    const pr = newColl('CRP/Primitives');
    const seed = (name, val) => { const v = newVar(name, pr, 'FLOAT'); v.setValueForMode(pr.defaultModeId, val); };
    seed('icon/sm', 16); seed('icon/md', 20); seed('icon/lg', 24); seed('icon/xl', 32);
    seed('border-width/1', 1); seed('border-width/2', 2); seed('border-width/4', 4);
  }

  const page0 = new Node('PAGE'); page0.name = 'Page 1';
  const figma = {
    root: { children: [page0] },
    currentPage: page0,
    showUI() {}, notify() {},
    viewport: { scrollAndZoomIntoView() {} },
    ui: { onmessage: null, postMessage(m) { messages.push(m); } },
    clientStorage: { async getAsync(k) { return store.has(k) ? store.get(k) : undefined; }, async setAsync(k, v) { store.set(k, v); } },
    variables: {
      async getLocalVariablesAsync(type) { return variables.filter((v) => !type || v.resolvedType === type); },
      async getLocalVariableCollectionsAsync() { return collections.slice(); },
      async getVariableByIdAsync(id) { return variables.find((v) => v.id === id) || null; },
      createVariableCollection(name) { return newColl(name); },
      createVariable(name, coll, type) { const c = typeof coll === 'string' ? collections.find((x) => x.id === coll) : coll; return newVar(name, c, type); },
      setBoundVariableForPaint(paint, field, variable) { const bv = {}; bv[field] = { type: 'VARIABLE_ALIAS', id: variable.id }; return Object.assign({}, paint, { boundVariables: bv }); },
    },
    createPage() { const p = new Node('PAGE'); figma.root.children.push(p); return p; },
    async setCurrentPageAsync(p) { figma.currentPage = p; },
    createFrame() { const f = new Node('FRAME'); figma.currentPage.appendChild(f); return f; },
    createComponent() { const c = new Node('COMPONENT'); figma.currentPage.appendChild(c); return c; },
    createNodeFromSvg(svg) {
      if (typeof svg !== 'string' || !svg.startsWith('<svg') || !svg.endsWith('</svg>')) throw new Error('SVG inválido');
      const wm = svg.match(/width="(\d+(?:\.\d+)?)"/);   // base real do SVG (Lucide=24, Material=48)
      const w = wm ? Number(wm[1]) : 24;
      const f = new Node('FRAME'); f.width = w; f.height = w; f.fills = [];
      const stroked = new Node('VECTOR'); stroked.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }]; stroked.fills = []; f.appendChild(stroked);
      const filled = new Node('VECTOR'); filled.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }]; filled.strokes = []; f.appendChild(filled);
      figma.currentPage.appendChild(f); return f;
    },
    createComponentFromNode(node) { node.type = 'COMPONENT'; return node; },
    combineAsVariants(comps, parent) {
      if (!Array.isArray(comps) || !comps.length) throw new Error('combineAsVariants precisa de ≥1');
      const set = new Node('COMPONENT_SET'); parent.appendChild(set);
      for (const c of comps) set.appendChild(c);
      return set;
    },
  };
  return { figma, messages, store, colorVarId, variables, collections };
}

function load(figma) { new Function('figma', '__html__', code)(figma, '<html></html>'); return figma.ui.onmessage; }
// Carrega o code.js COM dados embutidos (simula code.bundled.js) prefixando __ICON_DATA__/__ICON_META__.
function loadEmbed(figma, data, meta) {
  const pre = 'var __ICON_DATA__=' + JSON.stringify(data || {}) + ';var __ICON_META__=' + JSON.stringify(meta || {}) + ';\n';
  new Function('figma', '__html__', pre + code)(figma, '<html></html>');
  return figma.ui.onmessage;
}
const tick = () => new Promise((r) => setTimeout(r, 0));

const N = 6;
const sample = bundle.icons.slice(0, N);
const getPage = (figma) => figma.root.children.find((p) => p.name === 'Lucide Icons');
const baseRun = (extra) => Object.assign({ type: 'run', icons: sample, sizes: [16, 20, 24, 32], skipExisting: true, version: '1.17.0' }, extra);

test('1 ComponentSet por ícone (lucide/<nome>), cada um com 4 variantes Size', async () => {
  const { figma, messages } = makeFigma();
  const onmsg = load(figma);
  await onmsg(baseRun());
  const done = messages.find((m) => m.type === 'done');
  assert.equal(done.created, N); assert.equal(done.failed, 0);
  const sets = getPage(figma).findAllWithCriteria({ types: ['COMPONENT_SET'] });
  assert.equal(sets.length, N);
  for (const s of sets) {
    assert.ok(s.name.startsWith('lucide/'));
    const variants = s.children.filter((c) => c.type === 'COMPONENT');
    assert.deepEqual(variants.map((v) => v.name).sort(), ['Size=16', 'Size=20', 'Size=24', 'Size=32']);
    const byName = Object.fromEntries(variants.map((v) => [v.name, v]));
    assert.equal(byName['Size=16'].width, 16); assert.equal(byName['Size=32'].width, 32);
  }
});

test('grid: 6 sets na primeira linha, x = 48 + col*200', async () => {
  const { figma } = makeFigma();
  const onmsg = load(figma);
  await onmsg(baseRun());
  const container = getPage(figma).children.find((n) => n.type === 'FRAME');
  const sets = container.children.filter((c) => c.type === 'COMPONENT_SET');
  sets.forEach((s, i) => { assert.equal(s.x, 48 + i * 200); assert.equal(s.y, 48); });
});

test('NÃO cria collection nova — reusa os primitivos existentes', async () => {
  const { figma, collections } = makeFigma({ withVar: true });
  const before = collections.length;
  const onmsg = load(figma);
  await onmsg(baseRun({ icons: sample.slice(0, 1), colorVarId: '' }));
  assert.equal(collections.length, before, 'criou collection nova');
  assert.ok(!collections.find((c) => c.name === 'Icon'), 'não deveria existir collection Icon');
});

test('bind: width/height → icon/* (por valor) e strokeWeight → border-width/*', async () => {
  const { figma, variables } = makeFigma({ withVar: true });
  const onmsg = load(figma);
  await onmsg(baseRun({ icons: sample.slice(0, 1), colorVarId: '', strokes: { 16: 1, 20: 1, 24: 2, 32: 2 } }));
  const idOf = (n) => variables.find((v) => v.name === n).id;
  const set = getPage(figma).findAllWithCriteria({ types: ['COMPONENT_SET'] })[0];

  const v16 = set.children.find((c) => c.name === 'Size=16');
  assert.equal(v16.boundVariables.width.id, idOf('icon/sm'));
  assert.equal(v16.boundVariables.height.id, idOf('icon/sm'));
  for (const s of v16.findAll((n) => n.type === 'VECTOR' && n.strokes && n.strokes.length)) assert.equal(s.boundVariables.strokeWeight.id, idOf('border-width/1'));

  const v24 = set.children.find((c) => c.name === 'Size=24');
  assert.equal(v24.boundVariables.width.id, idOf('icon/lg'));
  for (const s of v24.findAll((n) => n.type === 'VECTOR' && n.strokes && n.strokes.length)) assert.equal(s.boundVariables.strokeWeight.id, idOf('border-width/2'));
});

test('sem primitivos no arquivo → não liga tamanho/espessura (boundSizes=false), mas cria', async () => {
  const { figma, messages } = makeFigma({ withVar: false }); // sem icon/* nem border-width/*
  const onmsg = load(figma);
  await onmsg(baseRun({ icons: sample.slice(0, 1), colorVarId: '' }));
  const done = messages.find((m) => m.type === 'done');
  assert.equal(done.boundSizes, false); assert.equal(done.boundStroke, false); assert.equal(done.created, 1);
});

test('cor: ligada por colorVarId (stroke+fill), linked=true', async () => {
  const { figma, messages, colorVarId } = makeFigma({ withVar: true });
  const onmsg = load(figma);
  await onmsg(baseRun({ icons: sample.slice(0, 1), colorVarId }));
  assert.equal(messages.find((m) => m.type === 'done').linked, true);
  const page = getPage(figma);
  const stroked = page.findAll((n) => n.type === 'VECTOR' && n.strokes && n.strokes.length);
  const filled = page.findAll((n) => n.type === 'VECTOR' && n.fills && n.fills.length);
  for (const v of stroked) assert.equal(v.strokes[0].boundVariables.color.id, colorVarId);
  for (const v of filled) assert.equal(v.fills[0].boundVariables.color.id, colorVarId);
});

test('cor: colorVarId vazio → cor fixa, linked=false', async () => {
  const { figma, messages } = makeFigma();
  const onmsg = load(figma);
  await onmsg(baseRun({ icons: sample.slice(0, 1), colorVarId: '' }));
  assert.equal(messages.find((m) => m.type === 'done').linked, false);
});

test('linked honesto: se setBoundVariableForPaint lança → linked=false, mas cria', async () => {
  const { figma, messages, colorVarId } = makeFigma({ withVar: true });
  figma.variables.setBoundVariableForPaint = () => { throw new Error('API indisponível'); };
  const onmsg = load(figma);
  await onmsg(baseRun({ icons: sample.slice(0, 1), colorVarId }));
  const done = messages.find((m) => m.type === 'done');
  assert.equal(done.linked, false); assert.equal(done.created, 1);
});

test('retomar (skip): 2ª rodada pula tudo, sem duplicar', async () => {
  const { figma, messages } = makeFigma();
  const onmsg = load(figma);
  await onmsg(baseRun()); await onmsg(baseRun());
  const dones = messages.filter((m) => m.type === 'done');
  assert.equal(dones[1].created, 0); assert.equal(dones[1].skipped, N);
  assert.equal(getPage(figma).findAllWithCriteria({ types: ['COMPONENT_SET'] }).length, N);
});

test('sync: sobrescreve existentes (updated) e remove órfãos', async () => {
  const { figma, messages } = makeFigma();
  const onmsg = load(figma);
  await onmsg(baseRun({ icons: sample.slice(0, 3) }));      // cria 3
  const page = getPage(figma);
  const orphan = new Node('COMPONENT_SET'); orphan.name = 'lucide/zzz-orphan'; page.appendChild(orphan); // injeta órfão
  const allNames = bundle.icons.map((i) => i.name);
  await onmsg(baseRun({ icons: sample.slice(0, 3), mode: 'sync', allNames }));
  const done = messages.filter((m) => m.type === 'done').pop();
  assert.equal(done.updated, 3); assert.equal(done.created, 0); assert.equal(done.orphans, 1);
  const names = page.findAllWithCriteria({ types: ['COMPONENT_SET'] }).map((s) => s.name);
  assert.ok(!names.includes('lucide/zzz-orphan'), 'órfão não removido');
  assert.equal(names.length, 3, 'deveria sobrar só os 3 (sem duplicar)');
});

test('dry-run: prevê create/update/órfãos SEM mexer no documento', async () => {
  const { figma, messages } = makeFigma();
  const onmsg = load(figma);
  await onmsg(baseRun({ icons: sample.slice(0, 3) }));
  const page = getPage(figma);
  const orphan = new Node('COMPONENT_SET'); orphan.name = 'lucide/zzz-orphan'; page.appendChild(orphan);
  const before = page.findAllWithCriteria({ types: ['COMPONENT_SET'] }).length;
  const allNames = bundle.icons.map((i) => i.name);
  await onmsg({ type: 'dryRun', names: sample.slice(0, 5).map((i) => i.name), allNames, mode: 'sync', pageName: 'Lucide Icons' });
  const plan = messages.filter((m) => m.type === 'syncPlan').pop();
  assert.equal(plan.willUpdate, 3); assert.equal(plan.willCreate, 2); assert.equal(plan.willRemoveOrphans, 1);
  assert.equal(page.findAllWithCriteria({ types: ['COMPONENT_SET'] }).length, before, 'dry-run mexeu no doc');
});

test('saveBundle persiste SEM tags (cabe na cota)', async () => {
  const { figma, store } = makeFigma();
  const onmsg = load(figma);
  await onmsg({ type: 'saveBundle', bundle: { version: '1.17.0', icons: [{ name: 'x', svg: '<svg></svg>', tags: ['a', 'b'], alias: true }] } });
  const saved = store.get('crpIcons:bundle:lucide');
  assert.ok(saved && saved.icons.length === 1);
  assert.ok(!('tags' in saved.icons[0]), 'tags deveriam ter sido removidas');
  assert.equal(saved.icons[0].alias, true);
});

test('persistência: salva prefs (clientStorage) e saveBundle grava o bundle', async () => {
  const { figma, store } = makeFigma();
  const onmsg = load(figma);
  await onmsg({ type: 'saveBundle', bundle: { icons: [], version: '1.17.0' } });
  await onmsg(baseRun({ colorVarId: '', strokes: { 16: 1.25 } }));
  assert.ok(store.has('crpIcons:bundle:lucide'), 'bundle não persistido');
  const prefs = store.get('crpLucide:prefs');
  assert.ok(prefs && Array.isArray(prefs.sizes)); assert.equal(prefs.strokes['16'], 1.25);
  assert.equal(prefs.mode, 'skip');
  assert.equal(prefs.v, 2, 'prefs precisam carimbar a versão p/ não sobrescrever defaults novos');
});

test('init: manda colorVars, embeddedMeta, fonte/estilo ativos e prefs (UI pede o bundle depois)', async () => {
  const { figma, messages, store } = makeFigma({ withVar: true });
  store.set('crpLucide:prefs', { sizes: [24], colorVarId: '', strokes: { 24: 2 }, activeSource: 'material', activeStyle: 'rounded' });
  loadEmbed(figma, { 'lucide': 'L', 'material:rounded': 'R' }, { 'lucide': { count: 1 }, 'material:rounded': { count: 2 } });
  await tick();
  const init = messages.find((m) => m.type === 'init');
  assert.ok(init, 'sem init');
  assert.ok(init.colorVars.some((v) => v.name === 'primary-foreground'));
  assert.deepEqual(init.prefs.sizes, [24]);
  assert.equal(init.savedSource, 'material'); assert.equal(init.savedStyle, 'rounded');
  assert.ok(init.embeddedMeta && init.embeddedMeta['material:rounded'], 'embeddedMeta deveria listar os conjuntos embutidos');
});

test('getBundle: embed devolve o blob; sem embed cai p/ clientStorage; nada -> null', async () => {
  // com embed (incl. variante fill)
  let f = makeFigma();
  let onmsg = loadEmbed(f.figma, { 'lucide': 'BLOB', 'material:sharp': 'MS', 'material:sharp:fill': 'MSF' }, {});
  await onmsg({ type: 'getBundle', source: 'lucide' });
  await onmsg({ type: 'getBundle', source: 'material', style: 'sharp' });
  await onmsg({ type: 'getBundle', source: 'material', style: 'sharp', filled: true });
  let bs = f.messages.filter((m) => m.type === 'bundle');
  assert.equal(bs[0].blob, 'BLOB'); assert.equal(bs[0].bundle, null);
  assert.equal(bs[1].blob, 'MS'); assert.equal(bs[1].style, 'sharp'); assert.equal(bs[1].filled, false);
  assert.equal(bs[2].blob, 'MSF'); assert.equal(bs[2].filled, true);

  // sem embed -> clientStorage
  f = makeFigma();
  f.store.set('crpIcons:bundle:lucide', { icons: [{ name: 'x', svg: '<svg></svg>' }], version: '1' });
  onmsg = load(f.figma);
  await onmsg({ type: 'getBundle', source: 'lucide' });
  await onmsg({ type: 'getBundle', source: 'material', style: 'outlined' });
  bs = f.messages.filter((m) => m.type === 'bundle');
  assert.equal(bs[0].blob, null); assert.ok(bs[0].bundle && bs[0].bundle.icons.length === 1);
  assert.equal(bs[1].blob, null); assert.equal(bs[1].bundle, null);
});

test('subset de tamanhos gera só essas variantes', async () => {
  const { figma } = makeFigma();
  const onmsg = load(figma);
  await onmsg(baseRun({ icons: sample.slice(0, 2), sizes: [16, 32] }));
  const sets = getPage(figma).findAllWithCriteria({ types: ['COMPONENT_SET'] });
  for (const s of sets) assert.deepEqual(s.children.map((c) => c.name).sort(), ['Size=16', 'Size=32']);
});

test('variante padrão: Size=20 é o 1º filho do set por default', async () => {
  const { figma } = makeFigma();
  const onmsg = load(figma);
  await onmsg(baseRun({ icons: sample.slice(0, 1) }));
  const set = getPage(figma).findAllWithCriteria({ types: ['COMPONENT_SET'] })[0];
  assert.equal(set.children[0].name, 'Size=20', 'default deveria ser 20');
  // todas as 4 variantes continuam presentes
  assert.deepEqual(set.children.map((c) => c.name).sort(), ['Size=16', 'Size=20', 'Size=24', 'Size=32']);
});

test('defaultSize escolhido vira o 1º filho; se não estiver nos tamanhos, cai p/ o menor', async () => {
  let { figma } = makeFigma();
  let onmsg = load(figma);
  await onmsg(baseRun({ icons: sample.slice(0, 1), defaultSize: 24 }));
  let set = getPage(figma).findAllWithCriteria({ types: ['COMPONENT_SET'] })[0];
  assert.equal(set.children[0].name, 'Size=24');

  ({ figma } = makeFigma());
  onmsg = load(figma);
  await onmsg(baseRun({ icons: sample.slice(0, 1), sizes: [16, 32], defaultSize: 20 })); // 20 não selecionado
  set = getPage(figma).findAllWithCriteria({ types: ['COMPONENT_SET'] })[0];
  assert.equal(set.children[0].name, 'Size=16', 'sem 20, cai p/ o menor');
});

test('prefs guarda o defaultSize', async () => {
  const { figma, store } = makeFigma();
  const onmsg = load(figma);
  await onmsg(baseRun({ icons: sample.slice(0, 1), defaultSize: 32 }));
  assert.equal(store.get('crpLucide:prefs').defaultSize, 32);
});

test('clearAll: remove todos os lucide/* e o frame-grid vazio, sem tocar no resto', async () => {
  const { figma, messages } = makeFigma();
  const onmsg = load(figma);
  await onmsg(baseRun({ icons: sample.slice(0, 3) }));
  const page = getPage(figma);
  // nó alheio que NÃO deve sumir
  const keep = new Node('FRAME'); keep.name = 'Outra coisa'; page.appendChild(keep);
  assert.equal(page.findAllWithCriteria({ types: ['COMPONENT_SET'] }).length, 3);

  await onmsg({ type: 'clearAll', pageName: 'Lucide Icons' });
  const cleared = messages.filter((m) => m.type === 'cleared').pop();
  assert.equal(cleared.removed, 3);
  assert.equal(page.findAllWithCriteria({ types: ['COMPONENT_SET'] }).length, 0, 'sobrou lucide/*');
  assert.equal(page.children.filter((n) => n.type === 'FRAME' && String(n.name).indexOf('Lucide') === 0).length, 0, 'frame-grid vazio não removido');
  assert.ok(page.children.indexOf(keep) >= 0, 'removeu nó alheio');
});

test('clearAll sem nada gerado → removed=0', async () => {
  const { figma, messages } = makeFigma();
  const onmsg = load(figma);
  await onmsg({ type: 'clearAll', pageName: 'Lucide Icons' });
  assert.equal(messages.filter((m) => m.type === 'cleared').pop().removed, 0);
});

test('Material: prefixo material-<estilo>/, página própria, base 48 reescala certo, fill colorido, sem stroke', async () => {
  const { figma, messages, colorVarId } = makeFigma({ withVar: true });
  const onmsg = load(figma);
  const mat = { name: 'home', svg: '<svg fill="currentColor" width="48" height="48" viewBox="0 -960 960 960"><path d="M0 0h10"/></svg>', tags: [] };
  await onmsg({ type: 'run', icons: [mat], sizes: [16, 24], source: 'material', style: 'outlined', colorVarId, version: '0.44.12' });

  const page = figma.root.children.find((p) => p.name === 'Material Outlined');
  assert.ok(page, 'página "Material Outlined" não criada');
  const sets = page.findAllWithCriteria({ types: ['COMPONENT_SET'] });
  assert.equal(sets.length, 1);
  assert.equal(sets[0].name, 'material-outlined/home', 'prefixo do set errado');

  // viewBox/base 48 -> reescala pro alvo (prova que não assume 24)
  assert.equal(sets[0].children.find((c) => c.name === 'Size=24').width, 24);
  assert.equal(sets[0].children.find((c) => c.name === 'Size=16').width, 16);

  // cor ligada no FILL (Material é preenchido)
  const filled = page.findAll((n) => n.type === 'VECTOR' && n.fills && n.fills.length);
  assert.ok(filled.length);
  for (const f of filled) assert.equal(f.fills[0].boundVariables.color.id, colorVarId);

  const done = messages.filter((m) => m.type === 'done').pop();
  assert.equal(done.source, 'material'); assert.equal(done.fill, true);
  assert.equal(done.boundStroke, false, 'Material não liga espessura (sem stroke)');
});

test('Material fill: prefixo material-<estilo>-fill/ e página própria', async () => {
  const { figma, messages } = makeFigma({ withVar: true });
  const onmsg = load(figma);
  const mat = { name: 'home', svg: '<svg fill="currentColor" width="48" height="48" viewBox="0 -960 960 960"><path d="M0 0h10"/></svg>', tags: [] };
  await onmsg({ type: 'run', icons: [mat], sizes: [24], source: 'material', style: 'sharp', filled: true, colorVarId: '' });
  const page = figma.root.children.find((p) => p.name === 'Material Sharp Fill');
  assert.ok(page, 'página "Material Sharp Fill" não criada');
  const sets = page.findAllWithCriteria({ types: ['COMPONENT_SET'] });
  assert.equal(sets.length, 1); assert.equal(sets[0].name, 'material-sharp-fill/home');
  assert.equal(messages.filter((m) => m.type === 'done').pop().filled, true);
});

test('Material e Lucide não colidem: páginas e prefixos separados', async () => {
  const { figma } = makeFigma({ withVar: true });
  const onmsg = load(figma);
  const mat = { name: 'home', svg: '<svg fill="currentColor" width="48" height="48" viewBox="0 -960 960 960"><path d="M0 0h10"/></svg>', tags: [] };
  await onmsg(baseRun({ icons: sample.slice(0, 2) }));                                  // lucide
  await onmsg({ type: 'run', icons: [mat], sizes: [24], source: 'material', style: 'rounded', colorVarId: '' });
  const lucidePage = figma.root.children.find((p) => p.name === 'Lucide Icons');
  const matPage = figma.root.children.find((p) => p.name === 'Material Rounded');
  assert.ok(lucidePage && matPage, 'páginas separadas não criadas');
  assert.equal(lucidePage.findAllWithCriteria({ types: ['COMPONENT_SET'] }).length, 2);
  const mset = matPage.findAllWithCriteria({ types: ['COMPONENT_SET'] });
  assert.equal(mset.length, 1); assert.equal(mset[0].name, 'material-rounded/home');
});

test('svg inválido conta como failed e não derruba o lote', async () => {
  const { figma, messages } = makeFigma();
  const onmsg = load(figma);
  const icons = [{ name: 'bom', svg: bundle.icons[0].svg, tags: [] }, { name: 'ruim', svg: 'não é svg', tags: [] }];
  await onmsg(baseRun({ icons }));
  const done = messages.find((m) => m.type === 'done');
  assert.equal(done.created, 1); assert.equal(done.failed, 1);
});

test('emite progresso', async () => {
  const { figma, messages } = makeFigma();
  const onmsg = load(figma);
  await onmsg(baseRun());
  assert.ok(messages.some((m) => m.type === 'progress'));
});
