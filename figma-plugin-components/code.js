// CRP DS — Components (plugin de dev): cria COMPONENTES (ComponentSets shadcn) bindados nas
// Variables/Styles que o plugin "CRP DS — Tokens" já colocou no arquivo. As TELAS que USAM estes
// componentes ficam no plugin separado "CRP DS — Screens" (figma-plugin-screens/).
//
// Princípio nº 1: este plugin NÃO cria tokens — ele PROCURA (por nome) e BINDA. Se faltar
// dependência, lista e instrui a rodar o plugin de tokens primeiro. Nunca chuta.
//
// Entrada (gerada pelo repo — artefato, não editar à mão):
//   figma-components.json  (npm run export:components)
//
// Fills translúcidos (soft 15%, borda do outline 75%): mesma matemática do CSS (color-mix accent
// sobre transparent) expressa como OPACITY do paint — o bind continua vivo (troca de tema/marca
// funciona). Lógica pura extraída p/ pure.test.mjs (padrão do repo).

// ===================== LÓGICA PURA (testável sem Figma) =====================
function variantNodeName(props, axesOrder) {
  const order = axesOrder && axesOrder.length ? axesOrder : Object.keys(props);
  return order.map((k) => k + '=' + props[k]).join(', ');
}

function validateComponentsSpec(spec) {
  const issues = []; const cap = 20; const push = (m) => { if (issues.length < cap) issues.push(m); };
  if (!spec || spec.$schema !== 'crp-components-figma/3') { push('spec inválido: $schema esperado crp-components-figma/3'); return issues; }
  if (!Array.isArray(spec.components) || !spec.components.length) push('spec sem components[]');
  for (const c of spec.components || []) {
    if (!c.name || !c.setName || !Array.isArray(c.axesOrder)) push('component sem name/setName/axesOrder');
    for (const v of c.variants || []) {
      if (!v.props || !Object.keys(v.props).length) { push((c.name || '?') + ': variante sem props'); continue; }
      if (!v.layout || !v.layout.fallbackPx) push(variantNodeName(v.props, c.axesOrder) + ': sem layout/fallbackPx');
      if (v.layout && v.layout.iconOnly) { if (!v.iconColor) push(variantNodeName(v.props, c.axesOrder) + ': icon-only sem iconColor'); }
      else if (!v.text || !v.text.styleName || !v.text.fillVar) push(variantNodeName(v.props, c.axesOrder) + ': texto sem styleName/fillVar');
    }
  }
  return issues;
}

function planDeps(spec) {
  const vars = new Set(); const styles = new Set();
  const add = (r) => { if (r && r.coll && r.name) vars.add(r.coll + '::' + r.name); };
  for (const c of spec.components || []) for (const v of c.variants || []) {
    for (const k of ['paddingX', 'gap', 'minHeight', 'radius', 'square']) add(v.layout && v.layout[k]);
    add(v.fill && v.fill.var); add(v.surface); add(v.stroke && v.stroke.var); add(v.stroke && v.stroke.weightVar);
    add(v.veil && v.veil.colorVar);
    add(v.ring && v.ring.colorVar); add(v.ring && v.ring.widthVar);
    add(v.alpha && v.alpha.var); add(v.iconColor);
    add(v.text && v.text.fillVar); if (v.text && v.text.styleName) styles.add(v.text.styleName);
  }
  return { vars: [...vars], styles: [...styles] };
}

function missingDeps(plan, haveVars, haveStyles) {
  const miss = [];
  for (const k of plan.vars) if (!haveVars.has(k)) miss.push('Variable ' + k);
  for (const s of plan.styles) if (!haveStyles.has(s)) miss.push('TextStyle ' + s);
  return miss;
}

