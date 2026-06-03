// CRP DS — Tokens → Figma Variables + Styles.
// Consome figma-plugin/figma-variables.json (gerado por `npm run export:figma`): collections
// JÁ RESOLVIDAS — Primitives (paleta), Brand (CRP/MarcaB), Modes (Light/Dark), Base (semânticos
// invariáveis + tipografia escalar) e Components — MAIS `styles` (compostos: Text/Effect/Paint/Grid).
//
// O trabalho pesado (fundir brand+mode por tema, resolver alias, converter cor, decompor sombra)
// acontece no EXPORT. Aqui o plugin CRIA: collections → modes → variáveis → valor/alias, e os Styles.
// Recursos: seleção granular (parts), DRY-RUN (preview), PRUNE de órfãos (opt-in), relatório
// criados/atualizados/removidos, lembrar escolhas (clientStorage) e aplicar marca/modo na seleção.
//
// Mensagens UI→plugin: import{doc,parts,prune,hidePrimitives} · preview{doc,parts,prune} · audit{doc,parts,silent}
//   · applyMode{brand,light} · buildSheet · buildButton · cancel · loadPrefs · close.
// plugin→UI: log · error · previewResult · auditResult · progress · done · prefs · modeApplied · sheetDone
//
// Formato do bundle:
//   { collections:[ { name, modes:[...], variables:[ { name,type,scopes?,code?,description?,
//       values:{ <mode>:{alias}|{color}|{number}|{string} } } ] } ],
//     styles:{ textFamilies:[...], text:[{name,fontFamilies,fontWeight,fontSize,lineHeight,letterSpacing,
//       textDecoration,bind,description?}], effect:[...], paint:[...], grid:[...] } }

figma.showUI(__html__, { width: 480, height: 660, themeColors: true });

const ui = (m) => figma.ui.postMessage(m);
const log = (line) => ui({ type: 'log', line });

// famílias de style ↔ "kind" das APIs getLocal*Styles / create*Style
const STYLE_KIND = { text: 'Text', paint: 'Paint', effect: 'Effect', grid: 'Grid' };
// namespaces que SÃO nossos (p/ o prune nunca tocar em styles do usuário). ∪ registro persistido.
const MANAGED = {
  text: (n) => /^(Display|Heading|Body|Label|Link|Caption|Overline|Code)\//.test(n) || /^Text\//.test(n) || ['Display', 'Link', 'Caption', 'Overline', 'Code'].indexOf(n) >= 0,
  paint: (n) => /^Color\//.test(n),
  effect: (n) => /^Elevation\//.test(n),
  grid: (n) => /^(Grid|Columns)\//.test(n),
};
const PREFS_KEY = 'crpds:lastParts';
const REG_KEY = 'crpds:createdStyles';

let CANCELLED = false; // flag cooperativa p/ cancelar imports grandes

// #2 guard de versão: o bundle carrega "$schema"; avisamos (não-fatal) se for de uma versão que este
// plugin não conhece, em vez de importar errado em silêncio.
const SUPPORTED_SCHEMA = 'crp-figma-variables/2';
function schemaWarn(doc) {
  const s = doc && doc.$schema;
  if (!s) { log('  ⚠ bundle sem $schema — pode ser um export antigo; gere com `npm run export:figma`.'); return; }
  if (s !== SUPPORTED_SCHEMA) log('  ⚠ versão do bundle "' + s + '" — este plugin entende "' + SUPPORTED_SCHEMA + '". Atualize o plugin ou regenere o bundle.');
}
const notify = (m, opts) => { try { figma.notify(m, opts); } catch (e) {} }; // #4 toast (no-op fora do Figma)

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'cancel') { CANCELLED = true; return; } // não-bloqueante
  try {
    if (msg.type === 'import') { CANCELLED = false; await runImport(msg.doc, msg.parts, !!msg.prune, !!msg.hidePrimitives); }
    else if (msg.type === 'preview') await runPreview(msg.doc, msg.parts, !!msg.prune);
    else if (msg.type === 'audit') await runAudit(msg.doc, msg.parts, !!msg.silent);
    else if (msg.type === 'fixDrift') { CANCELLED = false; await runFix(msg.doc, msg.parts, msg.report); }
    else if (msg.type === 'applyMode') await applyMode(msg.brand, msg.light);
    else if (msg.type === 'buildSheet') await buildSheet();
    else if (msg.type === 'buildButton') await buildButton();
    else if (msg.type === 'loadPrefs') await sendPrefs();
    else if (msg.type === 'close') figma.closePlugin();
  } catch (e) {
    const m = 'Falhou: ' + (e && e.message ? e.message : String(e));
    ui({ type: 'error', line: m });
    notify(m, { error: true });
  }
};

// ---------------- leituras (async-first, com fallback síncrono) ----------------
async function getCollections() {
  const fn = figma.variables.getLocalVariableCollectionsAsync;
  if (typeof fn === 'function') return await fn.call(figma.variables);
  return figma.variables.getLocalVariableCollections();
}
async function getVariables() {
  const fn = figma.variables.getLocalVariablesAsync;
  if (typeof fn === 'function') return await fn.call(figma.variables);
  return figma.variables.getLocalVariables();
}
async function getLocalStyles(kind) {
  const fn = figma['getLocal' + kind + 'StylesAsync'];
  if (typeof fn === 'function') return await fn.call(figma);
  return figma['getLocal' + kind + 'Styles']();
}
async function styleIndex(kind) {
  const m = new Map();
  for (const s of await getLocalStyles(kind)) m.set(s.name, s);
  return m;
}

// ---------------- clientStorage (lembrar escolhas + registro p/ prune) ----------------
async function loadRegistry() { try { return (await figma.clientStorage.getAsync(REG_KEY)) || {}; } catch (e) { return {}; } }
async function saveRegistry(reg) { try { await figma.clientStorage.setAsync(REG_KEY, reg); } catch (e) {} }
async function savePrefs(parts) { try { if (parts) await figma.clientStorage.setAsync(PREFS_KEY, parts); } catch (e) {} }
async function sendPrefs() {
  let parts = null;
  try { parts = await figma.clientStorage.getAsync(PREFS_KEY); } catch (e) {}
  ui({ type: 'prefs', parts: parts || null });
}

