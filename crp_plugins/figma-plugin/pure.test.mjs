// Testes das funções PURAS do plugin (node --test). Extrai as definições do PRÓPRIO code.js (fonte real,
// não uma cópia) e avalia num escopo isolado — assim um drift no code.js quebra o teste.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('./code.js', import.meta.url), 'utf8');
const grab = (re, name) => { const m = src.match(re); if (!m) throw new Error('não achei ' + name + ' em code.js'); return m[0]; };
const body = [
  grab(/const STYLE_KIND = [^;]+;/, 'STYLE_KIND'),
  grab(/const COLLECTION_PREFIX = '[^']+';/, 'COLLECTION_PREFIX'),
  grab(/const MANAGED = \{[\s\S]*?\n\};/, 'MANAGED'),
  grab(/function relLum\(c\) \{[\s\S]*?\n\}/, 'relLum'),
  grab(/function contrastRatio\(a, b\) \{[\s\S]*?\n\}/, 'contrastRatio'),
  grab(/const colorClose = [^;]+;/, 'colorClose'),
  grab(/const numClose = [\s\S]*?\+ 1\)\);/, 'numClose'),
  grab(/function normalizeParts\(p\) \{[\s\S]*?\n\}/, 'normalizeParts'),
  grab(/function validDoc\(doc\) \{[^\n]*\}/, 'validDoc'),
  grab(/function validateBundle\(doc\) \{[\s\S]*?\n\}/, 'validateBundle'),
  grab(/async function computePlan\(doc, want, prune, registry, pre\) \{[\s\S]*?\n\}/, 'computePlan'),
  grab(/async function resolveConcrete\(variable, ctx, seen\) \{[\s\S]*?\n\}/, 'resolveConcrete'),
  grab(/async function varDrift\(def, fv, modeIdByName\) \{[\s\S]*?\n\}/, 'varDrift'),
  grab(/function missingModes\(def, modeIdByName\) \{[\s\S]*?\n\}/, 'missingModes'),
  grab(/async function computeChanges\(doc, want, pre, cap\) \{[\s\S]*?\n\}/, 'computeChanges'),
  'return { relLum, contrastRatio, colorClose, numClose, normalizeParts, validDoc, validateBundle, computePlan, resolveConcrete, varDrift, missingModes, computeChanges };',
].join('\n');
// Escopo isolado com as dependências de runtime INJETADAS (fake figma + helpers async stubados):
// testa as funções REAIS do code.js — a lógica que decide criar/atualizar/REMOVER no arquivo Figma —
// sem precisar do Figma. varsById alimenta getVariableByIdAsync (resolução de alias).
function makeF(stubs) {
  stubs = stubs || {};
  const fakeFigma = { variables: { getVariableByIdAsync: async (id) => (stubs.varsById && stubs.varsById[id]) || null } };
  return new Function('figma', 'styleIndex', 'getCollections', 'getVariables', body)(
    fakeFigma,
    stubs.styleIndex || (async () => new Map()),
    stubs.getCollections || (async () => []),
    stubs.getVariables || (async () => []),
  );
}
const F = makeF();

test('contrastRatio: branco/preto = 21', () => {
  assert.ok(Math.abs(F.contrastRatio({ r: 1, g: 1, b: 1 }, { r: 0, g: 0, b: 0 }) - 21) < 0.01);
});
test('contrastRatio: simétrico e nunca < 1', () => {
  const a = { r: 0.2, g: 0.4, b: 0.6 }, b = { r: 0.9, g: 0.9, b: 0.9 };
  assert.ok(Math.abs(F.contrastRatio(a, b) - F.contrastRatio(b, a)) < 1e-9);
  assert.ok(F.contrastRatio(a, a) >= 1 - 1e-9 && F.contrastRatio(a, a) < 1.001);
});
test('numClose: absorve a quantização float32 do Figma', () => {
  assert.equal(F.numClose(Math.fround(4 / 3), 4 / 3), true);
  assert.equal(F.numClose(Math.fround(0.05), 0.05), true);
  assert.equal(F.numClose(Math.fround(-1.2), -1.2), true);
});
test('numClose: ainda pega uma edição real', () => {
  assert.equal(F.numClose(0.06, 0.05), false);
  assert.equal(F.numClose(1.4, 4 / 3), false);
});
test('colorClose: tolera Δ≤0.01 por canal, rejeita acima', () => {
  assert.equal(F.colorClose({ r: 0.5, g: 0.5, b: 0.5 }, { r: 0.505, g: 0.5, b: 0.5 }), true);
  assert.equal(F.colorClose({ r: 0.5, g: 0.5, b: 0.5 }, { r: 0.6, g: 0.5, b: 0.5 }), false);
});