// ===================== RUNTIME (Figma) =====================
if (typeof figma !== 'undefined') {
  figma.showUI(__html__, { width: 420, height: 560, themeColors: true });
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

  function bindNum(idx, node, field, ref, fallbackPx, stats) {
    const v = ref ? getVar(idx, ref) : null;
    try { if (v) { node.setBoundVariable(field, v); stats.binds++; return; } } catch (e) { /* cai no fallback */ }
    if (fallbackPx != null) { try { node[field] = fallbackPx; stats.fallbacks++; } catch (e2) {} }
  }

  async function makeText(idx, styleName, characters, fillRef, underline, stats) {
    const style = idx.styleByName.get(styleName);
    const t = figma.createText();
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

  // ícone de 16px: INSTÂNCIA da biblioteca lucide (se disponível) recolorida p/ a cor do texto (currentColor);
  // senão, placeholder (elipse). O tipo do nó (INSTANCE vs ELLIPSE) decide se vira instance-swap depois.
  function makeIcon(idx, colorRef, name, visible, lucideComp) {
    let node = null;
    if (lucideComp) {
      try {
        node = lucideComp.createInstance();
        try { node.resize(16, 16); } catch (e) {}
        try {
          const paint = boundSolidPaint(idx, colorRef, 1);
          for (const t of node.findAll((n) => (Array.isArray(n.strokes) && n.strokes.length) || (Array.isArray(n.fills) && n.fills.length))) {
            if (Array.isArray(t.strokes) && t.strokes.length) t.strokes = [paint];
            if (Array.isArray(t.fills) && t.fills.length) { try { t.fills = [paint]; } catch (e) {} }
          }
        } catch (e) { /* recolor best-effort */ }
      } catch (e) { node = null; }
    }
    if (!node) { node = figma.createEllipse(); node.resize(16, 16); if (colorRef) node.fills = [boundSolidPaint(idx, colorRef, 1)]; }
    node.name = name; node.visible = visible;
    return node;
  }

  // spinner do estado loading (Loader2): arco de ~290° desenhado como anel (ellipse com arcData). Estático
  // no Figma — anima em runtime; aqui é a forma fiel parada. Cor = currentColor (segue o texto).
  function makeSpinner(idx, colorRef) {
    const sp = figma.createEllipse();
    sp.resize(16, 16);
    sp.name = 'spinner';
    try { sp.fills = [boundSolidPaint(idx, colorRef, 1)]; } catch (e) {}
    try { sp.arcData = { startingAngle: -Math.PI / 2, endingAngle: Math.PI * 1.1, innerRadius: 0.72 }; } catch (e) {}
    return sp;
  }

  // acha um ícone na PÁGINA de ícones DESTE arquivo (nome com "lucide"/"ícone"). Aceita COMPONENT ou
  // COMPONENT_SET (pega uma variante). Retorna um COMPONENT p/ instanciar (vira INSTANCE_SWAP). Retorna
  // null se a biblioteca for EXTERNA (não está no arquivo) — aí cai no placeholder + troca manual no painel.
  async function findLucideIcon() {
    try {
      // 1) ÍCONE SELECIONADO (componente OU instância de biblioteca) — caminho DIRETO p/ biblioteca EXTERNA:
      //    arraste o ícone da lucide pro canvas, selecione e rode; o plugin usa ELE de base nos 2 lados.
      for (const n of (figma.currentPage.selection || [])) {
        if ((n.width || 0) > 64 || (n.height || 0) > 64) continue; // ignora não-ícones (ex.: o próprio botão)
        if (n.type === 'COMPONENT') return n;
        if (n.type === 'INSTANCE') {
          let mc = null;
          try { mc = n.getMainComponentAsync ? await n.getMainComponentAsync() : n.mainComponent; } catch (e) {}
          if (mc && mc.type === 'COMPONENT') return mc;
        }
      }
      // 2) PÁGINA de ícones LOCAL no arquivo: nome contém "lucide" ou "ícone/icone", ignorando caixa.
      await figma.loadAllPagesAsync();
      const page = figma.root.children.find((p) => p.type === 'PAGE' && /lucide|[íi]cones?/i.test(String(p.name)));
      if (!page) return null;
      const nodes = page.findAllWithCriteria
        ? page.findAllWithCriteria({ types: ['COMPONENT', 'COMPONENT_SET'] })
        : page.children.filter((n) => n.type === 'COMPONENT' || n.type === 'COMPONENT_SET');
      if (!nodes.length) return null;
      const pref = /arrow-right|chevron-right|\bplus\b|\bcheck\b|\bcircle\b/i;
      let pick = nodes.find((n) => pref.test(n.name)) || nodes[0];
      if (pick && pick.type === 'COMPONENT_SET') {
        const kids = pick.children.filter((ch) => ch.type === 'COMPONENT');
        pick = kids.find((ch) => pref.test(ch.name)) || pick.defaultVariant || kids[0] || null;
      }
      return pick && pick.type === 'COMPONENT' ? pick : null;
    } catch (e) { return null; }
  }

  // placeholder de ícone (16px) como COMPONENT — usado quando a lucide é biblioteca EXTERNA: garante um
  // INSTANCE_SWAP nos 2 lados, então você troca pelo ícone da biblioteca direto no painel ("Ícone esquerda/direita").
  let _phIcon = null;
  function placeholderIconComponent() {
    if (_phIcon && !_phIcon.removed) return _phIcon;
    const c = figma.createComponent();
    c.resize(16, 16);
    c.name = 'ícone (troque pela lucide)';
    try { c.cornerRadius = 3; } catch (e) {}
    c.fills = [{ type: 'SOLID', color: { r: 0.62, g: 0.62, b: 0.64 }, opacity: 1 }];
    c.x = -240; c.y = -240; // fora do caminho dos sets
    _phIcon = c;
    return c;
  }

  // foco: ANEL = STROKE externo (3px), cor ligada a ring-50 — fiel ao ring-[3px] do app. No Figma o
  // stroke é a tradução nativa (nada de effect/shadow). align OUTSIDE = anel POR FORA (não "come" o tamanho).
  function applyRing(idx, comp, ring, stats) {
    try {
      comp.strokes = [boundSolidPaint(idx, ring.colorVar, 1)]; // ring-50 (cor + alpha 0.5 da Variable)
      comp.strokeAlign = 'OUTSIDE';
      bindNum(idx, comp, 'strokeWeight', ring.widthVar, ring.widthPx == null ? 3 : ring.widthPx, stats);
    } catch (e) { /* best-effort: anel não aplicado não impede o componente */ }
  }

  // cria um COMPONENTE de variante. Retorna { comp, leading, trailing, textNode } p/ ligar as propriedades.
  async function makeVariant(idx, v, axesOrder, stats, lucideComp) {
    const comp = figma.createComponent();
    comp.name = variantNodeName(v.props, axesOrder);
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisSizingMode = 'AUTO'; comp.counterAxisSizingMode = 'AUTO';
    comp.primaryAxisAlignItems = 'CENTER'; comp.counterAxisAlignItems = 'CENTER';
    const fb = v.layout.fallbackPx || {};
    if (v.layout.radius) for (const f of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) bindNum(idx, comp, f, v.layout.radius, fb.radius, stats);
    // hover/active = fill do próprio estado (igual ao app). surface (background) por baixo quando o fill
    // é translúcido (/90, /80) — compõe como o navegador, deixando o hover VISÍVEL no canvas.
    const fills = [];
    if (v.surface) fills.push(boundSolidPaint(idx, v.surface, 1));
    if (v.fill) fills.push(boundSolidPaint(idx, v.fill.var, v.fill.opacity));
    comp.fills = fills;
    if (v.stroke) { comp.strokes = [boundSolidPaint(idx, v.stroke.var, v.stroke.opacity)]; bindNum(idx, comp, 'strokeWeight', v.stroke.weightVar, v.stroke.weightPx == null ? 1 : v.stroke.weightPx, stats); }
    // shadow-xs do shadcn (só o outline): elevação sutil. Effect ≠ stroke, então coexiste com o anel de foco.
    if (v.shadow) { try { comp.effects = [{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.05 }, offset: { x: 0, y: 1 }, radius: 2, spread: 0, visible: true, blendMode: 'NORMAL', showShadowBehindNode: true }]; } catch (e) {} }
    if (v.ring) applyRing(idx, comp, v.ring, stats);
    if (v.alpha && v.alpha.value != null && v.alpha.value !== 1) { try { comp.opacity = v.alpha.value; stats.fallbacks++; } catch (e) {} } // disabled 50% / loading 70% — direto (binding de opacity não é confiável)

    bindNum(idx, comp, 'paddingLeft', v.layout.paddingX, fb.paddingX, stats);
    bindNum(idx, comp, 'paddingRight', v.layout.paddingX, fb.paddingX, stats);
    comp.paddingTop = fb.paddingY != null ? fb.paddingY : 4; comp.paddingBottom = comp.paddingTop;
    bindNum(idx, comp, 'itemSpacing', v.layout.gap, fb.gap, stats);
    if (v.layout.minHeight) bindNum(idx, comp, 'minHeight', v.layout.minHeight, fb.minHeight, stats);

    // conteúdo: [spinner?][ícone esquerda?][texto][ícone direita?]
    if (v.spinner) comp.appendChild(makeSpinner(idx, v.iconColor)); // Loader2 (arco), não ícone trocável
    // ícones VISÍVEIS por padrão nos 2 lados (o usuário pediu); a propriedade BOOLEAN permite desligar cada lado.
    const leading = (v.slots && v.slots.leading) ? makeIcon(idx, v.iconColor, 'icon-leading', true, lucideComp) : null;
    if (leading) comp.appendChild(leading);
    let textNode = null;
    if (v.text) { textNode = await makeText(idx, v.text.styleName, v.text.characters || 'Button', v.text.fillVar, !!v.text.underline, stats); comp.appendChild(textNode); }
    const trailing = (v.slots && v.slots.trailing) ? makeIcon(idx, v.iconColor, 'icon-trailing', true, lucideComp) : null;
    if (trailing) comp.appendChild(trailing);

    if (v.fixedWidthPx) { comp.primaryAxisSizingMode = 'FIXED'; comp.resize(v.fixedWidthPx, comp.height); comp.primaryAxisAlignItems = 'MIN'; }
    return { comp, leading, trailing, textNode };
  }

  async function pageNamed(name) {
    await figma.loadAllPagesAsync();
    let p = figma.root.children.find((c) => c.type === 'PAGE' && c.name === name);
    if (!p) { p = figma.createPage(); p.name = name; }
    return p;
  }

  async function runComponents(spec, only) {
    const issues = validateComponentsSpec(spec);
    if (issues.length) { figma.ui.postMessage({ type: 'error', m: 'Spec inválido:\n' + issues.join('\n') }); return; }
    // só o componente escolhido no select (ou todos). Deps/idempotência seguem o recorte.
    const components = (only && only !== '__all__') ? spec.components.filter((c) => c.name === only) : spec.components;
    if (!components.length) { figma.ui.postMessage({ type: 'error', m: 'componente não encontrado no spec: ' + only }); return; }
    const idx = await loadIndex();
    const miss = missingDeps(planDeps({ components }), new Set(idx.varByKey.keys()), new Set(idx.styleByName.keys()));
    if (miss.length) { figma.ui.postMessage({ type: 'deps-missing', list: miss }); return; }

    const page = await pageNamed('CRP Components');
    // os nós de figma.createComponent() nascem na currentPage; torná-la a página-alvo garante que
    // combineAsVariants(nodes, page) veja nós e parent na MESMA página (e o viewport foque o resultado).
    await figma.setCurrentPageAsync(page);
    const stats = { variants: 0, binds: 0, fallbacks: 0 };
    const lucide = await findLucideIcon();
    const iconBase = lucide || placeholderIconComponent(); // sempre um COMPONENT → ícone vira INSTANCE trocável
    log(lucide
      ? ('ℹ ícones: usando "' + (lucide.name || 'ícone') + '" como base — ícone REAL nos 2 lados (troque cada lado pelo swap se quiser)')
      : 'ℹ ícones: nenhum ícone real disponível — usei placeholder. P/ ícone REAL: arraste um ícone da [CRP] Ícones - Lucide pro canvas, SELECIONE-o e rode de novo (ou troque no painel "Ícone esquerda/direita").');
    let x = 0;
    for (const c of components) {
      // idempotência v1: o set antigo é PRESERVADO com sufixo (nada é destruído sem pedir)
      const old = page.children.find((n) => n.type === 'COMPONENT_SET' && n.name === c.setName);
      if (old) { old.name = c.setName + ' · antigo ' + new Date().toISOString().slice(0, 16).replace('T', ' '); old.y += (old.height || 0) + 200; log('ℹ set anterior preservado como "' + old.name + '"'); }
      const created = [];
      let i = 0;
      for (const v of c.variants) {
        if (CANCELLED) break;
        created.push({ r: await makeVariant(idx, v, c.axesOrder, stats, iconBase), v });
        stats.variants++;
        if (++i % 10 === 0) { tick(c.name + ': ' + i + '/' + c.variants.length + ' variantes'); await new Promise((r) => setTimeout(r, 0)); }
      }
      if (CANCELLED) { created.forEach((x) => x.r.comp.remove()); break; }
      const set = figma.combineAsVariants(created.map((x) => x.r.comp), page);
      set.name = c.setName;
      set.layoutMode = 'VERTICAL'; set.itemSpacing = 12; set.paddingLeft = set.paddingRight = set.paddingTop = set.paddingBottom = 24;
      set.x = x; set.y = 0; x += set.width + 120;
      set.description = 'GERADO do código (export:components). Variantes = combinações VÁLIDAS do kit; binds nas Variables CRP/*. Não editar à mão — regenerar.';

      // TEXTO vira PROPRIEDADE editável (label no painel)
      try {
        const withText = created.filter((x) => x.r.textNode);
        if (withText.length) {
          const pkTxt = set.addComponentProperty('Texto', 'TEXT', (withText[0].v.text && withText[0].v.text.characters) || 'Button');
          for (const x of withText) x.r.textNode.componentPropertyReferences = { characters: pkTxt };
          log('ℹ ' + c.name + ': "Texto" vira propriedade editável');
        }
      } catch (e) { log('⚠ propriedade de texto não aplicada: ' + e.message); }

      // ÍCONES: BOOLEAN (liga/desliga) + INSTANCE_SWAP (troca pelo ícone da biblioteca) por lado
      try {
        const swapL = (created.some((x) => x.r.leading && x.r.leading.type === 'INSTANCE')) ? set.addComponentProperty('Ícone esquerda', 'INSTANCE_SWAP', iconBase.id) : null;
        const swapT = (created.some((x) => x.r.trailing && x.r.trailing.type === 'INSTANCE')) ? set.addComponentProperty('Ícone direita', 'INSTANCE_SWAP', iconBase.id) : null;
        const boolL = created.some((x) => x.r.leading) ? set.addComponentProperty('Mostrar ícone esquerda', 'BOOLEAN', true) : null;
        const boolT = created.some((x) => x.r.trailing) ? set.addComponentProperty('Mostrar ícone direita', 'BOOLEAN', true) : null;
        for (const x of created) {
          if (x.r.leading) { const r = {}; if (boolL) r.visible = boolL; if (swapL && x.r.leading.type === 'INSTANCE') r.mainComponent = swapL; if (Object.keys(r).length) x.r.leading.componentPropertyReferences = r; }
          if (x.r.trailing) { const r = {}; if (boolT) r.visible = boolT; if (swapT && x.r.trailing.type === 'INSTANCE') r.mainComponent = swapT; if (Object.keys(r).length) x.r.trailing.componentPropertyReferences = r; }
        }
        if (boolL || boolT) log('ℹ ' + c.name + ': ícones = toggle' + (swapL || swapT ? ' + troca pela biblioteca' : ' (placeholder)'));
      } catch (e) { log('⚠ props de ícone não aplicadas: ' + e.message); }

      // componente INTERATIVO: Default --passar o mouse--> Hover, Hover --pressionar--> Active
      try {
        const byKey = new Map(created.map((x) => [x.v.props.variant + '|' + x.v.props.size + '|' + x.v.props.state, x.r.comp]));
        const changeTo = (destId, type) => ({ trigger: { type }, actions: [{ type: 'NODE', destinationId: destId, navigation: 'CHANGE_TO', transition: null, preserveScrollPosition: false }] });
        let nReact = 0;
        for (const x of created) {
          const p = x.v.props; const reactions = [];
          if (p.state === 'default') { const h = byKey.get(p.variant + '|' + p.size + '|hover'); if (h) reactions.push(changeTo(h.id, 'ON_HOVER')); }
          else if (p.state === 'hover') { const a = byKey.get(p.variant + '|' + p.size + '|active'); if (a) reactions.push(changeTo(a.id, 'ON_PRESS')); }
          if (reactions.length && x.r.comp.setReactionsAsync) { await x.r.comp.setReactionsAsync(reactions); nReact += reactions.length; }
        }
        if (nReact) { stats.reactions = nReact; log('ℹ ' + c.name + ': ' + nReact + ' reações de protótipo ligadas (hover→Hover, press→Active)'); }
      } catch (e) { log('⚠ reações não aplicadas: ' + e.message); }
    }
    figma.ui.postMessage({ type: 'done', m: CANCELLED ? 'cancelado' : ('✅ ' + components.map((c) => c.name).join(' + ') + ' · ' + stats.variants + ' variantes · ' + stats.binds + ' binds · ' + stats.fallbacks + ' fallbacks px' + (stats.reactions ? ' · ' + stats.reactions + ' reações' : '')), stats });
    figma.viewport.scrollAndZoomIntoView(page.children);
  }

  figma.ui.onmessage = async (msg) => {
    try {
      if (msg.type === 'cancel') { CANCELLED = true; return; }
      CANCELLED = false;
      if (msg.type === 'create-components') await runComponents(msg.spec, msg.only);
    } catch (e) {
      figma.ui.postMessage({ type: 'error', m: String((e && e.message) || e) });
    }
  };
}

// export p/ testes puros (node) — mesmo padrão dos outros plugins do repo
if (typeof module !== 'undefined') module.exports = { variantNodeName, validateComponentsSpec, planDeps, missingDeps };