// ---------------- seleção granular ----------------
function normalizeParts(p) {
  return {
    coll: (fullName) => (!p || !p.collections) ? true : p.collections[fullName.replace('CRP/', '')] !== false,
    style: (fam) => (!p || !p.styles) ? true : p.styles[fam] !== false,
  };
}
function validDoc(doc) { return !!(doc && (Array.isArray(doc.collections) || doc.styles)); }
function docErr() {
  return new Error('JSON inesperado. Selecione figma-plugin/figma-variables.json (gere com ' +
    '`npm run export:figma`) — não o tokens.json do Token Studio.');
}

// ---------------- DIFF (read-only) — usado por preview e import ----------------
async function computePlan(doc, want, prune, registry) {
  const plan = { collections: {}, styles: {}, totals: { create: 0, update: 0, remove: 0 } };
  const add = (bucket, key, create, update, removeNames) => {
    bucket[key] = { create, update, remove: removeNames.length, removeNames };
    plan.totals.create += create; plan.totals.update += update; plan.totals.remove += removeNames.length;
  };

  // VARIABLES
  const colls = await getCollections();
  const vars = await getVariables();
  const namesByColl = new Map();
  for (const v of vars) {
    if (!namesByColl.has(v.variableCollectionId)) namesByColl.set(v.variableCollectionId, new Set());
    namesByColl.get(v.variableCollectionId).add(v.name);
  }
  for (const c of (doc.collections || [])) {
    if (!c.variables || !c.variables.length || !want.coll(c.name)) continue;
    const ex = colls.find((x) => x.name === c.name);
    const exNames = ex ? (namesByColl.get(ex.id) || new Set()) : new Set();
    const bundleNames = new Set(c.variables.map((v) => v.name));
    let create = 0, update = 0;
    for (const n of bundleNames) (exNames.has(n) ? update++ : create++);
    const removeNames = (prune && ex) ? [...exNames].filter((n) => !bundleNames.has(n)) : [];
    add(plan.collections, c.name, create, update, removeNames);
  }

  // STYLES
  const S = doc.styles || {};
  for (const fam of ['text', 'paint', 'effect', 'grid']) {
    if (!want.style(fam) || !Array.isArray(S[fam]) || !S[fam].length) continue;
    const existing = await styleIndex(STYLE_KIND[fam]);
    const bundleNames = new Set(S[fam].map((s) => s.name));
    let create = 0, update = 0;
    for (const n of bundleNames) (existing.has(n) ? update++ : create++);
    const reg = new Set((registry && registry[fam]) || []);
    const removeNames = prune
      ? [...existing.keys()].filter((n) => !bundleNames.has(n) && (MANAGED[fam](n) || reg.has(n)))
      : [];
    add(plan.styles, fam, create, update, removeNames);
  }

  // WARNINGS (#3): dependências faltantes — alvos de alias/bind que NÃO estão selecionados nem já existem
  // no arquivo. É exatamente o caso de marcar uma camada dependente (só Modes, só Text) sem seus alvos:
  // os aliases/binds ficariam vazios. Surfaceamos no dry-run, ANTES de escrever.
  const figmaNames = new Set(vars.map((v) => v.name));
  const owner = new Map(); // nome → collection que o declara no bundle (p/ a dica de "quem falta")
  for (const c of (doc.collections || [])) for (const v of (c.variables || [])) if (!owner.has(v.name)) owner.set(v.name, c.name);
  const selBundleNames = new Set();
  for (const c of (doc.collections || [])) if (want.coll(c.name) && c.variables) for (const v of c.variables) selBundleNames.add(v.name);
  const resolvable = (name) => selBundleNames.has(name) || figmaNames.has(name);
  const aliasMiss = new Map(); // ownerColl → Set(alvos)
  for (const c of (doc.collections || [])) {
    if (!want.coll(c.name) || !c.variables) continue;
    for (const v of c.variables) for (const mk of Object.keys(v.values || {})) {
      const tgt = v.values[mk] && v.values[mk].alias;
      if (tgt === undefined || resolvable(tgt)) continue;
      const oc = owner.get(tgt) || '(ausente no bundle)';
      if (!aliasMiss.has(oc)) aliasMiss.set(oc, new Set());
      aliasMiss.get(oc).add(tgt);
    }
  }
  const bindMiss = new Map();
  const addBind = (tgt) => {
    if (!tgt || resolvable(tgt)) return;
    const oc = owner.get(tgt) || '(ausente no bundle)';
    if (!bindMiss.has(oc)) bindMiss.set(oc, new Set());
    bindMiss.get(oc).add(tgt);
  };
  if (want.style('text') && Array.isArray(S.text)) for (const t of S.text) { const b = t.bind || {}; for (const f of Object.keys(b)) addBind(b[f]); }
  if (want.style('paint') && Array.isArray(S.paint)) for (const p of S.paint) addBind(p.boundVariable);
  const warnings = [];
  const fmtMiss = (kind, m) => {
    for (const [oc, set] of m) {
      const names = [...set];
      const sample = names.slice(0, 3).map((n) => n.replace('CRP/', '')).join(', ') + (names.length > 3 ? ' +' + (names.length - 3) : '');
      const where = oc === '(ausente no bundle)' ? oc : oc.replace('CRP/', '') + ' (não selecionada/ausente)';
      warnings.push(kind + ' → ' + where + ': ' + sample);
    }
  };
  fmtMiss('aliases', aliasMiss);
  fmtMiss('binds de style', bindMiss);
  plan.warnings = warnings;
  return plan;
}

async function runPreview(doc, partsIn, prune) {
  if (!validDoc(doc)) throw docErr();
  const want = normalizeParts(partsIn);
  const registry = await loadRegistry();
  const plan = await computePlan(doc, want, prune, registry);
  ui({ type: 'previewResult', plan, prune: !!prune });
}

// ---------------- collections / variáveis ----------------
function setupCollection(name, modeNames, collsByName) {
  let coll = collsByName.get(name) || null;
  if (!coll) { coll = figma.variables.createVariableCollection(name); collsByName.set(name, coll); }
  const modeIds = {};
  modeNames.forEach((mn, i) => {
    const ex = coll.modes.find((m) => m.name === mn);
    if (ex) modeIds[mn] = ex.modeId;
    else if (i === 0 && coll.modes.length === 1) { coll.renameMode(coll.modes[0].modeId, mn); modeIds[mn] = coll.modes[0].modeId; }
    else {
      // não-fatal: no Starter o addMode pode falhar — avisa e PULA o mode (valores dele são ignorados).
      try { modeIds[mn] = coll.addMode(mn); }
      catch (e) { log('  ⚠ mode "' + mn + '" não criado em ' + name + ' (limite do plano?) — pulando esse mode.'); }
    }
  });
  return { coll, modeIds };
}
function createVariableCompat(name, coll, type) {
  try { return figma.variables.createVariable(name, coll, type); }
  catch (e) { return figma.variables.createVariable(name, coll.id, type); } // assinatura antiga
}