test('validDoc: aceita collections[] ou styles, rejeita o resto', () => {
  assert.equal(F.validDoc(null), false);
  assert.equal(F.validDoc({}), false);
  assert.equal(F.validDoc({ collections: [] }), true);
  assert.equal(F.validDoc({ styles: {} }), true);
});

test('normalizeParts: sem seleção = tudo ligado; false desliga só o citado', () => {
  const all = F.normalizeParts(null);
  assert.equal(all.coll('CRP/Primitives'), true);
  assert.equal(all.style('text'), true);
  const sel = F.normalizeParts({ collections: { Primitives: false }, styles: { text: false } });
  assert.equal(sel.coll('CRP/Primitives'), false); // desligado
  assert.equal(sel.coll('CRP/Brand'), true);       // não citado → ligado
  assert.equal(sel.style('text'), false);
  assert.equal(sel.style('effect'), true);
});

test('validateBundle: bundle válido não gera issues', () => {
  const doc = { collections: [{ name: 'CRP/X', modes: [{ name: 'Value' }], variables: [
    { name: 'a', type: 'COLOR', values: { Value: { color: { r: 0, g: 0.5, b: 1 } } } },
    { name: 'b', type: 'FLOAT', values: { Value: { number: 4 } } },
    { name: 'c', type: 'COLOR', values: { Value: { alias: 'a' } } },
  ] }] };
  assert.deepEqual(F.validateBundle(doc), []);
});

test('validateBundle: acusa cor fora de 0..1, alias vazio e slot sem tipo', () => {
  const doc = { collections: [{ name: 'CRP/X', modes: [], variables: [
    { name: 'a', type: 'COLOR', values: { Value: { color: { r: 2, g: 0, b: 0 } } } },
    { name: 'b', type: 'COLOR', values: { Value: { alias: '' } } },
    { name: 'c', type: 'FLOAT', values: { Value: {} } },
  ] }] };
  const issues = F.validateBundle(doc);
  assert.ok(issues.some((m) => /cor fora de 0\.\.1/.test(m)));
  assert.ok(issues.some((m) => /alias inválido/.test(m)));
  assert.ok(issues.some((m) => /sem color\/number\/alias\/string/.test(m)));
});

test('validateBundle: variável malformada e collection sem nome', () => {
  const doc = { collections: [
    { modes: [], variables: [] },                                  // collection sem name
    { name: 'CRP/Y', modes: [], variables: [{ name: 'x' }] },       // variável sem type
  ] };
  const issues = F.validateBundle(doc);
  assert.ok(issues.some((m) => /collection sem nome/.test(m)));
  assert.ok(issues.some((m) => /variável malformada/.test(m)));
});

// ---------------------------------------------------------------------------
// Lógica de SYNC (a que pode corromper um arquivo Figma) — computePlan,
// varDrift, computeChanges, resolveConcrete — testada com fake figma injetado.
// ---------------------------------------------------------------------------

// cenário base: 1 collection no Figma com 2 vars (a, velha); bundle traz a (igual) + b (nova)
const FIG_COLLS = [{ id: 'C1', name: 'CRP/Modes', modes: [{ name: 'Light', modeId: 'L' }, { name: 'Dark', modeId: 'D' }] }];
const FIG_VARS = [
  { id: 'va', name: 'a', variableCollectionId: 'C1', valuesByMode: { L: 1, D: 2 } },
  { id: 'vz', name: 'velha', variableCollectionId: 'C1', valuesByMode: { L: 9, D: 9 } },
];
const DOC = { collections: [{ name: 'CRP/Modes', modes: [{ name: 'Light' }, { name: 'Dark' }], variables: [
  { name: 'a', type: 'FLOAT', values: { Light: { number: 1 }, Dark: { number: 2 } } },
  { name: 'b', type: 'FLOAT', values: { Light: { number: 5 } } },
] }] };

test('computePlan: conta create/update e NÃO remove sem prune', async () => {
  const want = F.normalizeParts(null);
  const plan = await F.computePlan(DOC, want, false, {}, { colls: FIG_COLLS, vars: FIG_VARS });
  const p = plan.collections['CRP/Modes'];
  assert.equal(p.create, 1);            // b é nova
  assert.equal(p.update, 1);            // a já existe
  assert.deepEqual(p.removeNames, []);  // prune desligado → NUNCA remove
  assert.equal(plan.totals.remove, 0);
});

