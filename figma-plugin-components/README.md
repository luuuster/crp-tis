# CRP DS — Components (plugin de dev)

Terceiro plugin do pipeline code→Figma (padrão do repo: **um plugin por trabalho**):

| Plugin | Faz |
|---|---|
| `figma-plugin/` (Tokens) | Variables (4 modes) + Styles ligados |
| `figma-plugin-icons/` | Components de ícones |
| **este** | **ComponentSets shadcn (Button, Input) BINDADOS nas Variables/Styles existentes** |
| `figma-plugin-screens/` | Telas montadas com as instâncias destes componentes |

## Princípios

1. **Não cria tokens — procura (por nome) e binda.** Se faltar Variable/Style, lista o que falta e
   manda rodar o plugin de Tokens primeiro. Nunca chuta.
2. **Fonte = shadcn do app** (`app/src/components/ui/{button,input}.tsx`): o kit espelha a API real
   das telas (`variant × size` do cva), classe Tailwind → Variable do contrato
   (`bg-primary` → `CRP/Modes::primary`, `border-input` → `CRP/Modes::input`,
   `min-h-[var(--button-height-md)]` → `CRP/Components::button/height/md`…).
3. **Recorte de design, não produto cartesiano:** Button = 6 variants × 3 sizes (18; `link` sem
   outras cores/estados); Input = default + invalid. `xs`/`icon-*`/estados: `--full` no export.

## Uso

```bash
npm run export:figma        # 1. variables (se ainda não rodou)
npm run export:components    # 2. gera figma-components.json
```

No Figma (arquivo que JÁ recebeu o plugin de Tokens):
1. Import plugin from manifest → este diretório.
2. Escolher `figma-components.json` → "Criar / atualizar componentes"
   → página **CRP Components** com os ComponentSets bindados (set anterior é preservado com sufixo).
3. Para montar **telas** com estes componentes, use o plugin separado **`figma-plugin-screens/`**
   (CRP DS — Screens).

## Notas

- Troca de marca/tema funciona nos componentes gerados (binds vivos nas Variables).
- `dark:bg-input/30` do Input e estados hover/active: nuances por modo/estado documentadas em
  `docs/PLANO-CODE-TO-FIGMA.md` (fora do kit estático por decisão).
- Testes da lógica pura: `figma-plugin-components/pure.test.mjs` (roda no `npm test`).
- `figma-components.json` é ARTEFATO gerado (gitignored) — não editar à mão.