async function runImport(doc, partsIn, prune, hidePrimitives) {
  if (!validDoc(doc)) throw docErr();
  schemaWarn(doc);
  const want = normalizeParts(partsIn);
  const registry = await loadRegistry();
  const plan = await computePlan(doc, want, prune, registry); // criar/atualizar/remover previstos

  const stats = {
    plan, collections: 0, variables: 0, aliases: 0, aliasMissing: 0, valueErrors: 0, nameCollisions: 0,
    textStyles: 0, textBound: 0, paintStyles: 0, paintBound: 0, effectStyles: 0, gridStyles: 0,
    removedVars: 0, removedStyles: 0, styleWarnings: 0, cancelled: false,
  };

  // #2B aviso defensivo: nome repetido entre collections do bundle. Aliases resolvem por nome puro,
  // então uma colisão mis-bindaria em silêncio — o build (verify-figma) já barra isso fatalmente; aqui
  // só surfaceamos caso um bundle antigo/forjado escape.
  {
    const firstColl = new Map();
    for (const c of (doc.collections || [])) for (const d of (c.variables || [])) {
      if (firstColl.has(d.name) && firstColl.get(d.name) !== c.name) {
        stats.nameCollisions++;
        log('  ⚠ nome em colisão entre collections: ' + d.name + ' (' + firstColl.get(d.name) + ' e ' + c.name + ')');
      } else if (!firstColl.has(d.name)) firstColl.set(d.name, c.name);
    }
  }

  const byName = new Map(); // nome → variável (alias cross-collection / binding de styles)
  const allVars = await getVariables();
  for (const v of allVars) byName.set(v.name, v);
  const allColls = await getCollections();
  const collsByName = new Map(allColls.map((c) => [c.name, c]));
  const index = new Map(); // collId::name → var (idempotência + base do prune)
  for (const v of allVars) index.set(v.variableCollectionId + '::' + v.name, v);

  // progresso: 1 passo por collection criada + N batches da passagem de VALORES (a parte lenta) + 1 por
  // família de style. Sem os batches de valores a barra enchia 100% na criação e "congelava" no set de valores.
  const selColls = (doc.collections || []).filter((c) => c.variables && c.variables.length && want.coll(c.name));
  const selFams = ['text', 'paint', 'effect', 'grid'].filter((f) => want.style(f) && doc.styles && Array.isArray(doc.styles[f]) && doc.styles[f].length);
  const VBATCH = 25;
  const totalVars = selColls.reduce((a, c) => a + c.variables.length, 0);
  const valueSteps = Math.ceil(totalVars / VBATCH);
  const prog = { done: 0, total: selColls.length + valueSteps + selFams.length };
  const tick = (label) => ui({ type: 'progress', label: label, done: Math.min(++prog.done, prog.total), total: prog.total });

  // ---- VARIABLES (só collections selecionadas) ----
  const appliedVarColls = [];
  if (selColls.length) {
    const created = [];
    for (const c of selColls) {
      if (CANCELLED) break;
      log(c.name + '… (' + c.variables.length + ')');
      const { coll, modeIds } = setupCollection(c.name, c.modes, collsByName);
      stats.collections++;
      if (c.name === 'CRP/Primitives') { try { coll.hiddenFromPublishing = !!hidePrimitives; } catch (e) {} } // higiene de publicação
      const getOrCreate = (name, type) => {
        const key = coll.id + '::' + name;
        const found = index.get(key);
        if (found) { if (found.resolvedType === type) return found; found.remove(); }
        const cr = createVariableCompat(name, coll, type);
        index.set(key, cr);
        return cr;
      };
      for (const def of c.variables) {
        if (CANCELLED) break;
        const v = getOrCreate(def.name, def.type);
        byName.set(def.name, v);
        if (def.scopes) { try { v.scopes = def.scopes; } catch (e) {} }
        if (def.description) { try { v.description = def.description; } catch (e) {} }
        if (def.code && typeof v.setVariableCodeSyntax === 'function') { try { v.setVariableCodeSyntax('WEB', 'var(' + def.code + ')'); } catch (e) {} }
        created.push({ v, def, modeIds });
        stats.variables++;
      }
      appliedVarColls.push({ coll, bundleNames: new Set(c.variables.map((d) => d.name)) });
      tick(c.name.replace('CRP/', ''));
    }
    // valores por mode: alias (cross-collection, por nome) ou valor cru.
    // #1: cada aplicação é guardada — um valor/alias ruim (cor malformada, mismatch de tipo, mode recusado)
    // NÃO derruba mais o import inteiro; conta em valueErrors, loga e segue (igual aos styles).
    let vcount = 0;
    for (const item of created) {
      if (CANCELLED) break;
      const v = item.v, def = item.def, modeIds = item.modeIds;
      for (const mode of Object.keys(def.values)) {
        const modeId = modeIds[mode];
        if (modeId === undefined) continue;
        const val = def.values[mode];
        try {
          if (val.alias !== undefined) {
            const tv = byName.get(val.alias);
            if (!tv) { stats.aliasMissing++; log('  ⚠ alias não encontrado: ' + val.alias); continue; }
            v.setValueForMode(modeId, figma.variables.createVariableAlias(tv));
            stats.aliases++;
          } else if (val.color !== undefined) v.setValueForMode(modeId, val.color);
          else if (val.number !== undefined) v.setValueForMode(modeId, val.number);
          else if (val.string !== undefined) v.setValueForMode(modeId, val.string);
        } catch (e) {
          stats.valueErrors++;
          log('  ⚠ valor falhou: ' + def.name + '[' + mode + ']: ' + (e && e.message ? e.message : e));
        }
      }
      if (++vcount % VBATCH === 0) tick('valores'); // #4: progresso da passagem de valores
    }
    if (!CANCELLED && vcount % VBATCH !== 0) tick('valores'); // resto
  }

  // ---- STYLES (só famílias selecionadas) ----
  const appliedStyleNames = {}; // fam → [names criados/atualizados]
  if (!CANCELLED) await createStyles(doc.styles, byName, stats, want, appliedStyleNames, tick);

  // ---- PRUNE (opt-in): remove só o que é NOSSO e sumiu do bundle ----
  if (prune && !CANCELLED) {
    for (const { coll, bundleNames } of appliedVarColls) {
      const prefix = coll.id + '::';
      const orphans = [];
      for (const [key, v] of index) if (key.indexOf(prefix) === 0 && !bundleNames.has(key.slice(prefix.length))) orphans.push([key, v]);
      for (const [key, v] of orphans) {
        try { v.remove(); stats.removedVars++; log('  − var ' + coll.name + '/' + key.slice(prefix.length)); index.delete(key); }
        catch (e) { stats.styleWarnings++; log('  ⚠ não removeu var ' + key.slice(prefix.length)); }
      }
    }
    for (const fam of Object.keys(appliedStyleNames)) {
      const existing = await styleIndex(STYLE_KIND[fam]);
      const bundleNames = new Set(appliedStyleNames[fam]);
      const reg = new Set((registry && registry[fam]) || []);
      for (const [nm, s] of existing) {
        if (!bundleNames.has(nm) && (MANAGED[fam](nm) || reg.has(nm))) {
          try { s.remove(); stats.removedStyles++; log('  − style ' + nm); }
          catch (e) { stats.styleWarnings++; log('  ⚠ não removeu style ' + nm); }
        }
      }
    }
  }

  // ---- registro de nomes criados (p/ prune futuro) + preferências ----
  const newReg = Object.assign({}, registry);
  for (const fam of Object.keys(appliedStyleNames)) newReg[fam] = appliedStyleNames[fam];
  await saveRegistry(newReg);
  await savePrefs(partsIn || null);

  stats.cancelled = CANCELLED;
  log(CANCELLED ? 'Cancelado (parcial).' : 'Pronto.');
  ui({ type: 'done', stats });
  notify(CANCELLED ? 'Import cancelado (resultado parcial).' : '✓ ' + plan.totals.create + ' criados · ' + plan.totals.update + ' atualizados' + (stats.removedVars + stats.removedStyles ? ' · ' + (stats.removedVars + stats.removedStyles) + ' removidos' : ''));
}

