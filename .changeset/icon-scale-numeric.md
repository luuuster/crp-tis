---
"@crp/design-tokens": minor
---

Ícones: migração da escala de tamanho de **t-shirt** para **numérica por px** (`icon/<px>`) + 4 novos tamanhos.

**Motivo:** `icon-16` é inequívoco (a escala t-shirt exigia decorar `sm=16`) e a UI do app já usa 14/18/28, que não existiam como token.

**Fonte (`build/seed-palette.mjs`) e primitivos (`tokens/core/icon.json`):** o objeto `icon` passa a usar chaves numéricas por px. Renomeações (valor inalterado): `icon.xs`→`icon.12`, `icon.sm`→`icon.16`, `icon.md`→`icon.20`, `icon.lg`→`icon.24`, `icon.xl`→`icon.32`, `icon.2xl`→`icon.40`, `icon.3xl`→`icon.48`. **Novos:** `icon.8` (8px), `icon.14` (14px), `icon.18` (18px), `icon.28` (28px), `icon.36` (36px). Gera `--icon-8 … --icon-48` no CSS e `icon/8 … icon/48` nas Figma Variables.

**Refs de componente (`tokens/components/button.json`):** `button-icon-size` atualiza os refs para os novos nomes — valores finais **idênticos**: `xs` → `{icon.12}` (12px), `sm/md/lg` → `{icon.16}` (16px).

**Sem breaking change para consumidores:** o app usa `size-N` do Tailwind (não referencia `--icon-*` por nome) e o plugin de ícones casa o primitivo **por valor** (`icon/16`=16 continua batendo). Consumidores internos por nome (preview, testes e docs do plugin/React) foram atualizados no mesmo trabalho.

**Materialização Figma:** ao re-materializar, as Variables `icon/*` são renomeadas (t-shirt→px) e 4 são criadas (`icon/8·14·18·28`). Sistema auto-curável: `button-icon-size` re-materializa apontando p/ `icon/16`; o plugin de ícones re-casa por valor. Preferir **rename in-place** (preserva o ID e os binds existentes); mesmo em delete+create os binds se re-resolvem por valor.