test('computePlan: prune lista SÓ o que saiu do bundle (nunca o que está nele)', async () => {
  const want = F.normalizeParts(null);
  const plan = await F.computePlan(DOC, want, true, {}, { colls: FIG_COLLS, vars: FIG_VARS });
  assert.deepEqual(plan.collections['CRP/Modes'].removeNames, ['velha']);
});

test('computePlan: collection desmarcada fica fora do plano', async () => {
  const want = F.normalizeParts({ collections: { Modes: false }, styles: {} });
  const plan = await F.computePlan(DOC, want, true, {}, { colls: FIG_COLLS, vars: FIG_VARS });
  assert.equal(plan.collections['CRP/Modes'], undefined);
  assert.equal(plan.totals.create + plan.totals.update + plan.totals.remove, 0);
});

test('computePlan: prune de styles respeita MANAGED ∪ registro (nunca toca style do usuário)', async () => {
  const Fs = makeF({
    styleIndex: async () => new Map([['Heading/H1', 's1'], ['Meu Estilo', 's2'], ['Custom Criado', 's3']]),
  });
  const doc = { collections: [], styles: { text: [{ name: 'Heading/H2' }] } };
  const want = Fs.normalizeParts(null);
  const plan = await Fs.computePlan(doc, want, true, { text: ['Custom Criado'] }, { colls: [], vars: [] });
  // Heading/H1 é MANAGED (nosso namespace) e Custom Criado está no registro → removíveis;
  // "Meu Estilo" é do USUÁRIO → intocável mesmo com prune.
  assert.deepEqual(plan.styles.text.removeNames.sort(), ['Custom Criado', 'Heading/H1']);
});

test('computePlan: avisa dependência faltante de alias e sugere a collection', async () => {
  const doc = { collections: [
    { name: 'CRP/Primitives', modes: [{ name: 'Value' }], variables: [{ name: 'blue-500', type: 'COLOR', values: { Value: { color: { r: 0, g: 0, b: 1 } } } }] },
    { name: 'CRP/Modes', modes: [{ name: 'Light' }], variables: [{ name: 'primary', type: 'COLOR', values: { Light: { alias: 'blue-500' } } }] },
  ] };
  // só Modes selecionada; o alvo do alias (blue-500) não está no Figma nem selecionado
  const want = F.normalizeParts({ collections: { Primitives: false }, styles: {} });
  const plan = await F.computePlan(doc, want, false, {}, { colls: [], vars: [] });
  assert.ok(plan.warnings.length === 1 && /blue-500/.test(plan.warnings[0]));
  assert.deepEqual(plan.depsToEnable.collections, ['Primitives']);
});

test('computePlan: alias resolvível (já no Figma) não gera aviso', async () => {
  const doc = { collections: [
    { name: 'CRP/Modes', modes: [{ name: 'Light' }], variables: [{ name: 'primary', type: 'COLOR', values: { Light: { alias: 'blue-500' } } }] },
  ] };
  const figVars = [{ id: 'v1', name: 'blue-500', variableCollectionId: 'CP', valuesByMode: {} }];
  const plan = await F.computePlan(doc, F.normalizeParts(null), false, {}, { colls: [], vars: figVars });
  assert.deepEqual(plan.warnings, []);
});

test('varDrift: em dia (número float32, alias certo) → null', async () => {
  const Fd = makeF({ varsById: { tgt1: { id: 'tgt1', name: 'blue-500' } } });
  const def = { values: { Light: { number: 4 / 3 }, Dark: { alias: 'blue-500' } } };
  const fv = { valuesByMode: { L: Math.fround(4 / 3), D: { type: 'VARIABLE_ALIAS', id: 'tgt1' } } };
  assert.equal(await Fd.varDrift(def, fv, { Light: 'L', Dark: 'D' }), null);
});

test('varDrift: detecta edição manual de número e alias trocado', async () => {
  const Fd = makeF({ varsById: { tgt1: { id: 'tgt1', name: 'red-500' } } });
  const num = await Fd.varDrift({ values: { Light: { number: 4 } } }, { valuesByMode: { L: 5 } }, { Light: 'L' });
  assert.deepEqual(num, { mode: 'Light', figma: '5', bundle: '4' });
  const ali = await Fd.varDrift({ values: { Light: { alias: 'blue-500' } } }, { valuesByMode: { L: { type: 'VARIABLE_ALIAS', id: 'tgt1' } } }, { Light: 'L' });
  assert.deepEqual(ali, { mode: 'Light', figma: '→red-500', bundle: '→blue-500' });
});