// ---------------- SINCRONIZAR DRIFT (#1): reimporta SÓ o que a auditoria marcou (diverge/missing) ----------------
// Fecha o loop Auditar→Corrigir: em vez de rodar o "Criar" inteiro, reaplica apenas as variáveis/styles
// divergentes ou faltantes do relatório, e re-audita no fim p/ mostrar o painel já em dia.
async function runFix(doc, partsIn, report) {
  if (!validDoc(doc)) throw docErr();
  schemaWarn(doc);
  report = report || {};
  const rv = report.vars || {}, rs = report.styles || {};
  const varNames = new Set([...((rv.diverge || []).map((d) => d.name)), ...(rv.missing || [])]);
  const styNames = new Set([...((rs.diverge || []).map((d) => d.name)), ...(rs.missing || [])]);

  if (!varNames.size && !styNames.size) {
    log('Nada a sincronizar — Figma já bate com o bundle.');
    notify('Nada a sincronizar — já está em dia.');
    await runAudit(doc, partsIn, false);
    return;
  }
  log('Sincronizando ' + varNames.size + ' variável(is) + ' + styNames.size + ' style(s) divergente(s)…');

  const stats = {
    plan: { collections: {}, styles: {}, totals: { create: 0, update: 0, remove: 0 }, warnings: [] },
    collections: 0, variables: 0, aliases: 0, aliasMissing: 0, valueErrors: 0, nameCollisions: 0,
    textStyles: 0, textBound: 0, paintStyles: 0, paintBound: 0, effectStyles: 0, gridStyles: 0,
    removedVars: 0, removedStyles: 0, styleWarnings: 0, cancelled: false, fixedVars: 0, fixedStyles: 0,
  };

  const byName = new Map();
  const allVars = await getVariables();
  for (const v of allVars) byName.set(v.name, v);
  const collsByName = new Map((await getCollections()).map((c) => [c.name, c]));
  const index = new Map();
  for (const v of allVars) index.set(v.variableCollectionId + '::' + v.name, v);

  // ---- variáveis: cria/atualiza só os nomes alvo, depois aplica valores (guardado, float32-safe) ----
  for (const c of (doc.collections || [])) {
    if (!c.variables) continue;
    const toFix = c.variables.filter((d) => varNames.has(d.name));
    if (!toFix.length) continue;
    const { coll, modeIds } = setupCollection(c.name, c.modes, collsByName);
    for (const def of toFix) {
      const key = coll.id + '::' + def.name;
      let v = index.get(key);
      if (v && v.resolvedType !== def.type) { try { v.remove(); } catch (e) {} v = null; }
      if (!v) { v = createVariableCompat(def.name, coll, def.type); index.set(key, v); }
      byName.set(def.name, v);
      if (def.scopes) { try { v.scopes = def.scopes; } catch (e) {} }
      if (def.description) { try { v.description = def.description; } catch (e) {} }
      if (def.code && typeof v.setVariableCodeSyntax === 'function') { try { v.setVariableCodeSyntax('WEB', 'var(' + def.code + ')'); } catch (e) {} }
      for (const mode of Object.keys(def.values)) {
        const modeId = modeIds[mode];
        if (modeId === undefined) continue;
        const val = def.values[mode];
        try {
          if (val.alias !== undefined) {
            const tv = byName.get(val.alias);
            if (!tv) { stats.aliasMissing++; log('  ⚠ alias não encontrado: ' + val.alias); continue; }
            v.setValueForMode(modeId, figma.variables.createVariableAlias(tv)); stats.aliases++;
          } else if (val.color !== undefined) v.setValueForMode(modeId, val.color);
          else if (val.number !== undefined) v.setValueForMode(modeId, val.number);
          else if (val.string !== undefined) v.setValueForMode(modeId, val.string);
        } catch (e) { stats.valueErrors++; log('  ⚠ valor falhou: ' + def.name + '[' + mode + ']: ' + (e && e.message ? e.message : e)); }
      }
      stats.fixedVars++; log('  ✓ ' + c.name.replace('CRP/', '') + '/' + def.name);
    }
  }

  // ---- styles: reusa createStyles com a lista filtrada pelos nomes alvo ----
  if (styNames.size && doc.styles) {
    const filtered = { textFamilies: doc.styles.textFamilies };
    for (const fam of ['text', 'paint', 'effect', 'grid']) filtered[fam] = (doc.styles[fam] || []).filter((s) => styNames.has(s.name));
    const applied = {};
    await createStyles(filtered, byName, stats, { coll: () => false, style: () => true }, applied, function () {});
    for (const fam of Object.keys(applied)) stats.fixedStyles += (applied[fam] || []).length;
  }

  log('Sincronizado: ' + stats.fixedVars + ' variáveis · ' + stats.fixedStyles + ' styles.');
  notify('✓ Sincronizado: ' + (stats.fixedVars + stats.fixedStyles) + ' item(ns) atualizados.');
  await runAudit(doc, partsIn, false); // re-audita p/ o painel mostrar 0 divergem
}

