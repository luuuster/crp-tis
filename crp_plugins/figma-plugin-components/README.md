# CRP DS — Components (plugin de dev)

Terceiro plugin do pipeline code→Figma (padrão do repo: **um plugin por trabalho**):

| Plugin | Faz |
|---|---|
| `crp_plugins/figma-plugin/` (Tokens) | Variables (4 modes) + Styles ligados |
| `crp_plugins/figma-plugin-icons/` | Components de ícones |
| **este** | **ComponentSets shadcn (Button, Input) BINDADOS nas Variables/Styles existentes** |
| `crp_plugins/figma-plugin-screens/` | Telas montadas com as instâncias destes componentes |

## Princípios

1. **Não cria tokens — procura (por nome) e binda.** Se faltar Variable/Style, lista o que falta e
   manda rodar o plugin de Tokens primeiro. Nunca chuta.
2. **Fonte = shadcn do app** (`app/src/components/ui/{button,input}.tsx`): o kit espelha a API real
   das telas (`variant × size` do cva), classe Tailwind → Variable do contrato
   (`bg-primary` → `CRP/Modes::primary`, `border-input` → `CRP/Modes::input`,
   `min-h-[var(--button-height-md)]` → `CRP/Components::button/height/md`…).
3. **Matriz CARTESIANA completa (espelha o `atom/button` vivo):** Button = variant (10) × size (8:
   default/xs/sm/lg + icon/icon-xs/icon-sm/icon-lg) × state (4: default/hover/focus/disabled) = **320**;
   Input = default + invalid. Sem recorte — toda combinação `variant × size` do cva é prop React válida.

## Uso

```bash
npm run export:figma        # 1. variables (se ainda não rodou)
npm run export:components    # 2. gera figma-components.json
```

No Figma (arquivo que JÁ recebeu o plugin de Tokens):
1. Import plugin from manifest → este diretório.
2. Escolher `figma-components.json` → "Criar / atualizar componentes"
   → página **CRP Components** com os ComponentSets bindados (set anterior é preservado com sufixo).
3. Para montar **telas** com estes componentes, use o plugin separado **`crp_plugins/figma-plugin-screens/`**
   (CRP DS — Screens).

## Notas

- Troca de marca/tema funciona nos componentes gerados (binds vivos nas Variables).
- `dark:bg-input/30` do Input: nuances por modo documentadas em `docs/PLANO-CODE-TO-FIGMA.md`.
- Testes da lógica pura: `crp_plugins/figma-plugin-components/pure.test.mjs` (roda no `npm test`).
- `figma-components.json` é ARTEFATO gerado (gitignored) — não editar à mão.

## TODO de render (gap plugin × atom/button vivo)

O `export-components.mjs` já emite o spec FIEL (320, só-ícone com `layout.iconOnly`/`square` e
`fallbackPx.icon` = 12/16/20/24, `Label/Small` 14px). O `atom/button` vivo no Figma foi construído
direto via API (`use_figma`), não por este plugin — então, ao materializar, o `code.js` ainda não
reproduz 100% o vivo. Pendências para reproduzir de ponta a ponta:

- **Só-ícone**: `makeVariant` não trata `layout.iconOnly`/`square` (caixa não vira quadrada) e
  `makeIcon` chumba o ícone em **16px** — ignora `fallbackPx.icon` (12/20/24). Falta size-aware + quadrado.
- **Loading**: o vivo tem a propriedade booleana `Loading`; o plugin não cria essa BOOLEAN (loading
  saiu do eixo de estado — não é mais variante).
- **Nomes de propriedade / set**: o plugin cria `Texto`/`Mostrar ícone esquerda` e set `CRP Components/Button`;
  o vivo usa `Label`/`Ícone esquerda ⇆`/`Ícone ⇆` e `atom/button`. Re-materializar cria um set NOVO
  (preserva o antigo com sufixo) — **não** atualiza o vivo, e as telas seguem no set atual.