test('varDrift: alias esperado mas valor cru no Figma → diverge', async () => {
  const d = await F.varDrift({ values: { Light: { alias: 'blue-500' } } }, { valuesByMode: { L: { r: 0, g: 0, b: 1 } } }, { Light: 'L' });
  assert.deepEqual(d, { mode: 'Light', figma: 'cru', bundle: '→blue-500' });
});

test('varDrift: mode que não existe no Figma é pulado (sem falso positivo)', async () => {
  const d = await F.varDrift({ values: { Escuro: { number: 1 } } }, { valuesByMode: {} }, { Light: 'L' });
  assert.equal(d, null);
});

test('computeChanges: lista só EXISTENTES que mudam; respeita o cap', async () => {
  const doc = { collections: [{ name: 'CRP/Modes', variables: [
    { name: 'a', type: 'FLOAT', values: { Light: { number: 10 } } },  // muda (1→10)
    { name: 'velha', type: 'FLOAT', values: { Light: { number: 9 } } }, // em dia
    { name: 'b', type: 'FLOAT', values: { Light: { number: 5 } } },   // nova → não é "mudança"
  ] }] };
  const r = await F.computeChanges(doc, F.normalizeParts(null), { colls: FIG_COLLS, vars: FIG_VARS });
  assert.equal(r.changes.length, 1);
  assert.deepEqual(r.changes[0], { scope: 'Modes', name: 'a', mode: 'Light', from: '1', to: '10' });
  // cap: com 2 mudanças (a E velha) e cap=1, a 2ª vira "more" (cap=0 não existe: cap||40)
  const doc2 = { collections: [{ name: 'CRP/Modes', variables: [
    { name: 'a', type: 'FLOAT', values: { Light: { number: 10 } } },
    { name: 'velha', type: 'FLOAT', values: { Light: { number: 99 } } },
  ] }] };
  const capped = await F.computeChanges(doc2, F.normalizeParts(null), { colls: FIG_COLLS, vars: FIG_VARS }, 1);
  assert.equal(capped.changes.length, 1);
  assert.equal(capped.more, 1);
});

test('resolveConcrete: segue cadeia de alias entre collections e é imune a ciclo', async () => {
  const v1 = { id: 'v1', variableCollectionId: 'C1', valuesByMode: { L: { type: 'VARIABLE_ALIAS', id: 'v2' } } };
  const v2 = { id: 'v2', variableCollectionId: 'C2', valuesByMode: { X: { r: 0, g: 0.5, b: 1 } } };
  const Fr = makeF({ varsById: { v1, v2 } });
  assert.deepEqual(await Fr.resolveConcrete(v1, { C1: 'L', C2: 'X' }), { r: 0, g: 0.5, b: 1 });
  // ciclo: v3 → v3 (não pode travar nem estourar a pilha)
  const v3 = { id: 'v3', variableCollectionId: 'C1', valuesByMode: { L: { type: 'VARIABLE_ALIAS', id: 'v3' } } };
  const Fc = makeF({ varsById: { v3 } });
  assert.equal(await Fc.resolveConcrete(v3, { C1: 'L' }), null);
});

test('resolveConcrete: sem mode no ctx usa o primeiro mode (fallback)', async () => {
  const v = { id: 'v9', variableCollectionId: 'C9', valuesByMode: { M1: 7 } };
  assert.equal(await F.resolveConcrete(v, {}), 7);
});

test('missingModes: modo do bundle ausente no Figma é detectado', () => {
  // Figma só tem Light; bundle define Light+Dark → Dark está faltando
  assert.deepEqual(F.missingModes({ values: { Light: { number: 1 }, Dark: { number: 2 } } }, { Light: 'L' }), ['Dark']);
});
test('missingModes: todos os modos presentes → vazio', () => {
  assert.deepEqual(F.missingModes({ values: { Light: { number: 1 }, Dark: { number: 2 } } }, { Light: 'L', Dark: 'D' }), []);
  assert.deepEqual(F.missingModes({ values: { Value: { number: 1 } } }, { Value: 'V' }), []);
});
test('missingModes: collection sem modos (Figma) → todos faltam', () => {
  assert.deepEqual(F.missingModes({ values: { Light: {}, Dark: {} } }, {}).sort(), ['Dark', 'Light']);
});
test('missingModes: def sem values é seguro', () => {
  assert.deepEqual(F.missingModes({}, { Light: 'L' }), []);
  assert.deepEqual(F.missingModes(null, { Light: 'L' }), []);
});