// ---------------- aplicar marca/modo na seleção ----------------
async function applyMode(brand, light) {
  const sel = figma.currentPage.selection;
  if (!sel.length) { ui({ type: 'error', line: 'Selecione ao menos 1 frame/objeto para aplicar o modo.' }); return; }
  const colls = await getCollections();
  const apply = (collName, modeName) => {
    if (!modeName) return;
    const coll = colls.find((c) => c.name === collName);
    if (!coll) { log('  ⚠ collection ausente: ' + collName); return; }
    const m = coll.modes.find((x) => x.name === modeName);
    if (!m) { log('  ⚠ modo ausente: ' + collName + '/' + modeName); return; }
    for (const node of sel) {
      try { node.setExplicitVariableModeForCollection(coll, m.modeId); }
      catch (e) { try { node.setExplicitVariableModeForCollection(coll.id, m.modeId); } catch (e2) { log('  ⚠ ' + node.name + ': ' + (e2 && e2.message ? e2.message : e2)); } }
    }
  };
  apply('CRP/Brand', brand);
  apply('CRP/Modes', light);
  log('Modo aplicado a ' + sel.length + ' seleção(ões): ' + (brand || '—') + ' / ' + (light || '—') + '.');
  ui({ type: 'modeApplied', brand: brand || null, light: light || null, nodes: sel.length });
  notify('Modo aplicado (' + (brand || '—') + ' / ' + (light || '—') + ') em ' + sel.length + '.');
}

// ---------------- AUDITORIA (read-only): drift + contraste AA ----------------
// WCAG: luminância relativa + razão de contraste (entrada {r,g,b} em 0..1).
function relLum(c) {
  const f = (u) => (u <= 0.03928 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4));
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
}
function contrastRatio(a, b) {
  const L1 = relLum(a), L2 = relLum(b), hi = Math.max(L1, L2), lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}
const colorClose = (a, b) => a && b && Math.max(Math.abs(a.r - b.r), Math.abs(a.g - b.g), Math.abs(a.b - b.b)) <= 0.01;
// O Figma guarda FLOAT como float32; o bundle traz float64. Comparar exato marcaria todo decimal não-diádico
// (line-height 4/3, opacity 0.05, tracking -1.2…) como "diverge". fround(want) é exatamente o que o Figma
// armazena; o épsilon relativo é rede de segurança (absorve float32 ~6e-8, ainda pega edição real ≥1e-3).
const numClose = (got, want) => typeof got === 'number' && typeof want === 'number' &&
  (got === want || Math.fround(want) === got || Math.abs(got - want) <= 1e-6 * (Math.abs(want) + 1));

// resolve o valor concreto ATUAL de uma Variable seguindo aliases entre collections, dado o contexto de modos.
async function resolveConcrete(variable, ctx, seen) {
  seen = seen || new Set();
  if (!variable || seen.has(variable.id)) return null;
  seen.add(variable.id);
  const vals = variable.valuesByMode || {};
  const modeId = ctx[variable.variableCollectionId];
  let val = (modeId !== undefined && modeId in vals) ? vals[modeId] : vals[Object.keys(vals)[0]];
  if (val && val.type === 'VARIABLE_ALIAS') {
    const tgt = await figma.variables.getVariableByIdAsync(val.id);
    return await resolveConcrete(tgt, ctx, seen);
  }
  return val; // {r,g,b,a} | number | string | boolean
}
// contexto collId→modeId p/ um tema (marca + light/dark); demais collections usam o 1º mode.
async function buildCtx(brandMode, lightMode) {
  const ctx = {};
  for (const c of await getCollections()) {
    let modeId = c.modes[0] && c.modes[0].modeId;
    if (c.name === 'CRP/Brand' && brandMode) { const m = c.modes.find((x) => x.name === brandMode); if (m) modeId = m.modeId; }
    if (c.name === 'CRP/Modes' && lightMode) { const m = c.modes.find((x) => x.name === lightMode); if (m) modeId = m.modeId; }
    if (modeId) ctx[c.id] = modeId;
  }
  return ctx;
}

