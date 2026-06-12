# CRP DS — Screens (plugin de dev)

Quarto plugin do pipeline code→Figma (padrão do repo: **um plugin por trabalho**). Monta **telas**
instanciando os ComponentSets que o plugin de Components já criou.

| Plugin | Faz |
|---|---|
| `figma-plugin/` (Tokens) | Variables (4 modes) + Styles ligados |
| `figma-plugin-icons/` | Components de ícones |
| `figma-plugin-components/` | ComponentSets shadcn (Button, Input) bindados nas Variables/Styles |
| **este** | **TELAS montadas com as instâncias desses ComponentSets + textos/fields bindados** |

## Princípios

1. **Não cria tokens nem componentes — procura (por nome), instancia e binda.** Se faltar
   Variable/Style/ComponentSet, lista o que falta e manda rodar o plugin certo primeiro. Nunca chuta.
2. **Carrega só 1 arquivo** (`figma-screens.json`). A ordem dos eixos de cada variante
   (`variant=default, size=default`) é **derivada do próprio ComponentSet** no arquivo — sem precisar
   do `figma-components.json` aberto.
3. **Paridade por construção:** as telas usam as MESMAS instâncias/Variables; trocar o modo das
   Variables no frame troca marca/tema (4 temas) sem reconstruir.

## Uso

```bash
npm run export:figma        # 1. variables (se ainda não rodou)
npm run export:screens      # 2. gera figma-components.json (componentes) + figma-screens.json (este)
```

No Figma (arquivo que já recebeu os plugins de **Tokens** e **Components**):
1. Import plugin from manifest → este diretório.
2. Escolher `figma-screens.json` → **Criar telas** → página **CRP Screens** com a tela de Login
   montada de INSTÂNCIAS. Frames têm sufixo de data — nada é sobrescrito.

## Notas

- Pré-requisito de runtime: os ComponentSets têm de existir na página **CRP Components** (rode o
  plugin **CRP DS — Components** antes). O plugin acusa se faltar.
- Testes da lógica pura: `figma-plugin-screens/pure.test.mjs` (roda no `npm test`).
- `figma-screens.json` é ARTEFATO gerado (gitignored) — não editar à mão.
