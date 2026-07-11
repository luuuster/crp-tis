// CRP DS — Screens (plugin de dev): monta TELAS instanciando os ComponentSets que o plugin
// "CRP DS — Components" já criou (página "CRP Components"), com textos/fields bindados nas
// Variables/Styles que o plugin "CRP DS — Tokens" colocou no arquivo.
//
// Princípio nº 1: NÃO cria tokens nem componentes — PROCURA (por nome), INSTANCIA e BINDA. Se faltar
// Variable/Style/ComponentSet, lista e manda rodar o plugin certo antes. Nunca chuta.
//
// Entrada (gerada pelo repo — artefato, não editar à mão):
//   figma-screens.json  (npm run export:screens)
//
// A ordem dos eixos de cada variante (ex.: "variant=default, size=default") é DERIVADA do próprio
// ComponentSet no arquivo — por isso este plugin carrega só 1 arquivo (não precisa do components.json).
// Helpers compartilhados com o plugin de Components são DUPLICADOS de propósito (cada plugin Figma
// carrega seu próprio code.js, sem bundler — padrão dos plugins crus do repo). Lógica pura → pure.test.mjs.

// ===================== LÓGICA PURA (testável sem Figma) =====================
function variantNodeName(props, axesOrder) {
  const order = axesOrder && axesOrder.length ? axesOrder : Object.keys(props);
  return order.map((k) => k + '=' + props[k]).join(', ');
}

// recupera a ORDEM dos eixos a partir do nome de um filho do ComponentSet ("k1=v1, k2=v2" -> [k1,k2]).
// o plugin de Components nomeia os filhos com variantNodeName, então o nome carrega a ordem.
function axesOrderFromName(name) {
  return String(name || '').split(',').map((p) => p.trim().split('=')[0]).filter(Boolean);
}

function missingDeps(plan, haveVars, haveStyles) {
  const miss = [];
  for (const k of plan.vars) if (!haveVars.has(k)) miss.push('Variable ' + k);
  for (const s of plan.styles) if (!haveStyles.has(s)) miss.push('TextStyle ' + s);
  return miss;
}

function screensDeps(spec) {
  const vars = new Set(); const styles = new Set(); const variants = new Set();
  const add = (r) => { if (r && r.coll && r.name) vars.add(r.coll + '::' + r.name); };
  (function walk(items) {
    for (const it of items || []) {
      if (it.type === 'text') { if (it.style) styles.add(it.style); add(it.fillVar); }
      if (it.type === 'instance') variants.add(it.component + '::' + JSON.stringify(it.props));
      if (it.items) walk(it.items);
    }
  })((spec.screens || []).flatMap((s) => s.items || []));
  for (const s of spec.screens || []) {
    add(s.frame && s.frame.fillVar);
    const f = s.fieldAnatomy; if (f) { if (f.labelStyle) styles.add(f.labelStyle); if (f.placeholderStyle) styles.add(f.placeholderStyle); add(f.labelFill); add(f.placeholderFill); if (f.box) { add(f.box.fill); add(f.box.stroke); add(f.box.minHeight); add(f.box.radius); } }
  }
  return { vars: [...vars], styles: [...styles], variants: [...variants] };
}

