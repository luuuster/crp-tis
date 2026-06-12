// Export: page-spec autorado -> figma-plugin-screens/figma-screens.json
//
// v1: telas como COMPOSIÇÃO de instâncias dos ComponentSets (aba Componentes) + primitivos
// simples (textos com Text Style, "field" = label + caixa bindada em border/input). A tela no
// Figma fica EDITÁVEL e em paridade por construção (mesmos componentes, mesmas Variables).
// v2 (planejada): gerador assistido por DOM (Playwright) — ver docs/PLANO-CODE-TO-FIGMA.md.
//
// Pré-requisito: export:figma (valida refs) e export:components (instâncias têm de existir no spec).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const FV = JSON.parse(readFileSync(join(ROOT, 'figma-plugin', 'figma-variables.json'), 'utf8'));
const COMPS_PATH = join(ROOT, 'figma-plugin-components', 'figma-components.json');
if (!existsSync(COMPS_PATH)) { console.error('❌ rode `npm run export:components` antes.'); process.exit(1); }
const COMPS = JSON.parse(readFileSync(COMPS_PATH, 'utf8'));
const OUT = join(ROOT, 'figma-plugin-screens', 'figma-screens.json');

const varIndex = new Set(); for (const c of FV.collections) for (const v of c.variables) varIndex.add(c.name + '::' + v.name);
const textStyles = new Set(FV.styles.text.map((s) => s.name));
const M = 'CRP/Modes', C = 'CRP/Components';
const ref = (coll, name) => ({ coll, name });

// ---- Tela: Login (espelha app/src/pages/LoginPage.tsx — card central, sem o painel de marca) ----
const login = {
  name: 'Login',
  frame: { width: 480, paddingX: 48, paddingY: 56, gap: 24, fillVar: ref(M, 'background'), radiusVar: ref(C, 'button/radius') },
  items: [
    { type: 'text', style: 'Heading/H3', text: 'Entrar na sua conta', fillVar: ref(M, 'foreground') },
    { type: 'text', style: 'Body/Small', text: 'Bem-vindo de volta! Informe suas credenciais para continuar.', fillVar: ref(M, 'muted-foreground') },
    { type: 'field', label: 'E-mail', placeholder: 'voce@empresa.com' },
    { type: 'field', label: 'Senha', placeholder: '••••••••' },
    { type: 'instance', component: 'Button', props: { variant: 'default', size: 'default', state: 'default' }, text: 'Entrar', stretch: true },
    { type: 'row-center', items: [
      { type: 'text', style: 'Body/Small', text: 'Não tem uma conta?', fillVar: ref(M, 'muted-foreground') },
      { type: 'instance', component: 'Button', props: { variant: 'link', size: 'sm', state: 'default' }, text: 'Criar conta' },
    ] },
  ],
  // "field" = label + INSTÂNCIA do shadcn Input (o plugin instancia; placeholder vira override)
  fieldAnatomy: { labelStyle: 'Label/Small', labelFill: ref(M, 'foreground') },
};

// ---- validação fail-loud ----
const missing = [];
const ck = (r) => { if (r && !varIndex.has(r.coll + '::' + r.name)) missing.push(r.coll + '::' + r.name); };
const ckStyle = (s) => { if (s && !textStyles.has(s)) missing.push('TextStyle::' + s); };
const variantKeys = new Set();
const compAxes = new Map(COMPS.components.map((c) => [c.name, c.axesOrder]));
const variantKey = (name, props) => name + '::' + JSON.stringify(Object.fromEntries((compAxes.get(name) || Object.keys(props)).map((k) => [k, props[k]])));
for (const c of COMPS.components) for (const v of c.variants) variantKeys.add(variantKey(c.name, v.props));
let usesField = false;
(function walk(items) {
  for (const it of items) {
    if (it.type === 'text') { ckStyle(it.style); ck(it.fillVar); }
    if (it.type === 'field') usesField = true;
    if (it.type === 'instance' && !variantKeys.has(variantKey(it.component, it.props))) missing.push('Variant::' + variantKey(it.component, it.props));
    if (it.items) walk(it.items);
  }
})(login.items);
ck(login.frame.fillVar); ckStyle(login.fieldAnatomy.labelStyle); ck(login.fieldAnatomy.labelFill);
if (usesField && !COMPS.components.some((c) => c.name === 'Input')) missing.push('Component::Input (field precisa dele)');
if (missing.length) { console.error('❌ export-screens: refs ausentes:\n  - ' + [...new Set(missing)].join('\n  - ')); process.exit(1); }

writeFileSync(OUT, JSON.stringify({ $schema: 'crp-screens-figma/1', generatedBy: 'build/export-screens.mjs', screens: [login] }, null, 2));
console.log(`✅ figma-screens.json — ${1} tela (Login) · refs validadas`);