async function runAudit(doc, partsIn, silent) {
  if (!validDoc(doc)) throw docErr();
  schemaWarn(doc);
  const want = normalizeParts(partsIn);
  const registry = await loadRegistry();
  const report = {
    vars: { ok: 0, diverge: [], missing: [], orphan: [] },
    styles: { ok: 0, diverge: [], missing: [] },
    contrast: { checked: 0, fail: [] },
  };

  const colls = await getCollections();
  const collsByName = new Map(colls.map((c) => [c.name, c]));
  const allVars = await getVariables();
  const index = new Map(), byName = new Map();
  for (const v of allVars) { index.set(v.variableCollectionId + '::' + v.name, v); byName.set(v.name, v); }

  // ---- drift de Variables (por valor, por mode) ----
  for (const c of (doc.collections || [])) {
    if (!c.variables || !c.variables.length || !want.coll(c.name)) continue;
    const figColl = collsByName.get(c.name);
    const modeIdByName = {};
    if (figColl) for (const m of figColl.modes) modeIdByName[m.name] = m.modeId;
    for (const def of c.variables) {
      const fv = figColl && index.get(figColl.id + '::' + def.name);
      if (!fv) { report.vars.missing.push(def.name); continue; }
      let diverged = null;
      for (const modeName of Object.keys(def.values)) {
        const modeId = modeIdByName[modeName];
        if (modeId === undefined) continue;
        const want_ = def.values[modeName];
        const got = (fv.valuesByMode || {})[modeId];
        if (want_.alias !== undefined) {
          if (!got || got.type !== 'VARIABLE_ALIAS') { diverged = { mode: modeName, figma: 'cru', bundle: '→' + want_.alias }; break; }
          const tgt = await figma.variables.getVariableByIdAsync(got.id);
          if (!tgt || tgt.name !== want_.alias) { diverged = { mode: modeName, figma: '→' + (tgt ? tgt.name : '?'), bundle: '→' + want_.alias }; break; }
        } else if (want_.color !== undefined) {
          if (!colorClose(got, want_.color)) { diverged = { mode: modeName, figma: 'cor', bundle: 'cor' }; break; }
        } else if (want_.number !== undefined) {
          if (!numClose(got, want_.number)) { diverged = { mode: modeName, figma: String(got), bundle: String(want_.number) }; break; }
        } else if (want_.string !== undefined) {
          if (got !== want_.string) { diverged = { mode: modeName, figma: String(got), bundle: want_.string }; break; }
        }
      }
      if (diverged) report.vars.diverge.push(Object.assign({ name: def.name }, diverged));
      else report.vars.ok++;
    }
  }

  // ---- órfãos (reusa o plano com prune) ----
  const plan = await computePlan(doc, want, true, registry);
  for (const k of Object.keys(plan.collections)) for (const n of plan.collections[k].removeNames) report.vars.orphan.push(k.replace('CRP/', '') + '/' + n);
  for (const k of Object.keys(plan.styles)) for (const n of plan.styles[k].removeNames) report.vars.orphan.push(k + '/' + n);

  // ---- drift de Styles (subconjunto pragmático) ----
  const S = doc.styles || {};
  if (want.style('text') && Array.isArray(S.text)) {
    const ex = await styleIndex('Text');
    for (const t of S.text) {
      const s = ex.get(t.name);
      if (!s) { report.styles.missing.push(t.name); continue; }
      if (typeof t.fontSize === 'number' && typeof s.fontSize === 'number' && Math.abs(s.fontSize - t.fontSize) > 0.5) report.styles.diverge.push({ name: t.name, what: 'fontSize ' + s.fontSize + '≠' + t.fontSize });
      else report.styles.ok++;
    }
  }
  if (want.style('paint') && Array.isArray(S.paint)) {
    const ex = await styleIndex('Paint');
    for (const p of S.paint) {
      const s = ex.get(p.name);
      if (!s) { report.styles.missing.push(p.name); continue; }
      const paint = s.paints && s.paints[0];
      const bv = paint && paint.boundVariables && paint.boundVariables.color;
      let bad = false;
      if (bv) { const tgt = await figma.variables.getVariableByIdAsync(bv.id); if (!tgt || tgt.name !== p.boundVariable) bad = true; }
      else if (paint && paint.type === 'SOLID' && p.fallbackColor) bad = !colorClose(paint.color, p.fallbackColor);
      if (bad) report.styles.diverge.push({ name: p.name, what: 'cor/ligação' }); else report.styles.ok++;
    }
  }
  for (const [fam, kind, prop] of [['effect', 'Effect', 'effects'], ['grid', 'Grid', 'layoutGrids']]) {
    if (!want.style(fam) || !Array.isArray(S[fam])) continue;
    const ex = await styleIndex(kind);
    for (const it of S[fam]) {
      const s = ex.get(it.name);
      if (!s) { report.styles.missing.push(it.name); continue; }
      const a = (s[prop] || []).length, b = (it[prop] || it.effects || it.layoutGrids || []).length;
      if (a !== b) report.styles.diverge.push({ name: it.name, what: prop + ' ' + a + '≠' + b }); else report.styles.ok++;
    }
  }

  // ---- contraste AA sobre os valores ATUAIS — TODAS as marcas × modos (Brand × Light/Dark) ----
  const pairs = (doc.audit && doc.audit.contrastPairs) || [];
  if (pairs.length) {
    for (const [themeName, brandMode, lightMode] of [
      ['CRP-Light', 'CRP', 'Light'], ['CRP-Dark', 'CRP', 'Dark'],
      ['MarcaB-Light', 'MarcaB', 'Light'], ['MarcaB-Dark', 'MarcaB', 'Dark'],
    ]) {
      const ctx = await buildCtx(brandMode, lightMode);
      for (const pr of pairs) {
        const fgV = byName.get(pr.fg), bgV = byName.get(pr.bg);
        if (!fgV || !bgV) continue;
        const fg = await resolveConcrete(fgV, ctx), bg = await resolveConcrete(bgV, ctx);
        if (!fg || !bg || fg.r === undefined || bg.r === undefined) continue;
        report.contrast.checked++;
        const ratio = contrastRatio(fg, bg);
        if (ratio < 4.5) report.contrast.fail.push({ pair: pr.fg + ' / ' + pr.bg, theme: themeName, ratio: Math.round(ratio * 100) / 100 });
      }
    }
  }

  ui({ type: 'auditResult', report: report, silent: !!silent });
}

// ---------------- PREVIEW no canvas (Figma-only) ----------------
async function loadFontSafe(fn) { try { await figma.loadFontAsync(fn); return true; } catch (e) { return false; } }
function vstack(name, gap, pad) {
  const f = figma.createFrame(); if (name) f.name = name;
  f.layoutMode = 'VERTICAL'; f.itemSpacing = gap == null ? 8 : gap;
  f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO';
  if (pad != null) { f.paddingLeft = f.paddingRight = f.paddingTop = f.paddingBottom = pad; }
  f.fills = [];
  return f;
}
function boundPaint(variable, fallback) {
  const base = { type: 'SOLID', color: fallback || { r: 0.8, g: 0.8, b: 0.8 } };
  if (!variable) return base;
  try { return figma.variables.setBoundVariableForPaint(base, 'color', variable); } catch (e) { return base; }
}