// ===================== RUNTIME (Figma) =====================
if (typeof figma !== 'undefined') {
  figma.showUI(__html__, { width: 420, height: 540, themeColors: true });
  let CANCELLED = false;
  const log = (m) => figma.ui.postMessage({ type: 'log', m });
  const tick = (m) => figma.ui.postMessage({ type: 'progress', m });

  // ---------- índice de dependências (por NOME — contrato com o plugin de tokens) ----------
  async function loadIndex() {
    const colls = await figma.variables.getLocalVariableCollectionsAsync();
    const collById = new Map(colls.map((c) => [c.id, c]));
    const vars = await figma.variables.getLocalVariablesAsync();
    const varByKey = new Map();
    for (const v of vars) { const c = collById.get(v.variableCollectionId); if (c) varByKey.set(c.name + '::' + v.name, v); }
    const styles = await figma.getLocalTextStylesAsync();
    const styleByName = new Map(styles.map((s) => [s.name, s]));
    return { varByKey, styleByName };
  }

  const getVar = (idx, r) => idx.varByKey.get(r.coll + '::' + r.name) || null;

  function boundSolidPaint(idx, ref, opacity) {
    const v = getVar(idx, ref);
    let paint = { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 }, opacity: opacity == null ? 1 : opacity };
    if (v) paint = figma.variables.setBoundVariableForPaint(paint, 'color', v);
    paint.opacity = opacity == null ? 1 : opacity;
    return paint;
  }

  async function makeText(idx, styleName, characters, fillRef, underline, stats) {
    const t = figma.createText();
    const style = idx.styleByName.get(styleName);
    if (style) {
      await figma.loadFontAsync(style.fontName);
      try { await t.setTextStyleIdAsync(style.id); } catch (e) { try { t.textStyleId = style.id; } catch (e2) {} }
      stats.binds++;
    } else { await figma.loadFontAsync({ family: 'Inter', style: 'Regular' }); stats.fallbacks++; }
    t.characters = characters;
    if (underline) t.textDecoration = 'UNDERLINE';
    if (fillRef) t.fills = [boundSolidPaint(idx, fillRef, 1)];
    return t;
  }

  async function pageNamed(name) {
    await figma.loadAllPagesAsync();
    let p = figma.root.children.find((c) => c.type === 'PAGE' && c.name === name);
    if (!p) { p = figma.createPage(); p.name = name; }
    return p;
  }

  // acha o filho (variante) do ComponentSet p/ um componente + props, derivando a ordem dos eixos do set.
  function findVariant(setByName, componentName, props) {
    const set = setByName.get('CRP Components/' + componentName);
    if (!set || !set.children || !set.children.length) return null;
    const axes = axesOrderFromName(set.children[0].name);
    const name = variantNodeName(props, axes);
    return set.children.find((ch) => ch.name === name) || null;
  }

  async function makeField(idx, anatomy, label, placeholder, setByName, stats) {
    // label + INSTÂNCIA do shadcn Input (estado default) — paridade com o app por construção
    const wrap = figma.createFrame(); wrap.layoutMode = 'VERTICAL'; wrap.itemSpacing = 6; wrap.fills = [];
    wrap.primaryAxisSizingMode = 'AUTO'; wrap.counterAxisSizingMode = 'FIXED'; wrap.layoutAlign = 'STRETCH';
    wrap.appendChild(await makeText(idx, anatomy.labelStyle, label, anatomy.labelFill, false, stats));
    const node = findVariant(setByName, 'Input', { state: 'default' });
    if (node) {
      const inst = node.createInstance(); inst.layoutAlign = 'STRETCH'; wrap.appendChild(inst);
      const tn = inst.findOne((n) => n.type === 'TEXT');
      if (tn && placeholder) { await figma.loadFontAsync(tn.fontName); tn.characters = placeholder; }
    } else { log('⚠ Input não encontrado — rode o plugin CRP DS — Components antes (field "' + label + '" ficou sem caixa)'); }
    return wrap;
  }

  async function runScreens(spec) {
    const idx = await loadIndex();
    const deps = screensDeps(spec);
    const miss = missingDeps({ vars: deps.vars, styles: deps.styles }, new Set(idx.varByKey.keys()), new Set(idx.styleByName.keys()));
    if (miss.length) { figma.ui.postMessage({ type: 'deps-missing', list: miss }); return; }

    // os ComponentSets USADOS têm de existir (rode o plugin CRP DS — Components antes)
    const compPage = await pageNamed('CRP Components');
    const setByName = new Map(compPage.children.filter((n) => n.type === 'COMPONENT_SET').map((n) => [n.name, n]));
    const usedComps = new Set(); let usesField = false;
    (function walk(items) { for (const it of items || []) { if (it.type === 'instance') usedComps.add(it.component); if (it.type === 'field') usesField = true; if (it.items) walk(it.items); } })((spec.screens || []).flatMap((s) => s.items || []));
    if (usesField) usedComps.add('Input');
    const missSets = [...usedComps].filter((name) => !setByName.has('CRP Components/' + name));
    if (missSets.length) { figma.ui.postMessage({ type: 'deps-missing', list: missSets.map((n) => 'ComponentSet CRP Components/' + n + ' (rode o plugin CRP DS — Components antes)') }); return; }

    const page = await pageNamed('CRP Screens');
    await figma.setCurrentPageAsync(page); // cria as telas na página certa e foca o resultado no fim
    const stats = { items: 0, binds: 0, fallbacks: 0 };
    let x = 0;
    for (const s of spec.screens) {
      if (CANCELLED) break;
      const frame = figma.createFrame(); page.appendChild(frame);
      frame.name = s.name + ' · ' + new Date().toISOString().slice(0, 10);
      frame.layoutMode = 'VERTICAL'; frame.itemSpacing = s.frame.gap;
      frame.paddingLeft = frame.paddingRight = s.frame.paddingX; frame.paddingTop = frame.paddingBottom = s.frame.paddingY;
      frame.primaryAxisSizingMode = 'AUTO'; frame.counterAxisSizingMode = 'FIXED'; frame.resize(s.frame.width, frame.height);
      frame.fills = [boundSolidPaint(idx, s.frame.fillVar, 1)];
      frame.x = x; frame.y = 0;

      async function buildItem(it, parent) {
        if (CANCELLED) return;
        if (it.type === 'text') parent.appendChild(await makeText(idx, it.style, it.text, it.fillVar, false, stats));
        else if (it.type === 'field') parent.appendChild(await makeField(idx, s.fieldAnatomy, it.label, it.placeholder, setByName, stats));
        else if (it.type === 'instance') {
          const node = findVariant(setByName, it.component, it.props);
          if (!node) { log('⚠ variante não achada p/ instância: ' + it.component + ' ' + JSON.stringify(it.props)); return; }
          const inst = node.createInstance(); parent.appendChild(inst);
          if (it.text) { const tn = inst.findOne((n) => n.type === 'TEXT'); if (tn) { await figma.loadFontAsync(tn.fontName); tn.characters = it.text; } }
          if (it.stretch) inst.layoutAlign = 'STRETCH';
        } else if (it.type === 'row-center') {
          const row = figma.createFrame(); row.layoutMode = 'HORIZONTAL'; row.itemSpacing = 6; row.fills = [];
          row.counterAxisAlignItems = 'CENTER'; row.primaryAxisSizingMode = 'AUTO'; row.counterAxisSizingMode = 'AUTO';
          row.layoutAlign = 'CENTER'; parent.appendChild(row);
          for (const sub of it.items) await buildItem(sub, row);
        }
        stats.items++;
      }
      for (const it of s.items) await buildItem(it, frame);
      x += frame.width + 160;
      tick('tela ' + s.name + ' pronta');
    }
    figma.ui.postMessage({ type: 'done', m: CANCELLED ? 'cancelado' : ('✅ ' + spec.screens.length + ' tela(s) · ' + stats.items + ' itens · ' + stats.binds + ' binds'), stats });
    figma.viewport.scrollAndZoomIntoView(page.children);
  }

  figma.ui.onmessage = async (msg) => {
    try {
      if (msg.type === 'cancel') { CANCELLED = true; return; }
      CANCELLED = false;
      if (msg.type === 'create-screens') await runScreens(msg.spec);
    } catch (e) {
      figma.ui.postMessage({ type: 'error', m: String((e && e.message) || e) });
    }
  };
}

// export p/ testes puros (node) — mesmo padrão dos outros plugins do repo
if (typeof module !== 'undefined') module.exports = { variantNodeName, axesOrderFromName, screensDeps, missingDeps };
