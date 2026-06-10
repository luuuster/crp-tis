// Fonte ÚNICA de marcas/temas do build — deriva tudo de tokens/$themes.json (SSOT do
// Token Studio). Antes, marca/modo/seletor viviam hardcoded em 5 scripts; adicionar uma
// marca exigia ~5 edições e esquecer uma era bug silencioso (o check.mjs valida a coerência).
//
// Convenções (as únicas coisas que NÃO estão no $themes.json):
//  - A PRIMEIRA entrada do grupo Brand é a marca default → sem [data-brand] no seletor.
//  - O modo "Light" é o default → sem classe; os demais viram classe `.{nome-minúsculo}`
//    (Dark → .dark, padrão shadcn/next-themes).
//  - O slug da marca = sufixo do set brand/* (brand/marca-b → marca-b).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function loadThemes(root = process.cwd()) {
  const $themes = JSON.parse(readFileSync(join(root, 'tokens', '$themes.json'), 'utf8'));

  const setOf = (t, prefix) => Object.keys(t.selectedTokenSets || {}).find((s) => s.startsWith(prefix));
  const brands = $themes.filter((t) => t.group === 'Brand').map((t, i) => {
    const set = setOf(t, 'brand/');
    if (!set) throw new Error(`$themes.json: Brand "${t.name}" sem set brand/* em selectedTokenSets`);
    return { name: t.name, set, slug: set.split('/')[1], isDefault: i === 0 };
  });
  const modes = $themes.filter((t) => t.group === 'Mode').map((t) => {
    const set = setOf(t, 'mode/');
    if (!set) throw new Error(`$themes.json: Mode "${t.name}" sem set mode/* em selectedTokenSets`);
    return { name: t.name, set, isDefault: t.name === 'Light' };
  });
  if (!brands.length || !modes.length) throw new Error('$themes.json: grupos Brand/Mode vazios');

  // brand × mode → tema completo (mesmo produto do permutateThemes do sd-transforms)
  const themes = [];
  for (const b of brands)
    for (const m of modes) {
      const brandSel = b.isDefault ? '' : `[data-brand="${b.slug}"]`;
      const modeSel = m.isDefault ? '' : `.${m.name.toLowerCase()}`;
      themes.push({
        name: `${b.name}-${m.name}`,
        brand: b.name,
        mode: m.name,
        brandSet: b.set,
        modeSet: m.set,
        selector: brandSel + modeSel || ':root',
      });
    }

  return {
    $themes,
    brands,
    modes,
    themes,
    // { 'CRP-Light': ':root', 'CRP-Dark': '.dark', ... }
    selectorsByTheme: Object.fromEntries(themes.map((t) => [t.name, t.selector])),
  };
}