async function buildSheet() {
  log('Gerando folha de tokens…');
  const idx = await ensureFonts();
  const fam = pickFamily(['Inter', 'Source Sans 3'], idx);
  const bold = styleForWeight(fam, 600, idx), reg = styleForWeight(fam, 400, idx);
  if (!(await loadFontSafe({ family: fam, style: bold }))) { ui({ type: 'error', line: 'Sem fonte disponível para gerar a folha.' }); return; }
  await loadFontSafe({ family: fam, style: reg });
  const head = (txt, size) => { const t = figma.createText(); t.fontName = { family: fam, style: bold }; t.fontSize = size || 16; t.characters = txt; return t; };
  const lbl = (txt, size) => { const t = figma.createText(); t.fontName = { family: fam, style: reg }; t.fontSize = size || 10; t.characters = txt; return t; };

  const page = vstack('CRP · Tokens', 24, 32);
  page.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  page.appendChild(head('CRP · Design Tokens', 28));

  const vars = await getVariables();
  const colls = await getCollections();

  // Cores do contrato (CRP/Modes)
  const modesColl = colls.find((c) => c.name === 'CRP/Modes');
  if (modesColl) {
    const sec = vstack(null, 6); sec.appendChild(head('Cores do contrato', 18));
    for (const v of vars.filter((x) => x.variableCollectionId === modesColl.id && x.resolvedType === 'COLOR').slice(0, 120)) {
      const r = vstack(null, 0); r.layoutMode = 'HORIZONTAL'; r.itemSpacing = 10; r.counterAxisAlignItems = 'CENTER';
      const sw = figma.createRectangle(); sw.resize(28, 28); sw.cornerRadius = 6; sw.fills = [boundPaint(v)];
      r.appendChild(sw); r.appendChild(lbl(v.name, 11)); sec.appendChild(r);
    }
    page.appendChild(sec);
  }

  // Tipografia (Text Styles)
  const tstyles = await getLocalStyles('Text');
  if (tstyles.length) {
    const sec = vstack(null, 10); sec.appendChild(head('Tipografia', 18));
    for (const s of tstyles) {
      try {
        if (!(await loadFontSafe(s.fontName))) continue;
        const t = figma.createText(); t.fontName = s.fontName; t.characters = s.name + ' — Ag 123';
        await t.setTextStyleIdAsync(s.id);
        sec.appendChild(t);
      } catch (e) {}
    }
    page.appendChild(sec);
  }

  // Elevação (Effect Styles)
  const estyles = await getLocalStyles('Effect');
  if (estyles.length) {
    const sec = vstack(null, 10); sec.appendChild(head('Elevação', 18));
    for (const s of estyles) {
      const row = vstack(null, 0); row.layoutMode = 'HORIZONTAL'; row.itemSpacing = 12; row.counterAxisAlignItems = 'CENTER';
      const r = figma.createRectangle(); r.resize(72, 40); r.cornerRadius = 8; r.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
      try { await r.setEffectStyleIdAsync(s.id); } catch (e) {}
      row.appendChild(r); row.appendChild(lbl(s.name, 11)); sec.appendChild(row);
    }
    page.appendChild(sec);
  }

  figma.currentPage.appendChild(page);
  page.x = 0; page.y = 0;
  try { figma.viewport.scrollAndZoomIntoView([page]); } catch (e) {}
  log('Folha gerada: "' + page.name + '".');
  ui({ type: 'sheetDone', name: page.name });
  notify('✓ Folha gerada: ' + page.name);
}

async function buildButton() {
  log('Gerando Button de exemplo…');
  const idx = await ensureFonts();
  const fam = pickFamily(['Source Sans 3', 'Inter'], idx), st = styleForWeight(fam, 500, idx);
  await loadFontSafe({ family: fam, style: st });
  const vars = await getVariables();
  const byName = new Map(vars.map((v) => [v.name, v]));
  const tstyles = await getLocalStyles('Text');
  const labelStyle = tstyles.find((s) => s.name === 'Label/Base') || tstyles.find((s) => s.name === 'Body/Base') || null;

  const btn = figma.createFrame();
  btn.name = 'Button / primary (md)';
  btn.layoutMode = 'HORIZONTAL'; btn.primaryAxisSizingMode = 'AUTO'; btn.counterAxisSizingMode = 'AUTO';
  btn.counterAxisAlignItems = 'CENTER'; btn.primaryAxisAlignItems = 'CENTER';
  btn.fills = [boundPaint(byName.get('primary'), { r: 0.02, g: 0.36, b: 0.8 })];
  const bind = (prop, name) => { const v = byName.get(name); if (v) { try { btn.setBoundVariable(prop, v); } catch (e) {} } };
  // fallback de padding/raio caso o binding não pegue
  btn.paddingLeft = btn.paddingRight = 16; btn.paddingTop = btn.paddingBottom = 8; btn.itemSpacing = 8; btn.cornerRadius = 10;
  bind('paddingLeft', 'button/padding-x/md'); bind('paddingRight', 'button/padding-x/md');
  bind('paddingTop', 'button/padding-y/md'); bind('paddingBottom', 'button/padding-y/md');
  bind('itemSpacing', 'button/gap/md'); bind('minHeight', 'button/height/md');
  bind('topLeftRadius', 'button/radius'); bind('topRightRadius', 'button/radius'); bind('bottomLeftRadius', 'button/radius'); bind('bottomRightRadius', 'button/radius');

  const t = figma.createText(); t.fontName = { family: fam, style: st }; t.characters = 'Button';
  if (labelStyle) { try { if (await loadFontSafe(labelStyle.fontName)) await t.setTextStyleIdAsync(labelStyle.id); } catch (e) {} }
  t.fills = [boundPaint(byName.get('primary-foreground'), { r: 1, g: 1, b: 1 })];
  btn.appendChild(t);

  figma.currentPage.appendChild(btn);
  try { figma.viewport.scrollAndZoomIntoView([btn]); } catch (e) {}
  log('Button gerado: "' + btn.name + '".');
  ui({ type: 'sheetDone', name: btn.name });
  notify('✓ Button gerado: ' + btn.name);
}

// ---------------- fontes (índice de disponibilidade + casamento de peso) ----------------
let FONT_INDEX = null;
async function ensureFonts() {
  if (FONT_INDEX) return FONT_INDEX;
  const families = new Set(), byFamily = new Map();
  try {
    for (const f of await figma.listAvailableFontsAsync()) {
      const fam = f.fontName.family;
      families.add(fam);
      if (!byFamily.has(fam)) byFamily.set(fam, new Set());
      byFamily.get(fam).add(f.fontName.style);
    }
  } catch (e) { /* sem acesso — segue com fallback mínimo */ }
  FONT_INDEX = { families, byFamily };
  return FONT_INDEX;
}
const WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];
const WEIGHT_STYLES = {
  100: ['Thin', 'Hairline'], 200: ['ExtraLight', 'Extra Light', 'Extralight', 'UltraLight'],
  300: ['Light'], 400: ['Regular', 'Normal', 'Book'], 500: ['Medium'],
  600: ['SemiBold', 'Semi Bold', 'Semibold', 'DemiBold', 'Demi Bold'], 700: ['Bold'],
  800: ['ExtraBold', 'Extra Bold', 'Extrabold', 'Heavy'], 900: ['Black', 'Heavy', 'Ultra'],
};
function pickFamily(families, idx) {
  for (const f of (families || [])) if (idx.families.has(f)) return f;
  for (const f of ['Inter', 'Roboto', 'Arial', 'Helvetica Neue', 'Helvetica', 'Source Sans 3', 'Source Sans Pro']) if (idx.families.has(f)) return f;
  const it = idx.families.values().next();
  return it.done ? 'Roboto' : it.value;
}
function styleForWeight(family, weight, idx) {
  const avail = idx.byFamily.get(family) || new Set();
  const order = WEIGHTS.slice().sort((a, b) => Math.abs(a - weight) - Math.abs(b - weight) || a - b);
  for (const w of order) for (const nm of (WEIGHT_STYLES[w] || [])) if (avail.has(nm)) return nm;
  if (avail.has('Regular')) return 'Regular';
  const it = avail.values().next();
  return it.done ? 'Regular' : it.value;
}

// ---------------- STYLES (Text / Effect / Paint / Grid) ----------------
async function createStyles(styles, byName, stats, want, applied, tick) {
  if (!styles) return;
  tick = tick || function () {};

  // TEXT — 1 conjunto agrupado, TODOS os campos vinculados a Variables. Família vinculada à brand-font-*
  // (troca por MODO) → pré-carrega as fontes das DUAS marcas p/ renderizar em qualquer modo.
  if (want.style('text') && Array.isArray(styles.text) && styles.text.length) {
    if (CANCELLED) return;
    applied.text = [];
    const idx = await ensureFonts();
    for (const famName of (styles.textFamilies || [])) {
      if (!idx.families.has(famName)) { stats.styleWarnings++; log('  ⚠ fonte de marca não instalada: ' + famName); continue; }
      for (const w of [400, 500, 600, 700, 800]) { const st = styleForWeight(famName, w, idx); try { await figma.loadFontAsync({ family: famName, style: st }); } catch (e) {} }
    }
    const existing = await styleIndex('Text');
    log('Text Styles… (' + styles.text.length + ', vinculados a Variables)');
    for (const t of styles.text) {
      if (CANCELLED) break; // #5: cancelar granular dentro da família
      try {
        const fam = pickFamily(t.fontFamilies, idx);
        const fstyle = styleForWeight(fam, t.fontWeight || 400, idx);
        let loaded = false;
        try { await figma.loadFontAsync({ family: fam, style: fstyle }); loaded = true; } catch (e) {}
        if (!loaded) { stats.styleWarnings++; log('  ⚠ fonte indisponível: ' + fam + ' ' + fstyle + ' (' + t.name + ')'); continue; }
        const ts = existing.get(t.name) || figma.createTextStyle();
        ts.name = t.name;
        ts.fontName = { family: fam, style: fstyle };
        if (typeof t.fontSize === 'number') ts.fontSize = t.fontSize;
        if (t.lineHeight) ts.lineHeight = t.lineHeight;
        if (t.letterSpacing) ts.letterSpacing = t.letterSpacing;
        if (t.textDecoration) ts.textDecoration = t.textDecoration;
        if (t.description) ts.description = t.description;
        if (t.bind && typeof ts.setBoundVariable === 'function') {
          for (const field of Object.keys(t.bind)) {
            const v = byName.get(t.bind[field]);
            if (v) { try { ts.setBoundVariable(field, v); stats.textBound++; } catch (e) {} }
            else { stats.styleWarnings++; log('  ⚠ var p/ bind ausente: ' + t.bind[field] + ' (' + t.name + '.' + field + ')'); }
          }
        }
        existing.set(t.name, ts);
        applied.text.push(t.name);
        stats.textStyles++;
      } catch (e) { stats.styleWarnings++; log('  ⚠ text "' + t.name + '": ' + (e && e.message ? e.message : e)); }
    }
    tick('Text');
  }

  // EFFECT — sombras já decompostas no export.
  if (want.style('effect') && Array.isArray(styles.effect) && styles.effect.length) {
    if (CANCELLED) return;
    applied.effect = [];
    const existing = await styleIndex('Effect');
    log('Effect Styles… (' + styles.effect.length + ')');
    for (const e of styles.effect) {
      if (CANCELLED) break; // #5
      try {
        const es = existing.get(e.name) || figma.createEffectStyle();
        es.name = e.name;
        if (e.description) es.description = e.description;
        es.effects = e.effects;
        existing.set(e.name, es);
        applied.effect.push(e.name);
        stats.effectStyles++;
      } catch (err) { stats.styleWarnings++; log('  ⚠ effect "' + e.name + '": ' + (err && err.message ? err.message : err)); }
    }
    tick('Effect');
  }

  // PAINT — contrato de cor LIGADO à Variable de CRP/Modes; cor crua é só fallback.
  if (want.style('paint') && Array.isArray(styles.paint) && styles.paint.length) {
    if (CANCELLED) return;
    applied.paint = [];
    const existing = await styleIndex('Paint');
    const canBind = !!(figma.variables && typeof figma.variables.setBoundVariableForPaint === 'function');
    log('Paint Styles… (' + styles.paint.length + (canBind ? ', ligados a Variables' : ', cor crua') + ')');
    for (const p of styles.paint) {
      if (CANCELLED) break; // #5
      try {
        const ps = existing.get(p.name) || figma.createPaintStyle();
        ps.name = p.name;
        if (p.description) ps.description = p.description;
        const fb = p.fallbackColor || { r: 0, g: 0, b: 0, a: 1 };
        let paint = { type: 'SOLID', color: { r: fb.r, g: fb.g, b: fb.b }, opacity: fb.a == null ? 1 : fb.a };
        const v = p.boundVariable && byName.get(p.boundVariable);
        if (v && canBind) { try { paint = figma.variables.setBoundVariableForPaint(paint, 'color', v); stats.paintBound++; } catch (e) {} }
        ps.paints = [paint];
        existing.set(p.name, ps);
        applied.paint.push(p.name);
        stats.paintStyles++;
      } catch (err) { stats.styleWarnings++; log('  ⚠ paint "' + p.name + '": ' + (err && err.message ? err.message : err)); }
    }
    tick('Paint');
  }

  // GRID — baseline + colunas por breakpoint.
  if (want.style('grid') && Array.isArray(styles.grid) && styles.grid.length) {
    if (CANCELLED) return;
    applied.grid = [];
    const existing = await styleIndex('Grid');
    log('Grid Styles… (' + styles.grid.length + ')');
    for (const g of styles.grid) {
      if (CANCELLED) break; // #5
      try {
        const gs = existing.get(g.name) || figma.createGridStyle();
        gs.name = g.name;
        if (g.description) gs.description = g.description;
        gs.layoutGrids = g.layoutGrids;
        existing.set(g.name, gs);
        applied.grid.push(g.name);
        stats.gridStyles++;
      } catch (err) { stats.styleWarnings++; log('  ⚠ grid "' + g.name + '": ' + (err && err.message ? err.message : err)); }
    }
    tick('Grid');
  }
}
